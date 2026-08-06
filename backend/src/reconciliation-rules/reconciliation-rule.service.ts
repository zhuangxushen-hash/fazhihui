import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReconciliationRule } from './reconciliation-rule.entity';

@Injectable()
export class ReconciliationRuleService {
  constructor(
    @InjectRepository(ReconciliationRule)
    private readonly ruleRepository: Repository<ReconciliationRule>,
  ) {}

  // 创建对账规则
  async create(data: Partial<ReconciliationRule>): Promise<ReconciliationRule> {
    // match_fields 期望接收数组，序列化为 JSON 字符串存储
    if (Array.isArray((data as any).match_fields)) {
      (data as any).match_fields = JSON.stringify((data as any).match_fields);
    }
    const rule = this.ruleRepository.create(data);
    return this.ruleRepository.save(rule);
  }

  // 查询对账规则详情
  async findById(id: string): Promise<ReconciliationRule> {
    const rule = await this.ruleRepository.findOne({ where: { id } });
    if (!rule) {
      throw new NotFoundException('对账规则不存在');
    }
    return rule;
  }

  // 按组织查询对账规则列表
  async findByOrg(
    orgId: string,
    filters?: { isActive?: boolean },
  ): Promise<ReconciliationRule[]> {
    const where: any = { organization_id: orgId };
    if (filters?.isActive !== undefined) {
      where.is_active = filters.isActive;
    }
    return this.ruleRepository.find({
      where,
      order: { priority: 'ASC', created_at: 'DESC' },
    });
  }

  // 更新对账规则
  async update(
    id: string,
    data: Partial<ReconciliationRule>,
  ): Promise<ReconciliationRule> {
    const rule = await this.ruleRepository.findOne({ where: { id } });
    if (!rule) {
      throw new NotFoundException('对账规则不存在');
    }
    const updateData: any = { ...data };
    // match_fields 期望接收数组，序列化为 JSON 字符串存储
    if (Array.isArray(updateData.match_fields)) {
      updateData.match_fields = JSON.stringify(updateData.match_fields);
    }
    await this.ruleRepository.update(id, updateData);
    return this.ruleRepository.findOne({ where: { id } });
  }

  // 切换规则启停状态
  async toggleActive(id: string): Promise<ReconciliationRule> {
    const rule = await this.ruleRepository.findOne({ where: { id } });
    if (!rule) {
      throw new NotFoundException('对账规则不存在');
    }
    await this.ruleRepository.update(id, { is_active: !rule.is_active });
    return this.ruleRepository.findOne({ where: { id } });
  }

  // 删除对账规则
  async delete(id: string): Promise<void> {
    const rule = await this.ruleRepository.findOne({ where: { id } });
    if (!rule) {
      throw new NotFoundException('对账规则不存在');
    }
    await this.ruleRepository.delete(id);
  }
}
