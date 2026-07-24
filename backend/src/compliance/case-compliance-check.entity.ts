import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Case } from '../case/case.entity';
import { User } from '../user/user.entity';

// 5.4 办案交付合规检查类型
export enum CaseCheckType {
  SOP_NODE = 'sop_node', // SOP强制节点
  OVERDUE_WARNING = 'overdue_warning', // 超期预警
  DOCUMENT_INSPECTION = 'document_inspection', // 文书巡检
  EVIDENCE_INSPECTION = 'evidence_inspection', // 证据巡检
  PERSONNEL_CHANGE = 'personnel_change', // 人员变更
}

// 检查结果
export enum CaseCheckResult {
  PASS = 'pass',
  WARNING = 'warning',
  VIOLATION = 'violation',
}

// 风险等级
export enum CaseRiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

// 处理状态
export enum CaseCheckHandleStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  IGNORED = 'ignored',
}

@Entity('case_compliance_checks')
export class CaseComplianceCheck {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  case_id: string;

  @ManyToOne(() => Case, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'case_id' })
  case: Case;

  @Column({ type: 'varchar', nullable: false })
  check_type: CaseCheckType;

  @Column({ type: 'varchar', nullable: false })
  check_result: CaseCheckResult;

  @Column({ type: 'varchar', default: CaseRiskLevel.LOW })
  risk_level: CaseRiskLevel;

  @Column({ type: 'text', nullable: true })
  violation_detail: string;

  @Column({ type: 'varchar', nullable: true })
  handler_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'handler_id' })
  handler: User;

  @Column({ type: 'varchar', default: CaseCheckHandleStatus.PENDING })
  handle_status: CaseCheckHandleStatus;

  @Column({ type: 'text', nullable: true })
  handle_note: string;

  // 关联来源ID（如 SOP节点ID、预警ID、巡检任务ID等）
  @Column({ type: 'varchar', nullable: true })
  source_id: string;

  @Column({ type: 'varchar', nullable: true })
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'datetime', nullable: true })
  handled_at: Date;
}
