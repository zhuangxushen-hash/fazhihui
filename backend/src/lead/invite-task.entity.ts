import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Lead } from './lead.entity';
import { User } from '../user/user.entity';
import { InviteMethod, InviteTaskStatus, InviteResult } from '../types';

@Entity('invite_tasks')
export class InviteTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  lead_id: string;

  @ManyToOne(() => Lead)
  @JoinColumn({ name: 'lead_id' })
  lead: Lead;

  @Column()
  inviter_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'inviter_id' })
  inviter: User;

  @Column({ type: 'varchar' })
  invite_method: InviteMethod;

  @Column({ type: 'datetime', nullable: true })
  scheduled_time: Date;

  @Column({ type: 'varchar', default: InviteTaskStatus.PENDING })
  status: InviteTaskStatus;

  @Column({ type: 'varchar', nullable: true })
  result: InviteResult;

  @Column({ type: 'text', nullable: true })
  result_note: string;

  @Column({ nullable: true })
  recording_url: string;

  @Column({ type: 'int', nullable: true })
  call_duration: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}