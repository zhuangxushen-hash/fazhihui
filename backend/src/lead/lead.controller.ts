import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { LeadService } from './lead.service';
import { LeadStatus, CaseType, LeadSource, UserRole} from '../types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('leads')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.MARKETING, UserRole.SALES)
export class LeadController {
  constructor(private leadService: LeadService) {}

  @Post()
  create(@Body() body: Partial<{
    source_channel: LeadSource;
    source_keyword?: string;
    case_type?: CaseType;
    phone: string;
    contact_name?: string;
    case_description?: string;
    organization_id: string;
  }>) {
    return this.leadService.create(body);
  }

  @Get()
  findAll(
    @Query('org_id') orgId: string,
    @Query('status') status?: LeadStatus,
    @Query('case_type') case_type?: CaseType,
    @Query('source_channel') source_channel?: LeadSource,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('days_no_follow') days_no_follow?: number,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.leadService.findAll(finalOrgId, { status, case_type, source_channel, page, limit, days_no_follow: Number(days_no_follow) || undefined });
  }

  // 公共线索池查询，从请求上下文获取 organization_id
  @Get('public')
  getPublicLeads(@Request() req?: any, @Query('org_id') orgId?: string) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.leadService.getPublicLeads(finalOrgId);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.leadService.findById(id);
  }

  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: LeadStatus }) {
    return this.leadService.updateStatus(id, body.status);
  }

  @Put(':id/assign')
  assignSales(@Param('id') id: string, @Body() body: { sales_id: string }) {
    return this.leadService.assignSales(id, body.sales_id);
  }

  @Post(':id/follow-up')
  createFollowUp(
    @Param('id') id: string,
    @Body() body: { content: string; operator_id: string; next_action?: string; next_action_time?: Date },
  ) {
    return this.leadService.createFollowUp(id, body.content, body.operator_id, body.next_action, body.next_action_time);
  }

  @Get(':id/follow-ups')
  getFollowUps(@Param('id') id: string) {
    return this.leadService.getFollowUps(id);
  }

  @Put(':id/fee')
  updateFee(@Param('id') id: string, @Body() body: { service_fee: number }) {
    return this.leadService.updateFee(id, body.service_fee);
  }

  // 线索转化为案件
  @Post(':id/convert')
  convertToCase(@Param('id') id: string, @Body() body?: Partial<{ case_no: string; assignee_lawyer_id: string; fee_amount: number }>) {
    return this.leadService.convertToCase(id, body);
  }
}
