import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from 'typeorm';

export enum InvoiceStatus {
  PENDING = 'pending',
  ISSUED = 'issued',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

@Entity('invoices')
@Index(['organization_id'])
@Index(['status'])
@Index(['created_at'])
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  case_id: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  amount: number;

  @Column({ type: 'varchar', nullable: true })
  invoice_no: string;

  @Column({ type: 'varchar', default: 'pending' })
  status: InvoiceStatus;

  @Column({ type: 'varchar', nullable: true })
  invoice_type: string;

  @Column({ type: 'varchar', nullable: true })
  payer_name: string;

  @Column({ type: 'varchar', nullable: true })
  payer_tax_id: string;

  @Column({ type: 'varchar', nullable: true })
  payer_address: string;

  @Column({ type: 'varchar', nullable: true })
  payer_bank: string;

  @Column({ type: 'varchar', nullable: true })
  payer_account: string;

  @Column({ type: 'date', nullable: true })
  issue_date: Date;

  @Column({ type: 'date', nullable: true })
  due_date: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // ===== 发票管理增强字段（保留原有字段，新增字段使用 varchar）=====
  @Column({ type: 'varchar', nullable: true })
  buyer_name: string; // 购方名称

  @Column({ type: 'varchar', nullable: true })
  buyer_tax_no: string; // 购方税号

  @Column({ type: 'varchar', nullable: true })
  buyer_address: string; // 购方地址（可空）

  @Column({ type: 'varchar', nullable: true })
  buyer_phone: string; // 购方电话（可空）

  @Column({ type: 'varchar', nullable: true })
  buyer_bank: string; // 购方开户行（可空）

  @Column({ type: 'varchar', nullable: true })
  buyer_account: string; // 购方账号（可空）

  @Column({ type: 'varchar', nullable: true })
  seller_name: string; // 销方名称

  @Column({ type: 'varchar', nullable: true })
  seller_tax_no: string; // 销方税号（可空）

  @Column({ type: 'decimal', precision: 4, scale: 2, default: 0.06 })
  tax_rate: number; // 税率，默认0.06

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  tax_amount: number; // 税额

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total_amount: number; // 价税合计

  @Column({ type: 'text', nullable: true })
  void_reason: string; // 作废原因（可空）

  @Column({ type: 'date', nullable: true })
  void_date: Date; // 作废日期（可空）

  // 冲红原因
  @Column({ type: 'text', nullable: true, comment: '冲红原因' })
  red_flush_reason: string;

  // 冲红日期
  @Column({ type: 'date', nullable: true, comment: '冲红日期' })
  red_flush_date: Date;

  // 退款金额
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, comment: '退款金额' })
  refund_amount: number;

  // 退款日期
  @Column({ type: 'date', nullable: true, comment: '退款日期' })
  refund_date: Date;

  // 税盘编号
  @Column({ type: 'varchar', nullable: true, comment: '税盘编号' })
  tax_disk_no: string;

  // 调账记录（JSON字符串）
  @Column({ type: 'text', nullable: true, comment: '调账记录JSON' })
  adjustment_records: string;

  @Column()
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date;
}
