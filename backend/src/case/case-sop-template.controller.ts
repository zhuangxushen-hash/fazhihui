import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { CaseSopTemplateService } from './case-sop-template.service';
import { CaseSOPTemplate } from './case-sop-template.entity';
import { CaseType, UserRole } from '../types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('case-sop-templates')
@UseGuards(JwtAuthGuard)
export class CaseSopTemplateController {
  constructor(private readonly sopTemplateService: CaseSopTemplateService) {}

  /**
   * 创建SOP模板（仅管理员）
   */
  @Post()
  async create(@Request() req: any, @Body() body: Partial<CaseSOPTemplate>) {
    this.checkAdminPermission(req.user);
    return this.sopTemplateService.create(body);
  }

  /**
   * 更新SOP模板（仅管理员）
   */
  @Put(':id')
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: Partial<CaseSOPTemplate>,
  ) {
    this.checkAdminPermission(req.user);
    return this.sopTemplateService.update(id, body);
  }

  /**
   * 删除SOP模板（仅管理员）
   */
  @Delete(':id')
  async delete(@Request() req: any, @Param('id') id: string) {
    this.checkAdminPermission(req.user);
    await this.sopTemplateService.delete(id);
    return { message: '删除成功' };
  }

  /**
   * 查询SOP模板列表
   */
  @Get()
  async findAll(
    @Query('org_id') orgId?: string,
    @Query('case_type') caseType?: CaseType,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.sopTemplateService.findAll(finalOrgId, caseType);
  }

  /**
   * 查询单个SOP模板
   */
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.sopTemplateService.findById(id);
  }

  /**
   * 设置默认模板（仅管理员）
   */
  @Put(':id/set-default')
  async setDefault(@Request() req: any, @Param('id') id: string) {
    this.checkAdminPermission(req.user);
    return this.sopTemplateService.setDefault(id);
  }

  /**
   * 启用/禁用模板（仅管理员）
   */
  @Put(':id/toggle-enabled')
  async toggleEnabled(@Request() req: any, @Param('id') id: string) {
    this.checkAdminPermission(req.user);
    return this.sopTemplateService.toggleEnabled(id);
  }

  /**
   * 初始化系统模板（仅超级管理员）
   */
  @Post('initialize-system-templates')
  async initializeSystemTemplates(@Request() req: any) {
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('仅超级管理员可以初始化系统模板');
    }
    await this.sopTemplateService.initializeSystemTemplates();
    return { message: '系统模板初始化成功' };
  }

  /**
   * 检查管理员权限
   */
  private checkAdminPermission(user: any) {
    if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ORG_ADMIN) {
      throw new ForbiddenException('仅管理员可以操作SOP模板');
    }
  }
}