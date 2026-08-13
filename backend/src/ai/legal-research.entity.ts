import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// 研究任务状态：pending 研究中 / completed 已完成 / failed 失败
export const RESEARCH_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

@Entity('legal_researches')
export class LegalResearch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 研究主题
  @Column({ type: 'varchar', nullable: false, comment: '研究主题' })
  topic: string;

  // 关键词（JSON数组）
  @Column({ type: 'text', nullable: true, comment: '关键词JSON' })
  keywords: string;

  // 研究摘要
  @Column({ type: 'text', nullable: true, comment: '研究摘要' })
  summary: string;

  // 研究要点（JSON数组）
  @Column({ type: 'text', nullable: true, comment: '研究要点JSON' })
  key_points: string;

  // 参考资料（JSON数组）
  @Column({ type: 'text', nullable: true, comment: '参考资料JSON' })
  references: string;

  // 任务状态
  @Column({ type: 'varchar', default: RESEARCH_STATUS.COMPLETED, comment: '任务状态' })
  status: string;

  // 发起人ID
  @Column({ type: 'varchar', nullable: true, comment: '发起人ID' })
  creator_id: string;

  @Column({ type: 'varchar', comment: '机构ID' })
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
