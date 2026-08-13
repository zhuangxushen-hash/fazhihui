import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Organization } from '../user/organization.entity';
import { User } from '../user/user.entity';

export enum FakeLiveRoomStatus {
  DRAFT = 'draft',
  LIVE = 'live',
  ENDED = 'ended',
}

/**
 * 伪直播间实体
 * 管理伪直播全生命周期：创建、开播、播放视频、结束
 */
@Entity('fake_live_rooms')
@Index(['organization_id', 'status'])
export class FakeLiveRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 直播标题
  @Column({ nullable: false })
  title: string;

  // 主播名称
  @Column({ nullable: false })
  anchor_name: string;

  // 播放的视频URL（可随时替换）
  @Column({ nullable: true })
  video_url: string;

  // 封面图URL
  @Column({ nullable: true })
  cover_url: string;

  // 直播状态
  @Column({
    type: 'varchar',
    default: FakeLiveRoomStatus.DRAFT,
  })
  status: FakeLiveRoomStatus;

  // 观看人数
  @Column({ type: 'int', default: 0 })
  viewer_count: number;

  // 最大观看人数限制
  @Column({ type: 'int', nullable: true })
  max_viewers: number;

  // 实际开播时间
  @Column({ type: 'datetime', nullable: true })
  actual_start: Date;

  // 实际结束时间
  @Column({ type: 'datetime', nullable: true })
  actual_end: Date;

  // 直播时长（分钟）
  @Column({ type: 'int', nullable: true })
  duration: number;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column()
  organization_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column({ nullable: true })
  created_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
