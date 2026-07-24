import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InviteTaskService } from './invite-task.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InviteMethod, InviteTaskStatus, InviteResult } from '../types';

@UseGuards(JwtAuthGuard)
@Controller('invite-tasks')
export class InviteTaskController {
  constructor(private readonly inviteTaskService: InviteTaskService) {}

  @Get()
  findAll(
    @Query('org_id') orgId: string,
    @Query('status') status?: InviteTaskStatus,
    @Query('invite_method') invite_method?: InviteMethod,
    @Query('inviter_id') inviter_id?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.inviteTaskService.findAll(finalOrgId, { status, invite_method, inviter_id, page, limit });
  }

  @Get('my-tasks')
  async getMyTasks(@Request() req: any, @Body('status') status?: InviteTaskStatus) {
    return this.inviteTaskService.getMyTasks(req.user.id, status);
  }

  @Get('pending-leads')
  async getPendingLeads(@Request() req: any) {
    return this.inviteTaskService.getPendingLeads(req.user.id);
  }

  @Get('today-tasks')
  async getTodayTasks(@Request() req: any) {
    return this.inviteTaskService.getTodayTasks(req.user.id);
  }

  @Get('invited-tasks')
  async getInvitedTasks(@Request() req: any) {
    return this.inviteTaskService.getInvitedTasks(req.user.id);
  }

  @Get('history-tasks')
  async getHistoryTasks(@Request() req: any) {
    return this.inviteTaskService.getHistoryTasks(req.user.id);
  }

  @Post('create')
  async createInviteTask(
    @Request() req: any,
    @Body() body: {
      leadId: string;
      inviteMethod: InviteMethod;
      scheduledTime?: Date;
      result?: InviteResult;
      resultNote?: string;
      recordingUrl?: string;
      callDuration?: number;
    },
  ) {
    return this.inviteTaskService.createInviteTask(
      req.user.id,
      body.leadId,
      body.inviteMethod,
      body.scheduledTime,
      body.result,
      body.resultNote,
      body.recordingUrl,
      body.callDuration,
    );
  }

  @Put(':taskId/status')
  async updateTaskStatus(
    @Request() req: any,
    @Param('taskId') taskId: string,
    @Body() body: {
      status: InviteTaskStatus;
      resultNote?: string;
    },
  ) {
    return this.inviteTaskService.updateTaskStatus(taskId, req.user.id, body.status, body.resultNote);
  }

  @Post('upload-recording')
  @UseInterceptors(FileInterceptor('file'))
  async uploadRecording(@UploadedFile() file: any) {
    return this.inviteTaskService.uploadRecording(file);
  }
}