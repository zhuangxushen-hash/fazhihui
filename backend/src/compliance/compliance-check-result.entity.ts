import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from '../user/organization.entity';
import { User } from '../user/user.entity';

export enum CheckResultType {
  PASS = 'pass',
  REVIEW = 'review',
  REJECT = 'reject',
}

export enum HandleStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  IGNORED = 'ignored',
}

// 合规检查大类枚举（对齐 ComplianceType + 办案 + 财务 ）
export type ComplianceDomain =
  | 'marketing'
  | 'sales'
  | 'signing'
  | 'case'
  | 'finance'
  | 'general'
  | 'contract'
  | 'talk'
  | 'seal';

// 检查细项类型（子分类），兼容原 CaseCheckType/FinanceCheckType/ComplianceType
export type CheckKind =
  | 'sop_node'
  | 'overdue_warning'
  | 'document_inspection'
  | 'evidence_inspection'
  | 'personnel_change'
  | 'receivable'
  | 'invoice'
  | 'commission'
  | 'marketing_content'
  | 'sales_pitch'
  | 'signing_risk'
  | 'contract_term'
  | 'talk_quality'
  | 'seal_use'
  | 'custom';

// 风险等级
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

// 目标对象类型，兼容旧三表的target + case_id/receivable/invoice/commission等
export type TargetType =
  | 'marketing_content'
  | 'sales_compliance'
  | 'signing_compliance'
  | 'case_compliance'
  | 'finance_compliance'
  | 'case_sop_node'
  | 'receivable'
  | 'invoice'
  | 'commission'
  | 'talk_session'
  | 'seal_application'
  | 'contract'
  | 'general';

@Entity('compliance_check_results')
export class ComplianceCheckResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ========== 通用主键字段 ==========
  @Column({ type: 'varchar', nullable: true })
  rule_id: string;

  @Column({ type: 'varchar', nullable: false, default: 'general' })
  target_type: TargetType;

  @Column({ type: 'varchar', nullable: true })
  target_id: string;

  // 检查领域大分类（取代原 ComplianceRecord.type、CaseComplianceCheck/FinanceComplianceCheck）
  @Column({ type: 'varchar', nullable: true, default: 'general' })
  domain: ComplianceDomain;

  // 检查细分类型（兼容原 case_check_type / finance_check_type / ComplianceType）
  @Column({ type: 'varchar', nullable: true })
  check_type: CheckKind;

  // ========== 结果字段 ==========
  @Column({ type: 'varchar', nullable: false, default: CheckResultType.PASS })
  check_result: CheckResultType;

  // 风险等级
  @Column({ type: 'varchar', default: 'low' })
  risk_level: RiskLevel;

  // 原始检查内容（原 ComplianceRecord.content）
  @Column({ type: 'text', nullable: true })
  content: string;

  // 违规明细（原 violation_detail/violation_content/warning_content 统一）
  @Column({ type: 'text', nullable: true })
  violation_detail: string;

  // 兼容列名保留：违规内容别名，避免老代码报错
  @Column({ type: 'text', nullable: true })
  violation_content: string;

  // 违规类型标签（原 ComplianceRecord.violation_type）
  @Column({ nullable: true })
  violation_type: string;

  // 整改/优化建议（原 ComplianceRecord.suggestion / FinanceComplianceCheck.suggestion）
  @Column({ type: 'text', nullable: true })
  suggestion: string;

  // 关联来源ID（原 source_id：SOP节点ID、预警ID、巡检任务ID等）
  @Column({ type: 'varchar', nullable: true })
  source_id: string;

  // 关联案件ID（办案/财务/签约/用印均会用到）
  @Column({ type: 'varchar', nullable: true })
  case_id: string;

  // ========== 处理流程 ==========
  // 处理人ID
  @Column({ type: 'varchar', nullable: true })
  handler_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'handler_id' })
  handler: User;

  @Column({ type: 'varchar', default: 'pending' })
  handle_status: HandleStatus;

  @Column({ type: 'text', nullable: true })
  handle_note: string;

  // 操作人ID（原 ComplianceRecord.operator_id，谁触发的本次检查）
  @Column({ type: 'varchar', nullable: true })
  operator_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'operator_id' })
  operator: User;

  // 组织归属
  @Column({ type: 'varchar', nullable: true })
  organization_id: string;

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  // 标记是否为巡检产生的预警记录
  @Column({ type: 'boolean', default: false })
  is_inspection: boolean;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'datetime', nullable: true })
  handled_at: Date;
}
