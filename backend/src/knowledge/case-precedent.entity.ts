import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// 裁判文书类型常量（使用 varchar，避免使用 enum）
export const JudgmentType = {
  JUDGMENT: 'judgment', // 判决
  RULING: 'ruling', // 裁定
  MEDIATION: 'mediation', // 调解
} as const;

@Entity('case_precedents')
export class CasePrecedent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 案件名称
  @Column({ type: 'varchar', length: 255, nullable: false })
  case_name: string;

  // 案号
  @Column({ type: 'varchar', length: 255, nullable: true })
  case_no: string;

  // 法院
  @Column({ type: 'varchar', length: 255, nullable: true })
  court: string;

  // 案件类型
  @Column({ type: 'varchar', length: 100, nullable: true })
  case_type: string;

  // 裁判日期
  @Column({ type: 'date', nullable: true })
  judgment_date: string;

  // 裁判文书类型：judgment 判决 / ruling 裁定 / mediation 调解
  @Column({ type: 'varchar', length: 20, nullable: true })
  judgment_type: string;

  // 当事人
  @Column({ type: 'varchar', length: 500, nullable: true })
  parties: string;

  // 摘要
  @Column({ type: 'text', nullable: true })
  summary: string;

  // 全文
  @Column({ type: 'text', nullable: true })
  full_text: string;

  // 来源（可空）
  @Column({ type: 'varchar', length: 255, nullable: true })
  source: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
