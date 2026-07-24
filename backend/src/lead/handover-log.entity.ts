import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../user/user.entity';
import { HandoverType, HandoverStatus } from '../types';

@Entity('handover_logs')
export class HandoverLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  from_user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'from_user_id' })
  from_user: User;

  @Column()
  to_user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'to_user_id' })
  to_user: User;

  @Column({ type: 'varchar', nullable: false })
  handover_type: HandoverType;

  @Column({ type: 'simple-json', nullable: true })
  lead_ids: string[];

  @Column({ type: 'simple-json', nullable: true })
  opportunity_ids: string[];

  @Column({ type: 'simple-json', nullable: true })
  case_ids: string[];

  @Column({ type: 'varchar', default: HandoverStatus.PENDING })
  status: HandoverStatus;

  @Column({ type: 'text', nullable: true })
  handover_note: string;

  @Column({ nullable: true })
  completed_at: Date;

  @CreateDateColumn()
  created_at: Date;
}