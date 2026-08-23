import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task } from '../task/task.entity';
import { Schedule } from '../schedule/schedule.entity';
import { ScheduleParticipant } from '../schedule/schedule-participant.entity';
import { Worklog } from '../worklog/worklog.entity';
import { ApprovalStep } from '../approval/approval-step.entity';
import { ApprovalRequest } from '../approval/approval-request.entity';
import { Case } from '../case/case.entity';

@Injectable()
export class WorkbenchService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Schedule)
    private scheduleRepository: Repository<Schedule>,
    @InjectRepository(ScheduleParticipant)
    private participantRepository: Repository<ScheduleParticipant>,
    @InjectRepository(Worklog)
    private worklogRepository: Repository<Worklog>,
    @InjectRepository(ApprovalStep)
    private stepRepository: Repository<ApprovalStep>,
    @InjectRepository(ApprovalRequest)
    private requestRepository: Repository<ApprovalRequest>,
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
  ) {}

  // 个人工作台聚合概览
  async getSummary(userId: string, orgId: string): Promise<any> {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // 1. 我的待办任务（待办 + 进行中）
    const myTasks = await this.taskRepository
      .createQueryBuilder('t')
      .where('t.organization_id = :orgId', { orgId })
      .andWhere('t.status IN (:...statuses)', { statuses: ['pending', 'processing'] })
      .andWhere(
        '(t.assignee_id = :userId OR t.assignee_ids LIKE :likeUserId OR t.creator_id = :userId)',
        { userId, likeUserId: `%"${userId}"%` },
      )
      .orderBy('t.due_date', 'ASC')
      .addOrderBy('t.priority', 'DESC')
      .getMany();

    // 2. 今日日程（我创建的或我参与的，排除已取消）
    const participantRows = await this.participantRepository.find({
      where: { user_id: userId },
      select: { schedule_id: true },
    });
    const participantScheduleIds = participantRows.map((p) => p.schedule_id);
    const todaySchedules = await this.scheduleRepository
      .createQueryBuilder('s')
      .where('s.organization_id = :orgId', { orgId })
      .andWhere('s.status != :cancelled', { cancelled: 'cancelled' })
      .andWhere('s.start_time >= :todayStart AND s.start_time <= :todayEnd', {
        todayStart,
        todayEnd,
      })
      .andWhere(
        participantScheduleIds.length > 0
          ? '(s.creator_id = :userId OR s.id IN (:...ids))'
          : 's.creator_id = :userId',
        participantScheduleIds.length > 0
          ? { userId, ids: participantScheduleIds }
          : { userId },
      )
      .orderBy('s.start_time', 'ASC')
      .getMany();

    // 3. 待写日志（今天未写日志 + 我的草稿日志）
    const todayLogs = await this.worklogRepository
      .createQueryBuilder('w')
      .where('w.user_id = :userId', { userId })
      .andWhere('w.work_date = :todayStr', { todayStr })
      .getMany();

    const draftLogs = await this.worklogRepository
      .createQueryBuilder('w')
      .where('w.user_id = :userId', { userId })
      .andWhere('w.status = :status', { status: 'draft' })
      .orderBy('w.work_date', 'DESC')
      .getMany();

    // 4. 待办审批（当前步骤需我审批的）
    const pendingSteps = await this.stepRepository
      .createQueryBuilder('step')
      .leftJoinAndSelect('step.request', 'request')
      .leftJoinAndSelect('request.applicant', 'applicant')
      .where('step.approver_id = :userId', { userId })
      .andWhere('step.result = :result', { result: 'pending' })
      .andWhere('request.status = :reqStatus', { reqStatus: 'pending' })
      .andWhere('step.step_order = request.current_step')
      .orderBy('request.updated_at', 'DESC')
      .getMany();

    // 5. 我承办的案件（进行中的有效案件）
    const myCases = await this.caseRepository
      .createQueryBuilder('c')
      .where('c.organization_id = :orgId', { orgId })
      .andWhere('(c.assignee_lawyer_id = :userId OR c.handler = :userId OR c.co_handler = :userId)', {
        userId,
      })
      .getMany();

    // 汇总统计
    const stats = {
      my_pending_tasks: myTasks.length,
      today_schedules: todaySchedules.length,
      today_log_count: todayLogs.length,
      draft_log_count: draftLogs.length,
      pending_approvals: pendingSteps.length,
      my_cases: myCases.length,
    };

    return {
      stats,
      tasks: myTasks,
      schedules: todaySchedules,
      todayLogs,
      draftLogs,
      approvals: pendingSteps,
      cases: myCases,
    };
  }
}
