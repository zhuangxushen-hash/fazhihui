import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ProjectCollectionService } from './project-collection.service';
import { PaymentMethod } from './payment-record.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

// 项目收款台账控制器：按案件维度展示收款/开票情况，支持登记收款
@Controller('finance/project-collection')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.FINANCE)
export class ProjectCollectionController {
  constructor(private readonly projectCollectionService: ProjectCollectionService) {}

  // 项目收款台账聚合列表
  @Get()
  getLedger(
    @Query('keyword') keyword: string,
    @Query('status') status: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req: any,
  ) {
    const orgId = req?.user?.organization_id;
    return this.projectCollectionService.getLedger(orgId, {
      keyword,
      status,
      startDate,
      endDate,
    });
  }

  // 登记收款
  @Post('payment')
  recordPayment(
    @Body() body: {
      case_id: string;
      amount: number;
      method?: PaymentMethod;
      transaction_id?: string;
      remarks?: string;
      client_id?: string;
    },
    @Request() req: any,
  ) {
    const orgId = req?.user?.organization_id;
    return this.projectCollectionService.recordPayment(orgId, body);
  }
}
