import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Organization } from '../user/organization.entity';
import { AdChannel, ConversionEventType } from '../types';

/**
 * 转化事件实体
 * 记录全链路四级转化（线索→加微→邀约→签约）的回传数据
 * 通过 channel/account_id/plan_id/material_id/keyword 多维度归因
 */
@Entity('conversion_events')
@Index(['organization_id', 'channel'])
@Index(['organization_id', 'account_id'])
@Index(['organization_id', 'plan_id'])
@Index(['organization_id', 'material_id'])
@Index(['organization_id', 'created_at'])
export class ConversionEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  channel: AdChannel;

  // 投放账户ID（与 Task 1.1 创建的 AdAccount 通过 account_id 字符串字段松耦合关联）
  @Column({ nullable: true })
  account_id: string;

  // 投放计划ID（与 Task 1.2 创建的 AdPlan 通过 plan_id 字符串字段松耦合关联）
  @Column({ nullable: true })
  plan_id: string;

  // 投放素材ID（与本模块的 AdMaterial 关联）
  @Column({ nullable: true })
  material_id: string;

  @Column({ type: 'varchar', nullable: false })
  event_type: ConversionEventType;

  // 回款金额（仅 sign 事件使用，单位：元）
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amount: number;

  // 触发关键词（用于关键词维度 ROI 统计）
  @Column({ nullable: true })
  keyword: string;

  // 关联客户ID（自动从线索/案件数据回填）
  @Column({ nullable: true })
  client_id: string;

  // 关联线索ID（自动回填）
  @Column({ nullable: true })
  lead_id: string;

  // 关联案件ID（仅 sign 事件可能携带）
  @Column({ nullable: true })
  case_id: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column()
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;
}
