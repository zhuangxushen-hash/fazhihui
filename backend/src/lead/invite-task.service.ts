import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { InviteTask } from './invite-task.entity';
import { Lead } from './lead.entity';
import { User } from '../user/user.entity';
import { InviteMethod, InviteTaskStatus, InviteResult, LeadStatus, UserRole } from '../types';
import { Express } from 'express';

@Injectable()
export class InviteTaskService {
  constructor(
    @InjectRepository(InviteTask)
    private inviteTaskRepository: Repository<InviteTask>,
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
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

    queryBuilder.orderBy('task.created_at', 'DESC');

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
      .orderBy('lead.created_at', 'DESC');

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
    queryBuilder.orderBy('task.created_at', 'DESC');

    const data = await queryBuilder.getMany();
    return { data, total };
  }

  // 上传录音文件
  async uploadRecording(file: any): Promise<string> {
    // 实际项目中这里应该上传到云存储，这里简化处理
    const fileName = `recording_${Date.now()}_${file.originalname}`;
    // 返回模拟的URL
    return `/uploads/${fileName}`;
  }
}