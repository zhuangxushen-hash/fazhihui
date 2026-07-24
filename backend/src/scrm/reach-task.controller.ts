import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ReachTaskService } from './reach-task.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('scrm/reach-tasks')
@UseGuards(JwtAuthGuard)
export class ReachTaskController {
  constructor(private reachTaskService: ReachTaskService) {}

  @Post()
  create(@Body() body: any) {
    return this.reachTaskService.create(body);
  }

  @Get()
  findAll(
    @Query('org_id') orgId?: string,
    @Query('task_type') task_type?: string,
    @Query('status') status?: string,
  ) {
    return this.reachTaskService.findAll(orgId, { task_type, status });
  }

  @Get('moments-schedule')
  getMomentsSchedule(
    @Query('org_id') orgId: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    return this.reachTaskService.getMomentsSchedule(orgId, startDate, endDate);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.reachTaskService.findById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.reachTaskService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.reachTaskService.delete(id);
  }

  @Post(':id/send')
  send(@Param('id') id: string) {
    return this.reachTaskService.send(id);
  }

  @Post('target-count')
  countTarget(@Body() body: { tag_ids: string[] }) {
    return this.reachTaskService.countTargetByTags(body.tag_ids || []);
  }
}
