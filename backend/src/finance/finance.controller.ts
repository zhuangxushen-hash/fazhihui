import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { Invoice } from './invoice.entity';
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
  ) {}

  @Post('fee')
  createFee(@Body() body: { case_id: string; amount: number; organization_id: string; description?: string }) {
    return this.financeService.createFee(body);
  }

  @Get('fees')
  findFees(@Query('org_id') orgId: string, @Query('case_id') caseId?: string, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.financeService.findFees(finalOrgId, caseId);
  }

  @Put('fee/:id/paid')
  markAsPaid(@Param('id') id: string) {
    return this.financeService.markAsPaid(id);
  }

  @Post('profit-share')
  calculateProfitShare(@Body() body: {
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
  }) {
    return this.financeService.calculateProfitShare(body.case_id, body.organization_id, body.fee_amount, body.rules);
  }

  @Get('profit-share')
  getProfitShares(@Query('org_id') orgId: string, @Query('case_id') caseId?: string, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.financeService.getProfitShares(finalOrgId, caseId);
  }

  @Post('refund')
  createRefund(@Body() body: {
    case_id: string;
    organization_id: string;
    amount: number;
    reason: string;
    fee_id?: string;
    evidence_files?: string;
  }) {
    return this.financeService.createRefund(body);
  }

  @Put('refund/:id/approve')
  approveRefund(@Param('id') id: string, @Body() body: { approved_by: string; note?: string }) {
    return this.financeService.approveRefund(id, body.approved_by, body.note);
  }

  @Put('refund/:id/reject')
  rejectRefund(@Param('id') id: string, @Body() body: { note?: string }) {
    return this.financeService.rejectRefund(id, body.note);
  }

  @Get('refunds')
  findRefunds(@Query('org_id') orgId: string, @Query('case_id') caseId?: string, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.financeService.findRefunds(finalOrgId, caseId);
  }

  @Post('invoice')
  createInvoice(@Body() body: Partial<Invoice>) {
    return this.financeService.createInvoice(body);
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
  issueInvoice(@Param('id') id: string, @Body() body: { invoice_no: string }) {
    return this.financeService.issueInvoice(id, body.invoice_no);
  }

  @Put('invoice/:id/paid')
  markInvoicePaid(@Param('id') id: string) {
    return this.financeService.markInvoicePaid(id);
  }

  @Put('invoice/:id/cancel')
  cancelInvoice(@Param('id') id: string, @Body() body?: { note?: string }) {
    return this.financeService.cancelInvoice(id, body?.note);
  }

  @Post('receivables/:id/record-payment')
  async recordPayment(
    @Param('id') id: string,
    @Body() body: { amount: number; method?: PaymentMethod; transaction_id?: string; remarks?: string; client_id?: string },
  ) {
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
  ) {
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
  async updatePaymentReminder(@Param('id') id: string, @Body() body: any) {
    return this.paymentReminderService.update(id, body);
  }

  @Delete('payment-reminders/:id')
  async removePaymentReminder(@Param('id') id: string) {
    await this.paymentReminderService.remove(id);
    return { message: '删除成功' };
  }

  @Put('payment-reminders/:id/remind')
  async remindPaymentReminder(@Param('id') id: string, @Request() req?: any) {
    return this.paymentReminderService.remind(id, req?.user?.id);
  }

  @Put('payment-reminders/:id/paid')
  async markPaidPaymentReminder(@Param('id') id: string) {
    return this.paymentReminderService.markPaid(id);
  }

  @Put('payment-reminders/:id/give-up')
  async giveUpPaymentReminder(@Param('id') id: string) {
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
  async updateInvoiceV2(@Param('id') id: string, @Body() body: any) {
    return this.invoiceService.update(id, body);
  }

  @Delete('invoices/:id')
  async removeInvoiceV2(@Param('id') id: string) {
    await this.invoiceService.remove(id);
    return { message: '删除成功' };
  }

  @Put('invoices/:id/void')
  async voidInvoiceV2(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.invoiceService.void(id, body.reason);
  }

  @Put('invoices/:id/red-flush')
  async redFlushInvoiceV2(@Param('id') id: string) {
    return this.invoiceService.redFlush(id);
  }

  // 退款发票
  @Put('invoices/:id/refund')
  async refundInvoice(
    @Param('id') id: string,
    @Body() body: { amount: number; date: string },
  ) {
    return this.invoiceService.refundInvoice(id, body.amount, body.date);
  }

  // 调账发票
  @Put('invoices/:id/adjust')
  async adjustInvoice(
    @Param('id') id: string,
    @Body() body: { reason: string; amount: number; operator_id: string },
  ) {
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
  async updateBusinessFund(@Param('id') id: string, @Body() body: any) {
    return this.businessFundService.update(id, body);
  }

  @Delete('business-funds/:id')
  async removeBusinessFund(@Param('id') id: string) {
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
  async accountBusinessFund(@Param('id') id: string) {
    return this.businessFundService.accountFund(id);
  }

  // 分账
  @Put('business-funds/:id/allocate')
  async allocateBusinessFund(
    @Param('id') id: string,
    @Body() body: { records: Array<{ role: string; amount: number }> },
  ) {
    return this.businessFundService.allocateFund(id, body.records);
  }

  // 税费分摊
  @Put('business-funds/:id/tax-share')
  async taxShareBusinessFund(
    @Param('id') id: string,
    @Body() body: { amount: number },
  ) {
    return this.businessFundService.taxShareFund(id, body.amount);
  }

  // 退还质保金
  @Put('business-funds/:id/refund-deposit')
  async refundQualityDeposit(
    @Param('id') id: string,
    @Body() body: { refund_amount: number },
  ) {
    return this.financeService.refundQualityDeposit(id, body.refund_amount);
  }
}
