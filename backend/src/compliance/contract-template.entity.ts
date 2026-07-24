import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('contract_templates')
export class ContractTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Column({ type: 'varchar', nullable: false })
  case_type: string;

  @Column({ type: 'text', nullable: false })
  content: string;

  @Column({ type: 'integer', default: 1 })
  version: number;

  @Column({ type: 'boolean', default: false })
  is_approved: boolean;

  @Column({ type: 'varchar', nullable: false })
  created_by: string;

  @Column({ type: 'varchar', nullable: false })
  organization_id: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
