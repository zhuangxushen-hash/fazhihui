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
import { HrService } from './hr.service';
import { HrLeave } from './leave.entity';
import { Attendance } from './attendance.entity';
import { MaterialRequisition } from './material-requisition.entity';
import { HrActivity } from './activity.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

@Controller('hr')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.ASSISTANT)
export class HrController {
  constructor(private readonly hrService: HrService) {}

  // ==================== 请假管理 ====================

  // 查询请假列表（支持 user_id/status/start_date/end_date 筛选）
  @Get('leaves')
  findLeaves(
    @Query('user_id') user_id: string,
    @Query('status') status: string,
    @Query('start_date') start_date: string,
    @Query('end_date') end_date: string,
    @Request() req: any,
  ) {
    const orgId = req?.user?.organization_id;
    return this.hrService.findLeaves(orgId, { user_id, status, start_date, end_date });
  }

  // 查询单条请假
  @Get('leaves/:id')
  findOneLeave(@Param('id') id: string) {
    return this.hrService.findOneLeave(id);
  }

  // 创建请假申请
  @Post('leaves')
  createLeave(@Body() body: Partial<HrLeave>, @Request() req: any) {
    const userId = req?.user?.id;
    const orgId = req?.user?.organization_id;
    return this.hrService.createLeave(userId, orgId, body);
  }

  // 更新请假（仅待审批状态可编辑）
  @Put('leaves/:id')
  updateLeave(@Param('id') id: string, @Body() body: Partial<HrLeave>) {
    return this.hrService.updateLeave(id, body);
  }

  // 删除请假
  @Delete('leaves/:id')
  deleteLeave(@Param('id') id: string) {
    return this.hrService.deleteLeave(id);
  }

  // 审批通过
  @Put('leaves/:id/approve')
  approveLeave(
    @Param('id') id: string,
    @Body() body: { comment?: string },
    @Request() req: any,
  ) {
    return this.hrService.approveLeave(id, req?.user?.id, body?.comment);
  }

  // 驳回
  @Put('leaves/:id/reject')
  rejectLeave(
    @Param('id') id: string,
    @Body() body: { comment?: string },
    @Request() req: any,
  ) {
    return this.hrService.rejectLeave(id, req?.user?.id, body?.comment);
  }

  // 撤销请假
  @Put('leaves/:id/cancel')
  cancelLeave(@Param('id') id: string) {
    return this.hrService.cancelLeave(id);
  }

  // ==================== 考勤管理 ====================

  // 查询考勤列表（支持 user_id/status/start_date/end_date 筛选）
  @Get('attendances')
  findAttendances(
    @Query('user_id') user_id: string,
    @Query('status') status: string,
    @Query('start_date') start_date: string,
    @Query('end_date') end_date: string,
    @Request() req: any,
  ) {
    const orgId = req?.user?.organization_id;
    return this.hrService.findAttendances(orgId, { user_id, status, start_date, end_date });
  }

  // 创建考勤记录
  @Post('attendances')
  createAttendance(@Body() body: Partial<Attendance>, @Request() req: any) {
    const userId = req?.user?.id;
    const orgId = req?.user?.organization_id;
    return this.hrService.createAttendance(userId, orgId, body);
  }

  // 上班打卡
  @Post('attendances/clock-in')
  clockIn(@Request() req: any) {
    const userId = req?.user?.id;
    const orgId = req?.user?.organization_id;
    return this.hrService.clockIn(userId, orgId);
  }

  // 下班打卡
  @Post('attendances/clock-out')
  clockOut(@Request() req: any) {
    const userId = req?.user?.id;
    return this.hrService.clockOut(userId);
  }

  // 删除考勤记录
  @Delete('attendances/:id')
  deleteAttendance(@Param('id') id: string) {
    return this.hrService.deleteAttendance(id);
  }

  // ==================== 物品申购/领用 ====================

  // 查询物品申购列表（支持 user_id/status/type/keyword 筛选）
  @Get('materials')
  findMaterials(
    @Query('user_id') user_id: string,
    @Query('status') status: string,
    @Query('type') type: string,
    @Query('keyword') keyword: string,
    @Request() req: any,
  ) {
    const orgId = req?.user?.organization_id;
    return this.hrService.findMaterials(orgId, { user_id, status, type, keyword });
  }

  // 查询单条物品申购
  @Get('materials/:id')
  findOneMaterial(@Param('id') id: string) {
    return this.hrService.findOneMaterial(id);
  }

  // 创建物品申购/领用申请
  @Post('materials')
  createMaterial(@Body() body: Partial<MaterialRequisition>, @Request() req: any) {
    const userId = req?.user?.id;
    const orgId = req?.user?.organization_id;
    return this.hrService.createMaterial(userId, orgId, body);
  }

  // 更新物品申购（仅待审批状态可编辑）
  @Put('materials/:id')
  updateMaterial(@Param('id') id: string, @Body() body: Partial<MaterialRequisition>) {
    return this.hrService.updateMaterial(id, body);
  }

  // 删除物品申购
  @Delete('materials/:id')
  deleteMaterial(@Param('id') id: string) {
    return this.hrService.deleteMaterial(id);
  }

  // 审批通过
  @Put('materials/:id/approve')
  approveMaterial(
    @Param('id') id: string,
    @Body() body: { comment?: string },
    @Request() req: any,
  ) {
    return this.hrService.approveMaterial(id, req?.user?.id, body?.comment);
  }

  // 驳回
  @Put('materials/:id/reject')
  rejectMaterial(
    @Param('id') id: string,
    @Body() body: { comment?: string },
    @Request() req: any,
  ) {
    return this.hrService.rejectMaterial(id, req?.user?.id, body?.comment);
  }

  // 发放物品
  @Put('materials/:id/fulfill')
  fulfillMaterial(@Param('id') id: string) {
    return this.hrService.fulfillMaterial(id);
  }

  // ==================== 活动管理 ====================

  // 查询活动列表（支持 status/activity_type/keyword 筛选）
  @Get('activities')
  findActivities(
    @Query('status') status: string,
    @Query('activity_type') activity_type: string,
    @Query('keyword') keyword: string,
    @Request() req: any,
  ) {
    const orgId = req?.user?.organization_id;
    return this.hrService.findActivities(orgId, { status, activity_type, keyword });
  }

  // 查询单条活动
  @Get('activities/:id')
  findOneActivity(@Param('id') id: string) {
    return this.hrService.findOneActivity(id);
  }

  // 创建活动
  @Post('activities')
  createActivity(@Body() body: Partial<HrActivity>, @Request() req: any) {
    const orgId = req?.user?.organization_id;
    const organizerId = req?.user?.id;
    return this.hrService.createActivity(orgId, organizerId, body);
  }

  // 更新活动
  @Put('activities/:id')
  updateActivity(@Param('id') id: string, @Body() body: Partial<HrActivity>) {
    return this.hrService.updateActivity(id, body);
  }

  // 删除活动
  @Delete('activities/:id')
  deleteActivity(@Param('id') id: string) {
    return this.hrService.deleteActivity(id);
  }

  // 活动报名
  @Post('activities/:id/register')
  registerActivity(@Param('id') id: string, @Request() req: any) {
    return this.hrService.registerActivity(id, req?.user?.id);
  }

  // 取消报名
  @Delete('activities/:id/register')
  unregisterActivity(@Param('id') id: string, @Request() req: any) {
    return this.hrService.unregisterActivity(id, req?.user?.id);
  }

  // 查询用户已报名的活动ID列表
  @Get('my-registrations')
  getMyRegistrations(@Request() req: any) {
    return this.hrService.getUserRegistrations(req?.user?.id);
  }

  // 查询活动的报名人员列表
  @Get('activities/:id/registrations')
  getActivityRegistrations(@Param('id') id: string) {
    return this.hrService.getActivityRegistrations(id);
  }
}
