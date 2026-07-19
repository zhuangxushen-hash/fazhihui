import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  ALIPAY = 'alipay',
  WECHAT = 'wechat',
  BANK = 'bank',
}

@Entity('payment_records')
export class PaymentRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  case_id: string;

  @Column({ nullable: false })
  client_id: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  amount: number;

  @Column({ type: 'varchar', default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'varchar', default: PaymentMethod.ALIPAY })
  method: PaymentMethod;

  @Column({ nullable: true })
  transaction_id: string;

  @Column({ nullable: true })
  remarks: string;

  @CreateDateColumn()
  created_at: Date;
}