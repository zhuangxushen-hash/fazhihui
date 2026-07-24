import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeadAssignment } from './lead-assignment.entity';
import { LeadAssignmentLog } from './lead-assignment-log.entity';
import { Lead } from './lead.entity';
import { User } from '../user/user.entity';
import { AssignmentRuleType, UserRole } from '../types';

interface RegionCondition {
  provinces?: string[];
  cities?: string[];
}

interface CaseTypeCondition {
  case_types: string[];
}

interface LoadBalanceCondition {
  user_ids: string[];
}

@Injectable()
export class LeadAssignmentService {
  private loadBalanceIndex: Map<string, number> = new Map();

  constructor(
    @InjectRepository(LeadAssignment)
    private assignmentRepository: Repository<LeadAssignment>,
    @InjectRepository(LeadAssignmentLog)
    private assignmentLogRepository: Repository<LeadAssignmentLog>,
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createRule(ruleData: Partial<LeadAssignment>): Promise<LeadAssignment> {
    const rule = this.assignmentRepository.create(ruleData);
    return this.assignmentRepository.save(rule);
  }

  async findAllRules(orgId: string): Promise<LeadAssignment[]> {
    return this.assignmentRepository.find({
      where: { organization_id: orgId },
      order: { priority: 'DESC', created_at: 'DESC' },
      relations: { target_user: true },
    });
  }

  async findRuleById(id: string): Promise<LeadAssignment> {
    return this.assignmentRepository.findOne({
      where: { id },
      relations: { target_user: true },
    });
  }

  async updateRule(id: string, ruleData: Partial<LeadAssignment>): Promise<LeadAssignment> {
    await this.assignmentRepository.update(id, ruleData);
    return this.findRuleById(id);
  }

  async deleteRule(id: string): Promise<void> {
    await this.assignmentRepository.delete(id);
  }

  async toggleRule(id: string, enabled: boolean): Promise<LeadAssignment> {
    await this.assignmentRepository.update(id, { enabled });
    return this.findRuleById(id);
  }

  async matchAndAssign(lead: Lead, operatorId: string): Promise<Lead> {
    const rules = await this.assignmentRepository.find({
      where: { organization_id: lead.organization_id, enabled: true },
      order: { priority: 'DESC' },
    });

    for (const rule of rules) {
      const matchedUser = await this.matchRule(lead, rule);
      if (matchedUser) {
        const assignedLead = await this.assignLead(
          lead.id,
          matchedUser.id,
          rule.id,
          operatorId,
        );
        return assignedLead;
      }
    }

    return lead;
  }

  private async matchRule(lead: Lead, rule: LeadAssignment): Promise<User | null> {
    switch (rule.rule_type) {
      case AssignmentRuleType.REGION:
        return this.matchByRegion(lead, rule);
      case AssignmentRuleType.CASE_TYPE:
        return this.matchByCaseType(lead, rule);
      case AssignmentRuleType.LOAD_BALANCE:
        return this.matchByLoadBalance(lead, rule);
      default:
        return null;
    }
  }

  private async matchByRegion(lead: Lead, rule: LeadAssignment): Promise<User | null> {
    if (!rule.target_user_id) return null;

    const conditions: RegionCondition = JSON.parse(rule.conditions);
    const leadRegion = lead.source_keyword || '';

    if (conditions.provinces && conditions.provinces.length > 0) {
      const matched = conditions.provinces.some(province => leadRegion.includes(province));
      if (!matched) return null;
    }

    if (conditions.cities && conditions.cities.length > 0) {
      const matched = conditions.cities.some(city => leadRegion.includes(city));
      if (!matched) return null;
    }

    return this.userRepository.findOne({ where: { id: rule.target_user_id } });
  }

  private async matchByCaseType(lead: Lead, rule: LeadAssignment): Promise<User | null> {
    if (!rule.target_user_id) return null;
    if (!lead.case_type) return null;

    const conditions: CaseTypeCondition = JSON.parse(rule.conditions);
    const matched = conditions.case_types.includes(lead.case_type);

    if (!matched) return null;

    return this.userRepository.findOne({ where: { id: rule.target_user_id } });
  }

  private async matchByLoadBalance(lead: Lead, rule: LeadAssignment): Promise<User | null> {
    const conditions: LoadBalanceCondition = JSON.parse(rule.conditions);

    if (!conditions.user_ids || conditions.user_ids.length === 0) {
      return null;
    }

    const userId = this.getNextUserForLoadBalance(rule.id, conditions.user_ids);
    return this.userRepository.findOne({ where: { id: userId } });
  }

  private getNextUserForLoadBalance(ruleId: string, userIds: string[]): string {
    const currentIndex = this.loadBalanceIndex.get(ruleId) || 0;
    const nextIndex = (currentIndex + 1) % userIds.length;
    this.loadBalanceIndex.set(ruleId, nextIndex);
    return userIds[currentIndex];
  }

  private async assignLead(
    leadId: string,
    userId: string,
    ruleId: string,
    operatorId: string,
    reason?: string,
  ): Promise<Lead> {
    const lead = await this.leadRepository.findOne({ where: { id: leadId } });
    const oldUserId = lead.assign_sales_id;

    await this.leadRepository.update(leadId, {
      assign_sales_id: userId,
    });

    const log = this.assignmentLogRepository.create({
      lead_id: leadId,
      from_user_id: oldUserId,
      to_user_id: userId,
      assignment_rule_id: ruleId,
      reason: reason || '自动分配',
      operator_id: operatorId,
    });
    await this.assignmentLogRepository.save(log);

    return this.leadRepository.findOne({ where: { id: leadId } });
  }

  async reassignLead(
    leadId: string,
    newUserId: string,
    reason: string,
    operatorId: string,
  ): Promise<Lead> {
    const lead = await this.leadRepository.findOne({ where: { id: leadId } });
    const oldUserId = lead.assign_sales_id;

    await this.leadRepository.update(leadId, {
      assign_sales_id: newUserId,
    });

    const log = this.assignmentLogRepository.create({
      lead_id: leadId,
      from_user_id: oldUserId,
      to_user_id: newUserId,
      reason: reason,
      operator_id: operatorId,
    });
    await this.assignmentLogRepository.save(log);

    return this.leadRepository.findOne({ where: { id: leadId } });
  }

  async getAssignmentLogs(leadId: string): Promise<LeadAssignmentLog[]> {
    return this.assignmentLogRepository.find({
      where: { lead_id: leadId },
      order: { created_at: 'DESC' },
      relations: {
        from_user: true,
        to_user: true,
        operator: true,
        assignment_rule: true,
      },
    });
  }

  async getAvailableUsers(orgId: string): Promise<User[]> {
    return this.userRepository.find({
      where: {
        organization_id: orgId,
        status: true,
      },
      order: { real_name: 'ASC' },
    });
  }
}