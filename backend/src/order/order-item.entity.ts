import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 关联订单ID
  @Column({ type: 'varchar', nullable: false, comment: '订单ID' })
  order_id: string;

  // 商品名称
  @Column({ type: 'varchar', nullable: false, comment: '商品名称' })
  item_name: string;

  // 商品类型（vip_month/vip_quarter/vip_half_year/vip_year/product）
  @Column({ type: 'varchar', nullable: true, comment: '商品类型' })
  item_type: string;

  // 单价
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, comment: '单价' })
  unit_price: number;

  // 数量
  @Column({ type: 'int', default: 1, comment: '数量' })
  quantity: number;

  // 小计金额
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, comment: '小计金额' })
  amount: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
