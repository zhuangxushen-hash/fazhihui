import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// 审查状态：pending 审查中 / completed 已完成 / failed 失败
export const REVIEW_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

// 风险等级：low 低 / medium 中 / high 高
export const RISK_LEVEL = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

@Entity('contract_reviews')
export class ContractReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 审查标题
  @Column({ type: 'varchar', nullable: true, comment: '审查标题' })
  title: string;

  // 合同类型（采购/销售/租赁/劳动/服务等）
  @Column({ type: 'varchar', nullable: true, comment: '合同类型' })
  contract_type: string;

  // 合同原文
  @Column({ type: 'text', nullable: true, comment: '合同原文' })
  contract_text: string;

  // 风险等级
  @Column({ type: 'varchar', default: RISK_LEVEL.LOW, comment: '风险等级' })
  risk_level: string;

  // 风险点列表（JSON数组：[{clause, risk, suggestion, level}]）
  @Column({ type: 'text', nullable: true, comment: '风险点列表JSON' })
  risk_items: string;

  // 审查摘要
  @Column({ type: 'text', nullable: true, comment: '审查摘要' })
  summary: string;

  // 审查状态
  @Column({ type: 'varchar', default: REVIEW_STATUS.COMPLETED, comment: '审查状态' })
  status: string;

  // 审查人ID
  @Column({ type: 'varchar', nullable: true, comment: '审查人ID' })
  reviewer_id: string;

  @Column({ type: 'varchar', comment: '机构ID' })
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
