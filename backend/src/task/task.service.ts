import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus, TaskPriority } from './task.entity';
import { UserService } from '../user/user.service';
import { NotificationService } from '../user/notification.service';

// 任务查询参数
export interface TaskQueryParams {
  assignee_id?: string;
  creator_id?: string;
  status?: string;
  priority?: string;
  keyword?: string; // 关键词（标题模糊搜索）
}

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    // 注入用户服务，用于任务完成时增加经验值
    private userService: UserService,
    private notificationService: NotificationService,
  ) {}

  // 创建任务
  async create(userId: string, orgId: string, data: Partial<Task>): Promise<Task> {
    const task = this.taskRepository.create({
      ...data,
      creator_id: userId,
      organization_id: orgId,
      priority: data.priority || TaskPriority.NORMAL,
      status: data.status || TaskStatus.PENDING,
    });
    const savedTask = await this.taskRepository.save(task);
    await this.notificationService.notify({
      receiver_id: savedTask.assignee_id || '',
      title: '新任务分配',
      content: `您有新任务：${savedTask.title || savedTask.id}`,
      type: 'task',
      level: 'normal',
      related_type: 'Task',
      related_id: savedTask.id,
    });
    return savedTask;
  }

  // 查询任务列表（支持按 assignee_id/creator_id/status/priority/keyword 筛选）
  async findAll(orgId: string, params: TaskQueryParams = {}): Promise<Task[]> {
    const qb = this.taskRepository
      .createQueryBuilder('t')
      .where('t.organization_id = :orgId', { orgId });

    if (params.assignee_id) {
      qb.andWhere('t.assignee_id = :assigneeId', { assigneeId: params.assignee_id });
    }
    if (params.creator_id) {
      qb.andWhere('t.creator_id = :creatorId', { creatorId: params.creator_id });
    }
    if (params.status) {
      qb.andWhere('t.status = :status', { status: params.status });
    }
    if (params.priority) {
      qb.andWhere('t.priority = :priority', { priority: params.priority });
    }
    if (params.keyword) {
      qb.andWhere('(t.title LIKE :keyword OR t.description LIKE :keyword)', {
        keyword: `%${params.keyword}%`,
      });
    }

    qb.orderBy('t.created_at', 'DESC');
    return qb.getMany();
  }

  // 查询分配给我的任务
  async findMine(userId: string, params: TaskQueryParams = {}): Promise<Task[]> {
    const qb = this.taskRepository
      .createQueryBuilder('t')
      .where('t.assignee_id = :userId', { userId });

    if (params.status) {
      qb.andWhere('t.status = :status', { status: params.status });
    }
    if (params.priority) {
      qb.andWhere('t.priority = :priority', { priority: params.priority });
    }
    if (params.keyword) {
      qb.andWhere('(t.title LIKE :keyword OR t.description LIKE :keyword)', {
        keyword: `%${params.keyword}%`,
      });
    }

    qb.orderBy('t.created_at', 'DESC');
    return qb.getMany();
  }

  // 查询我创建的任务
  async findCreated(userId: string, params: TaskQueryParams = {}): Promise<Task[]> {
    const qb = this.taskRepository
      .createQueryBuilder('t')
      .where('t.creator_id = :userId', { userId });

    if (params.status) {
      qb.andWhere('t.status = :status', { status: params.status });
    }
    if (params.priority) {
      qb.andWhere('t.priority = :priority', { priority: params.priority });
    }
    if (params.keyword) {
      qb.andWhere('(t.title LIKE :keyword OR t.description LIKE :keyword)', {
        keyword: `%${params.keyword}%`,
      });
    }

    qb.orderBy('t.created_at', 'DESC');
    return qb.getMany();
  }

  // 更新任务
  async update(id: string, data: Partial<Task>): Promise<Task> {
    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException('任务不存在');
    }
    // 不允许通过 update 直接修改状态与完成时间，保持状态流转通过专用方法处理
    const { status, completed_at, creator_id, organization_id, ...rest } = data;
    await this.taskRepository.update(id, rest);
    return this.taskRepository.findOne({ where: { id } });
  }

  // 开始任务：待办 -> 进行中
  async start(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException('任务不存在');
    }
    if (task.status !== TaskStatus.PENDING) {
      throw new BadRequestException('仅待办状态的任务可以开始');
    }
    await this.taskRepository.update(id, { status: TaskStatus.PROCESSING });
    return this.taskRepository.findOne({ where: { id } });
  }

  // 完成任务：进行中 -> 已完成，记录完成时间
  async complete(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException('任务不存在');
    }
    if (task.status !== TaskStatus.PROCESSING) {
      throw new BadRequestException('仅进行中状态的任务可以完成');
    }
    await this.taskRepository.update(id, {
      status: TaskStatus.COMPLETED,
      completed_at: new Date(),
    });
    // 任务完成时为负责人增加经验值（50经验）
    if (task.assignee_id) {
      await this.userService.addExperience(task.assignee_id, 50, '任务完成');
    }
    const completedTask = await this.taskRepository.findOne({ where: { id } });
    await this.notificationService.notify({
      receiver_id: task.creator_id || '',
      title: '任务已完成',
      content: `任务 ${task.title || task.id} 已完成`,
      type: 'task',
      level: 'normal',
      related_type: 'Task',
      related_id: task.id,
    });
    return completedTask;
  }

  // 更新任务进度：progress >= 100 时自动标记为已完成
  async updateProgress(id: string, progress: number): Promise<Task> {
    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException('任务不存在');
    }
    // 限制进度范围 0-100
    const clamped = Math.max(0, Math.min(100, Number(progress) || 0));
    if (clamped >= 100) {
      // 进度达到 100%，自动完成并记录完成时间
      await this.taskRepository.update(id, {
        progress: 100,
        status: TaskStatus.COMPLETED,
        completed_at: new Date(),
      });
    } else {
      await this.taskRepository.update(id, { progress: clamped });
    }
    return this.taskRepository.findOne({ where: { id } });
  }

  // 取消任务：任意状态 -> 已取消
  async cancel(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException('任务不存在');
    }
    if (task.status === TaskStatus.CANCELLED) {
      throw new BadRequestException('任务已是取消状态');
    }
    if (task.status === TaskStatus.COMPLETED) {
      throw new BadRequestException('已完成的任务不能取消');
    }
    await this.taskRepository.update(id, { status: TaskStatus.CANCELLED });
    return this.taskRepository.findOne({ where: { id } });
  }

  // 删除任务
  async delete(id: string): Promise<void> {
    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException('任务不存在');
    }
    await this.taskRepository.delete(id);
  }

  // 统计各状态任务数
  async getStats(orgId: string): Promise<{
    pending: number;
    processing: number;
    completed: number;
    cancelled: number;
    total: number;
  }> {
    const list = await this.taskRepository.find({
      where: { organization_id: orgId },
    });

    const stats = {
      pending: 0,
      processing: 0,
      completed: 0,
      cancelled: 0,
      total: list.length,
    };

    for (const t of list) {
      switch (t.status) {
        case TaskStatus.PENDING:
          stats.pending++;
          break;
        case TaskStatus.PROCESSING:
          stats.processing++;
          break;
        case TaskStatus.COMPLETED:
          stats.completed++;
          break;
        case TaskStatus.CANCELLED:
          stats.cancelled++;
          break;
      }
    }

    return stats;
  }

  // 任务复核评审（已完成的任务可由创建人复核）
  async review(id: string, reviewerId: string, reviewComment: string, reviewResult: 'passed' | 'failed'): Promise<Task> {
    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) throw new NotFoundException('任务不存在');
    if (task.status !== 'completed') throw new BadRequestException('仅已完成的任务可复核');
    // 更新复核信息
    task.review_status = reviewResult;
    task.review_comment = reviewComment;
    task.reviewer_id = reviewerId;
    task.review_time = new Date();
    return this.taskRepository.save(task);
  }
}
