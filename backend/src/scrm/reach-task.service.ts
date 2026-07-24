import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ReachTask } from './reach-task.entity';
import { ClientTagRelation } from './client-tag-relation.entity';

@Injectable()
export class ReachTaskService {
  constructor(
    @InjectRepository(ReachTask)
    private reachTaskRepository: Repository<ReachTask>,
    @InjectRepository(ClientTagRelation)
    private clientTagRelationRepository: Repository<ClientTagRelation>,
  ) {}

  async create(data: Partial<ReachTask>): Promise<ReachTask> {
    if (Array.isArray(data.target_tags)) {
      data.target_tags = JSON.stringify(data.target_tags);
    }
    if (Array.isArray(data.media_paths)) {
      data.media_paths = JSON.stringify(data.media_paths);
    }
    if (Array.isArray(data.publish_accounts)) {
      data.publish_accounts = JSON.stringify(data.publish_accounts);
    }
    const entity = this.reachTaskRepository.create(data);
    return this.reachTaskRepository.save(entity);
  }

  async findAll(orgId?: string, filters?: {
    task_type?: string;
    status?: string;
  }): Promise<ReachTask[]> {
    const where: any = {};
    if (orgId) where.organization_id = orgId;
    if (filters?.task_type) where.task_type = filters.task_type;
    if (filters?.status) where.status = filters.status;
    return this.reachTaskRepository.find({ where, order: { created_at: 'DESC' } });
  }

  async findById(id: string): Promise<ReachTask> {
    const task = await this.reachTaskRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException('触达任务不存在');
    }
    return task;
  }

  async update(id: string, data: Partial<ReachTask>): Promise<ReachTask> {
    if (Array.isArray(data.target_tags)) {
      data.target_tags = JSON.stringify(data.target_tags);
    }
    if (Array.isArray(data.media_paths)) {
      data.media_paths = JSON.stringify(data.media_paths);
    }
    if (Array.isArray(data.publish_accounts)) {
      data.publish_accounts = JSON.stringify(data.publish_accounts);
    }
    await this.reachTaskRepository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const result = await this.reachTaskRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('触达任务不存在');
    }
  }

  /**
   * 按标签筛选目标客户数
   */
  async countTargetByTags(tagIds: string[]): Promise<number> {
    if (tagIds.length === 0) return 0;
    const relations = await this.clientTagRelationRepository.find({
      where: { tag_id: In(tagIds) },
    });
    // 取并集(命中任一标签的客户数)
    const clientSet = new Set(relations.map(r => r.client_id));
    return clientSet.size;
  }

  /**
   * 执行发送(模拟): 按标签筛选目标, 多账号同步发布
   */
  async send(id: string): Promise<ReachTask> {
    const task = await this.findById(id);
    const targetTags: string[] = task.target_tags
      ? JSON.parse(task.target_tags)
      : [];

    const targetCount = await this.countTargetByTags(targetTags);
    task.target_count = targetCount;

    // 模拟发送
    task.status = 'sending';
    await this.reachTaskRepository.save(task);

    // 模拟同步发布: 多账号一起发送
    const accounts: string[] = task.publish_accounts
      ? JSON.parse(task.publish_accounts)
      : ['default'];

    task.sent_count = targetCount * accounts.length;
    task.status = 'sent';
    return this.reachTaskRepository.save(task);
  }

  /**
   * 朋友圈统一排期: 返回某日期范围内的所有朋友圈任务
   */
  async getMomentsSchedule(orgId: string, startDate?: string, endDate?: string): Promise<ReachTask[]> {
    const qb = this.reachTaskRepository.createQueryBuilder('task')
      .where('task.task_type = :type', { type: 'moments' });
    if (orgId) {
      qb.andWhere('task.organization_id = :orgId', { orgId });
    }
    if (startDate) {
      qb.andWhere('task.schedule_time >= :startDate', { startDate: new Date(startDate) });
    }
    if (endDate) {
      qb.andWhere('task.schedule_time <= :endDate', { endDate: new Date(endDate) });
    }
    qb.orderBy('task.schedule_time', 'ASC');
    return qb.getMany();
  }
}
