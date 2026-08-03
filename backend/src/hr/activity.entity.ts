import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Organization } from '../user/organization.entity';

// 活动类型常量（使用 varchar，避免使用 enum）
export const ActivityType = {
  TRAINING: 'training', // 培训
  TEAM_BUILDING: 'team_building', // 团建
  MEETING: 'meeting', // 会议
  OTHER: 'other', // 其他
} as const;

// 活动状态常量（使用 varchar，避免使用 enum）
export const ActivityStatus = {
  UPCOMING: 'upcoming', // 即将开始
  ONGOING: 'ongoing', // 进行中
  COMPLETED: 'completed', // 已结束
  CANCELLED: 'cancelled', // 已取消
} as const;

@Entity('hr_activities')
export class HrActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 活动标题
  @Column({ nullable: false })
  title: string;

  // 活动描述
  @Column({ type: 'text', nullable: true })
  description: string;

  // 类型：training培训 / team_building团建 / meeting会议 / other其他
  @Column({ type: 'varchar', length: 20, default: ActivityType.OTHER })
  activity_type: string;

  // 开始时间
  @Column({ type: 'datetime' })
  start_time: Date;

  // 结束时间
  @Column({ type: 'datetime' })
  end_time: Date;

  // 地点
  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string;

  // 组织者ID
  @Column({ nullable: true })
  organizer_id: string;

  // 最大参与人数（0表示不限）
  @Column({ type: 'int', default: 0 })
  max_participants: number;

  // 已报名人数（冗余字段，便于列表展示）
  @Column({ type: 'int', default: 0 })
  registered_count: number;

  // 状态：upcoming即将开始 / ongoing进行中 / completed已结束 / cancelled已取消
  @Column({ type: 'varchar', length: 20, default: ActivityStatus.UPCOMING })
  status: string;

  @ManyToOne(() => Organization)
  organization: Organization;

  @Column()
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
