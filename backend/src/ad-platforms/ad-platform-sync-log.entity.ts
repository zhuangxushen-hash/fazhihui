import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * 广告平台数据同步日志实体
 * 记录每次定时拉取数据的执行结果
 */
@Entity('ad_platform_sync_logs')
@Index(['organization_id', 'platform'])
@Index(['platform', 'sync_type'])
export class AdPlatformSyncLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 平台标识 */
  @Column({ type: 'varchar', nullable: false })
  platform: string;

  /** 同步类型：balance/account_list/campaign_list/report/conversion */
  @Column({ type: 'varchar', nullable: false })
  sync_type: string;

  /** 同步状态：success/failed/partial */
  @Column({ type: 'varchar', default: 'success' })
  status: string;

  /** 同步记录数 */
  @Column({ type: 'int', default: 0 })
  record_count: number;

  /** 错误信息 */
  @Column({ type: 'text', nullable: true })
  error_message: string;

  /** 本次同步的原始数据摘要（JSON） */
  @Column({ type: 'text', nullable: true })
  data_summary: string;

  @Column()
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;
}
