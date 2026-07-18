import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Organization } from '../user/organization.entity';
import { Case } from '../case/case.entity';
import { Fee } from './fee.entity';

export enum RefundStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid',
}

@Entity('refunds')
export class Refund {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  case_id: string;

  @Column({ nullable: true })
  fee_id: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  amount: number;

  @Column({ type: 'text', nullable: false })
  reason: string;

  @Column({ type: 'varchar', default: RefundStatus.PENDING })
  status: RefundStatus;

  @Column({ nullable: true })
  evidence_files: string;

  @Column({ type: 'text', nullable: true })
  approval_note: string;

  @Column({ nullable: true })
  approved_by: string;

  @Column({ nullable: true })
  approved_at: Date;

  @ManyToOne(() => Organization)
  organization: Organization;

  @Column()
  organization_id: string;

  @ManyToOne(() => Case)
  case: Case;

  @ManyToOne(() => Fee)
  fee: Fee;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
