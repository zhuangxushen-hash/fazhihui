import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { LeadService } from './lead.service';
import { LeadStatus, CaseType, LeadSource } from '../types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('leads')
@UseGuards(JwtAuthGuard)
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
  ) {
    return this.leadService.findAll(orgId, { status, case_type, source_channel, page, limit });
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
}
