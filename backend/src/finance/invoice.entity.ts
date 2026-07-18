import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum InvoiceStatus {
  PENDING = 'pending',
  ISSUED = 'issued',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

@Entity('invoices')
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

  @Column()
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
