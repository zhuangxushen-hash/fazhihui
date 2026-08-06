import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 广告平台授权 Token 实体
 * 存储各平台 OAuth 授权后的 access_token 和 refresh_token
 */
@Entity('ad_platform_tokens')
@Index(['organization_id', 'platform'])
@Index(['platform', 'account_id'])
export class AdPlatformToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 平台标识（ocean_engine/baidu_marketing/tencent_ads/kuaishou_ads/douyin_open） */
  @Column({ type: 'varchar', nullable: false })
  platform: string;

  /** 平台返回的广告主账户ID */
  @Column({ nullable: true })
  account_id: string;

  /** access_token */
  @Column({ type: 'text', nullable: false })
  access_token: string;

  /** refresh_token */
  @Column({ type: 'text', nullable: true })
  refresh_token: string;

  /** access_token 过期时间 */
  @Column({ type: 'datetime', nullable: true })
  expires_at: Date;

  /** refresh_token 过期时间 */
  @Column({ type: 'datetime', nullable: true })
  refresh_expires_at: Date;

  /** 授权范围（空格分隔的权限列表） */
  @Column({ type: 'text', nullable: true })
  scope: string;

  /** 授权用户ID */
  @Column({ nullable: true })
  authorized_user_id: string;

  /** 授权状态 */
  @Column({ type: 'varchar', default: 'active' })
  token_status: string;

  @Column()
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
