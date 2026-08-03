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
import { ScheduleService } from './schedule.service';
import { Schedule } from './schedule.entity';
import { MeetingRoom } from './meeting-room.entity';
import { MeetingRoomBooking } from './meeting-room-booking.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

// 日程管理控制器
@Controller('schedules')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.MARKETING, UserRole.SALES, UserRole.LAWYER, UserRole.ASSISTANT, UserRole.FINANCE)
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  // 查询日程列表（支持按日期范围、创建人、案件、状态筛选）
  @Get()
  findAll(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('creator_id') creatorId: string,
    @Query('related_case_id') relatedCaseId: string,
    @Query('status') status: string,
    @Request() req: any,
  ) {
    const orgId = req?.user?.organization_id;
    // 显式按日期范围查询
    if (startDate && endDate) {
      return this.scheduleService.findByDateRange(orgId, startDate, endDate);
    }
    return this.scheduleService.findAllSchedules(orgId, {
      creator_id: creatorId,
      related_case_id: relatedCaseId,
      status,
      startDate,
      endDate,
    });
  }

  // 查询我的日程（我创建的 + 我作为参与人被邀请的）
  // 注意：此路由需在 :id 路由之前声明，避免 my 被当作 id
  @Get('my')
  findMine(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req: any,
  ) {
    const userId = req?.user?.id;
    const orgId = req?.user?.organization_id;
    return this.scheduleService.findMine(userId, orgId, startDate, endDate);
  }

  // 查询单个日程
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.scheduleService.findOneSchedule(id);
  }

  // 创建日程
  @Post()
  create(@Body() body: Partial<Schedule>, @Request() req: any) {
    const userId = req?.user?.id;
    const orgId = req?.user?.organization_id;
    return this.scheduleService.createSchedule(userId, orgId, body);
  }

  // 日程转工作日志
  @Post(':id/convert-to-log')
  convertToLog(@Param('id') id: string, @Request() req: any) {
    const userId = req?.user?.id;
    const orgId = req?.user?.organization_id;
    return this.scheduleService.convertToLog(id, userId, orgId);
  }

  // 更新日程
  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<Schedule>) {
    return this.scheduleService.updateSchedule(id, body);
  }

  // 删除日程
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.scheduleService.deleteSchedule(id);
  }

  // 添加参与人
  @Post(':id/participants')
  addParticipant(
    @Param('id') id: string,
    @Body() body: { user_id: string },
    @Request() req: any,
  ) {
    const orgId = req?.user?.organization_id;
    return this.scheduleService.addParticipant(id, orgId, body?.user_id);
  }

  // 响应参与（接受/拒绝）
  @Put(':id/participants/:userId')
  respondParticipant(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() body: { status: string },
  ) {
    return this.scheduleService.respondParticipant(
      id,
      userId,
      body?.status,
    );
  }

  // 移除参与人
  @Delete(':id/participants/:userId')
  removeParticipant(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.scheduleService.removeParticipant(id, userId);
  }

  // 查询日程参与人列表
  @Get(':id/participants')
  listParticipants(@Param('id') id: string) {
    return this.scheduleService.listParticipants(id);
  }
}

// 会议室管理控制器
@Controller('meeting-rooms')
@UseGuards(JwtAuthGuard)
export class MeetingRoomController {
  constructor(private readonly scheduleService: ScheduleService) {}

  // 查询会议室列表
  @Get()
  findAll(@Query('status') status: string, @Request() req: any) {
    const orgId = req?.user?.organization_id;
    return this.scheduleService.findAllMeetingRooms(orgId, status);
  }

  // 查询单个会议室
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.scheduleService.findAllMeetingRooms('').then((rooms) =>
      rooms.find((r) => r.id === id),
    );
  }

  // 创建会议室
  @Post()
  create(@Body() body: Partial<MeetingRoom>, @Request() req: any) {
    const orgId = req?.user?.organization_id;
    return this.scheduleService.createMeetingRoom(orgId, body);
  }

  // 更新会议室
  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<MeetingRoom>) {
    return this.scheduleService.updateMeetingRoom(id, body);
  }

  // 删除会议室
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.scheduleService.deleteMeetingRoom(id);
  }
}

// 会议室预约控制器
@Controller('meeting-room-bookings')
@UseGuards(JwtAuthGuard)
export class MeetingRoomBookingController {
  constructor(private readonly scheduleService: ScheduleService) {}

  // 查询预约记录列表
  @Get()
  findAll(
    @Query('room_id') roomId: string,
    @Query('status') status: string,
    @Query('booker_id') bookerId: string,
    @Request() req: any,
  ) {
    const orgId = req?.user?.organization_id;
    return this.scheduleService.findAllBookings(orgId, roomId, status, bookerId);
  }

  // 创建预约
  @Post()
  create(@Body() body: Partial<MeetingRoomBooking>, @Request() req: any) {
    const userId = req?.user?.id;
    const orgId = req?.user?.organization_id;
    return this.scheduleService.createBooking(userId, orgId, body);
  }

  // 审批通过预约
  @Put(':id/approve')
  approve(@Param('id') id: string) {
    return this.scheduleService.approveBooking(id);
  }

  // 拒绝预约
  @Put(':id/reject')
  reject(@Param('id') id: string) {
    return this.scheduleService.rejectBooking(id);
  }
}
