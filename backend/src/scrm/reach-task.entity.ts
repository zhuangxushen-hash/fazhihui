import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('scrm_reach_tasks')
export class ReachTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 任务类型: 1v1(1v1私聊) / moments(朋友圈) / group_sop(社群SOP)
  @Column({ type: 'varchar', nullable: false })
  task_type: string;

  // 目标标签(JSON 数组字符串)
  @Column({ type: 'text', nullable: true })
  target_tags: string;

  @Column({ type: 'text', nullable: false })
  content: string;

  // 朋友圈/社群配图(JSON 数组字符串)
  @Column({ type: 'text', nullable: true })
  media_paths: string;

  // 多账号同步发布(JSON 数组字符串)
  @Column({ type: 'text', nullable: true })
  publish_accounts: string;

  @Column({ type: 'datetime', nullable: true })
  schedule_time: Date;

  // 状态: draft / pending / sending / sent / failed
  @Column({ type: 'varchar', default: 'draft' })
  status: string;

  @Column({ type: 'integer', default: 0 })
  sent_count: number;

  @Column({ type: 'integer', default: 0 })
  target_count: number;

  @Column({ nullable: true })
  organization_id: string;

  @Column({ nullable: true })
  created_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
