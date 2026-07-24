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
import { AdAccount } from './ad-account.entity';
import { AdAccountWarningStatus } from '../types';

/**
 * 广告账户余额预警记录
 * 每日定时检查账户余额，低于阈值时生成预警记录
 */
@Entity('ad_account_warnings')
@Index(['organization_id', 'status'])
@Index(['organization_id', 'created_at'])
@Index(['account_id', 'status'])
export class AdAccountWarning {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 关联广告账户ID
  @Column({ nullable: false })
  account_id: string;

  // 平台（冗余字段，便于直接查询）
  @Column({ type: 'varchar', nullable: false })
  platform: string;

  // 账户名称（冗余字段）
  @Column({ nullable: false })
  account_name: string;

  // 当前余额（触发预警时的快照）
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  balance: number;

  // 预警阈值
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  threshold: number;

  // 预警状态
  @Column({ type: 'varchar', default: AdAccountWarningStatus.PENDING })
  status: AdAccountWarningStatus;

  // 处理备注
  @Column({ type: 'text', nullable: true })
  remarks: string;

  @ManyToOne(() => AdAccount)
  @JoinColumn({ name: 'account_id' })
  account: AdAccount;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column()
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
