import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Case } from './case.entity';
import { User } from '../user/user.entity';
import { WarningType, WarningLevel, WarningStatus } from '../types';

@Entity('case_warnings')
export class CaseWarning {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  case_id: string;

  @Column({ type: 'varchar', nullable: false })
  warning_type: WarningType;

  @Column({ type: 'varchar', nullable: false })
  warning_level: WarningLevel;

  @Column({ type: 'date', nullable: false })
  warning_date: Date;

  @Column({ type: 'date', nullable: false })
  target_date: Date;

  @Column({ type: 'varchar', default: WarningStatus.PENDING })
  status: WarningStatus;

  @Column({ nullable: true })
  handler_id: string;

  @Column({ type: 'text', nullable: true })
  handle_note: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', default: 0 })
  advance_days: number;

  @ManyToOne(() => Case, { nullable: false })
  @JoinColumn({ name: 'case_id' })
  case: Case;

  @ManyToOne(() => User, { nullable: true })
  handler: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'datetime', nullable: true })
  handled_at: Date;
}