import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Schedule } from './schedule.entity';
import { ScheduleParticipant } from './schedule-participant.entity';
import { MeetingRoom } from './meeting-room.entity';
import { MeetingRoomBooking } from './meeting-room-booking.entity';
import { ScheduleService } from './schedule.service';
import {
  ScheduleController,
  MeetingRoomController,
  MeetingRoomBookingController,
} from './schedule.controller';
import { WorklogModule } from '../worklog/worklog.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Schedule,
      ScheduleParticipant,
      MeetingRoom,
      MeetingRoomBooking,
    ]),
    // 导入 WorklogModule 以支持 ScheduleService 的"转日志"功能
    WorklogModule,
  ],
  providers: [ScheduleService],
  controllers: [
    ScheduleController,
    MeetingRoomController,
    MeetingRoomBookingController,
  ],
  exports: [ScheduleService],
})
export class ScheduleModule {}
