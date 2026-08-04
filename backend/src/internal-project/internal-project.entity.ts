import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

// 内部项目状态：planning规划中 / in_progress进行中 / completed已完成 / archived已归档
export const INTERNAL_PROJECT_STATUS = {
  PLANNING: 'planning',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
} as const;

@Entity('internal_projects')
@Index(['organization_id'])
export class InternalProject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 项目名称
  @Column({ type: 'varchar', nullable: false })
  name: string;

  // 项目描述
  @Column({ type: 'text', nullable: true })
  description: string;

  // 项目类型
  @Column({ type: 'varchar', nullable: true })
  type: string;

  // 项目状态
  @Column({ type: 'varchar', default: INTERNAL_PROJECT_STATUS.PLANNING })
  status: string;

  // 项目预算
  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  budget: number;

  // 开始日期
  @Column({ type: 'date', nullable: true })
  start_date: Date;

  // 结束日期
  @Column({ type: 'date', nullable: true })
  end_date: Date;

  // 负责人ID
  @Column({ type: 'varchar', nullable: true })
  manager_id: string;

  // 所属组织ID
  @Column({ type: 'varchar', nullable: false })
  organization_id: string;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;
}
