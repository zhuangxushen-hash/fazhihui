import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../user/user.entity';
import { ApprovalRequest } from './approval-request.entity';

// 审批步骤记录
@Entity('approval_steps')
export class ApprovalStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 申请ID
  @Column({ nullable: false })
  request_id: string;

  @ManyToOne(() => ApprovalRequest, request => request.steps)
  @JoinColumn({ name: 'request_id' })
  request: ApprovalRequest;

  // 步骤顺序
  @Column({ type: 'int', nullable: false })
  step_order: number;

  // 审批人ID
  @Column({ nullable: false })
  approver_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approver_id' })
  approver: User;

  // 审批结果：pending待审批 / approved已通过 / rejected已驳回
  @Column({ type: 'varchar', default: 'pending' })
  result: string;

  // 审批意见（可空）
  @Column({ type: 'text', nullable: true })
  comment: string;

  // 审批时间（可空）
  @Column({ type: 'datetime', nullable: true })
  approve_time: Date;

  @CreateDateColumn()
  created_at: Date;
}
