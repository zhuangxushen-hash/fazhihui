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
import { SocialAccountService } from './social-account.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SocialPlatform, SocialAuthStatus } from '../types';

/**
 * 公域账号管理控制器
 * 权限：投放岗(marketing) / 管理员(super_admin, org_admin)
 */
@Controller('social-accounts')
@UseGuards(JwtAuthGuard)
export class SocialAccountController {
  constructor(private readonly socialAccountService: SocialAccountService) {}

  private checkPermission(req: any): void {
    const allowedRoles = ['super_admin', 'org_admin', 'marketing'];
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new ForbiddenException('无操作权限，仅投放岗或管理员可操作公域账号');
    }
  }

  // ========== 账号 CRUD ==========

  @Post()
  async create(
    @Body() body: {
      platform: SocialPlatform;
      account_name: string;
      account_id: string;
      group_name?: string;
      followers?: number;
      likes?: number;
      consultations?: number;
      auth_token?: string;
      avatar_url?: string;
      bio?: string;
    },
    @Request() req: any,
  ) {
    this.checkPermission(req);
    return this.socialAccountService.create({
      ...body,
      organization_id: req.user.organization_id,
      creator_id: req.user.id,
    });
  }

  @Get()
  async findAll(
    @Query('org_id') orgId: string,
    @Query('platform') platform?: SocialPlatform,
    @Query('group_name') groupName?: string,
    @Query('auth_status') authStatus?: SocialAuthStatus,
    @Query('keyword') keyword?: string,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.socialAccountService.findAccounts(finalOrgId, {
      platform,
      group_name: groupName,
      auth_status: authStatus,
      keyword,
    });
  }

  @Get('groups')
  async findGroups(@Query('org_id') orgId: string, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.socialAccountService.findGroups(finalOrgId);
  }

  @Get('stats/overview')
  async getOverview(@Query('org_id') orgId: string, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.socialAccountService.getOverview(finalOrgId);
  }

  @Get('stats/by-platform')
  async getStatsByPlatform(@Query('org_id') orgId: string, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.socialAccountService.getStatsByPlatform(finalOrgId);
  }

  @Get('stats/by-group')
  async getStatsByGroup(@Query('org_id') orgId: string, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.socialAccountService.getStatsByGroup(finalOrgId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.socialAccountService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: Partial<{
      platform: SocialPlatform;
      account_name: string;
      account_id: string;
      group_name: string;
      followers: number;
      likes: number;
      consultations: number;
      auth_token: string;
      avatar_url: string;
      bio: string;
    }>,
    @Request() req: any,
  ) {
    this.checkPermission(req);
    return this.socialAccountService.update(id, body);
  }

  @Put(':id/stats')
  async updateStats(
    @Param('id') id: string,
    @Body() body: { followers?: number; likes?: number; consultations?: number },
    @Request() req: any,
  ) {
    this.checkPermission(req);
    return this.socialAccountService.updateStats(id, body);
  }

  @Put(':id/auth-status')
  async updateAuthStatus(
    @Param('id') id: string,
    @Body() body: { auth_status: SocialAuthStatus },
    @Request() req: any,
  ) {
    this.checkPermission(req);
    return this.socialAccountService.updateAuthStatus(id, body.auth_status);
  }

  @Put(':id/authorize')
  async authorize(
    @Param('id') id: string,
    @Body() body: { auth_token: string },
    @Request() req: any,
  ) {
    this.checkPermission(req);
    return this.socialAccountService.authorize(id, body.auth_token);
  }

  @Put(':id/revoke')
  async revoke(@Param('id') id: string, @Request() req: any) {
    this.checkPermission(req);
    return this.socialAccountService.revoke(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    this.checkPermission(req);
    await this.socialAccountService.delete(id);
    return { success: true };
  }

  // ========== 分组管理 ==========

  @Post('groups')
  async createGroup(
    @Body() body: { group_name: string; account_ids: string[]; org_id: string },
    @Request() req: any,
  ) {
    this.checkPermission(req);
    await this.socialAccountService.createGroup(body.org_id, body.group_name, body.account_ids);
    return { success: true };
  }

  @Put('groups/change')
  async changeGroup(
    @Body() body: { account_ids: string[]; group_name: string },
    @Request() req: any,
  ) {
    this.checkPermission(req);
    await this.socialAccountService.changeGroup(body.account_ids, body.group_name);
    return { success: true };
  }
}
