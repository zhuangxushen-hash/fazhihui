import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// 尽调查询类型：basic 基本信息 / shareholder 股东信息 / legal 法人信息 / financial 财务信息 / risk 风险信息 / all 全部
export const DD_QUERY_TYPE = {
  BASIC: 'basic',
  SHAREHOLDER: 'shareholder',
  LEGAL: 'legal',
  FINANCIAL: 'financial',
  RISK: 'risk',
  ALL: 'all',
} as const;

// 尽调状态：pending 进行中 / completed 已完成 / failed 失败
export const DD_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

@Entity('due_diligences')
export class DueDiligence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  company_name: string; // 企业名称

  @Column({ type: 'varchar', nullable: false })
  query_type: string; // 查询类型

  @Column({ type: 'text', nullable: true })
  report_content: string; // 报告内容

  // 股东信息（JSON字符串）
  @Column({ type: 'text', nullable: true, comment: '股东信息JSON' })
  shareholder_info: string;

  // 法人信息（JSON字符串）
  @Column({ type: 'text', nullable: true, comment: '法人信息JSON' })
  legal_rep_info: string;

  // 财务信息（JSON字符串）
  @Column({ type: 'text', nullable: true, comment: '财务信息JSON' })
  financial_info: string;

  // 风险信息（JSON字符串）
  @Column({ type: 'text', nullable: true, comment: '风险信息JSON' })
  risk_info: string;

  // 模板ID
  @Column({ type: 'varchar', nullable: true, comment: '模板ID' })
  template_id: string;

  @Column({ type: 'varchar', default: DD_STATUS.COMPLETED })
  status: string; // 查询状态

  @Column({ type: 'varchar', nullable: true })
  operator_id: string; // 操作人

  @Column()
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
