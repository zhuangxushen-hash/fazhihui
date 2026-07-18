import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Case } from './case.entity';
import { Document } from './document.entity';
import { User } from '../user/user.entity';
import { CaseStatus, CaseType } from '../types';

@Injectable()
export class CaseService {
  constructor(
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(caseData: Partial<Case>): Promise<Case> {
    const caseEntity = this.caseRepository.create(caseData);
    const { risk_level, risk_notes } = this.analyzeRisk(caseEntity);
    caseEntity.risk_level = risk_level;
    caseEntity.risk_notes = risk_notes;
    return this.caseRepository.save(caseEntity);
  }

  private analyzeRisk(caseEntity: Partial<Case>): { risk_level: string; risk_notes: string } {
    const factors: string[] = [];
    
    if (caseEntity.fee_amount && caseEntity.fee_amount > 500000) {
      factors.push('涉案金额较大(>50万)');
    }
    
    if (caseEntity.deadline) {
      const deadline = new Date(caseEntity.deadline);
      const now = new Date();
      const diffDays = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 15) {
        factors.push('临近期限(<15天)');
      }
    }
    
    if (['criminal', 'admin'].includes(caseEntity.case_type)) {
      factors.push('案由复杂度较高');
    }
    
    let risk_level = 'low';
    if (factors.length >= 2) {
      risk_level = 'high';
    } else if (factors.length === 1) {
      risk_level = 'medium';
    }
    
    return { risk_level, risk_notes: factors.join('; ') };
  }

  async updateRiskLevel(id: string, risk_level: string, risk_notes?: string): Promise<Case> {
    await this.caseRepository.update(id, { risk_level, risk_notes });
    return this.caseRepository.findOne({ where: { id } });
  }

  async checkOverdue(): Promise<void> {
    const now = new Date();
    const cases = await this.caseRepository.find({
      where: { status: CaseStatus.PROCESSING },
    });
    
    for (const caseEntity of cases) {
      if (caseEntity.deadline) {
        const deadline = new Date(caseEntity.deadline);
        if (deadline < now) {
          await this.caseRepository.update(caseEntity.id, { is_overdue: true });
        }
      }
    }
  }

  async getOverdueCases(orgId: string): Promise<Case[]> {
    return this.caseRepository.find({
      where: { organization_id: orgId, is_overdue: true },
      order: { deadline: 'ASC' },
    });
  }

  async getHighRiskCases(orgId: string): Promise<Case[]> {
    return this.caseRepository.find({
      where: { organization_id: orgId, risk_level: 'high' },
      order: { updated_at: 'DESC' },
    });
  }

  async findAll(orgId: string, filters?: {
    status?: CaseStatus;
    case_type?: CaseType;
    assignee_lawyer_id?: string;
    page?: number;
    limit?: number;
    case_no?: string;
    client_name?: string;
  }): Promise<{ data: (Case & { lawyer_name?: string })[]; total: number }> {
    const query = this.caseRepository.createQueryBuilder('case')
      .where('case.organization_id = :orgId', { orgId });

    if (filters?.status) {
      query.andWhere('case.status = :status', { status: filters.status });
    }
    if (filters?.case_type) {
      query.andWhere('case.case_type = :case_type', { case_type: filters.case_type });
    }
    if (filters?.assignee_lawyer_id) {
      query.andWhere('case.assignee_lawyer_id = :assignee_lawyer_id', { assignee_lawyer_id: filters.assignee_lawyer_id });
    }
    if (filters?.case_no) {
      query.andWhere('case.case_no LIKE :case_no', { case_no: `%${filters.case_no}%` });
    }
    if (filters?.client_name) {
      query.andWhere('case.client_name LIKE :client_name', { client_name: `%${filters.client_name}%` });
    }

    const total = await query.getCount();
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    query.skip((page - 1) * limit).take(limit);

    const data = await query.getMany();
    const result = await Promise.all(data.map(async (item) => {
      let lawyer_name: string | undefined;
      if (item.assignee_lawyer_id) {
        const lawyer = await this.userRepository.findOne({ where: { id: item.assignee_lawyer_id } });
        lawyer_name = lawyer?.real_name;
      }
      return { ...item, lawyer_name };
    }));
    return { data: result, total };
  }

  async findById(id: string): Promise<Case & { lawyer_name?: string }> {
    const item = await this.caseRepository.findOne({ where: { id } });
    if (!item) return null;
    let lawyer_name: string | undefined;
    if (item.assignee_lawyer_id) {
      const lawyer = await this.userRepository.findOne({ where: { id: item.assignee_lawyer_id } });
      lawyer_name = lawyer?.real_name;
    }
    return { ...item, lawyer_name };
  }

  async updateStatus(id: string, status: CaseStatus): Promise<Case> {
    await this.caseRepository.update(id, { status });
    return this.caseRepository.findOne({ where: { id } });
  }

  async assignLawyer(id: string, lawyerId: string): Promise<Case> {
    await this.caseRepository.update(id, { assignee_lawyer_id: lawyerId, status: CaseStatus.PROCESSING });
    return this.caseRepository.findOne({ where: { id } });
  }

  async updateDeadline(id: string, deadline: Date): Promise<Case> {
    await this.caseRepository.update(id, { deadline });
    return this.caseRepository.findOne({ where: { id } });
  }

  async uploadDocument(caseId: string, documentData: Partial<Document>): Promise<Document> {
    const document = this.documentRepository.create({ ...documentData, case_id: caseId });
    return this.documentRepository.save(document);
  }

  async getDocuments(caseId: string): Promise<Document[]> {
    return this.documentRepository.find({ where: { case_id: caseId }, order: { created_at: 'DESC' } });
  }

  async closeCase(id: string): Promise<Case> {
    await this.caseRepository.update(id, { status: CaseStatus.CLOSED });
    return this.caseRepository.findOne({ where: { id } });
  }
}
