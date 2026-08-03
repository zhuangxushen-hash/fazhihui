import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// 催款状态：pending 待催款 / reminding 催款中 / paid 已回款 / given_up 已放弃
export const REMINDER_STATUS = {
  PENDING: 'pending',
  REMINDING: 'reminding',
  PAID: 'paid',
  GIVEN_UP: 'given_up',
} as const;

@Entity('payment_reminders')
export class PaymentReminder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  case_id: string; // 关联案件（可空）

  // 关联应收台账ID（可空，用于 markPaid 回写应收）
  @Column({ type: 'varchar', nullable: true, comment: '关联应收台账ID' })
  receivable_id: string;

  @Column({ type: 'varchar', nullable: false })
  client_name: string; // 客户名

  @Column({ type: 'varchar', nullable: true })
  client_phone: string; // 客户电话（可空）

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  receivable_amount: number; // 应收金额

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  received_amount: number; // 已收金额

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  overdue_amount: number; // 欠款金额

  @Column({ type: 'int', default: 0 })
  reminder_count: number; // 催款次数

  @Column({ type: 'date', nullable: true })
  last_reminder_date: Date; // 上次催款日期

  @Column({ type: 'date', nullable: true })
  next_reminder_date: Date; // 下次催款日期

  @Column({ type: 'varchar', default: REMINDER_STATUS.PENDING })
  status: string; // 催款状态

  @Column({ type: 'text', nullable: true })
  remarks: string; // 备注（可空）

  @Column()
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
