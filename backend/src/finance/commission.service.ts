import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommissionRule, CommissionType, CommissionRoleType, TierRule } from './commission-rule.entity';
import { CommissionRecord, CommissionStatus } from './commission-record.entity';
import { Case } from '../case/case.entity';
import { User } from '../user/user.entity';
import { CaseStatus } from '../types';

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
    if (!receivable || receivable.status !== 'completed') {
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
   * 获取案件应收款台账
   */
  private async getReceivableByCaseId(caseId: string): Promise<any> {
    // 这里需要从finance.service中获取应收款信息
    // 简化实现，实际应该调用FinanceService
    return { status: 'completed' }; // 假设已结清
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
}