import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PropertyPreservation } from './property-preservation.entity';
import { Case } from '../case/case.entity';
import { CaseWarning } from '../case/case-warning.entity';
import { WarningType, WarningLevel, WarningStatus } from '../types';

// 保全类型常量
export const PreservationType = {
  PRE_LITIGATION: 'pre-litigation', // 诉前保全
  LITIGATION: 'litigation',         // 诉讼保全
  ARBITRATION: 'arbitration',       // 仲裁保全
  ENFORCEMENT: 'enforcement',       // 执行保全
} as const;

// 保全状态常量
export const PreservationStatus = {
  DRAFT: 'draft',           // 草稿
  PENDING: 'pending',       // 待审批
  APPROVED: 'approved',     // 已批准
  IMPLEMENTED: 'implemented', // 已实施
  RELEASED: 'released',     // 已解除
  EXPIRED: 'expired',       // 已过期
  REJECTED: 'rejected',     // 被驳回
} as const;

// 财产类型常量
export const PropertyType = {
  CASH: 'cash',                 // 银行存款
  REAL_ESTATE: 'real_estate',   // 房产
  VEHICLE: 'vehicle',           // 车辆
  EQUITY: 'equity',             // 股权
  SECURITIES: 'securities',     // 证券
  RECEIVABLE: 'receivable',     // 应收账款
  OTHER: 'other',               // 其他
} as const;

// 担保方式常量
export const GuaranteeMethod = {
  CASH: 'cash',                   // 现金
  INSURANCE: 'insurance',         // 保函
  GUARANTEE: 'guarantee',         // 保证
  PLEDGE: 'pledge',               // 抵押
  PLEDGE_ASSETS: 'pledge_assets', // 质押
} as const;

@Injectable()
export class PropertyPreservationService {
  private readonly logger = new Logger(PropertyPreservationService.name);

  constructor(
    @InjectRepository(PropertyPreservation)
    private preservationRepository: Repository<PropertyPreservation>,
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    @InjectRepository(CaseWarning)
    private caseWarningRepository: Repository<CaseWarning>,
  ) {}

  // 自动生成保全编号: BQ-YYYYMMDD-随机6位
  private generateNo(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `BQ-${y}${m}${d}-${rand}`;
  }

  // 创建保全
  async create(data: Partial<PropertyPreservation>): Promise<PropertyPreservation> {
    if (!data.preservation_no) {
      data.preservation_no = this.generateNo();
    }
    if (!data.status) {
      data.status = PreservationStatus.DRAFT;
    }
    if (!data.preservation_type) {
      data.preservation_type = PreservationType.LITIGATION;
    }
    const entity = this.preservationRepository.create(data);
    return this.preservationRepository.save(entity);
  }

  // 查询保全列表，支持多条件筛选
  async findAll(
    orgId: string,
    filters?: {
      status?: string;
      preservation_type?: string;
      property_type?: string;
      guarantee_method?: string;
      keyword?: string;
      case_id?: string;
      contract_id?: string;
      lead_lawyer_id?: string;
      start_date?: string;
      end_date?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<{ data: PropertyPreservation[]; total: number }> {
    const query = this.preservationRepository
      .createQueryBuilder('bq')
      .where('bq.organization_id = :orgId', { orgId });

    if (filters?.status) {
      query.andWhere('bq.status = :status', { status: filters.status });
    }
    if (filters?.preservation_type) {
      query.andWhere('bq.preservation_type = :pt', { pt: filters.preservation_type });
    }
    if (filters?.property_type) {
      query.andWhere('bq.property_type = :ptype', { ptype: filters.property_type });
    }
    if (filters?.guarantee_method) {
      query.andWhere('bq.guarantee_method = :gm', { gm: filters.guarantee_method });
    }
    if (filters?.case_id) {
      query.andWhere('bq.case_id = :cid', { cid: filters.case_id });
    }
    if (filters?.contract_id) {
      query.andWhere('bq.contract_id = :crid', { crid: filters.contract_id });
    }
    if (filters?.lead_lawyer_id) {
      query.andWhere('bq.lead_lawyer_id = :lid', { lid: filters.lead_lawyer_id });
    }
    if (filters?.keyword) {
      const kw = `%${filters.keyword}%`;
      query.andWhere(
        '(bq.preservation_no LIKE :kw OR bq.case_name LIKE :kw OR bq.applicant LIKE :kw OR bq.respondent LIKE :kw OR bq.court LIKE :kw OR bq.ruling_no LIKE :kw)',
        { kw },
      );
    }
    if (filters?.start_date) {
      query.andWhere('bq.apply_date >= :sd', { sd: filters.start_date });
    }
    if (filters?.end_date) {
      query.andWhere('bq.apply_date <= :ed', { ed: filters.end_date });
    }

    query.orderBy('bq.created_at', 'DESC');
    const total = await query.getCount();
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    query.skip((page - 1) * limit).take(limit);
    const data = await query.getMany();
    return { data, total };
  }

  // 根据ID查询详情
  async findById(id: string): Promise<PropertyPreservation | null> {
    return this.preservationRepository.findOne({ where: { id } });
  }

  // 更新保全
  async update(id: string, data: Partial<PropertyPreservation>): Promise<PropertyPreservation | null> {
    await this.preservationRepository.update(id, data);
    return this.preservationRepository.findOne({ where: { id } });
  }

  // 删除保全
  async remove(id: string): Promise<void> {
    await this.preservationRepository.delete(id);
  }

  // 提交审批：draft -> pending
  async submit(id: string): Promise<PropertyPreservation | null> {
    const item = await this.preservationRepository.findOne({ where: { id } });
    if (!item) return null;
    await this.preservationRepository.update(id, { status: PreservationStatus.PENDING });
    return this.preservationRepository.findOne({ where: { id } });
  }

  // 审批通过：pending -> approved
  async approve(
    id: string,
    approverId: string,
    comment?: string,
  ): Promise<PropertyPreservation | null> {
    await this.preservationRepository.update(id, {
      status: PreservationStatus.APPROVED,
      approver_id: approverId,
      approve_comment: comment,
      approve_time: new Date(),
    });
    return this.preservationRepository.findOne({ where: { id } });
  }

  // 审批驳回：pending -> rejected
  async reject(
    id: string,
    approverId: string,
    comment?: string,
  ): Promise<PropertyPreservation | null> {
    await this.preservationRepository.update(id, {
      status: PreservationStatus.REJECTED,
      approver_id: approverId,
      approve_comment: comment,
      approve_time: new Date(),
    });
    return this.preservationRepository.findOne({ where: { id } });
  }

  // 标记已实施：approved -> implemented
  async markImplemented(
    id: string,
    params?: { actual_amount?: number; implement_date?: Date; ruling_document?: string; ruling_no?: string },
  ): Promise<PropertyPreservation | null> {
    const updateData: Partial<PropertyPreservation> = {
      status: PreservationStatus.IMPLEMENTED,
    };
    if (params?.actual_amount !== undefined) updateData.actual_amount = params.actual_amount;
    if (params?.implement_date) updateData.implement_date = params.implement_date;
    else updateData.implement_date = new Date();
    if (params?.ruling_document) updateData.ruling_document = params.ruling_document;
    if (params?.ruling_no) updateData.ruling_no = params.ruling_no;
    await this.preservationRepository.update(id, updateData);
    return this.preservationRepository.findOne({ where: { id } });
  }

  // 解除保全：implemented -> released
  async release(id: string, release_date?: Date): Promise<PropertyPreservation | null> {
    await this.preservationRepository.update(id, {
      status: PreservationStatus.RELEASED,
      release_date: release_date || new Date(),
    });
    const updated = await this.preservationRepository.findOne({ where: { id } });

    // 解除保全后，若关联案件则回写案件风险备注（非关键操作，静默处理）
    if (updated?.case_id) {
      try {
        const caseEntity = await this.caseRepository.findOne({ where: { id: updated.case_id } });
        if (caseEntity) {
          const note = `保全 ${updated.preservation_no} 已于 ${new Date().toISOString().slice(0, 10)} 解除`;
          caseEntity.risk_notes = caseEntity.risk_notes ? `${caseEntity.risk_notes}; ${note}` : note;
          await this.caseRepository.save(caseEntity);
        }
      } catch (err) {}
    }

    return updated;
  }

  // 到期自动标记（定时任务可调用）
  async markExpired(ids: string[]): Promise<number> {
    if (!ids || ids.length === 0) return 0;

    // 查询将被标记为过期的保全（用于后续回写案件）
    const affected = await this.preservationRepository.find({
      where: { id: In(ids), status: PreservationStatus.IMPLEMENTED },
    });

    const result = await this.preservationRepository
      .createQueryBuilder()
      .update(PropertyPreservation)
      .set({ status: PreservationStatus.EXPIRED })
      .where('id IN (:...ids)', { ids })
      .andWhere('status = :imp', { imp: PreservationStatus.IMPLEMENTED })
      .execute();
    const affectedCount = (result as any).affected || 0;

    // 标记过期后，若关联案件则回写案件风险备注（非关键操作，静默处理）
    try {
      for (const preservation of affected) {
        if (preservation.case_id) {
          const caseEntity = await this.caseRepository.findOne({ where: { id: preservation.case_id } });
          if (caseEntity) {
            const note = `保全 ${preservation.preservation_no} 已过期`;
            caseEntity.risk_notes = caseEntity.risk_notes ? `${caseEntity.risk_notes}; ${note}` : note;
            await this.caseRepository.save(caseEntity);
          }
        }
      }
    } catch (err) {}

    return affectedCount;
  }

  // 每日9点扫描过期保全，标记过期并为关联案件创建 PRESERVATION_EXPIRE 类型预警
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleExpiredPreservations() {
    this.logger.log('开始扫描过期财产保全...');
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 查询已实施且到期日期早于今天的保全
      const expiredPreservations = await this.preservationRepository.find({
        where: {
          status: PreservationStatus.IMPLEMENTED,
          expire_date: LessThan(today),
        },
      });

      if (expiredPreservations.length === 0) {
        this.logger.log('未发现过期保全');
        return;
      }

      const ids = expiredPreservations.map((p) => p.id);
      const affectedCount = await this.markExpired(ids);
      this.logger.log(`已标记 ${affectedCount} 个保全为过期`);

      // 为每个关联案件的过期保全创建 PRESERVATION_EXPIRE 类型预警（非关键操作，静默处理）
      for (const preservation of expiredPreservations) {
        if (preservation.case_id) {
          try {
            const warning = this.caseWarningRepository.create({
              case_id: preservation.case_id,
              warning_type: WarningType.PRESERVATION_EXPIRE,
              warning_level: WarningLevel.URGENT,
              warning_date: new Date(),
              target_date: preservation.expire_date,
              status: WarningStatus.PENDING,
              description: `财产保全 ${preservation.preservation_no} 已于 ${preservation.expire_date ? preservation.expire_date.toISOString().slice(0, 10) : '今日'} 过期`,
              advance_days: 0,
            });
            await this.caseWarningRepository.save(warning);
          } catch (err) {}
        }
      }

      this.logger.log('过期保全扫描完成');
    } catch (error) {
      this.logger.error('扫描过期保全时发生错误:', error);
    }
  }
}
