import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from '../user/organization.entity';
import { User } from '../user/user.entity';
import { Case } from '../case/case.entity';
import { CommissionRule, CommissionRoleType } from './commission-rule.entity';

// 分润状态
export enum CommissionStatus {
  PENDING = 'pending', // 待发放
  PAID = 'paid', // 已发放
}

@Entity('commission_records')
export class CommissionRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Case, { nullable: false })
  @JoinColumn({ name: 'case_id' })
  case: Case;

  @Column({ nullable: false })
  case_id: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: false })
  user_id: string;

  @Column({ type: 'varchar', nullable: false })
  role_type: CommissionRoleType;

  @ManyToOne(() => CommissionRule, { nullable: false })
  @JoinColumn({ name: 'rule_id' })
  rule: CommissionRule;

  @Column({ nullable: false })
  rule_id: string;

  // 基础金额（用于计算提成的基数）
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  base_amount: number;

  // 提成金额
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  commission_amount: number;

  // 状态
  @Column({ type: 'varchar', default: CommissionStatus.PENDING })
  status: CommissionStatus;

  // 发放时间
  @Column({ nullable: true })
  paid_at: Date;

  // 备注
  @Column({ type: 'text', nullable: true })
  remarks: string;

  @ManyToOne(() => Organization, { nullable: true })
  organization: Organization;

  @Column({ nullable: true })
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}