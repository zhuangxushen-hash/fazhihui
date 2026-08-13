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

// 业绩审核状态：pending 待审核 / approved 已通过 / rejected 已驳回
export const BID_RECORD_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
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

  // 附件文件地址（投标文件/合同等，可空）
  @Column({ type: 'text', nullable: true, comment: '附件文件地址' })
  file_url: string;

  // 附件名称（可空）
  @Column({ type: 'varchar', nullable: true, comment: '附件名称' })
  file_name: string;

  @Column()
  organization_id: string;

  // 审核状态：pending 待审核 / approved 已通过 / rejected 已驳回
  @Column({ type: 'varchar', default: 'pending', comment: '审核状态' })
  status: string;

  // 审核人ID
  @Column({ type: 'varchar', nullable: true, comment: '审核人ID' })
  audited_by: string;

  // 审核时间
  @Column({ type: 'datetime', nullable: true, comment: '审核时间' })
  audited_at: Date;

  // 审核意见
  @Column({ type: 'text', nullable: true, comment: '审核意见' })
  audit_comment: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
