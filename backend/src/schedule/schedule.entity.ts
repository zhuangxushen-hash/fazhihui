import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Organization } from '../user/organization.entity';

// 提醒类型常量（使用 varchar，避免使用 enum）
export const ReminderType = {
  NONE: 'none', // 不提醒
  BEFORE_5MIN: 'before5min', // 提前5分钟
  BEFORE_15MIN: 'before15min', // 提前15分钟
  BEFORE_1HOUR: 'before1hour', // 提前1小时
  BEFORE_1DAY: 'before1day', // 提前1天
} as const;

// 日程状态常量（使用 varchar，避免使用 enum）
export const ScheduleStatus = {
  ACTIVE: 'active', // 有效
  CANCELLED: 'cancelled', // 已取消
  DONE: 'done', // 已完成
} as const;

@Entity('schedules')
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 标题
  @Column({ type: 'varchar', nullable: false })
  title: string;

  // 描述（可空）
  @Column({ type: 'text', nullable: true })
  description: string;

  // 开始时间
  @Column({ type: 'datetime', nullable: false })
  start_time: Date;

  // 结束时间
  @Column({ type: 'datetime', nullable: false })
  end_time: Date;

  // 是否全天（默认 false）
  @Column({ default: false })
  all_day: boolean;

  // 地点（可空）
  @Column({ type: 'varchar', nullable: true })
  location: string;

  // 创建人ID
  @Column({ type: 'varchar', nullable: false })
  creator_id: string;

  // 关联案件ID（可空）
  @Column({ type: 'varchar', nullable: true })
  related_case_id: string;

  // 提醒类型：none不提醒 / before5min提前5分钟 / before15min提前15分钟 / before1hour提前1小时 / before1day提前1天
  @Column({ type: 'varchar', length: 20, default: ReminderType.NONE })
  reminder_type: string;

  // 提醒时间（可空，根据提醒类型与开始时间计算）
  @Column({ type: 'datetime', nullable: true })
  reminder_time: Date;

  // 状态：active有效 / cancelled已取消 / done已完成
  @Column({ type: 'varchar', length: 20, default: ScheduleStatus.ACTIVE })
  status: string;

  // 附件（JSON字符串数组）
  @Column({ type: 'text', nullable: true, comment: '附件JSON数组' })
  attachments: string;

  // 共享团队ID
  @Column({ type: 'varchar', nullable: true, comment: '共享团队ID' })
  shared_team_id: string;

  // 主题
  @Column({ type: 'varchar', nullable: true, comment: '主题' })
  theme: string;

  @ManyToOne(() => Organization)
  organization: Organization;

  @Column()
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
