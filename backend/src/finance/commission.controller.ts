import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CommissionService } from './commission.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CommissionType, CommissionRoleType } from './commission-rule.entity';

@Controller('commission')
@UseGuards(JwtAuthGuard)
export class CommissionController {
  constructor(private readonly commissionService: CommissionService) {}

  // ========== 分润规则管理 ==========

  @Post('rules')
  async createRule(@Body() body: any, @Request() req: any) {
    const rule = await this.commissionService.createRule({
      ...body,
      organization_id: req.user.organization_id,
    });
    return rule;
  }

  @Get('rules')
  async getRules(@Query('org_id') org_id: string, @Query('enabled') enabled?: string, @Request() req?: any) {
    const finalOrgId = org_id || req?.user?.organization_id;
    const isEnabled = enabled === 'true' ? true : enabled === 'false' ? false : undefined;
    return await this.commissionService.getRules(finalOrgId, isEnabled);
  }

  @Get('rules/:id')
  async getRuleById(@Param('id') id: string) {
    return await this.commissionService.getRuleById(id);
  }

  @Put('rules/:id')
  async updateRule(@Param('id') id: string, @Body() body: any) {
    return await this.commissionService.updateRule(id, body);
  }

  @Delete('rules/:id')
  async deleteRule(@Param('id') id: string) {
    await this.commissionService.deleteRule(id);
    return { message: '删除成功' };
  }

  @Put('rules/:id/toggle')
  async toggleRule(@Param('id') id: string, @Body() body: { enabled: boolean }) {
    return await this.commissionService.toggleRule(id, body.enabled);
  }

  // ========== 分润记录管理 ==========

  @Get('records')
  async getRecords(
    @Query('org_id') org_id: string,
    @Query('case_id') case_id?: string,
    @Query('status') status?: string,
    @Request() req?: any,
  ) {
    const finalOrgId = org_id || req?.user?.organization_id;
    return await this.commissionService.getRecords(finalOrgId, case_id, status);
  }

  @Get('records/:id')
  async getRecordById(@Param('id') id: string) {
    return await this.commissionService.getRecordById(id);
  }

  @Put('records/:id/paid')
  async markPaid(@Param('id') id: string) {
    return await this.commissionService.markPaid(id);
  }

  // ========== 分润计算 ==========

  @Post('calculate/:caseId')
  async calculateCommission(@Param('caseId') caseId: string) {
    return await this.commissionService.calculateCommission(caseId);
  }

  @Post('calculate/batch')
  async batchCalculate(@Body() body: { caseIds: string[] }) {
    return await this.commissionService.batchCalculateCommission(body.caseIds);
  }
}