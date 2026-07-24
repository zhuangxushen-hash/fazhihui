import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { Organization } from '../user/organization.entity';
import { Case } from '../case/case.entity';

export enum CostType {
  MARKETING = 'marketing', // 投放成本
  LABOR = 'labor', // 人力成本
  CASE_HANDLING = 'case_handling', // 办案成本
  OTHER = 'other', // 其他
}

@Entity('case_costs')
export class CaseCost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  case_id: string;

  @Column({ type: 'varchar', nullable: false })
  cost_type: CostType;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  amount: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'date', nullable: true })
  incurred_date: Date;

  @ManyToOne(() => Organization)
  organization: Organization;

  @Column()
  organization_id: string;

  @ManyToOne(() => Case)
  case: Case;

  @CreateDateColumn()
  created_at: Date;
}