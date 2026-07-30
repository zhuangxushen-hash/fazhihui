import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fee } from './fee.entity';
import { ProfitShare } from './profit-share.entity';
import { Refund, RefundStatus } from './refund.entity';
import { Invoice, InvoiceStatus } from './invoice.entity';
import { CaseCost } from './case-cost.entity';
import { Receivable } from './receivable.entity';
import { FeeRole } from '../types';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(Fee)
    private feeRepository: Repository<Fee>,
    @InjectRepository(ProfitShare)
    private profitShareRepository: Repository<ProfitShare>,
    @InjectRepository(Refund)
    private refundRepository: Repository<Refund>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(CaseCost)
    private caseCostRepository: Repository<CaseCost>,
    @InjectRepository(Receivable)
    private receivableRepository: Repository<Receivable>,
  ) {}

  async createFee(feeData: Partial<Fee>): Promise<Fee> {
    const fee = this.feeRepository.create(feeData);
    return this.feeRepository.save(fee);
  }

  async findFees(orgId: string, caseId?: string): Promise<Fee[]> {
    const query: any = {};
    if (orgId) {
      query.organization_id = orgId;
    }
    if (caseId) {
      query.case_id = caseId;
    }
    return this.feeRepository.find({ where: query });
  }

  async markAsPaid(id: string): Promise<Fee> {
    await this.feeRepository.update(id, { paid: true, paid_at: new Date() });
    return this.feeRepository.findOne({ where: { id } });
  }

  async calculateProfitShare(caseId: string, orgId: string, feeAmount: number, rules: {
    org?: number;
    lawyer?: number;
    sales?: number;
    marketing?: number;
    assistant?: number;
  }): Promise<ProfitShare[]> {
    const shares: ProfitShare[] = [];
    if (rules.org) {
      shares.push(this.profitShareRepository.create({
        case_id: caseId,
        organization_id: orgId,
        role: FeeRole.ORG,
        percentage: rules.org,
        amount: feeAmount * rules.org / 100,
      }));
    }
    if (rules.lawyer) {
      shares.push(this.profitShareRepository.create({
        case_id: caseId,
        organization_id: orgId,
        role: FeeRole.LAWYER,
        percentage: rules.lawyer,
        amount: feeAmount * rules.lawyer / 100,
      }));
    }
    if (rules.sales) {
      shares.push(this.profitShareRepository.create({
        case_id: caseId,
        organization_id: orgId,
        role: FeeRole.SALES,
        percentage: rules.sales,
        amount: feeAmount * rules.sales / 100,
      }));
    }
    if (rules.marketing) {
      shares.push(this.profitShareRepository.create({
        case_id: caseId,
        organization_id: orgId,
        role: FeeRole.MARKETING,
        percentage: rules.marketing,
        amount: feeAmount * rules.marketing / 100,
      }));
    }
    if (rules.assistant) {
      shares.push(this.profitShareRepository.create({
        case_id: caseId,
        organization_id: orgId,
        role: FeeRole.ASSISTANT,
        percentage: rules.assistant,
        amount: feeAmount * rules.assistant / 100,
      }));
    }
    return this.profitShareRepository.save(shares);
  }

  async getProfitShares(orgId: string, caseId?: string): Promise<ProfitShare[]> {
    const query = { organization_id: orgId } as any;
    if (caseId) {
      query.case_id = caseId;
    }
    return this.profitShareRepository.find({ where: query });
  }

  async createRefund(refundData: Partial<Refund>): Promise<Refund> {
    const refund = this.refundRepository.create(refundData);
    return this.refundRepository.save(refund);
  }

  async approveRefund(id: string, approvedBy: string, note?: string): Promise<Refund> {
    await this.refundRepository.update(id, {
      status: RefundStatus.APPROVED,
      approved_by: approvedBy,
      approved_at: new Date(),
      approval_note: note,
    });
    return this.refundRepository.findOne({ where: { id } });
  }

  async rejectRefund(id: string, note?: string): Promise<Refund> {
    await this.refundRepository.update(id, {
      status: RefundStatus.REJECTED,
      approval_note: note,
    });
    return this.refundRepository.findOne({ where: { id } });
  }

  async findRefunds(orgId: string, caseId?: string): Promise<Refund[]> {
    const query: any = {};
    if (orgId) {
      query.organization_id = orgId;
    }
    if (caseId) {
      query.case_id = caseId;
    }
    return this.refundRepository.find({ where: query });
  }

  async createInvoice(invoiceData: Partial<Invoice>): Promise<Invoice> {
    const invoice = this.invoiceRepository.create(invoiceData);
    return this.invoiceRepository.save(invoice);
  }

  async findInvoices(orgId: string, caseId?: string, status?: string): Promise<Invoice[]> {
    const query: any = {};
    if (orgId) {
      query.organization_id = orgId;
    }
    if (caseId) {
      query.case_id = caseId;
    }
    if (status) {
      query.status = status;
    }
    return this.invoiceRepository.find({ where: query });
  }

  async issueInvoice(id: string, invoiceNo: string): Promise<Invoice> {
    await this.invoiceRepository.update(id, {
      status: InvoiceStatus.ISSUED,
      invoice_no: invoiceNo,
      issue_date: new Date(),
    });
    return this.invoiceRepository.findOne({ where: { id } });
  }

  async markInvoicePaid(id: string): Promise<Invoice> {
    await this.invoiceRepository.update(id, {
      status: InvoiceStatus.PAID,
    });
    return this.invoiceRepository.findOne({ where: { id } });
  }

  async cancelInvoice(id: string, note?: string): Promise<Invoice> {
    await this.invoiceRepository.update(id, {
      status: InvoiceStatus.CANCELLED,
      notes: note,
    });
    return this.invoiceRepository.findOne({ where: { id } });
  }

  async calculateTieredRefund(caseId: string, orgId: string): Promise<{
    case_id: string;
    total_fee: number;
    tiered_refunds: Array<{
      tier: string;
      range_min: number;
      range_max: number;
      refund_rate: number;
      refund_amount: number;
    }>;
    total_refund: number;
  }> {
    const fees = await this.feeRepository.find({
      where: { case_id: caseId, organization_id: orgId },
    });

    const totalFee = fees.reduce((sum, f) => sum + Number(f.amount), 0);

    const tierRules = [
      { tier: '10万以下', range_min: 0, range_max: 100000, refund_rate: 0 },
      { tier: '10万-30万', range_min: 100000, range_max: 300000, refund_rate: 10 },
      { tier: '30万-50万', range_min: 300000, range_max: 500000, refund_rate: 20 },
      { tier: '50万-100万', range_min: 500000, range_max: 1000000, refund_rate: 30 },
      { tier: '100万以上', range_min: 1000000, range_max: Infinity, refund_rate: 40 },
    ];

    const tieredRefunds: Array<{
      tier: string;
      range_min: number;
      range_max: number;
      refund_rate: number;
      refund_amount: number;
    }> = [];

    let totalRefund = 0;
    let lowerBound = 0;

    for (const rule of tierRules) {
      const rangeMin = Math.max(rule.range_min, lowerBound);
      if (totalFee > rangeMin) {
        const taxableAmount = Math.min(totalFee, rule.range_max) - rangeMin;
        const refundAmount = (taxableAmount * rule.refund_rate) / 100;
        totalRefund += refundAmount;

        tieredRefunds.push({
          tier: rule.tier,
          range_min: rule.range_min,
          range_max: rule.range_max === Infinity ? -1 : rule.range_max,
          refund_rate: rule.refund_rate,
          refund_amount: Math.round(refundAmount * 100) / 100,
        });

        lowerBound = rule.range_max;
      }
    }

    totalRefund = Math.round(totalRefund * 100) / 100;

    return {
      case_id: caseId,
      total_fee: totalFee,
      tiered_refunds: tieredRefunds,
      total_refund: totalRefund,
    };
  }

  async getCaseProfitAnalysis(caseId: string): Promise<{
    case_id: string;
    total_revenue: number;
    total_cost: number;
    total_profit_share: number;
    net_profit: number;
    profit_margin: number;
    fee_details: Array<{ id: string; amount: number; description: string; created_at: Date }>;
    cost_details: Array<{ id: string; cost_type: string; amount: number; description: string }>;
    profit_share_details: Array<{ id: string; role: string; percentage: number; amount: number }>;
  }> {
    const fees = await this.feeRepository.find({
      where: { case_id: caseId },
    });

    const totalRevenue = fees.reduce((sum, f) => sum + Number(f.amount), 0);

    const costs = await this.caseCostRepository.find({
      where: { case_id: caseId },
    });

    const totalCost = costs.reduce((sum, c) => sum + Number(c.amount), 0);

    const profitShares = await this.profitShareRepository.find({
      where: { case_id: caseId },
    });

    const totalProfitShare = profitShares.reduce((sum, ps) => sum + Number(ps.amount), 0);

    const netProfit = totalRevenue - totalCost - totalProfitShare;
    const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 10000) / 100 : 0;

    return {
      case_id: caseId,
      total_revenue: totalRevenue,
      total_cost: totalCost,
      total_profit_share: totalProfitShare,
      net_profit: Math.round(netProfit * 100) / 100,
      profit_margin: profitMargin,
      fee_details: fees.map(f => ({
        id: f.id,
        amount: Number(f.amount),
        description: f.description,
        created_at: f.created_at,
      })),
      cost_details: costs.map(c => ({
        id: c.id,
        cost_type: c.cost_type,
        amount: Number(c.amount),
        description: c.description,
      })),
      profit_share_details: profitShares.map(ps => ({
        id: ps.id,
        role: ps.role,
        percentage: Number(ps.percentage),
        amount: Number(ps.amount),
      })),
    };
  }

  async getProfitAnalysisStats(orgId: string): Promise<{
    total_revenue: number;
    total_cost: number;
    total_profit: number;
    average_profit_margin: number;
    case_count: number;
    profitable_cases: number;
    loss_cases: number;
  }> {
    const fees = await this.feeRepository.find({
      where: { organization_id: orgId },
    });
    const totalRevenue = fees.reduce((sum, f) => sum + Number(f.amount), 0);

    const costs = await this.caseCostRepository.find({
      where: { organization_id: orgId },
    });
    const totalCost = costs.reduce((sum, c) => sum + Number(c.amount), 0);

    const profitShares = await this.profitShareRepository.find({
      where: { organization_id: orgId },
    });
    const totalProfitShare = profitShares.reduce((sum, ps) => sum + Number(ps.amount), 0);

    const receivables = await this.receivableRepository.find({
      where: { organization_id: orgId },
    });

    const caseIds = new Set<string>();
    fees.forEach(f => caseIds.add(f.case_id));
    receivables.forEach(r => caseIds.add(r.case_id));
    const caseCount = caseIds.size;

    const totalProfit = totalRevenue - totalCost - totalProfitShare;
    const avgMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 10000) / 100 : 0;

    const profitableCases = receivables.filter(r => {
      const revenue = Number(r.contract_amount);
      const caseCosts = costs.filter(c => c.case_id === r.case_id).reduce((s, c) => s + Number(c.amount), 0);
      return revenue - caseCosts > 0;
    }).length;

    const lossCases = caseCount - profitableCases;

    return {
      total_revenue: totalRevenue,
      total_cost: totalCost,
      total_profit: Math.round(totalProfit * 100) / 100,
      average_profit_margin: avgMargin,
      case_count: caseCount,
      profitable_cases: profitableCases,
      loss_cases: lossCases,
    };
  }
}
