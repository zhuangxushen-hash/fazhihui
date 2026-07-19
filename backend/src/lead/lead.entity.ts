import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Organization } from '../user/organization.entity';
import { User } from '../user/user.entity';
import { FollowUp } from './follow-up.entity';
import { LeadSource, LeadStatus, CaseType } from '../types';

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  source_channel: LeadSource;

  @Column({ nullable: true })
  source_keyword: string;

  @Column({ type: 'varchar', nullable: true })
  case_type: CaseType;

  @Column({ type: 'varchar', default: LeadStatus.NEW })
  status: LeadStatus;

  @Column({ nullable: true })
  assign_sales_id: string;

  @Column({ nullable: false })
  phone: string;

  @Column({ nullable: true })
  contact_name: string;

  @Column({ type: 'text', nullable: true })
  case_description: string;

  @Column({ nullable: true })
  landing_page: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  service_fee: number;

  @ManyToOne(() => Organization, org => org.leads)
  organization: Organization;

  @Column()
  organization_id: string;

  @ManyToOne(() => User, user => user.assigned_leads)
  assign_sales: User;

  @OneToMany(() => FollowUp, followUp => followUp.lead)
  follow_ups: FollowUp[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ nullable: true })
  follow_up_time: Date;
}
