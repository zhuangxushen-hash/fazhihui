import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// 订单类型：vip VIP订阅 / product 产品购买
export const ORDER_TYPE = {
  VIP: 'vip',
  PRODUCT: 'product',
} as const;

// 订单状态：pending 待支付 / paid 已支付 / completed 已完成 / cancelled 已取消 / refunded 已退款
export const ORDER_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 订单编号（自动生成，如 ORD202608130001）
  @Column({ type: 'varchar', unique: true, comment: '订单编号' })
  order_no: string;

  // 下单用户ID
  @Column({ type: 'varchar', nullable: false, comment: '下单用户ID' })
  user_id: string;

  // 订单类型
  @Column({ type: 'varchar', default: ORDER_TYPE.PRODUCT, comment: '订单类型' })
  order_type: string;

  // 订单标题
  @Column({ type: 'varchar', nullable: false, comment: '订单标题' })
  title: string;

  // 订单金额
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, comment: '订单金额' })
  total_amount: number;

  // 订单状态
  @Column({ type: 'varchar', default: ORDER_STATUS.PENDING, comment: '订单状态' })
  status: string;

  // 支付方式：wechat 微信 / alipay 支付宝 / bank 对公转账
  @Column({ type: 'varchar', nullable: true, comment: '支付方式' })
  pay_method: string;

  // 支付时间
  @Column({ type: 'datetime', nullable: true, comment: '支付时间' })
  pay_time: Date;

  // 备注
  @Column({ type: 'text', nullable: true, comment: '备注' })
  remark: string;

  @Column({ type: 'varchar', comment: '机构ID' })
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
