import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Case } from './case.entity';
import { User } from '../user/user.entity';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  file_path: string;

  @Column({ nullable: true })
  file_type: string;

  @Column({ nullable: true })
  size: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  // 附件类型（如：成交合同、律师函，支持自定义）
  @Column({ type: 'varchar', nullable: true, comment: '附件类型' })
  doc_type: string;

  @Column({ default: false })
  is_ai_generated: boolean;

  // B端上传时可选：是否展示给 C 端客户（案件详情-相关文书）
  @Column({ type: 'boolean', default: false, comment: '是否展示给C端客户' })
  visible_to_client: boolean;

  @ManyToOne(() => Case, caseEntity => caseEntity.documents)
  case: Case;

  @Column()
  case_id: string;

  @ManyToOne(() => User)
  uploaded_by: User;

  @Column()
  uploaded_by_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
