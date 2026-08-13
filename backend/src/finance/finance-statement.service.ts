import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { BusinessFund } from './business-fund.entity';
import { Invoice } from './invoice.entity';
import { PaymentRecord } from './payment-record.entity';
import { Receivable } from './receivable.entity';
import { Case } from '../case/case.entity';

@Injectable()
export class FinanceStatementService {
  constructor(
    @InjectRepository(BusinessFund)
    private businessFundRepository: Repository<BusinessFund>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(PaymentRecord)
    private paymentRecordRepository: Repository<PaymentRecord>,
    @InjectRepository(Receivable)
    private receivableRepository: Repository<Receivable>,
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
  ) {}

  // 解析时间范围筛选
  private buildDateFilter(startDate?: string, endDate?: string) {
    if (startDate && endDate) {
      const start = new Date(`${startDate}T00:00:00`);
      const end = new Date(`${endDate}T23:59:59`);
      return Between(start, end);
    }
    return undefined;
  }

  /**
   * 账户台账结算明细表
   * 按时间段汇总业务款收支，返回账户台账明细
   */
  async getAccountStatement(
    orgId: string,
    filters: {
      start_date?: string;
      end_date?: string;
      type?: string;        // income 收入 / expense 支出
      category?: string;    // 业务款分类
      page?: number;
      page_size?: number;
    },
  ): Promise<{
    data: Array<BusinessFund & { direction_label: string }>;
    total: number;
    summary: { total_income: number; total_expense: number; net_amount: number };
  }> {
    const qb = this.businessFundRepository
      .createQueryBuilder('b')
      .where('b.organization_id = :orgId', { orgId });
    if (filters.type) {
      qb.andWhere('b.type = :type', { type: filters.type });
    }
    if (filters.category) {
      qb.andWhere('b.category = :category', { category: filters.category });
    }
    if (filters.start_date && filters.end_date) {
      qb.andWhere('b.payment_date BETWEEN :start AND :end', {
        start: filters.start_date,
        end: filters.end_date,
      });
    }
    qb.orderBy('b.payment_date', 'DESC').addOrderBy('b.created_at', 'DESC');

    const page = Number(filters.page) || 1;
    const pageSize = Number(filters.page_size) || 20;
    const skip = (page - 1) * pageSize;

    const [list, total] = await qb.clone().skip(skip).take(pageSize).getManyAndCount();

    // 汇总统计
    const all = await qb.clone().getMany();
    const totalIncome = all
      .filter((f) => f.type === 'income')
      .reduce((sum, f) => sum + Number(f.amount || 0), 0);
    const totalExpense = all
      .filter((f) => f.type === 'expense')
      .reduce((sum, f) => sum + Number(f.amount || 0), 0);

    const data = list.map((f) => ({
      ...f,
      direction_label: f.type === 'income' ? '收入' : '支出',
    }));

    return {
      data,
      total,
      summary: {
        total_income: Math.round(totalIncome * 100) / 100,
        total_expense: Math.round(totalExpense * 100) / 100,
        net_amount: Math.round((totalIncome - totalExpense) * 100) / 100,
      },
    };
  }

  /**
   * 项目收入一览表
   * 按案件维度汇总收入、成本、到账金额
   */
  async getProjectRevenueOverview(
    orgId: string,
    filters: { page?: number; page_size?: number; keyword?: string },
  ): Promise<{ data: Array<Record<string, unknown>>; total: number }> {
    const page = Number(filters.page) || 1;
    const pageSize = Number(filters.page_size) || 20;
    const skip = (page - 1) * pageSize;

    // 查询该组织下所有案件
    const caseQb = this.caseRepository
      .createQueryBuilder('c')
      .where('c.organization_id = :orgId', { orgId });
    if (filters.keyword) {
      caseQb.andWhere('(c.case_no LIKE :kw OR c.case_name LIKE :kw)', { kw: `%${filters.keyword}%` });
    }
    caseQb.orderBy('c.created_at', 'DESC');
    const [cases, total] = await caseQb.clone().skip(skip).take(pageSize).getManyAndCount();

    const data: Array<Record<string, unknown>> = [];
    for (const c of cases) {
      // 案件收入（业务款 income）
      const incomes = await this.businessFundRepository.find({
        where: { case_id: c.id, type: 'income' } as any,
      });
      const totalIncome = incomes.reduce((sum, f) => sum + Number(f.amount || 0), 0);
      // 案件成本（业务款 expense + case_cost）
      const expenses = await this.businessFundRepository.find({
        where: { case_id: c.id, type: 'expense' } as any,
      });
      const totalExpense = expenses.reduce((sum, f) => sum + Number(f.amount || 0), 0);
      // 应收与到账
      const receivable = await this.receivableRepository.findOne({
        where: { case_id: c.id } as any,
        order: { created_at: 'DESC' },
      });
      // 支付记录到账金额
      const payments = await this.paymentRecordRepository.find({
        where: { case_id: c.id } as any,
      });
      const receivedAmount = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

      data.push({
        case_id: c.id,
        case_no: c.case_no,
        case_name: c.case_name,
        contract_amount: receivable ? Number(receivable.contract_amount || 0) : 0,
        received_amount: Math.round(receivedAmount * 100) / 100,
        total_income: Math.round(totalIncome * 100) / 100,
        total_expense: Math.round(totalExpense * 100) / 100,
        net_profit: Math.round((totalIncome - totalExpense) * 100) / 100,
      });
    }

    return { data, total };
  }

  /**
   * 收支综合详情（按类型筛选）
   * type: project_revenue 项目收入 / repayment 还款收入 / deposit 存款收入 / other_income 其他收入
   *       / reimburse 报销支出 / account_withdrawal 台账提款 / borrowing 借款支出 / other_expense 其他支出
   */
  async getIncomeExpenditureDetail(
    orgId: string,
    detailType: string,
    filters: { start_date?: string; end_date?: string; page?: number; page_size?: number },
  ): Promise<{ data: BusinessFund[]; total: number; total_amount: number }> {
    // 详情类型映射到业务款分类
    const typeCategoryMap: Record<string, { type: string; category?: string }> = {
      project_revenue: { type: 'income' },
      repayment: { type: 'income' },
      deposit: { type: 'income' },
      other_income: { type: 'income' },
      reimburse: { type: 'expense' },
      account_withdrawal: { type: 'expense' },
      borrowing: { type: 'expense' },
      other_expense: { type: 'expense' },
    };
    const mapping = typeCategoryMap[detailType];
    if (!mapping) {
      throw new BadRequestException('无效的收支详情类型');
    }

    const qb = this.businessFundRepository
      .createQueryBuilder('b')
      .where('b.organization_id = :orgId', { orgId })
      .andWhere('b.type = :type', { type: mapping.type });
    if (mapping.category) {
      qb.andWhere('b.category = :category', { category: mapping.category });
    }
    if (filters.start_date && filters.end_date) {
      qb.andWhere('b.payment_date BETWEEN :start AND :end', {
        start: filters.start_date,
        end: filters.end_date,
      });
    }
    qb.orderBy('b.payment_date', 'DESC').addOrderBy('b.created_at', 'DESC');

    const page = Number(filters.page) || 1;
    const pageSize = Number(filters.page_size) || 20;
    const skip = (page - 1) * pageSize;

    const [list, total] = await qb.clone().skip(skip).take(pageSize).getManyAndCount();
    const all = await qb.clone().getMany();
    const totalAmount = all.reduce((sum, f) => sum + Number(f.amount || 0), 0);

    return { data: list, total, total_amount: Math.round(totalAmount * 100) / 100 };
  }

  /**
   * 发票打印数据
   * 查询发票列表用于打印，支持按状态/时间筛选
   */
  async getInvoicePrintData(
    orgId: string,
    filters: { status?: string; start_date?: string; end_date?: string; page?: number; page_size?: number },
  ): Promise<{ data: Invoice[]; total: number }> {
    const qb = this.invoiceRepository
      .createQueryBuilder('i')
      .where('i.organization_id = :orgId', { orgId });
    if (filters.status) {
      qb.andWhere('i.status = :status', { status: filters.status });
    }
    if (filters.start_date && filters.end_date) {
      qb.andWhere('i.created_at BETWEEN :start AND :end', {
        start: `${filters.start_date}T00:00:00`,
        end: `${filters.end_date}T23:59:59`,
      });
    }
    qb.orderBy('i.created_at', 'DESC');

    const page = Number(filters.page) || 1;
    const pageSize = Number(filters.page_size) || 20;
    const skip = (page - 1) * pageSize;

    const [list, total] = await qb.clone().skip(skip).take(pageSize).getManyAndCount();
    return { data: list, total };
  }
}
