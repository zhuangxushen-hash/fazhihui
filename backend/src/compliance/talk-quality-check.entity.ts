import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InviteTask } from '../lead/invite-task.entity';
import { User } from '../user/user.entity';

// 质检类型
export enum TalkCheckType {
  CALL = 'call', // 通话
  CHAT = 'chat', // 聊天
}

// 违规类型
export enum TalkViolationType {
  FALSE_PROMISE = 'false_promise', // 虚假承诺/包胜诉
  EXAGGERATE = 'exaggerate', // 夸大效果
  ILLEGAL_FEE = 'illegal_fee', // 违规收费
  OTHER = 'other', // 其他
}

// 质检结果
export enum TalkCheckResult {
  PASS = 'pass',
  WARNING = 'warning',
  VIOLATION = 'violation',
}

// 处理状态
export enum TalkHandleStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
}

@Entity('talk_quality_checks')
export class TalkQualityCheck {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  invite_task_id: string;

  @ManyToOne(() => InviteTask, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'invite_task_id' })
  invite_task: InviteTask;

  @Column({ type: 'varchar', nullable: false })
  check_type: TalkCheckType;

  @Column({ type: 'varchar', nullable: true })
  violation_type: TalkViolationType;

  @Column({ type: 'text', nullable: true })
  violation_content: string;

  @Column({ type: 'varchar', nullable: true })
  violation_keyword: string;

  @Column({ type: 'varchar', default: TalkCheckResult.PASS })
  check_result: TalkCheckResult;

  @Column({ type: 'varchar', default: TalkHandleStatus.PENDING })
  handle_status: TalkHandleStatus;

  @Column({ nullable: true })
  handler_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'handler_id' })
  handler: User;

  @Column({ type: 'text', nullable: true })
  handle_note: string;

  @Column({ nullable: true })
  organization_id: string;

  // 邀约人ID（冗余存储便于统计）
  @Column({ nullable: true })
  inviter_id: string;

  // 通知标记
  @Column({ type: 'boolean', default: false })
  notified: boolean;

  @Column({ type: 'datetime', nullable: true })
  notified_at: Date;

  @Column({ type: 'text', nullable: true })
  notification_summary: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'datetime', nullable: true })
  handled_at: Date;
}
