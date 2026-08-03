import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CaseCost } from './case-cost.entity';

@Injectable()
export class CaseCostService {
  constructor(
    @InjectRepository(CaseCost)
    private caseCostRepository: Repository<CaseCost>,
  ) {}

  // 创建成本记录
  async create(data: Partial<CaseCost>): Promise<CaseCost> {
    const cost = this.caseCostRepository.create(data);
    return this.caseCostRepository.save(cost);
  }

  // 按案件查询成本列表
  async findByCaseId(caseId: string): Promise<CaseCost[]> {
    return this.caseCostRepository.find({
      where: { case_id: caseId },
      order: { created_at: 'DESC' },
    });
  }

  // 更新成本记录
  async update(id: string, data: Partial<CaseCost>): Promise<CaseCost> {
    await this.caseCostRepository.update(id, data);
    return this.caseCostRepository.findOne({ where: { id } });
  }

  // 删除成本记录
  async remove(id: string): Promise<void> {
    await this.caseCostRepository.delete(id);
  }

  // 汇总案件成本：返回总金额、记录数、按成本类型分组统计
  async getCaseCostSummary(caseId: string): Promise<{
    case_id: string;
    total_amount: number;
    count: number;
    by_type: Array<{ cost_type: string; amount: number; count: number }>;
  }> {
    const list = await this.caseCostRepository.find({
      where: { case_id: caseId },
    });

    let totalAmount = 0;
    const typeMap = new Map<string, { amount: number; count: number }>();

    for (const item of list) {
      const amount = Number(item.amount) || 0;
      totalAmount += amount;
      const typeKey = String(item.cost_type);
      const existing = typeMap.get(typeKey) || { amount: 0, count: 0 };
      existing.amount += amount;
      existing.count += 1;
      typeMap.set(typeKey, existing);
    }

    const byType = Array.from(typeMap.entries()).map(([cost_type, val]) => ({
      cost_type,
      amount: Math.round(val.amount * 100) / 100,
      count: val.count,
    }));

    return {
      case_id: caseId,
      total_amount: Math.round(totalAmount * 100) / 100,
      count: list.length,
      by_type: byType,
    };
  }
}
