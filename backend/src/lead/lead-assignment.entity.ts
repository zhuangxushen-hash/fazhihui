import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../user/user.entity';
import { AssignmentRuleType } from '../types';

@Entity('lead_assignments')
export class LeadAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  rule_name: string;

  @Column({ type: 'varchar', nullable: false })
  rule_type: AssignmentRuleType;

  @Column({ type: 'text', nullable: false })
  conditions: string; // JSON字符串，存储规则条件

  @Column({ nullable: true })
  target_user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'target_user_id' })
  target_user: User;

  @Column({ type: 'integer', default: 0 })
  priority: number;

  @Column({ default: true })
  enabled: boolean;

  @Column()
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}