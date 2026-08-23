import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

// 文档管理独立实体（与 case/document.entity.ts 区分，使用 document_items 表）
@Entity('document_items')
@Index(['organization_id'])
@Index(['case_id'])
export class DocumentItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 文档名称
  @Column({ type: 'varchar', nullable: false })
  name: string;

  // 文档分类
  @Column({ type: 'varchar', nullable: true })
  category: string;

  // 文件URL
  @Column({ type: 'varchar', nullable: false })
  file_url: string;

  // 文件类型
  @Column({ type: 'varchar', nullable: true })
  file_type: string;

  // 文件大小（字节）
  @Column({ type: 'integer', nullable: true })
  file_size: number;

  // 关联案件ID
  @Column({ type: 'varchar', nullable: true })
  case_id: string;

  // 上传人ID
  @Column({ type: 'varchar', nullable: false })
  uploader_id: string;

  // 所属组织ID
  @Column({ type: 'varchar', nullable: false })
  organization_id: string;

  // 文档描述
  @Column({ type: 'text', nullable: true })
  description: string;

  // 文档归属范围：personal个人 / company公司共享
  @Column({ type: 'varchar', default: 'personal', comment: '文档归属范围' })
  scope: string;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;
}
