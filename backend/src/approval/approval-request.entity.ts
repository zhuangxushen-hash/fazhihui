import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Organization } from '../user/organization.entity';
import { User } from '../user/user.entity';
import { ApprovalStep } from './approval-step.entity';

// 审批申请
@Entity('approval_requests')
export class ApprovalRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 申请标题
  @Column({ type: 'varchar', nullable: false })
  title: string;

  // 审批类型：seal用印 / case立案 / contract合同 / finance财务 / other其他
  @Column({ type: 'varchar', nullable: false })
  type: string;

  // 发起人ID
  @Column({ nullable: false })
  applicant_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'applicant_id' })
  applicant: User;

  // 关联类型（可空）
  @Column({ type: 'varchar', nullable: true })
  target_type: string;

  // 关联ID（可空）
  @Column({ type: 'varchar', nullable: true })
  target_id: string;

  // 申请内容
  @Column({ type: 'json', nullable: true })
  content: any;

  // 状态：pending待审批 / approved已通过 / rejected已驳回 / cancelled已撤销
  @Column({ type: 'varchar', default: 'pending' })
  status: string;

  // 当前步骤序号，默认0
  @Column({ type: 'int', default: 0 })
  current_step: number;

  @Column({ nullable: true })
  organization_id: string;

  @ManyToOne(() => Organization)
  organization: Organization;

  @OneToMany(() => ApprovalStep, step => step.request)
  steps: ApprovalStep[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
