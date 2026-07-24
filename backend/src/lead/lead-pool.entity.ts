import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Lead } from './lead.entity';
import { User } from '../user/user.entity';
import { RecycleReason, LeadPoolStatus } from '../types';

@Entity('lead_pool')
export class LeadPool {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  lead_id: string;

  @ManyToOne(() => Lead)
  lead: Lead;

  @Column()
  original_owner_id: string;

  @ManyToOne(() => User)
  original_owner: User;

  @Column({ type: 'varchar' })
  recycle_reason: RecycleReason;

  @Column({ type: 'text', nullable: true })
  recycle_note: string;

  @CreateDateColumn()
  recycle_time: Date;

  @Column({ type: 'varchar', default: LeadPoolStatus.AVAILABLE })
  status: LeadPoolStatus;

  @Column({ nullable: true })
  taken_by_id: string;

  @ManyToOne(() => User)
  taken_by: User;

  @Column({ nullable: true, type: 'datetime' })
  taken_at: Date;

  @Column({ default: 0 })
  take_count: number;
}