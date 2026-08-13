import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { FinanceStatementService } from './finance-statement.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

@Controller('finance/statements')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.FINANCE)
export class FinanceStatementController {
  constructor(private financeStatementService: FinanceStatementService) {}

  // 账户台账结算明细表
  @Get('account-statement')
  getAccountStatement(
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Query('type') type: string,
    @Query('category') category: string,
    @Query('page') page: string,
    @Query('page_size') pageSize: string,
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    return this.financeStatementService.getAccountStatement(organizationId, {
      start_date: startDate,
      end_date: endDate,
      type,
      category,
      page: page ? Number(page) : undefined,
      page_size: pageSize ? Number(pageSize) : undefined,
    });
  }

  // 项目收入一览表
  @Get('project-revenue')
  getProjectRevenueOverview(
    @Query('keyword') keyword: string,
    @Query('page') page: string,
    @Query('page_size') pageSize: string,
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    return this.financeStatementService.getProjectRevenueOverview(organizationId, {
      keyword,
      page: page ? Number(page) : undefined,
      page_size: pageSize ? Number(pageSize) : undefined,
    });
  }

  // 收支综合详情
  @Get('income-expenditure/:type')
  getIncomeExpenditureDetail(
    @Param('type') type: string,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Query('page') page: string,
    @Query('page_size') pageSize: string,
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    return this.financeStatementService.getIncomeExpenditureDetail(organizationId, type, {
      start_date: startDate,
      end_date: endDate,
      page: page ? Number(page) : undefined,
      page_size: pageSize ? Number(pageSize) : undefined,
    });
  }

  // 发票打印数据
  @Get('invoice-print')
  getInvoicePrintData(
    @Query('status') status: string,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Query('page') page: string,
    @Query('page_size') pageSize: string,
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    return this.financeStatementService.getInvoicePrintData(organizationId, {
      status,
      start_date: startDate,
      end_date: endDate,
      page: page ? Number(page) : undefined,
      page_size: pageSize ? Number(pageSize) : undefined,
    });
  }
}
