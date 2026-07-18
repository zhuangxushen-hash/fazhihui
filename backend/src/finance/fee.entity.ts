import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { Organization } from '../user/organization.entity';
import { Case } from '../case/case.entity';
import { FeeRole } from '../types';

@Entity('fees')
export class Fee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  amount: number;

  @Column({ nullable: false })
  case_id: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: false })
  paid: boolean;

  @Column({ nullable: true })
  paid_at: Date;

  @Column({ nullable: true })
  payment_method: string;

  @ManyToOne(() => Organization)
  organization: Organization;

  @Column()
  organization_id: string;

  @ManyToOne(() => Case)
  case: Case;

  @CreateDateColumn()
  created_at: Date;
}
