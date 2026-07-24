import { Controller, Get, Post, Body, Query, Param, UseGuards, Request } from '@nestjs/common';
import { LeadPoolService } from './lead-pool.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RecycleReason, LeadPoolStatus, CaseType } from '../types';

@Controller('lead-pool')
@UseGuards(JwtAuthGuard)
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
  ) {
    return this.leadPoolService.findAll({
      status,
      case_type,
      recycle_reason,
      start_date: start_date ? new Date(start_date) : undefined,
      end_date: end_date ? new Date(end_date) : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      sortBy: sortBy || 'recycle_time',
      sortOrder: sortOrder || 'DESC',
    });
  }

  // 获取公海池统计
  @Get('statistics')
  async getStatistics() {
    return this.leadPoolService.getStatistics();
  }

  // 手动释放线索到公海池
  @Post('recycle/:leadId')
  async manualRecycle(
    @Param('leadId') leadId: string,
    @Body('note') note: string,
    @Request() req,
  ) {
    return this.leadPoolService.manualRecycle(leadId, req.user.id, note);
  }

  // 领取线索
  @Post('take/:id')
  async takeLead(
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.leadPoolService.takeLead(id, req.user.id);
  }

  // 分配线索（管理员使用）
  @Post('assign/:id')
  async assignLead(
    @Param('id') id: string,
    @Body('userId') userId: string,
    @Request() req,
  ) {
    return this.leadPoolService.assignLead(id, userId, req.user.id);
  }

  // 批量领取线索
  @Post('batch-take')
  async batchTakeLeads(
    @Body('ids') ids: string[],
    @Request() req,
  ) {
    return this.leadPoolService.batchTakeLeads(ids, req.user.id);
  }

  // 批量分配线索
  @Post('batch-assign')
  async batchAssignLeads(
    @Body('ids') ids: string[],
    @Body('userId') userId: string,
    @Request() req,
  ) {
    return this.leadPoolService.batchAssignLeads(ids, userId, req.user.id);
  }

  // 手动触发超时回收（测试用）
  @Post('trigger-recycle')
  async triggerRecycle(@Body('timeoutDays') timeoutDays?: number) {
    const count = await this.leadPoolService.recycleTimeoutLeads(timeoutDays || 7);
    return { recycled: count };
  }
}