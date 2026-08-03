import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, DataSource } from 'typeorm';
import { Lead } from './lead.entity';
import { FollowUp } from './follow-up.entity';
import { Case } from '../case/case.entity';
import { ConflictCheckService } from '../case/conflict-check.service';
import { LeadStatus, CaseType, LeadSource } from '../types';
// Phase4 M7: 线索创建后自动分配，注入同模块的 LeadAssignmentService
import { LeadAssignmentService } from './lead-assignment.service';

@Injectable()
export class LeadService {
  constructor(
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    @InjectRepository(FollowUp)
    private followUpRepository: Repository<FollowUp>,
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    private dataSource: DataSource,
    private conflictCheckService: ConflictCheckService,
    // Phase4 M7: 注入线索分配服务，线索创建后自动匹配分配规则
    private leadAssignmentService: LeadAssignmentService,
  ) {}

  async create(leadData: Partial<Lead>): Promise<Lead> {
    const existingLead = await this.leadRepository.findOne({
      where: { phone: leadData.phone },
    });
    if (existingLead && existingLead.created_at > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
      return existingLead;
    }
    const lead = this.leadRepository.create(leadData);
    const savedLead = await this.leadRepository.save(lead);

    // Phase4 M7: 线索创建后自动匹配分配规则进行分配（异常静默处理，不影响线索创建主流程）
    try {
      await this.leadAssignmentService.matchAndAssign(savedLead, 'system');
    } catch (err) {}

    return savedLead;
  }

  async findAll(orgId: string, filters?: {
    status?: LeadStatus;
    case_type?: CaseType;
    source_channel?: LeadSource;
    page?: number;
    limit?: number;
    days_no_follow?: number; // 智能筛选：超过X天未跟进
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
    // 智能筛选：超过X天未跟进（follow_up_time 早于阈值 或 从未跟进过）
    if (filters?.days_no_follow) {
      const threshold = new Date(Date.now() - filters.days_no_follow * 24 * 60 * 60 * 1000);
      query.andWhere('(lead.follow_up_time < :threshold OR lead.follow_up_time IS NULL)', { threshold });
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

  async updateFee(id: string, serviceFee: number): Promise<Lead> {
    await this.leadRepository.update(id, { service_fee: serviceFee });
    return this.leadRepository.findOne({ where: { id } });
  }

  async autoRecycle(timeoutHours: number = 24): Promise<void> {
    const timeoutDate = new Date(Date.now() - timeoutHours * 60 * 60 * 1000);
    await this.leadRepository.update(
      { status: LeadStatus.PENDING_FOLLOW, created_at: LessThan(timeoutDate) },
      { status: LeadStatus.LOST }
    );
  }

  /**
   * 线索转化为案件
   * 读取线索信息，创建对应的案件记录，转化成功后更新线索转化状态为 converted
   */
  async convertToCase(leadId: string, extraData?: Partial<Case>): Promise<Case> {
    return this.dataSource.transaction(async (manager) => {
      const lead = await manager.findOne(Lead, { where: { id: leadId } });
      if (!lead) {
        throw new Error('线索不存在');
      }

      // 先将线索转化状态置为转化中
      lead.conversion_status = 'converting';
      await manager.save(Lead, lead);

      // 基于线索信息构建案件数据
      const caseData: Partial<Case> = {
        case_type: lead.case_type as CaseType,
        client_name: lead.contact_name,
        client_phone: lead.phone,
        description: lead.case_description,
        service_fee: lead.service_fee,
        fee_amount: lead.service_fee,
        lead_id: lead.id,
        organization_id: lead.organization_id,
        case_source: lead.source_channel,
        referrer: lead.referrer,
        source_detail: lead.lead_source_detail,
        ...extraData,
      };

      const newCase = manager.create(Case, caseData);
      const savedCase = await manager.save(Case, newCase);

      // 线索转案件时在事务内执行利冲检索，若检测到明确冲突则将案件审批状态置为 conflict_hold
      const conflictResult = await this.conflictCheckService.check({
        partyName: savedCase.client_name,
        opposingParty: savedCase.opposing_party,
        partyPhone: savedCase.client_phone,
        orgId: savedCase.organization_id,
        caseId: savedCase.id,
      });
      if (conflictResult.check_result === 'conflict') {
        await manager.update(Case, savedCase.id, { approval_status: 'conflict_hold' });
        savedCase.approval_status = 'conflict_hold';
      }

      // 转化成功后更新线索
      lead.conversion_status = 'converted';
      lead.case_id = savedCase.id;
      lead.conversion_time = new Date();
      lead.status = LeadStatus.PENDING_SIGN;
      await manager.save(Lead, lead);

      return savedCase;
    });
  }

  /**
   * 查询公共线索池
   * 返回 is_public=true 且属于指定组织的线索列表
   */
  async getPublicLeads(organizationId: string): Promise<Lead[]> {
    return this.leadRepository.find({
      where: { is_public: true, organization_id: organizationId },
      order: { created_at: 'DESC' },
    });
  }
}
