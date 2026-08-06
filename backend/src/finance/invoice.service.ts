import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, DataSource } from 'typeorm';
import { Invoice } from './invoice.entity';
import { Case } from '../case/case.entity';

// 发票管理新增状态常量（与原有 InvoiceStatus 并存，不破坏原逻辑）
export const INVOICE_EXT_STATUS = {
  ISSUED: 'issued', // 已开具
  VOIDED: 'voided', // 已作废
  RED_FLUSHED: 'red_flushed', // 已冲红
} as const;

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    private dataSource: DataSource,
  ) {}

  /**
   * 重新计算指定案件的已开票金额合计（未作废未冲红的发票 total_amount 之和），回写 case.invoiced_amount
   */
  private async recalcCaseInvoicedAmount(caseId: string): Promise<void> {
    if (!caseId) return;
    try {
      const all = await this.invoiceRepository.find({ where: { case_id: caseId } as any });
      let total = 0;
      for (const inv of all) {
        const s = String(inv.status || '');
        // 仅统计未作废（非 voided）非冲红（非 red_flushed）的发票
        if (s === 'voided' || s === 'red_flushed') continue;
        total += Number(inv.total_amount || inv.amount) || 0;
      }
      await this.caseRepository.update(caseId, { invoiced_amount: total });
    } catch (err) {
      // 失败不影响主流程
    }
  }

  // 创建发票，自动计算税额和价税合计
  async create(data: Partial<Invoice>): Promise<Invoice> {
    const amount = Number(data.amount) || 0;
    const taxRate = Number(data.tax_rate);
    const effectiveRate = isNaN(taxRate) ? 0.06 : taxRate;
    // 税额 = 金额 * 税率
    data.tax_amount = Math.round(amount * effectiveRate * 100) / 100;
    // 价税合计 = 金额 + 税额
    data.total_amount = Math.round((amount + Number(data.tax_amount)) * 100) / 100;
    // 默认状态为已开具
    if (!data.status) {
      data.status = INVOICE_EXT_STATUS.ISSUED as any;
    }
    // 默认开票日期为今天
    if (!data.issue_date) {
      data.issue_date = new Date();
    }
    const invoice = this.invoiceRepository.create(data);
    const saved = await this.invoiceRepository.save(invoice);
    // T9: 创建发票后重新汇总案件已开票额
    if (saved.case_id) {
      await this.recalcCaseInvoicedAmount(saved.case_id);
    }
    return saved;
  }

  // 查询发票列表，支持 type/status/keyword/date 筛选
  async findAll(
    orgId: string,
    params?: {
      type?: string;
      status?: string;
      keyword?: string;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<Invoice[]> {
    const where: any = {};
    if (orgId) {
      where.organization_id = orgId;
    }
    if (params?.type) {
      where.invoice_type = params.type;
    }
    if (params?.status) {
      where.status = params.status;
    }
    if (params?.keyword) {
      where.buyer_name = Like(`%${params.keyword}%`);
    }
    if (params?.startDate && params?.endDate) {
      where.issue_date = Between(params.startDate, params.endDate);
    } else if (params?.startDate) {
      where.issue_date = Between(params.startDate, '2099-12-31');
    } else if (params?.endDate) {
      where.issue_date = Between('2000-01-01', params.endDate);
    }
    return this.invoiceRepository.find({
      where,
      order: { updated_at: 'DESC' },
    });
  }

  // 查询单条详情
  async findOne(id: string): Promise<Invoice> {
    return this.invoiceRepository.findOne({ where: { id } });
  }

  // 更新发票
  async update(id: string, data: Partial<Invoice>): Promise<Invoice> {
    // 如果更新了金额或税率，重新计算税额和价税合计
    const needRecalc = data.amount !== undefined || data.tax_rate !== undefined || data.total_amount !== undefined;
    if (data.amount !== undefined || data.tax_rate !== undefined) {
      const existing = await this.invoiceRepository.findOne({ where: { id } });
      const amount = Number(data.amount ?? existing.amount) || 0;
      const taxRateRaw = Number(data.tax_rate ?? existing.tax_rate);
      const effectiveRate = isNaN(taxRateRaw) ? 0.06 : taxRateRaw;
      data.tax_amount = Math.round(amount * effectiveRate * 100) / 100;
      data.total_amount = Math.round((amount + Number(data.tax_amount)) * 100) / 100;
    }
    await this.invoiceRepository.update(id, data);
    const result = await this.invoiceRepository.findOne({ where: { id } });
    // T9: 若变更了金额/税率等影响 total_amount 的字段，重新汇总案件已开票额
    if (needRecalc && result?.case_id) {
      await this.recalcCaseInvoicedAmount(result.case_id);
    }
    return result;
  }

  // 删除发票
  async remove(id: string): Promise<void> {
    // T9: 删除前先拿 case_id，软删后重新汇总案件已开票额
    const before = await this.invoiceRepository.findOne({ where: { id } });
    const caseId = before?.case_id;
    await this.invoiceRepository.softDelete(id);
    if (caseId) {
      await this.recalcCaseInvoicedAmount(caseId);
    }
  }

  // 作废发票（需填原因）
  async void(id: string, reason: string): Promise<Invoice> {
    await this.invoiceRepository.update(id, {
      status: INVOICE_EXT_STATUS.VOIDED as any,
      void_reason: reason,
      void_date: new Date(),
    });
    const result = await this.invoiceRepository.findOne({ where: { id } });
    // T9: 作废后重新汇总案件已开票额
    if (result?.case_id) {
      await this.recalcCaseInvoicedAmount(result.case_id);
    }
    return result;
  }

  // 冲红发票
  async redFlush(id: string): Promise<Invoice> {
    await this.invoiceRepository.update(id, {
      status: INVOICE_EXT_STATUS.RED_FLUSHED as any,
    });
    const result = await this.invoiceRepository.findOne({ where: { id } });
    // T9: 冲红后重新汇总案件已开票额
    if (result?.case_id) {
      await this.recalcCaseInvoicedAmount(result.case_id);
    }
    return result;
  }

  // 退款发票，更新退款金额和退款日期
  async refundInvoice(id: string, amount: number, date: string): Promise<Invoice> {
    await this.invoiceRepository.update(id, {
      refund_amount: amount,
      refund_date: date ? new Date(date) : null,
    });
    return this.invoiceRepository.findOne({ where: { id } });
  }

  // 调账发票，追加一条调账记录到 adjustment_records（JSON数组）
  async adjustInvoice(
    id: string,
    data: { reason: string; amount: number; operator_id: string },
  ): Promise<Invoice> {
    const existing = await this.invoiceRepository.findOne({ where: { id } });
    // 读取现有调账记录（JSON数组），若为空则初始化为空数组
    let records: any[] = [];
    if (existing?.adjustment_records) {
      try {
        records = JSON.parse(existing.adjustment_records);
        if (!Array.isArray(records)) {
          records = [];
        }
      } catch (e) {
        records = [];
      }
    }
    // 追加新调账记录
    records.push({
      time: new Date().toISOString(),
      reason: data.reason,
      amount: data.amount,
      operator_id: data.operator_id,
    });
    await this.invoiceRepository.update(id, {
      adjustment_records: JSON.stringify(records),
    });
    return this.invoiceRepository.findOne({ where: { id } });
  }
}
