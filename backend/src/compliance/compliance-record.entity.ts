import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { Organization } from '../user/organization.entity';
import { User } from '../user/user.entity';
import { ComplianceType, ComplianceResult } from '../types';

@Entity('compliance_records')
export class ComplianceRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  type: ComplianceType;

  @Column({ type: 'text', nullable: false })
  content: string;

  @Column({ type: 'varchar', nullable: false })
  result: ComplianceResult;

  @Column({ nullable: true })
  violation_type: string;

  @Column({ type: 'text', nullable: true })
  violation_detail: string;

  @Column({ type: 'text', nullable: true })
  suggestion: string;

  @Column({ nullable: true })
  source_id: string;

  @ManyToOne(() => Organization)
  organization: Organization;

  @Column()
  organization_id: string;

  @ManyToOne(() => User)
  operator: User;

  @Column()
  operator_id: string;

  @CreateDateColumn()
  created_at: Date;
}
