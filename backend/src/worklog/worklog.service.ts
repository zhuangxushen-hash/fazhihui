import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Worklog, WorklogStatus } from './worklog.entity';
import { Schedule } from '../schedule/schedule.entity';
import { UserService } from '../user/user.service';
import { TaskService } from '../task/task.service';
import { Task } from '../task/task.entity';
// Phase4 M10: 工作日志审批通过后回写案件人力成本，引入 CaseCost 实体
import { CaseCost, CostType } from '../finance/case-cost.entity';

// 工时转成本的默认时薪（元/小时）
const DEFAULT_HOURLY_RATE = 200;

// 工作日志查询参数
export interface WorklogQueryParams {
  user_id?: string;
  case_id?: string;
  status?: string;
  startDate?: string; // 工作日期起始
  endDate?: string; // 工作日期结束
}

@Injectable()
export class WorklogService {
  constructor(
    @InjectRepository(Worklog)
    private worklogRepository: Repository<Worklog>,
    // 注入日程实体仓库，用于"日程转日志"功能
    @InjectRepository(Schedule)
    private scheduleRepository: Repository<Schedule>,
    // 注入用户服务，用于审批通过时增加经验值
    private userService: UserService,
    // 注入任务服务，用于审批通过时更新关联任务进度
    private taskService: TaskService,
    // 注入数据源，用于事务管理
    private dataSource: DataSource,
    // Phase4 M10: 注入案件成本仓库，审批通过时回写人力成本
    @InjectRepository(CaseCost)
    private caseCostRepository: Repository<CaseCost>,
  ) {}

  // 创建工作日志
  async create(userId: string, orgId: string, data: Partial<Worklog>): Promise<Worklog> {
    const worklog = this.worklogRepository.create({
      ...data,
      user_id: userId,
      organization_id: orgId,
      status: data.status || WorklogStatus.DRAFT,
    });
    return this.worklogRepository.save(worklog);
  }

  // 查询工作日志列表（支持按 user_id/case_id/status/startDate/endDate 筛选）
  async findAll(orgId: string, params: WorklogQueryParams = {}): Promise<Worklog[]> {
    const qb = this.worklogRepository
      .createQueryBuilder('w')
      .where('w.organization_id = :orgId', { orgId });

    if (params.user_id) {
      qb.andWhere('w.user_id = :userId', { userId: params.user_id });
    }
    if (params.case_id) {
      qb.andWhere('w.case_id = :caseId', { caseId: params.case_id });
    }
    if (params.status) {
      qb.andWhere('w.status = :status', { status: params.status });
    }
    if (params.startDate) {
      qb.andWhere('w.work_date >= :startDate', { startDate: params.startDate });
    }
    if (params.endDate) {
      qb.andWhere('w.work_date <= :endDate', { endDate: params.endDate });
    }

    qb.orderBy('w.work_date', 'DESC').addOrderBy('w.created_at', 'DESC');
    return qb.getMany();
  }

  // 按用户查询工作日志
  async findByUser(userId: string, params: WorklogQueryParams = {}): Promise<Worklog[]> {
    const qb = this.worklogRepository
      .createQueryBuilder('w')
      .where('w.user_id = :userId', { userId });

    if (params.case_id) {
      qb.andWhere('w.case_id = :caseId', { caseId: params.case_id });
    }
    if (params.status) {
      qb.andWhere('w.status = :status', { status: params.status });
    }
    if (params.startDate) {
      qb.andWhere('w.work_date >= :startDate', { startDate: params.startDate });
    }
    if (params.endDate) {
      qb.andWhere('w.work_date <= :endDate', { endDate: params.endDate });
    }

    qb.orderBy('w.work_date', 'DESC').addOrderBy('w.created_at', 'DESC');
    return qb.getMany();
  }

  // 提交工作日志：草稿 -> 已提交
  async submit(id: string): Promise<Worklog> {
    const worklog = await this.worklogRepository.findOne({ where: { id } });
    if (!worklog) {
      throw new NotFoundException('工作日志不存在');
    }
    if (worklog.status !== WorklogStatus.DRAFT) {
      throw new BadRequestException('仅草稿状态的工作日志可以提交');
    }
    await this.worklogRepository.update(id, { status: WorklogStatus.SUBMITTED });
    return this.worklogRepository.findOne({ where: { id } });
  }

  // 审批通过：已提交 -> 已通过
  async approve(id: string, approverId: string, comment?: string): Promise<Worklog> {
    const worklog = await this.worklogRepository.findOne({ where: { id } });
    if (!worklog) {
      throw new NotFoundException('工作日志不存在');
    }
    if (worklog.status !== WorklogStatus.SUBMITTED) {
      throw new BadRequestException('仅已提交状态的工作日志可以审批通过');
    }
    return await this.dataSource.transaction(async (manager) => {
      // 1. 更新工作日志状态为已通过
      await manager.update(Worklog, id, {
        status: WorklogStatus.APPROVED,
        approver_id: approverId,
        approve_comment: comment,
        approve_time: new Date(),
      });
      // 2. 审批通过时为日志提交人增加经验值（工时×10）
      if (worklog.user_id && worklog.work_hours) {
        await this.userService.addExperience(worklog.user_id, Math.round(Number(worklog.work_hours) * 10), '工作日志审批通过');
      }
      // 3. 若工作日志关联了任务，则更新任务进度
      if (worklog.task_id && worklog.work_hours) {
        const task = await manager.findOne(Task, { where: { id: worklog.task_id } });
        if (task && task.status !== 'cancelled' && task.status !== 'completed') {
          const progressAdd = Math.min(Number(worklog.work_hours) * 10, 100);
          const newProgress = Math.min(Number(task.progress || 0) + progressAdd, 100);
          if (newProgress >= 100) {
            // 若任务当前非进行中状态，需先开始再完成，避免 complete 方法的状态校验失败
            if (task.status === 'pending') {
              await this.taskService.start(task.id);
            }
            await this.taskService.complete(task.id);
          } else {
            await this.taskService.updateProgress(task.id, newProgress);
          }
        }
      }
      // Phase4 M10: 若工作日志关联案件且有工时，则回写一条人力成本记录到案件成本
      if (worklog.case_id && worklog.work_hours) {
        const hours = Number(worklog.work_hours) || 0;
        const laborAmount = Math.round(hours * DEFAULT_HOURLY_RATE * 100) / 100;
        const incurredDate = worklog.work_date ? new Date(worklog.work_date) : new Date();
        const costRecord = manager.create(CaseCost, {
          case_id: worklog.case_id,
          cost_type: CostType.LABOR,
          amount: laborAmount,
          description: `工作日志人力成本（工时${hours}小时×时薪${DEFAULT_HOURLY_RATE}元）`,
          incurred_date: incurredDate,
          organization_id: worklog.organization_id,
        });
        await manager.save(CaseCost, costRecord);
      }
      // 4. 返回更新后的工作日志
      return manager.findOne(Worklog, { where: { id } });
    });
  }

  // 驳回：已提交 -> 已驳回
  async reject(id: string, approverId: string, comment?: string): Promise<Worklog> {
    const worklog = await this.worklogRepository.findOne({ where: { id } });
    if (!worklog) {
      throw new NotFoundException('工作日志不存在');
    }
    if (worklog.status !== WorklogStatus.SUBMITTED) {
      throw new BadRequestException('仅已提交状态的工作日志可以驳回');
    }
    await this.worklogRepository.update(id, {
      status: WorklogStatus.REJECTED,
      approver_id: approverId,
      approve_comment: comment,
      approve_time: new Date(),
    });
    return this.worklogRepository.findOne({ where: { id } });
  }

  // 更新工作日志（仅草稿可编辑）
  async update(id: string, data: Partial<Worklog>): Promise<Worklog> {
    const worklog = await this.worklogRepository.findOne({ where: { id } });
    if (!worklog) {
      throw new NotFoundException('工作日志不存在');
    }
    if (worklog.status !== WorklogStatus.DRAFT) {
      throw new BadRequestException('仅草稿状态的工作日志可以编辑');
    }
    // 不允许通过 update 修改状态与审批相关字段，保持原逻辑
    const { status, approver_id, approve_comment, approve_time, ...rest } = data;
    await this.worklogRepository.update(id, rest);
    return this.worklogRepository.findOne({ where: { id } });
  }

  // 删除工作日志
  async delete(id: string): Promise<void> {
    const worklog = await this.worklogRepository.findOne({ where: { id } });
    if (!worklog) {
      throw new NotFoundException('工作日志不存在');
    }
    await this.worklogRepository.delete(id);
  }

  // 工时统计：按人/按案/按月统计工时
  async getStats(orgId: string, params: WorklogQueryParams = {}): Promise<{
    total_hours: number;
    billable_hours: number;
    month_hours: number;
    by_user: Array<{ user_id: string; total_hours: number; billable_hours: number; case_count: number }>;
    by_case: Array<{ case_id: string; total_hours: number; billable_hours: number }>;
    by_month: Array<{ month: string; total_hours: number; billable_hours: number }>;
  }> {
    const qb = this.worklogRepository
      .createQueryBuilder('w')
      .where('w.organization_id = :orgId', { orgId });

    if (params.user_id) {
      qb.andWhere('w.user_id = :userId', { userId: params.user_id });
    }
    if (params.case_id) {
      qb.andWhere('w.case_id = :caseId', { caseId: params.case_id });
    }
    if (params.status) {
      qb.andWhere('w.status = :status', { status: params.status });
    }
    if (params.startDate) {
      qb.andWhere('w.work_date >= :startDate', { startDate: params.startDate });
    }
    if (params.endDate) {
      qb.andWhere('w.work_date <= :endDate', { endDate: params.endDate });
    }

    const list = await qb.getMany();

    // 总工时
    const totalHours = list.reduce((sum, w) => sum + Number(w.work_hours), 0);
    // 计费工时
    const billableHours = list
      .filter((w) => w.billable)
      .reduce((sum, w) => sum + Number(w.work_hours), 0);

    // 本月工时
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthHours = list
      .filter((w) => (w.work_date || '').startsWith(yearMonth))
      .reduce((sum, w) => sum + Number(w.work_hours), 0);

    // 按律师统计
    const userMap = new Map<
      string,
      { user_id: string; total_hours: number; billable_hours: number; case_count: number }
    >();
    for (const w of list) {
      if (!userMap.has(w.user_id)) {
        userMap.set(w.user_id, {
          user_id: w.user_id,
          total_hours: 0,
          billable_hours: 0,
          case_count: 0,
        });
      }
      const u = userMap.get(w.user_id)!;
      u.total_hours += Number(w.work_hours);
      if (w.billable) u.billable_hours += Number(w.work_hours);
    }
    // 案件数：统计每个律师关联的不同案件数量
    const userCaseMap = new Map<string, Set<string>>();
    for (const w of list) {
      if (!w.case_id) continue;
      if (!userCaseMap.has(w.user_id)) userCaseMap.set(w.user_id, new Set());
      userCaseMap.get(w.user_id)!.add(w.case_id);
    }
    for (const u of userMap.values()) {
      u.case_count = userCaseMap.get(u.user_id)?.size || 0;
      // 保留1位小数
      u.total_hours = Math.round(u.total_hours * 10) / 10;
      u.billable_hours = Math.round(u.billable_hours * 10) / 10;
    }

    // 按案件统计
    const caseMap = new Map<string, { case_id: string; total_hours: number; billable_hours: number }>();
    for (const w of list) {
      if (!w.case_id) continue;
      if (!caseMap.has(w.case_id)) {
        caseMap.set(w.case_id, { case_id: w.case_id, total_hours: 0, billable_hours: 0 });
      }
      const c = caseMap.get(w.case_id)!;
      c.total_hours += Number(w.work_hours);
      if (w.billable) c.billable_hours += Number(w.work_hours);
    }
    for (const c of caseMap.values()) {
      c.total_hours = Math.round(c.total_hours * 10) / 10;
      c.billable_hours = Math.round(c.billable_hours * 10) / 10;
    }

    // 按月统计
    const monthMap = new Map<string, { month: string; total_hours: number; billable_hours: number }>();
    for (const w of list) {
      const month = (w.work_date || '').slice(0, 7); // YYYY-MM
      if (!month) continue;
      if (!monthMap.has(month)) {
        monthMap.set(month, { month, total_hours: 0, billable_hours: 0 });
      }
      const m = monthMap.get(month)!;
      m.total_hours += Number(w.work_hours);
      if (w.billable) m.billable_hours += Number(w.work_hours);
    }
    for (const m of monthMap.values()) {
      m.total_hours = Math.round(m.total_hours * 10) / 10;
      m.billable_hours = Math.round(m.billable_hours * 10) / 10;
    }

    return {
      total_hours: Math.round(totalHours * 10) / 10,
      billable_hours: Math.round(billableHours * 10) / 10,
      month_hours: Math.round(monthHours * 10) / 10,
      by_user: Array.from(userMap.values()),
      by_case: Array.from(caseMap.values()),
      by_month: Array.from(monthMap.values()).sort((a, b) => (a.month < b.month ? 1 : -1)),
    };
  }

  // 日程转日志：根据日程数据生成一条工作日志
  // content 基于日程标题与描述生成；work_hours 根据开始/结束时间计算（保留1位小数）
  async convertFromSchedule(
    scheduleId: string,
    userId: string,
    organizationId: string,
  ): Promise<Worklog> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id: scheduleId },
    });
    if (!schedule) {
      throw new NotFoundException('日程不存在');
    }
    // 工作日期取日程开始时间的日期部分（YYYY-MM-DD）
    const startTime = new Date(schedule.start_time);
    const endTime = new Date(schedule.end_time);
    const workDate = startTime.toISOString().slice(0, 10);
    // 工时：按小时差值计算，保留1位小数
    const diffMs = endTime.getTime() - startTime.getTime();
    const hours = Math.max(0, Math.round((diffMs / (60 * 60 * 1000)) * 10) / 10);
    // 工作内容基于日程标题与描述生成
    const content = [schedule.title, schedule.description]
      .filter((t) => t)
      .join(' ');
    const worklog = this.worklogRepository.create({
      user_id: userId,
      organization_id: organizationId,
      content: content || schedule.title,
      work_date: workDate,
      work_hours: hours,
      billable: true,
      status: WorklogStatus.DRAFT,
      log_type: 'case_work',
    });
    return this.worklogRepository.save(worklog);
  }
}
