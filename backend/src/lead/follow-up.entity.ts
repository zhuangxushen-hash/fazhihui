import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { Lead } from './lead.entity';
import { User } from '../user/user.entity';

@Entity('follow_ups')
export class FollowUp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: false })
  content: string;

  @Column({ nullable: true })
  next_action: string;

  @Column({ nullable: true })
  next_action_time: Date;

  @ManyToOne(() => Lead, lead => lead.follow_ups)
  lead: Lead;

  @Column()
  lead_id: string;

  @ManyToOne(() => User)
  operator: User;

  @Column()
  operator_id: string;

  @CreateDateColumn()
  created_at: Date;
}
