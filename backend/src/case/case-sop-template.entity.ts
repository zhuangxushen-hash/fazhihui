import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Organization } from '../user/organization.entity';
import { CaseType } from '../types';

/**
 * 任务节点模板子结构
 */
export interface CaseTaskTemplate {
  task_id: string;
  task_name: string;
  responsible_role: string; // 责任人角色：lawyer, assistant, admin等
  deadline_days: number; // 相对于阶段开始的天数
  is_required: boolean; // 是否必做
  description?: string; // 任务描述
}

/**
 * 阶段子结构
 */
export interface CaseSOPStage {
  stage_id: string;
  stage_name: string;
  order: number; // 阶段顺序
  tasks: CaseTaskTemplate[]; // 该阶段的任务列表
}

/**
 * SOP模板实体
 * 用于定义标准化的办案流程模板
 */
@Entity('case_sop_templates')
export class CaseSOPTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  name: string; // 模板名称，如"民事诉讼标准流程"

  @Column({ type: 'varchar', nullable: false })
  case_type: CaseType; // 适用的案件类型

  @Column({ type: 'json', nullable: false })
  stages: CaseSOPStage[]; // 阶段列表（JSON格式）

  @Column({ type: 'boolean', default: false })
  is_default: boolean; // 是否为该案件类型的默认模板

  @Column({ type: 'boolean', default: true })
  enabled: boolean; // 是否启用

  @Column({ nullable: true })
  description: string; // 模板描述

  @ManyToOne(() => Organization, { nullable: true })
  organization: Organization;

  @Column({ nullable: true })
  organization_id: string; // 所属组织ID，null表示系统预置模板

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}