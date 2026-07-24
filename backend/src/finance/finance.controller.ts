import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { Invoice } from './invoice.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
  constructor(private financeService: FinanceService) {}

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
  findInvoices(@Query('org_id') orgId: string, @Query('case_id') caseId?: string, @Query('status') status?: string, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
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
}
