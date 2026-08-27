import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * 团队（组织 → 团队）
 * 每个组织下可维护多个团队，用户可关联所属团队（users.team_id 外键关联本表 id）。
 */
@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 归属组织（律所），为空表示全局团队
  @Column({ type: 'varchar', nullable: true })
  organization_id: string;

  // 团队名称
  @Column({ type: 'varchar', nullable: false })
  name: string;

  // 团队负责人用户 id（可选）
  @Column({ type: 'varchar', nullable: true })
  leader_id: string;

  // 团队描述
  @Column({ type: 'text', nullable: true })
  description: string;

  // 状态：active 正常 / inactive 停用
  @Column({ type: 'varchar', default: 'active' })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}