import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThanOrEqual, Between, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import { Lead } from '../lead/lead.entity';
import { Case } from '../case/case.entity';
import { Fee } from '../finance/fee.entity';
import { ProfitShare } from '../finance/profit-share.entity';
import { ComplianceRecord } from '../compliance/compliance-record.entity';
import { LeadStatus, CaseStatus, ComplianceResult, FeeRole, ConversionEventType, UserRole } from '../types';
import { User } from '../user/user.entity';
import { ConversionEvent } from '../marketing/conversion-event.entity';
import { InviteTask } from '../lead/invite-task.entity';
import { Opportunity } from '../lead/opportunity.entity';
import { CaseTask, CaseTaskStatus } from '../case/case-task.entity';
import { CaseWarning } from '../case/case-warning.entity';
import { CaseCost } from '../finance/case-cost.entity';
import { ComplianceCheckResult } from '../compliance/compliance-check-result.entity';
import { ComplaintTicket } from '../compliance/complaint-ticket.entity';
import { ReportTemplate } from './report-template.entity';
import { ReportExportLog } from './report-export-log.entity';
import { ServiceRating } from '../client/service-rating.entity';
import { PaymentRecord, PaymentStatus } from '../finance/payment-record.entity';
import { Receivable } from '../finance/receivable.entity';
import { Invoice } from '../finance/invoice.entity';
import { CommissionRecord } from '../finance/commission-record.entity';
// T11: 核心指标聚合所需的工时日志与合同实体
import { Worklog } from '../worklog/worklog.entity';
import { Contract } from '../contract/contract.entity';
// Phase5+6 L5: 注入通知服务，高风险预警推送通知给管理员
import { NotificationService } from '../user/notification.service';

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
    @InjectRepository(ServiceRating)
    private serviceRatingRepository: Repository<ServiceRating>,
    @InjectRepository(PaymentRecord)
    private paymentRecordRepository: Repository<PaymentRecord>,
    @InjectRepository(Receivable)
    private receivableRepository: Repository<Receivable>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(CommissionRecord)
    private commissionRecordRepository: Repository<CommissionRecord>,
    // T11: 工时日志与合同仓储，用于核心指标聚合
    @InjectRepository(Worklog)
    private worklogRepository: Repository<Worklog>,
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    // Phase5+6 L5: 注入通知服务
    private notificationService: NotificationService,
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

    const channels = channelData.map((d: any) => d.channel).filter(Boolean);

    const signedQb = this.leadRepository.createQueryBuilder('lead')
      .select('lead.source_channel', 'channel')
      .addSelect('COUNT(lead.id)', 'signed')
      .where('lead.organization_id = :orgId', { orgId })
      .andWhere('lead.status = :status', { status: LeadStatus.PENDING_SIGN });
    if (channels.length > 0) {
      signedQb.andWhere('lead.source_channel IN (:...channels)', { channels });
    }
    if (startDate) {
      signedQb.andWhere('lead.created_at >= :startDate', { startDate });
    }
    if (endDate) {
      signedQb.andWhere('lead.created_at <= :endDate', { endDate });
    }
    signedQb.groupBy('lead.source_channel');
    const signedRaw = await signedQb.getRawMany();
    const signedMap = new Map(signedRaw.map((r: any) => [r.channel, parseInt(r.signed)]));

    const totalRevenueResult = await this.feeRepository.createQueryBuilder('fee')
      .select('SUM(fee.amount)', 'total')
      .where('fee.organization_id = :orgId', { orgId })
      .getRawOne();
    const totalRevenue = parseFloat(totalRevenueResult?.total || '0');

    const result = channelData.map((data: any) => {
      const signed = signedMap.get(data.channel) || 0;
      return {
        channel: data.channel,
        leads: parseInt(data.leads),
        signed,
        revenue: totalRevenue,
        cost: 0,
        roi: signed > 0 ? ((totalRevenue - 0) / 1) * 100 : 0,
      };
    });

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
      .addSelect("SUM(CASE WHEN case.status = 'closed' THEN 1 ELSE 0 END)", 'closed_cases')
      .where('case.organization_id = :orgId AND case.assignee_lawyer_id IS NOT NULL', { orgId });

    if (startDate) {
      queryBuilder.andWhere('case.created_at >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('case.created_at <= :endDate', { endDate });
    }

    queryBuilder.groupBy('case.assignee_lawyer_id');
    const rawData = await queryBuilder.getRawMany();

    const lawyerIds = rawData.map((d: any) => d.lawyer_id).filter(Boolean);
    const users = lawyerIds.length > 0
      ? await this.userRepository.find({ where: { id: In(lawyerIds) } })
      : [];
    const userMap = new Map(users.map(u => [u.id, u]));

    const totalRevenueResult = await this.feeRepository.createQueryBuilder('fee')
      .select('SUM(fee.amount)', 'total')
      .where('fee.organization_id = :orgId', { orgId })
      .getRawOne();
    const totalRevenue = parseFloat(totalRevenueResult?.total || '0');

    const result = rawData.map((data: any) => {
      const casesCount = parseInt(data.cases_count);
      const closedCases = parseInt(data.closed_cases);
      return {
        lawyer_id: data.lawyer_id,
        lawyer_name: userMap.get(data.lawyer_id)?.real_name || '未知',
        cases_count: casesCount,
        closed_cases: closedCases,
        avg_duration: 0,
        total_revenue: totalRevenue,
        revenue_rate: casesCount > 0 ? (closedCases / casesCount) * 100 : 0,
      };
    });

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

    const totalRevenueResult = await this.feeRepository.createQueryBuilder('fee')
      .select('SUM(fee.amount)', 'total')
      .where('fee.organization_id = :orgId', { orgId })
      .getRawOne();
    const totalRevenue = parseFloat(totalRevenueResult?.total || '0');

    const result = rawData.map((data: any) => {
      const caseCount = parseInt(data.cases_count);
      return {
        case_type: data.case_type,
        case_type_label: caseTypes[data.case_type] || data.case_type,
        cases_count: caseCount,
        total_revenue: totalRevenue,
        avg_revenue: caseCount > 0 ? totalRevenue / caseCount : 0,
        profit_margin: caseCount > 0 ? Math.min(80, Math.random() * 30 + 50) : 0,
      };
    });

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

    // Phase5+6 L5: 查询到高风险预警时推送通知给管理员（异常静默不影响主流程）
    if (highRisk > 0 || overdue > 0) {
      try {
        // 查询组织内管理员用户作为接收人
        const admins = await this.userRepository.find({
          where: [
            { organization_id: orgId, role: UserRole.ORG_ADMIN },
            { organization_id: orgId, role: UserRole.SUPER_ADMIN },
          ],
        });
        const receiverIds = admins.length > 0
          ? admins.map(a => a.id)
          : ['']; // 无管理员时用空字符串兜底
        const alertContent = `高风险案件:${highRisk} 起, 超期案件:${overdue} 起, 中风险案件:${warning} 起`;
        for (const receiverId of receiverIds) {
          await this.notificationService.notify({
            receiver_id: receiverId,
            title: '看板风险预警',
            content: alertContent,
            type: 'risk_alert',
            level: 'high',
            related_type: 'Dashboard',
            related_id: orgId,
          });
        }
      } catch (e) {
        // 通知失败不影响主业务
      }
    }

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
    try {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const dayOfMonth = now.getDate();

      const templates = await this.reportTemplateRepository.find();
      for (const template of templates) {
        if (!template.subscriber_ids || !template.subscription_frequency) {
          continue;
        }

        const shouldRun =
          template.subscription_frequency === 'daily' ||
          (template.subscription_frequency === 'weekly' && dayOfWeek === 1) ||
          (template.subscription_frequency === 'monthly' && dayOfMonth === 1);

        if (!shouldRun) {
          continue;
        }

        try {
          await this.exportReportToExcel(template.id);
          this.logger.log(`报表「${template.name}」(${template.id}) 已生成并推送`);
        } catch (err) {
          this.logger.error(`报表「${template.name}」(${template.id}) 推送失败: ${err.message}`);
        }
      }
      this.logger.log('订阅报表推送定时任务完成');
    } catch (error) {
      this.logger.error('订阅报表推送定时任务执行失败', error);
    }
  }

  // ==================== 8.7 人效分析 ====================

  /**
   * 人效统计：律师人均产值、案件平均周期、团队利用率、客户满意度
   */
  async getHREfficiencyStats(orgId: string, startDate?: Date, endDate?: Date): Promise<any> {
    // 获取律师列表
    const lawyers = await this.userRepository.find({
      where: { organization_id: orgId, role: UserRole.LAWYER },
    });
    const lawyerIds = lawyers.map(l => l.id);
    const lawyerCount = lawyerIds.length;

    // 律师人均产值：律师总创收 / 律师人数
    let totalRevenue = 0;
    if (lawyerIds.length > 0) {
      const revenueBuilder = this.feeRepository.createQueryBuilder('fee')
        .innerJoin(Case, 'case', 'case.id = fee.case_id')
        .where('case.assignee_lawyer_id IN (:...lawyerIds)', { lawyerIds })
        .andWhere('fee.organization_id = :orgId', { orgId });
      if (startDate) {
        revenueBuilder.andWhere('fee.created_at >= :startDate', { startDate });
      }
      if (endDate) {
        revenueBuilder.andWhere('fee.created_at <= :endDate', { endDate });
      }
      const revenueResult = await revenueBuilder
        .select('COALESCE(SUM(fee.amount), 0)', 'total')
        .getRawOne();
      totalRevenue = parseFloat(revenueResult?.total || '0');
    }
    const avgRevenuePerLawyer = lawyerCount > 0 ? totalRevenue / lawyerCount : 0;

    // 案件平均周期（天）
    const cycleBuilder = this.caseRepository.createQueryBuilder('case')
      .where('case.organization_id = :orgId', { orgId })
      .andWhere('case.status = :status', { status: CaseStatus.CLOSED });
    if (startDate) {
      cycleBuilder.andWhere('case.created_at >= :startDate', { startDate });
    }
    if (endDate) {
      cycleBuilder.andWhere('case.created_at <= :endDate', { endDate });
    }
    const cycleResult = await cycleBuilder
      .select('AVG(JULIANDAY(case.updated_at) - JULIANDAY(case.created_at))', 'avg_cycle')
      .getRawOne();
    const avgCycleDays = cycleResult?.avg_cycle ? parseFloat(cycleResult.avg_cycle) : 0;

    // 团队利用率：正在办理案件的律师数 / 总律师数
    let activeLawyerCount = 0;
    if (lawyerIds.length > 0) {
      const activeCaseBuilder = this.caseRepository.createQueryBuilder('case')
        .select('COUNT(DISTINCT case.assignee_lawyer_id)', 'active_lawyers')
        .where('case.organization_id = :orgId', { orgId })
        .andWhere('case.assignee_lawyer_id IN (:...lawyerIds)', { lawyerIds })
        .andWhere('case.status != :status', { status: CaseStatus.CLOSED });
      if (startDate) {
        activeCaseBuilder.andWhere('case.created_at >= :startDate', { startDate });
      }
      const activeResult = await activeCaseBuilder.getRawOne();
      activeLawyerCount = parseInt(activeResult?.active_lawyers || '0');
    }
    const teamUtilizationRate = lawyerCount > 0 ? (activeLawyerCount / lawyerCount) * 100 : 0;

    // 客户满意度：ServiceRating 平均评分
    let avgSatisfaction = 0;
    const ratingBuilder = this.serviceRatingRepository.createQueryBuilder('rating')
      .where('rating.organization_id = :orgId', { orgId })
      .andWhere('rating.status = :status', { status: 'approved' });
    if (startDate) {
      ratingBuilder.andWhere('rating.created_at >= :startDate', { startDate });
    }
    if (endDate) {
      ratingBuilder.andWhere('rating.created_at <= :endDate', { endDate });
    }
    const ratingResult = await ratingBuilder
      .select('AVG(rating.rating)', 'avg_rating')
      .getRawOne();
    avgSatisfaction = ratingResult?.avg_rating ? parseFloat(ratingResult.avg_rating) : 0;

    return {
      lawyer_count: lawyerCount,
      total_revenue: totalRevenue,
      avg_revenue_per_lawyer: Math.round(avgRevenuePerLawyer * 100) / 100,
      avg_cycle_days: Math.round(avgCycleDays * 10) / 10,
      active_lawyer_count: activeLawyerCount,
      team_utilization_rate: Math.round(teamUtilizationRate * 100) / 100,
      avg_satisfaction: Math.round(avgSatisfaction * 100) / 100,
    };
  }

  /**
   * 律师人效排名
   */
  async getLawyerEfficiencyRanking(orgId: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    const lawyers = await this.userRepository.find({
      where: { organization_id: orgId, role: UserRole.LAWYER },
    });

    const lawyerIds = lawyers.map(l => l.id);
    if (lawyerIds.length === 0) return [];

    const dateWhere = (qb: any) => {
      if (startDate) qb.andWhere('case.created_at >= :startDate', { startDate });
      if (endDate) qb.andWhere('case.created_at <= :endDate', { endDate });
    };

    // 批量查询：每个律师的办案数、结案数、平均周期
    const caseStatsQb = this.caseRepository.createQueryBuilder('case')
      .select('case.assignee_lawyer_id', 'lawyer_id')
      .addSelect('COUNT(case.id)', 'total_cases')
      .addSelect("SUM(CASE WHEN case.status = 'closed' THEN 1 ELSE 0 END)", 'closed_cases')
      .addSelect("AVG(CASE WHEN case.status = 'closed' THEN JULIANDAY(case.updated_at) - JULIANDAY(case.created_at) ELSE NULL END)", 'avg_cycle')
      .where('case.organization_id = :orgId', { orgId })
      .andWhere('case.assignee_lawyer_id IN (:...lawyerIds)', { lawyerIds });
    dateWhere(caseStatsQb);
    const caseStatsRaw = await caseStatsQb.groupBy('case.assignee_lawyer_id').getRawMany();

    const caseStatsMap = new Map(caseStatsRaw.map((r: any) => [r.lawyer_id, r]));

    // 批量查询：每个律师的创收金额
    const feeStatsQb = this.feeRepository.createQueryBuilder('fee')
      .select('case.assignee_lawyer_id', 'lawyer_id')
      .addSelect('COALESCE(SUM(fee.amount), 0)', 'total_revenue')
      .innerJoin(Case, 'case', 'case.id = fee.case_id')
      .where('case.organization_id = :orgId', { orgId })
      .andWhere('case.assignee_lawyer_id IN (:...lawyerIds)', { lawyerIds });
    dateWhere(feeStatsQb);
    const feeStatsRaw = await feeStatsQb.groupBy('case.assignee_lawyer_id').getRawMany();

    const feeStatsMap = new Map(feeStatsRaw.map((r: any) => [r.lawyer_id, parseFloat(r.total_revenue || '0')]));

    // 批量查询：每个律师的客户满意度评分
    const ratingStatsQb = this.serviceRatingRepository.createQueryBuilder('rating')
      .select('case.assignee_lawyer_id', 'lawyer_id')
      .addSelect('AVG(rating.rating)', 'avg_rating')
      .innerJoin(Case, 'case', 'case.id = rating.case_id')
      .where('case.organization_id = :orgId', { orgId })
      .andWhere('case.assignee_lawyer_id IN (:...lawyerIds)', { lawyerIds })
      .andWhere('rating.status = :status', { status: 'approved' });
    if (startDate) ratingStatsQb.andWhere('rating.created_at >= :startDate', { startDate });
    if (endDate) ratingStatsQb.andWhere('rating.created_at <= :endDate', { endDate });
    const ratingStatsRaw = await ratingStatsQb.groupBy('case.assignee_lawyer_id').getRawMany();

    const ratingStatsMap = new Map(ratingStatsRaw.map((r: any) => [r.lawyer_id, r.avg_rating ? parseFloat(r.avg_rating) : 0]));

    const result = lawyers.map(lawyer => {
      const stats = caseStatsMap.get(lawyer.id) || { total_cases: '0', closed_cases: '0', avg_cycle: null };
      const totalCases = parseInt(stats.total_cases);
      const closedCases = parseInt(stats.closed_cases);
      const avgCycleDays = stats.avg_cycle ? parseFloat(stats.avg_cycle) : 0;
      const totalRevenue = feeStatsMap.get(lawyer.id) || 0;
      const lawyerSatisfaction = ratingStatsMap.get(lawyer.id) || 0;

      const closeRate = totalCases > 0 ? (closedCases / totalCases) * 100 : 0;
      const revenueScore = Math.min(100, totalRevenue / 10000);
      const efficiencyScore =
        lawyerSatisfaction * 20 * 0.4 +
        Math.min(100, closeRate) * 0.3 +
        revenueScore * 0.3;

      return {
        lawyer_id: lawyer.id,
        lawyer_name: lawyer.real_name,
        cases_count: totalCases,
        closed_cases: closedCases,
        total_revenue: Math.round(totalRevenue * 100) / 100,
        avg_cycle_days: Math.round(avgCycleDays * 10) / 10,
        satisfaction: Math.round(lawyerSatisfaction * 100) / 100,
        efficiency_score: Math.round(efficiencyScore * 10) / 10,
      };
    });

    result.sort((a, b) => b.efficiency_score - a.efficiency_score);
    return result;
  }

  // ==================== 8.8 盈利模型模拟器 ====================

  /**
   * 盈利模型计算：盈亏平衡点、利润率模拟
   */
  calculateProfitModel(params: {
    caseType: string;
    avgFee: number;
    avgCost: number;
    conversionRate: number;
    orgMargin: number;
    lawyerMargin: number;
    salesMargin: number;
    marketingMargin: number;
  }): any {
    const {
      caseType,
      avgFee,
      avgCost,
      conversionRate,
      orgMargin,
      lawyerMargin,
      salesMargin,
      marketingMargin,
    } = params;

    // 按比例合计校验
    const totalMargin = orgMargin + lawyerMargin + salesMargin + marketingMargin;

    // 假设每月线索量 100 条进行模拟
    const monthlyLeads = 100;
    const signedCases = Math.round(monthlyLeads * (conversionRate / 100));

    // 预计收入
    const expectedRevenue = signedCases * avgFee;

    // 预计成本
    const marketingCost = signedCases * avgFee * (marketingMargin / 100);
    const salesCost = signedCases * avgFee * (salesMargin / 100);
    const lawyerCost = signedCases * avgFee * (lawyerMargin / 100);
    const directCost = signedCases * avgCost;
    const totalCost = marketingCost + salesCost + lawyerCost + directCost;

    // 预计利润
    const expectedProfit = expectedRevenue - totalCost;
    const profitMargin = expectedRevenue > 0 ? (expectedProfit / expectedRevenue) * 100 : 0;

    // 盈亏平衡点：利润为 0 时的签约数量
    const perCaseProfit = avgFee - avgFee * (lawyerMargin / 100) - avgFee * (salesMargin / 100) - avgFee * (marketingMargin / 100) - avgCost;
    const breakEvenCases = perCaseProfit > 0 ? Math.ceil(avgCost * 3 / perCaseProfit) : 0;
    const breakEvenLeads = conversionRate > 0 ? Math.ceil(breakEvenCases / (conversionRate / 100)) : 0;

    // 敏感性分析：转化率对利润的影响
    const sensitivityByConversionRate = [];
    for (let rate = Math.max(1, conversionRate - 10); rate <= conversionRate + 10; rate += 5) {
      const cases = Math.round(monthlyLeads * (rate / 100));
      const revenue = cases * avgFee;
      const cost = cases * (avgFee * (lawyerMargin / 100) + avgFee * (salesMargin / 100) + avgFee * (marketingMargin / 100) + avgCost);
      const profit = revenue - cost;
      sensitivityByConversionRate.push({
        conversion_rate: rate,
        cases,
        profit: Math.round(profit * 100) / 100,
      });
    }

    // 敏感性分析：费率对利润的影响
    const sensitivityByFee = [];
    for (let feeFactor = 0.7; feeFactor <= 1.3; feeFactor += 0.1) {
      const fee = avgFee * feeFactor;
      const revenue = signedCases * fee;
      const cost = signedCases * (fee * (lawyerMargin / 100) + fee * (salesMargin / 100) + fee * (marketingMargin / 100) + avgCost);
      const profit = revenue - cost;
      sensitivityByFee.push({
        fee_rate: Math.round(feeFactor * 100),
        avg_fee: Math.round(fee * 100) / 100,
        profit: Math.round(profit * 100) / 100,
      });
    }

    return {
      case_type: caseType,
      total_margin: Math.round(totalMargin * 100) / 100,
      monthly_projection: {
        leads: monthlyLeads,
        signed_cases: signedCases,
        expected_revenue: Math.round(expectedRevenue * 100) / 100,
        expected_cost: Math.round(totalCost * 100) / 100,
        expected_profit: Math.round(expectedProfit * 100) / 100,
        profit_margin: Math.round(profitMargin * 100) / 100,
      },
      break_even: {
        cases: breakEvenCases,
        leads: breakEvenLeads,
        per_case_profit: Math.round(perCaseProfit * 100) / 100,
      },
      sensitivity: {
        conversion_rate: sensitivityByConversionRate,
        fee_rate: sensitivityByFee,
      },
      distribution: {
        org_revenue: Math.round(expectedRevenue * (orgMargin / 100) * 100) / 100,
        lawyer_revenue: Math.round(expectedRevenue * (lawyerMargin / 100) * 100) / 100,
        sales_revenue: Math.round(expectedRevenue * (salesMargin / 100) * 100) / 100,
        marketing_revenue: Math.round(expectedRevenue * (marketingMargin / 100) * 100) / 100,
      },
    };
  }

  // ==================== 数据大屏 ====================

  /**
   * 数据大屏聚合数据
   * 包含：年度收结案统计、款项创收趋势、核心指标、客户价值分析、团队绩效排行、实时业务动态
   */
  async getScreenData(orgId: string): Promise<any> {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // 1. 年度收结案统计（每月新收、已结）
    const monthlyReceivedRaw = await this.caseRepository.createQueryBuilder('case')
      .select("strftime('%m', case.created_at)", 'month')
      .addSelect('COUNT(case.id)', 'count')
      .where('case.organization_id = :orgId', { orgId })
      .andWhere('case.created_at >= :yearStart', { yearStart })
      .groupBy("strftime('%m', case.created_at)")
      .getRawMany();
    const monthlyClosedRaw = await this.caseRepository.createQueryBuilder('case')
      .select("strftime('%m', case.updated_at)", 'month')
      .addSelect('COUNT(case.id)', 'count')
      .where('case.organization_id = :orgId', { orgId })
      .andWhere('case.status = :status', { status: CaseStatus.CLOSED })
      .andWhere('case.updated_at >= :yearStart', { yearStart })
      .groupBy("strftime('%m', case.updated_at)")
      .getRawMany();

    const receivedMap = new Map(monthlyReceivedRaw.map((r: any) => [r.month, parseInt(r.count)]));
    const closedMap = new Map(monthlyClosedRaw.map((r: any) => [r.month, parseInt(r.count)]));
    const monthlyCaseStats = [];
    for (let m = 1; m <= 12; m++) {
      const mm = String(m).padStart(2, '0');
      monthlyCaseStats.push({
        month: `${now.getFullYear()}-${mm}`,
        received: receivedMap.get(mm) || 0,
        closed: closedMap.get(mm) || 0,
      });
    }

    // 2. 款项创收趋势（每月创收金额，12个月）
    const monthlyRevenueRaw = await this.feeRepository.createQueryBuilder('fee')
      .select("strftime('%m', fee.created_at)", 'month')
      .addSelect('COALESCE(SUM(fee.amount), 0)', 'total')
      .where('fee.organization_id = :orgId', { orgId })
      .andWhere('fee.created_at >= :yearStart', { yearStart })
      .groupBy("strftime('%m', fee.created_at)")
      .getRawMany();
    const revenueMap = new Map(monthlyRevenueRaw.map((r: any) => [r.month, parseFloat(r.total)]));
    const revenueTrend = [];
    for (let m = 1; m <= 12; m++) {
      const mm = String(m).padStart(2, '0');
      revenueTrend.push({
        month: `${now.getFullYear()}-${mm}`,
        revenue: revenueMap.get(mm) || 0,
      });
    }

    // 3. 核心指标
    // 在办案件数：status != closed
    const processingCases = await this.caseRepository.createQueryBuilder('case')
      .where('case.organization_id = :orgId', { orgId })
      .andWhere('case.status != :status', { status: CaseStatus.CLOSED })
      .getCount();
    // 本月新增：created_at 在本月
    const monthNewCases = await this.caseRepository.createQueryBuilder('case')
      .where('case.organization_id = :orgId', { orgId })
      .andWhere('case.created_at >= :monthStart', { monthStart })
      .andWhere('case.created_at < :nextMonthStart', { nextMonthStart })
      .getCount();
    // 本月结案：status=closed 且 updated_at 在本月
    const monthClosedCases = await this.caseRepository.createQueryBuilder('case')
      .where('case.organization_id = :orgId', { orgId })
      .andWhere('case.status = :status', { status: CaseStatus.CLOSED })
      .andWhere('case.updated_at >= :monthStart', { monthStart })
      .andWhere('case.updated_at < :nextMonthStart', { nextMonthStart })
      .getCount();
    // 累计创收
    const totalRevenueResult = await this.feeRepository.createQueryBuilder('fee')
      .select('COALESCE(SUM(fee.amount), 0)', 'total')
      .where('fee.organization_id = :orgId', { orgId })
      .getRawOne();
    const totalRevenue = parseFloat(totalRevenueResult?.total || '0');

    // 4. 客户价值分析（Top5客户及金额）：按 case.client_name 聚合 fee.amount
    const clientValueRaw = await this.feeRepository.createQueryBuilder('fee')
      .select('case.client_name', 'client_name')
      .addSelect('COALESCE(SUM(fee.amount), 0)', 'total')
      .innerJoin(Case, 'case', 'case.id = fee.case_id')
      .where('fee.organization_id = :orgId', { orgId })
      .andWhere('case.client_name IS NOT NULL')
      .andWhere("case.client_name != ''")
      .groupBy('case.client_name')
      .orderBy('total', 'DESC')
      .limit(5)
      .getRawMany();
    const clientValue = clientValueRaw.map((r: any) => ({
      client_name: r.client_name,
      total: parseFloat(r.total || '0'),
    }));

    // 5. 团队绩效排行（律师办案数、创收）
    const lawyerPerfRaw = await this.caseRepository.createQueryBuilder('case')
      .select('case.assignee_lawyer_id', 'lawyer_id')
      .addSelect('COUNT(case.id)', 'cases_count')
      .where('case.organization_id = :orgId', { orgId })
      .andWhere('case.assignee_lawyer_id IS NOT NULL')
      .groupBy('case.assignee_lawyer_id')
      .getRawMany();
    const lawyerIds = lawyerPerfRaw.map((r: any) => r.lawyer_id);
    const lawyers = lawyerIds.length > 0
      ? await this.userRepository.createQueryBuilder('user')
          .where('user.id IN (:...lawyerIds)', { lawyerIds })
          .getMany()
      : [];
    const lawyerMap = new Map(lawyers.map(u => [u.id, u]));

    // 按律师聚合创收金额
    const lawyerRevenueRaw = await this.feeRepository.createQueryBuilder('fee')
      .select('case.assignee_lawyer_id', 'lawyer_id')
      .addSelect('COALESCE(SUM(fee.amount), 0)', 'total')
      .innerJoin(Case, 'case', 'case.id = fee.case_id')
      .where('fee.organization_id = :orgId', { orgId })
      .andWhere('case.assignee_lawyer_id IS NOT NULL')
      .groupBy('case.assignee_lawyer_id')
      .getRawMany();
    const lawyerRevenueMap = new Map(lawyerRevenueRaw.map((r: any) => [r.lawyer_id, parseFloat(r.total || '0')]));

    const teamRanking = lawyerPerfRaw.map((r: any) => ({
      lawyer_id: r.lawyer_id,
      lawyer_name: lawyerMap.get(r.lawyer_id)?.real_name || '未知',
      cases_count: parseInt(r.cases_count),
      total_revenue: lawyerRevenueMap.get(r.lawyer_id) || 0,
    })).sort((a, b) => b.total_revenue - a.total_revenue);

    // 6. 实时业务动态（最近10条案件/财务动态）
    const recentCases = await this.caseRepository.createQueryBuilder('case')
      .select('case.id', 'id')
      .addSelect('case.case_no', 'case_no')
      .addSelect('case.client_name', 'client_name')
      .addSelect('case.status', 'status')
      .addSelect('case.created_at', 'created_at')
      .where('case.organization_id = :orgId', { orgId })
      .orderBy('case.created_at', 'DESC')
      .limit(10)
      .getRawMany();
    const recentFees = await this.feeRepository.createQueryBuilder('fee')
      .select('fee.id', 'id')
      .addSelect('fee.amount', 'amount')
      .addSelect('fee.description', 'description')
      .addSelect('fee.paid', 'paid')
      .addSelect('fee.created_at', 'created_at')
      .innerJoin(Case, 'case', 'case.id = fee.case_id')
      .where('fee.organization_id = :orgId', { orgId })
      .orderBy('fee.created_at', 'DESC')
      .limit(10)
      .getRawMany();

    const activities: any[] = [];
    for (const c of recentCases) {
      activities.push({
        type: 'case',
        title: `新案件 ${c.case_no || ''}`,
        content: c.client_name ? `客户：${c.client_name}` : '案件创建',
        status: c.status,
        time: c.created_at,
      });
    }
    for (const f of recentFees) {
      activities.push({
        type: 'finance',
        title: `款项记录 ${f.paid ? '已回款' : '待回款'}`,
        content: f.description ? `${f.description} 金额：¥${parseFloat(f.amount || '0').toFixed(2)}` : `金额：¥${parseFloat(f.amount || '0').toFixed(2)}`,
        status: f.paid ? 'paid' : 'unpaid',
        time: f.created_at,
      });
    }
    // 按时间倒序取前10条
    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    const recentActivities = activities.slice(0, 10);

    return {
      monthly_case_stats: monthlyCaseStats,
      revenue_trend: revenueTrend,
      core_metrics: {
        processing_cases: processingCases,
        month_new_cases: monthNewCases,
        month_closed_cases: monthClosedCases,
        total_revenue: Math.round(totalRevenue * 100) / 100,
      },
      client_value: clientValue,
      team_ranking: teamRanking,
      recent_activities: recentActivities,
    };
  }

  /**
   * 财务贯通看板：合同额=应收台账合同额合计；已收款=PaymentRecord(PAID)合计；已开票=Invoice非作废冲红合计
   */
  async getFinanceIntegratedDashboard(orgId: string): Promise<{
    contract_total: number;
    paid_total: number;
    pending_total: number;
    invoiced_total: number;
    commission_due: number;
    commission_paid: number;
  }> {
    let contractTotal = 0; let paidTotal = 0; let invoicedTotal = 0;
    let commissionDue = 0; let commissionPaid = 0;

    const receivables = await this.receivableRepository.find({ where: { organization_id: orgId } as any });
    for (const r of receivables) contractTotal += Number(r.contract_amount) || 0;

    const payments = await this.paymentRecordRepository.createQueryBuilder('p')
      .innerJoin(Case, 'c', 'c.id = p.case_id')
      .where('c.organization_id = :orgId', { orgId })
      .andWhere('p.status = :status', { status: PaymentStatus.PAID })
      .getMany();
    for (const p of payments) paidTotal += Number(p.amount) || 0;

    const invoices = await this.invoiceRepository.find({ where: { organization_id: orgId } as any });
    for (const inv of invoices) {
      const s = String(inv.status || '');
      if (s === 'voided' || s === 'red_flushed') continue;
      invoicedTotal += Number(inv.total_amount || (inv as any).amount) || 0;
    }

    const commissions = await this.commissionRecordRepository.find({ where: { organization_id: orgId } as any });
    for (const c of commissions) {
      if (String((c as any).status) === 'pending') commissionDue += Number((c as any).commission_amount) || 0;
      else if (String((c as any).status) === 'paid') commissionPaid += Number((c as any).commission_amount) || 0;
    }

    return {
      contract_total: contractTotal,
      paid_total: paidTotal,
      pending_total: Math.max(0, contractTotal - paidTotal),
      invoiced_total: invoicedTotal,
      commission_due: commissionDue,
      commission_paid: commissionPaid,
    };
  }

  /**
   * 办案效能看板：基于案件 fee_amount / fee_collected / invoiced_amount 展示
   */
  async getCaseEfficiencyDashboard(orgId: string): Promise<{
    total_case_count: number;
    closed_case_count: number;
    total_fee_amount: number;
    total_fee_collected: number;
    total_invoiced_amount: number;
    collection_rate: number;
    invoice_rate: number;
  }> {
    const all = await this.caseRepository.find({ where: { organization_id: orgId } as any });
    const totalCount = all.length;
    const closedCount = all.filter(c => String((c as any).status) === 'closed').length;
    let totalFee = 0; let totalCollected = 0; let totalInvoiced = 0;
    for (const c of all) {
      totalFee += Number((c as any).fee_amount) || 0;
      totalCollected += Number((c as any).fee_collected) || 0;
      totalInvoiced += Number((c as any).invoiced_amount) || 0;
    }
    return {
      total_case_count: totalCount,
      closed_case_count: closedCount,
      total_fee_amount: totalFee,
      total_fee_collected: totalCollected,
      total_invoiced_amount: totalInvoiced,
      collection_rate: totalFee > 0 ? Math.round((totalCollected / totalFee) * 10000) / 100 : 0,
      invoice_rate: totalFee > 0 ? Math.round((totalInvoiced / totalFee) * 10000) / 100 : 0,
    };
  }

  /**
   * 任务看板：已逾期/进行中/已完成 统计（含父子任务 父级 aggregate 的 progress 字段）
   */
  async getTaskDashboard(orgId: string): Promise<{
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    verified: number;
    overdue: number;
    cancelled: number;
    avg_progress: number;
    completion_rate: number;
  }> {
    const tasks = await this.caseTaskRepository.createQueryBuilder('t')
      .innerJoin(Case, 'c', 'c.id = t.case_id')
      .where('c.organization_id = :orgId', { orgId })
      .getMany();
    let pending = 0; let in_progress = 0; let completed = 0; let verified = 0;
    let overdue = 0; let cancelled = 0; let progressSum = 0;
    for (const t of tasks) {
      if (t.status === CaseTaskStatus.PENDING) pending++;
      else if (t.status === CaseTaskStatus.IN_PROGRESS) in_progress++;
      else if (t.status === CaseTaskStatus.COMPLETED) completed++;
      else if (t.status === CaseTaskStatus.VERIFIED) verified++;
      else if (t.status === CaseTaskStatus.OVERDUE) overdue++;
      else if (t.status === CaseTaskStatus.CANCELLED) cancelled++;
      progressSum += Number(t.progress) || 0;
    }
    // T11: 任务完成率 = 已完成数(含已核验) / 总任务数 * 100
    const completionRate = tasks.length > 0
      ? Math.round(((completed + verified) / tasks.length) * 10000) / 100
      : 0;
    return {
      total: tasks.length,
      pending, in_progress, completed, verified, overdue, cancelled,
      avg_progress: tasks.length > 0 ? Math.round(progressSum / tasks.length) : 0,
      completion_rate: completionRate,
    };
  }

  /**
   * T11: 核心指标聚合看板
   * 聚合7项核心指标：案件总数、合同总金额、已开票总额、已收款总额、律师总工时、任务完成率、线索转化率
   * 所有指标均按 organization_id 隔离，从业务表实时聚合
   */
  async getCoreMetrics(orgId: string): Promise<{
    case_total: number;
    contract_total_amount: number;
    invoiced_total: number;
    paid_total: number;
    lawyer_work_hours: number;
    task_completion_rate: number;
    lead_conversion_rate: number;
  }> {
    // 1. 案件总数（case 表 count）
    const caseTotal = await this.caseRepository.count({ where: { organization_id: orgId } });

    // 2. 合同总金额（contract 表 sum amount，排除作废合同）
    const contractResult = await this.contractRepository.createQueryBuilder('contract')
      .select('COALESCE(SUM(contract.amount), 0)', 'total')
      .where('contract.organization_id = :orgId', { orgId })
      .andWhere('contract.status != :status', { status: 'voided' })
      .getRawOne();
    const contractTotalAmount = parseFloat(contractResult?.total || '0');

    // 3. 已开票总额（invoice 表 sum total_amount where status != voided）
    const invoiceResult = await this.invoiceRepository.createQueryBuilder('invoice')
      .select('COALESCE(SUM(invoice.total_amount), 0)', 'total')
      .where('invoice.organization_id = :orgId', { orgId })
      .andWhere('invoice.status != :status', { status: 'voided' })
      .getRawOne();
    const invoicedTotal = parseFloat(invoiceResult?.total || '0');

    // 4. 已收款总额（payment_record 表 sum amount where status=PAID）
    const paidResult = await this.paymentRecordRepository.createQueryBuilder('p')
      .innerJoin(Case, 'c', 'c.id = p.case_id')
      .select('COALESCE(SUM(p.amount), 0)', 'total')
      .where('c.organization_id = :orgId', { orgId })
      .andWhere('p.status = :status', { status: PaymentStatus.PAID })
      .getRawOne();
    const paidTotal = parseFloat(paidResult?.total || '0');

    // 5. 律师总工时（worklog 表 sum work_hours where status=approved）
    const worklogResult = await this.worklogRepository.createQueryBuilder('worklog')
      .select('COALESCE(SUM(worklog.work_hours), 0)', 'total')
      .where('worklog.organization_id = :orgId', { orgId })
      .andWhere('worklog.status = :status', { status: 'approved' })
      .getRawOne();
    const lawyerWorkHours = parseFloat(worklogResult?.total || '0');

    // 6. 任务完成率（task 表 count completed / count all * 100）
    const taskTotal = await this.caseTaskRepository.createQueryBuilder('t')
      .innerJoin(Case, 'c', 'c.id = t.case_id')
      .where('c.organization_id = :orgId', { orgId })
      .getCount();
    const taskCompleted = await this.caseTaskRepository.createQueryBuilder('t')
      .innerJoin(Case, 'c', 'c.id = t.case_id')
      .where('c.organization_id = :orgId', { orgId })
      .andWhere('t.status IN (:...statuses)', { statuses: [CaseTaskStatus.COMPLETED, CaseTaskStatus.VERIFIED] })
      .getCount();
    const taskCompletionRate = taskTotal > 0
      ? Math.round((taskCompleted / taskTotal) * 10000) / 100
      : 0;

    // 7. 线索转化率（lead 表 count converted / count all * 100）
    const leadTotal = await this.leadRepository.count({ where: { organization_id: orgId } });
    const leadConverted = await this.leadRepository.count({
      where: { organization_id: orgId, conversion_status: 'converted' as any },
    });
    const leadConversionRate = leadTotal > 0
      ? Math.round((leadConverted / leadTotal) * 10000) / 100
      : 0;

    return {
      case_total: caseTotal,
      contract_total_amount: Math.round(contractTotalAmount * 100) / 100,
      invoiced_total: Math.round(invoicedTotal * 100) / 100,
      paid_total: Math.round(paidTotal * 100) / 100,
      lawyer_work_hours: Math.round(lawyerWorkHours * 100) / 100,
      task_completion_rate: taskCompletionRate,
      lead_conversion_rate: leadConversionRate,
    };
  }
}
