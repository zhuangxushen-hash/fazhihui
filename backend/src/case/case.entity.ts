import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Organization } from '../user/organization.entity';
import { User } from '../user/user.entity';
import { Document } from './document.entity';
import { CaseType, CaseStatus } from '../types';

@Entity('cases')
export class Case {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  case_type: CaseType;

  @Column({ type: 'varchar', default: CaseStatus.PENDING_ASSIGN })
  status: CaseStatus;

  @Column({ nullable: false })
  client_id: string;

  @Column({ nullable: true })
  assignee_lawyer_id: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  fee_amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  amount: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  deadline: Date;

  @Column({ nullable: true })
  court: string;

  @Column({ nullable: true })
  case_no: string;

  @Column({ nullable: true })
  client_name: string;

  @Column({ nullable: true })
  client_phone: string;

  @Column({ nullable: true })
  filing_date: Date;

  @Column({ nullable: true })
  expected_close_date: Date;

  @Column({ type: 'varchar', default: 'low' })
  risk_level: string;

  @Column({ type: 'text', nullable: true })
  risk_notes: string;

  @Column({ type: 'boolean', default: false })
  is_overdue: boolean;

  @ManyToOne(() => Organization, org => org.cases)
  organization: Organization;

  @Column()
  organization_id: string;

  @ManyToOne(() => User, user => user.assigned_cases)
  assignee_lawyer: User;

  @OneToMany(() => Document, document => document.case)
  documents: Document[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
