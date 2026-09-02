import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager, Like } from 'typeorm';
import { CaseCost } from './case-cost.entity';
import { BusinessFund } from './business-fund.entity';

@Injectable()
export class CaseCostService {
  constructor(
    @InjectRepository(CaseCost)
    private caseCostRepository: Repository<CaseCost>,
    @InjectRepository(BusinessFund)
    private businessFundRepository: Repository<BusinessFund>,
    private dataSource: DataSource,
  ) {}

  // 成本类型 → 财务业务款分类映射
  private static readonly FUND_CATEGORY_MAP: Record<string, string> = {
    preservation: 'preservation_fee',
    litigation: 'litigation_fee',
    hearing: 'hearing_fee',
    travel: 'travel_fee',
    case_handling: 'case_handling_fee',
    marketing: 'marketing_fee',
    labor: 'labor_fee',
    other: 'other',
  };

  // 成本类型 → 财务收款方（对外付款对象）映射
  private static readonly FUND_PAYEE_MAP: Record<string, string> = {
    preservation: '保全机构',
    litigation: '法院',
    hearing: '法院',
    travel: '差旅服务商',
    case_handling: '外部机构',
    marketing: '投放渠道',
    labor: '律所人工',
    other: '其他',
  };

  // 创建成本记录，并通过事务同步写入财务业务款台账（支出）
  async create(data: Partial<CaseCost>): Promise<CaseCost> {
    return this.dataSource.transaction(async (manager) => {
      const cost = manager.create(CaseCost, data);
      const saved = await manager.save(CaseCost, cost);
      await this.syncCostToFinance(saved, manager);
      return saved;
    });
  }

  // 按案件查询成本列表
  async findByCaseId(caseId: string): Promise<CaseCost[]> {
    return this.caseCostRepository.find({
      where: { case_id: caseId },
      order: { updated_at: 'DESC' },
    });
  }

  // 更新成本记录，并同步更新财务台账（作废旧记录、写入新记录）
  async update(id: string, data: Partial<CaseCost>): Promise<CaseCost> {
    const existing = await this.caseCostRepository.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('成本记录不存在');
    await this.caseCostRepository.update(id, data);
    const updated = await this.caseCostRepository.findOne({ where: { id } });
    if (!updated) throw new NotFoundException('成本记录不存在');
    // 同步财务台账：作废旧记录，写入更新后的新记录
    try {
      await this.businessFundRepository.update(
        { remarks: Like(`%case_cost:${id}%`) } as any,
        { status: 'voided' },
      );
      await this.syncCostToFinance(updated, this.businessFundRepository.manager);
    } catch (err) {
      // 财务台账同步失败不影响成本更新主流程
    }
    return updated;
  }

  // 删除成本记录，并同步作废财务台账中关联的业务款记录
  async remove(id: string): Promise<void> {
    const cost = await this.caseCostRepository.findOne({ where: { id } });
    if (!cost) return;
    await this.caseCostRepository.delete(id);
    try {
      await this.businessFundRepository.update(
        { remarks: Like(`%case_cost:${id}%`) } as any,
        { status: 'voided' },
      );
    } catch (err) {
      // 财务台账同步失败不影响成本删除主流程
    }
  }

  /**
   * 将单条案件成本同步为一条财务「业务款-支出」记录，
   * 使其进入财务台账、收支明细与单案利润分析（finance-statement 已聚合 business_funds）。
   */
  private async syncCostToFinance(cost: CaseCost, manager: EntityManager): Promise<void> {
    const fund = manager.create(BusinessFund, {
      case_id: cost.case_id,
      type: 'expense',
      category: CaseCostService.FUND_CATEGORY_MAP[cost.cost_type] || 'other',
      amount: Number(cost.amount) || 0,
      payer: '律所',
      payee: CaseCostService.FUND_PAYEE_MAP[cost.cost_type] || '外部机构',
      payment_date: cost.incurred_date ? new Date(cost.incurred_date) : new Date(),
      payment_method: 'case_cost',
      remarks: `案件成本(${cost.cost_type})：${cost.description || ''} | case_cost:${cost.id}`,
      account_status: 'accounted',
      account_time: new Date(),
      organization_id: cost.organization_id,
    });
    await manager.save(BusinessFund, fund);
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
