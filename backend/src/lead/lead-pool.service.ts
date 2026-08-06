import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In, DataSource } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LeadPool } from './lead-pool.entity';
import { Lead } from './lead.entity';
import { LeadStatus, RecycleReason, LeadPoolStatus, CaseType } from '../types';
// Phase5+6 L4: 注入通知服务，公海领取/分配时通知接收人
import { NotificationService } from '../user/notification.service';

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
    private dataSource: DataSource,
    // Phase5+6 L4: 注入通知服务
    private notificationService: NotificationService,
  ) {}

  // 每天凌晨1点执行超时线索回收
  @Cron('0 1 * * *')
  async handleTimeoutRecycle() {
    this.logger.log('开始执行超时线索回收任务');
    try {
      await this.recycleTimeoutLeads(this.defaultTimeoutDays);
      this.logger.log('超时线索回收任务执行完成');
    } catch (error) {
      this.logger.error('超时线索回收任务执行失败', error);
    }
  }

  // 辅助方法：根据ID查询线索（含organization_id）
  async findLeadById(leadId: string): Promise<Lead | null> {
    return this.leadRepository.findOne({ where: { id: leadId } });
  }

  // 辅助方法：根据ID查询公海池记录（含organization_id）
  async findLeadPoolById(leadPoolId: string): Promise<any | null> {
    const result = await this.leadPoolRepository.createQueryBuilder('lp')
      .leftJoin('lp.lead', 'lead')
      .select(['lp.id', 'lead.organization_id as organization_id'])
      .where('lp.id = :id', { id: leadPoolId })
      .getRawOne();
    if (!result) return null;
    return { id: result.lp_id, organization_id: result.organization_id };
  }

  // 回收超时线索
  async recycleTimeoutLeads(timeoutDays: number = this.defaultTimeoutDays, organizationId?: string): Promise<number> {
    const timeoutDate = new Date(Date.now() - timeoutDays * 24 * 60 * 60 * 1000);
    
    const whereConditions: any = [
      {
        status: LeadStatus.PENDING_FOLLOW,
        updated_at: LessThan(timeoutDate),
      },
      {
        status: LeadStatus.FOLLOWING,
        follow_up_time: LessThan(timeoutDate),
      },
    ];
    if (organizationId) {
      whereConditions[0].organization_id = organizationId;
      whereConditions[1].organization_id = organizationId;
    }
    const leads = await this.leadRepository.find({
      where: whereConditions,
      relations: { assign_sales: true },
    });

    const leadsToRecycle = leads.filter(l => !!l.assign_sales_id);
    if (leadsToRecycle.length === 0) return 0;

    const leadIds = leadsToRecycle.map(l => l.id);

    const existingWhere: any = { lead_id: In(leadIds), status: LeadPoolStatus.AVAILABLE } as any;
    const existing = await this.leadPoolRepository.find({ where: existingWhere });
    const existingLeadIds = new Set(existing.map(e => e.lead_id));

    return this.dataSource.transaction(async (manager) => {
      const leadPools: LeadPool[] = [];
      for (const lead of leadsToRecycle) {
        if (existingLeadIds.has(lead.id)) {
          this.logger.warn(`线索 ${lead.id} 已在公海池中，跳过回收`);
          continue;
        }
        const leadPoolData: any = {
          lead_id: lead.id,
          original_owner_id: lead.assign_sales_id!,
          recycle_reason: RecycleReason.TIMEOUT,
          recycle_note: '超过设定时间未跟进，自动回收',
          status: LeadPoolStatus.AVAILABLE,
          take_count: 0,
        };
        if (lead.organization_id) {
          leadPoolData.organization_id = lead.organization_id;
        }
        leadPools.push(manager.create(LeadPool, leadPoolData));
      }

      if (leadPools.length > 0) {
        await manager.save(LeadPool, leadPools);
      }

      for (const lead of leadsToRecycle) {
        if (!existingLeadIds.has(lead.id)) {
          await manager.update(Lead, lead.id, {
            status: LeadStatus.LOST,
            assign_sales_id: null,
          });
        }
      }

      return leadPools.length;
    });
  }

  // 手动释放线索到公海池
  async manualRecycle(leadId: string, operatorId: string, note?: string, organizationId?: string): Promise<LeadPool> {
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

    return this.recycleToPool(leadId, lead.assign_sales_id, RecycleReason.MANUAL, note || '手动释放', lead.organization_id);
  }

  // 内部回收方法
  private async recycleToPool(
    leadId: string,
    originalOwnerId: string,
    reason: RecycleReason,
    note?: string,
    organizationId?: string,
  ): Promise<LeadPool> {
    // 检查是否已在公海池中
    const whereExisting: any = { lead_id: leadId, status: LeadPoolStatus.AVAILABLE };
    const existing = await this.leadPoolRepository.findOne({
      where: whereExisting,
    });

    if (existing) {
      this.logger.warn(`线索 ${leadId} 已在公海池中，跳过回收`);
      return existing;
    }

    return this.dataSource.transaction(async (manager) => {
      // 创建公海池记录
      const leadPoolData: any = {
        lead_id: leadId,
        original_owner_id: originalOwnerId,
        recycle_reason: reason,
        recycle_note: note,
        status: LeadPoolStatus.AVAILABLE,
        take_count: 0,
      };
      if (organizationId) {
        leadPoolData.organization_id = organizationId;
      }
      const leadPool = manager.create(LeadPool, leadPoolData);
      const saved = await manager.save(LeadPool, leadPool);

      // 更新线索状态为 LOST
      await manager.update(Lead, leadId, {
        status: LeadStatus.LOST,
        assign_sales_id: null,
      });

      return saved;
    });
  }

  // 公海池列表查询
  async findAll(
    filters?: {
      status?: LeadPoolStatus;
      case_type?: CaseType;
      recycle_reason?: RecycleReason;
      start_date?: Date;
      end_date?: Date;
      page?: number;
      limit?: number;
      sortBy?: 'recycle_time' | 'take_count';
      sortOrder?: 'ASC' | 'DESC';
    },
    organizationId?: string,
  ): Promise<{ data: any[]; total: number }> {
    const query = this.leadPoolRepository.createQueryBuilder('lead_pool')
      .leftJoinAndSelect('lead_pool.lead', 'lead')
      .leftJoinAndSelect('lead_pool.original_owner', 'original_owner')
      .leftJoinAndSelect('lead_pool.taken_by', 'taken_by');

    if (organizationId) {
      query.andWhere('lead_pool.organization_id = :orgId', { orgId: organizationId });
    }

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
  async takeLead(leadPoolId: string, userId: string, organizationId?: string): Promise<Lead> {
    const wherePool: any = { id: leadPoolId };
    const leadPool = await this.leadPoolRepository.findOne({
      where: wherePool,
      relations: { lead: true },
    });

    if (!leadPool) {
      throw new NotFoundException('公海池记录不存在');
    }

    if (organizationId && leadPool.lead?.organization_id && leadPool.lead.organization_id !== organizationId) {
      throw new ForbiddenException('无权访问该资源');
    }

    if (leadPool.status !== LeadPoolStatus.AVAILABLE) {
      throw new BadRequestException('该线索已被领取或已废弃');
    }

    if (leadPool.take_count >= this.maxTakeCount) {
      // 超过最大领取次数，标记为废弃
      await this.leadPoolRepository.update(leadPoolId, { status: LeadPoolStatus.DISCARDED });
      throw new BadRequestException('该线索已达到最大领取次数，已被废弃');
    }

    const leadId = leadPool.lead_id;
    let updatedLead: Lead | null = null;

    await this.dataSource.transaction(async (manager) => {
      // 更新公海池记录
      await manager.update(LeadPool, leadPoolId, {
        status: LeadPoolStatus.TAKEN,
        taken_by_id: userId,
        taken_at: new Date(),
        take_count: leadPool.take_count + 1,
      });

      // 更新线索归属
      await manager.update(Lead, leadId, {
        assign_sales_id: userId,
        status: LeadStatus.PENDING_FOLLOW,
      });
    });

    // 通知放事务外 try-catch
    try {
      await this.notificationService.notify({
        receiver_id: userId,
        title: '公海线索领取成功',
        content: `您已成功领取公海线索 ${leadId}`,
        type: 'lead_pool',
        level: 'normal',
        related_type: 'Lead',
        related_id: leadId,
      });
    } catch (e) {
      // 通知失败不影响主业务
    }

    updatedLead = await this.leadRepository.findOne({ where: { id: leadId } });
    return updatedLead as Lead;
  }

  // 分配线索（管理员使用）
  async assignLead(leadPoolId: string, targetUserId: string, operatorId: string, organizationId?: string): Promise<Lead> {
    const wherePool: any = { id: leadPoolId };
    const leadPool = await this.leadPoolRepository.findOne({
      where: wherePool,
      relations: { lead: true },
    });

    if (!leadPool) {
      throw new NotFoundException('公海池记录不存在');
    }

    if (organizationId && leadPool.lead?.organization_id && leadPool.lead.organization_id !== organizationId) {
      throw new ForbiddenException('无权访问该资源');
    }

    if (leadPool.status !== LeadPoolStatus.AVAILABLE) {
      throw new BadRequestException('该线索已被领取或已废弃');
    }

    if (leadPool.take_count >= this.maxTakeCount) {
      await this.leadPoolRepository.update(leadPoolId, { status: LeadPoolStatus.DISCARDED });
      throw new BadRequestException('该线索已达到最大领取次数，已被废弃');
    }

    const leadId = leadPool.lead_id;
    let updatedLead: Lead | null = null;

    await this.dataSource.transaction(async (manager) => {
      // 更新公海池记录
      await manager.update(LeadPool, leadPoolId, {
        status: LeadPoolStatus.TAKEN,
        taken_by_id: targetUserId,
        taken_at: new Date(),
        take_count: leadPool.take_count + 1,
      });

      // 更新线索归属
      await manager.update(Lead, leadId, {
        assign_sales_id: targetUserId,
        status: LeadStatus.PENDING_FOLLOW,
      });
    });

    // 通知放事务外 try-catch
    try {
      await this.notificationService.notify({
        receiver_id: targetUserId,
        title: '公海线索分配通知',
        content: `管理员已将公海线索 ${leadId} 分配给您`,
        type: 'lead_pool',
        level: 'normal',
        related_type: 'Lead',
        related_id: leadId,
      });
    } catch (e) {
      // 通知失败不影响主业务
    }

    updatedLead = await this.leadRepository.findOne({ where: { id: leadId } });
    return updatedLead as Lead;
  }

  // 批量领取线索
  async batchTakeLeads(leadPoolIds: string[], userId: string, organizationId?: string): Promise<{ success: number; failed: string[] }> {
    let success = 0;
    const failed: string[] = [];

    for (const id of leadPoolIds) {
      try {
        await this.takeLead(id, userId, organizationId);
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
    organizationId?: string,
  ): Promise<{ success: number; failed: string[] }> {
    let success = 0;
    const failed: string[] = [];

    for (const id of leadPoolIds) {
      try {
        await this.assignLead(id, targetUserId, operatorId, organizationId);
        success++;
      } catch (error) {
        failed.push(id);
        this.logger.error(`批量分配失败 ${id}: ${error.message}`);
      }
    }

    return { success, failed };
  }

  // 获取公海池统计
  async getStatistics(organizationId?: string): Promise<{
    total: number;
    available: number;
    taken: number;
    discarded: number;
  }> {
    const whereTotal: any = {};
    const whereAvailable: any = { status: LeadPoolStatus.AVAILABLE };
    const whereTaken: any = { status: LeadPoolStatus.TAKEN };
    const whereDiscarded: any = { status: LeadPoolStatus.DISCARDED };
    if (organizationId) {
      whereTotal.organization_id = organizationId;
      whereAvailable.organization_id = organizationId;
      whereTaken.organization_id = organizationId;
      whereDiscarded.organization_id = organizationId;
    }
    const [total, available, taken, discarded] = await Promise.all([
      this.leadPoolRepository.count({ where: whereTotal }),
      this.leadPoolRepository.count({ where: whereAvailable }),
      this.leadPoolRepository.count({ where: whereTaken }),
      this.leadPoolRepository.count({ where: whereDiscarded }),
    ]);

    return { total, available, taken, discarded };
  }
}