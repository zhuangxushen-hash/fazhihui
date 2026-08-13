import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { UserProfileService } from './user-profile.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

@Controller('profile')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER, UserRole.ASSISTANT, UserRole.SALES, UserRole.MARKETING, UserRole.FINANCE, UserRole.CLIENT)
export class UserProfileController {
  constructor(private userProfileService: UserProfileService) {}

  // ========== 在线模板 ==========

  // 模板列表
  @Get('templates')
  getTemplates(
    @Query('template_type') templateType: string,
    @Query('category') category: string,
    @Query('keyword') keyword: string,
    @Query('page') page: string,
    @Query('page_size') pageSize: string,
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    return this.userProfileService.getTemplates(organizationId, {
      template_type: templateType,
      category,
      keyword,
      page: page ? Number(page) : undefined,
      page_size: pageSize ? Number(pageSize) : undefined,
    });
  }

  // 模板详情
  @Get('templates/:id')
  getTemplateById(@Param('id') id: string, @Request() req?: any) {
    const organizationId = req?.user?.organization_id;
    return this.userProfileService.getTemplateById(organizationId, id);
  }

  // 创建模板
  @Post('templates')
  createTemplate(
    @Body() body: { name: string; template_type?: string; category?: string; content?: string },
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    return this.userProfileService.createTemplate({
      ...body,
      organization_id: organizationId,
      creator_id: req?.user?.id,
    });
  }

  // 更新模板
  @Put('templates/:id')
  updateTemplate(
    @Param('id') id: string,
    @Body() body: { name?: string; template_type?: string; category?: string; content?: string; is_hot?: boolean },
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    return this.userProfileService.updateTemplate(organizationId, id, body);
  }

  // 删除模板
  @Delete('templates/:id')
  deleteTemplate(@Param('id') id: string, @Request() req?: any) {
    const organizationId = req?.user?.organization_id;
    return this.userProfileService.deleteTemplate(organizationId, id);
  }

  // 使用模板（计数+1）
  @Post('templates/:id/use')
  useTemplate(@Param('id') id: string, @Request() req?: any) {
    const organizationId = req?.user?.organization_id;
    return this.userProfileService.useTemplate(organizationId, id);
  }

  // ========== 最近关注 ==========

  // 添加关注
  @Post('concerns')
  addConcern(
    @Body() body: { target_id: string; target_type: string; target_name?: string },
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    return this.userProfileService.addConcern({
      user_id: req?.user?.id,
      target_id: body.target_id,
      target_type: body.target_type,
      target_name: body.target_name,
      organization_id: organizationId,
    });
  }

  // 我的关注列表
  @Get('concerns')
  getMyConcerns(
    @Query('target_type') targetType: string,
    @Query('page') page: string,
    @Query('page_size') pageSize: string,
    @Request() req?: any,
  ) {
    return this.userProfileService.getMyConcerns(req?.user?.id, {
      target_type: targetType,
      page: page ? Number(page) : undefined,
      page_size: pageSize ? Number(pageSize) : undefined,
    });
  }

  // 取消关注
  @Delete('concerns/:id')
  removeConcern(@Param('id') id: string, @Request() req?: any) {
    return this.userProfileService.removeConcern(req?.user?.id, id);
  }

  // ========== VIP 记录 ==========

  // 我的VIP订阅记录
  @Get('vip-records')
  getMyVipRecords(@Request() req?: any) {
    return this.userProfileService.getMyVipRecords(req?.user?.id);
  }

  // 我的VIP状态
  @Get('vip-status')
  getMyVipStatus(@Request() req?: any) {
    return this.userProfileService.getMyVipStatus(req?.user?.id);
  }
}
