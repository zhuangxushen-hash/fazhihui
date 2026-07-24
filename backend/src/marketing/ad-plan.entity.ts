import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Organization } from '../user/organization.entity';
import { User } from '../user/user.entity';
import { AdPlanStatus } from '../types';

/**
 * 投放计划实体
 * 关联广告账户、案由、预算、出价、状态、平台计划ID、起止时间等
 */
@Entity('ad_plans')
@Index(['organization_id', 'status'])
@Index(['organization_id', 'account_id'])
@Index(['organization_id', 'case_type'])
export class AdPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 关联广告账户ID（与 AdAccount.id 关联）
  @Column({ nullable: false })
  account_id: string;

  // 计划名称
  @Column({ nullable: false })
  plan_name: string;

  // 案由（与 CaseType 保持一致：marriage/traffic/labor/debt/other）
  @Column({ type: 'varchar', nullable: false })
  case_type: string;

  // 预算（单位：元/天）
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  budget: number;

  // 出价（单位：元）
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  bid: number;

  // 计划状态
  @Column({ type: 'varchar', default: AdPlanStatus.PAUSED })
  status: AdPlanStatus;

  // 平台返回的计划ID（用于与平台API对接）
  @Column({ nullable: true })
  platform_plan_id: string;

  // 投放开始日期
  @Column({ type: 'date', nullable: true })
  start_date: Date;

  // 投放结束日期
  @Column({ type: 'date', nullable: true })
  end_date: Date;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column()
  organization_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'creator_id' })
  creator: User;

  // 创建人ID
  @Column({ nullable: true })
  creator_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
