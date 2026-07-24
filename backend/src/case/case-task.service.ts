import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CaseTask, CaseTaskStatus, TaskPriority } from './case-task.entity';
import { Case } from './case.entity';
import { CaseSOPTemplate } from './case-sop-template.entity';
import { CreateTaskDto, UpdateTaskDto, UpdateTaskStatusDto, AssignTaskDto, UpdateTaskProgressDto } from './dto/task.dto';
import { User } from '../user/user.entity';

@Injectable()
export class CaseTaskService {
  constructor(
    @InjectRepository(CaseTask)
    private caseTaskRepository: Repository<CaseTask>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * 根据SOP模板为案件生成任务列表
   */
  async generateTasksFromTemplate(
    caseEntity: Case,
    sopTemplate: CaseSOPTemplate,
  ): Promise<CaseTask[]> {
    const tasks: CaseTask[] = [];
    const baseDate = new Date(); // 以案件创建时间作为基准

    // 遍历模板的所有阶段和任务
    for (const stage of sopTemplate.stages) {
      for (const taskTemplate of stage.tasks) {
        const deadline = this.calculateDeadline(baseDate, taskTemplate.deadline_days);

        const task = this.caseTaskRepository.create({
          case_id: caseEntity.id,
          sop_template_id: sopTemplate.id,
          stage_id: stage.stage_id,
          stage_name: stage.stage_name,
          stage_order: stage.order,
          task_id: taskTemplate.task_id,
          task_name: taskTemplate.task_name,
          status: CaseTaskStatus.PENDING,
          responsible_role: taskTemplate.responsible_role,
          deadline,
          is_required: taskTemplate.is_required,
          deadline_days: taskTemplate.deadline_days,
          description: taskTemplate.description,
        });

        tasks.push(task);
      }
    }

    // 批量保存任务
    return this.caseTaskRepository.save(tasks);
  }

  /**
   * 计算任务截止时间
   */
  private calculateDeadline(baseDate: Date, deadlineDays: number): Date {
    const deadline = new Date(baseDate);
    deadline.setDate(deadline.getDate() + deadlineDays);
    return deadline;
  }

  /**
   * 查询案件的任务列表
   */
  async getCaseTasks(caseId: string): Promise<CaseTask[]> {
    return this.caseTaskRepository.find({
      where: { case_id: caseId },
      order: { stage_order: 'ASC', created_at: 'ASC' },
    });
  }

  /**
   * 查询案件任务（按阶段分组）
   */
  async getCaseTasksGroupByStage(caseId: string): Promise<{ [stageId: string]: CaseTask[] }> {
    const tasks = await this.getCaseTasks(caseId);
    const grouped: { [stageId: string]: CaseTask[] } = {};

    tasks.forEach(task => {
      if (!grouped[task.stage_id]) {
        grouped[task.stage_id] = [];
      }
      grouped[task.stage_id].push(task);
    });

    return grouped;
  }

  /**
   * 手动创建任务
   */
  async createTask(dto: CreateTaskDto): Promise<CaseTask> {
    const task = this.caseTaskRepository.create({
      case_id: dto.case_id,
      task_name: dto.task_name,
      stage_id: dto.stage_id || 'manual',
      stage_name: dto.stage_name || '手动添加',
      stage_order: dto.stage_order || 999,
      task_id: `manual_${Date.now()}`,
      status: CaseTaskStatus.PENDING,
      priority: dto.priority as TaskPriority || TaskPriority.MEDIUM,
      responsible_role: dto.responsible_role,
      deadline: dto.deadline ? new Date(dto.deadline) : null,
      is_required: dto.is_required || false,
      description: dto.description,
    });

    return this.caseTaskRepository.save(task);
  }

  /**
   * 更新任务信息
   */
  async updateTask(taskId: string, dto: UpdateTaskDto): Promise<CaseTask> {
    const task = await this.caseTaskRepository.findOne({ where: { id: taskId } });
    if (!task) {
      throw new Error('任务不存在');
    }

    if (dto.task_name) task.task_name = dto.task_name;
    if (dto.description) task.description = dto.description;
    if (dto.deadline) task.deadline = new Date(dto.deadline);
    if (dto.priority) task.priority = dto.priority as TaskPriority;
    if (dto.progress !== undefined) task.progress = dto.progress;
    if (dto.result) task.result = dto.result;

    return this.caseTaskRepository.save(task);
  }

  /**
   * 更新任务状态
   */
  async updateTaskStatus(taskId: string, dto: UpdateTaskStatusDto): Promise<{ task: CaseTask; oldStatus: string }> {
    const task = await this.caseTaskRepository.findOne({ where: { id: taskId } });
    if (!task) {
      throw new Error('任务不存在');
    }

    const oldStatus = task.status;
    task.status = dto.status as CaseTaskStatus;
    if (dto.result) {
      task.result = dto.result;
    }

    if (dto.status === CaseTaskStatus.COMPLETED || dto.status === CaseTaskStatus.VERIFIED) {
      task.completed_at = new Date();
      task.progress = 100;
    }

    const savedTask = await this.caseTaskRepository.save(task);

    return {
      task: savedTask,
      oldStatus,
    };
  }

  /**
   * 指派任务
   */
  async assignTask(taskId: string, dto: AssignTaskDto): Promise<{ task: CaseTask; oldAssignee: string | null }> {
    const task = await this.caseTaskRepository.findOne({ where: { id: taskId } });
    if (!task) {
      throw new Error('任务不存在');
    }

    const oldAssignee = task.assignee_id;
    task.assignee_id = dto.assignee_id;
    if (task.status === CaseTaskStatus.PENDING) {
      task.status = CaseTaskStatus.IN_PROGRESS;
    }

    const savedTask = await this.caseTaskRepository.save(task);

    return {
      task: savedTask,
      oldAssignee,
    };
  }

  /**
   * 更新任务进度
   */
  async updateTaskProgress(taskId: string, dto: UpdateTaskProgressDto): Promise<CaseTask> {
    const task = await this.caseTaskRepository.findOne({ where: { id: taskId } });
    if (!task) {
      throw new Error('任务不存在');
    }

    task.progress = dto.progress;

    // 如果进度为100%，自动标记为已完成
    if (dto.progress === 100 && task.status !== CaseTaskStatus.COMPLETED && task.status !== CaseTaskStatus.VERIFIED) {
      task.status = CaseTaskStatus.COMPLETED;
      task.completed_at = new Date();
    }

    return this.caseTaskRepository.save(task);
  }

  /**
   * 获取任务详情
   */
  async getTaskDetail(taskId: string): Promise<CaseTask> {
    const task = await this.caseTaskRepository.findOne({
      where: { id: taskId },
      relations: { assignee: true, case: true },
    });

    if (!task) {
      throw new Error('任务不存在');
    }

    return task;
  }

  /**
   * 获取待处理任务统计
   */
  async getTaskStatistics(caseId: string): Promise<{
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    overdue: number;
  }> {
    const tasks = await this.getCaseTasks(caseId);
    const now = new Date();

    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === CaseTaskStatus.PENDING).length,
      in_progress: tasks.filter(t => t.status === CaseTaskStatus.IN_PROGRESS).length,
      completed: tasks.filter(t => t.status === CaseTaskStatus.COMPLETED).length,
      overdue: tasks.filter(t =>
        t.status !== CaseTaskStatus.COMPLETED &&
        t.status !== CaseTaskStatus.CANCELLED &&
        t.deadline &&
        new Date(t.deadline) < now
      ).length,
    };
  }

  /**
   * 检查并更新超期任务
   */
  async checkAndUpdateOverdueTasks(): Promise<void> {
    const now = new Date();
    const pendingTasks = await this.caseTaskRepository.find({
      where: { status: CaseTaskStatus.PENDING },
    });

    const inProgressTasks = await this.caseTaskRepository.find({
      where: { status: CaseTaskStatus.IN_PROGRESS },
    });

    const activeTasks = [...pendingTasks, ...inProgressTasks];

    for (const task of activeTasks) {
      if (task.deadline && new Date(task.deadline) < now) {
        task.status = CaseTaskStatus.OVERDUE;
        await this.caseTaskRepository.save(task);
      }
    }
  }

  /**
   * 计算案件的任务完成进度
   */
  async calculateCaseProgress(caseId: string): Promise<number> {
    const tasks = await this.getCaseTasks(caseId);
    if (tasks.length === 0) return 0;

    const completedTasks = tasks.filter(
      t => t.status === CaseTaskStatus.COMPLETED || t.status === CaseTaskStatus.VERIFIED
    ).length;

    return Math.round((completedTasks / tasks.length) * 100);
  }

  /**
   * 获取案件任务完成率
   */
  async getCaseTaskCompletionRate(caseId: string): Promise<{
    total: number;
    completed: number;
    progress: number;
  }> {
    const tasks = await this.getCaseTasks(caseId);
    const completed = tasks.filter(
      t => t.status === CaseTaskStatus.COMPLETED || t.status === CaseTaskStatus.VERIFIED
    ).length;

    return {
      total: tasks.length,
      completed,
      progress: Math.round((completed / tasks.length) * 100),
    };
  }

  /**
   * 获取任务列表（按组织，支持筛选和分页）
   */
  async findAll(
    orgId: string,
    filters?: {
      status?: CaseTaskStatus;
      priority?: TaskPriority;
      assignee_id?: string;
      case_id?: string;
      stage_id?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<{ data: any[]; total: number }> {
    const query = this.caseTaskRepository.createQueryBuilder('task')
      .where('task.case_id IN (SELECT id FROM cases WHERE organization_id = :orgId)', { orgId });

    if (filters?.status) {
      query.andWhere('task.status = :status', { status: filters.status });
    }
    if (filters?.priority) {
      query.andWhere('task.priority = :priority', { priority: filters.priority });
    }
    if (filters?.assignee_id) {
      query.andWhere('task.assignee_id = :assignee_id', { assignee_id: filters.assignee_id });
    }
    if (filters?.case_id) {
      query.andWhere('task.case_id = :case_id', { case_id: filters.case_id });
    }
    if (filters?.stage_id) {
      query.andWhere('task.stage_id = :stage_id', { stage_id: filters.stage_id });
    }

    const total = await query.getCount();
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    query.skip((page - 1) * limit).take(limit);

    query.orderBy('task.created_at', 'DESC');
    const tasks = await query.getMany();

    const data = await Promise.all(tasks.map(async (task) => {
      let assignee_name: string | undefined;
      if (task.assignee_id) {
        const user = await this.userRepository.findOne({ where: { id: task.assignee_id } });
        assignee_name = user?.real_name;
      }
      return { ...task, assignee_name };
    }));

    return { data, total };
  }
}