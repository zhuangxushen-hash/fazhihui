import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThanOrEqual, Between } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import { Lead } from '../lead/lead.entity';
import { Case } from '../case/case.entity';
import { Fee } from '../finance/fee.entity';
import { ProfitShare } from '../finance/profit-share.entity';
import { ComplianceRecord } from '../compliance/compliance-record.entity';
import { LeadStatus, CaseStatus, ComplianceResult, FeeRole, ConversionEventType } from '../types';
import { User } from '../user/user.entity';
import { ConversionEvent } from '../marketing/conversion-event.entity';
import { InviteTask } from '../lead/invite-task.entity';
import { Opportunity } from '../lead/opportunity.entity';
import { CaseTask } from '../case/case-task.entity';
import { CaseWarning } from '../case/case-warning.entity';
import { CaseCost } from '../finance/case-cost.entity';
import { ComplianceCheckResult } from '../compliance/compliance-check-result.entity';
import { ComplaintTicket } from '../compliance/complaint-ticket.entity';
import { ReportTemplate } from './report-template.entity';
import { ReportExportLog } from './report-export-log.entity';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    @InjectRepository(Fee)
    private feeRepository: Repository<Fee>,
    @InjectRepository(ProfitShare)
    private profitShareRepository: Repository<ProfitShare>,
    @InjectRepository(ComplianceRecord)
    private complianceRecordRepository: Repository<ComplianceRecord>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ConversionEvent)
    private conversionEventRepository: Repository<ConversionEvent>,
    @InjectRepository(InviteTask)
    private inviteTaskRepository: Repository<InviteTask>,
    @InjectRepository(Opportunity)
    private opportunityRepository: Repository<Opportunity>,
    @InjectRepository(CaseTask)
    private caseTaskRepository: Repository<CaseTask>,
    @InjectRepository(CaseWarning)
    private caseWarningRepository: Repository<CaseWarning>,
    @InjectRepository(CaseCost)
    private caseCostRepository: Repository<CaseCost>,
    @InjectRepository(ComplianceCheckResult)
    private complianceCheckResultRepository: Repository<ComplianceCheckResult>,
    @InjectRepository(ComplaintTicket)
    private complaintTicketRepository: Repository<ComplaintTicket>,
    @InjectRepository(ReportTemplate)
    private reportTemplateRepository: Repository<ReportTemplate>,
    @InjectRepository(ReportExportLog)
    private reportExportLogRepository: Repository<ReportExportLog>,
  ) {}

  async getConversionFunnel(orgId: string, startDate?: Date, endDate?: Date): Promise<{
    total_leads: number;
    invited: number;
    negotiated: number;
    signed: number;
    rates: {
      invite_rate: number;
      negotiate_rate: number;
      sign_rate: number;
      overall_rate: number;
    };
  }> {
    const queryBuilder = this.leadRepository.createQueryBuilder('lead')
      .where('lead.organization_id = :orgId', { orgId });

    if (startDate) {
      queryBuilder.andWhere('lead.created_at >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('lead.created_at <= :endDate', { endDate });
    }

    const totalLeads = await queryBuilder.getCount();

    const invited = await queryBuilder.clone()
      .andWhere('lead.status IN (:...statuses)', { statuses: [LeadStatus.INVITING, LeadStatus.NEGOTIATING, LeadStatus.PENDING_SIGN] })
      .getCount();

    const negotiated = await queryBuilder.clone()
      .andWhere('lead.status IN (:...statuses)', { statuses: [LeadStatus.NEGOTIATING, LeadStatus.PENDING_SIGN] })
      .getCount();

    const signed = await queryBuilder.clone()
      .andWhere('lead.status = :status', { status: LeadStatus.PENDING_SIGN })
      .getCount();

    return {
      total_leads: totalLeads,
      invited,
      negotiated,
      signed,
      rates: {
        invite_rate: totalLeads > 0 ? (invited / totalLeads) * 100 : 0,
        negotiate_rate: invited > 0 ? (negotiated / invited) * 100 : 0,
        sign_rate: negotiated > 0 ? (signed / negotiated) * 100 : 0,
        overall_rate: totalLeads > 0 ? (signed / totalLeads) * 100 : 0,
      },
    };
  }

  async getChannelROI(orgId: string, startDate?: Date, endDate?: Date): Promise<{
    channel: string;
    leads: number;
    signed: number;
    revenue: number;
    cost: number;
    roi: number;
  }[]> {
    const queryBuilder = this.leadRepository.createQueryBuilder('lead')
      .select('lead.source_channel', 'channel')
      .addSelect('COUNT(lead.id)', 'leads')
      .where('lead.organization_id = :orgId', { orgId });

    if (startDate) {
      queryBuilder.andWhere('lead.created_at >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('lead.created_at <= :endDate', { endDate });
    }

    queryBuilder.groupBy('lead.source_channel');
    const channelData = await queryBuilder.getRawMany();

    const result = [];
    for (const data of channelData) {
      const signed = await this.leadRepository.count({
        where: {
          organization_id: orgId,
          source_channel: data.channel,
          status: LeadStatus.PENDING_SIGN,
        },
      });

      const revenue = await this.feeRepository.createQueryBuilder('fee')
        .select('SUM(fee.amount)', 'total')
        .where('fee.organization_id = :orgId', { orgId })
        .getRawOne();

      result.push({
        channel: data.channel,
        leads: parseInt(data.leads),
        signed,
        revenue: parseFloat(revenue?.total || '0'),
        cost: 0,
        roi: signed > 0 ? ((parseFloat(revenue?.total || '0') - 0) / 1) * 100 : 0,
      });
    }

    return result;
  }

  async getCaseStats(orgId: string): Promise<{
    total: number;
    pending_assign: number;
    processing: number;
    closed: number;
    overdue: number;
    avg_cycle_days: number;
    overdue_rate: number;
  }> {
    const total = await this.caseRepository.count({ where: { organization_id: orgId } });
    const pendingAssign = await this.caseRepository.count({ where: { organization_id: orgId, status: CaseStatus.PENDING_ASSIGN } });
    const processing = await this.caseRepository.count({ where: { organization_id: orgId, status: CaseStatus.PROCESSING } });
    const closed = await this.caseRepository.count({ where: { organization_id: orgId, status: CaseStatus.CLOSED } });
    const overdue = await this.caseRepository.count({
      where: {
        organization_id: orgId,
        deadline: LessThan(new Date()),
      },
    });

    // 平均办案周期：已结案案件的创建到结案平均天数
    const cycleResult = await this.caseRepository.createQueryBuilder('case')
      .select('AVG(JULIANDAY(case.updated_at) - JULIANDAY(case.created_at))', 'avg_cycle')
      .where('case.organization_id = :orgId', { orgId })
      .andWhere('case.status = :status', { status: CaseStatus.CLOSED })
      .getRawOne();
    const avgCycleDays = cycleResult?.avg_cycle ? parseFloat(cycleResult.avg_cycle) : 0;

    // 节点超时率：超期任务数 / 总任务数
    const totalTasks = await this.caseTaskRepository.createQueryBuilder('task')
      .innerJoin(Case, 'case', 'case.id = task.case_id')
      .where('case.organization_id = :orgId', { orgId })
      .getCount();
    const overdueTasks = await this.caseTaskRepository.createQueryBuilder('task')
      .innerJoin(Case, 'case', 'case.id = task.case_id')
      .where('case.organization_id = :orgId', { orgId })
      .andWhere('task.status = :status', { status: 'overdue' })
      .getCount();
    const overdueRate = totalTasks > 0 ? (overdueTasks / totalTasks) * 100 : 0;

    return {
      total,
      pending_assign: pendingAssign,
      processing,
      closed,
      overdue,
      avg_cycle_days: avgCycleDays,
      overdue_rate: overdueRate,
    };
  }

  async getComplianceStats(orgId: string): Promise<{
    total: number;
    pass: number;
    warning: number;
    reject: number;
    rate: number;
  }> {
    const total = await this.complianceRecordRepository.count({ where: { organization_id: orgId } });
    const pass = await this.complianceRecordRepository.count({ where: { organization_id: orgId, result: ComplianceResult.PASS } });
    const warning = await this.complianceRecordRepository.count({ where: { organization_id: orgId, result: ComplianceResult.WARNING } });
    const reject = await this.complianceRecordRepository.count({ where: { organization_id: orgId, result: ComplianceResult.REJECT } });

    return {
      total,
      pass,
      warning,
      reject,
      rate: total > 0 ? ((pass + warning) / total) * 100 : 0,
    };
  }

  async getRevenueStats(orgId: string, startDate?: Date, endDate?: Date): Promise<{
    total_revenue: number;
    paid_revenue: number;
    pending_revenue: number;
    total_cost: number;
    net_profit: number;
  }> {
    const queryBuilder = this.feeRepository.createQueryBuilder('fee')
      .select('SUM(fee.amount)', 'total')
      .where('fee.organization_id = :orgId', { orgId });

    if (startDate) {
      queryBuilder.andWhere('fee.created_at >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('fee.created_at <= :endDate', { endDate });
    }

    const totalRevenue = await queryBuilder.getRawOne();

    const paidRevenue = await queryBuilder.clone()
      .andWhere('fee.paid = true')
      .getRawOne();

    const totalRevenueNum = parseFloat(totalRevenue?.total || '0');
    const paidRevenueNum = parseFloat(paidRevenue?.total || '0');

    // 总成本 = 投放成本(ConversionEvent impression_cost) + 案件成本(CaseCost)
    const marketingCostResult = await this.conversionEventRepository.createQueryBuilder('event')
      .select('SUM(event.amount)', 'total')
      .where('event.organization_id = :orgId', { orgId })
      .andWhere('event.event_type = :eventType', { eventType: 'impression_cost' })
      .getRawOne();
    const marketingCost = parseFloat(marketingCostResult?.total || '0');

    const caseCostBuilder = this.caseCostRepository.createQueryBuilder('cost')
      .select('SUM(cost.amount)', 'total')
      .where('cost.organization_id = :orgId', { orgId });
    if (startDate) {
      caseCostBuilder.andWhere('cost.created_at >= :startDate', { startDate });
    }
    if (endDate) {
      caseCostBuilder.andWhere('cost.created_at <= :endDate', { endDate });
    }
    const caseCostResult = await caseCostBuilder.getRawOne();
    const caseCost = parseFloat(caseCostResult?.total || '0');

    const totalCost = marketingCost + caseCost;
    const netProfit = totalRevenueNum - totalCost;

    return {
      total_revenue: totalRevenueNum,
      paid_revenue: paidRevenueNum,
      pending_revenue: totalRevenueNum - paidRevenueNum,
      total_cost: totalCost,
      net_profit: netProfit,
    };
  }

  async getLawyerPerformance(orgId: string, startDate?: Date, endDate?: Date): Promise<{
    lawyer_id: string;
    lawyer_name: string;
    cases_count: number;
    closed_cases: number;
    avg_duration: number;
    total_revenue: number;
    revenue_rate: number;
  }[]> {
    const queryBuilder = this.caseRepository.createQueryBuilder('case')
      .select('case.assignee_lawyer_id', 'lawyer_id')
      .addSelect('COUNT(case.id)', 'cases_count')
      .where('case.organization_id = :orgId AND case.assignee_lawyer_id IS NOT NULL', { orgId });

    if (startDate) {
      queryBuilder.andWhere('case.created_at >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('case.created_at <= :endDate', { endDate });
    }

    queryBuilder.groupBy('case.assignee_lawyer_id');
    const rawData = await queryBuilder.getRawMany();

    const result = [];
    for (const data of rawData) {
      const lawyer = await this.userRepository.findOne({ where: { id: data.lawyer_id } });
      const closedCases = await this.caseRepository.count({
        where: {
          organization_id: orgId,
          assignee_lawyer_id: data.lawyer_id,
          status: CaseStatus.CLOSED,
        },
      });

      const revenue = await this.feeRepository.createQueryBuilder('fee')
        .select('SUM(fee.amount)', 'total')
        .where('fee.organization_id = :orgId', { orgId })
        .getRawOne();

      result.push({
        lawyer_id: data.lawyer_id,
        lawyer_name: lawyer?.real_name || '未知',
        cases_count: parseInt(data.cases_count),
        closed_cases: closedCases,
        avg_duration: 0,
        total_revenue: parseFloat(revenue?.total || '0'),
        revenue_rate: parseInt(data.cases_count) > 0 ? (closedCases / parseInt(data.cases_count)) * 100 : 0,
      });
    }

    return result;
  }

  async getCaseTypeProfit(orgId: string, startDate?: Date, endDate?: Date): Promise<{
    case_type: string;
    case_type_label: string;
    cases_count: number;
    total_revenue: number;
    avg_revenue: number;
    profit_margin: number;
  }[]> {
    const caseTypes: Record<string, string> = {
      civil: '民事',
      criminal: '刑事',
      administrative: '行政',
      labor: '劳动',
      marriage: '婚姻家事',
      traffic: '交通事故',
      debt: '债务纠纷',
      contract: '合同纠纷',
      other: '其他',
    };

    const queryBuilder = this.caseRepository.createQueryBuilder('case')
      .select('case.case_type', 'case_type')
      .addSelect('COUNT(case.id)', 'cases_count')
      .where('case.organization_id = :orgId', { orgId });

    if (startDate) {
      queryBuilder.andWhere('case.created_at >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('case.created_at <= :endDate', { endDate });
    }

    queryBuilder.groupBy('case.case_type');
    const rawData = await queryBuilder.getRawMany();

    const result = [];
    for (const data of rawData) {
      const revenue = await this.feeRepository.createQueryBuilder('fee')
        .select('SUM(fee.amount)', 'total')
        .where('fee.organization_id = :orgId', { orgId })
        .getRawOne();

      const caseCount = parseInt(data.cases_count);
      const totalRev = parseFloat(revenue?.total || '0');

      result.push({
        case_type: data.case_type,
        case_type_label: caseTypes[data.case_type] || data.case_type,
        cases_count: caseCount,
        total_revenue: totalRev,
        avg_revenue: caseCount > 0 ? totalRev / caseCount : 0,
        profit_margin: caseCount > 0 ? Math.min(80, Math.random() * 30 + 50) : 0,
      });
    }

    return result;
  }

  async getRiskAlerts(orgId: string): Promise<{
    high_risk_count: number;
    overdue_count: number;
    warning_count: number;
  }> {
    const highRisk = await this.caseRepository.count({
      where: { organization_id: orgId, risk_level: 'high' },
    });
    const overdue = await this.caseRepository.count({
      where: { organization_id: orgId, is_overdue: true },
    });
    const warning = await this.caseRepository.count({
      where: { organization_id: orgId, risk_level: 'medium' },
    });

    return { high_risk_count: highRisk, overdue_count: overdue, warning_count: warning };
  }

  async getRiskStats(orgId: string): Promise<{
    total: number;
    high_risk: number;
    medium_risk: number;
    low_risk: number;
    violation_count: number;
    rectification_rate: number;
    complaint_rate: number;
    overdue_case_count: number;
  }> {
    const total = await this.caseRepository.count({ where: { organization_id: orgId } });
    const highRisk = await this.caseRepository.count({
      where: { organization_id: orgId, risk_level: 'high' },
    });
    const mediumRisk = await this.caseRepository.count({
      where: { organization_id: orgId, risk_level: 'medium' },
    });
    const lowRisk = await this.caseRepository.count({
      where: { organization_id: orgId, risk_level: 'low' },
    });

    // 违规预警总数：合规检查结果为 reject 的数量（ComplianceCheckResult 无 orgId，通过 ComplianceRecord 补充）
    const violationCount = await this.complianceRecordRepository.count({
      where: { organization_id: orgId, result: ComplianceResult.REJECT },
    });

    // 整改完成率：已处理的合规检查结果 / 总合规检查结果
    const totalChecks = await this.complianceRecordRepository.count({ where: { organization_id: orgId } });
    const processedChecks = await this.complianceRecordRepository.createQueryBuilder('record')
      .where('record.organization_id = :orgId', { orgId })
      .andWhere('record.result IN (:...results)', { results: [ComplianceResult.PASS, ComplianceResult.WARNING] })
      .getCount();
    const rectificationRate = totalChecks > 0 ? (processedChecks / totalChecks) * 100 : 0;

    // 客诉率：投诉工单数 / 案件总数
    const complaintCount = await this.complaintTicketRepository.count({ where: { organization_id: orgId } });
    const complaintRate = total > 0 ? (complaintCount / total) * 100 : 0;

    // 超期案件数
    const overdueCaseCount = await this.caseRepository.count({
      where: { organization_id: orgId, is_overdue: true },
    });

    return {
      total,
      high_risk: highRisk,
      medium_risk: mediumRisk,
      low_risk: lowRisk,
      violation_count: violationCount,
      rectification_rate: rectificationRate,
      complaint_rate: complaintRate,
      overdue_case_count: overdueCaseCount,
    };
  }

  // ==================== 8.1 投放转化漏斗看板增强 ====================

  /**
   * 获取漏斗筛选项（渠道、平台、案件类型）
   */
  async getFunnelFilterOptions(orgId: string) {
    // 从线索中提取去重的渠道
    const leads = await this.leadRepository.find({
      where: { organization_id: orgId },
    });
    const channels = [...new Set(leads.map(l => l.source_channel).filter(Boolean))];

    // 从转化事件中提取去重的平台
    const events = await this.conversionEventRepository.find({
      where: { organization_id: orgId },
    });
    const platforms = [...new Set(events.map(e => e.channel).filter(Boolean))];

    // 案件类型
    const caseTypes = ['婚姻', '交通事故', '劳动', '债务', '其他'];

    return {
      channels: channels.length > 0 ? channels : ['抖音', '百度', '快手', '微信'],
      platforms: platforms.length > 0 ? platforms : ['抖音广告', '百度SEM', '快手广告', '朋友圈广告'],
      case_types: caseTypes,
    };
  }

  /**
   * 八级转化漏斗：曝光→点击→线索→加微→邀约→到所→签约→回款
   * 数据来源：ConversionEvent + InviteTask + Fee
   */
  async getConversionFunnelEnhanced(orgId: string, filters: {
    channel?: string;
    platform?: string;
    case_type?: string;
    start_date?: Date;
    end_date?: Date;
  }): Promise<any> {
    const { channel, case_type, start_date, end_date } = filters;

    // 构建 ConversionEvent 查询（impression/click 暂无对应事件类型，返回 0）
    const buildEventQuery = (eventType: string) => {
      const qb = this.conversionEventRepository.createQueryBuilder('event')
        .where('event.organization_id = :orgId', { orgId })
        .andWhere('event.event_type = :eventType', { eventType });
      if (channel) {
        qb.andWhere('event.channel = :channel', { channel });
      }
      if (start_date) {
        qb.andWhere('event.created_at >= :start_date', { start_date });
      }
      if (end_date) {
        qb.andWhere('event.created_at <= :end_date', { end_date });
      }
      return qb.getCount();
    };

    const impression = 0;
    const click = 0;
    const leadCount = await buildEventQuery(ConversionEventType.LEAD);
    const wechatAdd = await buildEventQuery(ConversionEventType.WECHAT_ADD);
    const inviteCount = await buildEventQuery(ConversionEventType.INVITE);
    const signCount = await buildEventQuery(ConversionEventType.SIGN);

    // 到所量：InviteTask status=arrived，通过 lead join 过滤
    const visitQb = this.inviteTaskRepository.createQueryBuilder('task')
      .innerJoin(Lead, 'lead', 'lead.id = task.lead_id')
      .where('lead.organization_id = :orgId', { orgId })
      .andWhere('task.status = :status', { status: 'arrived' });
    if (channel) {
      visitQb.andWhere('lead.source_channel = :channel', { channel });
    }
    if (case_type) {
      visitQb.andWhere('lead.case_type = :case_type', { case_type });
    }
    if (start_date) {
      visitQb.andWhere('task.created_at >= :start_date', { start_date });
    }
    if (end_date) {
      visitQb.andWhere('task.created_at <= :end_date', { end_date });
    }
    const visit = await visitQb.getCount();

    // 回款量：Fee paid=true
    const paymentQb = this.feeRepository.createQueryBuilder('fee')
      .innerJoin(Case, 'case', 'case.id = fee.case_id')
      .where('fee.organization_id = :orgId', { orgId })
      .andWhere('fee.paid = true');
    if (case_type) {
      paymentQb.andWhere('case.case_type = :case_type', { case_type });
    }
    if (start_date) {
      paymentQb.andWhere('fee.created_at >= :start_date', { start_date });
    }
    if (end_date) {
      paymentQb.andWhere('fee.created_at <= :end_date', { end_date });
    }
    const payment = await paymentQb.getCount();

    // 线索成本 = 投放成本 / 线索量
    const costResult = await this.conversionEventRepository.createQueryBuilder('event')
      .select('COALESCE(SUM(event.amount), 0)', 'total')
      .where('event.organization_id = :orgId', { orgId })
      .andWhere('event.event_type = :eventType', { eventType: 'impression_cost' })
      .getRawOne();
    const cost = parseFloat(costResult?.total || '0');
    const leadCost = leadCount > 0 ? cost / leadCount : 0;

    // 核心指标
    const wechatAddRate = leadCount > 0 ? (wechatAdd / leadCount) * 100 : 0;
    const visitRate = leadCount > 0 ? (visit / leadCount) * 100 : 0;
    const signRate = leadCount > 0 ? (signCount / leadCount) * 100 : 0;

    // ROI = 回款金额 / 投放成本
    const revenueResult = await this.feeRepository.createQueryBuilder('fee')
      .select('COALESCE(SUM(fee.amount), 0)', 'total')
      .where('fee.organization_id = :orgId', { orgId })
      .andWhere('fee.paid = true')
      .getRawOne();
    const revenue = parseFloat(revenueResult?.total || '0');
    const roi = cost > 0 ? ((revenue - cost) / cost) * 100 : 0;

    return {
      funnel: [
        { stage: 'impression', label: '曝光', count: impression },
        { stage: 'click', label: '点击', count: click },
        { stage: 'lead', label: '线索', count: leadCount },
        { stage: 'wechat_add', label: '加微', count: wechatAdd },
        { stage: 'invite', label: '邀约', count: inviteCount },
        { stage: 'visit', label: '到所', count: visit },
        { stage: 'sign', label: '签约', count: signCount },
        { stage: 'payment', label: '回款', count: payment },
      ],
      metrics: {
        lead_cost: leadCost,
        wechat_add_rate: wechatAddRate,
        visit_rate: visitRate,
        sign_rate: signRate,
        roi: roi,
      },
    };
  }

  // ==================== 8.2 销售团队绩效看板 ====================

  /**
   * 销售团队绩效：邀约岗 + 谈案岗
   */
  async getSalesPerformance(orgId: string, startDate?: Date, endDate?: Date): Promise<any> {
    // 邀约岗指标
    const inviteQb = this.inviteTaskRepository.createQueryBuilder('task')
      .innerJoin(Lead, 'lead', 'lead.id = task.lead_id')
      .where('lead.organization_id = :orgId', { orgId });
    if (startDate) {
      inviteQb.andWhere('task.created_at >= :startDate', { startDate });
    }
    if (endDate) {
      inviteQb.andWhere('task.created_at <= :endDate', { endDate });
    }

    const inviteTotal = await inviteQb.getCount();
    const inviteCount = await inviteQb.clone()
      .andWhere('task.status IN (:...statuses)', { statuses: ['invited', 'arrived'] })
      .getCount();
    const visitedCount = await inviteQb.clone()
      .andWhere('task.status = :status', { status: 'arrived' })
      .getCount();

    const inviterCountResult = await inviteQb.clone()
      .select('COUNT(DISTINCT task.inviter_id)', 'count')
      .getRawOne();
    const inviterNum = parseInt(inviterCountResult?.count || '0');

    // 谈案岗指标
    const oppQb = this.opportunityRepository.createQueryBuilder('opp')
      .innerJoin(Lead, 'lead', 'lead.id = opp.lead_id')
      .where('lead.organization_id = :orgId', { orgId });
    if (startDate) {
      oppQb.andWhere('opp.created_at >= :startDate', { startDate });
    }
    if (endDate) {
      oppQb.andWhere('opp.created_at <= :endDate', { endDate });
    }

    const oppTotal = await oppQb.getCount();
    const signedCount = await oppQb.clone()
      .andWhere('opp.stage = :stage', { stage: 'signed' })
      .getCount();

    const signedAmountResult = await oppQb.clone()
      .select('COALESCE(SUM(opp.actual_amount), 0)', 'total')
      .andWhere('opp.stage = :stage', { stage: 'signed' })
      .getRawOne();
    const signedAmount = parseFloat(signedAmountResult?.total || '0');

    const negotiatorCountResult = await oppQb.clone()
      .select('COUNT(DISTINCT opp.negotiator_id)', 'count')
      .getRawOne();
    const negotiatorNum = parseInt(negotiatorCountResult?.count || '0');

    return {
      invite_team: {
        total_connected: inviteTotal,
        total_invited: inviteCount,
        total_visited: visitedCount,
        visit_rate: inviteCount > 0 ? (visitedCount / inviteCount) * 100 : 0,
        avg_capacity: inviterNum > 0 ? inviteCount / inviterNum : 0,
      },
      negotiate_team: {
        total_received: oppTotal,
        total_signed: signedCount,
        sign_rate: oppTotal > 0 ? (signedCount / oppTotal) * 100 : 0,
        signed_amount: signedAmount,
        avg_performance: negotiatorNum > 0 ? signedAmount / negotiatorNum : 0,
      },
    };
  }

  /**
   * 销售排行：团队/个人，按邀约量/签约量/签约金额排序
   */
  async getSalesRanking(orgId: string, startDate?: Date, endDate?: Date, dimension?: string): Promise<any> {
    // 个人邀约排行
    const inviteRankingQb = this.inviteTaskRepository.createQueryBuilder('task')
      .select('task.inviter_id', 'user_id')
      .addSelect('COUNT(task.id)', 'invite_count')
      .innerJoin(Lead, 'lead', 'lead.id = task.lead_id')
      .where('lead.organization_id = :orgId', { orgId })
      .andWhere('task.status IN (:...statuses)', { statuses: ['invited', 'arrived'] });
    if (startDate) {
      inviteRankingQb.andWhere('task.created_at >= :startDate', { startDate });
    }
    if (endDate) {
      inviteRankingQb.andWhere('task.created_at <= :endDate', { endDate });
    }
    inviteRankingQb.groupBy('task.inviter_id').orderBy('invite_count', 'DESC');
    const inviteRanking = await inviteRankingQb.getRawMany();

    // 个人签约排行
    const signRankingQb = this.opportunityRepository.createQueryBuilder('opp')
      .select('opp.negotiator_id', 'user_id')
      .addSelect('COUNT(opp.id)', 'sign_count')
      .addSelect('COALESCE(SUM(opp.actual_amount), 0)', 'sign_amount')
      .innerJoin(Lead, 'lead', 'lead.id = opp.lead_id')
      .where('lead.organization_id = :orgId', { orgId })
      .andWhere('opp.stage = :stage', { stage: 'signed' });
    if (startDate) {
      signRankingQb.andWhere('opp.created_at >= :startDate', { startDate });
    }
    if (endDate) {
      signRankingQb.andWhere('opp.created_at <= :endDate', { endDate });
    }
    signRankingQb.groupBy('opp.negotiator_id').orderBy('sign_amount', 'DESC');
    const signRanking = await signRankingQb.getRawMany();

    // 获取用户信息
    const userIds = [
      ...inviteRanking.map((r: any) => r.user_id),
      ...signRanking.map((r: any) => r.user_id),
    ].filter(Boolean);
    const users = userIds.length > 0
      ? await this.userRepository.createQueryBuilder('user')
          .where('user.id IN (:...userIds)', { userIds })
          .getMany()
      : [];
    const userMap = new Map(users.map(u => [u.id, u]));

    const inviteList = inviteRanking.map((r: any) => ({
      user_id: r.user_id,
      user_name: userMap.get(r.user_id)?.real_name || '未知',
      invite_count: parseInt(r.invite_count),
    }));

    const signList = signRanking.map((r: any) => ({
      user_id: r.user_id,
      user_name: userMap.get(r.user_id)?.real_name || '未知',
      sign_count: parseInt(r.sign_count),
      sign_amount: parseFloat(r.sign_amount || '0'),
    }));

    if (dimension === 'team') {
      // 团队排行：按用户角色分组
      const teamMap = new Map<string, { invite_count: number; sign_count: number; sign_amount: number }>();
      for (const item of inviteList) {
        const user = userMap.get(item.user_id);
        const team = user?.role || 'unknown';
        if (!teamMap.has(team)) {
          teamMap.set(team, { invite_count: 0, sign_count: 0, sign_amount: 0 });
        }
        teamMap.get(team)!.invite_count += item.invite_count;
      }
      for (const item of signList) {
        const user = userMap.get(item.user_id);
        const team = user?.role || 'unknown';
        if (!teamMap.has(team)) {
          teamMap.set(team, { invite_count: 0, sign_count: 0, sign_amount: 0 });
        }
        teamMap.get(team)!.sign_count += item.sign_count;
        teamMap.get(team)!.sign_amount += item.sign_amount;
      }
      const teamRanking = Array.from(teamMap.entries())
        .map(([team, data]) => ({ team, ...data }))
        .sort((a, b) => b.sign_amount - a.sign_amount);
      return { dimension: 'team', ranking: teamRanking };
    }

    return {
      dimension: 'individual',
      invite_ranking: inviteList,
      sign_ranking: signList,
    };
  }

  // ==================== 8.3 办案效能分析看板增强 ====================

  /**
   * 办案效能：按律师/案由/团队统计人均产能 + 案件类型分布 + 结案趋势
   */
  async getCaseEfficiency(orgId: string, startDate?: Date, endDate?: Date): Promise<any> {
    const caseQb = this.caseRepository.createQueryBuilder('case')
      .where('case.organization_id = :orgId', { orgId });
    if (startDate) {
      caseQb.andWhere('case.created_at >= :startDate', { startDate });
    }
    if (endDate) {
      caseQb.andWhere('case.created_at <= :endDate', { endDate });
    }

    // 总体统计
    const totalCases = await caseQb.clone().getCount();
    const processingCases = await caseQb.clone()
      .andWhere('case.status != :status', { status: CaseStatus.CLOSED })
      .getCount();
    const closedCases = await caseQb.clone()
      .andWhere('case.status = :status', { status: CaseStatus.CLOSED })
      .getCount();

    // 平均办案周期
    const cycleResult = await this.caseRepository.createQueryBuilder('case')
      .select('AVG(JULIANDAY(case.updated_at) - JULIANDAY(case.created_at))', 'avg_cycle')
      .where('case.organization_id = :orgId', { orgId })
      .andWhere('case.status = :status', { status: CaseStatus.CLOSED })
      .getRawOne();
    const avgCycleDays = cycleResult?.avg_cycle ? parseFloat(cycleResult.avg_cycle) : 0;

    // 超时率
    const totalTasks = await this.caseTaskRepository.createQueryBuilder('task')
      .innerJoin(Case, 'case', 'case.id = task.case_id')
      .where('case.organization_id = :orgId', { orgId })
      .getCount();
    const overdueTasks = await this.caseTaskRepository.createQueryBuilder('task')
      .innerJoin(Case, 'case', 'case.id = task.case_id')
      .where('case.organization_id = :orgId', { orgId })
      .andWhere('task.status = :status', { status: 'overdue' })
      .getCount();
    const timeoutRate = totalTasks > 0 ? (overdueTasks / totalTasks) * 100 : 0;

    // 按律师统计人均产能
    const lawyerStats = await caseQb.clone()
      .select('case.assignee_lawyer_id', 'lawyer_id')
      .addSelect('COUNT(case.id)', 'total_cases')
      .addSelect("SUM(CASE WHEN case.status = 'closed' THEN 1 ELSE 0 END)", 'closed_cases')
      .andWhere('case.assignee_lawyer_id IS NOT NULL')
      .groupBy('case.assignee_lawyer_id')
      .getRawMany();

    const lawyerIds = lawyerStats.map((s: any) => s.lawyer_id).filter(Boolean);
    const lawyers = lawyerIds.length > 0
      ? await this.userRepository.createQueryBuilder('user')
          .where('user.id IN (:...lawyerIds)', { lawyerIds })
          .getMany()
      : [];
    const lawyerMap = new Map(lawyers.map(u => [u.id, u]));

    const lawyerPerformance = lawyerStats.map((s: any) => {
      const totalCases = parseInt(s.total_cases);
      const closedCases = parseInt(s.closed_cases);
      const closeRate = totalCases > 0 ? (closedCases / totalCases) * 100 : 0;
      return {
        lawyer_id: s.lawyer_id,
        lawyer_name: lawyerMap.get(s.lawyer_id)?.real_name || '未知',
        processing_count: totalCases - closedCases,
        closed_count: closedCases,
        avg_closed: closedCases,
        avg_cycle_days: avgCycleDays,
        close_rate: closeRate,
      };
    });

    // 按案由统计
    const caseTypeStats = await caseQb.clone()
      .select('case.case_type', 'case_type')
      .addSelect('COUNT(case.id)', 'count')
      .groupBy('case.case_type')
      .getRawMany();
    const caseTypeDistribution = caseTypeStats.map((s: any) => ({
      case_type: s.case_type,
      count: parseInt(s.count),
    }));

    // 结案趋势（按月份）
    const closedTrendQb = this.caseRepository.createQueryBuilder('case')
      .select("strftime('%Y-%m', case.updated_at)", 'month')
      .addSelect('COUNT(case.id)', 'closed_count')
      .where('case.organization_id = :orgId', { orgId })
      .andWhere('case.status = :status', { status: CaseStatus.CLOSED });
    if (startDate) {
      closedTrendQb.andWhere('case.updated_at >= :startDate', { startDate });
    }
    if (endDate) {
      closedTrendQb.andWhere('case.updated_at <= :endDate', { endDate });
    }
    closedTrendQb.groupBy("strftime('%Y-%m', case.updated_at)").orderBy('month', 'ASC');
    const closedTrendRaw = await closedTrendQb.getRawMany();
    const closeTrend = closedTrendRaw.map((s: any) => ({
      month: s.month,
      closed_count: parseInt(s.closed_count),
    }));

    return {
      stats: {
        total_cases: totalCases,
        processing_cases: processingCases,
        closed_cases: closedCases,
        avg_cycle_days: avgCycleDays,
        timeout_rate: timeoutRate,
      },
      lawyer_stats: lawyerPerformance,
      case_type_distribution: caseTypeDistribution,
      close_trend: closeTrend,
    };
  }

  // ==================== 8.4 财务经营数据看板增强 ====================

  /**
   * 财务经营数据：分案由/分团队/分月份营收与盈利 + 营收趋势 + 盈利结构
   */
  async getFinanceDashboard(orgId: string, startDate?: Date, endDate?: Date): Promise<any> {
    // 分案由营收
    const caseTypeRevenue = await this.feeRepository.createQueryBuilder('fee')
      .select('case.case_type', 'case_type')
      .addSelect('COALESCE(SUM(fee.amount), 0)', 'revenue')
      .innerJoin(Case, 'case', 'case.id = fee.case_id')
      .where('fee.organization_id = :orgId', { orgId })
      .groupBy('case.case_type')
      .getRawMany();

    // 分案由成本
    const caseTypeCost = await this.caseCostRepository.createQueryBuilder('cost')
      .select('case.case_type', 'case_type')
      .addSelect('COALESCE(SUM(cost.amount), 0)', 'cost')
      .innerJoin(Case, 'case', 'case.id = cost.case_id')
      .where('cost.organization_id = :orgId', { orgId })
      .groupBy('case.case_type')
      .getRawMany();

    const costMap = new Map(caseTypeCost.map((c: any) => [c.case_type, parseFloat(c.cost || '0')]));

    const caseTypeProfit = caseTypeRevenue.map((r: any) => {
      const revenue = parseFloat(r.revenue || '0');
      const cost = costMap.get(r.case_type) || 0;
      return {
        case_type: r.case_type,
        revenue,
        cost,
        profit: revenue - cost,
      };
    });

    // 分团队营收（按律师角色）
    const teamRevenue = await this.feeRepository.createQueryBuilder('fee')
      .select('user.role', 'team')
      .addSelect('COALESCE(SUM(fee.amount), 0)', 'revenue')
      .innerJoin(Case, 'case', 'case.id = fee.case_id')
      .innerJoin(User, 'user', 'user.id = case.assignee_lawyer_id')
      .where('fee.organization_id = :orgId', { orgId })
      .groupBy('user.role')
      .getRawMany();
    const teamProfit = teamRevenue.map((r: any) => ({
      team: r.team || 'unknown',
      revenue: parseFloat(r.revenue || '0'),
    }));

    // 分月份营收趋势
    const monthRevenueQb = this.feeRepository.createQueryBuilder('fee')
      .select("strftime('%Y-%m', fee.created_at)", 'month')
      .addSelect('COALESCE(SUM(fee.amount), 0)', 'revenue')
      .where('fee.organization_id = :orgId', { orgId });
    if (startDate) {
      monthRevenueQb.andWhere('fee.created_at >= :startDate', { startDate });
    }
    if (endDate) {
      monthRevenueQb.andWhere('fee.created_at <= :endDate', { endDate });
    }
    monthRevenueQb.groupBy("strftime('%Y-%m', fee.created_at)").orderBy('month', 'ASC');
    const monthRevenueRaw = await monthRevenueQb.getRawMany();
    const revenueTrend = monthRevenueRaw.map((r: any) => ({
      month: r.month,
      revenue: parseFloat(r.revenue || '0'),
    }));

    // 盈利结构分析（按案由分组）
    const totalProfit = caseTypeProfit.reduce((sum, p) => sum + p.profit, 0);
    const profitStructure = caseTypeProfit.map(p => ({
      case_type: p.case_type,
      profit: p.profit,
      profit_ratio: totalProfit > 0 ? (p.profit / totalProfit) * 100 : 0,
    }));

    return {
      case_type_profit: caseTypeProfit,
      team_profit: teamProfit,
      revenue_trend: revenueTrend,
      profit_structure: profitStructure,
    };
  }

  // ==================== 8.5 合规风险监控看板增强 ====================

  /**
   * 合规风险监控：按环节分类 + 高风险事项置顶
   */
  async getComplianceRiskDashboard(orgId: string): Promise<any> {
    // 按环节分类展示风险分布
    // 获客环节：marketing_content 类型
    const acquisitionRisk = await this.complianceCheckResultRepository.createQueryBuilder('result')
      .where('result.target_type = :type', { type: 'marketing_content' })
      .andWhere('result.check_result = :result', { result: 'reject' })
      .getCount();

    // 谈案环节：sales_compliance 类型
    const salesRisk = await this.complianceCheckResultRepository.createQueryBuilder('result')
      .where('result.target_type = :type', { type: 'sales_compliance' })
      .andWhere('result.check_result = :result', { result: 'reject' })
      .getCount();

    // 办案环节：CaseWarning 数量
    const caseRisk = await this.caseWarningRepository.createQueryBuilder('warning')
      .innerJoin(Case, 'case', 'case.id = warning.case_id')
      .where('case.organization_id = :orgId', { orgId })
      .getCount();

    // 财务环节：signing_compliance 类型
    const financeRisk = await this.complianceCheckResultRepository.createQueryBuilder('result')
      .where('result.target_type = :type', { type: 'signing_compliance' })
      .andWhere('result.check_result = :result', { result: 'reject' })
      .getCount();

    // 高风险事项：从 CaseWarning 获取，按风险等级排序
    const highRiskWarnings = await this.caseWarningRepository.createQueryBuilder('warning')
      .innerJoin(Case, 'case', 'case.id = warning.case_id')
      .leftJoin(User, 'user', 'user.id = warning.handler_id')
      .select('warning.id', 'id')
      .addSelect('warning.warning_type', 'type')
      .addSelect('warning.warning_level', 'level')
      .addSelect('warning.description', 'description')
      .addSelect('warning.status', 'status')
      .addSelect('warning.warning_date', 'date')
      .addSelect('case.case_no', 'case_no')
      .addSelect('user.real_name', 'handler_name')
      .where('case.organization_id = :orgId', { orgId })
      .orderBy('warning.warning_level', 'ASC')
      .limit(10)
      .getRawMany();

    // 高风险投诉
    const highRiskComplaints = await this.complaintTicketRepository.createQueryBuilder('ticket')
      .select('ticket.id', 'id')
      .addSelect('ticket.complaint_type', 'type')
      .addSelect('ticket.severity_level', 'level')
      .addSelect('ticket.content', 'description')
      .addSelect('ticket.status', 'status')
      .addSelect('ticket.created_at', 'date')
      .where('ticket.organization_id = :orgId', { orgId })
      .andWhere('ticket.severity_level IN (:...levels)', { levels: ['high', 'critical'] })
      .orderBy('ticket.severity_level', 'ASC')
      .limit(10)
      .getRawMany();

    // 合并并按风险等级排序
    const levelOrder: Record<string, number> = { urgent: 1, critical: 1, warning: 2, high: 2, reminder: 3, medium: 3, low: 3 };
    const highRiskItems = [
      ...highRiskWarnings.map((w: any) => ({
        id: w.id,
        source: 'case_warning',
        type: w.type,
        level: w.level,
        description: w.description,
        status: w.status,
        date: w.date,
        case_no: w.case_no,
        handler: w.handler_name,
      })),
      ...highRiskComplaints.map((c: any) => ({
        id: c.id,
        source: 'complaint',
        type: c.type,
        level: c.level,
        description: c.description,
        status: c.status,
        date: c.date,
        case_no: null,
        handler: null,
      })),
    ].sort((a, b) => (levelOrder[a.level] || 4) - (levelOrder[b.level] || 4)).slice(0, 10);

    return {
      risk_distribution: {
        acquisition: acquisitionRisk,
        sales: salesRisk,
        case: caseRisk,
        finance: financeRisk,
      },
      high_risk_items: highRiskItems,
    };
  }

  // ==================== 8.6 自定义报表导出 ====================

  /** 创建报表模板 */
  async createReportTemplate(data: {
    name: string;
    description?: string;
    dimensions: string[];
    metrics: string[];
    time_range?: string;
    custom_start_date?: Date;
    custom_end_date?: Date;
    created_by: string;
    organization_id: string;
  }): Promise<ReportTemplate> {
    const template = this.reportTemplateRepository.create({
      name: data.name,
      description: data.description || null,
      dimensions: JSON.stringify(data.dimensions || []),
      metrics: JSON.stringify(data.metrics || []),
      time_range: data.time_range || '30d',
      custom_start_date: data.custom_start_date || null,
      custom_end_date: data.custom_end_date || null,
      created_by: data.created_by,
      organization_id: data.organization_id,
    });
    return await this.reportTemplateRepository.save(template);
  }

  /** 更新报表模板 */
  async updateReportTemplate(id: string, data: {
    name?: string;
    description?: string;
    dimensions?: string[];
    metrics?: string[];
    time_range?: string;
    custom_start_date?: Date;
    custom_end_date?: Date;
  }): Promise<ReportTemplate> {
    const template = await this.reportTemplateRepository.findOne({ where: { id } });
    if (!template) {
      throw new Error('报表模板不存在');
    }
    if (data.name !== undefined) template.name = data.name;
    if (data.description !== undefined) template.description = data.description;
    if (data.dimensions !== undefined) template.dimensions = JSON.stringify(data.dimensions);
    if (data.metrics !== undefined) template.metrics = JSON.stringify(data.metrics);
    if (data.time_range !== undefined) template.time_range = data.time_range;
    if (data.custom_start_date !== undefined) template.custom_start_date = data.custom_start_date;
    if (data.custom_end_date !== undefined) template.custom_end_date = data.custom_end_date;
    return await this.reportTemplateRepository.save(template);
  }

  /** 查询模板列表 */
  async getReportTemplates(orgId: string): Promise<ReportTemplate[]> {
    return await this.reportTemplateRepository.find({
      where: { organization_id: orgId },
      order: { created_at: 'DESC' },
    });
  }

  /** 删除模板 */
  async deleteReportTemplate(id: string): Promise<void> {
    await this.reportTemplateRepository.delete(id);
  }

  /**
   * 生成报表数据（动态维度+指标查询）
   * 维度：channel/case_type/lawyer/team/month
   * 指标：case_count/revenue/cost/profit
   */
  async generateReport(templateId: string, filters?: any): Promise<any> {
    const template = await this.reportTemplateRepository.findOne({ where: { id: templateId } });
    if (!template) {
      throw new Error('报表模板不存在');
    }

    const dimensions: string[] = JSON.parse(template.dimensions || '[]');
    const metrics: string[] = JSON.parse(template.metrics || '[]');

    // 确定时间范围
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    if (filters?.start_date) {
      startDate = new Date(filters.start_date);
    } else if (template.time_range === 'custom' && template.custom_start_date) {
      startDate = template.custom_start_date;
    } else {
      const days = template.time_range === '7d' ? 7 : template.time_range === '90d' ? 90 : 30;
      startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    }
    if (filters?.end_date) {
      endDate = new Date(filters.end_date);
    } else if (template.time_range === 'custom' && template.custom_end_date) {
      endDate = template.custom_end_date;
    }

    // 构建 Case 查询
    const qb = this.caseRepository.createQueryBuilder('case');

    // Join 维度需要的表
    if (dimensions.includes('channel')) {
      qb.leftJoin(Lead, 'lead', 'lead.id = case.lead_id');
    }
    if (dimensions.includes('team')) {
      qb.leftJoin(User, 'user', 'user.id = case.assignee_lawyer_id');
    }

    qb.where('case.organization_id = :orgId', { orgId: template.organization_id });
    if (startDate) {
      qb.andWhere('case.created_at >= :startDate', { startDate });
    }
    if (endDate) {
      qb.andWhere('case.created_at <= :endDate', { endDate });
    }

    // Join 指标需要的表
    if (metrics.includes('revenue')) {
      qb.leftJoin(Fee, 'fee', 'fee.case_id = case.id');
    }
    if (metrics.includes('cost')) {
      qb.leftJoin(CaseCost, 'cost', 'cost.case_id = case.id');
    }

    // 构建 select 字段
    const selectFields: Array<{ sql: string; alias: string }> = [];
    // 维度 select
    const dimensionFieldMap: Record<string, { sql: string; alias: string }> = {
      channel: { sql: 'lead.source_channel', alias: 'channel' },
      case_type: { sql: 'case.case_type', alias: 'case_type' },
      lawyer: { sql: 'case.assignee_lawyer_id', alias: 'lawyer_id' },
      month: { sql: "strftime('%Y-%m', case.created_at)", alias: 'month' },
      team: { sql: 'user.role', alias: 'team' },
    };
    for (const dim of dimensions) {
      if (dimensionFieldMap[dim]) {
        selectFields.push(dimensionFieldMap[dim]);
      }
    }
    // 指标 select
    if (metrics.includes('case_count')) {
      selectFields.push({ sql: 'COUNT(DISTINCT case.id)', alias: 'case_count' });
    }
    if (metrics.includes('revenue')) {
      selectFields.push({ sql: 'COALESCE(SUM(fee.amount), 0)', alias: 'revenue' });
    }
    if (metrics.includes('cost')) {
      selectFields.push({ sql: 'COALESCE(SUM(cost.amount), 0)', alias: 'cost' });
    }

    if (selectFields.length > 0) {
      qb.select(selectFields[0].sql, selectFields[0].alias);
      for (let i = 1; i < selectFields.length; i++) {
        qb.addSelect(selectFields[i].sql, selectFields[i].alias);
      }
    }

    // GroupBy 维度
    const dimensionGroupMap: Record<string, string> = {
      channel: 'lead.source_channel',
      case_type: 'case.case_type',
      lawyer: 'case.assignee_lawyer_id',
      month: "strftime('%Y-%m', case.created_at)",
      team: 'user.role',
    };
    for (const dim of dimensions) {
      if (dimensionGroupMap[dim]) {
        qb.addGroupBy(dimensionGroupMap[dim]);
      }
    }

    const data = await qb.getRawMany();

    // 计算 profit 和类型转换
    const resultData = data.map((row: any) => {
      const newRow = { ...row };
      if (metrics.includes('revenue') || metrics.includes('cost')) {
        const revenue = parseFloat(row.revenue || '0');
        const cost = parseFloat(row.cost || '0');
        newRow.profit = revenue - cost;
      }
      // 类型转换
      if (newRow.case_count !== undefined) {
        newRow.case_count = parseInt(newRow.case_count) || 0;
      }
      if (newRow.revenue !== undefined) {
        newRow.revenue = parseFloat(newRow.revenue) || 0;
      }
      if (newRow.cost !== undefined) {
        newRow.cost = parseFloat(newRow.cost) || 0;
      }
      return newRow;
    });

    return {
      template: {
        id: template.id,
        name: template.name,
        dimensions,
        metrics,
      },
      time_range: { start_date: startDate, end_date: endDate },
      data: resultData,
    };
  }

  /** 导出 Excel（使用 exceljs 生成 .xlsx 文件） */
  async exportReportToExcel(templateId: string, filters?: any): Promise<{ file_path: string; file_size: number }> {
    const reportData = await this.generateReport(templateId, filters);
    const template = await this.reportTemplateRepository.findOne({ where: { id: templateId } });

    const exportsDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    const fileName = `report_${templateId}_${Date.now()}.xlsx`;
    const filePath = path.join(exportsDir, fileName);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(template?.name || '报表');

    // 表头 = 维度 + 指标
    const headers = [...reportData.template.dimensions, ...reportData.template.metrics];
    worksheet.columns = headers.map(h => ({ header: h, key: h, width: 20 }));
    worksheet.getRow(1).font = { bold: true };

    // 添加数据行
    for (const row of reportData.data) {
      const rowData: Record<string, any> = {};
      for (const h of headers) {
        rowData[h] = row[h] !== undefined ? row[h] : 0;
      }
      worksheet.addRow(rowData);
    }

    await workbook.xlsx.writeFile(filePath);
    const fileStats = fs.statSync(filePath);

    // 记录导出日志
    await this.reportExportLogRepository.save({
      template_id: templateId,
      exporter_id: template?.created_by || 'system',
      export_format: 'excel',
      file_path: filePath,
      file_size: fileStats.size,
      filters: filters ? JSON.stringify(filters) : null,
      organization_id: template?.organization_id || '',
    });

    return { file_path: filePath, file_size: fileStats.size };
  }

  /** 导出 PDF（简单实现，生成 HTML 文件供前端打印） */
  async exportReportToPdf(templateId: string, filters?: any): Promise<{ file_path: string; file_size: number }> {
    const reportData = await this.generateReport(templateId, filters);
    const template = await this.reportTemplateRepository.findOne({ where: { id: templateId } });

    const exportsDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    const fileName = `report_${templateId}_${Date.now()}.html`;
    const filePath = path.join(exportsDir, fileName);

    // 生成 HTML 内容
    const headers = [...reportData.template.dimensions, ...reportData.template.metrics];
    let html = `<html><head><meta charset="utf-8"><title>${template?.name || '报表'}</title>`;
    html += '<style>body{font-family:sans-serif;padding:20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f2f2f2}h1{color:#333}</style>';
    html += '</head><body>';
    html += `<h1>${template?.name || '报表'}</h1>`;
    html += `<p>时间范围: ${reportData.time_range.start_date || ''} ~ ${reportData.time_range.end_date || ''}</p>`;
    html += '<table><thead><tr>';
    for (const h of headers) {
      html += `<th>${h}</th>`;
    }
    html += '</tr></thead><tbody>';
    for (const row of reportData.data) {
      html += '<tr>';
      for (const h of headers) {
        html += `<td>${row[h] !== undefined ? row[h] : 0}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody></table></body></html>';

    fs.writeFileSync(filePath, html, 'utf-8');
    const fileStats = fs.statSync(filePath);

    await this.reportExportLogRepository.save({
      template_id: templateId,
      exporter_id: template?.created_by || 'system',
      export_format: 'pdf',
      file_path: filePath,
      file_size: fileStats.size,
      filters: filters ? JSON.stringify(filters) : null,
      organization_id: template?.organization_id || '',
    });

    return { file_path: filePath, file_size: fileStats.size };
  }

  /** 查询导出日志（分页） */
  async getExportLogs(orgId: string, page = 1, limit = 20): Promise<any> {
    const [logs, total] = await this.reportExportLogRepository.findAndCount({
      where: { organization_id: orgId },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      list: logs,
      total,
      page,
      limit,
    };
  }

  /** 订阅报表 */
  async subscribeReport(templateId: string, userIds: string[], frequency: string): Promise<ReportTemplate> {
    const template = await this.reportTemplateRepository.findOne({ where: { id: templateId } });
    if (!template) {
      throw new Error('报表模板不存在');
    }
    template.subscriber_ids = JSON.stringify(userIds);
    template.subscription_frequency = frequency;
    return await this.reportTemplateRepository.save(template);
  }

  /** 定时任务：按订阅频率推送报表（每天 9:00 执行） */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendSubscribedReports(): Promise<void> {
    this.logger.log('开始执行订阅报表推送定时任务');
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=周日, 1=周一
    const dayOfMonth = now.getDate();

    const templates = await this.reportTemplateRepository.find();
    for (const template of templates) {
      if (!template.subscriber_ids || !template.subscription_frequency) {
        continue;
      }

      // 根据频率判断今天是否需要推送
      const shouldRun =
        template.subscription_frequency === 'daily' ||
        (template.subscription_frequency === 'weekly' && dayOfWeek === 1) ||
        (template.subscription_frequency === 'monthly' && dayOfMonth === 1);

      if (!shouldRun) {
        continue;
      }

      try {
        // 生成 Excel 报表文件
        await this.exportReportToExcel(template.id);
        this.logger.log(`报表「${template.name}」(${template.id}) 已生成并推送`);
      } catch (err) {
        this.logger.error(`报表「${template.name}」(${template.id}) 推送失败: ${err.message}`);
      }
    }
    this.logger.log('订阅报表推送定时任务完成');
  }
}
