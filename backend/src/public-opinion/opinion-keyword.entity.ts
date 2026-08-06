import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

// 舆情监控关键词实体：用于配置自动监控的关键词

@Entity('opinion_keywords')
@Index(['organization_id', 'is_active'])
export class OpinionKeyword {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 关键词
  @Column({ type: 'varchar', nullable: false, comment: '关键词' })
  keyword: string;

  // 是否启用
  @Column({ type: 'boolean', default: true, comment: '是否启用' })
  is_active: boolean;

  // 所属组织ID
  @Column({ type: 'varchar', nullable: false, comment: '所属组织ID' })
  organization_id: string;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;
}
