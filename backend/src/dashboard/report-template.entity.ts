import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from '../user/organization.entity';
import { User } from '../user/user.entity';

/**
 * 自定义报表模板实体
 * 支持动态维度+指标组合，可订阅定时推送
 */
@Entity('report_templates')
export class ReportTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 模板名称
  @Column({ type: 'varchar', nullable: false })
  name: string;

  // 模板描述
  @Column({ type: 'text', nullable: true })
  description: string;

  // 维度配置（JSON 字符串：渠道/平台/案由/律师/团队/月份）
  @Column({ type: 'text', nullable: false })
  dimensions: string;

  // 指标配置（JSON 字符串：营收/成本/利润/线索量/签约量/案件数）
  @Column({ type: 'text', nullable: false })
  metrics: string;

  // 时间范围（7d/30d/90d/custom）
  @Column({ type: 'varchar', default: '30d' })
  time_range: string;

  // 自定义开始时间（time_range=custom 时使用）
  @Column({ type: 'datetime', nullable: true })
  custom_start_date: Date;

  // 自定义结束时间（time_range=custom 时使用）
  @Column({ type: 'datetime', nullable: true })
  custom_end_date: Date;

  // 订阅人ID数组（JSON 字符串）
  @Column({ type: 'text', nullable: true })
  subscriber_ids: string;

  // 订阅频率（daily/weekly/monthly）
  @Column({ type: 'varchar', nullable: true })
  subscription_frequency: string;

  // 创建人ID
  @Column({ type: 'varchar', nullable: false })
  created_by: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column()
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
