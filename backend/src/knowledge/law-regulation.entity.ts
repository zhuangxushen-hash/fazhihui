import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// 法规分类常量（使用 varchar，避免使用 enum）
export const LawRegulationCategory = {
  CONSTITUTION: 'constitution', // 宪法
  LAW: 'law', // 法律
  REGULATION: 'regulation', // 行政法规
  INTERPRETATION: 'interpretation', // 司法解释
  DEPARTMENT: 'department', // 部门规章
} as const;

@Entity('law_regulations')
export class LawRegulation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 标题
  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  // 分类：constitution 宪法 / law 法律 / regulation 行政法规 / interpretation 司法解释 / department 部门规章
  @Column({ type: 'varchar', length: 50, nullable: false })
  category: string;

  // 颁布机关
  @Column({ type: 'varchar', length: 255, nullable: true })
  promulgating_authority: string;

  // 生效日期
  @Column({ type: 'date', nullable: true })
  effective_date: string;

  // 内容
  @Column({ type: 'text', nullable: false })
  content: string;

  // 来源（可空）
  @Column({ type: 'varchar', length: 255, nullable: true })
  source: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
