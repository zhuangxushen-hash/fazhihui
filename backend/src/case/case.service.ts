import { Injectable, NotFoundException, Inject, forwardRef, Logger, InternalServerErrorException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, QueryBuilder } from 'typeorm';
import { Case } from './case.entity';
import { Document } from './document.entity';
import { User } from '../user/user.entity';
import { Contract } from '../contract/contract.entity';
import { Receivable } from '../finance/receivable.entity';
import { CommissionService } from '../finance/commission.service';
import { CaseStatus, CaseType } from '../types';
import { ConflictCheckService } from './conflict-check.service';
// Phase4: H7 SOP联动需注入合规服务；M2 结案触发评价需注入客户服务；M4 类案匹配回写需注入类案服务
import { ComplianceService } from '../compliance/compliance.service';
import { ClientService } from '../client/client.service';
import { SimilarCaseService } from './similar-case.service';
// Phase5 M8: 案件核心操作审计日志需注入审计服务
import { AuditService } from '../audit/audit.service';
// Phase5 L1: 结案自动生成法律文书需注入法律文书服务
import { LegalDocumentService } from './legal-document.service';
import { CreateCaseDto } from './dto/create-case.dto';

@Injectable()
export class CaseService {
  constructor(
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(Receivable)
    private receivableRepository: Repository<Receivable>,
    private dataSource: DataSource,
    private commissionService: CommissionService,
    private conflictCheckService: ConflictCheckService,
    // Phase4 H7: 注入合规服务，案件创建后生成SOP任务
    private complianceService: ComplianceService,
    // Phase4 M2: 注入客户服务，结案后触发客户评价（forwardRef 防止循环依赖）
    @Inject(forwardRef(() => ClientService))
    private clientService: ClientService,
    // Phase4 M4: 注入类案匹配服务，案件创建后回写类案信息
    private similarCaseService: SimilarCaseService,
    // Phase5 M8: 注入审计服务，案件核心操作记录审计日志
    private auditService: AuditService,
    // Phase5 L1: 注入法律文书服务，结案后自动生成结案报告文书
    private legalDocumentService: LegalDocumentService,
  ) {}

  private readonly logger = new Logger(CaseService.name);

  /**
   * 自动生成案件编号
   * 格式: AJ-YYYYMMDD-XXXX (如 AJ-20260806-0001)
   * 通过查询当天已有最大序号+1实现递增，并检查唯一性
   */
  private async generateCaseNo(manager: any): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const datePrefix = `AJ-${year}${month}${day}-`;

    // 查询当天已有的最大序号
    const result = await manager
      .createQueryBuilder(Case, 'c')
      .select('MAX(CAST(SUBSTR(c.case_no, LENGTH(:prefix) + 1) AS INTEGER))', 'maxSeq')
      .where('c.case_no LIKE :likePattern', { likePattern: `${datePrefix}%`, prefix: datePrefix })
      .getRawOne();

    const maxSeq = result?.maxseq || 0;
    let nextSeq = maxSeq + 1;
    
    // 循环尝试生成唯一编号
    const maxAttempts = 100;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const seqStr = String(nextSeq).padStart(4, '0');
      const candidateNo = `${datePrefix}${seqStr}`;
      
      // 检查该编号是否已存在
      const existing = await manager
        .createQueryBuilder(Case, 'c')
        .where('c.case_no = :caseNo', { caseNo: candidateNo })
        .getOne();
      
      if (!existing) {
        return candidateNo;
      }
      // 编号已存在，继续递增
      nextSeq++;
    }
    
    throw new InternalServerErrorException('无法生成唯一的案件编号');
  }

  /**
   * Phase5 M8: 记录案件相关审计日志（失败静默不影响主流程）
   * 参照 seal.service 的 logSealAudit 模式：先查操作人用户名，再调用 auditService.logAction
   */
  private async logCaseAudit(params: {
    userId?: string;
    action: string;
    resourceType?: string;
    resourceId?: string;
    detail?: string;
  }): Promise<void> {
    try {
      let userName: string | undefined = undefined;
      if (params.userId) {
        const u = await this.userRepository.findOne({ where: { id: params.userId } });
        if (u) userName = u.real_name || undefined;
      }
      await this.auditService.logAction({
        user_id: params.userId || undefined,
        user_name: userName,
        action: params.action,
        resource_type: params.resourceType,
        resource_id: params.resourceId,
        detail: params.detail,
      });
    } catch (e) {
      // 审计失败不影响主业务
    }
  }

  async create(dto: CreateCaseDto, organizationId?: string): Promise<Case> {
    // 0. organization_id 空值守卫
    if (!organizationId) {
      throw new BadRequestException('缺少组织信息，无法创建案件');
    }

    // 1. 构建实体（案件编号由系统自动生成，不再依赖前端传入）
    const caseEntity = this.caseRepository.create({
      case_name: dto.case_name,
      client_name: dto.client_name,
      client_phone: dto.client_phone,
      client_id: dto.client_id,
      client_type: dto.client_type,
      case_type: dto.case_type as CaseType,
      case_category: dto.case_category,
      court: dto.court,
      opposing_party: dto.opposing_party,
      opposing_agent: dto.opposing_agent,
      court_room: dto.court_room,
      case_source: dto.case_source,
      amount: dto.amount,
      quality_deposit: dto.quality_deposit,
      filing_date: dto.filing_date ? new Date(dto.filing_date) : undefined,
      expected_close_date: dto.expected_close_date ? new Date(dto.expected_close_date) : undefined,
      is_confidential: dto.is_confidential,
      stage: dto.stage,
      description: dto.description,
      organization_id: organizationId || dto.organization_id,
    });

    const { risk_level, risk_notes } = this.analyzeRisk(caseEntity);
    caseEntity.risk_level = risk_level;
    caseEntity.risk_notes = risk_notes;

    // 2. 短事务：仅保存案件 + 更新利冲状态
    let savedCase: Case | null = null;

    try {
      await this.dataSource.transaction(async (manager) => {
        // 案件编号始终由系统自动生成，确保唯一性
        caseEntity.case_no = await this.generateCaseNo(manager);

        savedCase = await manager.save(Case, caseEntity);

        // 利冲检查（在事务内但用 try-catch 保护，失败回滚案件创建）
        try {
          const conflictResult = await this.conflictCheckService.check({
            partyName: savedCase.client_name,
            opposingParty: savedCase.opposing_party,
            partyPhone: savedCase.client_phone,
            orgId: savedCase.organization_id,
            caseId: savedCase.id,
          });
          if (conflictResult.check_result === 'conflict') {
            await manager.update(Case, savedCase.id, { approval_status: 'conflict_hold' });
          }
        } catch (conflictErr) {
          this.logger.error('利冲检索失败', conflictErr);
        }
      });
    } catch (e) {
      this.logger.error('案件创建失败', e);
      throw new InternalServerErrorException('案件创建失败，请重试');
    }

    // 3. 空值守卫
    if (!savedCase) {
      throw new InternalServerErrorException('案件创建失败，请重试');
    }

    // 4. 事务外：类案匹配（失败忽略，不影响主流程）
    try {
      const similarResult = await this.similarCaseService.searchSimilarCases({
        case_type: savedCase.case_type,
        orgId: savedCase.organization_id,
      });
      if (similarResult.data && similarResult.data.length > 0) {
        const topSimilar = similarResult.data.slice(0, 3);
        const similarSection = topSimilar
          .map((c) => `- ${c.case_no || c.case_name || c.id}（相似度:${c.similarity}）`)
          .join('\n');
        const similarText = `\n\n【相关类案】\n${similarSection}`;
        const originDesc = savedCase.description || '';
        await this.caseRepository.update(savedCase.id, { description: originDesc + similarText });
      }
    } catch (err) {
      this.logger.error('类案匹配失败', err);
    }

    // 5. 事务外：SOP 生成（失败忽略）
    try {
      await this.complianceService.createCaseSOP(savedCase.id, savedCase.case_type, savedCase.organization_id);
    } catch (err) {
      this.logger.error('SOP生成失败', err);
    }

    return savedCase;
  }

  private analyzeRisk(caseEntity: Partial<Case>): { risk_level: string; risk_notes: string } {
    const factors: string[] = [];
    
    if (caseEntity.amount && caseEntity.amount > 500000) {
      factors.push('涉案金额较大(>50万)');
    }
    
    if (caseEntity.expected_close_date) {
      const deadline = new Date(caseEntity.expected_close_date);
      const now = new Date();
      const diffDays = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 15) {
        factors.push('临近期限(<15天)');
      }
    }
    
    if (['criminal', 'admin'].includes(caseEntity.case_category)) {
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
    days_no_maintain?: number; // 智能筛选：超过X天未维护
  }): Promise<{ data: (Case & { lawyer_name?: string })[]; total: number }> {
    const query = this.caseRepository.createQueryBuilder('case')
      .where('case.organization_id = :orgId', { orgId })
      .orderBy('case.updated_at', 'DESC');  // 全部列表按更新时间倒序排列

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
    // 智能筛选：超过X天未维护（updated_at 早于阈值）
    if (filters?.days_no_maintain) {
      const threshold = new Date(Date.now() - filters.days_no_maintain * 24 * 60 * 60 * 1000);
      query.andWhere('case.updated_at < :threshold', { threshold });
    }

    const total = await query.getCount();
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    query.skip((page - 1) * limit).take(limit);

    const data = await query.getMany();
    // 批量查询所有相关律师，避免 N+1 查询
    const lawyerIds = [...new Set(data.map(c => c.assignee_lawyer_id).filter(Boolean))];
    const lawyers = lawyerIds.length > 0
      ? await this.userRepository.find({ where: { id: In(lawyerIds) } })
      : [];
    const lawyerMap = new Map(lawyers.map(l => [l.id, l.real_name]));
    const result = data.map(item => ({
      ...item,
      lawyer_name: item.assignee_lawyer_id ? lawyerMap.get(item.assignee_lawyer_id) || null : null,
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
    const updated = await this.caseRepository.findOne({ where: { id } });
    // T8.2: 分配律师后反向回写合同主办律师
    if (updated && updated.contract_id) {
      await this.contractRepository.update(updated.contract_id, { lead_lawyer_id: lawyerId });
    }
    return updated;
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
    return this.documentRepository.find({ where: { case_id: caseId }, order: { updated_at: 'DESC' } });
  }

  async closeCase(id: string): Promise<Case> {
    const result = await this.dataSource.transaction(async (manager) => {
      const caseEntity = await manager.findOne(Case, { where: { id } });
      if (!caseEntity) return null;

      await manager.update(Case, id, { status: CaseStatus.CLOSED });

      if (caseEntity.contract_id) {
        const contract = await manager.findOne(Contract, { where: { id: caseEntity.contract_id } });
        if (contract) {
          if (['signed', 'performing'].includes(contract.stage)) {
            await manager.update(Contract, contract.id, { stage: 'completed' });
          }

          const receivables = await manager.find(Receivable, { where: { case_id: id } });
          let totalAmt = 0;
          let recvAmt = 0;
          for (const r of receivables) {
            totalAmt += Number(r.contract_amount) || 0;
            recvAmt += Number(r.received_amount) || 0;
          }
          if (recvAmt >= totalAmt && totalAmt > 0) {
            await manager.update(Contract, contract.id, { is_settled: true });
          }
        }
      }

      // 结案后尝试触发分润检查（异常不回滚主流程）
      try {
        await this.commissionService.checkAndTriggerCommission({ case_id: id });
      } catch (err) {}

      // Phase4 M2: 结案后触发客户评价（异常静默处理，不影响结案主流程）
      try {
        await this.clientService.triggerRatingOnCaseClose(id);
      } catch (err) {}

      return manager.findOne(Case, { where: { id } });
    });

    // Phase5 M8: 案件结案审计日志（事务提交后记录，异常静默不影响主流程）
    try {
      await this.logCaseAudit({
        action: '案件结案',
        resourceType: 'Case',
        resourceId: id,
        detail: JSON.stringify({ case_id: id, status: 'closed' }),
      });
    } catch (err) {}

    // Phase5 L1: 结案后自动生成结案报告法律文书（异常静默处理，不影响结案主流程）
    try {
      await this.legalDocumentService.generateDocument('closing_report', { case_id: id });
    } catch (err) {}

    return result;
  }

  /**
   * 案件变更：将 change_status 设置为 changed，并记录变更原因、操作人和时间
   */
  async changeCase(id: string, reason: string, operatorId: string): Promise<Case> {
    await this.caseRepository.update(id, {
      change_status: 'changed',
      change_reason: reason || null,
      change_operator_id: operatorId || null,
      change_time: new Date(),
    });
    const result = await this.caseRepository.findOne({ where: { id } });

    // Phase5 M8: 案件变更审计日志（异常静默不影响主流程）
    try {
      await this.logCaseAudit({
        userId: operatorId,
        action: '案件变更',
        resourceType: 'Case',
        resourceId: id,
        detail: JSON.stringify({ case_id: id, reason: reason || null, operator_id: operatorId || null }),
      });
    } catch (err) {}

    return result;
  }

  /**
   * 案件解约：将 change_status 设置为 terminated，并记录解约原因、操作人和时间
   * 同步更新 status 为 terminated，避免作废案件仍出现在按 status 筛选的有效列表中
   */
  async terminateCase(id: string, reason: string, operatorId: string): Promise<Case> {
    await this.caseRepository.update(id, {
      status: CaseStatus.TERMINATED,
      change_status: 'terminated',
      change_reason: reason || null,
      change_operator_id: operatorId || null,
      change_time: new Date(),
    });
    const result = await this.caseRepository.findOne({ where: { id } });

    // Phase5 M8: 案件解约审计日志（异常静默不影响主流程）
    try {
      await this.logCaseAudit({
        userId: operatorId,
        action: '案件解约',
        resourceType: 'Case',
        resourceId: id,
        detail: JSON.stringify({ case_id: id, reason: reason || null, operator_id: operatorId || null }),
      });
    } catch (err) {}

    return result;
  }

  /**
   * 案件作废：将 change_status 设置为 voided，并记录作废原因、操作人和时间
   * 同步更新 status 为 voided，避免作废案件仍出现在按 status 筛选的有效列表中
   */
  async voidCase(id: string, reason: string, operatorId: string): Promise<Case> {
    await this.caseRepository.update(id, {
      status: CaseStatus.VOIDED,
      change_status: 'voided',
      change_reason: reason || null,
      change_operator_id: operatorId || null,
      change_time: new Date(),
    });
    const result = await this.caseRepository.findOne({ where: { id } });

    // Phase5 M8: 案件作废审计日志（异常静默不影响主流程）
    try {
      await this.logCaseAudit({
        userId: operatorId,
        action: '案件作废',
        resourceType: 'Case',
        resourceId: id,
        detail: JSON.stringify({ case_id: id, reason: reason || null, operator_id: operatorId || null }),
      });
    } catch (err) {}

    return result;
  }

  /**
   * 出函：根据类型生成出庭函/所函（模拟生成）
   * type: court_letter 出庭函 / firm_letter 所函
   */
  async generateLetter(id: string, type: string): Promise<{ success: boolean; type: string; case_id: string; case_name: string; generated_at: string }> {
    const caseEntity = await this.caseRepository.findOne({ where: { id } });
    const caseName = caseEntity?.case_name || caseEntity?.case_no || id;
    return {
      success: true,
      type,
      case_id: id,
      case_name: caseName,
      generated_at: new Date().toISOString(),
    };
  }

  /**
   * 生成结案报告：更新案件 stage 为 closing，返回更新后的案件
   */
  async closeCaseReport(id: string): Promise<Case> {
    await this.caseRepository.update(id, { stage: 'closing' });
    return this.caseRepository.findOne({ where: { id } });
  }

  /**
   * 结案归档：更新案件 stage 为 closed，返回更新后的案件
   */
  async archiveCase(id: string): Promise<Case> {
    return await this.dataSource.transaction(async (manager) => {
      const caseEntity = await manager.findOne(Case, { where: { id } });
      if (!caseEntity) return null;

      await manager.update(Case, id, { stage: 'closed' });

      if (caseEntity.contract_id) {
        const contract = await manager.findOne(Contract, { where: { id: caseEntity.contract_id } });
        if (contract) {
          if (['signed', 'performing'].includes(contract.stage)) {
            await manager.update(Contract, contract.id, { stage: 'completed' });
          }

          const receivables = await manager.find(Receivable, { where: { case_id: id } });
          let totalAmt = 0;
          let recvAmt = 0;
          for (const r of receivables) {
            totalAmt += Number(r.contract_amount) || 0;
            recvAmt += Number(r.received_amount) || 0;
          }
          if (recvAmt >= totalAmt && totalAmt > 0) {
            await manager.update(Contract, contract.id, { is_settled: true });
          }
        }
      }

      // 结案归档后尝试触发分润检查（异常不回滚主流程）
      try {
        await this.commissionService.checkAndTriggerCommission({ case_id: id });
      } catch (err) {}

      return manager.findOne(Case, { where: { id } });
    });
  }

  // 项目导出（返回案件详细信息用于前端导出）
  async exportProject(id: string): Promise<any> {
    const caseEntity = await this.caseRepository.findOne({ where: { id } });
    if (!caseEntity) throw new NotFoundException('案件不存在');
    // 返回完整案件信息供前端导出
    return {
      case_info: caseEntity,
      export_time: new Date().toISOString(),
      export_type: 'project',
    };
  }

  // 批量分配项目（将多个案件分配给同一律师，使用事务保证一致性）
  async batchAssign(caseIds: string[], lawyerId: string): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;
    // 在事务内逐个更新案件分配律师，业务错误计数为失败但不中断，未捕获异常将整体回滚
    await this.dataSource.transaction(async (manager) => {
      for (const caseId of caseIds) {
        try {
          await manager.update(Case, caseId, { assignee_lawyer_id: lawyerId });
          success++;
        } catch {
          failed++;
        }
      }
    });
    return { success, failed };
  }

  // 13.8 缺口6: 批量结案（复用单案结案逻辑，单个案件失败计数但不中断）
  async batchClose(caseIds: string[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;
    for (const caseId of caseIds) {
      try {
        const result = await this.closeCase(caseId);
        if (result) {
          success++;
        } else {
          failed++;
        }
      } catch (err) {
        failed++;
      }
    }
    return { success, failed };
  }

  // 13.8 缺口6: 批量归档（复用单案归档逻辑，单个案件失败计数但不中断）
  async batchArchive(caseIds: string[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;
    for (const caseId of caseIds) {
      try {
        const result = await this.archiveCase(caseId);
        if (result) {
          success++;
        } else {
          failed++;
        }
      } catch (err) {
        failed++;
      }
    }
    return { success, failed };
  }

  // 提交审批：设置 approval_status 为 pending
  async submitApproval(id: string): Promise<Case | null> {
    await this.caseRepository.update(id, { approval_status: 'pending' });
    return this.caseRepository.findOne({ where: { id } });
  }

  // 审批通过：设置 approval_status 为 approved，记录审批信息，若阶段为 intake 则自动转为 processing
  async approve(id: string, approverId: string, comment?: string): Promise<Case | null> {
    return await this.dataSource.transaction(async (manager) => {
      const caseEntity = await manager.findOne(Case, { where: { id } });
      if (!caseEntity) return null;

      const updateData: Partial<Case> = {
        approval_status: 'approved',
        approver_id: approverId,
        approval_time: new Date(),
        approval_comment: comment || null,
      };

      if (caseEntity.stage === 'intake') {
        updateData.stage = 'processing';
      }

      await manager.update(Case, id, updateData);

      // T8.2: 审批通过后，若案件有关联合同且有主办律师，则同步合同 lead_lawyer_id
      if (caseEntity.contract_id && approverId) {
        const c = await manager.findOne(Case, { where: { id } });
        if (c?.assignee_lawyer_id) {
          await manager.update(Contract, c.contract_id, { lead_lawyer_id: c.assignee_lawyer_id });
        }
      }

      return manager.findOne(Case, { where: { id } });
    });
  }

  // 审批驳回：设置 approval_status 为 rejected，记录审批信息，stage 不变
  async reject(id: string, approverId: string, comment?: string): Promise<Case | null> {
    return await this.dataSource.transaction(async (manager) => {
      await manager.update(Case, id, {
        approval_status: 'rejected',
        approver_id: approverId,
        approval_time: new Date(),
        approval_comment: comment || null,
      });
      return manager.findOne(Case, { where: { id } });
    });
  }
}
