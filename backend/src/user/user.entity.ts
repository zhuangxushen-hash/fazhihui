import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Organization } from './organization.entity';
import { Lead } from '../lead/lead.entity';
import { Case } from '../case/case.entity';
import { UserRole } from '../types';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  real_name: string;

  @Column({ unique: true, nullable: false })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ type: 'varchar', nullable: false })
  role: UserRole;

  @Column({ nullable: true })
  credentials_no: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ default: true })
  status: boolean;

  @ManyToOne(() => Organization, org => org.users, { nullable: true })
  organization: Organization;

  @Column({ nullable: true })
  organization_id: string;

  @OneToMany(() => Lead, lead => lead.assign_sales)
  assigned_leads: Lead[];

  @OneToMany(() => Case, caseEntity => caseEntity.assignee_lawyer)
  assigned_cases: Case[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
