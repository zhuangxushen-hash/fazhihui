import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Organization } from '../user/organization.entity';
import { Case } from '../case/case.entity';
import { ComplaintType, ComplaintStatus } from '../types';

@Entity('complaints')
export class Complaint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  type: ComplaintType;

  @Column({ type: 'text', nullable: false })
  content: string;

  @Column({ type: 'varchar', default: ComplaintStatus.NEW })
  status: ComplaintStatus;

  @Column({ nullable: false })
  client_id: string;

  @Column({ nullable: false })
  client_name: string;

  @Column({ nullable: false })
  client_phone: string;

  @Column({ nullable: true })
  evidence_files: string;

  @Column({ nullable: true })
  case_id: string;

  @Column({ nullable: true })
  assignee_id: string;

  @Column({ type: 'text', nullable: true })
  process_note: string;

  @Column({ type: 'text', nullable: true })
  resolution: string;

  @Column({ nullable: true })
  satisfaction_score: number;

  @ManyToOne(() => Organization)
  organization: Organization;

  @Column()
  organization_id: string;

  @ManyToOne(() => Case)
  case: Case;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
