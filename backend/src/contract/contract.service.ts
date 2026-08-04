import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager, In } from 'typeorm';
import { Contract } from './contract.entity';
import { ContractStage } from './contract-stage.entity';
import { SealService } from '../seal/seal.service';
import { Seal } from '../seal/seal.entity';
import { SealApplication } from '../seal/seal-application.entity';
import { Case } from '../case/case.entity';
// Phase5 M8: 合同核心操作审计日志需注入审计服务与用户实体
import { AuditService } from '../audit/audit.service';
import { User } from '../user/user.entity';
// Phase5 L2: 合同审批通过后自动生成委托合同需注入法律文书服务
import { LegalDocumentService } from '../case/legal-document.service';

// 合同类型常量
export const ContractType = {
  ENTRUST: 'entrust',     // 委托
  CONSULTANT: 'consultant', // 顾问
  OTHER: 'other',         // 其他
} as const;

// 合同阶段常量
export const ContractStageEnum = {
  DRAFTING: 'drafting',       // 起草
  REVIEWING: 'reviewing',     // 审查
  SIGNED: 'signed',           // 已签
  PERFORMING: 'performing',   // 履行
  COMPLETED: 'completed',     // 完成
  TERMINATED: 'terminated',   // 解约
  VOIDED: 'voided',           // 作废
} as const;

// 合同状态常量
export const ContractStatus = {
  ACTIVE: 'active',     // 有效
  ARCHIVED: 'archived', // 归档
} as const;

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(ContractStage)
    private contractStageRepository: Repository<ContractStage>,
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    // Phase5 M8: 注入用户仓储用于审计日志查询操作人用户名
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
    private sealService: SealService,
    // Phase5 M8: 注入审计服务用于合同核心操作记录审计日志
    private auditService: AuditService,
    // Phase5 L2: 注入法律文书服务用于合同审批通过后自动生成委托合同
    private legalDocumentService: LegalDocumentService,
  ) {}

  // 自动生成合同编号: HT-YYYYMMDD-随机6位
  private generateContractNo(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `HT-${y}${m}${d}-${rand}`;
  }

  // 创建合同
  async create(contractData: Partial<Contract>): Promise<Contract> {
    if (!contractData.contract_no) {
      contractData.contract_no = this.generateContractNo();
    }
    if (!contractData.stage) {
      contractData.stage = ContractStageEnum.DRAFTING;
    }
    if (!contractData.status) {
      contractData.status = ContractStatus.ACTIVE;
    }

    // Task13: 事务包裹合同创建与案件回写，保证数据一致性
    return this.dataSource.transaction(async (manager) => {
      const contract = manager.create(Contract, contractData);
      const saved = await manager.save(Contract, contract);

      // 记录初始阶段
      await this.recordStage({
        contract_id: saved.id,
        stage_name: saved.stage,
        stage_status: 'entered',
        start_date: saved.sign_date as any,
        remarks: '合同创建',
        organization_id: saved.organization_id,
      }, manager);

      // T8.1: 创建合同后回写关联案件
      if (saved.case_id) {
        const caseData: any = {};
        if (saved.amount) caseData.fee_amount = Number(saved.amount);
        if (saved.amount) caseData.service_fee = Number(saved.amount);
        if (saved.title) caseData.case_name = saved.title;
        if (saved.client_name) caseData.client_name = saved.client_name;
        if (saved.client_phone) caseData.client_phone = saved.client_phone;
        if (saved.lead_lawyer_id) caseData.assignee_lawyer_id = saved.lead_lawyer_id;
        // Task13: 回写 Case.contract_id，建立合同-案件双向关联
        caseData.contract_id = saved.id;
        if (Object.keys(caseData).length > 0) {
          await manager.update(Case, saved.case_id, caseData);
        }
      }

      return saved;
    });
  }

  // 记录合同阶段历史
  private async recordStage(data: {
    contract_id: string;
    stage_name: string;
    stage_status: string;
    start_date?: Date;
    end_date?: Date;
    remarks?: string;
    organization_id: string;
  }, manager?: EntityManager): Promise<ContractStage> {
    const stage = this.contractStageRepository.create({
      contract_id: data.contract_id,
      stage_name: data.stage_name,
      stage_status: data.stage_status,
      start_date: data.start_date || new Date(),
      end_date: data.end_date || null,
      remarks: data.remarks || null,
      organization_id: data.organization_id,
    });
    if (manager) {
      return manager.save(ContractStage, stage);
    }
    return this.contractStageRepository.save(stage);
  }

  /**
   * Phase5 M8: 记录合同相关审计日志（失败静默不影响主流程）
   * 参照 seal.service 的 logSealAudit / case.service 的 logCaseAudit 模式：
   * 先查操作人用户名，再调用 auditService.logAction
   */
  private async logContractAudit(params: {
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

  // 查询合同列表，支持12+查询条件（对齐金助理合同管理查询条件）
  async findAll(orgId: string, filters?: {
    type?: string;
    stage?: string;
    status?: string;
    keyword?: string;
    contract_type?: string;
    project_role?: string;
    lawyer_id?: string;
    electronic_seal_status?: string;
    paper_seal_status?: string;
    approval_status?: string;
    return_status?: string;
    seal_usage_status?: string;
    approval_time?: string;
    start_date?: string;
    end_date?: string;
    document_keyword?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Contract[]; total: number }> {
    const query = this.contractRepository.createQueryBuilder('contract')
      .where('contract.organization_id = :orgId', { orgId });

    if (filters?.type) {
      query.andWhere('contract.type = :type', { type: filters.type });
    }
    if (filters?.contract_type) {
      query.andWhere('contract.type = :ctype', { ctype: filters.contract_type });
    }
    if (filters?.stage) {
      query.andWhere('contract.stage = :stage', { stage: filters.stage });
    }
    if (filters?.status) {
      query.andWhere('contract.status = :status', { status: filters.status });
    }
    if (filters?.project_role) {
      query.andWhere('contract.project_role = :pr', { pr: filters.project_role });
    }
    if (filters?.lawyer_id) {
      query.andWhere('(contract.lead_lawyer_id = :lid OR contract.assistant_lawyer_ids LIKE :lidlike)', {
        lid: filters.lawyer_id,
        lidlike: `%${filters.lawyer_id}%`,
      });
    }
    if (filters?.electronic_seal_status) {
      query.andWhere('contract.electronic_seal_status = :ess', { ess: filters.electronic_seal_status });
    }
    if (filters?.paper_seal_status) {
      query.andWhere('contract.paper_seal_status = :pss', { pss: filters.paper_seal_status });
    }
    if (filters?.approval_status) {
      query.andWhere('contract.approval_status = :as', { as: filters.approval_status });
    }
    if (filters?.return_status) {
      query.andWhere('contract.return_status = :rs', { rs: filters.return_status });
    }
    if (filters?.seal_usage_status) {
      query.andWhere('contract.seal_usage_status = :sus', { sus: filters.seal_usage_status });
    }
    if (filters?.approval_time) {
      query.andWhere('DATE(contract.approval_time) = :at', { at: filters.approval_time });
    }
    if (filters?.start_date) {
      query.andWhere('contract.sign_date >= :sd', { sd: filters.start_date });
    }
    if (filters?.end_date) {
      query.andWhere('contract.sign_date <= :ed', { ed: filters.end_date });
    }
    if (filters?.keyword) {
      query.andWhere(
        '(contract.title LIKE :kw OR contract.contract_no LIKE :kw OR contract.client_name LIKE :kw)',
        { kw: `%${filters.keyword}%` },
      );
    }
    if (filters?.document_keyword) {
      const dkw = `%${filters.document_keyword}%`;
      query.andWhere(
        '(contract.contract_document_name LIKE :dkw OR contract.contract_document_no LIKE :dkw)',
        { dkw },
      );
    }

    query.orderBy('contract.created_at', 'DESC');
    const total = await query.getCount();
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    query.skip((page - 1) * limit).take(limit);

    const data = await query.getMany();
    return { data, total };
  }

  // 根据ID查询合同详情（含阶段历史）
  async findById(id: string): Promise<Contract & { stages: ContractStage[] }> {
    const contract = await this.contractRepository.findOne({ where: { id } });
    if (!contract) return null;
    const stages = await this.contractStageRepository.find({
      where: { contract_id: id },
      order: { created_at: 'ASC' },
    });
    return { ...contract, stages };
  }

  // 更新合同
  async update(id: string, contractData: Partial<Contract>): Promise<Contract> {
    // Task13: 事务包裹合同更新与案件回写，保证数据一致性
    return this.dataSource.transaction(async (manager) => {
      await manager.update(Contract, id, contractData);
      const saved = await manager.findOne(Contract, { where: { id } });
      // T8.1: 更新合同后回写关联案件（amount 变更时同步 Case.fee_amount/service_fee）
      if (saved && saved.case_id) {
        const caseData: any = {};
        if (saved.amount) caseData.fee_amount = Number(saved.amount);
        if (saved.amount) caseData.service_fee = Number(saved.amount);
        if (saved.title) caseData.case_name = saved.title;
        if (saved.client_name) caseData.client_name = saved.client_name;
        if (saved.client_phone) caseData.client_phone = saved.client_phone;
        if (saved.lead_lawyer_id) caseData.assignee_lawyer_id = saved.lead_lawyer_id;
        if (Object.keys(caseData).length > 0) {
          await manager.update(Case, saved.case_id, caseData);
        }
      }
      return saved;
    });
  }

  // 删除合同（同时删除关联的阶段记录，使用事务保证一致性）
  async remove(id: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(ContractStage, { contract_id: id });
      await manager.softDelete(Contract, id);
    });
  }

  // 审查合同: drafting -> reviewing
  async review(id: string, remarks?: string): Promise<Contract> {
    const contract = await this.contractRepository.findOne({ where: { id } });
    if (!contract) return null;
    await this.contractRepository.update(id, { stage: ContractStageEnum.REVIEWING });
    await this.recordStage({
      contract_id: id,
      stage_name: ContractStageEnum.REVIEWING,
      stage_status: 'entered',
      remarks: remarks || '合同审查中',
      organization_id: contract.organization_id,
    });
    return this.contractRepository.findOne({ where: { id } });
  }

  // 签订合同: reviewing -> signed
  async sign(id: string, data?: { sign_date?: Date; start_date?: Date; end_date?: Date; remarks?: string }): Promise<Contract> {
    const contract = await this.contractRepository.findOne({ where: { id } });
    if (!contract) return null;
    const updateData: Partial<Contract> = { stage: ContractStageEnum.SIGNED };
    if (data?.sign_date) updateData.sign_date = data.sign_date;
    else if (!contract.sign_date) updateData.sign_date = new Date();
    if (data?.start_date) updateData.start_date = data.start_date;
    if (data?.end_date) updateData.end_date = data.end_date;
    await this.contractRepository.update(id, updateData);
    await this.recordStage({
      contract_id: id,
      stage_name: ContractStageEnum.SIGNED,
      stage_status: 'entered',
      start_date: updateData.sign_date as Date,
      remarks: data?.remarks || '合同签订',
      organization_id: contract.organization_id,
    });
    return this.contractRepository.findOne({ where: { id } });
  }

  // 变更合同: 更新可变字段并记录阶段
  async change(id: string, changeData: Partial<Contract>, remarks?: string): Promise<Contract> {
    const contract = await this.contractRepository.findOne({ where: { id } });
    if (!contract) return null;
    // 仅允许变更部分字段，不修改阶段流转字段
    const allowed: Partial<Contract> = {};
    const editableKeys = ['title', 'type', 'case_id', 'client_name', 'client_phone', 'amount', 'sign_date', 'start_date', 'end_date', 'remarks'];
    for (const key of editableKeys) {
      if (changeData[key] !== undefined) {
        (allowed as any)[key] = changeData[key];
      }
    }
    if (Object.keys(allowed).length > 0) {
      await this.contractRepository.update(id, allowed);
    }
    await this.recordStage({
      contract_id: id,
      stage_name: contract.stage,
      stage_status: 'changed',
      remarks: remarks || '合同信息变更',
      organization_id: contract.organization_id,
    });
    return this.contractRepository.findOne({ where: { id } });
  }

  // 解约: -> terminated
  async terminate(id: string, remarks?: string): Promise<Contract> {
    const contract = await this.contractRepository.findOne({ where: { id } });
    if (!contract) return null;
    await this.contractRepository.update(id, { stage: ContractStageEnum.TERMINATED });
    await this.recordStage({
      contract_id: id,
      stage_name: ContractStageEnum.TERMINATED,
      stage_status: 'entered',
      end_date: new Date(),
      remarks: remarks || '合同解约',
      organization_id: contract.organization_id,
    });
    const result = await this.contractRepository.findOne({ where: { id } });

    // Phase5 M8: 合同终止审计日志（异常静默不影响主流程）
    try {
      await this.logContractAudit({
        action: '合同终止',
        resourceType: 'Contract',
        resourceId: id,
        detail: JSON.stringify({ contract_id: id, stage: 'terminated', remarks: remarks || '' }),
      });
    } catch (e) {}

    return result;
  }

  // 作废: -> voided
  async void(id: string, remarks?: string): Promise<Contract> {
    const contract = await this.contractRepository.findOne({ where: { id } });
    if (!contract) return null;
    await this.contractRepository.update(id, { stage: ContractStageEnum.VOIDED });
    await this.recordStage({
      contract_id: id,
      stage_name: ContractStageEnum.VOIDED,
      stage_status: 'entered',
      end_date: new Date(),
      remarks: remarks || '合同作废',
      organization_id: contract.organization_id,
    });
    return this.contractRepository.findOne({ where: { id } });
  }

  // 推进履行阶段: signed -> performing -> completed（辅助方法，便于后续扩展）
  async advance(id: string, remarks?: string): Promise<Contract> {
    const contract = await this.contractRepository.findOne({ where: { id } });
    if (!contract) return null;
    let nextStage = contract.stage;
    if (contract.stage === ContractStageEnum.SIGNED) {
      nextStage = ContractStageEnum.PERFORMING;
    } else if (contract.stage === ContractStageEnum.PERFORMING) {
      nextStage = ContractStageEnum.COMPLETED;
    }
    if (nextStage !== contract.stage) {
      await this.contractRepository.update(id, { stage: nextStage });
      await this.recordStage({
        contract_id: id,
        stage_name: nextStage,
        stage_status: 'entered',
        remarks: remarks || '合同阶段推进',
        organization_id: contract.organization_id,
      });
    }
    return this.contractRepository.findOne({ where: { id } });
  }

  // 合同更正：追加一条更正记录到 change_records（JSON数组）
  async correct(id: string, data: { reason: string; content: string; operator_id: string }): Promise<Contract> {
    const contract = await this.contractRepository.findOne({ where: { id } });
    if (!contract) return null;
    // 读取现有更正记录
    let records: any[] = [];
    if (contract.change_records) {
      try {
        records = JSON.parse(contract.change_records);
        if (!Array.isArray(records)) records = [];
      } catch (e) {
        records = [];
      }
    }
    // 追加新记录
    records.push({
      time: new Date().toISOString(),
      reason: data.reason,
      content: data.content,
      operator_id: data.operator_id,
    });
    await this.contractRepository.update(id, { change_records: JSON.stringify(records) });
    return this.contractRepository.findOne({ where: { id } });
  }

  // 原件回收登记：更新 original_status 为 received
  async receiveOriginal(id: string): Promise<Contract> {
    const contract = await this.contractRepository.findOne({ where: { id } });
    if (!contract) return null;
    await this.contractRepository.update(id, { original_status: 'received' });
    return this.contractRepository.findOne({ where: { id } });
  }

  // 分配比例确认：将 ratio 数组保存到 allocation_ratio 字段（JSON字符串）
  async confirmAllocation(id: string, ratio: Array<{ role: string; ratio: number }>): Promise<Contract> {
    const contract = await this.contractRepository.findOne({ where: { id } });
    if (!contract) return null;
    await this.contractRepository.update(id, { allocation_ratio: JSON.stringify(ratio || []) });
    return this.contractRepository.findOne({ where: { id } });
  }

  // ==================== 合同用印状态更新方法（对齐金助理） ====================

  // 更新电子章状态：none未用 / pending待盖章 / used已盖章
  async updateElectronicSeal(id: string, status: string, _operatorId?: string): Promise<Contract> {
    const contract = await this.contractRepository.findOne({ where: { id } });
    if (!contract) return null;
    const updateData: Partial<Contract> = { electronic_seal_status: status };
    // 若电子章盖章，联动更新用印状态
    if (status === 'used' && contract.seal_usage_status !== 'used') {
      updateData.seal_usage_status = contract.paper_seal_status === 'used' || status === 'used' ? 'used' : contract.seal_usage_status;
    }
    if (status === 'pending' && contract.seal_usage_status === 'unused') {
      updateData.seal_usage_status = 'pending';
    }
    await this.contractRepository.update(id, updateData);
    return this.contractRepository.findOne({ where: { id } });
  }

  // 更新纸质章状态：none未用 / pending待盖章 / used已盖章
  async updatePaperSeal(id: string, status: string, _operatorId?: string): Promise<Contract> {
    const contract = await this.contractRepository.findOne({ where: { id } });
    if (!contract) return null;
    const updateData: Partial<Contract> = { paper_seal_status: status };
    if (status === 'used' && contract.seal_usage_status !== 'used') {
      updateData.seal_usage_status = contract.electronic_seal_status === 'used' || status === 'used' ? 'used' : contract.seal_usage_status;
    }
    if (status === 'pending' && contract.seal_usage_status === 'unused') {
      updateData.seal_usage_status = 'pending';
    }
    await this.contractRepository.update(id, updateData);
    return this.contractRepository.findOne({ where: { id } });
  }

  // 更新用印状态：unused未用印 / pending审批中 / approved已批准 / used已用印 / voided已作废
  async updateSealUsage(
    id: string,
    status: string,
    sealApplyMethod?: string,
    _operatorId?: string,
  ): Promise<Contract> {
    const contract = await this.contractRepository.findOne({ where: { id } });
    if (!contract) return null;
    const updateData: Partial<Contract> = { seal_usage_status: status };
    if (sealApplyMethod) {
      updateData.seal_apply_method = sealApplyMethod;
    }
    await this.contractRepository.update(id, updateData);
    return this.contractRepository.findOne({ where: { id } });
  }

  // ==================== 合同审批方法（对齐金助理） ====================

  // 提交合同审批：approval_status pending
  async submitApproval(id: string): Promise<Contract> {
    const contract = await this.contractRepository.findOne({ where: { id } });
    if (!contract) return null;
    await this.contractRepository.update(id, { approval_status: 'pending' });
    await this.recordStage({
      contract_id: id,
      stage_name: contract.stage,
      stage_status: 'submit_approval',
      remarks: '提交合同审批',
      organization_id: contract.organization_id,
    });
    return this.contractRepository.findOne({ where: { id } });
  }

  // 合同审批通过：approval_status approved
  async approve(id: string, approverId: string, comment?: string): Promise<Contract> {
    const contract = await this.contractRepository.findOne({ where: { id } });
    if (!contract) return null;

    const result = await this.dataSource.transaction(async (manager) => {
      const approvalTime = new Date();
      const updateData: Partial<Contract> = {
        approval_status: 'approved',
        approver_id: approverId,
        approval_time: approvalTime,
      };

      // seal_usage_status 如果不是 used/voided 则更新为 pending
      if (contract.seal_usage_status !== 'used' && contract.seal_usage_status !== 'voided') {
        updateData.seal_usage_status = 'pending';
      }

      await manager.update(Contract, id, updateData);

      // 记录阶段变更
      await this.recordStage({
        contract_id: id,
        stage_name: contract.stage,
        stage_status: 'approved',
        remarks: comment || '合同审批通过',
        organization_id: contract.organization_id,
      }, manager);

      // 防止重复：先查 seal_application 中 contract_id=contract.id 且 status IN ('pending','approved','used') 的存在则跳过创建
      const existingApp = await manager.findOne(SealApplication, {
        where: {
          contract_id: contract.id,
          status: In(['pending', 'approved', 'used']),
        },
      });

      if (!existingApp) {
        // 查询该 organization 下任一 status=active 的印章 ID
        const activeSeal = await manager.findOne(Seal, {
          where: {
            organization_id: contract.organization_id,
            status: 'active',
          },
        });
        const sealId = activeSeal ? activeSeal.id : '00000000-0000-0000-0000-000000000000';

        // applicant_id: 优先用 contract.lead_lawyer_id 若空则用 approverId
        const applicantId = contract.lead_lawyer_id || approverId;

        // seal_medium: contract.seal_apply_method 若有，则若包含 electronic→electronic，否则 paper；若没有默认 'paper'
        let sealMedium = 'paper';
        if (contract.seal_apply_method) {
          if (contract.seal_apply_method.toLowerCase().includes('electronic')) {
            sealMedium = 'electronic';
          } else {
            sealMedium = 'paper';
          }
        }

        // document_name: contract.title 或 contract.contract_no 缺省取 contract.id
        const documentName = contract.title || contract.contract_no || contract.id;

        // 调用 sealService.createApplication 创建用印申请
        await this.sealService.createApplication({
          applicant_id: applicantId,
          case_id: contract.case_id,
          contract_id: contract.id,
          seal_id: sealId,
          document_name: documentName,
          document_no: contract.contract_no,
          creator_id: applicantId,
          document_type: 'contract',
          document_category: '其他',
          seal_medium: sealMedium,
          purpose: '合同审批通过自动发起用印',
          usage_count: 1,
          status: 'pending',
          apply_time: new Date(),
          organization_id: contract.organization_id,
        });
      }

      // 重新查询更新后的合同并返回
      return await manager.findOne(Contract, { where: { id } });
    });

    // Phase5 M8: 合同审批审计日志（事务提交后记录，异常静默不影响主流程）
    try {
      await this.logContractAudit({
        userId: approverId,
        action: '合同审批',
        resourceType: 'Contract',
        resourceId: id,
        detail: JSON.stringify({ contract_id: id, approval_status: 'approved', approver_id: approverId }),
      });
    } catch (e) {}

    // Phase5 L2: 合同审批通过后自动生成委托合同（异常静默不影响主流程）
    // generateContract 签名为 (caseId, templateId)，使用合同关联案件 ID 与标准模板生成
    try {
      if (contract.case_id) {
        await this.legalDocumentService.generateContract(contract.case_id, 'standard');
      }
    } catch (e) {}

    return result;
  }

  // 合同审批退回：approval_status rejected
  async reject(id: string, approverId: string, comment?: string): Promise<Contract> {
    const contract = await this.contractRepository.findOne({ where: { id } });
    if (!contract) return null;
    await this.contractRepository.update(id, {
      approval_status: 'rejected',
      approver_id: approverId,
      approval_time: new Date(),
    });
    await this.recordStage({
      contract_id: id,
      stage_name: contract.stage,
      stage_status: 'rejected',
      remarks: comment || '合同审批退回',
      organization_id: contract.organization_id,
    });
    return this.contractRepository.findOne({ where: { id } });
  }

  // ==================== 合同交回管理方法（对齐金助理） ====================

  // 登记合同交回
  async returnContract(id: string, returnerId: string, returnTime?: Date): Promise<Contract> {
    const contract = await this.contractRepository.findOne({ where: { id } });
    if (!contract) return null;
    await this.contractRepository.update(id, {
      return_status: 'returned',
      returner_id: returnerId,
      return_time: returnTime || new Date(),
    });
    return this.contractRepository.findOne({ where: { id } });
  }

  // 撤销合同交回
  async unreturnContract(id: string): Promise<Contract> {
    const contract = await this.contractRepository.findOne({ where: { id } });
    if (!contract) return null;
    await this.contractRepository.update(id, {
      return_status: 'not_returned',
      returner_id: null as any,
      return_time: null as any,
    });
    return this.contractRepository.findOne({ where: { id } });
  }
}
