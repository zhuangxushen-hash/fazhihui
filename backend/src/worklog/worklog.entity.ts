import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Organization } from '../user/organization.entity';

// 工作日志状态常量（使用 varchar，避免使用 enum）
export const WorklogStatus = {
  DRAFT: 'draft', // 草稿
  SUBMITTED: 'submitted', // 已提交
  APPROVED: 'approved', // 已通过
  REJECTED: 'rejected', // 已驳回
} as const;

@Entity('worklogs')
export class Worklog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 律师ID（记录创建人）
  @Column({ nullable: false })
  user_id: string;

  // 关联案件ID（可空）
  @Column({ nullable: true })
  case_id: string;

  // 工作日期
  @Column({ type: 'date', nullable: false })
  work_date: string;

  // 工作内容
  @Column({ type: 'text', nullable: false })
  content: string;

  // 工时（精度4位，小数1位，如 8.5）
  @Column({ type: 'decimal', precision: 4, scale: 1, default: 0 })
  work_hours: number;

  // 是否计费
  @Column({ default: true })
  billable: boolean;

  // 状态：draft 草稿 / submitted 已提交 / approved 已通过 / rejected 已驳回
  @Column({ type: 'varchar', length: 20, default: WorklogStatus.DRAFT })
  status: string;

  // 审批人ID（可空）
  @Column({ nullable: true })
  approver_id: string;

  // 审批意见（可空）
  @Column({ type: 'text', nullable: true })
  approve_comment: string;

  // 审批时间（可空）
  @Column({ type: 'datetime', nullable: true })
  approve_time: Date;

  // 日志类型：case_work办案/non_case_work非办案
  @Column({ type: 'varchar', default: 'case_work', comment: '日志类型' })
  log_type: string;

  // 关联账单ID
  @Column({ type: 'varchar', nullable: true, comment: '关联账单ID' })
  bill_id: string;

  // 关联任务ID（可空）
  @Column({ type: 'varchar', nullable: true, comment: '关联任务ID' })
  task_id: string;

  @ManyToOne(() => Organization)
  organization: Organization;

  @Column()
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
