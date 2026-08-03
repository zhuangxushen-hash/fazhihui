import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from '../user/organization.entity';
import { ManyToOne } from 'typeorm';

// 请假类型常量（使用 varchar，避免使用 enum）
export const LeaveType = {
  PERSONAL: 'personal', // 事假
  SICK: 'sick', // 病假
  ANNUAL: 'annual', // 年假
  MATERNITY: 'maternity', // 产假
  OTHER: 'other', // 其他
} as const;

// 请假状态常量（使用 varchar，避免使用 enum）
export const LeaveStatus = {
  PENDING: 'pending', // 待审批
  APPROVED: 'approved', // 已批准
  REJECTED: 'rejected', // 已驳回
  CANCELLED: 'cancelled', // 已撤销
} as const;

@Entity('hr_leaves')
export class HrLeave {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 申请人ID
  @Column({ nullable: false })
  user_id: string;

  // 请假类型：personal事假 / sick病假 / annual年假 / maternity产假 / other其他
  @Column({ type: 'varchar', length: 20, default: LeaveType.PERSONAL })
  leave_type: string;

  // 开始日期
  @Column({ type: 'date' })
  start_date: string;

  // 结束日期
  @Column({ type: 'date' })
  end_date: string;

  // 请假天数
  @Column({ type: 'decimal', precision: 5, scale: 1, default: 1 })
  days: number;

  // 请假原因
  @Column({ type: 'text', nullable: true })
  reason: string;

  // 状态：pending待审批 / approved已批准 / rejected已驳回 / cancelled已撤销
  @Column({ type: 'varchar', length: 20, default: LeaveStatus.PENDING })
  status: string;

  // 审批人ID
  @Column({ nullable: true })
  approver_id: string;

  // 审批意见
  @Column({ type: 'text', nullable: true })
  approve_comment: string;

  // 审批时间
  @Column({ type: 'datetime', nullable: true })
  approve_time: Date;

  @ManyToOne(() => Organization)
  organization: Organization;

  @Column()
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
