import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Organization } from '../user/organization.entity';

// 任务优先级常量（使用 varchar，避免使用 enum）
export const TaskPriority = {
  LOW: 'low', // 低
  NORMAL: 'normal', // 普通
  HIGH: 'high', // 高
  URGENT: 'urgent', // 紧急
} as const;

// 任务状态常量（使用 varchar，避免使用 enum）
export const TaskStatus = {
  PENDING: 'pending', // 待办
  PROCESSING: 'processing', // 进行中
  COMPLETED: 'completed', // 已完成
  CANCELLED: 'cancelled', // 已取消
} as const;

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 标题
  @Column({ nullable: false })
  title: string;

  // 描述（可空）
  @Column({ type: 'text', nullable: true })
  description: string;

  // 负责人ID
  @Column({ nullable: true })
  assignee_id: string;

  // 创建人ID
  @Column({ nullable: false })
  creator_id: string;

  // 优先级：low 低 / normal 普通 / high 高 / urgent 紧急
  @Column({ type: 'varchar', length: 20, default: TaskPriority.NORMAL })
  priority: string;

  // 状态：pending 待办 / processing 进行中 / completed 已完成 / cancelled 已取消
  @Column({ type: 'varchar', length: 20, default: TaskStatus.PENDING })
  status: string;

  // 截止日期（可空）
  @Column({ type: 'date', nullable: true })
  due_date: string;

  // 关联案件ID（可空）
  @Column({ nullable: true })
  related_case_id: string;

  // 关联线索ID（可空）
  @Column({ nullable: true })
  related_lead_id: string;

  // 父任务ID（可空，用于任务拆分）
  @Column({ nullable: true })
  parent_task_id: string;

  // 完成时间（可空）
  @Column({ type: 'datetime', nullable: true })
  completed_at: Date;

  // 多负责人ID数组（JSON字符串，SQLite无JSON类型）
  @Column({ type: 'text', nullable: true, comment: '多负责人ID数组JSON' })
  assignee_ids: string;

  // 任务进度0-100
  @Column({ type: 'int', default: 0, comment: '任务进度' })
  progress: number;

  @ManyToOne(() => Organization)
  organization: Organization;

  @Column()
  organization_id: string;

  // 复核结果：passed 通过 / failed 不通过（可空，未复核时为 null）
  @Column({ type: 'varchar', length: 20, nullable: true, comment: '复核结果' })
  review_status: string;

  // 复核意见（可空）
  @Column({ type: 'text', nullable: true, comment: '复核意见' })
  review_comment: string;

  // 复核人ID（可空）
  @Column({ type: 'varchar', nullable: true, comment: '复核人ID' })
  reviewer_id: string;

  // 复核时间（可空）
  @Column({ type: 'datetime', nullable: true, comment: '复核时间' })
  review_time: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
