import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Lead } from './lead.entity';
import { FollowUp } from './follow-up.entity';
import { LeadStatus, CaseType, LeadSource } from '../types';

@Injectable()
export class LeadService {
  constructor(
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    @InjectRepository(FollowUp)
    private followUpRepository: Repository<FollowUp>,
  ) {}

  async create(leadData: Partial<Lead>): Promise<Lead> {
    const existingLead = await this.leadRepository.findOne({
      where: { phone: leadData.phone },
    });
    if (existingLead && existingLead.created_at > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
      return existingLead;
    }
    const lead = this.leadRepository.create(leadData);
    return this.leadRepository.save(lead);
  }

  async findAll(orgId: string, filters?: {
    status?: LeadStatus;
    case_type?: CaseType;
    source_channel?: LeadSource;
    page?: number;
    limit?: number;
  }): Promise<{ data: Lead[]; total: number }> {
    const query = this.leadRepository.createQueryBuilder('lead')
      .where('lead.organization_id = :orgId', { orgId });

    if (filters?.status) {
      query.andWhere('lead.status = :status', { status: filters.status });
    }
    if (filters?.case_type) {
      query.andWhere('lead.case_type = :case_type', { case_type: filters.case_type });
    }
    if (filters?.source_channel) {
      query.andWhere('lead.source_channel = :source_channel', { source_channel: filters.source_channel });
    }

    const total = await query.getCount();
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    query.skip((page - 1) * limit).take(limit);

    const data = await query.getMany();
    return { data, total };
  }

  async findById(id: string): Promise<Lead> {
    return this.leadRepository.findOne({ where: { id } });
  }

  async updateStatus(id: string, status: LeadStatus): Promise<Lead> {
    await this.leadRepository.update(id, { status });
    return this.leadRepository.findOne({ where: { id } });
  }

  async assignSales(id: string, salesId: string): Promise<Lead> {
    await this.leadRepository.update(id, { assign_sales_id: salesId, status: LeadStatus.PENDING_FOLLOW });
    return this.leadRepository.findOne({ where: { id } });
  }

  async createFollowUp(leadId: string, content: string, operatorId: string, nextAction?: string, nextActionTime?: Date): Promise<FollowUp> {
    const followUp = this.followUpRepository.create({
      lead_id: leadId,
      content,
      operator_id: operatorId,
      next_action: nextAction,
      next_action_time: nextActionTime,
    });
    await this.leadRepository.update(leadId, { status: LeadStatus.FOLLOWING, follow_up_time: new Date() });
    return this.followUpRepository.save(followUp);
  }

  async getFollowUps(leadId: string): Promise<FollowUp[]> {
    return this.followUpRepository.find({ where: { lead_id: leadId }, order: { created_at: 'DESC' } });
  }

  async autoRecycle(timeoutHours: number = 24): Promise<void> {
    const timeoutDate = new Date(Date.now() - timeoutHours * 60 * 60 * 1000);
    await this.leadRepository.update(
      { status: LeadStatus.PENDING_FOLLOW, created_at: LessThan(timeoutDate) },
      { status: LeadStatus.LOST }
    );
  }
}
