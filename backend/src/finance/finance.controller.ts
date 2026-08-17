import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceService } from './finance.service';
import { Invoice } from './invoice.entity';
import { Fee } from './fee.entity';
import { BusinessFund } from './business-fund.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';
import { PaymentReminderService } from './payment-reminder.service';
import { InvoiceService } from './invoice.service';
import { BusinessFundService } from './business-fund.service';
import { PaymentMethod } from './payment-record.entity';

@Controller('finance')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.FINANCE)
export class FinanceController {
  constructor(
    private financeService: FinanceService,
    private paymentReminderService: PaymentReminderService,
    private invoiceService: InvoiceService,
    private businessFundService: BusinessFundService,
    // 追加注入 Fee 和 BusinessFund Repository 用于收支综合查询
    @InjectRepository(Fee)
    private readonly feeRepository: Repository<Fee>,
    @InjectRepository(BusinessFund)
    private readonly businessFundRepository: Repository<BusinessFund>,
  ) {}

  @Post('fee')
  createFee(
    @Body() body: { case_id: string; amount: number; organization_id: string; description?: string },
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    const finalBody = { ...body };
    if (organizationId) {
      finalBody.organization_id = organizationId;
    }
    return this.financeService.createFee(finalBody);
  }

  @Get('fees')
  findFees(@Query('org_id') orgId: string, @Query('case_id') caseId?: string, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.financeService.findFees(finalOrgId, caseId);
  }

  @Put('fee/:id/paid')
  async markAsPaid(@Param('id') id: string, @Request() req?: any) {
    const organizationId = req?.user?.organization_id;
    const existing = await this.financeService.findBusinessFundById(id);
    if (!existing) throw new NotFoundException('费用记录不存在');
    if (organizationId && existing.organization_id !== organizationId) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.financeService.markAsPaid(id);
  }

  // 13.8 缺口7: 撤销费用（仅有效记录可撤销）
  @Put('fee/:id/void')
  async voidFee(@Param('id') id: string, @Body() body: { reason?: string }, @Request() req?: any) {
    const organizationId = req?.user?.organization_id;
    const existing = await this.financeService.findBusinessFundById(id);
    if (!existing) throw new NotFoundException('费用记录不存在');
    if (organizationId && existing.organization_id !== organizationId) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.financeService.voidFee(id, body?.reason);
  }

  // 13.8 缺口7: 红冲费用（生成负数冲销记录）
  @Post('fee/:id/red-flush')
  async redFlushFee(@Param('id') id: string, @Body() body: { reason?: string }, @Request() req?: any) {
    const organizationId = req?.user?.organization_id;
    const existing = await this.financeService.findBusinessFundById(id);
    if (!existing) throw new NotFoundException('费用记录不存在');
    if (organizationId && existing.organization_id !== organizationId) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.financeService.redFlushFee(id, body?.reason);
  }

  @Post('profit-share')
  calculateProfitShare(
    @Body() body: {
      case_id: string;
      organization_id: string;
      fee_amount: number;
      rules: {
        org?: number;
        lawyer?: number;
        sales?: number;
        marketing?: number;
        assistant?: number;
      };
    },
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    const finalOrgId = organizationId || body.organization_id;
    return this.financeService.calculateProfitShare(body.case_id, finalOrgId, body.fee_amount, body.rules);
  }

  @Get('profit-share')
  getProfitShares(@Query('org_id') orgId: string, @Query('case_id') caseId?: string, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.financeService.getProfitShares(finalOrgId, caseId);
  }

  @Post('refund')
  createRefund(
    @Body() body: {
      case_id: string;
      organization_id: string;
      amount: number;
      reason: string;
      fee_id?: string;
      evidence_files?: string;
    },
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    const finalBody = { ...body };
    if (organizationId) {
      finalBody.organization_id = organizationId;
    }
    return this.financeService.createRefund(finalBody);
  }

  @Put('refund/:id/approve')
  async approveRefund(
    @Param('id') id: string,
    @Body() body: { approved_by: string; note?: string },
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    const existing = await this.financeService.findRefundById(id);
    if (!existing) throw new NotFoundException('退款记录不存在');
    if (organizationId && existing.organization_id !== organizationId) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.financeService.approveRefund(id, body.approved_by, body.note);
  }

  @Put('refund/:id/reject')
  async rejectRefund(
    @Param('id') id: string,
    @Body() body: { note?: string },
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    const existing = await this.financeService.findRefundById(id);
    if (!existing) throw new NotFoundException('退款记录不存在');
    if (organizationId && existing.organization_id !== organizationId) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.financeService.rejectRefund(id, body.note);
  }

  // 退款打款完成：审核通过后执行打款，状态流转为 paid
  @Put('refund/:id/pay')
  async payRefund(
    @Param('id') id: string,
    @Body() body: { note?: string },
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    const existing = await this.financeService.findRefundById(id);
    if (!existing) throw new NotFoundException('退款记录不存在');
    if (organizationId && existing.organization_id !== organizationId) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.financeService.payRefund(id, req?.user?.id, body.note);
  }

  @Get('refunds')
  findRefunds(@Query('org_id') orgId: string, @Query('case_id') caseId?: string, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.financeService.findRefunds(finalOrgId, caseId);
  }

  @Post('invoice')
  createInvoice(
    @Body() body: Partial<Invoice>,
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    const finalBody = { ...body };
    if (organizationId) {
      finalBody.organization_id = organizationId;
    }
    return this.financeService.createInvoice(finalBody);
  }

  @Get('invoices')
  findInvoices(
    @Query('org_id') orgId: string,
    @Query('case_id') caseId?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('keyword') keyword?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    // 如果传了新筛选参数（type/keyword/date），使用 InvoiceService 查询
    if (type || keyword || startDate || endDate) {
      return this.invoiceService.findAll(finalOrgId, { type, status, keyword, startDate, endDate });
    }
    // 保留原有逻辑
    return this.financeService.findInvoices(finalOrgId, caseId, status);
  }

  @Put('invoice/:id/issue')
  async issueInvoice(
    @Param('id') id: string,
    @Body() body: { invoice_no: string },
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    const existing = await this.financeService.findInvoiceById(id);
    if (!existing) throw new NotFoundException('发票记录不存在');
    if (organizationId && existing.organization_id !== organizationId) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.financeService.issueInvoice(id, body.invoice_no);
  }

  @Put('invoice/:id/paid')
  async markInvoicePaid(@Param('id') id: string, @Request() req?: any) {
    const organizationId = req?.user?.organization_id;
    const existing = await this.financeService.findInvoiceById(id);
    if (!existing) throw new NotFoundException('发票记录不存在');
    if (organizationId && existing.organization_id !== organizationId) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.financeService.markInvoicePaid(id);
  }

  @Put('invoice/:id/cancel')
  async cancelInvoice(
    @Param('id') id: string,
    @Body() body?: { note?: string },
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    const existing = await this.financeService.findInvoiceById(id);
    if (!existing) throw new NotFoundException('发票记录不存在');
    if (organizationId && existing.organization_id !== organizationId) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.financeService.cancelInvoice(id, body?.note);
  }

  @Post('receivables/:id/record-payment')
  async recordPayment(
    @Param('id') id: string,
    @Body() body: { amount: number; method?: PaymentMethod; transaction_id?: string; remarks?: string; client_id?: string },
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    const existing = await this.financeService.findReceivableById(id);
    if (!existing) throw new NotFoundException('应收台账不存在');
    if (organizationId && existing.organization_id !== organizationId) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.financeService.recordPayment(
      id,
      body.amount,
      body.method || PaymentMethod.BANK,
      body.transaction_id,
      body.remarks,
      body.client_id,
    );
  }

  // ========== Task18: 收款记录独立接口 ==========

  /**
   * Task18: 创建收款记录
   * 复用 FinanceService.recordPayment：累加 receivable.paid_amount，
   * 全款到账时 receivable.status=PAID + case.fee_collected 回写 + 触发分润
   */
  @Post('payment-records')
  async createPaymentRecord(
    @Body() body: {
      receivable_id: string;
      amount: number;
      method?: PaymentMethod;
      transaction_id?: string;
      remarks?: string;
      client_id?: string;
    },
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    const existing = await this.financeService.findReceivableById(body.receivable_id);
    if (!existing) throw new NotFoundException('应收台账不存在');
    if (organizationId && existing.organization_id !== organizationId) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.financeService.recordPayment(
      body.receivable_id,
      body.amount,
      body.method || PaymentMethod.BANK,
      body.transaction_id,
      body.remarks,
      body.client_id,
    );
  }

  /**
   * Task18: 查询收款记录列表
   * 支持按组织和案件筛选
   */
  @Get('payment-records')
  async findPaymentRecords(
    @Query('org_id') orgId: string,
    @Query('case_id') caseId?: string,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.financeService.findPayments(finalOrgId, caseId);
  }

  @Post('refund/tiered-calculate')
  async calculateTieredRefund(
    @Body() body: { case_id: string; organization_id?: string },
    @Request() req?: any,
  ) {
    const orgId = body.organization_id || req?.user?.organization_id;
    return this.financeService.calculateTieredRefund(body.case_id, orgId);
  }

  @Get('case-profit/:caseId')
  async getCaseProfitAnalysis(@Param('caseId') caseId: string) {
    return this.financeService.getCaseProfitAnalysis(caseId);
  }

  @Get('profit-stats')
  async getProfitAnalysisStats(@Query('org_id') orgId: string, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.financeService.getProfitAnalysisStats(finalOrgId);
  }

  // ========== 催款管理接口 ==========

  @Post('payment-reminders')
  async createPaymentReminder(@Body() body: any, @Request() req: any) {
    return this.paymentReminderService.create({
      ...body,
      organization_id: body.organization_id || req?.user?.organization_id,
    });
  }

  @Get('payment-reminders')
  async findPaymentReminders(
    @Query('org_id') orgId: string,
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.paymentReminderService.findAll(finalOrgId, status, keyword);
  }

  @Put('payment-reminders/:id')
  async updatePaymentReminder(@Param('id') id: string, @Body() body: any, @Request() req?: any) {
    const organizationId = req?.user?.organization_id;
    const existing = await this.paymentReminderService.findOne(id);
    if (!existing) throw new NotFoundException('催款记录不存在');
    if (organizationId && existing.organization_id !== organizationId) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.paymentReminderService.update(id, body);
  }

  @Delete('payment-reminders/:id')
  async removePaymentReminder(@Param('id') id: string, @Request() req?: any) {
    const organizationId = req?.user?.organization_id;
    const existing = await this.paymentReminderService.findOne(id);
    if (!existing) throw new NotFoundException('催款记录不存在');
    if (organizationId && existing.organization_id !== organizationId) {
      throw new ForbiddenException('无权访问该资源');
    }
    await this.paymentReminderService.remove(id);
    return { message: '删除成功' };
  }

  @Put('payment-reminders/:id/remind')
  async remindPaymentReminder(@Param('id') id: string, @Request() req?: any) {
    const organizationId = req?.user?.organization_id;
    const existing = await this.paymentReminderService.findOne(id);
    if (!existing) throw new NotFoundException('催款记录不存在');
    if (organizationId && existing.organization_id !== organizationId) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.paymentReminderService.remind(id, req?.user?.id);
  }

  @Put('payment-reminders/:id/paid')
  async markPaidPaymentReminder(@Param('id') id: string, @Request() req?: any) {
    const organizationId = req?.user?.organization_id;
    const existing = await this.paymentReminderService.findOne(id);
    if (!existing) throw new NotFoundException('催款记录不存在');
    if (organizationId && existing.organization_id !== organizationId) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.paymentReminderService.markPaid(id);
  }

  @Put('payment-reminders/:id/give-up')
  async giveUpPaymentReminder(@Param('id') id: string, @Request() req?: any) {
    const organizationId = req?.user?.organization_id;
    const existing = await this.paymentReminderService.findOne(id);
    if (!existing) throw new NotFoundException('催款记录不存在');
    if (organizationId && existing.organization_id !== organizationId) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.paymentReminderService.giveUp(id);
  }

  // ========== 发票管理增强接口 ==========

  @Post('invoices')
  async createInvoiceV2(@Body() body: any, @Request() req: any) {
    return this.invoiceService.create({
      ...body,
      organization_id: body.organization_id || req?.user?.organization_id,
    });
  }

  @Put('invoices/:id')
  async updateInvoiceV2(@Param('id') id: string, @Body() body: any, @Request() req?: any) {
    const organizationId = req?.user?.organization_id;
    const existing = await this.invoiceService.findOne(id);
    if (!existing) throw new NotFoundException('发票记录不存在');
    if (organizationId && existing.organization_id !== organizationId) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.invoiceService.update(id, body);
  }

  @Delete('invoices/:id')
  async removeInvoiceV2(@Param('id') id: string, @Request() req?: any) {
    const organizationId = req?.user?.organization_id;
    const existing = await this.invoiceService.findOne(id);
    if (!existing) throw new NotFoundException('发票记录不存在');
    if (organizationId && existing.organization_id !== organizationId) {
      throw new ForbiddenException('无权访问该资源');
    }
    await this.invoiceService.remove(id);
    return { message: '删除成功' };
  }

  @Put('invoices/:id/void')
  async voidInvoiceV2(@Param('id') id: string, @Body() body: { reason: string }, @Request() req?: any) {
    const organizationId = req?.user?.organization_id;
    const existing = await this.invoiceService.findOne(id);
    if (!existing) throw new NotFoundException('发票记录不存在');
    if (organizationId && existing.organization_id !== organizationId) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.invoiceService.void(id, body.reason);
  }

  @Put('invoices/:id/red-flush')
  async redFlushInvoiceV2(@Param('id') id: string, @Request() req?: any) {
    const organizationId = req?.user?.organization_id;
    const existing = await this.invoiceService.findOne(id);
    if (!existing) throw new NotFoundException('发票记录不存在');
    if (organizationId && existing.organization_id !== organizationId) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.invoiceService.redFlush(id);
  }

  // 退款发票
  @Put('invoices/:id/refund')
  async refundInvoice(
    @Param('id') id: string,
    @Body() body: { amount: number; date: string },
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    const existing = await this.invoiceService.findOne(id);
    if (!existing) throw new NotFoundException('发票记录不存在');
    if (organizationId && existing.organization_id !== organizationId) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.invoiceService.refundInvoice(id, body.amount, body.date);
  }

  // 调账发票
  @Put('invoices/:id/adjust')
  async adjustInvoice(
    @Param('id') id: string,
    @Body() body: { reason: string; amount: number; operator_id: string },
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    const existing = await this.invoiceService.findOne(id);
    if (!existing) throw new NotFoundException('发票记录不存在');
    if (organizationId && existing.organization_id !== organizationId) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.invoiceService.adjustInvoice(id, body);
  }

  // ========== 业务款管理接口 ==========

  @Post('business-funds')
  async createBusinessFund(@Body() body: any, @Request() req: any) {
    return this.businessFundService.create({
      ...body,
      organization_id: body.organization_id || req?.user?.organization_id,
    });
  }

  @Get('business-funds')
  async findBusinessFunds(
    @Query('org_id') orgId: string,
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('keyword') keyword?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.businessFundService.findAll(finalOrgId, {
      type,
      category,
      keyword,
      startDate,
      endDate,
    });
  }

  @Put('business-funds/:id')
  async updateBusinessFund(@Param('id') id: string, @Body() body: any, @Request() req?: any) {
    const organizationId = req?.user?.organization_id;
    const existing = await this.businessFundService.findOne(id);
    if (!existing) throw new NotFoundException('业务款记录不存在');
    if (organizationId && existing.organization_id !== organizationId) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.businessFundService.update(id, body);
  }

  @Delete('business-funds/:id')
  async removeBusinessFund(@Param('id') id: string, @Request() req?: any) {
    const organizationId = req?.user?.organization_id;
    const existing = await this.businessFundService.findOne(id);
    if (!existing) throw new NotFoundException('业务款记录不存在');
    if (organizationId && existing.organization_id !== organizationId) {
      throw new ForbiddenException('无权访问该资源');
    }
    await this.businessFundService.remove(id);
    return { message: '删除成功' };
  }

  @Get('business-funds/stats')
  async getBusinessFundStats(
    @Query('org_id') orgId: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.businessFundService.getStats(finalOrgId, { startDate, endDate });
  }

  // 入账
  @Put('business-funds/:id/account')
  async accountBusinessFund(@Param('id') id: string, @Request() req?: any) {
    const organizationId = req?.user?.organization_id;
    const existing = await this.businessFundService.findOne(id);
    if (!existing) throw new NotFoundException('业务款记录不存在');
    if (organizationId && existing.organization_id !== organizationId) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.businessFundService.accountFund(id);
  }

  // 分账
  @Put('business-funds/:id/allocate')
  async allocateBusinessFund(
    @Param('id') id: string,
    @Body() body: { records: Array<{ role: string; amount: number }> },
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    const existing = await this.businessFundService.findOne(id);
    if (!existing) throw new NotFoundException('业务款记录不存在');
    if (organizationId && existing.organization_id !== organizationId) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.businessFundService.allocateFund(id, body.records);
  }

  // 税费分摊
  @Put('business-funds/:id/tax-share')
  async taxShareBusinessFund(
    @Param('id') id: string,
    @Body() body: { amount: number },
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    const existing = await this.businessFundService.findOne(id);
    if (!existing) throw new NotFoundException('业务款记录不存在');
    if (organizationId && existing.organization_id !== organizationId) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.businessFundService.taxShareFund(id, body.amount);
  }

  // 退还质保金
  @Put('business-funds/:id/refund-deposit')
  async refundQualityDeposit(
    @Param('id') id: string,
    @Body() body: { refund_amount: number },
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    const existing = await this.businessFundService.findOne(id);
    if (!existing) throw new NotFoundException('业务款记录不存在');
    if (organizationId && existing.organization_id !== organizationId) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.financeService.refundQualityDeposit(id, body.refund_amount);
  }

  // ========== 收支综合查询接口 ==========

  /**
   * 收支综合查询
   * 合并后：收入和支出统一从 business_funds 表查询，以 type 区分
   * type='income' 查询收入（business_funds 表 type='income'）
   * type='expense' 查询支出（business_funds 表 type='expense'）
   * type='borrowing' 查询借款（business_funds 表 type='borrowing'）
   * type='repayment' 查询还款（business_funds 表 type='repayment'）
   * 无 type 时查询全部并合并返回
   */
  @Get('income-expenditure')
  async findIncomeExpenditure(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
    @Query('type') type: string,
    @Query('date_from') dateFrom: string,
    @Query('date_to') dateTo: string,
    @Request() req: any,
  ) {
    const orgId = req?.user?.organization_id;
    const pageNum = parseInt(page) || 1;
    const pageSizeNum = parseInt(pageSize) || 10;

    const list: any[] = [];
    let totalIncome = 0;
    let totalExpense = 0;

    // 收入：合并后从 business_funds 表查询（type='income'）
    const queryIncome = !type || type === 'income';
    if (queryIncome) {
      const qb = this.businessFundRepository.createQueryBuilder('f');
      qb.andWhere('f.type = :fundType', { fundType: 'income' });
      if (orgId) {
        qb.andWhere('f.organization_id = :orgId', { orgId });
      }
      if (dateFrom) {
        qb.andWhere('f.payment_date >= :dateFrom', { dateFrom });
      }
      if (dateTo) {
        qb.andWhere('f.payment_date <= :dateTo', { dateTo });
      }
      qb.orderBy('f.payment_date', 'DESC');
      const funds = await qb.getMany();
      funds.forEach(f => {
        list.push({
          id: f.id,
          type: 'income',
          amount: Number(f.amount),
          description: f.remarks,
          case_id: f.case_id,
          date: f.payment_date,
          source: 'business_fund',
          paid: f.account_status === 'accounted',
        });
        totalIncome += Number(f.amount);
      });
    }

    // 支出/借款/还款：从 business_funds 表查询
    const fundTypes: string[] = [];
    if (!type) {
      // 无 type 时查询支出/借款/还款（收入已在上面查过，不重复）
      fundTypes.push('expense', 'borrowing', 'repayment');
    } else if (type === 'expense' || type === 'borrowing' || type === 'repayment') {
      fundTypes.push(type);
    }

    if (fundTypes.length > 0) {
      const qb = this.businessFundRepository.createQueryBuilder('b');
      if (orgId) {
        qb.andWhere('b.organization_id = :orgId', { orgId });
      }
      if (dateFrom) {
        qb.andWhere('b.payment_date >= :dateFrom', { dateFrom });
      }
      if (dateTo) {
        qb.andWhere('b.payment_date <= :dateTo', { dateTo });
      }
      qb.andWhere('b.type IN (:...fundTypes)', { fundTypes });
      qb.orderBy('b.payment_date', 'DESC');
      const funds = await qb.getMany();
      funds.forEach(b => {
        list.push({
          id: b.id,
          type: b.type,
          amount: Number(b.amount),
          description: b.remarks,
          case_id: b.case_id,
          date: b.payment_date,
          source: 'business_fund',
          payer: b.payer,
          payee: b.payee,
          category: b.category,
        });
        if (b.type === 'expense') {
          totalExpense += Number(b.amount);
        }
      });
    }

    // 按日期倒序合并
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const total = list.length;
    const pagedList = list.slice((pageNum - 1) * pageSizeNum, pageNum * pageSizeNum);

    return {
      list: pagedList,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      summary: {
        total_income: Math.round(totalIncome * 100) / 100,
        total_expense: Math.round(totalExpense * 100) / 100,
        balance: Math.round((totalIncome - totalExpense) * 100) / 100,
      },
    };
  }

  /**
   * 初始化余额记录
   * 创建一条 business_fund 记录作为期初余额
   */
  @Post('income-expenditure/initial-balance')
  async createInitialBalance(@Body() body: {
    amount: number;
    description?: string;
    payment_date?: string;
  }, @Request() req: any) {
    const orgId = req?.user?.organization_id;
    const fund = this.businessFundRepository.create({
      type: 'income',
      category: 'other',
      amount: body.amount,
      payer: '期初余额',
      payee: '公司',
      payment_date: body.payment_date ? new Date(body.payment_date) : new Date(),
      remarks: body.description || '期初余额初始化',
      organization_id: orgId,
      account_status: 'accounted',
      account_time: new Date(),
    });
    return this.businessFundRepository.save(fund);
  }
}
