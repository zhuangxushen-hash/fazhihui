import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('document_versions')
export class DocumentVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 关联文档ID
  @Column({ type: 'varchar', nullable: false, comment: '文档ID' })
  document_id: string;

  // 版本号（从1递增）
  @Column({ type: 'int', default: 1, comment: '版本号' })
  version_no: number;

  // 文件URL
  @Column({ type: 'varchar', nullable: true, comment: '文件URL' })
  file_url: string;

  // 文件类型
  @Column({ type: 'varchar', nullable: true, comment: '文件类型' })
  file_type: string;

  // 文件大小（字节）
  @Column({ type: 'integer', nullable: true, comment: '文件大小' })
  file_size: number;

  // 版本说明
  @Column({ type: 'text', nullable: true, comment: '版本说明' })
  description: string;

  // 创建人ID
  @Column({ type: 'varchar', nullable: true, comment: '创建人ID' })
  creator_id: string;

  @Column({ type: 'varchar', comment: '机构ID' })
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
