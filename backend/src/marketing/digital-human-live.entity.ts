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

export enum DigitalHumanLiveStatus {
  DRAFT = 'draft',
  LIVE = 'live',
  ENDED = 'ended',
  SCHEDULED = 'scheduled',
}

/**
 * 数字人直播实体
 * 管理数字人直播全生命周期：创建、开播、结束、统计
 */
@Entity('digital_human_lives')
@Index(['organization_id', 'status'])
@Index(['organization_id', 'case_type'])
export class DigitalHumanLive {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 直播标题
  @Column({ nullable: false })
  title: string;

  // 主播姓名
  @Column({ nullable: false })
  anchor_name: string;

  // 话术脚本
  @Column({ type: 'text', nullable: true })
  script_content: string;

  // 封面图URL
  @Column({ nullable: true })
  cover_url: string;

  // 直播间URL
  @Column({ nullable: true })
  live_url: string;

  // 直播状态
  @Column({
    type: 'varchar',
    default: DigitalHumanLiveStatus.DRAFT,
  })
  status: DigitalHumanLiveStatus;

  // 预定开播时间
  @Column({ type: 'datetime', nullable: true })
  scheduled_start: Date;

  // 实际开播时间
  @Column({ type: 'datetime', nullable: true })
  actual_start: Date;

  // 实际结束时间
  @Column({ type: 'datetime', nullable: true })
  actual_end: Date;

  // 直播时长（单位：分钟）
  @Column({ type: 'int', nullable: true })
  duration: number;

  // 观看人数
  @Column({ type: 'int', default: 0 })
  viewer_count: number;

  // 点赞数
  @Column({ type: 'int', default: 0 })
  like_count: number;

  // 转化数
  @Column({ type: 'int', default: 0 })
  conversion_count: number;

  // 案由类型
  @Column({ nullable: true })
  case_type: string;

  // 品牌
  @Column({ nullable: true })
  brand_id: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column()
  organization_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  // 创建人ID
  @Column({ nullable: true })
  created_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}