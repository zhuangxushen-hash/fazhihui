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
  Req,
} from '@nestjs/common';
import { PublicOpinionService } from './public-opinion.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

/**
 * 舆情监控控制器
 * 权限：管理员(super_admin, org_admin) / 投放岗(marketing)
 */
@Controller('public-opinions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.MARKETING)
export class PublicOpinionController {
  constructor(private readonly publicOpinionService: PublicOpinionService) {}

  // ========== 关键词接口（置于 :id 路由前，避免被通配匹配） ==========

  // 关键词列表查询
  @Get('keywords')
  async findKeywords(
    @Query('is_active') isActive: string,
    @Req() req: any,
  ) {
    const orgId = req.user.organization_id;
    const active =
      isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.publicOpinionService.findKeywords(orgId, active);
  }

  // 创建关键词
  @Post('keywords')
  async createKeyword(
    @Body() body: { keyword: string; is_active?: boolean },
    @Req() req: any,
  ) {
    return this.publicOpinionService.createKeyword({
      keyword: body.keyword,
      is_active: body.is_active !== undefined ? body.is_active : true,
      organization_id: req.user.organization_id,
    });
  }

  // 更新关键词
  @Put('keywords/:id')
  async updateKeyword(
    @Param('id') id: string,
    @Body() body: { keyword?: string; is_active?: boolean },
  ) {
    return this.publicOpinionService.updateKeyword(id, body);
  }

  // 删除关键词
  @Delete('keywords/:id')
  async deleteKeyword(@Param('id') id: string) {
    await this.publicOpinionService.deleteKeyword(id);
    return { success: true };
  }

  // ========== 舆情接口 ==========

  // 舆情列表查询，支持平台/状态/情感/关键词筛选
  @Get()
  async findAll(
    @Query('platform') platform: string,
    @Query('status') status: string,
    @Query('sentiment') sentiment: string,
    @Query('keyword') keyword: string,
    @Req() req: any,
  ) {
    const orgId = req.user.organization_id;
    return this.publicOpinionService.findByOrg(orgId, {
      platform,
      status,
      sentiment,
      keyword,
    });
  }

  // 查询舆情详情
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.publicOpinionService.findById(id);
  }

  // 创建舆情记录
  @Post()
  async create(
    @Body() body: {
      keyword: string;
      platform: string;
      title: string;
      content: string;
      url: string;
      sentiment?: string;
      status?: string;
      published_at: string;
    },
    @Req() req: any,
  ) {
    return this.publicOpinionService.create({
      ...body,
      published_at: body.published_at ? new Date(body.published_at) : new Date(),
      organization_id: req.user.organization_id,
    });
  }

  // 更新舆情
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: {
      keyword?: string;
      platform?: string;
      title?: string;
      content?: string;
      url?: string;
      sentiment?: string;
      status?: string;
      published_at?: string;
    },
  ) {
    const updateData: any = { ...body };
    if (body.published_at) {
      updateData.published_at = new Date(body.published_at);
    }
    return this.publicOpinionService.update(id, updateData);
  }

  // 更新舆情状态（独立接口）
  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; handle_remark?: string },
    @Req() req: any,
  ) {
    return this.publicOpinionService.updateStatus(id, {
      status: body.status,
      handler_id: req.user.id,
      handle_remark: body.handle_remark,
    });
  }

  // 删除舆情记录
  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.publicOpinionService.delete(id);
    return { success: true };
  }
}
