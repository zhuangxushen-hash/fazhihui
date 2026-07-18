import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { Organization } from '../user/organization.entity';
import { Case } from '../case/case.entity';
import { User } from '../user/user.entity';
import { FeeRole } from '../types';

@Entity('profit_shares')
export class ProfitShare {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  case_id: string;

  @Column({ type: 'varchar', nullable: false })
  role: FeeRole;

  @Column({ nullable: true })
  user_id: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  percentage: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  amount: number;

  @Column({ default: false })
  paid: boolean;

  @Column({ nullable: true })
  paid_at: Date;

  @ManyToOne(() => Organization)
  organization: Organization;

  @Column()
  organization_id: string;

  @ManyToOne(() => Case)
  case: Case;

  @ManyToOne(() => User)
  user: User;

  @CreateDateColumn()
  created_at: Date;
}
