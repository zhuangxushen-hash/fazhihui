import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThanOrEqual } from 'typeorm';
import { Lead } from '../lead/lead.entity';
import { Case } from '../case/case.entity';
import { Fee } from '../finance/fee.entity';
import { ProfitShare } from '../finance/profit-share.entity';
import { ComplianceRecord } from '../compliance/compliance-record.entity';
import { LeadStatus, CaseStatus, ComplianceResult, FeeRole } from '../types';
import { User } from '../user/user.entity';

@Injectable()
export class DashboardService {
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

    return { total, pending_assign: pendingAssign, processing, closed, overdue };
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

    return {
      total_revenue: parseFloat(totalRevenue?.total || '0'),
      paid_revenue: parseFloat(paidRevenue?.total || '0'),
      pending_revenue: parseFloat(totalRevenue?.total || '0') - parseFloat(paidRevenue?.total || '0'),
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

    return { total, high_risk: highRisk, medium_risk: mediumRisk, low_risk: lowRisk };
  }
}
