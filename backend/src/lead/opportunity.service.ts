import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { Opportunity, OpportunityQuoteItem, OpportunityStageLog } from './opportunity.entity';
import { InviteTask } from './invite-task.entity';
import { Lead } from './lead.entity';
import { User } from '../user/user.entity';
import { OpportunityStage, OpportunityStatus, InviteTaskStatus, LeadStatus, UserRole, CaseStatus } from '../types';
import { Case } from '../case/case.entity';
import { TalkSOPService } from './talk-sop.service';

@Injectable()
export class OpportunityService {
  constructor(
    @InjectRepository(Opportunity)
    private opportunityRepository: Repository<Opportunity>,
    @InjectRepository(OpportunityQuoteItem)
    private quoteItemRepository: Repository<OpportunityQuoteItem>,
    @InjectRepository(OpportunityStageLog)
    private stageLogRepository: Repository<OpportunityStageLog>,
    @InjectRepository(InviteTask)
    private inviteTaskRepository: Repository<InviteTask>,
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    private dataSource: DataSource,
    private talkSOPService: TalkSOPService,
  ) {}

  // 获取今日到所列表
  async getTodayArrivals(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const queryBuilder = this.inviteTaskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.lead', 'lead')
      .leftJoinAndSelect('lead.assign_sales', 'assign_sales')
      .where('task.status = :status', { status: InviteTaskStatus.ARRIVED })
      .andWhere('task.updated_at >= :today', { today })
      .andWhere('task.updated_at < :tomorrow', { tomorrow })
      .orderBy('task.updated_at', 'DESC');

    // 谈案岗只能看到分配给自己的商机
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user && user.role === UserRole.SALES) {
      queryBuilder.andWhere('lead.assign_sales_id = :userId', { userId });
    }

    return queryBuilder.getMany();
  }

  // 获取待跟进商机列表
  async getPendingOpportunities(userId: string) {
    const queryBuilder = this.opportunityRepository
      .createQueryBuilder('opp')
      .leftJoinAndSelect('opp.lead', 'lead')
      .leftJoinAndSelect('lead.assign_sales', 'assign_sales')
      .andWhere('opp.stage NOT IN (:...stages)', {
        stages: [OpportunityStage.SIGNED, OpportunityStage.LOST],
      })
      .andWhere('opp.status = :status', { status: OpportunityStatus.ACTIVE })
      .orderBy('opp.updated_at', 'DESC');

    // 谈案岗只能看到分配给自己的商机，管理员可查看全部
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user && user.role === UserRole.SALES) {
      queryBuilder.andWhere('opp.negotiator_id = :userId', { userId });
    }

    return queryBuilder.getMany();
  }

  // 获取已签约列表
  async getSignedOpportunities(userId: string) {
    const queryBuilder = this.opportunityRepository
      .createQueryBuilder('opp')
      .leftJoinAndSelect('opp.lead', 'lead')
      .leftJoinAndSelect('lead.assign_sales', 'assign_sales')
      .andWhere('opp.stage = :stage', { stage: OpportunityStage.SIGNED })
      .orderBy('opp.updated_at', 'DESC');

    // 谈案岗只能看到分配给自己的商机，管理员可查看全部
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user && user.role === UserRole.SALES) {
      queryBuilder.andWhere('opp.negotiator_id = :userId', { userId });
    }

    return queryBuilder.getMany();
  }

  // 获取已流失列表
  async getLostOpportunities(userId: string) {
    const queryBuilder = this.opportunityRepository
      .createQueryBuilder('opp')
      .leftJoinAndSelect('opp.lead', 'lead')
      .leftJoinAndSelect('lead.assign_sales', 'assign_sales')
      .andWhere('opp.stage = :stage', { stage: OpportunityStage.LOST })
      .orderBy('opp.updated_at', 'DESC');

    // 谈案岗只能看到分配给自己的商机，管理员可查看全部
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user && user.role === UserRole.SALES) {
      queryBuilder.andWhere('opp.negotiator_id = :userId', { userId });
    }

    return queryBuilder.getMany();
  }

  // 获取商机详情
  async getOpportunityDetail(opportunityId: string, userId: string) {
    const opportunity = await this.opportunityRepository
      .createQueryBuilder('opp')
      .leftJoinAndSelect('opp.lead', 'lead')
      .leftJoinAndSelect('lead.assign_sales', 'assign_sales')
      .leftJoinAndSelect('opp.quote_items', 'quote_items')
      .leftJoinAndSelect('opp.stage_logs', 'stage_logs')
      .leftJoinAndSelect('stage_logs.operator', 'operator')
      .where('opp.id = :opportunityId', { opportunityId })
      .getOne();

    if (!opportunity) {
      throw new NotFoundException('商机不存在');
    }

    // 权限检查：谈案岗只能查看自己的商机
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user && user.role === UserRole.SALES && opportunity.negotiator_id !== userId) {
      throw new ForbiddenException('无权查看此商机');
    }

    return opportunity;
  }

  // 创建商机
  async createOpportunity(
    userId: string,
    leadId: string,
    requirementNote?: string,
    planNote?: string,
  ) {
    const lead = await this.leadRepository.findOne({ where: { id: leadId } });
    if (!lead) {
      throw new NotFoundException('线索不存在');
    }

    // 检查是否已存在商机
    const existingOpp = await this.opportunityRepository.findOne({
      where: { lead_id: leadId },
    });
    if (existingOpp) {
      throw new BadRequestException('该线索已创建商机');
    }

    // 创建商机
    const opportunity = this.opportunityRepository.create({
      lead_id: leadId,
      negotiator_id: userId,
      stage: OpportunityStage.FIRST_CONTACT,
      status: OpportunityStatus.ACTIVE,
      requirement_note: requirementNote,
      plan_note: planNote,
    });

    const savedOpp = await this.opportunityRepository.save(opportunity);

    // 创建阶段变更日志
    const stageLog = this.stageLogRepository.create({
      opportunity_id: savedOpp.id,
      from_stage: null,
      to_stage: OpportunityStage.FIRST_CONTACT,
      operator_id: userId,
      remark: '创建商机',
    });
    await this.stageLogRepository.save(stageLog);

    // 更新线索状态为谈案中
    lead.status = LeadStatus.NEGOTIATING;
    await this.leadRepository.save(lead);

    return this.getOpportunityDetail(savedOpp.id, userId);
  }

  // 更新商机阶段
  async updateStage(
    opportunityId: string,
    userId: string,
    newStage: OpportunityStage,
    remark?: string,
  ) {
    const opportunity = await this.opportunityRepository.findOne({
      where: { id: opportunityId },
    });

    if (!opportunity) {
      throw new NotFoundException('商机不存在');
    }

    // 权限检查
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user && user.role === UserRole.SALES && opportunity.negotiator_id !== userId) {
      throw new ForbiddenException('无权操作此商机');
    }

    const oldStage = opportunity.stage;

    // 更新阶段
    opportunity.stage = newStage;
    await this.opportunityRepository.save(opportunity);

    // 记录阶段变更日志
    const stageLog = this.stageLogRepository.create({
      opportunity_id: opportunityId,
      from_stage: oldStage,
      to_stage: newStage,
      operator_id: userId,
      remark,
    });
    await this.stageLogRepository.save(stageLog);

    return this.getOpportunityDetail(opportunityId, userId);
  }

  // 更新商机信息
  async updateOpportunityInfo(
    opportunityId: string,
    userId: string,
    requirementNote?: string,
    planNote?: string,
  ) {
    const opportunity = await this.opportunityRepository.findOne({
      where: { id: opportunityId },
    });

    if (!opportunity) {
      throw new NotFoundException('商机不存在');
    }

    // 权限检查
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user && user.role === UserRole.SALES && opportunity.negotiator_id !== userId) {
      throw new ForbiddenException('无权操作此商机');
    }

    if (requirementNote !== undefined) {
      opportunity.requirement_note = requirementNote;
    }
    if (planNote !== undefined) {
      opportunity.plan_note = planNote;
    }

    await this.opportunityRepository.save(opportunity);

    return this.getOpportunityDetail(opportunityId, userId);
  }

  // 添加报价项
  async addQuoteItem(
    opportunityId: string,
    userId: string,
    itemName: string,
    amount: number,
    itemDescription?: string,
    quantity: number = 1,
    remark?: string,
  ) {
    const opportunity = await this.opportunityRepository.findOne({
      where: { id: opportunityId },
    });

    if (!opportunity) {
      throw new NotFoundException('商机不存在');
    }

    // 权限检查
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user && user.role === UserRole.SALES && opportunity.negotiator_id !== userId) {
      throw new ForbiddenException('无权操作此商机');
    }

    const quoteItem = this.quoteItemRepository.create({
      opportunity_id: opportunityId,
      item_name: itemName,
      item_description: itemDescription,
      amount,
      quantity,
      remark,
    });

    await this.quoteItemRepository.save(quoteItem);

    // 更新报价总额
    await this.updateQuoteTotal(opportunityId);

    return this.getOpportunityDetail(opportunityId, userId);
  }

  // 更新报价项
  async updateQuoteItem(
    opportunityId: string,
    quoteItemId: string,
    userId: string,
    itemName?: string,
    amount?: number,
    itemDescription?: string,
    quantity?: number,
    remark?: string,
  ) {
    const quoteItem = await this.quoteItemRepository.findOne({
      where: { id: quoteItemId, opportunity_id: opportunityId },
    });

    if (!quoteItem) {
      throw new NotFoundException('报价项不存在');
    }

    // 权限检查
    const opportunity = await this.opportunityRepository.findOne({
      where: { id: opportunityId },
    });
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user && user.role === UserRole.SALES && opportunity.negotiator_id !== userId) {
      throw new ForbiddenException('无权操作此商机');
    }

    if (itemName !== undefined) quoteItem.item_name = itemName;
    if (itemDescription !== undefined) quoteItem.item_description = itemDescription;
    if (amount !== undefined) quoteItem.amount = amount;
    if (quantity !== undefined) quoteItem.quantity = quantity;
    if (remark !== undefined) quoteItem.remark = remark;

    await this.quoteItemRepository.save(quoteItem);

    // 更新报价总额
    await this.updateQuoteTotal(opportunityId);

    return this.getOpportunityDetail(opportunityId, userId);
  }

  // 删除报价项
  async deleteQuoteItem(opportunityId: string, quoteItemId: string, userId: string) {
    const quoteItem = await this.quoteItemRepository.findOne({
      where: { id: quoteItemId, opportunity_id: opportunityId },
    });

    if (!quoteItem) {
      throw new NotFoundException('报价项不存在');
    }

    // 权限检查
    const opportunity = await this.opportunityRepository.findOne({
      where: { id: opportunityId },
    });
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user && user.role === UserRole.SALES && opportunity.negotiator_id !== userId) {
      throw new ForbiddenException('无权操作此商机');
    }

    await this.quoteItemRepository.remove(quoteItem);

    // 更新报价总额
    await this.updateQuoteTotal(opportunityId);

    return this.getOpportunityDetail(opportunityId, userId);
  }

  // 更新报价总额
  private async updateQuoteTotal(opportunityId: string) {
    const items = await this.quoteItemRepository.find({
      where: { opportunity_id: opportunityId },
    });

    const total = items.reduce((sum, item) => sum + Number(item.amount) * item.quantity, 0);

    await this.opportunityRepository.update(opportunityId, {
      quote_amount: total,
    });
  }

  // 签约转化
  async convertToCase(
    opportunityId: string,
    userId: string,
    caseData: {
      case_type?: string;
      case_description?: string;
      service_fee?: number;
    },
  ) {
    const opportunity = await this.opportunityRepository.findOne({
      where: { id: opportunityId },
    });
    if (!opportunity) {
      throw new NotFoundException('商机不存在');
    }

    const lead = await this.leadRepository.findOne({ where: { id: opportunity.lead_id } });

    if (!lead) {
      throw new NotFoundException('线索不存在');
    }

    // 权限检查
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user && user.role === UserRole.SALES && opportunity.negotiator_id !== userId) {
      throw new ForbiddenException('无权操作此商机');
    }

    // 检查是否已签约
    if (opportunity.stage === OpportunityStage.SIGNED) {
      throw new BadRequestException('该商机已签约');
    }

    // 检查强制节点是否全部完成
    const sopCheck = await this.talkSOPService.checkRequiredNodesCompleted(opportunityId);
    if (!sopCheck.is_valid) {
      const incompleteNodeNames = sopCheck.incomplete_nodes.map(n => n.node_name).join('、');
      throw new BadRequestException(`以下强制节点未完成：${incompleteNodeNames}，请先完成后再签约`);
    }

    // 创建案件
    const caseEntity = this.caseRepository.create({
      lead_id: opportunity.lead_id,
      client_id: 'pending',
      assignee_lawyer_id: userId,
      case_type: (caseData.case_type || lead.case_type) as any,
      description: caseData.case_description || lead.case_description,
      service_fee: caseData.service_fee || opportunity.actual_amount || opportunity.quote_amount,
      status: CaseStatus.PENDING_ASSIGN,
      organization_id: lead.organization_id,
      client_name: lead.contact_name,
      client_phone: lead.phone,
    });

    await this.caseRepository.save(caseEntity);

    // 更新商机状态为已签约
    opportunity.stage = OpportunityStage.SIGNED;
    opportunity.actual_amount = caseData.service_fee || opportunity.quote_amount;
    opportunity.status = OpportunityStatus.COMPLETED;
    await this.opportunityRepository.save(opportunity);

    // 记录阶段变更日志
    const stageLog = this.stageLogRepository.create({
      opportunity_id: opportunityId,
      from_stage: opportunity.stage,
      to_stage: OpportunityStage.SIGNED,
      operator_id: userId,
      remark: '签约转化',
    });
    await this.stageLogRepository.save(stageLog);

    // 更新线索状态
    await this.leadRepository.update(opportunity.lead_id, {
      status: LeadStatus.PENDING_SIGN,
    });

    return {
      opportunity: await this.getOpportunityDetail(opportunityId, userId),
      case: caseEntity,
    };
  }

  // 标记为流失
  async markAsLost(
    opportunityId: string,
    userId: string,
    remark?: string,
  ) {
    const opportunity = await this.opportunityRepository.findOne({
      where: { id: opportunityId },
    });

    if (!opportunity) {
      throw new NotFoundException('商机不存在');
    }

    // 权限检查
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user && user.role === UserRole.SALES && opportunity.negotiator_id !== userId) {
      throw new ForbiddenException('无权操作此商机');
    }

    const oldStage = opportunity.stage;

    // 更新商机状态为已流失
    opportunity.stage = OpportunityStage.LOST;
    opportunity.status = OpportunityStatus.COMPLETED;
    await this.opportunityRepository.save(opportunity);

    // 记录阶段变更日志
    const stageLog = this.stageLogRepository.create({
      opportunity_id: opportunityId,
      from_stage: oldStage,
      to_stage: OpportunityStage.LOST,
      operator_id: userId,
      remark,
    });
    await this.stageLogRepository.save(stageLog);

    // 更新线索状态
    await this.leadRepository.update(opportunity.lead_id, {
      status: LeadStatus.LOST,
    });

    return this.getOpportunityDetail(opportunityId, userId);
  }

  // 获取商机列表
  async findAll(orgId: string, filters?: {
    stage?: OpportunityStage;
    status?: OpportunityStatus;
    negotiator_id?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Opportunity[]; total: number }> {
    const queryBuilder = this.opportunityRepository
      .createQueryBuilder('opp')
      .leftJoinAndSelect('opp.lead', 'lead')
      .leftJoinAndSelect('opp.negotiator', 'negotiator')
      .where('lead.organization_id = :orgId', { orgId });

    if (filters?.stage) {
      queryBuilder.andWhere('opp.stage = :stage', { stage: filters.stage });
    }
    if (filters?.status) {
      queryBuilder.andWhere('opp.status = :status', { status: filters.status });
    }
    if (filters?.negotiator_id) {
      queryBuilder.andWhere('opp.negotiator_id = :negotiator_id', { negotiator_id: filters.negotiator_id });
    }

    const total = await queryBuilder.getCount();
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    queryBuilder.skip((page - 1) * limit).take(limit);
    queryBuilder.orderBy('opp.created_at', 'DESC');

    const data = await queryBuilder.getMany();
    return { data, total };
  }
}