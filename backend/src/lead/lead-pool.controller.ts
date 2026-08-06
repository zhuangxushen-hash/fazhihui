import { Controller, Get, Post, Body, Query, Param, UseGuards, Request, NotFoundException, ForbiddenException } from '@nestjs/common';
import { LeadPoolService } from './lead-pool.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RecycleReason, LeadPoolStatus, CaseType, UserRole} from '../types';

@Controller('lead-pool')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.SALES)
export class LeadPoolController {
  constructor(private readonly leadPoolService: LeadPoolService) {}

  // 获取公海池列表
  @Get()
  async findAll(
    @Query('status') status?: LeadPoolStatus,
    @Query('case_type') case_type?: CaseType,
    @Query('recycle_reason') recycle_reason?: RecycleReason,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: 'recycle_time' | 'take_count',
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    return this.leadPoolService.findAll(
      {
        status,
        case_type,
        recycle_reason,
        start_date: start_date ? new Date(start_date) : undefined,
        end_date: end_date ? new Date(end_date) : undefined,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
        sortBy: sortBy || 'recycle_time',
        sortOrder: sortOrder || 'DESC',
      },
      organizationId,
    );
  }

  // 获取公海池统计
  @Get('statistics')
  async getStatistics(@Request() req?: any) {
    const organizationId = req?.user?.organization_id;
    return this.leadPoolService.getStatistics(organizationId);
  }

  // 手动释放线索到公海池
  @Post('recycle/:leadId')
  async manualRecycle(
    @Param('leadId') leadId: string,
    @Body('note') note: string,
    @Request() req: any,
  ) {
    const organizationId = req?.user?.organization_id;
    const existing = await this.leadPoolService.findLeadById(leadId);
    if (!existing) {
      throw new NotFoundException('线索不存在');
    }
    if (organizationId && existing.organization_id !== organizationId) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.leadPoolService.manualRecycle(leadId, req.user.id, note, organizationId);
  }

  // 领取线索
  @Post('take/:id')
  async takeLead(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const organizationId = req?.user?.organization_id;
    const existing = await this.leadPoolService.findLeadPoolById(id);
    if (!existing) {
      throw new NotFoundException('公海池记录不存在');
    }
    if (organizationId && existing.organization_id !== organizationId) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.leadPoolService.takeLead(id, req.user.id, organizationId);
  }

  // 分配线索（管理员使用）
  @Post('assign/:id')
  async assignLead(
    @Param('id') id: string,
    @Body('userId') userId: string,
    @Request() req: any,
  ) {
    const organizationId = req?.user?.organization_id;
    const existing = await this.leadPoolService.findLeadPoolById(id);
    if (!existing) {
      throw new NotFoundException('公海池记录不存在');
    }
    if (organizationId && existing.organization_id !== organizationId) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.leadPoolService.assignLead(id, userId, req.user.id, organizationId);
  }

  // 批量领取线索
  @Post('batch-take')
  async batchTakeLeads(
    @Body('ids') ids: string[],
    @Request() req: any,
  ) {
    const organizationId = req?.user?.organization_id;
    return this.leadPoolService.batchTakeLeads(ids, req.user.id, organizationId);
  }

  // 批量分配线索
  @Post('batch-assign')
  async batchAssignLeads(
    @Body('ids') ids: string[],
    @Body('userId') userId: string,
    @Request() req: any,
  ) {
    const organizationId = req?.user?.organization_id;
    return this.leadPoolService.batchAssignLeads(ids, userId, req.user.id, organizationId);
  }

  // 手动触发超时回收（测试用）
  @Post('trigger-recycle')
  async triggerRecycle(@Body('timeoutDays') timeoutDays?: number, @Request() req?: any) {
    const organizationId = req?.user?.organization_id;
    const count = await this.leadPoolService.recycleTimeoutLeads(timeoutDays || 7, organizationId);
    return { recycled: count };
  }
}