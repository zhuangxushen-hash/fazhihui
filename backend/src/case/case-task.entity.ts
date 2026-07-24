import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, ManyToMany } from 'typeorm';
import { Case } from './case.entity';
import { User } from '../user/user.entity';
import { CaseSOPTemplate } from './case-sop-template.entity';

/**
 * 案件任务状态
 */
export enum CaseTaskStatus {
  PENDING = 'pending', // 待处理
  IN_PROGRESS = 'in_progress', // 进行中
  COMPLETED = 'completed', // 已完成
  VERIFIED = 'verified', // 已验收
  OVERDUE = 'overdue', // 已超期
  CANCELLED = 'cancelled', // 已取消
}

/**
 * 任务优先级
 */
export enum TaskPriority {
  LOW = 'low', // 低
  MEDIUM = 'medium', // 中
  HIGH = 'high', // 高
  URGENT = 'urgent', // 紧急
}

/**
 * 案件任务实体
 * 案件创建时根据SOP模板生成的具体任务实例
 */
@Entity('case_tasks')
export class CaseTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  case_id: string; // 关联案件ID

  @Column({ nullable: true })
  sop_template_id: string; // 来源模板ID

  @Column({ nullable: false })
  stage_id: string; // 所属阶段ID

  @Column({ nullable: false })
  stage_name: string; // 阶段名称

  @Column({ type: 'int', nullable: false })
  stage_order: number; // 阶段顺序

  @Column({ nullable: false })
  task_id: string; // 任务ID（来自模板）

  @Column({ nullable: false })
  task_name: string; // 任务名称

  @Column({ type: 'varchar', default: CaseTaskStatus.PENDING })
  status: CaseTaskStatus; // 任务状态

  @Column({ nullable: true })
  responsible_role: string; // 责任人角色

  @Column({ nullable: true })
  assignee_id: string; // 实际指派人ID

  @Column({ type: 'datetime', nullable: true })
  deadline: Date; // 截止时间

  @Column({ type: 'datetime', nullable: true })
  completed_at: Date; // 完成时间

  @Column({ type: 'boolean', default: true })
  is_required: boolean; // 是否必做

  @Column({ type: 'int', nullable: true })
  deadline_days: number; // 相对天数（来自模板）

  @Column({ type: 'text', nullable: true })
  description: string; // 任务描述

  @Column({ type: 'text', nullable: true })
  result: string; // 任务结果/备注

  @Column({ type: 'varchar', default: TaskPriority.MEDIUM })
  priority: TaskPriority; // 任务优先级

  @Column({ type: 'int', default: 0 })
  progress: number; // 任务进度（0-100）

  @ManyToOne(() => Case, { nullable: true })
  case: Case;

  @ManyToOne(() => User, { nullable: true })
  assignee: User;

  @ManyToOne(() => CaseSOPTemplate, { nullable: true })
  sop_template: CaseSOPTemplate;

  // 临时字段，用于记录状态变更（不存储到数据库）
  _oldStatus?: string;
  _oldAssignee?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}