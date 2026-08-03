import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { BusinessFund, FUND_TYPE } from './business-fund.entity';
import { Case } from '../case/case.entity';
import { CommissionService } from './commission.service';

@Injectable()
export class BusinessFundService {
  constructor(
    @InjectRepository(BusinessFund)
    private fundRepository: Repository<BusinessFund>,
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    // 使用 forwardRef 注入 CommissionService，防止潜在的循环依赖
    @Inject(forwardRef(() => CommissionService))
    private commissionService: CommissionService,
  ) {}

  // 创建业务款记录
  async create(data: Partial<BusinessFund>): Promise<BusinessFund> {
    const fund = this.fundRepository.create(data);
    return this.fundRepository.save(fund);
  }

  // 查询业务款列表，支持 type/category/keyword/date 筛选
  async findAll(
    orgId: string,
    params?: {
      type?: string;
      category?: string;
      keyword?: string;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<BusinessFund[]> {
    const where: any = {};
    if (orgId) {
      where.organization_id = orgId;
    }
    if (params?.type) {
      where.type = params.type;
    }
    if (params?.category) {
      where.category = params.category;
    }
    if (params?.keyword) {
      // 关键词匹配付款方或收款方
      where.payer = Like(`%${params.keyword}%`);
    }
    if (params?.startDate && params?.endDate) {
      where.payment_date = Between(params.startDate, params.endDate);
    } else if (params?.startDate) {
      where.payment_date = Between(params.startDate, '2099-12-31');
    } else if (params?.endDate) {
      where.payment_date = Between('2000-01-01', params.endDate);
    }
    return this.fundRepository.find({
      where,
      order: { payment_date: 'DESC' },
    });
  }

  // 查询单条详情
  async findOne(id: string): Promise<BusinessFund> {
    return this.fundRepository.findOne({ where: { id } });
  }

  // 更新业务款记录
  async update(id: string, data: Partial<BusinessFund>): Promise<BusinessFund> {
    await this.fundRepository.update(id, data);
    return this.fundRepository.findOne({ where: { id } });
  }

  // 删除业务款记录
  async remove(id: string): Promise<void> {
    await this.fundRepository.delete(id);
  }

  // 统计：收入合计、支出合计、净额
  async getStats(
    orgId: string,
    params?: {
      startDate?: string;
      endDate?: string;
    },
  ): Promise<{
    total_income: number;
    total_expense: number;
    net_amount: number;
  }> {
    const list = await this.findAll(orgId, params);
    let totalIncome = 0;
    let totalExpense = 0;
    for (const item of list) {
      const amount = Number(item.amount) || 0;
      if (item.type === FUND_TYPE.INCOME) {
        totalIncome += amount;
      } else if (item.type === FUND_TYPE.EXPENSE) {
        totalExpense += amount;
      }
    }
    return {
      total_income: Math.round(totalIncome * 100) / 100,
      total_expense: Math.round(totalExpense * 100) / 100,
      net_amount: Math.round((totalIncome - totalExpense) * 100) / 100,
    };
  }

  // 入账，更新 account_status='accounted' 和 account_time
  async accountFund(id: string): Promise<BusinessFund> {
    const before = await this.fundRepository.findOne({ where: { id } });
    await this.fundRepository.update(id, {
      account_status: 'accounted',
      account_time: new Date(),
    });
    const result = await this.fundRepository.findOne({ where: { id } });

    // M6: 入账后，若关联 case_id，重新汇总该案件已入账的业务款收入，回写 case.settled_amount
    const caseId = before?.case_id || result?.case_id;
    if (caseId) {
      try {
        const accountedFunds = await this.fundRepository.find({
          where: { case_id: caseId, account_status: 'accounted' } as any,
        });
        let totalSettled = 0;
        for (const f of accountedFunds) {
          if (f.type === FUND_TYPE.INCOME) {
            totalSettled += Number(f.amount) || 0;
          }
        }
        await this.caseRepository.update(caseId, {
          settled_amount: Math.round(totalSettled * 100) / 100,
        });
      } catch (err) {
        // 更新案件 settled_amount 失败不影响主流程，静默处理
      }
    }

    return result;
  }

  // 分账，records 是 [{role, amount}] 数组，保存到 allocation_records（JSON字符串）
  async allocateFund(
    id: string,
    records: Array<{ role: string; amount: number }>,
  ): Promise<BusinessFund> {
    const before = await this.fundRepository.findOne({ where: { id } });
    await this.fundRepository.update(id, {
      allocation_records: JSON.stringify(records || []),
    });
    const result = await this.fundRepository.findOne({ where: { id } });

    // M6: 分账后，若关联 case_id，调用 commissionService 尝试触发分润
    const caseId = before?.case_id || result?.case_id;
    if (caseId) {
      try {
        await this.commissionService.checkAndTriggerCommission({ case_id: caseId });
      } catch (err) {
        // 触发分润失败不影响主流程，静默处理
      }
    }

    return result;
  }

  // 税费分摊，更新 tax_share
  async taxShareFund(id: string, amount: number): Promise<BusinessFund> {
    await this.fundRepository.update(id, {
      tax_share: amount,
    });
    return this.fundRepository.findOne({ where: { id } });
  }
}
