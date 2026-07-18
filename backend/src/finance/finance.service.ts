import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fee } from './fee.entity';
import { ProfitShare } from './profit-share.entity';
import { Refund, RefundStatus } from './refund.entity';
import { Invoice, InvoiceStatus } from './invoice.entity';
import { FeeRole } from '../types';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(Fee)
    private feeRepository: Repository<Fee>,
    @InjectRepository(ProfitShare)
    private profitShareRepository: Repository<ProfitShare>,
    @InjectRepository(Refund)
    private refundRepository: Repository<Refund>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
  ) {}

  async createFee(feeData: Partial<Fee>): Promise<Fee> {
    const fee = this.feeRepository.create(feeData);
    return this.feeRepository.save(fee);
  }

  async findFees(orgId: string, caseId?: string): Promise<Fee[]> {
    const query = { organization_id: orgId } as any;
    if (caseId) {
      query.case_id = caseId;
    }
    return this.feeRepository.find({ where: query });
  }

  async markAsPaid(id: string): Promise<Fee> {
    await this.feeRepository.update(id, { paid: true, paid_at: new Date() });
    return this.feeRepository.findOne({ where: { id } });
  }

  async calculateProfitShare(caseId: string, orgId: string, feeAmount: number, rules: {
    org?: number;
    lawyer?: number;
    sales?: number;
    marketing?: number;
    assistant?: number;
  }): Promise<ProfitShare[]> {
    const shares: ProfitShare[] = [];
    if (rules.org) {
      shares.push(this.profitShareRepository.create({
        case_id: caseId,
        organization_id: orgId,
        role: FeeRole.ORG,
        percentage: rules.org,
        amount: feeAmount * rules.org / 100,
      }));
    }
    if (rules.lawyer) {
      shares.push(this.profitShareRepository.create({
        case_id: caseId,
        organization_id: orgId,
        role: FeeRole.LAWYER,
        percentage: rules.lawyer,
        amount: feeAmount * rules.lawyer / 100,
      }));
    }
    if (rules.sales) {
      shares.push(this.profitShareRepository.create({
        case_id: caseId,
        organization_id: orgId,
        role: FeeRole.SALES,
        percentage: rules.sales,
        amount: feeAmount * rules.sales / 100,
      }));
    }
    if (rules.marketing) {
      shares.push(this.profitShareRepository.create({
        case_id: caseId,
        organization_id: orgId,
        role: FeeRole.MARKETING,
        percentage: rules.marketing,
        amount: feeAmount * rules.marketing / 100,
      }));
    }
    if (rules.assistant) {
      shares.push(this.profitShareRepository.create({
        case_id: caseId,
        organization_id: orgId,
        role: FeeRole.ASSISTANT,
        percentage: rules.assistant,
        amount: feeAmount * rules.assistant / 100,
      }));
    }
    return this.profitShareRepository.save(shares);
  }

  async getProfitShares(caseId: string): Promise<ProfitShare[]> {
    return this.profitShareRepository.find({ where: { case_id: caseId } });
  }

  async createRefund(refundData: Partial<Refund>): Promise<Refund> {
    const refund = this.refundRepository.create(refundData);
    return this.refundRepository.save(refund);
  }

  async approveRefund(id: string, approvedBy: string, note?: string): Promise<Refund> {
    await this.refundRepository.update(id, {
      status: RefundStatus.APPROVED,
      approved_by: approvedBy,
      approved_at: new Date(),
      approval_note: note,
    });
    return this.refundRepository.findOne({ where: { id } });
  }

  async rejectRefund(id: string, note?: string): Promise<Refund> {
    await this.refundRepository.update(id, {
      status: RefundStatus.REJECTED,
      approval_note: note,
    });
    return this.refundRepository.findOne({ where: { id } });
  }

  async findRefunds(orgId: string, caseId?: string): Promise<Refund[]> {
    const query = { organization_id: orgId } as any;
    if (caseId) {
      query.case_id = caseId;
    }
    return this.refundRepository.find({ where: query });
  }

  async createInvoice(invoiceData: Partial<Invoice>): Promise<Invoice> {
    const invoice = this.invoiceRepository.create(invoiceData);
    return this.invoiceRepository.save(invoice);
  }

  async findInvoices(orgId: string, caseId?: string, status?: string): Promise<Invoice[]> {
    const query = { organization_id: orgId } as any;
    if (caseId) {
      query.case_id = caseId;
    }
    if (status) {
      query.status = status;
    }
    return this.invoiceRepository.find({ where: query });
  }

  async issueInvoice(id: string, invoiceNo: string): Promise<Invoice> {
    await this.invoiceRepository.update(id, {
      status: InvoiceStatus.ISSUED,
      invoice_no: invoiceNo,
      issue_date: new Date(),
    });
    return this.invoiceRepository.findOne({ where: { id } });
  }

  async markInvoicePaid(id: string): Promise<Invoice> {
    await this.invoiceRepository.update(id, {
      status: InvoiceStatus.PAID,
    });
    return this.invoiceRepository.findOne({ where: { id } });
  }

  async cancelInvoice(id: string, note?: string): Promise<Invoice> {
    await this.invoiceRepository.update(id, {
      status: InvoiceStatus.CANCELLED,
      notes: note,
    });
    return this.invoiceRepository.findOne({ where: { id } });
  }
}
