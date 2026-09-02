import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

/**
 * 案件状态字典（组织级自定义）。
 * 新流程：合同签约完成生成案件后进入案件管理，状态列表由组织自定义维护。
 * 组织首次访问时按系统默认状态播种；之后可增删改、排序、启停、设默认。
 */
@Entity('case_status_configs')
@Index(['organization_id'])
export class CaseStatusConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  organization_id: string;

  // 状态名称（自定义中文文案）
  @Column({ type: 'varchar', nullable: false, comment: '状态名称' })
  name: string;

  // 状态码（组织内唯一；生成案件回写 status 字段用）
  @Column({ type: 'varchar', nullable: false, comment: '状态码' })
  code: string;

  // 展示配色（前端 Pill kind）：neutral/blue/gold/green/red/orange/purple/cyan/geekblue
  @Column({ type: 'varchar', default: 'neutral', comment: '展示配色' })
  kind: string;

  // 排序（小者在前）
  @Column({ type: 'integer', default: 0, comment: '排序' })
  sort_order: number;

  // 是否启用
  @Column({ type: 'boolean', default: true, comment: '是否启用' })
  enabled: boolean;

  // 是否为生成案件时的默认状态
  @Column({ type: 'boolean', default: false, comment: '是否默认状态' })
  is_default: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
