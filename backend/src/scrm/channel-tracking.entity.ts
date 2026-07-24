import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('scrm_channel_trackings')
export class ChannelTracking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  channel_name: string;

  @Column({ nullable: true })
  live_code_id: string;

  // 渠道分组(用于数据对比)
  @Column({ nullable: true })
  channel_group: string;

  // 扫码量
  @Column({ type: 'integer', default: 0 })
  scan_count: number;

  // 加微量
  @Column({ type: 'integer', default: 0 })
  add_count: number;

  // 邀约到所量
  @Column({ type: 'integer', default: 0 })
  invite_count: number;

  // 签约量
  @Column({ type: 'integer', default: 0 })
  sign_count: number;

  @Column({ nullable: true })
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
