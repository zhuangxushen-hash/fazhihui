import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// 疑难案件实体：快捷工具-疑难案件库
@Entity('difficult_cases')
export class DifficultCase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 案件编号（自动生成）
  @Column({ type: 'varchar', nullable: false })
  case_no: string;

  // 案件名称
  @Column({ type: 'varchar', nullable: false })
  case_name: string;

  // 案件类型：civil / criminal / administrative / labor / marriage / company / real_estate / other
  @Column({ type: 'varchar', nullable: true })
  case_type: string;

  // 疑难等级：high 高 / medium 中 / low 低
  @Column({ type: 'varchar', default: 'medium' })
  difficulty_level: string;

  // 主办律师
  @Column({ type: 'varchar', nullable: true })
  main_lawyer: string;

  // 协办律师
  @Column({ type: 'varchar', nullable: true })
  assist_lawyer: string;

  // 案件描述
  @Column({ type: 'text', nullable: true })
  description: string;

  // 状态：discussing 讨论中 / solved 已解决
  @Column({ type: 'varchar', default: 'discussing' })
  status: string;

  // 讨论次数
  @Column({ type: 'int', default: 0 })
  discussion_count: number;

  // 解决方案数
  @Column({ type: 'int', default: 0 })
  solution_count: number;

  // 讨论记录（JSON 数组：{user_id, content, created_at}）
  @Column({ type: 'text', nullable: true })
  discussion_log: string;

  // 解决方案记录（JSON 数组：{user_id, content, created_at}）
  @Column({ type: 'text', nullable: true })
  solution_log: string;

  @Column()
  organization_id: string;

  // 创建人ID
  @Column({ type: 'varchar', nullable: true })
  created_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
