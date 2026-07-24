import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../user/user.entity';
import { AdPlan } from './ad-plan.entity';
import { AdPlanOperationType } from '../types';

/**
 * 投放计划操作日志
 * 记录所有对投放计划的操作（CRUD、批量启停、预算调整、复制迁移等）
 */
@Entity('ad_plan_logs')
@Index(['plan_id', 'created_at'])
@Index(['operator_id', 'created_at'])
export class AdPlanLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 关联投放计划ID
  @Column({ nullable: false })
  plan_id: string;

  // 操作人ID
  @Column({ nullable: false })
  operator_id: string;

  // 操作类型
  @Column({ type: 'varchar', nullable: false })
  operation_type: AdPlanOperationType;

  // 操作详情（JSON 字符串，记录前后值、批量ID等）
  @Column({ type: 'text', nullable: true })
  operation_detail: string;

  @ManyToOne(() => AdPlan)
  @JoinColumn({ name: 'plan_id' })
  plan: AdPlan;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'operator_id' })
  operator: User;

  @CreateDateColumn()
  created_at: Date;
}
