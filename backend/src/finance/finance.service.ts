import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Fee } from './fee.entity';
import { ProfitShare } from './profit-share.entity';
import { Refund, RefundStatus } from './refund.entity';
import { Invoice, InvoiceStatus } from './invoice.entity';
import { CaseCost } from './case-cost.entity';
import { Receivable, ReceivableStatus } from './receivable.entity';
import { BusinessFund } from './business-fund.entity';
import { PaymentRecord, PaymentStatus, PaymentMethod } from './payment-record.entity';
import { Case } from '../case/case.entity';
import { CommissionService } from './commission.service';
import { FeeRole } from '../types';
// Phase5+6 M8: 注入审计服务，财务核心操作记录审计日志
import { AuditService } from '../audit/audit.service';

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
    @InjectRepository(BusinessFund)
    private businessFundRepository: Repository<BusinessFund>,
    @InjectRepository(PaymentRecord)
    private paymentRecordRepository: Repository<PaymentRecord>,
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    private dataSource: DataSource,
    private commissionService: CommissionService,
    // Phase5+6 M8: 注入审计服务
    private auditService: AuditService,
  ) {}

  // 合并后：费用统一写入 BusinessFund 表（type='income', category='lawyer_fee'）
  async createFee(feeData: Partial<Fee>): Promise<BusinessFund> {
    const fund = this.businessFundRepository.create({
      case_id: feeData.case_id || null,
      type: 'income',
      category: 'lawyer_fee',
      amount: Number(feeData.amount) || 0,
      payer: '客户',
      payee: '律所',
      payment_date: new Date(),
      payment_method: feeData.payment_method || null,
      remarks: feeData.description || '',
      account_status: feeData.paid ? 'accounted' : 'pending',
      account_time: feeData.paid ? (feeData.paid_at || new Date()) : null,
      organization_id: feeData.organization_id || '',
    });
    return this.businessFundRepository.save(fund);
  }

  // 查询费用：合并后从 BusinessFund 表查询（type='income'）
  async findFees(orgId: string, caseId?: string): Promise<BusinessFund[]> {
    const query: any = { type: 'income' };
    if (orgId) {
      query.organization_id = orgId;
    }
    if (caseId) {
      query.case_id = caseId;
    }
    return this.businessFundRepository.find({ where: query, order: { updated_at: 'DESC' } });
  }

  // 标记已付：合并后更新 BusinessFund 的 account_status
  async markAsPaid(id: string): Promise<BusinessFund> {
    const fund = await this.businessFundRepository.findOne({ where: { id } });
    if (!fund) return null;
    fund.account_status = 'accounted';
    fund.account_time = new Date();
    return this.businessFundRepository.save(fund);
  }

  /**
   * 登记收款（关联应收台账 → 创建支付记录 → 汇总回款到案件 → 触发分润）
   * @param receivableId 应收台账ID
   * @param amount       本次收款金额（>0）
   * @param method       支付方式 alipay/wechat/bank
   * @param transactionId 第三方流水号（可空）
   * @param remarks      备注（可空）
   * @param clientId     客户ID（可空，不填用 'pending'）
   */
  async recordPayment(
    receivableId: string,
    amount: number,
    method: PaymentMethod = PaymentMethod.BANK,
    transactionId?: string,
    remarks?: string,
    clientId?: string,
  ): Promise<PaymentRecord> {
    if (!amount || Number(amount) <= 0) {
      throw new BadRequestException('收款金额必须大于0');
    }
    const savedPaymentResult = await this.dataSource.transaction(async (manager) => {
      const receivable = await manager.findOne(Receivable, { where: { id: receivableId } });
      if (!receivable) {
        throw new NotFoundException('应收台账不存在');
      }

      // 1. 创建支付记录（默认 PAID，因为是登记收款）
      const payment = manager.create(PaymentRecord, {
        case_id: receivable.case_id,
        client_id: clientId || 'pending',
        amount: Number(amount),
        status: PaymentStatus.PAID,
        method: method,
        transaction_id: transactionId,
        remarks: remarks,
      });
      const savedPayment = await manager.save(PaymentRecord, payment);

      // 2. 更新应收台账 received + pending
      const newReceived = Number(receivable.received_amount || 0) + Number(amount);
      const newPending = Math.max(Number(receivable.contract_amount || 0) - newReceived, 0);
      let newStatus: string = ReceivableStatus.PENDING;
      if (newReceived >= Number(receivable.contract_amount) && Number(receivable.contract_amount) > 0) {
        newStatus = ReceivableStatus.COMPLETED;
      } else if (newReceived > 0) {
        newStatus = ReceivableStatus.PARTIAL;
      }
      await manager.update(Receivable, receivableId, {
        received_amount: newReceived,
        pending_amount: newPending,
        status: newStatus as any,
      });

      // 3. 汇总该案件已支付的 payment_records 金额 → 回写 case.fee_collected & settled_amount
      if (receivable.case_id) {
        const casePaidRecords = await manager.find(PaymentRecord, {
          where: { case_id: receivable.case_id, status: PaymentStatus.PAID },
        });
        let totalPaid = 0;
        for (const r of casePaidRecords) totalPaid += Number(r.amount) || 0;
        await manager.update(Case, receivable.case_id, {
          fee_collected: totalPaid,
          settled_amount: totalPaid,
        });

        // 4. 若应收变为 completed → 触发分润检查
        if (newStatus === ReceivableStatus.COMPLETED) {
          try {
            await this.commissionService.checkAndTriggerCommission({ case_id: receivable.case_id });
          } catch (err) {
            // 分润失败不影响主流程，直接吞掉异常
          }
        }
      }

      return savedPayment;
    });

    // Phase5+6 M8: 登记收款审计日志（事务成功后记录，异常静默不影响主流程）
    try {
      await this.auditService.logAction({
        user_id: clientId || undefined,
        action: '登记收款',
        resource_type: 'Receivable',
        resource_id: receivableId,
        detail: `金额:${amount}, 方式:${method}, 流水号:${transactionId || '-'}`,
      });
    } catch (e) {
      // 审计失败不影响主业务
    }

    return savedPaymentResult;
  }

  /**
   * Task18: 查询收款记录列表
   * PaymentRecord 无 organization_id 字段，通过关联 Case 表按组织筛选，支持按案件筛选
   */
  async findPayments(orgId: string, caseId?: string): Promise<PaymentRecord[]> {
    const qb = this.paymentRecordRepository.createQueryBuilder('pr')
      .leftJoin(Case, 'c', 'c.id = pr.case_id')
      .where('c.organization_id = :orgId', { orgId });
    if (caseId) {
      qb.andWhere('pr.case_id = :caseId', { caseId });
    }
    qb.orderBy('pr.updated_at', 'DESC');
    return qb.getMany();
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
    const savedShares = await this.profitShareRepository.save(shares);

    // Phase5+6 M8: 利润分配审计日志（异常静默不影响主流程）
    try {
      await this.auditService.logAction({
        user_id: undefined,
        action: '利润分配',
        resource_type: 'ProfitShare',
        resource_id: caseId,
        detail: `案件:${caseId}, 分配基数:${feeAmount}, 机构:${rules.org || 0}%, 律师:${rules.lawyer || 0}%, 销售:${rules.sales || 0}%, 市场:${rules.marketing || 0}%, 助理:${rules.assistant || 0}%`,
      });
    } catch (e) {
      // 审计失败不影响主业务
    }

    return savedShares;
  }

  async getProfitShares(orgId: string, caseId?: string): Promise<ProfitShare[]> {
    const query = { organization_id: orgId } as any;
    if (caseId) {
      query.case_id = caseId;
    }
    return this.profitShareRepository.find({ where: query, order: { updated_at: 'DESC' } });
  }

  async createRefund(refundData: Partial<Refund>): Promise<Refund> {
    const refund = this.refundRepository.create(refundData);
    return this.refundRepository.save(refund);
  }

  async approveRefund(id: string, approvedBy: string, note?: string): Promise<Refund> {
    return this.dataSource.transaction(async (manager) => {
      const refund = await manager.findOne(Refund, { where: { id } });
      if (!refund) {
        throw new NotFoundException('退费记录不存在');
      }

      await manager.update(Refund, id, {
        status: RefundStatus.APPROVED,
        approved_by: approvedBy,
        approved_at: new Date(),
        approval_note: note,
      });

      const receivable = await manager.findOne(Receivable, {
        where: { case_id: refund.case_id },
      });

      if (receivable) {
        const refundAmount = Number(refund.amount) || 0;
        const newReceived = Math.max(Number(receivable.received_amount || 0) - refundAmount, 0);
        const newPending = Number(receivable.pending_amount || 0) + refundAmount;
        let newStatus = receivable.status;
        if (newReceived <= 0 && newPending > 0) {
          newStatus = ReceivableStatus.PENDING;
        } else if (newPending <= 0) {
          newStatus = ReceivableStatus.COMPLETED;
        } else {
          newStatus = ReceivableStatus.PARTIAL;
        }
        await manager.update(Receivable, receivable.id, {
          received_amount: newReceived,
          pending_amount: newPending,
          status: newStatus,
        });
      }

      return manager.findOne(Refund, { where: { id } });
    });
  }

  async rejectRefund(id: string, note?: string): Promise<Refund> {
    await this.refundRepository.update(id, {
      status: RefundStatus.REJECTED,
      approval_note: note,
    });
    return this.refundRepository.findOne({ where: { id } });
  }

  /**
   * 退款打款完成：将状态从 approved 流转到 paid，并记录打款操作人和时间
   */
  async payRefund(id: string, operatorId?: string, note?: string): Promise<Refund> {
    const refund = await this.refundRepository.findOne({ where: { id } });
    if (!refund) {
      throw new NotFoundException('退费记录不存在');
    }
    if (refund.status !== RefundStatus.APPROVED) {
      throw new BadRequestException('仅已审核通过的退费记录可以打款');
    }
    await this.refundRepository.update(id, {
      status: RefundStatus.PAID,
      paid_by: operatorId,
      paid_at: new Date(),
      approval_note: note || refund.approval_note,
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
    return this.refundRepository.find({ where: query, order: { updated_at: 'DESC' } });
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
    return this.invoiceRepository.find({ where: query, order: { updated_at: 'DESC' } });
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
    const fees = await this.businessFundRepository.find({
      where: { case_id: caseId, organization_id: orgId, type: 'income' },
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
    const fees = await this.businessFundRepository.find({
      where: { case_id: caseId, type: 'income' },
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
        description: f.remarks || '',
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
    const fees = await this.businessFundRepository.find({
      where: { organization_id: orgId, type: 'income' },
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

  // 辅助方法：根据ID查询应收台账（含organization_id）
  async findReceivableById(id: string): Promise<Receivable | null> {
    return this.receivableRepository.findOne({ where: { id } });
  }

  // 辅助方法：根据ID查询费用/业务款记录（含organization_id）
  async findBusinessFundById(id: string): Promise<BusinessFund | null> {
    return this.businessFundRepository.findOne({ where: { id } });
  }

  // 辅助方法：根据ID查询退款记录（含organization_id）
  async findRefundById(id: string): Promise<Refund | null> {
    return this.refundRepository.findOne({ where: { id } });
  }

  // 辅助方法：根据ID查询发票记录（含organization_id）
  async findInvoiceById(id: string): Promise<Invoice | null> {
    return this.invoiceRepository.findOne({ where: { id } });
  }

  // 退还质保金
  async refundQualityDeposit(businessFundId: string, refundAmount: number): Promise<BusinessFund> {
    const fund = await this.businessFundRepository.findOne({ where: { id: businessFundId } });
    if (!fund) throw new NotFoundException('业务款记录不存在');
    if (!fund.quality_deposit || fund.quality_deposit <= 0) throw new BadRequestException('该记录无质保金可退还');
    if (refundAmount > fund.quality_deposit) throw new BadRequestException('退还金额不能超过质保金金额');

    // 更新质保金余额（减去退还金额）
    fund.quality_deposit = fund.quality_deposit - refundAmount;
    // 记录退还信息到分账记录
    const allocationRecords = fund.allocation_records ? JSON.parse(fund.allocation_records) : [];
    allocationRecords.push({ role: 'quality_deposit_refund', amount: refundAmount, time: new Date().toISOString() });
    fund.allocation_records = JSON.stringify(allocationRecords);

    return this.businessFundRepository.save(fund);
  }
}
