import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { FinancialAccountingService } from './financial-accounting.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

@Controller('finance/accounting')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.FINANCE)
export class FinancialAccountingController {
  constructor(private financialAccountingService: FinancialAccountingService) {}

  // 创建单条代扣记录
  @Post('withholding')
  createWithholding(
    @Body() body: {
      case_id?: string;
      user_id?: string;
      withholding_type: string;
      amount: number;
      remark?: string;
    },
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    return this.financialAccountingService.createWithholding({
      ...body,
      organization_id: organizationId,
    });
  }

  // 批量创建代扣记录并生成批次
  @Post('withholding/batch')
  createBatch(
    @Body() body: {
      withholding_type: string;
      records: Array<{ case_id?: string; user_id?: string; amount: number; remark?: string }>;
      remark?: string;
    },
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    const operatorId = req?.user?.id;
    return this.financialAccountingService.createBatch(
      body.withholding_type,
      body.records,
      organizationId,
      operatorId,
    );
  }

  // 查询代扣记录
  @Get('withholding')
  getWithholdingRecords(
    @Query('batch_id') batchId: string,
    @Query('withholding_type') withholdingType: string,
    @Query('status') status: string,
    @Query('case_id') caseId: string,
    @Query('page') page: string,
    @Query('page_size') pageSize: string,
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    return this.financialAccountingService.getWithholdingRecords(organizationId, {
      batch_id: batchId,
      withholding_type: withholdingType,
      status,
      case_id: caseId,
      page: page ? Number(page) : undefined,
      page_size: pageSize ? Number(pageSize) : undefined,
    });
  }

  // 查询代扣批次列表
  @Get('withholding/batches')
  getWithholdingBatches(
    @Query('withholding_type') withholdingType: string,
    @Query('status') status: string,
    @Query('page') page: string,
    @Query('page_size') pageSize: string,
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    return this.financialAccountingService.getWithholdingBatches(organizationId, {
      withholding_type: withholdingType,
      status,
      page: page ? Number(page) : undefined,
      page_size: pageSize ? Number(pageSize) : undefined,
    });
  }

  // 执行单条代扣
  @Post('withholding/:id/execute')
  executeWithholding(@Param('id') id: string) {
    return this.financialAccountingService.executeWithholding(id);
  }

  // 批量执行代扣批次
  @Post('withholding/batch/:id/execute')
  executeBatch(@Param('id') id: string) {
    return this.financialAccountingService.executeBatch(id);
  }

  // 撤销代扣
  @Post('withholding/:id/cancel')
  cancelWithholding(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.financialAccountingService.cancelWithholding(id, body.reason);
  }

  // 冲抵代扣
  @Post('withholding/:id/offset')
  offsetWithholding(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.financialAccountingService.offsetWithholding(id, body.reason);
  }

  // 计算个税（纯计算，不入库）
  @Post('tax/calculate')
  calculateTax(@Body() body: { income_amount: number; exemption_amount?: number }) {
    return this.financialAccountingService.calculateIncomeTax(
      body.income_amount,
      body.exemption_amount,
    );
  }

  // 个税批量结算入账
  @Post('tax/withholding')
  createIncomeTaxWithholding(
    @Body() body: {
      records: Array<{
        user_id?: string;
        case_id?: string;
        income_amount: number;
        tax_month: string;
        remark?: string;
      }>;
    },
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    return this.financialAccountingService.createIncomeTaxWithholding(
      body.records,
      organizationId,
    );
  }

  // 查询个税计算明细
  @Get('tax')
  getTaxCalculations(
    @Query('tax_month') taxMonth: string,
    @Query('status') status: string,
    @Query('user_id') userId: string,
    @Query('page') page: string,
    @Query('page_size') pageSize: string,
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    return this.financialAccountingService.getTaxCalculations(organizationId, {
      tax_month: taxMonth,
      status,
      user_id: userId,
      page: page ? Number(page) : undefined,
      page_size: pageSize ? Number(pageSize) : undefined,
    });
  }

  // 代扣统计
  @Get('stats')
  getWithholdingStats(@Request() req?: any) {
    const organizationId = req?.user?.organization_id;
    return this.financialAccountingService.getWithholdingStats(organizationId);
  }
}
