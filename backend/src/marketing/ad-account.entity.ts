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
import { AdPlatform, AdAccountStatus } from '../types';

/**
 * 广告账户实体
 * 统一管理多平台（抖音/百度/腾讯/快手）投放账户、分组、余额、授权信息
 */
@Entity('ad_accounts')
@Index(['organization_id', 'platform'])
@Index(['organization_id', 'group_name'])
@Index(['organization_id', 'status'])
export class AdAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 投放平台
  @Column({ type: 'varchar', nullable: false })
  platform: AdPlatform;

  // 账户名称（用于展示）
  @Column({ nullable: false })
  account_name: string;

  // 平台账户ID（平台返回的唯一ID）
  @Column({ nullable: false })
  account_id: string;

  // 分组名称（用于按分组管理和筛选）
  @Column({ nullable: true })
  group_name: string;

  // 账户余额（单位：元）
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  balance: number;

  // 余额预警阈值（单位：元，低于此值触发预警）
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  threshold: number;

  // 账户状态
  @Column({ type: 'varchar', default: AdAccountStatus.ACTIVE })
  status: AdAccountStatus;

  // 授权令牌（OAuth access_token 或 refresh_token 的 JSON 字符串）
  @Column({ type: 'text', nullable: true })
  auth_token: string;

  // 授权时间
  @Column({ type: 'datetime', nullable: true })
  authorized_at: Date;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column()
  organization_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'creator_id' })
  creator: User;

  // 创建人ID
  @Column({ nullable: true })
  creator_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
