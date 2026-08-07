import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Case } from '../case/case.entity';
import { User } from '../user/user.entity';
import { Organization } from '../user/organization.entity';

/**
 * 客户云归档实体
 * 用于客户将案件相关文书、证据、合同、发票、函件等文件归档存储
 */
@Entity('client_archives')
export class ClientArchive {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 关联案件ID
  @Column({ type: 'varchar', nullable: true })
  case_id: string;

  @ManyToOne(() => Case)
  @JoinColumn({ name: 'case_id' })
  case: Case;

  // 客户ID
  @Column({ type: 'varchar', nullable: false })
  client_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'client_id' })
  client: User;

  // 文件名
  @Column({ type: 'varchar', nullable: false })
  file_name: string;

  // 文件类型：document-文书 / evidence-证据 / contract-合同 / invoice-发票 / correspondence-函件
  @Column({ type: 'varchar', nullable: false })
  file_type: string;

  // 文件大小（字节）
  @Column({ type: 'int', nullable: true })
  file_size: number;

  // 文件存储URL
  @Column({ type: 'varchar', nullable: true })
  file_url: string;

  // 归档描述
  @Column({ type: 'text', nullable: true })
  description: string;

  // 归档时间
  @Column({ type: 'datetime', nullable: true })
  archived_at: Date;

  // 归档人
  @Column({ type: 'varchar', nullable: true })
  archived_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'archived_by' })
  archiver: User;

  // 所属组织ID
  @Column({ type: 'varchar', nullable: true })
  organization_id: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
