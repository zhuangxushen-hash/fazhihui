import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HrLeave, LeaveStatus } from './leave.entity';
import { Attendance, AttendanceStatus } from './attendance.entity';
import { MaterialRequisition, MaterialStatus } from './material-requisition.entity';
import { HrActivity, ActivityStatus } from './activity.entity';
import { ActivityRegistration } from './activity-registration.entity';

// HR查询参数
export interface HrQueryParams {
  user_id?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  keyword?: string;
}

@Injectable()
export class HrService {
  constructor(
    @InjectRepository(HrLeave)
    private leaveRepository: Repository<HrLeave>,
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(MaterialRequisition)
    private materialRepository: Repository<MaterialRequisition>,
    @InjectRepository(HrActivity)
    private activityRepository: Repository<HrActivity>,
    @InjectRepository(ActivityRegistration)
    private registrationRepository: Repository<ActivityRegistration>,
  ) {}

  // ==================== 请假管理 ====================

  // 创建请假申请
  async createLeave(userId: string, orgId: string, data: Partial<HrLeave>): Promise<HrLeave> {
    const leave = this.leaveRepository.create({
      ...data,
      user_id: userId,
      organization_id: orgId,
      status: LeaveStatus.PENDING,
    });
    return this.leaveRepository.save(leave);
  }

  // 查询请假列表（支持按 user_id/status/日期 筛选）
  async findLeaves(orgId: string, params: HrQueryParams = {}): Promise<HrLeave[]> {
    const qb = this.leaveRepository
      .createQueryBuilder('l')
      .where('l.organization_id = :orgId', { orgId });

    if (params.user_id) {
      qb.andWhere('l.user_id = :userId', { userId: params.user_id });
    }
    if (params.status) {
      qb.andWhere('l.status = :status', { status: params.status });
    }
    if (params.start_date) {
      qb.andWhere('l.start_date >= :startDate', { startDate: params.start_date });
    }
    if (params.end_date) {
      qb.andWhere('l.end_date <= :endDate', { endDate: params.end_date });
    }

    qb.orderBy('l.updated_at', 'DESC');
    return qb.getMany();
  }

  // 查询单条请假
  async findOneLeave(id: string): Promise<HrLeave> {
    const leave = await this.leaveRepository.findOne({ where: { id } });
    if (!leave) {
      throw new NotFoundException('请假记录不存在');
    }
    return leave;
  }

  // 更新请假（仅待审批状态可编辑）
  async updateLeave(id: string, data: Partial<HrLeave>): Promise<HrLeave> {
    const leave = await this.leaveRepository.findOne({ where: { id } });
    if (!leave) {
      throw new NotFoundException('请假记录不存在');
    }
    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('仅待审批状态的请假可以编辑');
    }
    // 不允许通过 update 修改状态与审批相关字段，保持状态流转通过专用方法处理
    const { status, approver_id, approve_comment, approve_time, ...rest } = data;
    await this.leaveRepository.update(id, rest);
    return this.leaveRepository.findOne({ where: { id } });
  }

  // 删除请假
  async deleteLeave(id: string): Promise<void> {
    const leave = await this.leaveRepository.findOne({ where: { id } });
    if (!leave) {
      throw new NotFoundException('请假记录不存在');
    }
    await this.leaveRepository.delete(id);
  }

  // 审批通过：待审批 -> 已批准
  async approveLeave(id: string, approverId: string, comment?: string): Promise<HrLeave> {
    const leave = await this.leaveRepository.findOne({ where: { id } });
    if (!leave) {
      throw new NotFoundException('请假记录不存在');
    }
    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('仅待审批状态的请假可以审批通过');
    }
    await this.leaveRepository.update(id, {
      status: LeaveStatus.APPROVED,
      approver_id: approverId,
      approve_comment: comment,
      approve_time: new Date(),
    });
    return this.leaveRepository.findOne({ where: { id } });
  }

  // 驳回：待审批 -> 已驳回
  async rejectLeave(id: string, approverId: string, comment?: string): Promise<HrLeave> {
    const leave = await this.leaveRepository.findOne({ where: { id } });
    if (!leave) {
      throw new NotFoundException('请假记录不存在');
    }
    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('仅待审批状态的请假可以驳回');
    }
    await this.leaveRepository.update(id, {
      status: LeaveStatus.REJECTED,
      approver_id: approverId,
      approve_comment: comment,
      approve_time: new Date(),
    });
    return this.leaveRepository.findOne({ where: { id } });
  }

  // 撤销请假：待审批 -> 已撤销
  async cancelLeave(id: string): Promise<HrLeave> {
    const leave = await this.leaveRepository.findOne({ where: { id } });
    if (!leave) {
      throw new NotFoundException('请假记录不存在');
    }
    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('仅待审批状态的请假可以撤销');
    }
    await this.leaveRepository.update(id, { status: LeaveStatus.CANCELLED });
    return this.leaveRepository.findOne({ where: { id } });
  }

  // ==================== 考勤管理 ====================

  // 创建考勤记录
  async createAttendance(userId: string, orgId: string, data: Partial<Attendance>): Promise<Attendance> {
    const attendance = this.attendanceRepository.create({
      ...data,
      user_id: userId,
      organization_id: orgId,
    });
    return this.attendanceRepository.save(attendance);
  }

  // 查询考勤列表（支持按 user_id/status/日期 筛选）
  async findAttendances(orgId: string, params: HrQueryParams = {}): Promise<Attendance[]> {
    const qb = this.attendanceRepository
      .createQueryBuilder('a')
      .where('a.organization_id = :orgId', { orgId });

    if (params.user_id) {
      qb.andWhere('a.user_id = :userId', { userId: params.user_id });
    }
    if (params.status) {
      qb.andWhere('a.status = :status', { status: params.status });
    }
    if (params.start_date) {
      qb.andWhere('a.attendance_date >= :startDate', { startDate: params.start_date });
    }
    if (params.end_date) {
      qb.andWhere('a.attendance_date <= :endDate', { endDate: params.end_date });
    }

    qb.orderBy('a.attendance_date', 'DESC');
    return qb.getMany();
  }

  // 上班打卡：检查当天是否已打卡，未打卡则创建记录
  async clockIn(userId: string, orgId: string): Promise<Attendance> {
    const today = new Date().toISOString().slice(0, 10);
    // 查询当天是否已有考勤记录
    const existing = await this.attendanceRepository.findOne({
      where: { user_id: userId, attendance_date: today },
    });
    if (existing && existing.clock_in_time) {
      throw new BadRequestException('今日已打卡上班');
    }

    const now = new Date();
    // 判断是否迟到（9:00后算迟到）
    const hour = now.getHours();
    const minute = now.getMinutes();
    const isLate = hour > 9 || (hour === 9 && minute > 0);

    if (existing) {
      // 已有记录但没有上班打卡时间，更新上班打卡
      await this.attendanceRepository.update(existing.id, {
        clock_in_time: now,
        status: isLate ? AttendanceStatus.LATE : AttendanceStatus.NORMAL,
      });
      return this.attendanceRepository.findOne({ where: { id: existing.id } });
    }

    // 创建新考勤记录
    const attendance = this.attendanceRepository.create({
      user_id: userId,
      organization_id: orgId,
      attendance_date: today,
      clock_in_time: now,
      status: isLate ? AttendanceStatus.LATE : AttendanceStatus.NORMAL,
      work_hours: 0,
    });
    return this.attendanceRepository.save(attendance);
  }

  // 下班打卡：更新当天考勤记录的下班时间和工作时长
  async clockOut(userId: string): Promise<Attendance> {
    const today = new Date().toISOString().slice(0, 10);
    const existing = await this.attendanceRepository.findOne({
      where: { user_id: userId, attendance_date: today },
    });
    if (!existing) {
      throw new BadRequestException('今日尚未打卡上班');
    }
    if (existing.clock_out_time) {
      throw new BadRequestException('今日已打卡下班');
    }

    const now = new Date();
    // 计算工作时长（小时，保留1位小数）
    const diffMs = now.getTime() - new Date(existing.clock_in_time).getTime();
    const hours = Math.max(0, Math.round((diffMs / (60 * 60 * 1000)) * 10) / 10);

    // 判断是否早退（18:00前算早退）
    const hour = now.getHours();
    const isEarlyLeave = hour < 18;
    let status = existing.status;
    if (isEarlyLeave) {
      status = AttendanceStatus.EARLY_LEAVE;
    }

    await this.attendanceRepository.update(existing.id, {
      clock_out_time: now,
      work_hours: hours,
      status,
    });
    return this.attendanceRepository.findOne({ where: { id: existing.id } });
  }

  // 删除考勤记录
  async deleteAttendance(id: string): Promise<void> {
    const attendance = await this.attendanceRepository.findOne({ where: { id } });
    if (!attendance) {
      throw new NotFoundException('考勤记录不存在');
    }
    await this.attendanceRepository.delete(id);
  }

  // ==================== 物品申购/领用 ====================

  // 创建物品申购/领用申请
  async createMaterial(userId: string, orgId: string, data: Partial<MaterialRequisition>): Promise<MaterialRequisition> {
    const material = this.materialRepository.create({
      ...data,
      user_id: userId,
      organization_id: orgId,
      status: MaterialStatus.PENDING,
    });
    return this.materialRepository.save(material);
  }

  // 查询物品申购列表（支持按 user_id/status/type 筛选）
  async findMaterials(orgId: string, params: HrQueryParams & { type?: string } = {}): Promise<MaterialRequisition[]> {
    const qb = this.materialRepository
      .createQueryBuilder('m')
      .where('m.organization_id = :orgId', { orgId });

    if (params.user_id) {
      qb.andWhere('m.user_id = :userId', { userId: params.user_id });
    }
    if (params.status) {
      qb.andWhere('m.status = :status', { status: params.status });
    }
    if (params.type) {
      qb.andWhere('m.type = :type', { type: params.type });
    }
    if (params.keyword) {
      qb.andWhere('m.material_name LIKE :keyword', { keyword: `%${params.keyword}%` });
    }

    qb.orderBy('m.updated_at', 'DESC');
    return qb.getMany();
  }

  // 查询单条物品申购
  async findOneMaterial(id: string): Promise<MaterialRequisition> {
    const material = await this.materialRepository.findOne({ where: { id } });
    if (!material) {
      throw new NotFoundException('物品申购记录不存在');
    }
    return material;
  }

  // 更新物品申购（仅待审批状态可编辑）
  async updateMaterial(id: string, data: Partial<MaterialRequisition>): Promise<MaterialRequisition> {
    const material = await this.materialRepository.findOne({ where: { id } });
    if (!material) {
      throw new NotFoundException('物品申购记录不存在');
    }
    if (material.status !== MaterialStatus.PENDING) {
      throw new BadRequestException('仅待审批状态的物品申购可以编辑');
    }
    const { status, approver_id, approve_comment, approve_time, ...rest } = data;
    await this.materialRepository.update(id, rest);
    return this.materialRepository.findOne({ where: { id } });
  }

  // 删除物品申购
  async deleteMaterial(id: string): Promise<void> {
    const material = await this.materialRepository.findOne({ where: { id } });
    if (!material) {
      throw new NotFoundException('物品申购记录不存在');
    }
    await this.materialRepository.delete(id);
  }

  // 审批通过：待审批 -> 已批准
  async approveMaterial(id: string, approverId: string, comment?: string): Promise<MaterialRequisition> {
    const material = await this.materialRepository.findOne({ where: { id } });
    if (!material) {
      throw new NotFoundException('物品申购记录不存在');
    }
    if (material.status !== MaterialStatus.PENDING) {
      throw new BadRequestException('仅待审批状态的物品申购可以审批通过');
    }
    await this.materialRepository.update(id, {
      status: MaterialStatus.APPROVED,
      approver_id: approverId,
      approve_comment: comment,
      approve_time: new Date(),
    });
    return this.materialRepository.findOne({ where: { id } });
  }

  // 驳回：待审批 -> 已驳回
  async rejectMaterial(id: string, approverId: string, comment?: string): Promise<MaterialRequisition> {
    const material = await this.materialRepository.findOne({ where: { id } });
    if (!material) {
      throw new NotFoundException('物品申购记录不存在');
    }
    if (material.status !== MaterialStatus.PENDING) {
      throw new BadRequestException('仅待审批状态的物品申购可以驳回');
    }
    await this.materialRepository.update(id, {
      status: MaterialStatus.REJECTED,
      approver_id: approverId,
      approve_comment: comment,
      approve_time: new Date(),
    });
    return this.materialRepository.findOne({ where: { id } });
  }

  // 发放物品：已批准 -> 已发放
  async fulfillMaterial(id: string): Promise<MaterialRequisition> {
    const material = await this.materialRepository.findOne({ where: { id } });
    if (!material) {
      throw new NotFoundException('物品申购记录不存在');
    }
    if (material.status !== MaterialStatus.APPROVED) {
      throw new BadRequestException('仅已批准状态的物品申购可以发放');
    }
    await this.materialRepository.update(id, { status: MaterialStatus.FULFILLED });
    return this.materialRepository.findOne({ where: { id } });
  }

  // ==================== 活动管理 ====================

  // 创建活动
  async createActivity(orgId: string, organizerId: string, data: Partial<HrActivity>): Promise<HrActivity> {
    const activity = this.activityRepository.create({
      ...data,
      organizer_id: organizerId,
      organization_id: orgId,
      status: ActivityStatus.UPCOMING,
    });
    return this.activityRepository.save(activity);
  }

  // 查询活动列表（支持按 status/type/keyword 筛选）
  async findActivities(orgId: string, params: HrQueryParams & { activity_type?: string } = {}): Promise<HrActivity[]> {
    const qb = this.activityRepository
      .createQueryBuilder('a')
      .where('a.organization_id = :orgId', { orgId });

    if (params.status) {
      qb.andWhere('a.status = :status', { status: params.status });
    }
    if (params.activity_type) {
      qb.andWhere('a.activity_type = :activityType', { activityType: params.activity_type });
    }
    if (params.keyword) {
      qb.andWhere('(a.title LIKE :keyword OR a.description LIKE :keyword)', { keyword: `%${params.keyword}%` });
    }

    qb.orderBy('a.start_time', 'DESC');
    return qb.getMany();
  }

  // 查询单条活动
  async findOneActivity(id: string): Promise<HrActivity> {
    const activity = await this.activityRepository.findOne({ where: { id } });
    if (!activity) {
      throw new NotFoundException('活动不存在');
    }
    return activity;
  }

  // 更新活动
  async updateActivity(id: string, data: Partial<HrActivity>): Promise<HrActivity> {
    const activity = await this.activityRepository.findOne({ where: { id } });
    if (!activity) {
      throw new NotFoundException('活动不存在');
    }
    await this.activityRepository.update(id, data);
    return this.activityRepository.findOne({ where: { id } });
  }

  // 删除活动
  async deleteActivity(id: string): Promise<void> {
    const activity = await this.activityRepository.findOne({ where: { id } });
    if (!activity) {
      throw new NotFoundException('活动不存在');
    }
    await this.activityRepository.delete(id);
  }

  // 活动报名：检查是否已报名、是否超出人数限制，然后创建报名记录
  async registerActivity(activityId: string, userId: string): Promise<{ success: boolean; message: string }> {
    const activity = await this.activityRepository.findOne({ where: { id: activityId } });
    if (!activity) {
      throw new NotFoundException('活动不存在');
    }
    if (activity.status === ActivityStatus.CANCELLED || activity.status === ActivityStatus.COMPLETED) {
      throw new BadRequestException('当前活动状态不允许报名');
    }
    // 检查是否已报名
    const existing = await this.registrationRepository.findOne({
      where: { activity_id: activityId, user_id: userId },
    });
    if (existing) {
      throw new BadRequestException('您已报名该活动');
    }
    // 检查人数限制（0表示不限）
    if (activity.max_participants > 0 && activity.registered_count >= activity.max_participants) {
      throw new BadRequestException('活动报名人数已满');
    }
    // 创建报名记录
    const registration = this.registrationRepository.create({
      activity_id: activityId,
      user_id: userId,
    });
    await this.registrationRepository.save(registration);
    // 更新已报名人数
    await this.activityRepository.update(activityId, {
      registered_count: activity.registered_count + 1,
    });
    return { success: true, message: '报名成功' };
  }

  // 取消报名
  async unregisterActivity(activityId: string, userId: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.registrationRepository.findOne({
      where: { activity_id: activityId, user_id: userId },
    });
    if (!existing) {
      throw new BadRequestException('您尚未报名该活动');
    }
    await this.registrationRepository.delete(existing.id);
    // 更新已报名人数
    const activity = await this.activityRepository.findOne({ where: { id: activityId } });
    if (activity) {
      await this.activityRepository.update(activityId, {
        registered_count: Math.max(0, activity.registered_count - 1),
      });
    }
    return { success: true, message: '取消报名成功' };
  }

  // 查询用户已报名的活动ID列表
  async getUserRegistrations(userId: string): Promise<string[]> {
    const registrations = await this.registrationRepository.find({
      where: { user_id: userId },
    });
    return registrations.map(r => r.activity_id);
  }

  // 查询活动的报名人员列表
  async getActivityRegistrations(activityId: string): Promise<ActivityRegistration[]> {
    return this.registrationRepository.find({
      where: { activity_id: activityId },
      order: { created_at: 'ASC' },
    });
  }
}
