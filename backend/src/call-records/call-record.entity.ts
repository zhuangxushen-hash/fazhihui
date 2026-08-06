import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

// 通话类型：outgoing 主叫 / incoming 被叫 / missed 未接
// 通话状态：completed 已完成 / failed 通话失败 / no_answer 无人接听

@Entity('call_records')
@Index(['organization_id', 'start_time'])
@Index(['organization_id', 'caller_id'])
@Index(['organization_id', 'lead_id'])
export class CallRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 关联线索ID（可空）
  @Column({ type: 'varchar', nullable: true, comment: '关联线索ID' })
  lead_id: string;

  // 对方号码
  @Column({ type: 'varchar', nullable: false, comment: '对方号码' })
  phone: string;

  // 通话类型：outgoing/incoming/missed
  @Column({ type: 'varchar', nullable: false, comment: '通话类型' })
  call_type: string;

  // 通话开始时间
  @Column({ type: 'datetime', nullable: false, comment: '通话开始时间' })
  start_time: Date;

  // 通话时长（秒）
  @Column({ type: 'integer', default: 0, comment: '通话时长（秒）' })
  duration: number;

  // 录音文件URL（可空）
  @Column({ type: 'varchar', nullable: true, comment: '录音文件URL' })
  recording_url: string;

  // 通话状态：completed/failed/no_answer
  @Column({ type: 'varchar', default: 'completed', comment: '通话状态' })
  call_status: string;

  // 通话摘要（可空）
  @Column({ type: 'text', nullable: true, comment: '通话摘要' })
  summary: string;

  // 所属组织ID
  @Column({ type: 'varchar', nullable: false, comment: '所属组织ID' })
  organization_id: string;

  // 呼叫人ID
  @Column({ type: 'varchar', nullable: false, comment: '呼叫人ID' })
  caller_id: string;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;
}
