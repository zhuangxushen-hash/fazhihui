import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { WithholdingRecord, WITHHOLDING_STATUS } from './withholding-record.entity';
import { WithholdingBatch, BATCH_STATUS } from './withholding-batch.entity';
import { TaxCalculation, TAX_STATUS } from './tax-calculation.entity';
import { Case } from '../case/case.entity';
import { User } from '../user/user.entity';
import { BusinessFund } from './business-fund.entity';

@Injectable()
export class FinancialAccountingService {
  constructor(
    @InjectRepository(WithholdingRecord)
    private withholdingRecordRepository: Repository<WithholdingRecord>,
    @InjectRepository(WithholdingBatch)
    private withholdingBatchRepository: Repository<WithholdingBatch>,
    @InjectRepository(TaxCalculation)
    private taxCalculationRepository: Repository<TaxCalculation>,
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(BusinessFund)
    private businessFundRepository: Repository<BusinessFund>,
    private dataSource: DataSource,
  ) {}

  // 生成代扣编号：WH + 日期 + 4位序号
  private async generateWithholdingNo(orgId: string): Promise<string> {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `WH${dateStr}`;
    const count = await this.withholdingRecordRepository
      .createQueryBuilder('w')
      .where('w.withholding_no LIKE :prefix', { prefix: `${prefix}%` })
      .andWhere('w.organization_id = :orgId', { orgId })
      .getCount();
    return `${prefix}${String(count + 1).padStart(4, '0')}`;
  }

  // 生成批次编号：WHB + 日期 + 4位序号
  private async generateBatchNo(orgId: string): Promise<string> {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `WHB${dateStr}`;
    const count = await this.withholdingBatchRepository
      .createQueryBuilder('w')
      .where('w.batch_no LIKE :prefix', { prefix: `${prefix}%` })
      .andWhere('w.organization_id = :orgId', { orgId })
      .getCount();
    return `${prefix}${String(count + 1).padStart(4, '0')}`;
  }

  /**
   * 创建单条代扣记录
   */
  async createWithholding(data: {
    case_id?: string;
    user_id?: string;
    withholding_type: string;
    amount: number;
    remark?: string;
    organization_id: string;
  }): Promise<WithholdingRecord> {
    if (!data.amount || Number(data.amount) <= 0) {
      throw new BadRequestException('代扣金额必须大于0');
    }
    const no = await this.generateWithholdingNo(data.organization_id);
    const record = this.withholdingRecordRepository.create({
      withholding_no: no,
      case_id: data.case_id || null,
      user_id: data.user_id || null,
      withholding_type: data.withholding_type,
      amount: Number(data.amount),
      status: WITHHOLDING_STATUS.PENDING,
      remark: data.remark,
      organization_id: data.organization_id,
    });
    return this.withholdingRecordRepository.save(record);
  }

  /**
   * 批量创建代扣记录并生成代扣批次
   * @param records 代扣明细数组（case_id/user_id/amount 等）
   */
  async createBatch(
    withholdingType: string,
    records: Array<{
      case_id?: string;
      user_id?: string;
      amount: number;
      remark?: string;
    }>,
    orgId: string,
    operatorId?: string,
  ): Promise<{ batch: WithholdingBatch; records: WithholdingRecord[] }> {
    if (!records || records.length === 0) {
      throw new BadRequestException('代扣明细不能为空');
    }
    const totalAmount = records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    // 事务：先创建批次，再创建明细
    return this.dataSource.transaction(async (manager) => {
      const batchNo = await this.generateBatchNo(orgId);
      const batch = manager.create(WithholdingBatch, {
        batch_no: batchNo,
        withholding_type: withholdingType,
        total_count: records.length,
        success_count: 0,
        fail_count: 0,
        total_amount: totalAmount,
        status: BATCH_STATUS.PENDING,
        operator_id: operatorId,
        organization_id: orgId,
      });
      const savedBatch = await manager.save(WithholdingBatch, batch);

      const savedRecords: WithholdingRecord[] = [];
      for (const r of records) {
        if (!r.amount || Number(r.amount) <= 0) continue;
        const no = await this.generateWithholdingNo(orgId);
        const record = manager.create(WithholdingRecord, {
          withholding_no: no,
          batch_id: savedBatch.id,
          case_id: r.case_id || null,
          user_id: r.user_id || null,
          withholding_type: withholdingType,
          amount: Number(r.amount),
          status: WITHHOLDING_STATUS.PENDING,
          remark: r.remark,
          organization_id: orgId,
        });
        savedRecords.push(await manager.save(WithholdingRecord, record));
      }

      // 回写批次实际记录数
      await manager.update(WithholdingBatch, savedBatch.id, {
        total_count: savedRecords.length,
      });
      savedBatch.total_count = savedRecords.length;

      return { batch: savedBatch, records: savedRecords };
    });
  }

  /**
   * 查询代扣记录（支持按批次/类型/状态/案件筛选）
   */
  async getWithholdingRecords(
    orgId: string,
    filters: {
      batch_id?: string;
      withholding_type?: string;
      status?: string;
      case_id?: string;
      page?: number;
      page_size?: number;
    },
  ): Promise<{ data: WithholdingRecord[]; total: number }> {
    const qb = this.withholdingRecordRepository
      .createQueryBuilder('w')
      .where('w.organization_id = :orgId', { orgId });
    if (filters.batch_id) {
      qb.andWhere('w.batch_id = :batchId', { batchId: filters.batch_id });
    }
    if (filters.withholding_type) {
      qb.andWhere('w.withholding_type = :type', { type: filters.withholding_type });
    }
    if (filters.status) {
      qb.andWhere('w.status = :status', { status: filters.status });
    }
    if (filters.case_id) {
      qb.andWhere('w.case_id = :caseId', { caseId: filters.case_id });
    }
    qb.orderBy('w.created_at', 'DESC');

    const page = Number(filters.page) || 1;
    const pageSize = Number(filters.page_size) || 20;
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  /**
   * 查询代扣批次列表
   */
  async getWithholdingBatches(
    orgId: string,
    filters: {
      withholding_type?: string;
      status?: string;
      page?: number;
      page_size?: number;
    },
  ): Promise<{ data: WithholdingBatch[]; total: number }> {
    const qb = this.withholdingBatchRepository
      .createQueryBuilder('b')
      .where('b.organization_id = :orgId', { orgId });
    if (filters.withholding_type) {
      qb.andWhere('b.withholding_type = :type', { type: filters.withholding_type });
    }
    if (filters.status) {
      qb.andWhere('b.status = :status', { status: filters.status });
    }
    qb.orderBy('b.created_at', 'DESC');

    const page = Number(filters.page) || 1;
    const pageSize = Number(filters.page_size) || 20;
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  /**
   * 执行单条代扣
   * 将代扣记录状态流转为 completed，并生成一笔支出型业务款记录
   */
  async executeWithholding(id: string): Promise<WithholdingRecord> {
    return this.dataSource.transaction(async (manager) => {
      const record = await manager.findOne(WithholdingRecord, { where: { id } });
      if (!record) {
        throw new NotFoundException('代扣记录不存在');
      }
      if (record.status !== WITHHOLDING_STATUS.PENDING) {
        throw new BadRequestException('仅待代扣状态的记录可以执行');
      }

      // 更新代扣状态为执行成功
      await manager.update(WithholdingRecord, id, {
        status: WITHHOLDING_STATUS.COMPLETED,
        executed_at: new Date(),
        fail_reason: null,
      });

      // 生成支出型业务款记录（类型=expense，分类=withholding）
      const fund = manager.create(BusinessFund, {
        case_id: record.case_id || null,
        type: 'expense',
        category: 'withholding',
        amount: Number(record.amount),
        payer: '律所',
        payee: '代扣',
        payment_date: new Date(),
        payment_method: 'withholding',
        remarks: `代扣记录:${record.withholding_no}，类型:${record.withholding_type}`,
        account_status: 'accounted',
        account_time: new Date(),
        organization_id: record.organization_id,
      });
      await manager.save(BusinessFund, fund);

      // 更新所属批次成功数
      if (record.batch_id) {
        const batch = await manager.findOne(WithholdingBatch, { where: { id: record.batch_id } });
        if (batch) {
          await manager.update(WithholdingBatch, batch.id, {
            success_count: batch.success_count + 1,
          });
        }
      }

      return manager.findOne(WithholdingRecord, { where: { id } });
    });
  }

  /**
   * 批量执行代扣批次
   * 顺序执行批次下所有待代扣记录
   */
  async executeBatch(batchId: string): Promise<{
    batch: WithholdingBatch;
    success: number;
    failed: number;
    fail_records: WithholdingRecord[];
  }> {
    const batch = await this.withholdingBatchRepository.findOne({ where: { id: batchId } });
    if (!batch) {
      throw new NotFoundException('代扣批次不存在');
    }
    if (batch.status === BATCH_STATUS.COMPLETED || batch.status === BATCH_STATUS.PROCESSING) {
      throw new BadRequestException('该批次已执行或正在执行中');
    }

    await this.withholdingBatchRepository.update(batchId, { status: BATCH_STATUS.PROCESSING });

    const records = await this.withholdingRecordRepository.find({
      where: { batch_id: batchId },
    });

    let success = 0;
    let failed = 0;
    const failRecords: WithholdingRecord[] = [];

    for (const record of records) {
      if (record.status !== WITHHOLDING_STATUS.PENDING) continue;
      try {
        await this.executeWithholding(record.id);
        success++;
      } catch (err) {
        failed++;
        const failReason = err instanceof Error ? err.message : '代扣执行失败';
        await this.withholdingRecordRepository.update(record.id, {
          status: WITHHOLDING_STATUS.FAILED,
          fail_reason: failReason,
        });
        failRecords.push(
          (await this.withholdingRecordRepository.findOne({ where: { id: record.id } }))!,
        );
      }
    }

    const finalStatus = failed > 0 ? BATCH_STATUS.FAILED : BATCH_STATUS.COMPLETED;
    const updatedBatch = await this.withholdingBatchRepository.save({
      ...batch,
      status: finalStatus,
      success_count: success,
      fail_count: failed,
    });

    return { batch: updatedBatch, success, failed, fail_records: failRecords };
  }

  /**
   * 撤销代扣（未执行记录取消）
   */
  async cancelWithholding(id: string, reason?: string): Promise<WithholdingRecord> {
    const record = await this.withholdingRecordRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException('代扣记录不存在');
    }
    if (record.status !== WITHHOLDING_STATUS.PENDING) {
      throw new BadRequestException('仅待代扣状态的记录可以撤销');
    }
    await this.withholdingRecordRepository.update(id, {
      status: WITHHOLDING_STATUS.CANCELLED,
      cancel_reason: reason,
    });
    return this.withholdingRecordRepository.findOne({ where: { id } });
  }

  /**
   * 冲抵代扣（已代扣记录冲抵回款）
   * 冲抵后生成一笔收入型业务款记录，恢复金额到案件
   */
  async offsetWithholding(id: string, reason?: string): Promise<WithholdingRecord> {
    return this.dataSource.transaction(async (manager) => {
      const record = await manager.findOne(WithholdingRecord, { where: { id } });
      if (!record) {
        throw new NotFoundException('代扣记录不存在');
      }
      if (record.status !== WITHHOLDING_STATUS.COMPLETED) {
        throw new BadRequestException('仅已代扣状态的记录可以冲抵');
      }

      await manager.update(WithholdingRecord, id, {
        status: WITHHOLDING_STATUS.OFFSET,
        cancel_reason: reason,
      });

      // 生成收入型业务款记录（冲抵回款）
      const fund = manager.create(BusinessFund, {
        case_id: record.case_id || null,
        type: 'income',
        category: 'withholding_offset',
        amount: Number(record.amount),
        payer: '代扣',
        payee: '律所',
        payment_date: new Date(),
        payment_method: 'offset',
        remarks: `冲抵代扣记录:${record.withholding_no}，原因:${reason || '冲抵'}`,
        account_status: 'accounted',
        account_time: new Date(),
        organization_id: record.organization_id,
      });
      await manager.save(BusinessFund, fund);

      return manager.findOne(WithholdingRecord, { where: { id } });
    });
  }

  /**
   * 计算个税（综合所得预扣预缴，按月简化计算）
   * 应纳税所得额 = 收入 - 免征额(5000)
   */
  calculateIncomeTax(incomeAmount: number, exemptionAmount: number = 5000): {
    taxable_income: number;
    tax_rate: number;
    quick_deduction: number;
    tax_amount: number;
  } {
    const income = Number(incomeAmount) || 0;
    const exemption = Number(exemptionAmount) || 5000;
    const taxableIncome = Math.max(income - exemption, 0);

    // 按月综合所得税率表
    let taxRate = 0;
    let quickDeduction = 0;
    if (taxableIncome <= 36000) {
      taxRate = 3;
      quickDeduction = 0;
    } else if (taxableIncome <= 144000) {
      taxRate = 10;
      quickDeduction = 2520;
    } else if (taxableIncome <= 300000) {
      taxRate = 20;
      quickDeduction = 16920;
    } else if (taxableIncome <= 420000) {
      taxRate = 25;
      quickDeduction = 31920;
    } else if (taxableIncome <= 660000) {
      taxRate = 30;
      quickDeduction = 52920;
    } else if (taxableIncome <= 960000) {
      taxRate = 35;
      quickDeduction = 85920;
    } else {
      taxRate = 45;
      quickDeduction = 181920;
    }

    const taxAmount = Math.max(taxableIncome * (taxRate / 100) - quickDeduction, 0);
    return {
      taxable_income: Math.round(taxableIncome * 100) / 100,
      tax_rate: taxRate,
      quick_deduction: quickDeduction,
      tax_amount: Math.round(taxAmount * 100) / 100,
    };
  }

  /**
   * 创建个税计算明细并生成代扣记录（个税批量结算入账）
   */
  async createIncomeTaxWithholding(
    records: Array<{
      user_id?: string;
      case_id?: string;
      income_amount: number;
      tax_month: string;
      remark?: string;
    }>,
    orgId: string,
  ): Promise<{ calculations: TaxCalculation[]; withholding: WithholdingRecord | null }> {
    if (!records || records.length === 0) {
      throw new BadRequestException('计税明细不能为空');
    }

    const calculations: TaxCalculation[] = [];
    let totalTax = 0;

    for (const r of records) {
      const income = Number(r.income_amount) || 0;
      if (income <= 0) continue;
      const result = this.calculateIncomeTax(income);
      totalTax += result.tax_amount;

      const calc = this.taxCalculationRepository.create({
        user_id: r.user_id || null,
        case_id: r.case_id || null,
        income_amount: income,
        exemption_amount: 5000,
        taxable_income: result.taxable_income,
        tax_rate: result.tax_rate,
        quick_deduction: result.quick_deduction,
        tax_amount: result.tax_amount,
        tax_month: r.tax_month,
        status: TAX_STATUS.PENDING,
        remark: r.remark,
        organization_id: orgId,
      });
      calculations.push(await this.taxCalculationRepository.save(calc));
    }

    // 汇总生成一条个税代扣记录
    let withholding: WithholdingRecord | null = null;
    if (totalTax > 0) {
      withholding = await this.createWithholding({
        case_id: null,
        user_id: null,
        withholding_type: 'income_tax',
        amount: totalTax,
        remark: `个税批量结算入账（${records[0].tax_month || ''}）`,
        organization_id: orgId,
      });
      // 关联代扣记录
      for (const calc of calculations) {
        await this.taxCalculationRepository.update(calc.id, { withholding_id: withholding.id });
      }
    }

    return { calculations, withholding };
  }

  /**
   * 查询个税计算明细
   */
  async getTaxCalculations(
    orgId: string,
    filters: {
      tax_month?: string;
      status?: string;
      user_id?: string;
      page?: number;
      page_size?: number;
    },
  ): Promise<{ data: TaxCalculation[]; total: number }> {
    const qb = this.taxCalculationRepository
      .createQueryBuilder('t')
      .where('t.organization_id = :orgId', { orgId });
    if (filters.tax_month) {
      qb.andWhere('t.tax_month = :month', { month: filters.tax_month });
    }
    if (filters.status) {
      qb.andWhere('t.status = :status', { status: filters.status });
    }
    if (filters.user_id) {
      qb.andWhere('t.user_id = :userId', { userId: filters.user_id });
    }
    qb.orderBy('t.created_at', 'DESC');

    const page = Number(filters.page) || 1;
    const pageSize = Number(filters.page_size) || 20;
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  /**
   * 代扣统计（概览卡片数据）
   */
  async getWithholdingStats(orgId: string): Promise<{
    pending_count: number;
    completed_count: number;
    pending_amount: number;
    completed_amount: number;
    failed_count: number;
    batch_count: number;
  }> {
    const qb = this.withholdingRecordRepository
      .createQueryBuilder('w')
      .where('w.organization_id = :orgId', { orgId });

    const [pendingCount, completedCount, failedCount, pendingAmount, completedAmount] = await Promise.all([
      qb.clone().andWhere('w.status = :s', { s: WITHHOLDING_STATUS.PENDING }).getCount(),
      qb.clone().andWhere('w.status = :s', { s: WITHHOLDING_STATUS.COMPLETED }).getCount(),
      qb.clone().andWhere('w.status = :s', { s: WITHHOLDING_STATUS.FAILED }).getCount(),
      qb
        .clone()
        .andWhere('w.status = :s', { s: WITHHOLDING_STATUS.PENDING })
        .select('COALESCE(SUM(w.amount), 0)', 'total')
        .getRawOne()
        .then((r) => Number(r?.total || 0)),
      qb
        .clone()
        .andWhere('w.status = :s', { s: WITHHOLDING_STATUS.COMPLETED })
        .select('COALESCE(SUM(w.amount), 0)', 'total')
        .getRawOne()
        .then((r) => Number(r?.total || 0)),
    ]);

    const batchCount = await this.withholdingBatchRepository.count({
      where: { organization_id: orgId },
    });

    return {
      pending_count: pendingCount,
      completed_count: completedCount,
      pending_amount: pendingAmount,
      completed_amount: completedAmount,
      failed_count: failedCount,
      batch_count: batchCount,
    };
  }
}
