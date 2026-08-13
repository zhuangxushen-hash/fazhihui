import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// 律师评级实体：lawyer-center-律师评级管理
@Entity('lawyer_ratings')
export class LawyerRating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 被评律师（users.id）
  @Column({ type: 'varchar', nullable: false })
  lawyer_id: string;

  // 评级等级：特级 / 一级 / 二级 / 三级
  @Column({ type: 'varchar', default: '三级' })
  rating_level: string;

  // 综合评分（1-5）
  @Column({ type: 'decimal', precision: 3, scale: 1, default: 4 })
  score: number;

  // 评级维度得分（JSON：{专业能力, 服务态度, 胜诉率, 执业年限}）
  @Column({ type: 'text', nullable: true })
  dimensions: string;

  // 评级评语
  @Column({ type: 'text', nullable: true })
  comment: string;

  // 评级周期（如 2026-Q1）
  @Column({ type: 'varchar', nullable: true })
  period: string;

  // 评级人（users.id）
  @Column({ type: 'varchar', nullable: true })
  rated_by: string;

  @Column()
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
