import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 结案归档状态
 */
export enum ArchiveStatus {
  PENDING = 'pending', // 待归档（校验通过待归档）
  ARCHIVING = 'archiving', // 归档中
  ARCHIVED = 'archived', // 已归档
  REJECTED = 'rejected', // 校验未通过/驳回
}

/**
 * 材料清单条目
 */
export interface MaterialChecklistItem {
  name: string; // 材料名称
  uploaded: boolean; // 是否已上传
  file_path?: string; // 文件路径
  file_id?: string; // 文件/文档/证据ID
  source?: 'document' | 'evidence' | 'manual'; // 来源
  required: boolean; // 是否必需
  description?: string; // 备注
}

/**
 * 节点闭环检查项
 */
export interface NodeCompletionCheckItem {
  node_id: string; // 节点ID（CaseTask.id 或 CaseSOP.id）
  node_name: string; // 节点名称
  is_required: boolean; // 是否强制节点
  completed: boolean; // 是否已完成
  completed_at?: Date; // 完成时间
  description?: string; // 备注
}

/**
 * 5.5 结案归档实体
 * 记录案件结案归档的全过程：校验、归档、调阅
 */
@Entity('case_archives')
export class CaseArchive {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  case_id: string;

  @Column({ type: 'varchar', default: ArchiveStatus.PENDING })
  archive_status: ArchiveStatus;

  // 材料清单：JSON 数组，存储 MaterialChecklistItem[]
  @Column({ type: 'text', nullable: true })
  material_checklist: string;

  // 节点闭环检查：JSON 数组，存储 NodeCompletionCheckItem[]
  @Column({ type: 'text', nullable: true })
  node_completion_check: string;

  // 归档路径（标准化电子卷宗的虚拟路径标识）
  @Column({ type: 'varchar', nullable: true })
  archive_path: string;

  // 组织ID
  @Column({ type: 'varchar', nullable: true })
  organization_id: string;

  // 归档人
  @Column({ type: 'varchar', nullable: true })
  archived_by: string;

  // 归档时间
  @Column({ type: 'datetime', nullable: true })
  archived_at: Date;

  // 驳回原因
  @Column({ type: 'text', nullable: true })
  reject_reason: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
