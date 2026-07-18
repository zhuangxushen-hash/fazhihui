import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export type SOPStatus = 'pending' | 'completed' | 'overdue';

@Entity('case_sop')
export class CaseSOP {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  case_id: string;

  @Column({ type: 'varchar', nullable: false })
  case_type: string;

  @Column({ type: 'varchar', nullable: false })
  step_name: string;

  @Column({ type: 'int', nullable: false })
  step_order: number;

  @Column({ type: 'varchar', default: 'pending' })
  status: SOPStatus;

  @Column({ type: 'datetime', nullable: false })
  deadline: Date;

  @Column({ type: 'datetime', nullable: true })
  completed_time: Date;

  @Column({ type: 'varchar', nullable: true })
  operator_id: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  evidence_check_result: string;

  @Column({ type: 'boolean', default: false })
  evidence_verified: boolean;

  @Column({ type: 'varchar', nullable: false })
  organization_id: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}