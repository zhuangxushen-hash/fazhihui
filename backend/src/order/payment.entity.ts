import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// 支付状态：pending 待支付 / success 支付成功 / failed 支付失败 / refunded 已退款
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 关联订单ID
  @Column({ type: 'varchar', nullable: false, comment: '订单ID' })
  order_id: string;

  // 支付流水号（自动生成，如 PAY202608130001）
  @Column({ type: 'varchar', unique: true, comment: '支付流水号' })
  payment_no: string;

  // 支付金额
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, comment: '支付金额' })
  amount: number;

  // 支付方式：wechat 微信 / alipay 支付宝 / bank 对公转账
  @Column({ type: 'varchar', nullable: true, comment: '支付方式' })
  method: string;

  // 支付状态
  @Column({ type: 'varchar', default: PAYMENT_STATUS.PENDING, comment: '支付状态' })
  status: string;

  // 第三方支付流水号
  @Column({ type: 'varchar', nullable: true, comment: '第三方支付流水号' })
  transaction_id: string;

  // 支付时间
  @Column({ type: 'datetime', nullable: true, comment: '支付时间' })
  paid_at: Date;

  // 支付人ID
  @Column({ type: 'varchar', nullable: true, comment: '支付人ID' })
  payer_id: string;

  @Column({ type: 'varchar', comment: '机构ID' })
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
