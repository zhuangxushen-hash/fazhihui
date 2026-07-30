import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Organization } from '../user/organization.entity';

export enum ReconciliationStatus {
  DRAFT = 'draft',
  COMPLETED = 'completed',
  CONFIRMED = 'confirmed',
}

@Entity('reconciliations')
export class Reconciliation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, unique: true })
  reconciliation_no: string;

  @Column({ type: 'date', nullable: false })
  period_start: Date;

  @Column({ type: 'date', nullable: false })
  period_end: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total_receivable: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total_received: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total_overdue: number;

  @Column({ type: 'int', default: 0 })
  match_count: number;

  @Column({ type: 'int', default: 0 })
  mismatch_count: number;

  @Column({ type: 'varchar', default: ReconciliationStatus.DRAFT })
  status: ReconciliationStatus;

  @ManyToOne(() => Organization)
  organization: Organization;

  @Column()
  organization_id: string;

  @Column({ nullable: true })
  created_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}