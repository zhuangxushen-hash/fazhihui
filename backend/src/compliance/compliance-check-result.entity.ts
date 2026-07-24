import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

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

// 目标对象类型，例如 marketing_content / sales_compliance / signing_compliance
export type TargetType = 'marketing_content' | 'sales_compliance' | 'signing_compliance';

@Entity('compliance_check_results')
export class ComplianceCheckResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  rule_id: string;

  @Column({ type: 'varchar', nullable: false })
  target_type: TargetType;

  @Column({ type: 'varchar', nullable: false })
  target_id: string;

  @Column({ type: 'varchar', nullable: false })
  check_result: CheckResultType;

  @Column({ type: 'text', nullable: true })
  violation_content: string;

  @Column({ type: 'varchar', nullable: true })
  handler_id: string;

  @Column({ type: 'varchar', default: 'pending' })
  handle_status: HandleStatus;

  @Column({ type: 'text', nullable: true })
  handle_note: string;

  // 标记是否为巡检产生的预警记录
  @Column({ type: 'boolean', default: false })
  is_inspection: boolean;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'datetime', nullable: true })
  handled_at: Date;
}
