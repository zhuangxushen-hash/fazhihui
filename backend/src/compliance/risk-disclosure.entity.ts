import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('risk_disclosures')
export class RiskDisclosure {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  case_id: string;

  @Column({ type: 'varchar', nullable: true })
  opportunity_id: string;

  @Column({ type: 'varchar', nullable: false })
  signed_by: string;

  @Column({ type: 'datetime', nullable: false })
  signed_at: Date;

  @Column({ type: 'text', nullable: false })
  content: string;

  @Column({ type: 'varchar', nullable: true })
  file_path: string;

  @Column({ type: 'varchar', nullable: false })
  organization_id: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
