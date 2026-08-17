import { Injectable, ForbiddenException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { InviteTask } from './invite-task.entity';
import { Lead } from './lead.entity';
import { User } from '../user/user.entity';
import { InviteMethod, InviteTaskStatus, InviteResult, LeadStatus, UserRole } from '../types';
import { NotificationService } from '../user/notification.service';
import { Express } from 'express';
// Phase4 M9: 邀约录音上传后自动质检，注入合规服务（forwardRef 防止循环依赖）
import { ComplianceService } from '../compliance/compliance.service';
// 13.8 缺口3: 邀约到所自动预建商机
import { OpportunityService } from './opportunity.service';

@Injectable()
export class InviteTaskService {
  constructor(
    @InjectRepository(InviteTask)
    private inviteTaskRepository: Repository<InviteTask>,
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private notificationService: NotificationService,
    // Phase4 M9: 注入合规服务用于邀约录音自动质检
    @Inject(forwardRef(() => ComplianceService))
    private complianceService: ComplianceService,
    // 13.8 缺口3: 注入商机服务，邀约"已到所"时自动预建商机草稿
    private opportunityService: OpportunityService,
  ) {}

  // 创建邀约记录
  async createInviteTask(
    userId: string,
    leadId: string,
    inviteMethod: InviteMethod,
    scheduledTime?: Date,
    result?: InviteResult,
    resultNote?: string,
    recordingUrl?: string,
    callDuration?: number,
  ) {
    // 查询线索
    const lead = await this.leadRepository.findOne({ where: { id: leadId } });
    if (!lead) {
      throw new NotFoundException('线索不存在');
    }

    // 检查权限：只有邀约岗和管理员可以创建邀约任务
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (user.role !== UserRole.SALES && user.role !== UserRole.ORG_ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('只有邀约岗和管理员可以创建邀约任务');
    }

    // 创建邀约任务
    const inviteTask = this.inviteTaskRepository.create({
      lead_id: leadId,
      inviter_id: userId,
      invite_method: inviteMethod,
      scheduled_time: scheduledTime,
      status: result === InviteResult.SUCCESS ? InviteTaskStatus.INVITED : InviteTaskStatus.PENDING,
      result,
      result_note: resultNote,
      recording_url: recordingUrl,
      call_duration: callDuration,
    });

    const savedTask = await this.inviteTaskRepository.save(inviteTask);

    // 更新线索状态
    if (result === InviteResult.SUCCESS) {
      lead.status = LeadStatus.INVITING;
      lead.follow_up_time = new Date();
      await this.leadRepository.save(lead);
    } else if (result === InviteResult.INVALID) {
      lead.status = LeadStatus.LOST;
      await this.leadRepository.save(lead);
    }

    // InviteTask 实体使用 inviter_id 作为接收人字段，使用 lead_id 标识线索
    await this.notificationService.notify({
      receiver_id: savedTask.inviter_id || '',
      title: '新邀约任务',
      content: `您有新的邀约任务：${savedTask.lead_id}`,
      type: 'invite_task',
      level: 'normal',
      related_type: 'InviteTask',
      related_id: savedTask.id,
    });
    return savedTask;
  }

  // 获取我的任务列表
  async getMyTasks(userId: string, status?: InviteTaskStatus) {
    const queryBuilder = this.inviteTaskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.lead', 'lead')
      .where('task.inviter_id = :userId', { userId });

    if (status) {
      queryBuilder.andWhere('task.status = :status', { status });
    }

    queryBuilder.orderBy('task.updated_at', 'DESC');

    return queryBuilder.getMany();
  }

  // 获取待跟进线索（已分配但未创建邀约任务的线索）
  async getPendingLeads(userId: string) {
    const queryBuilder = this.leadRepository
      .createQueryBuilder('lead')
      .leftJoinAndSelect('lead.assign_sales', 'assign_sales')
      .where('lead.assign_sales_id = :userId', { userId })
      .andWhere('lead.status = :status', { status: LeadStatus.PENDING_FOLLOW })
      .andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('invite_tasks.lead_id')
          .from(InviteTask, 'invite_tasks')
          .where('invite_tasks.inviter_id = :userId')
          .getQuery();
        return `lead.id NOT IN ${subQuery}`;
      })
      .setParameter('userId', userId)
      .orderBy('lead.updated_at', 'DESC');

    return queryBuilder.getMany();
  }

  // 获取今日任务（今天预约到所的客户）
  async getTodayTasks(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const queryBuilder = this.inviteTaskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.lead', 'lead')
      .where('task.inviter_id = :userId', { userId })
      .andWhere('task.scheduled_time >= :today', { today })
      .andWhere('task.scheduled_time < :tomorrow', { tomorrow })
      .andWhere('task.status = :status', { status: InviteTaskStatus.INVITED })
      .orderBy('task.scheduled_time', 'ASC');

    return queryBuilder.getMany();
  }

  // 获取已邀约列表（已成功邀约但未到所的客户）
  async getInvitedTasks(userId: string) {
    const queryBuilder = this.inviteTaskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.lead', 'lead')
      .where('task.inviter_id = :userId', { userId })
      .andWhere('task.status = :status', { status: InviteTaskStatus.INVITED })
      .orderBy('task.scheduled_time', 'DESC');

    return queryBuilder.getMany();
  }

  // 获取历史记录（已完成邀约的历史）
  async getHistoryTasks(userId: string) {
    const queryBuilder = this.inviteTaskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.lead', 'lead')
      .where('task.inviter_id = :userId', { userId })
      .andWhere('task.status IN (:...statuses)', {
        statuses: [InviteTaskStatus.ARRIVED, InviteTaskStatus.NOT_ARRIVED],
      })
      .orderBy('task.updated_at', 'DESC');

    return queryBuilder.getMany();
  }

  // 更新邀约任务状态
  async updateTaskStatus(
    taskId: string,
    userId: string,
    status: InviteTaskStatus,
    resultNote?: string,
  ) {
    const task = await this.inviteTaskRepository.findOne({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('邀约任务不存在');
    }

    if (task.inviter_id !== userId) {
      throw new ForbiddenException('无权操作此任务');
    }

    // 单独查询 lead
    const lead = await this.leadRepository.findOne({ where: { id: task.lead_id } });

    task.status = status;
    if (resultNote) {
      task.result_note = resultNote;
    }

    const updatedTask = await this.inviteTaskRepository.save(task);

    // 更新线索状态
    if (lead) {
      if (status === InviteTaskStatus.ARRIVED) {
        lead.status = LeadStatus.NEGOTIATING;
        await this.leadRepository.save(lead);

        // 13.8 缺口3: 邀约确认到所后自动预建商机（若该线索已有商机则跳过，异常静默不影响邀约主流程）
        try {
          await this.opportunityService.createOpportunity(task.inviter_id, task.lead_id);
        } catch (err) {}
      } else if (status === InviteTaskStatus.NOT_ARRIVED) {
        lead.status = LeadStatus.FOLLOWING;
        await this.leadRepository.save(lead);
      }
    }

    return updatedTask;
  }

  // 获取邀约任务列表
  async findAll(orgId: string, filters?: {
    status?: InviteTaskStatus;
    invite_method?: InviteMethod;
    inviter_id?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: InviteTask[]; total: number }> {
    const queryBuilder = this.inviteTaskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.lead', 'lead')
      .leftJoinAndSelect('task.inviter', 'inviter')
      .where('lead.organization_id = :orgId', { orgId });

    if (filters?.status) {
      queryBuilder.andWhere('task.status = :status', { status: filters.status });
    }
    if (filters?.invite_method) {
      queryBuilder.andWhere('task.invite_method = :invite_method', { invite_method: filters.invite_method });
    }
    if (filters?.inviter_id) {
      queryBuilder.andWhere('task.inviter_id = :inviter_id', { inviter_id: filters.inviter_id });
    }

    const total = await queryBuilder.getCount();
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    queryBuilder.skip((page - 1) * limit).take(limit);
    queryBuilder.orderBy('task.updated_at', 'DESC');

    const data = await queryBuilder.getMany();
    return { data, total };
  }

  // 上传录音文件
  async uploadRecording(
    file: any,
    context?: {
      inviteTaskId?: string;
      content?: string; // 录音转写文本或邀约话术内容，用于合规质检
      orgId?: string;
      inviterId?: string;
    },
  ): Promise<string> {
    // 实际项目中这里应该上传到云存储，这里简化处理
    const fileName = `recording_${Date.now()}_${file.originalname}`;
    // 返回模拟的URL
    const url = `/uploads/${fileName}`;

    // Phase4 M9: 录音上传后自动触发谈案质检（异常静默处理，不影响录音上传主流程）
    try {
      if (context && context.inviteTaskId && context.content && context.orgId && context.inviterId) {
        await this.complianceService.runTalkQualityCheck(
          context.inviteTaskId,
          'recording',
          context.content,
          context.orgId,
          context.inviterId,
        );
      }
    } catch (err) {}

    return url;
  }
}
