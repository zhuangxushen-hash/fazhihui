import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Case } from './case.entity';
import { User } from '../user/user.entity';
import { EvidenceType, EvidenceCategory } from '../types';

@Entity('evidences')
export class Evidence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  name: string;

  @Column({ type: 'varchar', default: EvidenceType.OTHER })
  type: EvidenceType;

  @Column({ type: 'varchar', default: EvidenceCategory.OTHER })
  category: EvidenceCategory;

  @Column({ nullable: false })
  file_path: string;

  @Column({ type: 'integer', nullable: true })
  file_size: number;

  @Column({ nullable: true })
  mime_type: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'integer', default: 1 })
  version: number;

  @Column({ type: 'boolean', default: false })
  is_archived: boolean;

  @ManyToOne(() => Case)
  case: Case;

  @Column()
  case_id: string;

  @ManyToOne(() => User)
  upload_by: User;

  @Column()
  upload_by_id: string;

  // 父证据ID（用于版本管理）
  @Column({ nullable: true })
  parent_evidence_id: string;

  @ManyToOne(() => Evidence, evidence => evidence.versions)
  parent_evidence: Evidence;

  @OneToMany(() => Evidence, evidence => evidence.parent_evidence)
  versions: Evidence[];

  @CreateDateColumn()
  upload_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}