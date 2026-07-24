import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConversionEvent } from './conversion-event.entity';
import { AdMaterial } from './ad-material.entity';
import { Lead } from '../lead/lead.entity';
import { Case } from '../case/case.entity';
import { User } from '../user/user.entity';
import { AdChannel, ConversionEventType } from '../types';

export interface CreateConversionEventDto {
  channel: AdChannel;
  account_id?: string;
  plan_id?: string;
  material_id?: string;
  event_type: ConversionEventType;
  amount?: number;
  keyword?: string;
  client_id?: string;
  lead_id?: string;
  case_id?: string;
  // 自动归因辅助字段：通过手机号回填线索/客户
  phone?: string;
  organization_id: string;
}

export interface RoiStatsRow {
  dimension_key: string;
  channel?: string;
  account_id?: string;
  plan_id?: string;
  material_id?: string;
  keyword?: string;
  cost: number;
  lead_count: number;
  wechat_add_count: number;
  invite_count: number;
  sign_count: number;
  revenue: number;
  lead_cost: number;
  wechat_add_rate: number;
  sign_rate: number;
  roi: number;
}

export interface FunnelStats {
  lead: number;
  wechat_add: number;
  invite: number;
  sign: number;
}

export type RoiDimension = 'channel' | 'account' | 'plan' | 'material' | 'keyword';

/**
 * 转化归因服务
 * - 处理四级转化事件回传
 * - 自动关联线索/客户/案件数据
 * - 多维度 ROI 统计
 * - T+1 素材 ROI 更新
 */
@Injectable()
export class ConversionService {
  private readonly logger = new Logger(ConversionService.name);

  constructor(
    @InjectRepository(ConversionEvent)
    private conversionEventRepository: Repository<ConversionEvent>,
    @InjectRepository(AdMaterial)
    private adMaterialRepository: Repository<AdMaterial>,
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * 创建转化事件并自动关联线索/客户/案件
   */
  async createEvent(dto: CreateConversionEventDto): Promise<ConversionEvent> {
    const event = this.conversionEventRepository.create({
      channel: dto.channel,
      account_id: dto.account_id,
      plan_id: dto.plan_id,
      material_id: dto.material_id,
      event_type: dto.event_type,
      amount: dto.amount || 0,
      keyword: dto.keyword,
      client_id: dto.client_id,
      lead_id: dto.lead_id,
      case_id: dto.case_id,
      organization_id: dto.organization_id,
    });

    // 自动归因：若未提供 lead_id 但有 phone，则按手机号回填线索
    if (!event.lead_id && dto.phone) {
      const lead = await this.leadRepository.findOne({
        where: { phone: dto.phone, organization_id: dto.organization_id },
      });
      if (lead) {
        event.lead_id = lead.id;
        // 线索的 source_channel/source_keyword 作为归因兜底
        if (!event.keyword && lead.source_keyword) {
          event.keyword = lead.source_keyword;
        }
        // 同步 channel（若未指定）
        if (!event.channel && lead.source_channel) {
          event.channel = lead.source_channel as unknown as AdChannel;
        }
      }
    }

    // 自动归因：sign 事件回填客户/案件数据
    if (event.event_type === ConversionEventType.SIGN) {
      if (event.lead_id && !event.case_id) {
        const caseEntity = await this.caseRepository.findOne({
          where: { lead_id: event.lead_id, organization_id: dto.organization_id },
        });
        if (caseEntity) {
          event.case_id = caseEntity.id;
          if (!event.client_id) {
            event.client_id = caseEntity.client_id;
          }
          // 若未指定金额，使用案件服务费作为回款金额
          if (!event.amount && caseEntity.service_fee) {
            event.amount = Number(caseEntity.service_fee);
          }
        }
      }
    }

    // 自动归因：通过 lead_id 回填 client_id
    if (event.lead_id && !event.client_id) {
      const caseEntity = await this.caseRepository.findOne({
        where: { lead_id: event.lead_id },
      });
      if (caseEntity) {
        event.client_id = caseEntity.client_id;
      }
    }

    return this.conversionEventRepository.save(event);
  }

  /**
   * 线索事件回传
   */
  async reportLead(dto: CreateConversionEventDto): Promise<ConversionEvent> {
    return this.createEvent({ ...dto, event_type: ConversionEventType.LEAD });
  }

  /**
   * 加微事件回传
   */
  async reportWechatAdd(dto: CreateConversionEventDto): Promise<ConversionEvent> {
    return this.createEvent({ ...dto, event_type: ConversionEventType.WECHAT_ADD });
  }

  /**
   * 邀约到所事件回传
   */
  async reportInvite(dto: CreateConversionEventDto): Promise<ConversionEvent> {
    return this.createEvent({ ...dto, event_type: ConversionEventType.INVITE });
  }

  /**
   * 签约回款事件回传
   */
  async reportSign(dto: CreateConversionEventDto): Promise<ConversionEvent> {
    return this.createEvent({ ...dto, event_type: ConversionEventType.SIGN });
  }

  /**
   * 查询转化事件列表
   */
  async findEvents(
    orgId: string,
    filters: {
      channel?: AdChannel;
      account_id?: string;
      plan_id?: string;
      material_id?: string;
      event_type?: ConversionEventType;
      start_date?: Date;
      end_date?: Date;
    } = {},
  ): Promise<ConversionEvent[]> {
    const where: any = { organization_id: orgId };
    if (filters.channel) where.channel = filters.channel;
    if (filters.account_id) where.account_id = filters.account_id;
    if (filters.plan_id) where.plan_id = filters.plan_id;
    if (filters.material_id) where.material_id = filters.material_id;
    if (filters.event_type) where.event_type = filters.event_type;
    if (filters.start_date && filters.end_date) {
      where.created_at = Between(filters.start_date, filters.end_date);
    } else if (filters.start_date) {
      where.created_at = MoreThanOrEqual(filters.start_date);
    } else if (filters.end_date) {
      where.created_at = LessThanOrEqual(filters.end_date);
    }
    return this.conversionEventRepository.find({
      where,
      order: { created_at: 'DESC' },
      take: 500,
    });
  }

  /**
   * 转化漏斗统计
   */
  async getFunnelStats(
    orgId: string,
    filters: {
      channel?: AdChannel;
      account_id?: string;
      plan_id?: string;
      material_id?: string;
      start_date?: Date;
      end_date?: Date;
    } = {},
  ): Promise<FunnelStats> {
    const qb = this.conversionEventRepository
      .createQueryBuilder('e')
      .select('e.event_type', 'event_type')
      .addSelect('COUNT(e.id)', 'count')
      .where('e.organization_id = :orgId', { orgId });

    if (filters.channel) qb.andWhere('e.channel = :channel', { channel: filters.channel });
    if (filters.account_id) qb.andWhere('e.account_id = :accountId', { accountId: filters.account_id });
    if (filters.plan_id) qb.andWhere('e.plan_id = :planId', { planId: filters.plan_id });
    if (filters.material_id) qb.andWhere('e.material_id = :materialId', { materialId: filters.material_id });
    if (filters.start_date) qb.andWhere('e.created_at >= :startDate', { startDate: filters.start_date });
    if (filters.end_date) qb.andWhere('e.created_at <= :endDate', { endDate: filters.end_date });

    qb.groupBy('e.event_type');
    const rows = await qb.getRawMany();

    const result: FunnelStats = {
      lead: 0,
      wechat_add: 0,
      invite: 0,
      sign: 0,
    };
    for (const row of rows) {
      switch (row.event_type) {
        case ConversionEventType.LEAD:
          result.lead = parseInt(row.count, 10);
          break;
        case ConversionEventType.WECHAT_ADD:
          result.wechat_add = parseInt(row.count, 10);
          break;
        case ConversionEventType.INVITE:
          result.invite = parseInt(row.count, 10);
          break;
        case ConversionEventType.SIGN:
          result.sign = parseInt(row.count, 10);
          break;
      }
    }
    return result;
  }

  /**
   * 多维度 ROI 统计
   * dimension: channel / account / plan / material / keyword
   */
  async getRoiStats(
    orgId: string,
    dimension: RoiDimension,
    filters: {
      channel?: AdChannel;
      account_id?: string;
      plan_id?: string;
      material_id?: string;
      start_date?: Date;
      end_date?: Date;
    } = {},
  ): Promise<RoiStatsRow[]> {
    const dimensionColumn = this.getDimensionColumn(dimension);

    const qb = this.conversionEventRepository
      .createQueryBuilder('e')
      .select(`e.${dimensionColumn}`, 'dimension_key')
      .addSelect(`COUNT(CASE WHEN e.event_type = :leadType THEN 1 END)`, 'lead_count')
      .addSelect(`COUNT(CASE WHEN e.event_type = :wechatType THEN 1 END)`, 'wechat_add_count')
      .addSelect(`COUNT(CASE WHEN e.event_type = :inviteType THEN 1 END)`, 'invite_count')
      .addSelect(`COUNT(CASE WHEN e.event_type = :signType THEN 1 END)`, 'sign_count')
      .addSelect(`COALESCE(SUM(CASE WHEN e.event_type = :signType THEN e.amount ELSE 0 END), 0)`, 'revenue')
      .where('e.organization_id = :orgId', { orgId })
      .andWhere(`e.${dimensionColumn} IS NOT NULL`)
      .setParameter('leadType', ConversionEventType.LEAD)
      .setParameter('wechatType', ConversionEventType.WECHAT_ADD)
      .setParameter('inviteType', ConversionEventType.INVITE)
      .setParameter('signType', ConversionEventType.SIGN);

    if (filters.channel) qb.andWhere('e.channel = :channel', { channel: filters.channel });
    if (filters.account_id) qb.andWhere('e.account_id = :accountId', { accountId: filters.account_id });
    if (filters.plan_id) qb.andWhere('e.plan_id = :planId', { planId: filters.plan_id });
    if (filters.material_id) qb.andWhere('e.material_id = :materialId', { materialId: filters.material_id });
    if (filters.start_date) qb.andWhere('e.created_at >= :startDate', { startDate: filters.start_date });
    if (filters.end_date) qb.andWhere('e.created_at <= :endDate', { endDate: filters.end_date });

    qb.groupBy(`e.${dimensionColumn}`).orderBy('revenue', 'DESC');

    const rows = await qb.getRawMany();

    // 拉取对应维度的消耗汇总（基于 AdMaterial.cost 聚合到同一维度）
    const costMap = await this.getCostByDimension(orgId, dimension, filters);

    return rows.map((row) => {
      const revenue = parseFloat(row.revenue) || 0;
      const leadCount = parseInt(row.lead_count, 10) || 0;
      const wechatAddCount = parseInt(row.wechat_add_count, 10) || 0;
      const inviteCount = parseInt(row.invite_count, 10) || 0;
      const signCount = parseInt(row.sign_count, 10) || 0;

      const cost = costMap.get(row.dimension_key) || 0;

      const result: RoiStatsRow = {
        dimension_key: row.dimension_key,
        cost,
        lead_count: leadCount,
        wechat_add_count: wechatAddCount,
        invite_count: inviteCount,
        sign_count: signCount,
        revenue,
        lead_cost: leadCount > 0 ? cost / leadCount : 0,
        wechat_add_rate: leadCount > 0 ? (wechatAddCount / leadCount) * 100 : 0,
        sign_rate: leadCount > 0 ? (signCount / leadCount) * 100 : 0,
        roi: cost > 0 ? (revenue / cost) * 100 : 0,
      };

      // 填充维度展示字段
      if (dimension === 'channel') result.channel = row.dimension_key;
      if (dimension === 'account') result.account_id = row.dimension_key;
      if (dimension === 'plan') result.plan_id = row.dimension_key;
      if (dimension === 'material') result.material_id = row.dimension_key;
      if (dimension === 'keyword') result.keyword = row.dimension_key;

      return result;
    });
  }

  private getDimensionColumn(dimension: RoiDimension): string {
    switch (dimension) {
      case 'channel':
        return 'channel';
      case 'account':
        return 'account_id';
      case 'plan':
        return 'plan_id';
      case 'material':
        return 'material_id';
      case 'keyword':
        return 'keyword';
    }
  }

  /**
   * 按维度从 AdMaterial 汇总消耗金额
   * channel/account/plan/material 维度均可从素材表聚合；keyword 维度返回空 Map
   */
  private async getCostByDimension(
    orgId: string,
    dimension: RoiDimension,
    filters: { channel?: AdChannel },
  ): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    if (dimension === 'keyword') {
      // 关键词维度暂无独立的消耗来源
      return map;
    }

    const column =
      dimension === 'channel'
        ? 'm.channel'
        : dimension === 'account'
          ? 'm.account_id'
          : dimension === 'plan'
            ? 'm.plan_id'
            : 'm.id';

    const qb = this.adMaterialRepository
      .createQueryBuilder('m')
      .select(column, 'dimension_key')
      .addSelect('COALESCE(SUM(m.cost), 0)', 'total_cost')
      .where('m.organization_id = :orgId', { orgId })
      .andWhere(`${column} IS NOT NULL`)
      .groupBy(column);

    if (filters.channel) qb.andWhere('m.channel = :channel', { channel: filters.channel });

    const rows = await qb.getRawMany();
    for (const row of rows) {
      map.set(row.dimension_key, parseFloat(row.total_cost) || 0);
    }
    return map;
  }

  /**
   * T+1 素材 ROI 数据更新
   * 每天凌晨 1:30 执行：根据昨日转化事件重算素材 ROI
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async refreshDailyMaterialRoi() {
    this.logger.log('开始 T+1 素材 ROI 数据更新...');
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const materials = await this.adMaterialRepository.find();
      let updated = 0;
      for (const material of materials) {
        const revenueRow = await this.conversionEventRepository
          .createQueryBuilder('e')
          .select('COALESCE(SUM(e.amount), 0)', 'revenue')
          .where('e.material_id = :materialId', { materialId: material.id })
          .andWhere('e.event_type = :eventType', { eventType: ConversionEventType.SIGN })
          .andWhere('e.created_at >= :startDate', { startDate: yesterday })
          .andWhere('e.created_at < :endDate', { endDate: today })
          .getRawOne();

        const revenue = parseFloat(revenueRow?.revenue) || 0;
        const cost = Number(material.cost) || 0;
        // ROI = 累计回款 / 累计消耗 * 100（百分比）
        material.roi = cost > 0 ? Math.round((revenue / cost) * 10000) / 100 : 0;
        await this.adMaterialRepository.save(material);
        updated++;
      }
      this.logger.log(`T+1 素材 ROI 数据更新完成，共更新 ${updated} 个素材`);
    } catch (err) {
      this.logger.error(`T+1 素材 ROI 数据更新失败: ${err?.message ?? err}`);
    }
  }
}
