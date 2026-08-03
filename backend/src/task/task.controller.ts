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
} from '@nestjs/common';
import { TaskService } from './task.service';
import { Task } from './task.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.MARKETING, UserRole.SALES, UserRole.LAWYER, UserRole.ASSISTANT, UserRole.FINANCE)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  // 查询任务列表（支持按 assignee_id/creator_id/status/priority/keyword 筛选）
  @Get()
  findAll(
    @Query('assignee_id') assigneeId: string,
    @Query('creator_id') creatorId: string,
    @Query('status') status: string,
    @Query('priority') priority: string,
    @Query('keyword') keyword: string,
    @Request() req: any,
  ) {
    const orgId = req?.user?.organization_id;
    return this.taskService.findAll(orgId, {
      assignee_id: assigneeId,
      creator_id: creatorId,
      status,
      priority,
      keyword,
    });
  }

  // 任务统计（注意：此路由需在 :id 路由之前声明，避免 stats 被当作 id）
  @Get('stats')
  getStats(@Request() req: any) {
    const orgId = req?.user?.organization_id;
    return this.taskService.getStats(orgId);
  }

  // 查询分配给我的任务
  @Get('mine')
  findMine(
    @Query('status') status: string,
    @Query('priority') priority: string,
    @Query('keyword') keyword: string,
    @Request() req: any,
  ) {
    const userId = req?.user?.id;
    return this.taskService.findMine(userId, {
      status,
      priority,
      keyword,
    });
  }

  // 查询我创建的任务
  @Get('created')
  findCreated(
    @Query('status') status: string,
    @Query('priority') priority: string,
    @Query('keyword') keyword: string,
    @Request() req: any,
  ) {
    const userId = req?.user?.id;
    return this.taskService.findCreated(userId, {
      status,
      priority,
      keyword,
    });
  }

  // 创建任务
  @Post()
  create(@Body() body: Partial<Task>, @Request() req: any) {
    const userId = req?.user?.id;
    const orgId = req?.user?.organization_id;
    return this.taskService.create(userId, orgId, body);
  }

  // 更新任务
  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<Task>) {
    return this.taskService.update(id, body);
  }

  // 开始任务：待办 -> 进行中
  @Put(':id/start')
  start(@Param('id') id: string) {
    return this.taskService.start(id);
  }

  // 完成任务：进行中 -> 已完成
  @Put(':id/complete')
  complete(@Param('id') id: string) {
    return this.taskService.complete(id);
  }

  // 更新任务进度（progress >= 100 时自动标记为已完成）
  @Put(':id/progress')
  updateProgress(
    @Param('id') id: string,
    @Body() body: { progress: number },
  ) {
    return this.taskService.updateProgress(id, body?.progress);
  }

  // 取消任务：任意状态 -> 已取消
  @Put(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.taskService.cancel(id);
  }

  // 删除任务
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taskService.delete(id);
  }

  // 任务复核评审（已完成的任务可由创建人复核）
  @Put(':id/review')
  async review(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { review_comment: string; review_result: 'passed' | 'failed' },
  ) {
    return this.taskService.review(id, req.user.id, body.review_comment, body.review_result);
  }
}
