import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Organization } from '../user/organization.entity';
import { Receivable } from './receivable.entity';

export enum WarningStatus {
  PENDING = 'pending', // 待处理
  NOTIFIED = 'notified', // 已通知
  RESOLVED = 'resolved', // 已解决
}

@Entity('overdue_warnings')
export class OverdueWarning {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  receivable_id: string;

  @Column({ nullable: false })
  case_id: string;

  @Column({ nullable: true })
  installment_id: string; // 分期ID（如果是分期逾期）

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  overdue_amount: number; // 逾期金额

  @Column({ type: 'integer', default: 0 })
  overdue_days: number; // 逾期天数

  @Column({ type: 'date', nullable: false })
  due_date: Date; // 应收日期

  @Column({ type: 'varchar', default: WarningStatus.PENDING })
  status: WarningStatus;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @ManyToOne(() => Organization)
  organization: Organization;

  @Column()
  organization_id: string;

  @ManyToOne(() => Receivable)
  receivable: Receivable;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}