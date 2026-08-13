import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// 关注类型：case 案件 / lead 线索 / article 文章 / template 模板
export const CONCERN_TYPE = {
  CASE: 'case',
  LEAD: 'lead',
  ARTICLE: 'article',
  TEMPLATE: 'template',
} as const;

@Entity('recent_concerns')
export class RecentConcern {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 关注用户ID
  @Column({ type: 'varchar', nullable: false, comment: '用户ID' })
  user_id: string;

  // 关注对象ID
  @Column({ type: 'varchar', nullable: false, comment: '关注对象ID' })
  target_id: string;

  // 关注对象类型
  @Column({ type: 'varchar', default: CONCERN_TYPE.CASE, comment: '关注对象类型' })
  target_type: string;

  // 关注对象名称
  @Column({ type: 'varchar', nullable: true, comment: '关注对象名称' })
  target_name: string;

  @Column({ type: 'varchar', comment: '机构ID' })
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
