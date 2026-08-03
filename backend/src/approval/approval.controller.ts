import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApprovalService } from './approval.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

@Controller('approvals')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER, UserRole.ASSISTANT, UserRole.FINANCE, UserRole.SALES, UserRole.MARKETING)
export class ApprovalController {
  constructor(private approvalService: ApprovalService) {}

  // 查询审批列表：支持 mode(pending/processed/mine)、type、status 筛选
  @Get()
  find(
    @Query('mode') mode: string,
    @Query('type') type: string,
    @Query('status') status: string,
    @Request() req: any,
  ) {
    const userId = req?.user?.id;
    return this.approvalService.find(userId, mode, type, status);
  }

  // 发起审批
  @Post()
  create(@Request() req: any, @Body() body: any) {
    return this.approvalService.create(req.user.id, {
      ...body,
      organization_id: body.organization_id || req.user.organization_id,
    });
  }

  // 审批通过
  @Put(':id/approve')
  approve(@Param('id') id: string, @Request() req: any, @Body() body: { comment?: string }) {
    return this.approvalService.approve(id, req.user.id, body?.comment);
  }

  // 驳回
  @Put(':id/reject')
  reject(@Param('id') id: string, @Request() req: any, @Body() body: { comment?: string }) {
    return this.approvalService.reject(id, req.user.id, body?.comment);
  }

  // 撤销
  @Put(':id/cancel')
  cancel(@Param('id') id: string, @Request() req: any) {
    return this.approvalService.cancel(id, req.user.id);
  }

  // 退回上一步
  @Put(':id/return')
  returnBack(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { comment?: string },
  ) {
    return this.approvalService.returnBack(id, req.user.id, body?.comment || '');
  }

  // 批量撤销
  @Post('batch-cancel')
  batchCancel(@Request() req: any, @Body() body: { ids: string[] }) {
    return this.approvalService.batchCancel(body?.ids || [], req.user.id);
  }

  // 批量审批通过
  @Post('batch-approve')
  batchApprove(
    @Request() req: any,
    @Body() body: { ids: string[]; comment?: string },
  ) {
    return this.approvalService.batchApprove(body?.ids || [], req.user.id, body?.comment || '');
  }

  // 转批：将当前步骤的审批权转交给其他人
  @Put(':id/transfer')
  async transfer(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { to_user_id: string; comment: string },
  ) {
    return this.approvalService.transfer(id, req.user.id, body.to_user_id, body.comment);
  }
}
