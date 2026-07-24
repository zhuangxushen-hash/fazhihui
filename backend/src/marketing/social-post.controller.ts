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
import { SocialPostService } from './social-post.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SocialPostStatus } from '../types';

/**
 * 公域内容排期控制器
 * 权限：投放岗(marketing) / 管理员(super_admin, org_admin)
 */
@Controller('social-posts')
@UseGuards(JwtAuthGuard)
export class SocialPostController {
  constructor(private readonly socialPostService: SocialPostService) {}

  private checkPermission(req: any): void {
    const allowedRoles = ['super_admin', 'org_admin', 'marketing'];
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new ForbiddenException('无操作权限，仅投放岗或管理员可操作内容排期');
    }
  }

  @Post()
  async create(
    @Body() body: {
      account_id: string;
      title?: string;
      content: string;
      media_files?: string[];
      hashtags?: string;
      scheduled_time?: string;
    },
    @Request() req: any,
  ) {
    this.checkPermission(req);
    return this.socialPostService.create({
      ...body,
      media_files: body.media_files ? JSON.stringify(body.media_files) : null,
      scheduled_time: body.scheduled_time ? new Date(body.scheduled_time) : null,
      organization_id: req.user.organization_id,
      creator_id: req.user.id,
    });
  }

  @Post('multi-account')
  async createMultiAccount(
    @Body() body: {
      account_ids: string[];
      title?: string;
      content: string;
      media_files?: string[];
      hashtags?: string;
      scheduled_time?: string;
    },
    @Request() req: any,
  ) {
    this.checkPermission(req);
    return this.socialPostService.createMultiAccount(
      body.account_ids,
      {
        title: body.title,
        content: body.content,
        media_files: body.media_files,
        hashtags: body.hashtags,
        scheduled_time: body.scheduled_time ? new Date(body.scheduled_time) : undefined,
      },
      req.user.organization_id,
      req.user.id,
    );
  }

  @Get()
  async findAll(
    @Query('org_id') orgId: string,
    @Query('account_id') accountId?: string,
    @Query('status') status?: SocialPostStatus,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.socialPostService.findPosts(finalOrgId, {
      account_id: accountId,
      status,
      start_date: startDate,
      end_date: endDate,
    });
  }

  @Get('stats/by-status')
  async getStatsByStatus(@Query('org_id') orgId: string, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.socialPostService.getStatsByStatus(finalOrgId);
  }

  @Get('stats/by-platform')
  async getStatsByPlatform(@Query('org_id') orgId: string, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.socialPostService.getStatsByPlatform(finalOrgId);
  }

  @Get('stats/daily-trend')
  async getDailyTrend(
    @Query('org_id') orgId: string,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.socialPostService.getDailyPostTrend(finalOrgId, startDate, endDate);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.socialPostService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: {
      account_id?: string;
      title?: string;
      content?: string;
      media_files?: string[];
      hashtags?: string;
      scheduled_time?: string | null;
    },
    @Request() req: any,
  ) {
    this.checkPermission(req);
    const updateData: any = { ...body };
    if (body.media_files) {
      updateData.media_files = JSON.stringify(body.media_files);
    }
    if (body.scheduled_time) {
      updateData.scheduled_time = new Date(body.scheduled_time);
    } else if (body.scheduled_time === null) {
      updateData.scheduled_time = null;
    }
    return this.socialPostService.update(id, updateData);
  }

  @Put(':id/publish')
  async publish(@Param('id') id: string, @Request() req: any) {
    this.checkPermission(req);
    return this.socialPostService.publish(id);
  }

  @Put(':id/failed')
  async markFailed(
    @Param('id') id: string,
    @Body() body: { fail_reason: string },
    @Request() req: any,
  ) {
    this.checkPermission(req);
    return this.socialPostService.markFailed(id, body.fail_reason);
  }

  @Put(':id/cancel-schedule')
  async cancelSchedule(@Param('id') id: string, @Request() req: any) {
    this.checkPermission(req);
    return this.socialPostService.cancelSchedule(id);
  }

  @Put(':id/interactions')
  async updateInteractions(
    @Param('id') id: string,
    @Body() body: { likes?: number; comments?: number; shares?: number },
    @Request() req: any,
  ) {
    this.checkPermission(req);
    return this.socialPostService.updateInteractions(id, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    this.checkPermission(req);
    await this.socialPostService.delete(id);
    return { success: true };
  }
}
