import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { HandoverLog } from './handover-log.entity';
import { Lead } from './lead.entity';
import { Opportunity } from './opportunity.entity';
import { Case } from '../case/case.entity';
import { User } from '../user/user.entity';
import { HandoverType, HandoverStatus } from '../types';

@Injectable()
export class HandoverService {
  constructor(
    @InjectRepository(HandoverLog)
    private handoverLogRepository: Repository<HandoverLog>,
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    @InjectRepository(Opportunity)
    private opportunityRepository: Repository<Opportunity>,
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  // 发起交接
  async initiateHandover(
    fromUserId: string,
    toUserId: string,
    handoverType: HandoverType,
    leadIds: string[] = [],
    opportunityIds: string[] = [],
    caseIds: string[] = [],
    handoverNote?: string,
  ): Promise<HandoverLog> {
    // 验证交接人和接收人
    const fromUser = await this.userRepository.findOne({ where: { id: fromUserId } });
    const toUser = await this.userRepository.findOne({ where: { id: toUserId } });

    if (!fromUser) {
      throw new NotFoundException('交接人不存在');
    }
    if (!toUser) {
      throw new NotFoundException('接收人不存在');
    }
    if (fromUserId === toUserId) {
      throw new ForbiddenException('不能将资产交接给自己');
    }

    // 创建交接记录
    const handoverLog = this.handoverLogRepository.create({
      from_user_id: fromUserId,
      to_user_id: toUserId,
      handover_type: handoverType,
      lead_ids: leadIds,
      opportunity_ids: opportunityIds,
      case_ids: caseIds,
      handover_note: handoverNote,
      status: HandoverStatus.PENDING,
    });

    return await this.handoverLogRepository.save(handoverLog);
  }

  // 确认交接
  async confirmHandover(handoverId: string, currentUserId: string): Promise<HandoverLog> {
    const handover = await this.handoverLogRepository.findOne({
      where: { id: handoverId },
      relations: { from_user: true, to_user: true },
    });

    if (!handover) {
      throw new NotFoundException('交接记录不存在');
    }

    // 验证是否是接收人
    if (handover.to_user_id !== currentUserId) {
      throw new ForbiddenException('只有接收人可以确认交接');
    }

    if (handover.status !== HandoverStatus.PENDING) {
      throw new ForbiddenException('该交接已经处理');
    }

    // 使用事务更新数据
    await this.dataSource.transaction(async (manager) => {
      // 更新线索归属
      if (handover.lead_ids && handover.lead_ids.length > 0) {
        await manager.update(Lead, handover.lead_ids, {
          assign_sales_id: handover.to_user_id,
        });
      }

      // 更新商机归属
      if (handover.opportunity_ids && handover.opportunity_ids.length > 0) {
        await manager.update(Opportunity, handover.opportunity_ids, {
          negotiator_id: handover.to_user_id,
        });
      }

      // 更新案件归属
      if (handover.case_ids && handover.case_ids.length > 0) {
        await manager.update(Case, handover.case_ids, {
          assignee_lawyer_id: handover.to_user_id,
        });
      }

      // 更新交接记录状态
      handover.status = HandoverStatus.COMPLETED;
      handover.completed_at = new Date();
      await manager.save(handover);
    });

    return handover;
  }

  // 拒绝交接
  async rejectHandover(handoverId: string, currentUserId: string, reason?: string): Promise<HandoverLog> {
    const handover = await this.handoverLogRepository.findOne({
      where: { id: handoverId },
    });

    if (!handover) {
      throw new NotFoundException('交接记录不存在');
    }

    // 验证是否是接收人
    if (handover.to_user_id !== currentUserId) {
      throw new ForbiddenException('只有接收人可以拒绝交接');
    }

    if (handover.status !== HandoverStatus.PENDING) {
      throw new ForbiddenException('该交接已经处理');
    }

    handover.status = HandoverStatus.REJECTED;
    if (reason) {
      handover.handover_note = (handover.handover_note || '') + `\n拒绝原因：${reason}`;
    }

    return await this.handoverLogRepository.save(handover);
  }

  // 查询交接记录列表
  async findAll(organizationId?: string): Promise<HandoverLog[]> {
    const query = this.handoverLogRepository
      .createQueryBuilder('handover')
      .leftJoinAndSelect('handover.from_user', 'from_user')
      .leftJoinAndSelect('handover.to_user', 'to_user')
      .orderBy('handover.created_at', 'DESC');

    if (organizationId) {
      query
        .andWhere('from_user.organization_id = :orgId', { orgId: organizationId })
        .orWhere('to_user.organization_id = :orgId', { orgId: organizationId });
    }

    return await query.getMany();
  }

  // 查询单个交接记录
  async findOne(id: string): Promise<HandoverLog> {
    const handover = await this.handoverLogRepository.findOne({
      where: { id },
      relations: { from_user: true, to_user: true },
    });

    if (!handover) {
      throw new NotFoundException('交接记录不存在');
    }

    return handover;
  }

  // 获取用户可交接的资产统计
  async getUserAssets(userId: string): Promise<any> {
    const [leads, opportunities, cases] = await Promise.all([
      this.leadRepository.find({
        where: { assign_sales_id: userId },
        select: { id: true, contact_name: true, phone: true, status: true, created_at: true },
      }),
      this.opportunityRepository.find({
        where: { negotiator_id: userId },
        select: { id: true, stage: true, quote_amount: true, actual_amount: true, status: true, created_at: true },
      }),
      this.caseRepository.find({
        where: { assignee_lawyer_id: userId },
        select: { id: true, case_type: true, status: true, client_name: true, fee_amount: true, created_at: true },
      }),
    ]);

    return {
      leads,
      opportunities,
      cases,
      stats: {
        leadCount: leads.length,
        opportunityCount: opportunities.length,
        caseCount: cases.length,
      },
    };
  }

  // 批量移交（管理员直接执行，无需接收人确认）
  async batchTransfer(
    fromUserId: string,
    toUserId: string,
    handoverType: HandoverType,
    leadIds: string[] = [],
    opportunityIds: string[] = [],
    caseIds: string[] = [],
    handoverNote?: string,
  ): Promise<HandoverLog> {
    // 验证用户
    const fromUser = await this.userRepository.findOne({ where: { id: fromUserId } });
    const toUser = await this.userRepository.findOne({ where: { id: toUserId } });

    if (!fromUser) {
      throw new NotFoundException('交接人不存在');
    }
    if (!toUser) {
      throw new NotFoundException('接收人不存在');
    }

    // 使用事务更新
    const handoverLog = await this.dataSource.transaction(async (manager) => {
      // 更新线索归属
      if (leadIds.length > 0) {
        await manager.update(Lead, leadIds, { assign_sales_id: toUserId });
      }

      // 更新商机归属
      if (opportunityIds.length > 0) {
        await manager.update(Opportunity, opportunityIds, { negotiator_id: toUserId });
      }

      // 更新案件归属
      if (caseIds.length > 0) {
        await manager.update(Case, caseIds, { assignee_lawyer_id: toUserId });
      }

      // 创建交接记录
      const log = manager.create(HandoverLog, {
        from_user_id: fromUserId,
        to_user_id: toUserId,
        handover_type: handoverType,
        lead_ids: leadIds,
        opportunity_ids: opportunityIds,
        case_ids: caseIds,
        handover_note: handoverNote,
        status: HandoverStatus.COMPLETED,
        completed_at: new Date(),
      });

      return await manager.save(log);
    });

    return handoverLog;
  }
}