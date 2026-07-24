import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CaseTaskService } from './case-task.service';
import { CaseTaskCommentService } from './case-task-comment.service';
import { CreateTaskDto, UpdateTaskDto, UpdateTaskStatusDto, AssignTaskDto, UpdateTaskProgressDto, AddCommentDto, UploadResultDto } from './dto/task.dto';
import { CaseTaskStatus, TaskPriority } from './case-task.entity';

@Controller('case-tasks')
@UseGuards(JwtAuthGuard)
export class CaseTaskController {
  constructor(
    private readonly caseTaskService: CaseTaskService,
    private readonly commentService: CaseTaskCommentService,
  ) {}

  /**
   * 获取任务列表（按组织，支持筛选和分页）
   */
  @Get()
  async findAll(
    @Query('org_id') orgId: string,
    @Query('status') status?: CaseTaskStatus,
    @Query('priority') priority?: TaskPriority,
    @Query('assignee_id') assignee_id?: string,
    @Query('case_id') case_id?: string,
    @Query('stage_id') stage_id?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    const result = await this.caseTaskService.findAll(finalOrgId, {
      status,
      priority,
      assignee_id,
      case_id,
      stage_id,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    return { success: true, data: result.data, total: result.total };
  }

  /**
   * 获取案件的任务列表
   */
  @Get('case/:caseId')
  async getCaseTasks(@Param('caseId') caseId: string) {
    const tasks = await this.caseTaskService.getCaseTasks(caseId);
    return { success: true, data: tasks };
  }

  /**
   * 获取案件任务（按阶段分组）
   */
  @Get('case/:caseId/grouped')
  async getCaseTasksGrouped(@Param('caseId') caseId: string) {
    const grouped = await this.caseTaskService.getCaseTasksGroupByStage(caseId);
    return { success: true, data: grouped };
  }

  /**
   * 获取任务统计
   */
  @Get('case/:caseId/statistics')
  async getTaskStatistics(@Param('caseId') caseId: string) {
    const stats = await this.caseTaskService.getTaskStatistics(caseId);
    const completionRate = await this.caseTaskService.getCaseTaskCompletionRate(caseId);
    return { success: true, data: { ...stats, ...completionRate } };
  }

  /**
   * 获取任务详情
   */
  @Get(':taskId')
  async getTaskDetail(@Param('taskId') taskId: string) {
    const task = await this.caseTaskService.getTaskDetail(taskId);
    return { success: true, data: task };
  }

  /**
   * 手动创建任务
   */
  @Post()
  async createTask(@Body() dto: CreateTaskDto) {
    const task = await this.caseTaskService.createTask(dto);
    return { success: true, data: task, message: '任务创建成功' };
  }

  /**
   * 更新任务信息
   */
  @Put(':taskId')
  async updateTask(
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    const task = await this.caseTaskService.updateTask(taskId, dto);
    return { success: true, data: task, message: '任务更新成功' };
  }

  /**
   * 更新任务状态
   */
  @Put(':taskId/status')
  async updateTaskStatus(
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskStatusDto,
    @Request() req: any,
  ) {
    const result = await this.caseTaskService.updateTaskStatus(taskId, dto);

    // 记录状态变更
    await this.commentService.recordStatusChange(
      taskId,
      req.user.id,
      result.oldStatus,
      dto.status,
    );

    return { success: true, data: result.task, message: '状态更新成功' };
  }

  /**
   * 指派任务
   */
  @Put(':taskId/assign')
  async assignTask(
    @Param('taskId') taskId: string,
    @Body() dto: AssignTaskDto,
    @Request() req: any,
  ) {
    const result = await this.caseTaskService.assignTask(taskId, dto);

    // 记录指派变更
    await this.commentService.recordAssignChange(
      taskId,
      req.user.id,
      result.oldAssignee,
      dto.assignee_id,
    );

    return { success: true, data: result.task, message: '任务指派成功' };
  }

  /**
   * 更新任务进度
   */
  @Put(':taskId/progress')
  async updateTaskProgress(
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskProgressDto,
  ) {
    const task = await this.caseTaskService.updateTaskProgress(taskId, dto);
    return { success: true, data: task, message: '进度更新成功' };
  }

  /**
   * 获取任务的评论和成果
   */
  @Get(':taskId/comments')
  async getTaskComments(@Param('taskId') taskId: string) {
    const comments = await this.commentService.getTaskComments(taskId);
    return { success: true, data: comments };
  }

  /**
   * 添加任务评论
   */
  @Post(':taskId/comments')
  async addComment(
    @Param('taskId') taskId: string,
    @Body() dto: AddCommentDto,
    @Request() req: any,
  ) {
    const comment = await this.commentService.addComment(
      taskId,
      req.user.id,
      dto.content,
    );
    return { success: true, data: comment, message: '评论添加成功' };
  }

  /**
   * 上传任务成果
   */
  @Post(':taskId/results')
  async uploadResult(
    @Param('taskId') taskId: string,
    @Body() dto: UploadResultDto,
    @Request() req: any,
  ) {
    const comment = await this.commentService.uploadResult(
      taskId,
      req.user.id,
      dto.file_url,
      dto.file_name,
      dto.file_type,
      dto.content,
    );
    return { success: true, data: comment, message: '成果上传成功' };
  }

  /**
   * 获取案件任务完成率
   */
  @Get('case/:caseId/completion-rate')
  async getCaseTaskCompletionRate(@Param('caseId') caseId: string) {
    const result = await this.caseTaskService.getCaseTaskCompletionRate(caseId);
    return { success: true, data: result };
  }
}