import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request, NotFoundException, ForbiddenException } from '@nestjs/common';
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
  create(
    @Body() body: Partial<{
      source_channel: LeadSource;
      source_keyword?: string;
      case_type?: CaseType;
      phone: string;
      contact_name?: string;
      case_description?: string;
      organization_id: string;
    }>,
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    const finalBody = { ...body };
    if (organizationId) {
      finalBody.organization_id = organizationId;
    }
    return this.leadService.create(finalBody, organizationId);
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
  async findById(@Param('id') id: string, @Request() req?: any) {
    const existing = await this.leadService.findById(id);
    if (!existing) throw new NotFoundException('线索不存在');
    if (req?.user?.organization_id && existing.organization_id !== req.user.organization_id) {
      throw new ForbiddenException('无权访问该资源');
    }
    return existing;
  }

  // 更新线索基本信息（客户姓名/手机号/案由/来源渠道/来源关键词/咨询内容）
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: Partial<{
      contact_name?: string;
      phone?: string;
      case_type?: CaseType;
      source_channel?: LeadSource;
      source_keyword?: string;
      case_description?: string;
    }>,
    @Request() req?: any,
  ) {
    const existing = await this.leadService.findById(id);
    if (!existing) throw new NotFoundException('线索不存在');
    if (req?.user?.organization_id && existing.organization_id !== req.user.organization_id) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.leadService.update(id, body);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: LeadStatus },
    @Request() req?: any,
  ) {
    const existing = await this.leadService.findById(id);
    if (!existing) throw new NotFoundException('线索不存在');
    if (req?.user?.organization_id && existing.organization_id !== req.user.organization_id) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.leadService.updateStatus(id, body.status);
  }

  @Put(':id/assign')
  async assignSales(
    @Param('id') id: string,
    @Body() body: { sales_id: string },
    @Request() req?: any,
  ) {
    const existing = await this.leadService.findById(id);
    if (!existing) throw new NotFoundException('线索不存在');
    if (req?.user?.organization_id && existing.organization_id !== req.user.organization_id) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.leadService.assignSales(id, body.sales_id);
  }

  @Post(':id/follow-up')
  async createFollowUp(
    @Param('id') id: string,
    @Body() body: { content: string; operator_id: string; next_action?: string; next_action_time?: Date },
    @Request() req?: any,
  ) {
    const existing = await this.leadService.findById(id);
    if (!existing) throw new NotFoundException('线索不存在');
    if (req?.user?.organization_id && existing.organization_id !== req.user.organization_id) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.leadService.createFollowUp(id, body.content, body.operator_id, body.next_action, body.next_action_time);
  }

  @Get(':id/follow-ups')
  async getFollowUps(@Param('id') id: string, @Request() req?: any) {
    const existing = await this.leadService.findById(id);
    if (!existing) throw new NotFoundException('线索不存在');
    if (req?.user?.organization_id && existing.organization_id !== req.user.organization_id) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.leadService.getFollowUps(id);
  }

  @Put(':id/fee')
  async updateFee(
    @Param('id') id: string,
    @Body() body: { service_fee: number },
    @Request() req?: any,
  ) {
    const existing = await this.leadService.findById(id);
    if (!existing) throw new NotFoundException('线索不存在');
    if (req?.user?.organization_id && existing.organization_id !== req.user.organization_id) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.leadService.updateFee(id, body.service_fee);
  }

}
