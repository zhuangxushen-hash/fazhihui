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
import { SocialPlatform, SocialAuthStatus } from '../types';

/**
 * 公域账号实体
 * 管理抖音/快手/视频号/公众号等多平台账号矩阵
 */
@Entity('social_accounts')
@Index(['organization_id', 'platform'])
@Index(['organization_id', 'group_name'])
@Index(['organization_id', 'auth_status'])
export class SocialAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 平台
  @Column({ type: 'varchar', nullable: false })
  platform: SocialPlatform;

  // 账号名称（昵称）
  @Column({ nullable: false })
  account_name: string;

  // 平台账号ID（UID/OpenID等唯一标识）
  @Column({ nullable: false })
  account_id: string;

  // 分组名称（用于按分组管理）
  @Column({ nullable: true })
  group_name: string;

  // 粉丝数
  @Column({ type: 'integer', default: 0 })
  followers: number;

  // 点赞数
  @Column({ type: 'integer', default: 0 })
  likes: number;

  // 咨询数（通过此账号引流产生的咨询数）
  @Column({ type: 'integer', default: 0 })
  consultations: number;

  // 授权状态
  @Column({ type: 'varchar', default: SocialAuthStatus.UNAUTHORIZED })
  auth_status: SocialAuthStatus;

  // 授权时间
  @Column({ type: 'datetime', nullable: true })
  authorized_at: Date;

  // 授权令牌（OAuth access_token 的 JSON 字符串）
  @Column({ type: 'text', nullable: true })
  auth_token: string;

  // 账号头像URL
  @Column({ nullable: true })
  avatar_url: string;

  // 账号简介
  @Column({ type: 'text', nullable: true })
  bio: string;

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
