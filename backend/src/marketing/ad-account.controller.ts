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
  ForbiddenException,
} from '@nestjs/common';
import { AdAccountService } from './ad-account.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdPlatform, AdAccountStatus, AdAccountWarningStatus } from '../types';

/**
 * 广告账户管理控制器
 * 权限：投放岗(marketing) / 管理员(super_admin, org_admin)
 */
@Controller('ad-accounts')
@UseGuards(JwtAuthGuard)
export class AdAccountController {
  constructor(private adAccountService: AdAccountService) {}

  // 权限校验：仅投放岗/管理员可操作
  private checkPermission(req: any): void {
    const allowedRoles = ['super_admin', 'org_admin', 'marketing'];
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new ForbiddenException('无操作权限，仅投放岗或管理员可操作广告账户');
    }
  }

  // ========== 账户 CRUD ==========

  @Post()
  async create(
    @Body() body: {
      platform: AdPlatform;
      account_name: string;
      account_id: string;
      group_name?: string;
      balance?: number;
      threshold?: number;
      status?: AdAccountStatus;
      auth_token?: string;
    },
    @Request() req: any,
  ) {
    this.checkPermission(req);
    return this.adAccountService.create({
      ...body,
      organization_id: req.user.organization_id,
      creator_id: req.user.id,
    });
  }

  @Get()
  async findAll(
    @Query('org_id') orgId: string,
    @Query('platform') platform?: AdPlatform,
    @Query('group_name') groupName?: string,
    @Query('status') status?: AdAccountStatus,
    @Query('keyword') keyword?: string,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.adAccountService.findAccounts(finalOrgId, {
      platform,
      group_name: groupName,
      status,
      keyword,
    });
  }

  @Get('groups')
  async findGroups(@Query('org_id') orgId: string, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.adAccountService.findGroups(finalOrgId);
  }

  @Get('warnings')
  async findWarnings(
    @Query('org_id') orgId: string,
    @Query('status') status?: AdAccountWarningStatus,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.adAccountService.findWarnings(finalOrgId, status);
  }

  @Post('warnings/manual-check')
  async manualCheck(@Request() req: any) {
    this.checkPermission(req);
    return this.adAccountService.manualCheck();
  }

  @Put('warnings/:id/notified')
  async markWarningNotified(@Param('id') id: string, @Request() req: any) {
    this.checkPermission(req);
    return this.adAccountService.markWarningNotified(id);
  }

  @Put('warnings/:id/resolved')
  async markWarningResolved(
    @Param('id') id: string,
    @Body() body: { remarks?: string },
    @Request() req: any,
  ) {
    this.checkPermission(req);
    return this.adAccountService.markWarningResolved(id, body?.remarks);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.adAccountService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: Partial<{
      platform: AdPlatform;
      account_name: string;
      account_id: string;
      group_name: string;
      balance: number;
      threshold: number;
      status: AdAccountStatus;
      auth_token: string;
    }>,
    @Request() req: any,
  ) {
    this.checkPermission(req);
    return this.adAccountService.update(id, body);
  }

  @Put(':id/balance')
  async updateBalance(
    @Param('id') id: string,
    @Body() body: { balance: number },
    @Request() req: any,
  ) {
    this.checkPermission(req);
    return this.adAccountService.updateBalance(id, body.balance);
  }

  @Put(':id/threshold')
  async updateThreshold(
    @Param('id') id: string,
    @Body() body: { threshold: number },
    @Request() req: any,
  ) {
    this.checkPermission(req);
    return this.adAccountService.updateThreshold(id, body.threshold);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: AdAccountStatus },
    @Request() req: any,
  ) {
    this.checkPermission(req);
    return this.adAccountService.updateStatus(id, body.status);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    this.checkPermission(req);
    await this.adAccountService.delete(id);
    return { success: true };
  }

  // ========== 分组管理 ==========

  @Post('groups')
  async createGroup(
    @Body() body: { group_name: string; account_ids: string[]; org_id: string },
    @Request() req: any,
  ) {
    this.checkPermission(req);
    await this.adAccountService.createGroup(body.org_id, body.group_name, body.account_ids);
    return { success: true };
  }

  @Put('groups/change')
  async changeGroup(
    @Body() body: { account_ids: string[]; group_name: string },
    @Request() req: any,
  ) {
    this.checkPermission(req);
    await this.adAccountService.changeGroup(body.account_ids, body.group_name);
    return { success: true };
  }
}
