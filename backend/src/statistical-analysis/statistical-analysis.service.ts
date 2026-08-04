import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Case } from '../case/case.entity';
import { PaymentRecord } from '../finance/payment-record.entity';
import { Receivable } from '../finance/receivable.entity';

@Injectable()
export class StatisticalAnalysisService {
  constructor(
    @InjectRepository(Case)
    private readonly caseRepository: Repository<Case>,
    @InjectRepository(PaymentRecord)
    private readonly paymentRecordRepository: Repository<PaymentRecord>,
    @InjectRepository(Receivable)
    private readonly receivableRepository: Repository<Receivable>,
  ) {}

  // 统计分析入口：按 type 路由到不同统计逻辑
  async query(params: {
    organization_id: string;
    type: string;
    date_from?: string;
    date_to?: string;
  }): Promise<any> {
    switch (params.type) {
      case 'signed-projects':
        // 签约项目统计：从 cases 表按月统计签约数量
        return this.signedProjectsStats(params);
      case 'signed-amount':
        // 签约金额统计：从 cases 表按月统计 fee_amount 合计
        return this.signedAmountStats(params);
      case 'actual-received':
        // 实收款项统计：从 payment_records 表按月统计 amount 合计
        return this.actualReceivedStats(params);
      case 'expected-received':
        // 预计收款统计：从 receivables 表按月统计 contract_amount 合计
        return this.expectedReceivedStats(params);
      case 'summary':
        // 汇总统计：总案件数/总合同金额/总已收/总待收
        return this.summaryStats(params);
      case 'business-category':
        // 业务类别统计：从 cases 表按 case_type 分组统计
        return this.businessCategoryStats(params);
      case 'team':
        // 案件所属团队统计：从 cases 表按 assignee_lawyer_id 分组统计
        return this.teamStats(params);
      default:
        // 其他type返回空对象
        return {};
    }
  }

  // 签约项目统计：按月统计 cases 签约数量（以 created_at 作为签约时间）
  private async signedProjectsStats(params: {
    organization_id: string;
    type: string;
    date_from?: string;
    date_to?: string;
  }) {
    const qb = this.caseRepository.createQueryBuilder('c');
    qb.select("strftime('%Y-%m', c.created_at)", 'month');
    qb.addSelect('COUNT(*)', 'count');
    if (params.organization_id) {
      qb.andWhere('c.organization_id = :orgId', { orgId: params.organization_id });
    }
    if (params.date_from) {
      qb.andWhere('c.created_at >= :dateFrom', { dateFrom: new Date(params.date_from) });
    }
    if (params.date_to) {
      qb.andWhere('c.created_at <= :dateTo', { dateTo: new Date(params.date_to) });
    }
    qb.groupBy("strftime('%Y-%m', c.created_at)");
    qb.orderBy('month', 'ASC');
    const list = await qb.getRawMany();
    return { type: params.type, list };
  }

  // 签约金额统计：按月统计 cases 的 fee_amount 合计
  private async signedAmountStats(params: {
    organization_id: string;
    type: string;
    date_from?: string;
    date_to?: string;
  }) {
    const qb = this.caseRepository.createQueryBuilder('c');
    qb.select("strftime('%Y-%m', c.created_at)", 'month');
    qb.addSelect('SUM(c.fee_amount)', 'amount');
    qb.addSelect('COUNT(*)', 'count');
    if (params.organization_id) {
      qb.andWhere('c.organization_id = :orgId', { orgId: params.organization_id });
    }
    if (params.date_from) {
      qb.andWhere('c.created_at >= :dateFrom', { dateFrom: new Date(params.date_from) });
    }
    if (params.date_to) {
      qb.andWhere('c.created_at <= :dateTo', { dateTo: new Date(params.date_to) });
    }
    qb.groupBy("strftime('%Y-%m', c.created_at)");
    qb.orderBy('month', 'ASC');
    const list = await qb.getRawMany();
    return { type: params.type, list };
  }

  // 实收款项统计：按月统计 payment_records 的 amount 合计
  // payment_records 无 organization_id，通过 case_id 关联 cases 过滤
  private async actualReceivedStats(params: {
    organization_id: string;
    type: string;
    date_from?: string;
    date_to?: string;
  }) {
    const qb = this.paymentRecordRepository.createQueryBuilder('p');
    qb.leftJoin(Case, 'c', 'c.id = p.case_id');
    qb.select("strftime('%Y-%m', p.created_at)", 'month');
    qb.addSelect('SUM(p.amount)', 'amount');
    qb.addSelect('COUNT(*)', 'count');
    if (params.organization_id) {
      qb.andWhere('c.organization_id = :orgId', { orgId: params.organization_id });
    }
    if (params.date_from) {
      qb.andWhere('p.created_at >= :dateFrom', { dateFrom: new Date(params.date_from) });
    }
    if (params.date_to) {
      qb.andWhere('p.created_at <= :dateTo', { dateTo: new Date(params.date_to) });
    }
    qb.groupBy("strftime('%Y-%m', p.created_at)");
    qb.orderBy('month', 'ASC');
    const list = await qb.getRawMany();
    return { type: params.type, list };
  }

  // 预计收款统计：按月统计 receivables 的 contract_amount 合计
  private async expectedReceivedStats(params: {
    organization_id: string;
    type: string;
    date_from?: string;
    date_to?: string;
  }) {
    const qb = this.receivableRepository.createQueryBuilder('r');
    qb.select("strftime('%Y-%m', r.created_at)", 'month');
    qb.addSelect('SUM(r.contract_amount)', 'amount');
    qb.addSelect('COUNT(*)', 'count');
    if (params.organization_id) {
      qb.andWhere('r.organization_id = :orgId', { orgId: params.organization_id });
    }
    if (params.date_from) {
      qb.andWhere('r.created_at >= :dateFrom', { dateFrom: new Date(params.date_from) });
    }
    if (params.date_to) {
      qb.andWhere('r.created_at <= :dateTo', { dateTo: new Date(params.date_to) });
    }
    qb.groupBy("strftime('%Y-%m', r.created_at)");
    qb.orderBy('month', 'ASC');
    const list = await qb.getRawMany();
    return { type: params.type, list };
  }

  // 汇总统计：总案件数/总合同金额/总已收/总待收
  private async summaryStats(params: {
    organization_id: string;
    type: string;
    date_from?: string;
    date_to?: string;
  }) {
    const caseQb = this.caseRepository.createQueryBuilder('c');
    if (params.organization_id) {
      caseQb.andWhere('c.organization_id = :orgId', { orgId: params.organization_id });
    }
    if (params.date_from) {
      caseQb.andWhere('c.created_at >= :dateFrom', { dateFrom: new Date(params.date_from) });
    }
    if (params.date_to) {
      caseQb.andWhere('c.created_at <= :dateTo', { dateTo: new Date(params.date_to) });
    }
    const totalCases = await caseQb.getCount();
    const caseAmountResult = await caseQb
      .select('COALESCE(SUM(c.fee_amount), 0)', 'total_amount')
      .getRawOne();
    const totalContractAmount = Number(caseAmountResult?.total_amount || 0);

    // 实收款合计：通过 payment_records 关联 cases 过滤
    const paymentQb = this.paymentRecordRepository.createQueryBuilder('p');
    paymentQb.leftJoin(Case, 'c', 'c.id = p.case_id');
    if (params.organization_id) {
      paymentQb.andWhere('c.organization_id = :orgId', { orgId: params.organization_id });
    }
    if (params.date_from) {
      paymentQb.andWhere('p.created_at >= :dateFrom', { dateFrom: new Date(params.date_from) });
    }
    if (params.date_to) {
      paymentQb.andWhere('p.created_at <= :dateTo', { dateTo: new Date(params.date_to) });
    }
    const paymentResult = await paymentQb
      .select('COALESCE(SUM(p.amount), 0)', 'total_amount')
      .getRawOne();
    const totalReceived = Number(paymentResult?.total_amount || 0);

    // 待收合计：从 receivables 表的 pending_amount 合计
    const receivableQb = this.receivableRepository.createQueryBuilder('r');
    if (params.organization_id) {
      receivableQb.andWhere('r.organization_id = :orgId', { orgId: params.organization_id });
    }
    if (params.date_from) {
      receivableQb.andWhere('r.created_at >= :dateFrom', { dateFrom: new Date(params.date_from) });
    }
    if (params.date_to) {
      receivableQb.andWhere('r.created_at <= :dateTo', { dateTo: new Date(params.date_to) });
    }
    const receivableResult = await receivableQb
      .select('COALESCE(SUM(r.pending_amount), 0)', 'total_pending')
      .getRawOne();
    const totalPending = Number(receivableResult?.total_pending || 0);

    return {
      type: params.type,
      total_cases: totalCases,
      total_contract_amount: totalContractAmount,
      total_received: totalReceived,
      total_pending: totalPending,
    };
  }

  // 业务类别统计：从 cases 表按 case_type 分组统计
  private async businessCategoryStats(params: {
    organization_id: string;
    type: string;
    date_from?: string;
    date_to?: string;
  }) {
    const qb = this.caseRepository.createQueryBuilder('c');
    qb.select('c.case_type', 'case_type');
    qb.addSelect('COUNT(*)', 'count');
    qb.addSelect('COALESCE(SUM(c.fee_amount), 0)', 'amount');
    if (params.organization_id) {
      qb.andWhere('c.organization_id = :orgId', { orgId: params.organization_id });
    }
    if (params.date_from) {
      qb.andWhere('c.created_at >= :dateFrom', { dateFrom: new Date(params.date_from) });
    }
    if (params.date_to) {
      qb.andWhere('c.created_at <= :dateTo', { dateTo: new Date(params.date_to) });
    }
    qb.groupBy('c.case_type');
    qb.orderBy('count', 'DESC');
    const list = await qb.getRawMany();
    return { type: params.type, list };
  }

  // 案件所属团队统计：从 cases 表按 assignee_lawyer_id 分组统计
  private async teamStats(params: {
    organization_id: string;
    type: string;
    date_from?: string;
    date_to?: string;
  }) {
    const qb = this.caseRepository.createQueryBuilder('c');
    qb.select('c.assignee_lawyer_id', 'assignee_lawyer_id');
    qb.addSelect('COUNT(*)', 'count');
    qb.addSelect('COALESCE(SUM(c.fee_amount), 0)', 'amount');
    if (params.organization_id) {
      qb.andWhere('c.organization_id = :orgId', { orgId: params.organization_id });
    }
    if (params.date_from) {
      qb.andWhere('c.created_at >= :dateFrom', { dateFrom: new Date(params.date_from) });
    }
    if (params.date_to) {
      qb.andWhere('c.created_at <= :dateTo', { dateTo: new Date(params.date_to) });
    }
    qb.groupBy('c.assignee_lawyer_id');
    qb.orderBy('count', 'DESC');
    const list = await qb.getRawMany();
    return { type: params.type, list };
  }
}
