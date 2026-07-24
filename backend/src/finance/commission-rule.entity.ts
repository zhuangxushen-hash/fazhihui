import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Organization } from '../user/organization.entity';

// 阶梯规则子结构
export interface TierRule {
  min_amount: number; // 最低金额
  max_amount: number; // 最高金额
  commission_value: number; // 提成值（金额或比例）
}

// 提成类型
export enum CommissionType {
  FIXED = 'fixed', // 固定金额
  PERCENTAGE = 'percentage', // 比例
}

// 角色类型（扩展自UserRole，增加更细分的角色）
export enum CommissionRoleType {
  MARKETING = 'marketing', // 投放岗
  INVITE = 'invite', // 邀约岗
  SALES = 'sales', // 谈案岗
  MAIN_LAWYER = 'main_lawyer', // 主办律师
  ASSIST_LAWYER = 'assist_lawyer', // 协办律师
  ASSISTANT = 'assistant', // 助理
}

@Entity('commission_rules')
export class CommissionRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  name: string;

  @Column({ type: 'varchar', nullable: false })
  role_type: CommissionRoleType;

  @Column({ type: 'varchar', nullable: false })
  commission_type: CommissionType;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  commission_value: number;

  // 阶梯规则JSON
  @Column({ type: 'text', nullable: true })
  tier_rules: string; // JSON string of TierRule[]

  // 是否启用
  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  // 适用案由（可选，为空表示所有案由）
  @Column({ type: 'varchar', nullable: true })
  case_type: string;

  // 描述
  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => Organization, { nullable: true })
  organization: Organization;

  @Column({ nullable: true })
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}