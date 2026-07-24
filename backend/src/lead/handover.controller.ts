import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Request,
  ForbiddenException,
  Put,
} from '@nestjs/common';
import { HandoverService } from './handover.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HandoverType } from '../types';

@Controller('handover')
@UseGuards(JwtAuthGuard)
export class HandoverController {
  constructor(private readonly handoverService: HandoverService) {}

  // 发起交接
  @Post('initiate')
  async initiateHandover(
    @Body()
    body: {
      from_user_id: string;
      to_user_id: string;
      handover_type: HandoverType;
      lead_ids?: string[];
      opportunity_ids?: string[];
      case_ids?: string[];
      handover_note?: string;
    },
    @Request() req: any,
  ) {
    // 只有管理员可以发起交接
    if (!['super_admin', 'org_admin'].includes(req.user.role)) {
      throw new ForbiddenException('只有管理员可以发起交接');
    }

    return await this.handoverService.initiateHandover(
      body.from_user_id,
      body.to_user_id,
      body.handover_type,
      body.lead_ids || [],
      body.opportunity_ids || [],
      body.case_ids || [],
      body.handover_note,
    );
  }

  // 确认交接
  @Put(':id/confirm')
  async confirmHandover(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    return await this.handoverService.confirmHandover(id, req.user.id);
  }

  // 拒绝交接
  @Put(':id/reject')
  async rejectHandover(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { reason?: string },
    @Request() req: any,
  ) {
    return await this.handoverService.rejectHandover(id, req.user.id, body.reason);
  }

  // 查询交接记录列表
  @Get()
  async findAll(@Request() req: any) {
    const organizationId = req.user.role === 'super_admin' ? undefined : req.user.organization_id;
    return await this.handoverService.findAll(organizationId);
  }

  // 查询单个交接记录
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.handoverService.findOne(id);
  }

  // 获取用户资产
  @Get('user-assets/:userId')
  async getUserAssets(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Request() req: any,
  ) {
    // 只有管理员可以查看他人资产
    if (!['super_admin', 'org_admin'].includes(req.user.role) && req.user.id !== userId) {
      throw new ForbiddenException('无权查看该用户资产');
    }

    return await this.handoverService.getUserAssets(userId);
  }

  // 批量移交（管理员直接执行）
  @Post('batch-transfer')
  async batchTransfer(
    @Body()
    body: {
      from_user_id: string;
      to_user_id: string;
      handover_type: HandoverType;
      lead_ids?: string[];
      opportunity_ids?: string[];
      case_ids?: string[];
      handover_note?: string;
    },
    @Request() req: any,
  ) {
    // 只有管理员可以执行批量移交
    if (!['super_admin', 'org_admin'].includes(req.user.role)) {
      throw new ForbiddenException('只有管理员可以执行批量移交');
    }

    return await this.handoverService.batchTransfer(
      body.from_user_id,
      body.to_user_id,
      body.handover_type,
      body.lead_ids || [],
      body.opportunity_ids || [],
      body.case_ids || [],
      body.handover_note,
    );
  }
}