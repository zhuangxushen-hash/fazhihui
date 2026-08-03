import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Organization } from '../user/organization.entity';

// 文章分类常量（使用 varchar，避免使用 enum）
export const ArticleCategory = {
  EXPERIENCE: 'experience', // 实务经验
  RESEARCH: 'research', // 法律研究
  SKILL: 'skill', // 办案技巧
  TEMPLATE: 'template', // 模板范本
} as const;

// 文章状态常量
export const ArticleStatus = {
  DRAFT: 'draft', // 草稿
  PUBLISHED: 'published', // 已发布
} as const;

@Entity('knowledge_articles')
export class KnowledgeArticle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 标题
  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  // 分类：experience 实务经验 / research 法律研究 / skill 办案技巧 / template 模板范本
  @Column({ type: 'varchar', length: 50, nullable: false })
  category: string;

  // 内容
  @Column({ type: 'text', nullable: false })
  content: string;

  // 作者ID
  @Column({ type: 'varchar', nullable: false })
  author_id: string;

  // 标签数组（可空）
  @Column({ type: 'json', nullable: true })
  tags: string[] | null;

  // 浏览量
  @Column({ type: 'int', default: 0 })
  view_count: number;

  // 状态：draft 草稿 / published 已发布
  @Column({ type: 'varchar', length: 20, default: ArticleStatus.PUBLISHED })
  status: string;

  @ManyToOne(() => Organization)
  organization: Organization;

  @Column({ nullable: true })
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
