import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LeadPool } from './lead-pool.entity';
import { Lead } from './lead.entity';
import { LeadStatus, RecycleReason, LeadPoolStatus, CaseType } from '../types';

@Injectable()
export class LeadPoolService {
  private readonly logger = new Logger(LeadPoolService.name);
  private readonly maxTakeCount = 3; // 最大领取次数
  private readonly defaultTimeoutDays = 7; // 默认超时天数

  constructor(
    @InjectRepository(LeadPool)
    private leadPoolRepository: Repository<LeadPool>,
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
  ) {}

  // 每天凌晨1点执行超时线索回收
  @Cron('0 1 * * *')
  async handleTimeoutRecycle() {
    this.logger.log('开始执行超时线索回收任务');
    await this.recycleTimeoutLeads(this.defaultTimeoutDays);
    this.logger.log('超时线索回收任务执行完成');
  }

  // 回收超时线索
  async recycleTimeoutLeads(timeoutDays: number = this.defaultTimeoutDays): Promise<number> {
    const timeoutDate = new Date(Date.now() - timeoutDays * 24 * 60 * 60 * 1000);
    
    // 查找所有状态为 PENDING_FOLLOW 或 FOLLOWING 且超过指定天数未跟进的线索
    const leads = await this.leadRepository.find({
      where: [
        {
          status: LeadStatus.PENDING_FOLLOW,
          updated_at: LessThan(timeoutDate),
        },
        {
          status: LeadStatus.FOLLOWING,
          follow_up_time: LessThan(timeoutDate),
        },
      ],
      relations: { assign_sales: true },
    });

    let count = 0;
    for (const lead of leads) {
      if (lead.assign_sales_id) {
        await this.recycleToPool(lead.id, lead.assign_sales_id, RecycleReason.TIMEOUT, '超过设定时间未跟进，自动回收');
        count++;
      }
    }

    return count;
  }

  // 手动释放线索到公海池
  async manualRecycle(leadId: string, operatorId: string, note?: string): Promise<LeadPool> {
    const lead = await this.leadRepository.findOne({
      where: { id: leadId },
      relations: { assign_sales: true },
    });

    if (!lead) {
      throw new NotFoundException('线索不存在');
    }

    if (!lead.assign_sales_id) {
      throw new BadRequestException('该线索未分配，无法释放');
    }

    if (lead.assign_sales_id !== operatorId) {
      throw new ForbiddenException('只能释放自己负责的线索');
    }

    return this.recycleToPool(leadId, lead.assign_sales_id, RecycleReason.MANUAL, note || '手动释放');
  }

  // 内部回收方法
  private async recycleToPool(
    leadId: string,
    originalOwnerId: string,
    reason: RecycleReason,
    note?: string,
  ): Promise<LeadPool> {
    // 检查是否已在公海池中
    const existing = await this.leadPoolRepository.findOne({
      where: { lead_id: leadId, status: LeadPoolStatus.AVAILABLE },
    });

    if (existing) {
      this.logger.warn(`线索 ${leadId} 已在公海池中，跳过回收`);
      return existing;
    }

    // 创建公海池记录
    const leadPool = this.leadPoolRepository.create({
      lead_id: leadId,
      original_owner_id: originalOwnerId,
      recycle_reason: reason,
      recycle_note: note,
      status: LeadPoolStatus.AVAILABLE,
      take_count: 0,
    });

    const saved = await this.leadPoolRepository.save(leadPool);

    // 更新线索状态为 LOST
    await this.leadRepository.update(leadId, {
      status: LeadStatus.LOST,
      assign_sales_id: null,
    });

    return saved;
  }

  // 公海池列表查询
  async findAll(filters?: {
    status?: LeadPoolStatus;
    case_type?: CaseType;
    recycle_reason?: RecycleReason;
    start_date?: Date;
    end_date?: Date;
    page?: number;
    limit?: number;
    sortBy?: 'recycle_time' | 'take_count';
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<{ data: any[]; total: number }> {
    const query = this.leadPoolRepository.createQueryBuilder('lead_pool')
      .leftJoinAndSelect('lead_pool.lead', 'lead')
      .leftJoinAndSelect('lead_pool.original_owner', 'original_owner')
      .leftJoinAndSelect('lead_pool.taken_by', 'taken_by');

    if (filters?.status) {
      query.andWhere('lead_pool.status = :status', { status: filters.status });
    }

    if (filters?.recycle_reason) {
      query.andWhere('lead_pool.recycle_reason = :recycle_reason', { recycle_reason: filters.recycle_reason });
    }

    if (filters?.case_type) {
      query.andWhere('lead.case_type = :case_type', { case_type: filters.case_type });
    }

    if (filters?.start_date) {
      query.andWhere('lead_pool.recycle_time >= :start_date', { start_date: filters.start_date });
    }

    if (filters?.end_date) {
      query.andWhere('lead_pool.recycle_time <= :end_date', { end_date: filters.end_date });
    }

    // 排序
    const sortBy = filters?.sortBy || 'recycle_time';
    const sortOrder = filters?.sortOrder || 'DESC';
    query.orderBy(`lead_pool.${sortBy}`, sortOrder);

    // 分页
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    query.skip((page - 1) * limit).take(limit);

    const [results, total] = await query.getManyAndCount();

    // 格式化返回数据
    const data = results.map(item => ({
      id: item.id,
      lead_id: item.lead_id,
      lead_no: item.lead?.id,
      contact_name: item.lead?.contact_name,
      phone: item.lead?.phone,
      case_type: item.lead?.case_type,
      case_description: item.lead?.case_description,
      original_owner_id: item.original_owner_id,
      original_owner_name: item.original_owner?.real_name,
      recycle_reason: item.recycle_reason,
      recycle_note: item.recycle_note,
      recycle_time: item.recycle_time,
      status: item.status,
      taken_by_id: item.taken_by_id,
      taken_by_name: item.taken_by?.real_name,
      taken_at: item.taken_at,
      take_count: item.take_count,
    }));

    return { data, total };
  }

  // 领取线索
  async takeLead(leadPoolId: string, userId: string): Promise<Lead> {
    const leadPool = await this.leadPoolRepository.findOne({
      where: { id: leadPoolId },
      relations: { lead: true },
    });

    if (!leadPool) {
      throw new NotFoundException('公海池记录不存在');
    }

    if (leadPool.status !== LeadPoolStatus.AVAILABLE) {
      throw new BadRequestException('该线索已被领取或已废弃');
    }

    if (leadPool.take_count >= this.maxTakeCount) {
      // 超过最大领取次数，标记为废弃
      await this.leadPoolRepository.update(leadPoolId, { status: LeadPoolStatus.DISCARDED });
      throw new BadRequestException('该线索已达到最大领取次数，已被废弃');
    }

    // 更新公海池记录
    await this.leadPoolRepository.update(leadPoolId, {
      status: LeadPoolStatus.TAKEN,
      taken_by_id: userId,
      taken_at: new Date(),
      take_count: leadPool.take_count + 1,
    });

    // 更新线索归属
    await this.leadRepository.update(leadPool.lead_id, {
      assign_sales_id: userId,
      status: LeadStatus.PENDING_FOLLOW,
    });

    return this.leadRepository.findOne({ where: { id: leadPool.lead_id } });
  }

  // 分配线索（管理员使用）
  async assignLead(leadPoolId: string, targetUserId: string, operatorId: string): Promise<Lead> {
    const leadPool = await this.leadPoolRepository.findOne({
      where: { id: leadPoolId },
      relations: { lead: true },
    });

    if (!leadPool) {
      throw new NotFoundException('公海池记录不存在');
    }

    if (leadPool.status !== LeadPoolStatus.AVAILABLE) {
      throw new BadRequestException('该线索已被领取或已废弃');
    }

    if (leadPool.take_count >= this.maxTakeCount) {
      await this.leadPoolRepository.update(leadPoolId, { status: LeadPoolStatus.DISCARDED });
      throw new BadRequestException('该线索已达到最大领取次数，已被废弃');
    }

    // 更新公海池记录
    await this.leadPoolRepository.update(leadPoolId, {
      status: LeadPoolStatus.TAKEN,
      taken_by_id: targetUserId,
      taken_at: new Date(),
      take_count: leadPool.take_count + 1,
    });

    // 更新线索归属
    await this.leadRepository.update(leadPool.lead_id, {
      assign_sales_id: targetUserId,
      status: LeadStatus.PENDING_FOLLOW,
    });

    return this.leadRepository.findOne({ where: { id: leadPool.lead_id } });
  }

  // 批量领取线索
  async batchTakeLeads(leadPoolIds: string[], userId: string): Promise<{ success: number; failed: string[] }> {
    let success = 0;
    const failed: string[] = [];

    for (const id of leadPoolIds) {
      try {
        await this.takeLead(id, userId);
        success++;
      } catch (error) {
        failed.push(id);
        this.logger.error(`批量领取失败 ${id}: ${error.message}`);
      }
    }

    return { success, failed };
  }

  // 批量分配线索
  async batchAssignLeads(
    leadPoolIds: string[],
    targetUserId: string,
    operatorId: string,
  ): Promise<{ success: number; failed: string[] }> {
    let success = 0;
    const failed: string[] = [];

    for (const id of leadPoolIds) {
      try {
        await this.assignLead(id, targetUserId, operatorId);
        success++;
      } catch (error) {
        failed.push(id);
        this.logger.error(`批量分配失败 ${id}: ${error.message}`);
      }
    }

    return { success, failed };
  }

  // 获取公海池统计
  async getStatistics(): Promise<{
    total: number;
    available: number;
    taken: number;
    discarded: number;
  }> {
    const [total, available, taken, discarded] = await Promise.all([
      this.leadPoolRepository.count(),
      this.leadPoolRepository.count({ where: { status: LeadPoolStatus.AVAILABLE } }),
      this.leadPoolRepository.count({ where: { status: LeadPoolStatus.TAKEN } }),
      this.leadPoolRepository.count({ where: { status: LeadPoolStatus.DISCARDED } }),
    ]);

    return { total, available, taken, discarded };
  }
}