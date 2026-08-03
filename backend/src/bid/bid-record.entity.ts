import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// 业绩分类：litigation 诉讼 / non_litigation 非诉 / consultant 顾问
export const BID_RECORD_CATEGORY = {
  LITIGATION: 'litigation',
  NON_LITIGATION: 'non_litigation',
  CONSULTANT: 'consultant',
} as const;

@Entity('bid_records')
export class BidRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  project_name: string; // 项目名称

  @Column({ type: 'varchar', nullable: false })
  client: string; // 客户

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  amount: number; // 金额

  @Column({ type: 'date', nullable: false })
  start_date: Date; // 开始日期

  @Column({ type: 'date', nullable: true })
  end_date: Date; // 结束日期（可空）

  @Column({ type: 'varchar', nullable: false })
  category: string; // 分类：诉讼/非诉/顾问

  @Column({ type: 'text', nullable: true })
  description: string; // 描述（可空）

  @Column()
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
