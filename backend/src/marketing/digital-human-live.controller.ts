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
import { DigitalHumanLiveService } from './digital-human-live.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';
import { DigitalHumanLiveStatus } from './digital-human-live.entity';

/**
 * 数字人直播管理控制器
 * 权限：投放岗(marketing) / 管理员(super_admin, org_admin)
 */
@Controller('marketing/digital-human-lives')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.MARKETING)
export class DigitalHumanLiveController {
  constructor(private digitalHumanLiveService: DigitalHumanLiveService) {}

  // 权限校验：仅投放岗/管理员可操作
  private checkPermission(req: any): void {
    const allowedRoles = ['super_admin', 'org_admin', 'marketing'];
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new ForbiddenException('无操作权限，仅投放岗或管理员可操作数字人直播');
    }
  }

  // ========== 查询接口 ==========

  @Get()
  async findAll(
    @Query('org_id') orgId: string,
    @Query('status') status?: DigitalHumanLiveStatus,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.digitalHumanLiveService.listLiveSessions(finalOrgId, status);
  }

  @Get('stats')
  async getStats(
    @Query('org_id') orgId: string,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.digitalHumanLiveService.getLiveStats(finalOrgId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.digitalHumanLiveService.findById(id);
  }

  // ========== 写操作接口 ==========

  @Post()
  async create(
    @Body() body: {
      title: string;
      anchor_name: string;
      script_content?: string;
      cover_url?: string;
      live_url?: string;
      status?: DigitalHumanLiveStatus;
      scheduled_start?: string;
      case_type?: string;
      brand_id?: string;
    },
    @Request() req: any,
  ) {
    this.checkPermission(req);
    return this.digitalHumanLiveService.create({
      ...body,
      scheduled_start: body.scheduled_start ? new Date(body.scheduled_start) : undefined,
      organization_id: req.user.organization_id,
      created_by: req.user.id,
    });
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: Partial<{
      title: string;
      anchor_name: string;
      script_content: string;
      cover_url: string;
      live_url: string;
      scheduled_start: string;
      case_type: string;
      brand_id: string;
    }>,
    @Request() req: any,
  ) {
    this.checkPermission(req);
    const data: any = { ...body };
    if (body.scheduled_start) {
      data.scheduled_start = new Date(body.scheduled_start);
    }
    return this.digitalHumanLiveService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    this.checkPermission(req);
    await this.digitalHumanLiveService.delete(id);
    return { success: true };
  }

  // ========== 直播操作接口 ==========

  @Post(':id/start')
  async startLive(@Param('id') id: string, @Request() req: any) {
    this.checkPermission(req);
    return this.digitalHumanLiveService.startLive(id);
  }

  @Post(':id/end')
  async endLive(@Param('id') id: string, @Request() req: any) {
    this.checkPermission(req);
    return this.digitalHumanLiveService.endLive(id);
  }
}