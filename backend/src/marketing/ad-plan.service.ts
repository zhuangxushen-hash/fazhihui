import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AdPlan } from './ad-plan.entity';
import { AdPlanLog } from './ad-plan-log.entity';
import { AdPlanStatus, AdPlanOperationType } from '../types';

@Injectable()
export class AdPlanService {
  constructor(
    @InjectRepository(AdPlan)
    private planRepository: Repository<AdPlan>,
    @InjectRepository(AdPlanLog)
    private logRepository: Repository<AdPlanLog>,
  ) {}

  /**
   * 创建投放计划
   */
  async create(
    data: Partial<AdPlan>,
    operatorId: string,
  ): Promise<AdPlan> {
    const plan = this.planRepository.create(data);
    const saved = await this.planRepository.save(plan);
    await this.recordLog(saved.id, operatorId, AdPlanOperationType.CREATE, {
      plan: saved,
    });
    return saved;
  }

  /**
   * 更新计划
   */
  async update(
    id: string,
    data: Partial<AdPlan>,
    operatorId: string,
  ): Promise<AdPlan> {
    const plan = await this.planRepository.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException('投放计划不存在');
    }
    const before = { ...plan };
    await this.planRepository.update(id, data);
    const after = await this.planRepository.findOne({ where: { id } });
    await this.recordLog(id, operatorId, AdPlanOperationType.UPDATE, {
      before,
      after,
    });
    return after;
  }

  /**
   * 删除计划
   */
  async delete(id: string, operatorId: string): Promise<void> {
    const plan = await this.planRepository.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException('投放计划不存在');
    }
    await this.recordLog(id, operatorId, AdPlanOperationType.DELETE, {
      plan,
    });
    await this.planRepository.delete(id);
  }

  /**
   * 查询单个计划
   */
  async findById(id: string): Promise<AdPlan> {
    const plan = await this.planRepository.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException('投放计划不存在');
    }
    return plan;
  }

  /**
   * 查询计划列表（按平台、账户、案由、状态筛选）
   * 平台通过关联账户过滤
   */
  async findPlans(orgId: string, filters?: {
    account_id?: string;
    case_type?: string;
    status?: AdPlanStatus;
    keyword?: string;
    platform?: string;
  }): Promise<AdPlan[]> {
    const queryBuilder = this.planRepository
      .createQueryBuilder('plan')
      .where('plan.organization_id = :orgId', { orgId });

    if (filters?.account_id) {
      queryBuilder.andWhere('plan.account_id = :accountId', {
        accountId: filters.account_id,
      });
    }
    if (filters?.case_type) {
      queryBuilder.andWhere('plan.case_type = :caseType', {
        caseType: filters.case_type,
      });
    }
    if (filters?.status) {
      queryBuilder.andWhere('plan.status = :status', {
        status: filters.status,
      });
    }
    if (filters?.keyword) {
      queryBuilder.andWhere('plan.plan_name LIKE :keyword', {
        keyword: `%${filters.keyword}%`,
      });
    }
    // 平台过滤通过子查询实现（避免强关联）
    if (filters?.platform) {
      queryBuilder.andWhere(
        `plan.account_id IN (SELECT acc.id FROM ad_accounts acc WHERE acc.platform = :platform)`,
        { platform: filters.platform },
      );
    }
    queryBuilder.orderBy('plan.created_at', 'DESC');
    return queryBuilder.getMany();
  }

  /**
   * 批量启动/暂停计划
   */
  async batchUpdateStatus(
    planIds: string[],
    status: AdPlanStatus,
    operatorId: string,
  ): Promise<AdPlan[]> {
    if (!planIds || planIds.length === 0) {
      return [];
    }
    const plans = await this.planRepository.find({
      where: { id: In(planIds) },
    });
    const opType =
      status === AdPlanStatus.RUNNING
        ? AdPlanOperationType.START
        : status === AdPlanStatus.PAUSED
          ? AdPlanOperationType.PAUSE
          : AdPlanOperationType.END;

    await this.planRepository.update(
      { id: In(planIds) },
      { status },
    );
    // 记录操作日志（批量）
    for (const plan of plans) {
      await this.recordLog(plan.id, operatorId, opType, {
        before_status: plan.status,
        after_status: status,
        batch: true,
        batch_ids: planIds,
      });
    }
    return this.planRepository.find({ where: { id: In(planIds) } });
  }

  /**
   * 批量调整预算
   */
  async batchAdjustBudget(
    planIds: string[],
    budget: number,
    operatorId: string,
  ): Promise<AdPlan[]> {
    if (!planIds || planIds.length === 0) {
      return [];
    }
    const plans = await this.planRepository.find({
      where: { id: In(planIds) },
    });
    for (const plan of plans) {
      const before = plan.budget;
      await this.planRepository.update(plan.id, { budget });
      await this.recordLog(plan.id, operatorId, AdPlanOperationType.BUDGET_ADJUST, {
        before,
        after: budget,
        batch: true,
      });
    }
    return this.planRepository.find({ where: { id: In(planIds) } });
  }

  /**
   * 调整单个计划预算
   */
  async adjustBudget(
    id: string,
    budget: number,
    operatorId: string,
  ): Promise<AdPlan> {
    const plan = await this.planRepository.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException('投放计划不存在');
    }
    const before = plan.budget;
    await this.planRepository.update(id, { budget });
    await this.recordLog(id, operatorId, AdPlanOperationType.BUDGET_ADJUST, {
      before,
      after: budget,
    });
    return this.planRepository.findOne({ where: { id } });
  }

  /**
   * 调整单个计划出价
   */
  async adjustBid(
    id: string,
    bid: number,
    operatorId: string,
  ): Promise<AdPlan> {
    const plan = await this.planRepository.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException('投放计划不存在');
    }
    const before = plan.bid;
    await this.planRepository.update(id, { bid });
    await this.recordLog(id, operatorId, AdPlanOperationType.BID_ADJUST, {
      before,
      after: bid,
    });
    return this.planRepository.findOne({ where: { id } });
  }

  /**
   * 复制计划（在同账户下创建副本，可指定新计划名）
   */
  async copyPlan(
    sourcePlanId: string,
    newPlanName: string,
    operatorId: string,
  ): Promise<AdPlan> {
    const source = await this.planRepository.findOne({
      where: { id: sourcePlanId },
    });
    if (!source) {
      throw new NotFoundException('源投放计划不存在');
    }
    const copy = this.planRepository.create({
      account_id: source.account_id,
      plan_name: newPlanName || `${source.plan_name} (副本)`,
      case_type: source.case_type,
      budget: source.budget,
      bid: source.bid,
      status: AdPlanStatus.PAUSED, // 复制后默认暂停
      platform_plan_id: null, // 不复制平台计划ID
      start_date: source.start_date,
      end_date: source.end_date,
      organization_id: source.organization_id,
      creator_id: operatorId,
    });
    const saved = await this.planRepository.save(copy);
    await this.recordLog(saved.id, operatorId, AdPlanOperationType.COPY, {
      source_plan_id: sourcePlanId,
      new_plan: saved,
    });
    return saved;
  }

  /**
   * 迁移计划到其他账户
   */
  async migratePlan(
    planId: string,
    targetAccountId: string,
    operatorId: string,
  ): Promise<AdPlan> {
    const plan = await this.planRepository.findOne({ where: { id: planId } });
    if (!plan) {
      throw new NotFoundException('投放计划不存在');
    }
    const beforeAccountId = plan.account_id;
    await this.planRepository.update(planId, {
      account_id: targetAccountId,
      platform_plan_id: null, // 迁移后平台计划ID失效
      status: AdPlanStatus.PAUSED, // 迁移后默认暂停
    });
    const after = await this.planRepository.findOne({ where: { id: planId } });
    await this.recordLog(planId, operatorId, AdPlanOperationType.MIGRATE, {
      before_account_id: beforeAccountId,
      after_account_id: targetAccountId,
    });
    return after;
  }

  /**
   * 查询计划操作日志
   */
  async findLogs(planId: string): Promise<AdPlanLog[]> {
    return this.logRepository.find({
      where: { plan_id: planId },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * 记录操作日志
   */
  private async recordLog(
    planId: string,
    operatorId: string,
    operationType: AdPlanOperationType,
    detail?: any,
  ): Promise<void> {
    const log = this.logRepository.create({
      plan_id: planId,
      operator_id: operatorId,
      operation_type: operationType,
      operation_detail: detail ? JSON.stringify(detail) : null,
    });
    await this.logRepository.save(log);
  }
}
