import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Organization } from '../user/organization.entity';
import { User } from '../user/user.entity';

// 5.6 财务税务合规校验类型
export enum FinanceCheckType {
  RECEIVABLE = 'receivable', // 收费校验
  INVOICE = 'invoice', // 发票校验
  COMMISSION = 'commission', // 分润校验
}

// 校验目标对象类型
export enum FinanceTargetType {
  RECEIVABLE = 'receivable',
  INVOICE = 'invoice',
  COMMISSION = 'commission',
}

// 校验结果
export enum FinanceCheckResult {
  PASS = 'pass',
  WARNING = 'warning',
  VIOLATION = 'violation',
}

// 处理状态
export enum FinanceHandleStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  IGNORED = 'ignored',
}

@Entity('finance_compliance_checks')
export class FinanceComplianceCheck {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 校验类型：收费校验 / 发票校验 / 分润校验
  @Column({ type: 'varchar', nullable: false })
  check_type: FinanceCheckType;

  // 目标对象类型：receivable / invoice / commission
  @Column({ type: 'varchar', nullable: false })
  target_type: FinanceTargetType;

  // 目标对象 ID
  @Column({ type: 'varchar', nullable: false })
  target_id: string;

  // 案件 ID（便于关联查询）
  @Column({ type: 'varchar', nullable: true })
  case_id: string;

  // 校验结果：pass / warning / violation
  @Column({ type: 'varchar', nullable: false })
  check_result: FinanceCheckResult;

  // 预警内容
  @Column({ type: 'text', nullable: true })
  warning_content: string;

  // 整改建议
  @Column({ type: 'text', nullable: true })
  suggestion: string;

  // 处理人 ID
  @Column({ type: 'varchar', nullable: true })
  handler_id: string;

  // 处理状态：pending / processed / ignored
  @Column({ type: 'varchar', default: FinanceHandleStatus.PENDING })
  handle_status: FinanceHandleStatus;

  // 处理备注
  @Column({ type: 'text', nullable: true })
  handle_note: string;

  @ManyToOne(() => Organization, { nullable: true })
  organization: Organization;

  @Column({ nullable: true })
  organization_id: string;

  @ManyToOne(() => User, { nullable: true })
  handler: User;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'datetime', nullable: true })
  handled_at: Date;
}
