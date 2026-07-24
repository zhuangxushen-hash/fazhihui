import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * AI 营销内容模板实体（Task 1.5.1）
 * 用于基于模板+变量替换的 AI 内容生成
 * 案由：marriage/traffic/labor/debt/other
 * 内容类型：video_script/copywriting/live_script/article
 */
@Entity('content_templates')
@Index(['case_type', 'content_type', 'is_active'])
export class ContentTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  case_type: string;

  @Column({ type: 'varchar', nullable: false })
  content_type: string;

  @Column({ nullable: false })
  title: string;

  @Column({ type: 'text', nullable: false })
  content: string;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
