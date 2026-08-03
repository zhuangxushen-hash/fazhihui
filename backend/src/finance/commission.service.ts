import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommissionRule, CommissionType, CommissionRoleType, TierRule } from './commission-rule.entity';
import { CommissionRecord, CommissionStatus } from './commission-record.entity';
import { Case } from '../case/case.entity';
import { User } from '../user/user.entity';
import { CaseStatus } from '../types';
import { Receivable, ReceivableStatus } from './receivable.entity';

@Injectable()
export class CommissionService {
  constructor(
    @InjectRepository(CommissionRule)
    private commissionRuleRepository: Repository<CommissionRule>,
    @InjectRepository(CommissionRecord)
    private commissionRecordRepository: Repository<CommissionRecord>,
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Receivable)
    private receivableRepository: Repository<Receivable>,
  ) {}

  // ========== 分润规则管理 ==========

  async createRule(data: Partial<CommissionRule>): Promise<CommissionRule> {
    const rule = this.commissionRuleRepository.create(data);
    return await this.commissionRuleRepository.save(rule);
  }

  async updateRule(id: string, data: Partial<CommissionRule>): Promise<CommissionRule> {
    const rule = await this.commissionRuleRepository.findOne({ where: { id } });
    if (!rule) {
      throw new NotFoundException('分润规则不存在');
    }
    Object.assign(rule, data);
    return await this.commissionRuleRepository.save(rule);
  }

  async deleteRule(id: string): Promise<void> {
    const rule = await this.commissionRuleRepository.findOne({ where: { id } });
    if (!rule) {
      throw new NotFoundException('分润规则不存在');
    }
    await this.commissionRuleRepository.remove(rule);
  }

  async getRules(organization_id: string, enabled?: boolean): Promise<CommissionRule[]> {
    const query = this.commissionRuleRepository.createQueryBuilder('rule')
      .where('rule.organization_id = :organization_id', { organization_id });

    if (enabled !== undefined) {
      query.andWhere('rule.enabled = :enabled', { enabled });
    }

    return await query.getMany();
  }

  async getRuleById(id: string): Promise<CommissionRule> {
    const rule = await this.commissionRuleRepository.findOne({ where: { id } });
    if (!rule) {
      throw new NotFoundException('分润规则不存在');
    }
    return rule;
  }

  async toggleRule(id: string, enabled: boolean): Promise<CommissionRule> {
    const rule = await this.commissionRuleRepository.findOne({ where: { id } });
    if (!rule) {
      throw new NotFoundException('分润规则不存在');
    }
    rule.enabled = enabled;
    return await this.commissionRuleRepository.save(rule);
  }

  // ========== 分润记录管理 ==========

  async getRecords(organization_id: string, case_id?: string, status?: string): Promise<CommissionRecord[]> {
    const query = this.commissionRecordRepository.createQueryBuilder('record')
      .leftJoinAndSelect('record.case', 'case')
      .leftJoinAndSelect('record.user', 'user')
      .leftJoinAndSelect('record.rule', 'rule')
      .where('record.organization_id = :organization_id', { organization_id });

    if (case_id) {
      query.andWhere('record.case_id = :case_id', { case_id });
    }

    if (status) {
      query.andWhere('record.status = :status', { status });
    }

    return await query.getMany();
  }

  async getRecordById(id: string): Promise<CommissionRecord> {
    const record = await this.commissionRecordRepository.findOne({
      where: { id },
      relations: { case: true, user: true, rule: true },
    });
    if (!record) {
      throw new NotFoundException('分润记录不存在');
    }
    return record;
  }

  async markPaid(id: string): Promise<CommissionRecord> {
    const record = await this.commissionRecordRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException('分润记录不存在');
    }
    record.status = CommissionStatus.PAID;
    record.paid_at = new Date();
    return await this.commissionRecordRepository.save(record);
  }

  // ========== 分润计算逻辑 ==========

  /**
   * 计算案件分润
   * 触发条件：案件结案且全款到账
   */
  async calculateCommission(caseId: string): Promise<CommissionRecord[]> {
    // 获取案件信息
    const caseEntity = await this.caseRepository.findOne({
      where: { id: caseId },
      relations: { assignee_lawyer: true },
    });

    if (!caseEntity) {
      throw new NotFoundException('案件不存在');
    }

    // 检查案件状态：必须已结案
    if (caseEntity.status !== CaseStatus.CLOSED) {
      throw new BadRequestException('案件未结案，无法计算分润');
    }

    // 检查是否全款到账（通过应收款台账检查）
    const receivable = await this.getReceivableByCaseId(caseId);
    if (!receivable || receivable.status !== ReceivableStatus.COMPLETED) {
      throw new BadRequestException('案件款项未结清，无法计算分润');
    }

    // 获取案件相关角色
    const participants = await this.getCaseParticipants(caseEntity);

    // 获取适用的分润规则
    const rules = await this.getRules(caseEntity.organization_id, true);

    const records: CommissionRecord[] = [];

    // 为每个角色计算分润
    for (const participant of participants) {
      // 查找对应的分润规则
      const rule = this.findMatchingRule(rules, participant.role_type, caseEntity.case_type);
      if (!rule) {
        continue; // 如果没有匹配的规则，跳过该角色
      }

      // 计算提成金额
      const commissionAmount = this.calculateAmount(rule, caseEntity.fee_amount || 0);

      // 创建分润记录
      const record = this.commissionRecordRepository.create({
        case_id: caseId,
        user_id: participant.user_id,
        role_type: participant.role_type,
        rule_id: rule.id,
        base_amount: caseEntity.fee_amount || 0,
        commission_amount: commissionAmount,
        status: CommissionStatus.PENDING,
        organization_id: caseEntity.organization_id,
      });

      records.push(await this.commissionRecordRepository.save(record));
    }

    return records;
  }

  /**
   * 查找匹配的分润规则
   */
  private findMatchingRule(
    rules: CommissionRule[],
    roleType: CommissionRoleType,
    caseType: string,
  ): CommissionRule | null {
    // 优先查找指定案由的规则
    let rule = rules.find(
      r => r.role_type === roleType && r.case_type === caseType && r.enabled,
    );

    // 如果没有指定案由的规则，查找通用规则
    if (!rule) {
      rule = rules.find(
        r => r.role_type === roleType && !r.case_type && r.enabled,
      );
    }

    return rule || null;
  }

  /**
   * 计算提成金额
   */
  private calculateAmount(rule: CommissionRule, baseAmount: number): number {
    // 如果有阶梯规则，使用阶梯计算
    if (rule.tier_rules) {
      const tierRules: TierRule[] = JSON.parse(rule.tier_rules);
      return this.calculateTierCommission(tierRules, baseAmount);
    }

    // 否则使用固定值或比例计算
    if (rule.commission_type === CommissionType.FIXED) {
      return Number(rule.commission_value);
    } else {
      // 比例计算
      return baseAmount * (Number(rule.commission_value) / 100);
    }
  }

  /**
   * 阶梯提成计算
   */
  private calculateTierCommission(tierRules: TierRule[], baseAmount: number): number {
    for (const tier of tierRules) {
      if (baseAmount >= tier.min_amount && baseAmount <= tier.max_amount) {
        return Number(tier.commission_value);
      }
    }
    return 0;
  }

  /**
   * 获取案件参与者
   */
  private async getCaseParticipants(caseEntity: Case): Promise<Array<{ user_id: string; role_type: CommissionRoleType }>> {
    const participants: Array<{ user_id: string; role_type: CommissionRoleType }> = [];

    // 主办律师
    if (caseEntity.assignee_lawyer_id) {
      participants.push({
        user_id: caseEntity.assignee_lawyer_id,
        role_type: CommissionRoleType.MAIN_LAWYER,
      });
    }

    // TODO: 协办律师、邀约岗、谈案岗等其他角色需要从案件的关联数据中获取
    // 这里暂时只处理主办律师，实际项目中需要从线索/商机等数据中追溯其他角色

    return participants;
  }

  /**
   * 获取案件应收款台账聚合信息
   * 汇总该案件所有 receivable 记录，返回总合同额、已回款额及聚合状态
   */
  private async getReceivableByCaseId(caseId: string): Promise<{ contract_amount: number; received_amount: number; status: string } | null> {
    const list = await this.receivableRepository.find({ where: { case_id: caseId } });
    if (!list || list.length === 0) return null;
    let total = 0; let received = 0;
    for (const r of list) {
      total += Number(r.contract_amount) || 0;
      received += Number(r.received_amount) || 0;
    }
    let status: string = ReceivableStatus.PENDING;
    if (received >= total && total > 0) status = ReceivableStatus.COMPLETED;
    else if (received > 0) status = ReceivableStatus.PARTIAL;
    return { contract_amount: total, received_amount: received, status };
  }

  /**
   * 批量计算多个案件的分润
   */
  async batchCalculateCommission(caseIds: string[]): Promise<{ [key: string]: CommissionRecord[] }> {
    const results: { [key: string]: CommissionRecord[] } = {};

    for (const caseId of caseIds) {
      try {
        const records = await this.calculateCommission(caseId);
        results[caseId] = records;
      } catch (error) {
        results[caseId] = [];
      }
    }

    return results;
  }

  /**
   * 自动检查并触发分润：扫描满足条件（案件已结案 && 全款到账）的案件，
   * 若该案件没有已生成的分润记录则调用 calculateCommission 自动生成。
   * 使用场景：回款成功、结案归档后被动触发；或定时任务扫描。
   * 单条 try/catch，失败不影响其他案件。
   *
   * @param case_id 可选，传了则只检查指定案件；不传则扫描全 org 的所有 closed 案件
   * @param organization_id  可选，caseId 不传时必须传
   */
  async checkAndTriggerCommission(options: { case_id?: string; organization_id?: string }): Promise<{ triggered: number; skipped: number; failed: number }> {
    let triggered = 0; let skipped = 0; let failed = 0;

    let casesToCheck: Case[] = [];
    if (options.case_id) {
      const c = await this.caseRepository.findOne({ where: { id: options.case_id } });
      if (c) casesToCheck = [c];
    } else if (options.organization_id) {
      casesToCheck = await this.caseRepository.find({
        where: {
          organization_id: options.organization_id,
          status: CaseStatus.CLOSED,
        },
      });
    } else {
      return { triggered: 0, skipped: 0, failed: 0 };
    }

    for (const c of casesToCheck) {
      try {
        if (c.status !== CaseStatus.CLOSED) { skipped++; continue; }
        const receivable = await this.getReceivableByCaseId(c.id);
        if (!receivable || receivable.status !== ReceivableStatus.COMPLETED) { skipped++; continue; }
        const existing = await this.commissionRecordRepository.count({ where: { case_id: c.id } });
        if (existing > 0) { skipped++; continue; }
        await this.calculateCommission(c.id);
        triggered++;
      } catch (err) {
        failed++;
      }
    }

    return { triggered, skipped, failed };
  }
}