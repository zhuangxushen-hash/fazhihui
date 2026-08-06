import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { ConflictCheck } from './conflict-check.entity';
import { Case } from './case.entity';
import { NotificationService } from '../user/notification.service';

@Injectable()
export class ConflictCheckService {
  constructor(
    @InjectRepository(ConflictCheck)
    private conflictCheckRepository: Repository<ConflictCheck>,
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    private notificationService: NotificationService,
  ) {}

  /**
   * 执行利益冲突检索
   * 在现有 cases 表中搜索 client_name 和 client_phone 匹配，判断是否有冲突
   * 检索规则：
   *  1. 当事人姓名/电话命中已有案件的客户 -> 可能存在冲突
   *  2. 对方当事人姓名命中已有案件的客户 -> 可能存在冲突
   *  3. 当事人姓名与对方当事人姓名同时命中同一案件 -> 明确冲突
   */
  async check(params: {
    partyName: string;
    opposingParty: string;
    partyPhone?: string;
    orgId: string;
    checkerId?: string;
    caseId?: string;
  }): Promise<ConflictCheck> {
    const { partyName, opposingParty, partyPhone, orgId, checkerId, caseId } = params;

    // 查询当前组织下命中当事人的案件（partyName 为空时跳过）
    const partyHits = partyName
      ? await this.findCasesByNameOrPhone(partyName, partyPhone, orgId)
      : [];
    // 查询当前组织下命中对方当事人的案件（opposingParty 为空时跳过）
    const opposingHits = opposingParty
      ? await this.findCasesByNameOrPhone(opposingParty, undefined, orgId)
      : [];

    // 判断是否存在明确冲突：当事人姓名与对方当事人姓名同时命中同一案件
    const partyHitIds = new Set(partyHits.map((c) => c.id));
    const exactConflictCases = opposingHits.filter((c) => partyHitIds.has(c.id));

    let checkResult = 'clear';
    let conflictDetail = '';

    if (exactConflictCases.length > 0) {
      checkResult = 'conflict';
      conflictDetail = this.buildDetail('检测到明确利益冲突', exactConflictCases);
    } else if (partyHits.length > 0 || opposingHits.length > 0) {
      checkResult = 'warning';
      const parts: string[] = [];
      if (partyHits.length > 0) {
        parts.push(this.buildDetail('当事人曾出现在以下案件', partyHits));
      }
      if (opposingHits.length > 0) {
        parts.push(this.buildDetail('对方当事人曾出现在以下案件', opposingHits));
      }
      conflictDetail = parts.join('\n');
    }

    // 落库检索记录（空值填默认值避免 NOT NULL 约束违反）
    const record = this.conflictCheckRepository.create({
      case_id: caseId || null,
      party_name: partyName || '未知',
      opposing_party: opposingParty || '未知',
      party_phone: partyPhone || null,
      check_result: checkResult,
      conflict_detail: conflictDetail || null,
      checker_id: checkerId || null,
      organization_id: orgId,
    });

    return this.conflictCheckRepository.save(record);
  }

  /**
   * 通过姓名（必填）和电话（可选）查询已存在案件
   */
  private async findCasesByNameOrPhone(
    name: string,
    phone: string | undefined,
    orgId: string,
  ): Promise<Case[]> {
    if (!name) {
      return [];
    }
    const query = this.caseRepository
      .createQueryBuilder('case')
      .where('case.organization_id = :orgId', { orgId })
      .andWhere(
        new Brackets((qb) => {
          qb.where('case.client_name = :name', { name });
          if (phone) {
            qb.orWhere('case.client_phone = :phone', { phone });
          }
        }),
      )
      .orderBy('case.updated_at', 'DESC')
      .limit(20);

    return query.getMany();
  }

  /**
   * 拼装冲突详情文本
   */
  private buildDetail(prefix: string, cases: Case[]): string {
    const lines = cases.map((c) => {
      return `  - 案件编号:${c.case_no || '-'} / 客户:${c.client_name || '-'} / 电话:${c.client_phone || '-'} / 案由:${c.case_type || '-'}`;
    });
    return `${prefix}（共${cases.length}条）：\n${lines.join('\n')}`;
  }

  /**
   * 查询检索记录
   */
  async findAll(orgId: string, keyword?: string): Promise<{ data: ConflictCheck[]; total: number }> {
    const query = this.conflictCheckRepository
      .createQueryBuilder('cc')
      .where('cc.organization_id = :orgId', { orgId });

    if (keyword) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('cc.party_name LIKE :kw', { kw: `%${keyword}%` })
            .orWhere('cc.opposing_party LIKE :kw', { kw: `%${keyword}%` })
            .orWhere('cc.party_phone LIKE :kw', { kw: `%${keyword}%` });
        }),
      );
    }

    query.orderBy('cc.updated_at', 'DESC').limit(100);

    const [data, total] = await query.getManyAndCount();
    return { data, total };
  }

  /**
   * 深度利冲检索
   * 在原有检索逻辑基础上扩展，匹配本所案件当事人并模拟工商数据匹配
   * 检测逻辑：查询 cases 表中 client_name 包含 partyName 或 opposingParty 的案件，
   * 命中则 check_result='conflict'，conflict_detail 写明命中案件信息，
   * conflict_case_name 写命中案件名称；同时模拟工商数据随机生成1-2个关联企业作为补充
   */
  async deepCheck(params: {
    partyName: string;
    opposingParty: string;
    partyRole: string;
    orgId: string;
    checkerId?: string;
    caseId?: string;
  }): Promise<ConflictCheck> {
    const { partyName, opposingParty, partyRole, orgId, checkerId, caseId } = params;

    // 查询 cases 表中 client_name 包含 partyName 或 opposingParty 的案件
    const hitCases = await this.caseRepository
      .createQueryBuilder('case')
      .where('case.organization_id = :orgId', { orgId })
      .andWhere(
        new Brackets((qb) => {
          qb.where('case.client_name LIKE :p1', { p1: `%${partyName}%` }).orWhere(
            'case.client_name LIKE :p2',
            { p2: `%${opposingParty}%` },
          );
        }),
      )
      .orderBy('case.updated_at', 'DESC')
      .limit(20)
      .getMany();

    let checkResult = 'clear';
    let conflictDetail = '';
    let conflictCaseName = '';

    if (hitCases.length > 0) {
      // 命中本所案件，判定为冲突
      checkResult = 'conflict';
      conflictDetail = this.buildDetail('深度检索命中以下案件', hitCases);
      conflictCaseName = hitCases[0].case_no || hitCases[0].client_name || '';
    }

    // 模拟工商数据匹配，随机生成1-2个关联企业作为补充
    const relatedCompanies = this.generateRelatedCompanies(partyName, opposingParty);
    const companyLines = relatedCompanies.map(
      (c) => `  - 关联企业:${c.name} / 统一社会信用代码:${c.creditCode} / 关联类型:${c.relationType}`,
    );
    const supplementDetail = `工商数据匹配（模拟）：\n${companyLines.join('\n')}`;

    // 合并冲突详情与工商数据补充信息
    conflictDetail = conflictDetail
      ? `${conflictDetail}\n${supplementDetail}`
      : supplementDetail;

    // 落库深度检索记录
    const record = this.conflictCheckRepository.create({
      case_id: caseId || null,
      party_name: partyName,
      opposing_party: opposingParty,
      party_phone: null,
      check_result: checkResult,
      conflict_detail: conflictDetail || null,
      checker_id: checkerId || null,
      organization_id: orgId,
      party_role: partyRole || 'client',
      conflict_case_name: conflictCaseName || null,
      approval_status: 'pending',
    });

    return this.conflictCheckRepository.save(record);
  }

  /**
   * 模拟工商数据匹配，随机生成1-2个关联企业
   */
  private generateRelatedCompanies(
    partyName: string,
    opposingParty: string,
  ): { name: string; creditCode: string; relationType: string }[] {
    const relationTypes = ['法定代表人', '股东', '高管', '分公司'];
    // 随机生成1-2个关联企业
    const count = Math.floor(Math.random() * 2) + 1;
    const companies: { name: string; creditCode: string; relationType: string }[] = [];
    for (let i = 0; i < count; i++) {
      const base = i === 0 ? partyName : opposingParty;
      companies.push({
        name: `${base}关联有限公司${i + 1}`,
        creditCode: this.generateCreditCode(),
        relationType: relationTypes[Math.floor(Math.random() * relationTypes.length)],
      });
    }
    return companies;
  }

  /**
   * 随机生成18位统一社会信用代码（模拟）
   */
  private generateCreditCode(): string {
    const chars = '0123456789ABCDEFGHJKLMNPQRTUWXY';
    let code = '';
    for (let i = 0; i < 18; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * 利冲审批通过
   * 更新 approval_status='approved'，supervisor_id=supervisorId，
   * 并将审批意见追加到 conflict_detail 中保留
   */
  async approve(id: string, supervisorId: string, comment: string): Promise<ConflictCheck> {
    const record = await this.conflictCheckRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException('利冲记录不存在');
    }
    record.approval_status = 'approved';
    record.supervisor_id = supervisorId;
    // 保留原冲突详情，追加审批意见
    const approvalNote = `[审批通过] 业务主管:${supervisorId} 意见:${comment || '-'}`;
    record.conflict_detail = record.conflict_detail
      ? `${record.conflict_detail}\n${approvalNote}`
      : approvalNote;
    const savedRecord = await this.conflictCheckRepository.save(record);
    await this.notificationService.notify({
      receiver_id: record.checker_id || '',
      title: '利冲检索审批通过',
      content: `利冲检索记录 ${id} 已审批通过`,
      type: 'conflict_check',
      level: 'normal',
      related_type: 'ConflictCheck',
      related_id: id,
    });
    return savedRecord;
  }

  /**
   * 利冲审批驳回
   * 更新 approval_status='rejected'，supervisor_id=supervisorId，
   * 并将审批意见追加到 conflict_detail 中保留
   */
  async reject(id: string, supervisorId: string, comment: string): Promise<ConflictCheck> {
    const record = await this.conflictCheckRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException('利冲记录不存在');
    }
    record.approval_status = 'rejected';
    record.supervisor_id = supervisorId;
    // 保留原冲突详情，追加审批意见
    const approvalNote = `[审批驳回] 业务主管:${supervisorId} 意见:${comment || '-'}`;
    record.conflict_detail = record.conflict_detail
      ? `${record.conflict_detail}\n${approvalNote}`
      : approvalNote;
    const savedRecord = await this.conflictCheckRepository.save(record);
    await this.notificationService.notify({
      receiver_id: record.checker_id || '',
      title: '利冲检索审批驳回',
      content: `利冲检索记录 ${id} 已审批驳回`,
      type: 'conflict_check',
      level: 'normal',
      related_type: 'ConflictCheck',
      related_id: id,
    });

    // 若利冲记录关联了案件，将案件审批状态置为 rejected（非关键操作，静默处理）
    if (savedRecord.case_id) {
      try {
        await this.caseRepository.update(savedRecord.case_id, { approval_status: 'rejected' });
      } catch (err) {}
    }

    return savedRecord;
  }
}
