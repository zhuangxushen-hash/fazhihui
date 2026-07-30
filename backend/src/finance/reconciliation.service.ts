import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reconciliation, ReconciliationStatus } from './reconciliation.entity';
import { Receivable } from './receivable.entity';
import { PaymentRecord } from './payment-record.entity';

@Injectable()
export class ReconciliationService {
  constructor(
    @InjectRepository(Reconciliation)
    private reconciliationRepository: Repository<Reconciliation>,
    @InjectRepository(Receivable)
    private receivableRepository: Repository<Receivable>,
    @InjectRepository(PaymentRecord)
    private paymentRecordRepository: Repository<PaymentRecord>,
  ) {}

  async create(data: Partial<Reconciliation>): Promise<Reconciliation> {
    const reconciliation = this.reconciliationRepository.create(data);
    return this.reconciliationRepository.save(reconciliation);
  }

  async findAll(orgId: string): Promise<Reconciliation[]> {
    return this.reconciliationRepository.find({
      where: { organization_id: orgId },
      order: { created_at: 'DESC' },
    });
  }

  async findById(id: string): Promise<Reconciliation> {
    return this.reconciliationRepository.findOne({ where: { id } });
  }

  async update(id: string, data: Partial<Reconciliation>): Promise<Reconciliation> {
    await this.reconciliationRepository.update(id, data);
    return this.reconciliationRepository.findOne({ where: { id } });
  }

  async remove(id: string): Promise<void> {
    await this.reconciliationRepository.delete(id);
  }

  async runReconciliation(periodStart: string, periodEnd: string, orgId: string): Promise<Reconciliation> {
    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);

    const receivables = await this.receivableRepository.find({
      where: { organization_id: orgId },
    });

    let totalReceivable = 0;
    let totalReceived = 0;
    let totalOverdue = 0;
    let matchCount = 0;
    let mismatchCount = 0;

    for (const receivable of receivables) {
      totalReceivable += Number(receivable.contract_amount);
      totalReceived += Number(receivable.received_amount);

      const dueDate = receivable.installment_plan
        ? this.getMinDueDate(receivable.installment_plan)
        : null;

      if (dueDate && dueDate < startDate) {
        const overdue = Number(receivable.contract_amount) - Number(receivable.received_amount);
        if (overdue > 0) {
          totalOverdue += overdue;
        }
      }

      if (Number(receivable.received_amount) >= Number(receivable.contract_amount)) {
        matchCount++;
      } else {
        mismatchCount++;
      }
    }

    const reconciliationNo = `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const reconciliation = this.reconciliationRepository.create({
      reconciliation_no: reconciliationNo,
      period_start: startDate,
      period_end: endDate,
      total_receivable: totalReceivable,
      total_received: totalReceived,
      total_overdue: totalOverdue,
      match_count: matchCount,
      mismatch_count: mismatchCount,
      status: ReconciliationStatus.COMPLETED,
      organization_id: orgId,
    });

    return this.reconciliationRepository.save(reconciliation);
  }

  private getMinDueDate(installmentPlan: any[]): Date | null {
    if (!installmentPlan || installmentPlan.length === 0) {
      return null;
    }
    let minDate: Date | null = null;
    for (const item of installmentPlan) {
      if (item.status === 'pending' && item.due_date) {
        const dueDate = new Date(item.due_date);
        if (!minDate || dueDate < minDate) {
          minDate = dueDate;
        }
      }
    }
    return minDate;
  }

  async getReconciliationStats(orgId: string): Promise<{
    total_receivable: number;
    total_received: number;
    total_overdue: number;
    match_rate: number;
    total_count: number;
    completed_count: number;
  }> {
    const receivables = await this.receivableRepository.find({
      where: { organization_id: orgId },
    });

    let totalReceivable = 0;
    let totalReceived = 0;
    let totalOverdue = 0;
    let matched = 0;

    for (const r of receivables) {
      totalReceivable += Number(r.contract_amount);
      totalReceived += Number(r.received_amount);
      const pending = Number(r.contract_amount) - Number(r.received_amount);
      if (pending > 0) {
        totalOverdue += pending;
      }
      if (Number(r.received_amount) >= Number(r.contract_amount)) {
        matched++;
      }
    }

    const totalCount = receivables.length;
    const matchRate = totalCount > 0 ? (matched / totalCount) * 100 : 0;

    const reconciliations = await this.reconciliationRepository.find({
      where: { organization_id: orgId },
    });
    const completedCount = reconciliations.filter(r => r.status === ReconciliationStatus.COMPLETED).length;

    return {
      total_receivable: totalReceivable,
      total_received: totalReceived,
      total_overdue: totalOverdue,
      match_rate: Math.round(matchRate * 100) / 100,
      total_count: totalCount,
      completed_count: completedCount,
    };
  }
}