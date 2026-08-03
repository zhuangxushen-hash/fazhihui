import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Organization } from '../user/organization.entity';

// 动态类型常量（使用 varchar，避免使用 enum）
export const PostType = {
  NORMAL: 'normal', // 日常
  CASE_SHARE: 'case_share', // 案例分享
  EXPERIENCE: 'experience', // 经验
  KNOWLEDGE: 'knowledge', // 知识
} as const;

@Entity('social_posts')
export class SocialPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 发布人ID
  @Column({ nullable: false })
  user_id: string;

  // 动态内容
  @Column({ type: 'text' })
  content: string;

  // 图片JSON数组
  @Column({ type: 'text', nullable: true })
  images: string;

  // 动态类型：normal日常 / case_share案例分享 / experience经验 / knowledge知识
  @Column({ type: 'varchar', length: 20, default: PostType.NORMAL })
  post_type: string;

  // 关联案件ID（可空）
  @Column({ nullable: true })
  related_case_id: string;

  // 阅读量
  @Column({ type: 'int', default: 0 })
  view_count: number;

  // 点赞数
  @Column({ type: 'int', default: 0 })
  like_count: number;

  // 评论数
  @Column({ type: 'int', default: 0 })
  comment_count: number;

  @ManyToOne(() => Organization)
  organization: Organization;

  @Column()
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
