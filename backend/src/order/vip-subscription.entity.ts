import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// VIP套餐类型：month 月卡 / quarter 季卡 / half_year 半年卡 / year 年卡
export const VIP_PLAN = {
  MONTH: 'month',
  QUARTER: 'quarter',
  HALF_YEAR: 'half_year',
  YEAR: 'year',
} as const;

// VIP订阅状态：active 生效中 / expired 已过期 / cancelled 已取消
export const VIP_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const;

@Entity('vip_subscriptions')
export class VipSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 订阅用户ID
  @Column({ type: 'varchar', nullable: false, comment: '订阅用户ID' })
  user_id: string;

  // 关联订单ID
  @Column({ type: 'varchar', nullable: true, comment: '关联订单ID' })
  order_id: string;

  // 套餐类型
  @Column({ type: 'varchar', default: VIP_PLAN.MONTH, comment: '套餐类型' })
  plan_type: string;

  // 订阅时长（月）
  @Column({ type: 'int', default: 1, comment: '订阅时长(月)' })
  months: number;

  // 订阅金额
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, comment: '订阅金额' })
  amount: number;

  // 生效日期
  @Column({ type: 'date', nullable: true, comment: '生效日期' })
  start_date: string;

  // 到期日期
  @Column({ type: 'date', nullable: true, comment: '到期日期' })
  end_date: string;

  // 订阅状态
  @Column({ type: 'varchar', default: VIP_STATUS.ACTIVE, comment: '订阅状态' })
  status: string;

  @Column({ type: 'varchar', comment: '机构ID' })
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
