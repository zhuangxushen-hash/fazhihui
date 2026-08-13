import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// 协作状态：pending 待处理 / processing 进行中 / converted 已转化 / closed 已结案
export const COOPERATION_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  CONVERTED: 'converted',
  CLOSED: 'closed',
} as const;

// 协作案源实体：快捷工具-协作案源
@Entity('cooperative_sources')
export class CooperativeSource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 案源编号（自动生成）
  @Column({ type: 'varchar', nullable: false })
  source_no: string;

  // 案源名称
  @Column({ type: 'varchar', nullable: false })
  source_name: string;

  // 协作方名称
  @Column({ type: 'varchar', nullable: false })
  partner_name: string;

  // 协作方联系人
  @Column({ type: 'varchar', nullable: true })
  partner_contact: string;

  // 协作类型：referral 案源推荐 / cooperation 协作办案 / consultation 咨询合作 / agent 代理合作
  @Column({ type: 'varchar', default: 'referral' })
  cooperation_type: string;

  // 案件类型：civil / criminal / administrative / labor / marriage / company / real_estate / other
  @Column({ type: 'varchar', nullable: true })
  case_type: string;

  // 预估转化金额
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  conversion_amount: number;

  // 预计结案日期
  @Column({ type: 'date', nullable: true })
  expected_close_date: Date;

  // 案源描述
  @Column({ type: 'text', nullable: true })
  description: string;

  // 状态
  @Column({ type: 'varchar', default: 'pending' })
  status: string;

  // 结案原因/备注
  @Column({ type: 'text', nullable: true })
  close_reason: string;

  @Column()
  organization_id: string;

  // 创建人ID
  @Column({ type: 'varchar', nullable: true })
  created_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
