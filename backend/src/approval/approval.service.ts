import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { ApprovalRequest } from './approval-request.entity';
import { ApprovalStep } from './approval-step.entity';
import { ApprovalFlow } from './approval-flow.entity';

@Injectable()
export class ApprovalService {
  constructor(
    @InjectRepository(ApprovalRequest)
    private requestRepository: Repository<ApprovalRequest>,
    @InjectRepository(ApprovalStep)
    private stepRepository: Repository<ApprovalStep>,
    @InjectRepository(ApprovalFlow)
    private flowRepository: Repository<ApprovalFlow>,
    private dataSource: DataSource,
  ) {}

  // 发起审批：创建申请并初始化步骤记录
  async create(
    userId: string,
    data: {
      title: string;
      type: string;
      content?: any;
      target_type?: string;
      target_id?: string;
      approvers: string[];
      organization_id?: string;
    },
  ): Promise<ApprovalRequest> {
    if (!data.approvers || data.approvers.length === 0) {
      throw new BadRequestException('审批人不能为空');
    }
    // 创建审批申请
    const request = this.requestRepository.create({
      title: data.title,
      type: data.type,
      applicant_id: userId,
      target_type: data.target_type || null,
      target_id: data.target_id || null,
      content: data.content || null,
      status: 'pending',
      current_step: 0,
      organization_id: data.organization_id || null,
    });
    const saved = await this.requestRepository.save(request);
    // 初始化审批步骤记录
    const steps = data.approvers.map((approverId, index) =>
      this.stepRepository.create({
        request_id: saved.id,
        step_order: index,
        approver_id: approverId,
        result: 'pending',
      }),
    );
    await this.stepRepository.save(steps);
    return saved;
  }

  // 审批通过：当前步骤通过，推进到下一步或完成
  async approve(requestId: string, userId: string, comment?: string): Promise<ApprovalRequest> {
    return await this.dataSource.transaction(async (manager) => {
      const request = await manager.findOne(ApprovalRequest, { where: { id: requestId } });
      if (!request) {
        throw new NotFoundException('审批申请不存在');
      }
      if (request.status !== 'pending') {
        throw new BadRequestException('当前申请不可审批');
      }
      // 查找当前待处理步骤
      const currentStep = await manager.findOne(ApprovalStep, {
        where: { request_id: requestId, step_order: request.current_step, result: 'pending' },
      });
      if (!currentStep) {
        throw new BadRequestException('当前无待处理步骤');
      }
      if (currentStep.approver_id !== userId) {
        throw new ForbiddenException('您无权审批此步骤');
      }
      // 更新当前步骤为已通过
      currentStep.result = 'approved';
      currentStep.comment = comment || null;
      currentStep.approve_time = new Date();
      await manager.save(ApprovalStep, currentStep);
      // 判断是否所有步骤完成
      const totalSteps = await manager.count(ApprovalStep, { where: { request_id: requestId } });
      if (request.current_step + 1 >= totalSteps) {
        request.status = 'approved';
      } else {
        request.current_step = request.current_step + 1;
      }
      return manager.save(ApprovalRequest, request);
    });
  }

  // 驳回：整单驳回
  async reject(requestId: string, userId: string, comment?: string): Promise<ApprovalRequest> {
    return await this.dataSource.transaction(async (manager) => {
      const request = await manager.findOne(ApprovalRequest, { where: { id: requestId } });
      if (!request) {
        throw new NotFoundException('审批申请不存在');
      }
      if (request.status !== 'pending') {
        throw new BadRequestException('当前申请不可审批');
      }
      const currentStep = await manager.findOne(ApprovalStep, {
        where: { request_id: requestId, step_order: request.current_step, result: 'pending' },
      });
      if (!currentStep) {
        throw new BadRequestException('当前无待处理步骤');
      }
      if (currentStep.approver_id !== userId) {
        throw new ForbiddenException('您无权审批此步骤');
      }
      currentStep.result = 'rejected';
      currentStep.comment = comment || null;
      currentStep.approve_time = new Date();
      await manager.save(ApprovalStep, currentStep);
      request.status = 'rejected';
      return manager.save(ApprovalRequest, request);
    });
  }

  // 撤销：仅发起人可撤销
  async cancel(requestId: string, userId: string): Promise<ApprovalRequest> {
    const request = await this.requestRepository.findOne({ where: { id: requestId } });
    if (!request) {
      throw new NotFoundException('审批申请不存在');
    }
    if (request.applicant_id !== userId) {
      throw new ForbiddenException('仅发起人可撤销申请');
    }
    if (request.status !== 'pending') {
      throw new BadRequestException('当前申请不可撤销');
    }
    request.status = 'cancelled';
    return this.requestRepository.save(request);
  }

  // 查询我处理的：当前需我审批的
  async findPending(userId: string, type?: string, status?: string): Promise<any[]> {
    const qb = this.stepRepository
      .createQueryBuilder('step')
      .leftJoinAndSelect('step.request', 'request')
      .leftJoinAndSelect('request.applicant', 'applicant')
      .leftJoinAndSelect('step.approver', 'approver')
      .where('step.approver_id = :userId', { userId })
      .andWhere('step.result = :result', { result: 'pending' })
      .andWhere('request.status = :reqStatus', { reqStatus: 'pending' })
      .andWhere('step.step_order = request.current_step');
    if (type) {
      qb.andWhere('request.type = :type', { type });
    }
    if (status) {
      qb.andWhere('request.status = :status', { status });
    }
    qb.orderBy('request.updated_at', 'DESC');
    return qb.getMany();
  }

  // 查询我已审批的
  async findProcessed(userId: string, type?: string, status?: string): Promise<any[]> {
    const qb = this.stepRepository
      .createQueryBuilder('step')
      .leftJoinAndSelect('step.request', 'request')
      .leftJoinAndSelect('request.applicant', 'applicant')
      .where('step.approver_id = :userId', { userId })
      .andWhere('step.result IN (:...results)', { results: ['approved', 'rejected'] });
    if (type) {
      qb.andWhere('request.type = :type', { type });
    }
    if (status) {
      qb.andWhere('request.status = :status', { status });
    }
    qb.orderBy('step.approve_time', 'DESC');
    return qb.getMany();
  }

  // 查询我发起的
  async findMine(userId: string, type?: string, status?: string): Promise<any[]> {
    const qb = this.requestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.applicant', 'applicant')
      .leftJoinAndSelect('request.steps', 'steps')
      .leftJoinAndSelect('steps.approver', 'stepApprover')
      .where('request.applicant_id = :userId', { userId });
    if (type) {
      qb.andWhere('request.type = :type', { type });
    }
    if (status) {
      qb.andWhere('request.status = :status', { status });
    }
    qb.orderBy('request.updated_at', 'DESC');
    return qb.getMany();
  }

  // 统一查询入口：根据 mode 分发
  async find(userId: string, mode: string, type?: string, status?: string): Promise<any[]> {
    switch (mode) {
      case 'processed':
        return this.findProcessed(userId, type, status);
      case 'mine':
        return this.findMine(userId, type, status);
      case 'pending':
      default:
        return this.findPending(userId, type, status);
    }
  }

  // 退回上一步：current_step 减1，状态保持 pending，在当前步骤审批意见中追加退回标记
  async returnBack(id: string, userId: string, comment: string): Promise<ApprovalRequest> {
    return await this.dataSource.transaction(async (manager) => {
      const request = await manager.findOne(ApprovalRequest, { where: { id } });
      if (!request) {
        throw new NotFoundException('审批申请不存在');
      }
      if (request.status !== 'pending') {
        throw new BadRequestException('当前申请不可退回');
      }
      if (request.current_step <= 1) {
        throw new BadRequestException('已是第一步，无法退回');
      }
      // 找到当前步骤记录，在审批意见中追加退回标记
      const currentStep = await manager.findOne(ApprovalStep, {
        where: { request_id: id, step_order: request.current_step, result: 'pending' },
      });
      if (currentStep) {
        const existingComment = currentStep.comment || '';
        currentStep.comment = existingComment
          ? `${existingComment}\n【退回】${comment}`
          : `【退回】${comment}`;
        await manager.save(ApprovalStep, currentStep);
      }
      // 退回上一步：current_step 减1，状态保持 pending
      request.current_step = request.current_step - 1;
      return manager.save(ApprovalRequest, request);
    });
  }

  // 批量撤销：只更新 status 为 pending 的记录，在当前步骤审批意见中追加撤销标记，使用事务保证一致性
  async batchCancel(ids: string[], userId: string): Promise<number> {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('未选择撤销记录');
    }
    // 查询待撤销的记录（仅 status 为 pending 的）
    const requests = await this.requestRepository.find({
      where: { id: In(ids), status: 'pending' },
    });
    if (requests.length === 0) {
      return 0;
    }
    let affected = 0;
    // 在事务内逐条更新当前步骤审批意见并最终批量更新状态
    await this.dataSource.transaction(async (manager) => {
      for (const req of requests) {
        const currentStep = await manager.findOne(ApprovalStep, {
          where: { request_id: req.id, step_order: req.current_step },
        });
        if (currentStep) {
          const existingComment = currentStep.comment || '';
          currentStep.comment = existingComment
            ? `${existingComment}\n【撤销】`
            : `【撤销】`;
          await manager.save(ApprovalStep, currentStep);
        }
      }
      // 批量更新状态为 cancelled
      const result = await manager.update(
        ApprovalRequest,
        { id: In(ids), status: 'pending' },
        { status: 'cancelled' },
      );
      affected = result.affected || 0;
    });
    return affected;
  }

  // 批量审批通过：遍历 ids 逐个执行审批，返回每条处理结果，使用事务保证一致性
  async batchApprove(ids: string[], userId: string, comment: string): Promise<any[]> {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('未选择审批记录');
    }
    const results: any[] = [];
    // 在事务内遍历 ids 逐个执行审批，业务错误记录为失败但不中断，未捕获异常将整体回滚
    await this.dataSource.transaction(async (manager) => {
      for (const id of ids) {
        try {
          const data = await this.approveWithManager(manager, id, userId, comment);
          results.push({ id, success: true, data });
        } catch (error: any) {
          results.push({ id, success: false, message: error?.message || '审批失败' });
        }
      }
    });
    return results;
  }

  // 使用指定 manager 执行审批通过逻辑（供批量审批在事务内调用）
  private async approveWithManager(
    manager: any,
    requestId: string,
    userId: string,
    comment?: string,
  ): Promise<ApprovalRequest> {
    const request = await manager.findOne(ApprovalRequest, { where: { id: requestId } });
    if (!request) {
      throw new NotFoundException('审批申请不存在');
    }
    if (request.status !== 'pending') {
      throw new BadRequestException('当前申请不可审批');
    }
    // 查找当前待处理步骤
    const currentStep = await manager.findOne(ApprovalStep, {
      where: { request_id: requestId, step_order: request.current_step, result: 'pending' },
    });
    if (!currentStep) {
      throw new BadRequestException('当前无待处理步骤');
    }
    if (currentStep.approver_id !== userId) {
      throw new ForbiddenException('您无权审批此步骤');
    }
    // 更新当前步骤为已通过
    currentStep.result = 'approved';
    currentStep.comment = comment || null;
    currentStep.approve_time = new Date();
    await manager.save(ApprovalStep, currentStep);
    // 判断是否所有步骤完成
    const totalSteps = await manager.count(ApprovalStep, { where: { request_id: requestId } });
    if (request.current_step + 1 >= totalSteps) {
      request.status = 'approved';
    } else {
      request.current_step = request.current_step + 1;
    }
    return manager.save(ApprovalRequest, request);
  }

  // 转批：将当前步骤的审批权转交给其他人
  async transfer(id: string, fromUserId: string, toUserId: string, comment: string): Promise<ApprovalRequest> {
    return await this.dataSource.transaction(async (manager) => {
      const request = await manager.findOne(ApprovalRequest, { where: { id } });
      if (!request) throw new NotFoundException('审批申请不存在');
      if (request.status !== 'pending') throw new BadRequestException('仅待审批状态可转批');

      // 查找当前步骤
      const currentStep = await manager.findOne(ApprovalStep, {
        where: { request_id: id, step_order: request.current_step },
      });
      if (!currentStep) throw new NotFoundException('当前审批步骤不存在');
      if (currentStep.approver_id !== fromUserId) throw new BadRequestException('仅当前审批人可转批');

      // 更新审批人为转交目标
      currentStep.approver_id = toUserId;
      currentStep.comment = `【转批】${comment}`;
      await manager.save(ApprovalStep, currentStep);

      return manager.findOne(ApprovalRequest, { where: { id } });
    });
  }
}
