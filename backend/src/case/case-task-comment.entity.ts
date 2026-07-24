import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { CaseTask } from './case-task.entity';
import { User } from '../user/user.entity';

/**
 * 任务评论类型
 */
export enum CommentType {
  COMMENT = 'comment', // 评论
  RESULT = 'result', // 成果上传
  STATUS_CHANGE = 'status_change', // 状态变更记录
  ASSIGN_CHANGE = 'assign_change', // 指派变更记录
}

/**
 * 任务评论/成果实体
 */
@Entity('case_task_comments')
export class CaseTaskComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  task_id: string; // 关联任务ID

  @Column({ nullable: false })
  user_id: string; // 评论人ID

  @Column({ type: 'varchar', default: CommentType.COMMENT })
  type: CommentType; // 评论类型

  @Column({ type: 'text', nullable: false })
  content: string; // 评论内容

  @Column({ type: 'text', nullable: true })
  file_url: string; // 文件URL（成果上传）

  @Column({ type: 'varchar', nullable: true })
  file_name: string; // 文件名

  @Column({ type: 'varchar', nullable: true })
  file_type: string; // 文件类型

  @Column({ type: 'json', nullable: true })
  metadata: any; // 扩展字段（如状态变更前后的值）

  @ManyToOne(() => CaseTask, { nullable: true })
  task: CaseTask;

  @ManyToOne(() => User, { nullable: true })
  user: User;

  @CreateDateColumn()
  created_at: Date;
}