import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Lead } from './lead.entity';
import { User } from '../user/user.entity';
import { LeadAssignment } from './lead-assignment.entity';

@Entity('lead_assignment_logs')
export class LeadAssignmentLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  lead_id: string;

  @ManyToOne(() => Lead)
  @JoinColumn({ name: 'lead_id' })
  lead: Lead;

  @Column({ nullable: true })
  from_user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'from_user_id' })
  from_user: User;

  @Column({ nullable: true })
  to_user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'to_user_id' })
  to_user: User;

  @Column({ nullable: true })
  assignment_rule_id: string;

  @ManyToOne(() => LeadAssignment)
  @JoinColumn({ name: 'assignment_rule_id' })
  assignment_rule: LeadAssignment;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column()
  operator_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'operator_id' })
  operator: User;

  @CreateDateColumn()
  created_at: Date;
}