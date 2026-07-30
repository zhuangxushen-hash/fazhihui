import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('legal_documents')
export class LegalDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  template_name: string;

  @Column({ nullable: true })
  document_type: string;

  @Column({ nullable: true })
  case_type: string;

  @Column({ type: 'text', nullable: true })
  content_template: string;

  @Column({ type: 'text', nullable: true })
  variables: string;

  @Column({ type: 'boolean', default: true })
  is_system: boolean;

  @Column({ default: 'active' })
  status: string;

  @Column({ nullable: true })
  organization_id: string;

  @Column({ nullable: true })
  created_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}