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
import { SocialAccount } from './social-account.entity';
import { SocialPostStatus } from '../types';

/**
 * 公域内容发布记录实体
 * 用于多账号内容排期、定时发布和发布记录管理
 */
@Entity('social_posts')
@Index(['organization_id', 'status'])
@Index(['organization_id', 'scheduled_time'])
@Index(['account_id', 'status'])
export class SocialPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 关联公域账号ID
  @Column({ nullable: false })
  account_id: string;

  // 内容标题（用于展示）
  @Column({ nullable: true })
  title: string;

  // 文案内容
  @Column({ type: 'text', nullable: false })
  content: string;

  // 媒体文件（JSON 数组：图片/视频URL列表）
  @Column({ type: 'text', nullable: true })
  media_files: string;

  // 话题标签（逗号分隔）
  @Column({ nullable: true })
  hashtags: string;

  // 排期时间
  @Column({ type: 'datetime', nullable: true })
  scheduled_time: Date;

  // 实际发布时间
  @Column({ type: 'datetime', nullable: true })
  published_at: Date;

  // 发布状态
  @Column({ type: 'varchar', default: SocialPostStatus.DRAFT })
  status: SocialPostStatus;

  // 失败原因（status=failed 时记录）
  @Column({ type: 'text', nullable: true })
  fail_reason: string;

  // 互动数据 - 点赞数
  @Column({ type: 'integer', default: 0 })
  likes: number;

  // 互动数据 - 评论数
  @Column({ type: 'integer', default: 0 })
  comments: number;

  // 互动数据 - 分享数
  @Column({ type: 'integer', default: 0 })
  shares: number;

  // 同步发布批次号（多账号同步发布时同一批次号）
  @Column({ nullable: true })
  sync_batch_id: string;

  @ManyToOne(() => SocialAccount)
  @JoinColumn({ name: 'account_id' })
  account: SocialAccount;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column()
  organization_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'creator_id' })
  creator: User;

  @Column({ nullable: true })
  creator_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
