import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  Schedule,
  ReminderType,
  ScheduleStatus,
} from './schedule.entity';
import {
  ScheduleParticipant,
  ParticipantStatus,
} from './schedule-participant.entity';
import { MeetingRoom, MeetingRoomStatus } from './meeting-room.entity';
import {
  MeetingRoomBooking,
  BookingStatus,
} from './meeting-room-booking.entity';
import { WorklogService } from '../worklog/worklog.service';

// 日程查询参数
export interface ScheduleQueryParams {
  creator_id?: string;
  related_case_id?: string;
  status?: string;
  startDate?: string; // 开始时间下限
  endDate?: string; // 开始时间上限
}

// 提醒类型对应的提前量（毫秒）
const REMINDER_OFFSET_MS: Record<string, number> = {
  [ReminderType.NONE]: 0,
  [ReminderType.BEFORE_5MIN]: 5 * 60 * 1000,
  [ReminderType.BEFORE_15MIN]: 15 * 60 * 1000,
  [ReminderType.BEFORE_1HOUR]: 60 * 60 * 1000,
  [ReminderType.BEFORE_1DAY]: 24 * 60 * 60 * 1000,
};

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(Schedule)
    private scheduleRepository: Repository<Schedule>,
    @InjectRepository(ScheduleParticipant)
    private participantRepository: Repository<ScheduleParticipant>,
    @InjectRepository(MeetingRoom)
    private meetingRoomRepository: Repository<MeetingRoom>,
    @InjectRepository(MeetingRoomBooking)
    private bookingRepository: Repository<MeetingRoomBooking>,
    // 注入工作日志服务，用于"日程转日志"功能
    private readonly worklogService: WorklogService,
    private dataSource: DataSource,
  ) {}

  // ============== 日程相关 ==============

  // 根据提醒类型与开始时间计算提醒时间
  private calcReminderTime(
    startTime: Date,
    reminderType: string,
  ): Date | null {
    const offset = REMINDER_OFFSET_MS[reminderType] ?? 0;
    if (!offset) return null;
    return new Date(startTime.getTime() - offset);
  }

  // 创建日程
  async createSchedule(
    userId: string,
    orgId: string,
    data: Partial<Schedule>,
  ): Promise<Schedule> {
    if (!data.title) {
      throw new BadRequestException('标题不能为空');
    }
    if (!data.start_time || !data.end_time) {
      throw new BadRequestException('开始时间与结束时间不能为空');
    }
    const startTime = new Date(data.start_time);
    const endTime = new Date(data.end_time);
    if (endTime.getTime() < startTime.getTime()) {
      throw new BadRequestException('结束时间不能早于开始时间');
    }
    const reminderType = data.reminder_type || ReminderType.NONE;
    const schedule = this.scheduleRepository.create({
      ...data,
      creator_id: userId,
      organization_id: orgId,
      reminder_type: reminderType,
      reminder_time: this.calcReminderTime(startTime, reminderType),
      status: data.status || ScheduleStatus.ACTIVE,
    });
    return this.scheduleRepository.save(schedule);
  }

  // 查询日程列表（支持按 creator_id/related_case_id/status/startDate/endDate 筛选）
  async findAllSchedules(
    orgId: string,
    params: ScheduleQueryParams = {},
  ): Promise<Schedule[]> {
    const qb = this.scheduleRepository
      .createQueryBuilder('s')
      .where('s.organization_id = :orgId', { orgId });

    if (params.creator_id) {
      qb.andWhere('s.creator_id = :creatorId', {
        creatorId: params.creator_id,
      });
    }
    if (params.related_case_id) {
      qb.andWhere('s.related_case_id = :caseId', {
        caseId: params.related_case_id,
      });
    }
    if (params.status) {
      qb.andWhere('s.status = :status', { status: params.status });
    }
    if (params.startDate) {
      qb.andWhere('s.start_time >= :startDate', { startDate: params.startDate });
    }
    if (params.endDate) {
      qb.andWhere('s.start_time <= :endDate', { endDate: params.endDate });
    }

    qb.orderBy('s.start_time', 'ASC');
    return qb.getMany();
  }

  // 按日期范围查询日程（按开始时间在区间内筛选）
  async findByDateRange(
    orgId: string,
    startDate: string,
    endDate: string,
  ): Promise<Schedule[]> {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate 与 endDate 不能为空');
    }
    return this.scheduleRepository
      .createQueryBuilder('s')
      .where('s.organization_id = :orgId', { orgId })
      .andWhere('s.start_time >= :startDate', { startDate })
      .andWhere('s.start_time <= :endDate', { endDate })
      .orderBy('s.start_time', 'ASC')
      .getMany();
  }

  // 查询我的日程：我创建的 + 我作为参与人被邀请的
  async findMine(
    userId: string,
    orgId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<Schedule[]> {
    // 我创建的日程
    const createdQb = this.scheduleRepository
      .createQueryBuilder('s')
      .where('s.organization_id = :orgId', { orgId })
      .andWhere('s.creator_id = :userId', { userId });
    if (startDate) {
      createdQb.andWhere('s.start_time >= :startDate', { startDate });
    }
    if (endDate) {
      createdQb.andWhere('s.start_time <= :endDate', { endDate });
    }
    const created = await createdQb.getMany();

    // 我作为参与人被邀请的日程
    const participated = await this.scheduleRepository
      .createQueryBuilder('s')
      .innerJoin(
        ScheduleParticipant,
        'p',
        'p.schedule_id = s.id AND p.user_id = :userId',
        { userId },
      )
      .where('s.organization_id = :orgId', { orgId })
      .andWhere('s.creator_id <> :userId', { userId })
      .getMany();

    const map = new Map<string, Schedule>();
    for (const s of created) map.set(s.id, s);
    for (const s of participated) map.set(s.id, s);

    // 按开始时间升序
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    );
  }

  // 查询单个日程
  async findOneSchedule(id: string): Promise<Schedule> {
    const schedule = await this.scheduleRepository.findOne({ where: { id } });
    if (!schedule) {
      throw new NotFoundException('日程不存在');
    }
    return schedule;
  }

  // 更新日程
  async updateSchedule(
    id: string,
    data: Partial<Schedule>,
  ): Promise<Schedule> {
    const schedule = await this.scheduleRepository.findOne({ where: { id } });
    if (!schedule) {
      throw new NotFoundException('日程不存在');
    }
    // 不允许通过 update 直接修改 id / organization_id / creator_id
    const {
      id: _id,
      organization_id: _orgId,
      creator_id: _creatorId,
      ...rest
    } = data;

    // 若修改了开始时间或提醒类型，重新计算提醒时间
    const newStartTime = rest.start_time
      ? new Date(rest.start_time)
      : schedule.start_time;
    const newReminderType = rest.reminder_type ?? schedule.reminder_type;
    rest.reminder_time = this.calcReminderTime(newStartTime, newReminderType);

    await this.scheduleRepository.update(id, rest);
    return this.scheduleRepository.findOne({ where: { id } });
  }

  // 删除日程（同时删除参与人与预约记录，使用事务保证一致性）
  async deleteSchedule(id: string): Promise<void> {
    const schedule = await this.scheduleRepository.findOne({ where: { id } });
    if (!schedule) {
      throw new NotFoundException('日程不存在');
    }
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(ScheduleParticipant, { schedule_id: id });
      await manager.delete(MeetingRoomBooking, { schedule_id: id });
      await manager.delete(Schedule, id);
    });
  }

  // ============== 参与人相关 ==============

  // 添加参与人
  async addParticipant(
    scheduleId: string,
    orgId: string,
    userId: string,
  ): Promise<ScheduleParticipant> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id: scheduleId },
    });
    if (!schedule) {
      throw new NotFoundException('日程不存在');
    }
    // 同一日程同一用户只能添加一次
    const exist = await this.participantRepository.findOne({
      where: { schedule_id: scheduleId, user_id: userId },
    });
    if (exist) {
      throw new BadRequestException('该用户已是参与人');
    }
    const participant = this.participantRepository.create({
      schedule_id: scheduleId,
      user_id: userId,
      organization_id: orgId,
      status: ParticipantStatus.PENDING,
    });
    return this.participantRepository.save(participant);
  }

  // 移除参与人
  async removeParticipant(
    scheduleId: string,
    userId: string,
  ): Promise<void> {
    const participant = await this.participantRepository.findOne({
      where: { schedule_id: scheduleId, user_id: userId },
    });
    if (!participant) {
      throw new NotFoundException('参与人不存在');
    }
    await this.participantRepository.delete(participant.id);
  }

  // 响应参与（接受/拒绝）
  async respondParticipant(
    scheduleId: string,
    userId: string,
    status: string,
  ): Promise<ScheduleParticipant> {
    if (![ParticipantStatus.ACCEPTED, ParticipantStatus.DECLINED].includes(status as any)) {
      throw new BadRequestException('响应状态仅支持 accepted / declined');
    }
    const participant = await this.participantRepository.findOne({
      where: { schedule_id: scheduleId, user_id: userId },
    });
    if (!participant) {
      throw new NotFoundException('参与人不存在');
    }
    await this.participantRepository.update(participant.id, { status });
    return this.participantRepository.findOne({
      where: { id: participant.id },
    });
  }

  // 查询日程参与人列表
  async listParticipants(scheduleId: string): Promise<ScheduleParticipant[]> {
    return this.participantRepository.find({
      where: { schedule_id: scheduleId },
      order: { created_at: 'ASC' },
    });
  }

  // ============== 会议室相关 ==============

  // 创建会议室
  async createMeetingRoom(
    orgId: string,
    data: Partial<MeetingRoom>,
  ): Promise<MeetingRoom> {
    if (!data.name) {
      throw new BadRequestException('会议室名称不能为空');
    }
    const room = this.meetingRoomRepository.create({
      ...data,
      organization_id: orgId,
      status: data.status || MeetingRoomStatus.AVAILABLE,
    });
    return this.meetingRoomRepository.save(room);
  }

  // 查询会议室列表
  async findAllMeetingRooms(
    orgId: string,
    status?: string,
  ): Promise<MeetingRoom[]> {
    const qb = this.meetingRoomRepository
      .createQueryBuilder('r')
      .where('r.organization_id = :orgId', { orgId });
    if (status) {
      qb.andWhere('r.status = :status', { status });
    }
    qb.orderBy('r.created_at', 'DESC');
    return qb.getMany();
  }

  // 更新会议室
  async updateMeetingRoom(
    id: string,
    data: Partial<MeetingRoom>,
  ): Promise<MeetingRoom> {
    const room = await this.meetingRoomRepository.findOne({ where: { id } });
    if (!room) {
      throw new NotFoundException('会议室不存在');
    }
    const { id: _id, organization_id: _orgId, ...rest } = data;
    await this.meetingRoomRepository.update(id, rest);
    return this.meetingRoomRepository.findOne({ where: { id } });
  }

  // 删除会议室
  async deleteMeetingRoom(id: string): Promise<void> {
    const room = await this.meetingRoomRepository.findOne({ where: { id } });
    if (!room) {
      throw new NotFoundException('会议室不存在');
    }
    await this.meetingRoomRepository.delete(id);
  }

  // ============== 会议室预约相关 ==============

  // 检查会议室时间冲突：同一会议室同一时间段内已有"已批准"或"待审批"预约
  async checkBookingConflict(
    roomId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string,
  ): Promise<boolean> {
    const qb = this.bookingRepository
      .createQueryBuilder('b')
      .where('b.room_id = :roomId', { roomId })
      .andWhere('b.status IN (:...statuses)', {
        statuses: [BookingStatus.PENDING, BookingStatus.APPROVED],
      })
      // 时间区间相交：b.start_time < endTime AND b.end_time > startTime
      .andWhere('b.start_time < :endTime', { endTime })
      .andWhere('b.end_time > :startTime', { startTime });
    if (excludeBookingId) {
      qb.andWhere('b.id <> :excludeBookingId', { excludeBookingId });
    }
    const count = await qb.getCount();
    return count > 0;
  }

  // 创建会议室预约
  async createBooking(
    userId: string,
    orgId: string,
    data: Partial<MeetingRoomBooking>,
  ): Promise<MeetingRoomBooking> {
    if (!data.room_id) {
      throw new BadRequestException('会议室ID不能为空');
    }
    if (!data.schedule_id) {
      throw new BadRequestException('关联日程ID不能为空');
    }
    if (!data.start_time || !data.end_time) {
      throw new BadRequestException('开始时间与结束时间不能为空');
    }
    const startTime = new Date(data.start_time);
    const endTime = new Date(data.end_time);
    if (endTime.getTime() <= startTime.getTime()) {
      throw new BadRequestException('结束时间必须晚于开始时间');
    }
    // 校验会议室存在且可用
    const room = await this.meetingRoomRepository.findOne({
      where: { id: data.room_id },
    });
    if (!room) {
      throw new NotFoundException('会议室不存在');
    }
    if (room.status !== MeetingRoomStatus.AVAILABLE) {
      throw new BadRequestException('该会议室当前不可用');
    }
    // 校验日程存在
    const schedule = await this.scheduleRepository.findOne({
      where: { id: data.schedule_id },
    });
    if (!schedule) {
      throw new NotFoundException('关联日程不存在');
    }
    // 检查时间冲突
    const conflict = await this.checkBookingConflict(
      data.room_id,
      startTime,
      endTime,
    );
    if (conflict) {
      throw new BadRequestException('该会议室在所选时间段内已被预约');
    }
    // 预约日期按开始时间取日期部分
    const bookingDate = startTime.toISOString().slice(0, 10);
    const booking = this.bookingRepository.create({
      ...data,
      booking_date: data.booking_date || bookingDate,
      start_time: startTime,
      end_time: endTime,
      booker_id: userId,
      organization_id: orgId,
      status: data.status || BookingStatus.PENDING,
    });
    return this.bookingRepository.save(booking);
  }

  // 查询预约记录列表
  async findAllBookings(
    orgId: string,
    roomId?: string,
    status?: string,
    bookerId?: string,
  ): Promise<any[]> {
    const qb = this.bookingRepository
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.organization', 'org')
      .where('b.organization_id = :orgId', { orgId });
    if (roomId) {
      qb.andWhere('b.room_id = :roomId', { roomId });
    }
    if (status) {
      qb.andWhere('b.status = :status', { status });
    }
    if (bookerId) {
      qb.andWhere('b.booker_id = :bookerId', { bookerId });
    }
    qb.orderBy('b.created_at', 'DESC');
    const bookings = await qb.getMany();
    // 关联查询会议室与日程信息
    const roomIds = Array.from(new Set(bookings.map((b) => b.room_id)));
    const scheduleIds = Array.from(new Set(bookings.map((b) => b.schedule_id)));
    const rooms = roomIds.length
      ? await this.meetingRoomRepository
          .createQueryBuilder('r')
          .where('r.id IN (:...ids)', { ids: roomIds })
          .getMany()
      : [];
    const schedules = scheduleIds.length
      ? await this.scheduleRepository
          .createQueryBuilder('s')
          .where('s.id IN (:...ids)', { ids: scheduleIds })
          .getMany()
      : [];
    const roomMap = new Map(rooms.map((r) => [r.id, r]));
    const scheduleMap = new Map(schedules.map((s) => [s.id, s]));
    return bookings.map((b) => ({
      ...b,
      room: roomMap.get(b.room_id) || null,
      schedule: scheduleMap.get(b.schedule_id) || null,
    }));
  }

  // 审批通过预约
  async approveBooking(id: string): Promise<MeetingRoomBooking> {
    const booking = await this.bookingRepository.findOne({ where: { id } });
    if (!booking) {
      throw new NotFoundException('预约记录不存在');
    }
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('仅待审批状态的预约可以审批');
    }
    // 再次校验时间冲突（避免审批期间产生新冲突）
    const conflict = await this.checkBookingConflict(
      booking.room_id,
      new Date(booking.start_time),
      new Date(booking.end_time),
      booking.id,
    );
    if (conflict) {
      throw new BadRequestException('该会议室在预约时间段内已存在冲突预约');
    }
    // 同会议室同时间段其他待审批预约自动标记为拒绝
    const others = await this.bookingRepository.find({
      where: {
        room_id: booking.room_id,
        status: BookingStatus.PENDING,
      },
    });
    for (const other of others) {
      if (other.id === booking.id) continue;
      const otherStart = new Date(other.start_time);
      const otherEnd = new Date(other.end_time);
      if (otherStart < booking.end_time && otherEnd > booking.start_time) {
        await this.bookingRepository.update(other.id, {
          status: BookingStatus.REJECTED,
        });
      }
    }
    await this.bookingRepository.update(id, { status: BookingStatus.APPROVED });
    return this.bookingRepository.findOne({ where: { id } });
  }

  // 拒绝预约
  async rejectBooking(id: string): Promise<MeetingRoomBooking> {
    const booking = await this.bookingRepository.findOne({ where: { id } });
    if (!booking) {
      throw new NotFoundException('预约记录不存在');
    }
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('仅待审批状态的预约可以拒绝');
    }
    await this.bookingRepository.update(id, { status: BookingStatus.REJECTED });
    return this.bookingRepository.findOne({ where: { id } });
  }

  // ============== 转日志相关 ==============

  // 日程转工作日志：调用 WorklogService.convertFromSchedule 完成
  async convertToLog(
    id: string,
    userId: string,
    organizationId: string,
  ) {
    // 先校验日程存在
    const schedule = await this.scheduleRepository.findOne({ where: { id } });
    if (!schedule) {
      throw new NotFoundException('日程不存在');
    }
    return this.worklogService.convertFromSchedule(id, userId, organizationId);
  }
}
