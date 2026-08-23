import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Case } from '../case/case.entity';
import { PaymentRecord, PaymentStatus, PaymentMethod } from './payment-record.entity';
import { Invoice } from './invoice.entity';
import { Receivable, ReceivableStatus } from './receivable.entity';
import { FinanceService } from './finance.service';

// 项目收款台账查询参数
export interface ProjectCollectionQuery {
  keyword?: string; // 案件编号/案件名称/客户名称
  status?: string; // 收款状态
  startDate?: string; // 建档开始日期
  endDate?: string; // 建档结束日期
}

@Injectable()
export class ProjectCollectionService {
  constructor(
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    @InjectRepository(PaymentRecord)
    private paymentRecordRepository: Repository<PaymentRecord>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Receivable)
    private receivableRepository: Repository<Receivable>,
    private financeService: FinanceService,
  ) {}

  // 项目收款台账聚合：按案件维度汇总应收/已收/未收/已开票及收款与开票明细
  async getLedger(orgId: string, params: ProjectCollectionQuery = {}): Promise<any> {
    const qb = this.caseRepository.createQueryBuilder('c');
    qb.where('c.organization_id = :orgId', { orgId });

    if (params.keyword) {
      qb.andWhere(
        '(c.case_no LIKE :kw OR c.case_name LIKE :kw OR c.client_name LIKE :kw)',
        { kw: `%${params.keyword}%` },
      );
    }
    if (params.status) {
      qb.andWhere('c.payment_status = :status', { status: params.status });
    }
    if (params.startDate) {
      qb.andWhere('c.created_at >= :startDate', { startDate: new Date(params.startDate) });
    }
    if (params.endDate) {
      const end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
      qb.andWhere('c.created_at <= :endDate', { endDate: end });
    }

    const cases = await qb.orderBy('c.created_at', 'DESC').getMany();
    const caseIds = cases.map((c) => c.id);

    // 批量加载收款记录与开票记录
    let payments: PaymentRecord[] = [];
    let invoices: Invoice[] = [];
    if (caseIds.length > 0) {
      payments = await this.paymentRecordRepository.find({ where: { case_id: In(caseIds) } });
      invoices = await this.invoiceRepository.find({ where: { case_id: In(caseIds) } });
    }

    const items = cases.map((c) => {
      const casePayments = payments.filter((p) => p.case_id === c.id);
      const caseInvoices = invoices.filter((i) => i.case_id === c.id);
      const contractAmount = Number(c.fee_amount || 0);
      const collected = Number(c.fee_collected || 0);
      const invoiced = Number(c.invoiced_amount || 0);
      return {
        ...c,
        contract_amount: contractAmount,
        collected_amount: collected,
        unpaid_amount: Math.max(contractAmount - collected, 0),
        invoiced_amount: invoiced,
        payment_records: casePayments,
        invoices: caseInvoices,
      };
    });

    // 汇总统计
    const stats = items.reduce(
      (acc, item) => {
        acc.total_contract += item.contract_amount;
        acc.total_collected += item.collected_amount;
        acc.total_unpaid += item.unpaid_amount;
        acc.total_invoiced += item.invoiced_amount;
        return acc;
      },
      { total_contract: 0, total_collected: 0, total_unpaid: 0, total_invoiced: 0 },
    );

    return { items, stats };
  }

  // 登记收款：案件无应收台账时自动创建（合同金额取案件 fee_amount），再复用统一收款逻辑
  async recordPayment(orgId: string, data: {
    case_id: string;
    amount: number;
    method?: PaymentMethod;
    transaction_id?: string;
    remarks?: string;
    client_id?: string;
  }): Promise<PaymentRecord> {
    if (!data.case_id) {
      throw new BadRequestException('案件不能为空');
    }
    if (!data.amount || Number(data.amount) <= 0) {
      throw new BadRequestException('收款金额必须大于0');
    }
    const caseEntity = await this.caseRepository.findOne({ where: { id: data.case_id } });
    if (!caseEntity) {
      throw new NotFoundException('案件不存在');
    }
    if (caseEntity.organization_id !== orgId) {
      throw new NotFoundException('无权访问该案件');
    }

    // 查找或创建应收台账
    let receivable = await this.receivableRepository.findOne({
      where: { case_id: data.case_id, organization_id: orgId },
    });
    if (!receivable) {
      const contractAmount = Number(caseEntity.fee_amount || 0);
      const collected = Number(caseEntity.fee_collected || 0);
      receivable = await this.receivableRepository.save(
        this.receivableRepository.create({
          case_id: data.case_id,
          organization_id: orgId,
          contract_amount: contractAmount,
          received_amount: collected,
          pending_amount: Math.max(contractAmount - collected, 0),
          status: collected > 0 ? ReceivableStatus.PARTIAL : ReceivableStatus.PENDING,
        }),
      );
    }

    return this.financeService.recordPayment(
      receivable.id,
      data.amount,
      data.method || PaymentMethod.BANK,
      data.transaction_id,
      data.remarks,
      data.client_id,
    );
  }
}
