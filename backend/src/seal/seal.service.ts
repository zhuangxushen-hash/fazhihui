import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { Seal } from './seal.entity';
import { SealApplication } from './seal-application.entity';
import { SealRecord } from './seal-record.entity';
import { Contract } from '../contract/contract.entity';
import { AuditService } from '../audit/audit.service';
import { User } from '../user/user.entity';

@Injectable()
export class SealService {
  constructor(
    @InjectRepository(Seal)
    private sealRepository: Repository<Seal>,
    @InjectRepository(SealApplication)
    private applicationRepository: Repository<SealApplication>,
    @InjectRepository(SealRecord)
    private recordRepository: Repository<SealRecord>,
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
    private auditService: AuditService,
  ) {}

  /**
   * 记录用印相关审计日志（失败静默不影响主流程）
   */
  private async logSealAudit(params: {
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

  // ===================== 印章 CRUD + 启停 =====================

  // 创建印章
  async createSeal(sealData: Partial<Seal>): Promise<Seal> {
    const seal = this.sealRepository.create(sealData);
    return this.sealRepository.save(seal);
  }

  // 查询当前组织下所有印章
  async findAllSeals(orgId: string): Promise<Seal[]> {
    return this.sealRepository.find({
      where: { organization_id: orgId },
      order: { created_at: 'DESC' },
    });
  }

  // 根据ID查询印章
  async findSealById(id: string): Promise<Seal> {
    return this.sealRepository.findOne({ where: { id } });
  }

  // 更新印章
  async updateSeal(id: string, sealData: Partial<Seal>): Promise<Seal> {
    await this.sealRepository.update(id, sealData);
    return this.sealRepository.findOne({ where: { id } });
  }

  // 删除印章（同时删除关联的用印申请和盖章记录，使用事务保证一致性）
  async deleteSeal(id: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(SealApplication, { seal_id: id });
      await manager.delete(SealRecord, { seal_id: id });
      await manager.delete(Seal, id);
    });
  }

  // 启停印章：active <-> inactive
  async toggleSealStatus(id: string): Promise<Seal> {
    const seal = await this.sealRepository.findOne({ where: { id } });
    seal.status = seal.status === 'active' ? 'inactive' : 'active';
    return this.sealRepository.save(seal);
  }

  // ===================== 用印申请 CRUD + 审批 + 盖章 + 作废收回 =====================

  // 创建用印申请
  async createApplication(applicationData: Partial<SealApplication>): Promise<SealApplication> {
    const application = this.applicationRepository.create(applicationData);
    const saved = await this.applicationRepository.save(application);
    // T10: 创建用印申请审计日志
    await this.logSealAudit({
      userId: applicationData.applicant_id || applicationData.creator_id,
      action: '创建用印申请',
      resourceType: 'SealApplication',
      resourceId: saved.id,
      detail: JSON.stringify({ document_name: applicationData.document_name, seal_medium: applicationData.seal_medium }),
    });
    return saved;
  }

  // 查询用印申请列表（扩展为9个查询条件，对齐金助理综合查询）
  async findApplications(
    orgId: string,
    filters?: {
      status?: string;
      seal_medium?: string;
      document_type?: string;
      document_category?: string;
      void_status?: string;
      keyword?: string;
      creator_id?: string;
      apply_date_start?: string;
      apply_date_end?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<{ data: SealApplication[]; total: number }> {
    const query = this.applicationRepository
      .createQueryBuilder('app')
      .where('app.organization_id = :orgId', { orgId });

    if (filters?.status) {
      query.andWhere('app.status = :status', { status: filters.status });
    }
    if (filters?.seal_medium) {
      query.andWhere('app.seal_medium = :sm', { sm: filters.seal_medium });
    }
    if (filters?.document_type) {
      query.andWhere('app.document_type = :dt', { dt: filters.document_type });
    }
    if (filters?.document_category) {
      query.andWhere('app.document_category = :dc', { dc: filters.document_category });
    }
    if (filters?.void_status) {
      query.andWhere('app.void_status = :vs', { vs: filters.void_status });
    }
    if (filters?.creator_id) {
      query.andWhere('app.creator_id = :cid', { cid: filters.creator_id });
    }
    if (filters?.keyword) {
      const kw = `%${filters.keyword}%`;
      query.andWhere(
        '(app.document_name LIKE :kw OR app.document_no LIKE :kw OR app.case_id LIKE :kw OR app.case_name LIKE :kw OR app.purpose LIKE :kw)',
        { kw },
      );
    }
    if (filters?.apply_date_start) {
      query.andWhere('DATE(app.apply_time) >= :sd', { sd: filters.apply_date_start });
    }
    if (filters?.apply_date_end) {
      query.andWhere('DATE(app.apply_time) <= :ed', { ed: filters.apply_date_end });
    }

    query.orderBy('app.created_at', 'DESC');
    const total = await query.getCount();
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    query.skip((page - 1) * limit).take(limit);
    const data = await query.getMany();
    return { data, total };
  }

  // 根据ID查询用印申请
  async findApplicationById(id: string): Promise<SealApplication> {
    return this.applicationRepository.findOne({ where: { id } });
  }

  // 更新用印申请
  async updateApplication(id: string, applicationData: Partial<SealApplication>): Promise<SealApplication> {
    await this.applicationRepository.update(id, applicationData);
    return this.applicationRepository.findOne({ where: { id } });
  }

  // 审批通过
  async approveApplication(id: string, approverId: string, comment?: string): Promise<SealApplication> {
    const result = await this.dataSource.transaction(async (manager) => {
      await manager.update(SealApplication, id, {
        status: 'approved',
        approver_id: approverId,
        approve_comment: comment,
        approve_time: new Date(),
      });
      const application = await manager.findOne(SealApplication, { where: { id } });
      if (application && application.contract_id) {
        const contract = await manager.findOne(Contract, { where: { id: application.contract_id } });
        if (contract) {
          contract.seal_usage_status = 'approved';
          if (application.seal_medium === 'electronic') {
            contract.electronic_seal_status = 'approved';
          }
          if (application.seal_medium === 'paper') {
            contract.paper_seal_status = 'approved';
          }
          await manager.save(Contract, contract);
        }
      }
      return manager.findOne(SealApplication, { where: { id } });
    });
    // T10: 审批通过用印申请审计日志
    await this.logSealAudit({
      userId: approverId,
      action: '审批通过用印申请',
      resourceType: 'SealApplication',
      resourceId: id,
      detail: comment || '',
    });
    return result;
  }

  // 审批驳回
  async rejectApplication(id: string, approverId: string, comment?: string): Promise<SealApplication> {
    await this.applicationRepository.update(id, {
      status: 'rejected',
      approver_id: approverId,
      approve_comment: comment,
      approve_time: new Date(),
    });
    const result = await this.applicationRepository.findOne({ where: { id } });
    // T10: 审批驳回用印申请审计日志
    await this.logSealAudit({
      userId: approverId,
      action: '审批驳回用印申请',
      resourceType: 'SealApplication',
      resourceId: id,
      detail: comment || '',
    });
    return result;
  }

  // 盖章：更新申请状态为 used，并写入盖章记录
  async useApplication(id: string, operatorId: string): Promise<SealApplication> {
    const result = await this.dataSource.transaction(async (manager) => {
      const application = await manager.findOne(SealApplication, { where: { id } });
      if (!application) {
        return null;
      }
      await manager.update(SealApplication, id, { status: 'used' });
      const record = manager.create(SealRecord, {
        application_id: application.id,
        seal_id: application.seal_id,
        operator_id: operatorId,
        document_name: application.document_name,
        usage_count: application.usage_count,
        seal_time: new Date(),
        organization_id: application.organization_id,
      });
      await manager.save(SealRecord, record);
      if (application.contract_id) {
        const contract = await manager.findOne(Contract, { where: { id: application.contract_id } });
        if (contract) {
          contract.seal_usage_status = 'used';
          if (application.seal_medium === 'electronic') {
            contract.electronic_seal_status = 'used';
          }
          if (application.seal_medium === 'paper') {
            contract.paper_seal_status = 'used';
          }
          if (['drafting', 'reviewing'].includes(contract.stage)) {
            contract.stage = 'signed';
          }
          await manager.save(Contract, contract);
        }
      }
      return manager.findOne(SealApplication, { where: { id } });
    });
    // T10: 用印盖章审计日志
    if (result) {
      await this.logSealAudit({
        userId: operatorId,
        action: '用印盖章',
        resourceType: 'SealApplication',
        resourceId: id,
        detail: '',
      });
    }
    return result;
  }

  // 批量盖章：批量更新申请状态为 used，并批量写入盖章记录
  async batchUseApplications(ids: string[], operatorId: string): Promise<SealApplication[]> {
    const applications = await this.applicationRepository.find({ where: { id: In(ids) } });
    if (applications.length === 0) {
      return [];
    }
    const records: SealRecord[] = applications.map((application) =>
      this.recordRepository.create({
        application_id: application.id,
        seal_id: application.seal_id,
        operator_id: operatorId,
        document_name: application.document_name,
        usage_count: application.usage_count,
        seal_time: new Date(),
        organization_id: application.organization_id,
      }),
    );
    await this.recordRepository.save(records);
    await this.applicationRepository.update(ids, { status: 'used' });
    return this.applicationRepository.find({ where: { id: In(ids) } });
  }

  // 批量作废（仅处理状态为 pending 或 approved 的申请，写入作废状态/原因/时间/操作人）
  async batchVoid(ids: string[], reason?: string, operatorId?: string): Promise<number> {
    if (!ids || ids.length === 0) {
      return 0;
    }
    const now = new Date();
    const updateData: any = {
      status: 'voided',
      void_status: 'voided',
      void_reason: reason || '批量作废',
      void_time: now,
    };
    if (operatorId) {
      updateData.void_operator_id = operatorId;
    }
    const result = await this.applicationRepository
      .createQueryBuilder()
      .update(SealApplication)
      .set(updateData)
      .where('id IN (:...ids)', { ids })
      .andWhere('status IN (:...allowed)', { allowed: ['pending', 'approved'] })
      .execute();
    return (result as any).affected || 0;
  }

  // 单个作废用印申请
  async voidApplication(id: string, reason?: string, operatorId?: string): Promise<SealApplication> {
    const result = await this.dataSource.transaction(async (manager) => {
      const application = await manager.findOne(SealApplication, { where: { id } });
      if (!application) return null;
      if (!['pending', 'approved'].includes(application.status)) {
        return application;
      }
      const updateData: any = {
        status: 'voided',
        void_status: 'voided',
        void_reason: reason || '单条作废',
        void_time: new Date(),
      };
      if (operatorId) {
        updateData.void_operator_id = operatorId;
      }
      await manager.update(SealApplication, id, updateData);
      if (application.contract_id) {
        const contract = await manager.findOne(Contract, { where: { id: application.contract_id } });
        if (contract) {
          contract.seal_usage_status = 'voided';
          if (application.seal_medium === 'electronic') {
            contract.electronic_seal_status = 'voided';
          }
          if (application.seal_medium === 'paper') {
            contract.paper_seal_status = 'voided';
          }
          await manager.save(Contract, contract);
        }
      }
      return manager.findOne(SealApplication, { where: { id } });
    });
    // T10: 作施用印申请审计日志
    if (result) {
      await this.logSealAudit({
        userId: operatorId,
        action: '作施用印申请',
        resourceType: 'SealApplication',
        resourceId: id,
        detail: reason || '',
      });
    }
    return result;
  }

  // 收回已作废的用印文档（void_status: voided -> recovered）
  async recoverApplication(id: string, operatorId?: string): Promise<SealApplication> {
    const application = await this.applicationRepository.findOne({ where: { id } });
    if (!application) return null;
    if (application.void_status !== 'voided') {
      return application;
    }
    const updateData: any = {
      void_status: 'recovered',
      recover_time: new Date(),
    };
    if (operatorId) {
      updateData.recover_operator_id = operatorId;
    }
    await this.applicationRepository.update(id, updateData);
    const result = await this.applicationRepository.findOne({ where: { id } });
    // T10: 收回用印申请审计日志
    await this.logSealAudit({
      userId: operatorId,
      action: '收回用印申请',
      resourceType: 'SealApplication',
      resourceId: id,
      detail: '',
    });
    return result;
  }

  // ===================== 盖章记录查询（扩展筛选条件） =====================

  // 查询盖章记录列表（支持按介质/关键字/日期范围筛选）
  async findRecords(
    orgId: string,
    filters?: {
      seal_medium?: string;
      keyword?: string;
      start_date?: string;
      end_date?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<{ data: SealRecord[]; total: number }> {
    const query = this.recordRepository
      .createQueryBuilder('rec')
      .where('rec.organization_id = :orgId', { orgId });

    if (filters?.keyword) {
      const kw = `%${filters.keyword}%`;
      query.andWhere(
        '(rec.document_name LIKE :kw OR rec.application_id LIKE :kw OR rec.seal_id LIKE :kw)',
        { kw },
      );
    }
    if (filters?.start_date) {
      query.andWhere('DATE(rec.seal_time) >= :sd', { sd: filters.start_date });
    }
    if (filters?.end_date) {
      query.andWhere('DATE(rec.seal_time) <= :ed', { ed: filters.end_date });
    }
    // seal_medium 通过关联 application 表过滤（简单实现：seal_medium 不在 record 表，通过 join 实现；此处保留占位，返回基础结果）
    query.orderBy('rec.seal_time', 'DESC');
    const total = await query.getCount();
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    query.skip((page - 1) * limit).take(limit);
    const data = await query.getMany();
    // 如果筛选 seal_medium，执行二次过滤
    let finalData = data;
    if (filters?.seal_medium) {
      const appIds = data.map((d) => d.application_id).filter(Boolean);
      if (appIds.length > 0) {
        const apps = await this.applicationRepository.find({ where: { id: In(appIds), seal_medium: filters.seal_medium } });
        const matchedIds = new Set(apps.map((a) => a.id));
        finalData = data.filter((d) => matchedIds.has(d.application_id));
      }
    }
    return { data: finalData, total };
  }

  // 根据申请ID查询盖章记录
  async findRecordsByApplicationId(applicationId: string): Promise<SealRecord[]> {
    return this.recordRepository.find({ where: { application_id: applicationId } });
  }
}
