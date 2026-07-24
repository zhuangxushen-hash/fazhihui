import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { SidebarService } from './sidebar.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('scrm/sidebar')
@UseGuards(JwtAuthGuard)
export class SidebarController {
  constructor(private sidebarService: SidebarService) {}

  /**
   * 企微侧边栏概览
   */
  @Get()
  getOverview(
    @Query('org_id') orgId: string,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.sidebarService.getOverview(finalOrgId);
  }

  /**
   * 客户全景档案聚合
   */
  @Get('clients/:clientId/profile')
  getClientProfile(
    @Param('clientId') clientId: string,
    @Query('phone') phone?: string,
  ) {
    return this.sidebarService.getClientProfile(clientId, phone);
  }

  /**
   * 创建跟进任务
   */
  @Post('follow-up-tasks')
  createFollowUpTask(@Body() body: any) {
    return this.sidebarService.createFollowUpTask(body);
  }
}
