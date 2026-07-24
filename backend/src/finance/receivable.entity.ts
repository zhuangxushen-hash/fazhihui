import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Organization } from '../user/organization.entity';

export enum ReceivableStatus {
  PENDING = 'pending', // 待收款
  PARTIAL = 'partial', // 部分收款
  COMPLETED = 'completed', // 已完成
  OVERDUE = 'overdue', // 已逾期
}

export interface InstallmentPlan {
  installment_id: string;
  amount: number;
  due_date: string; // 应收日期
  status: 'pending' | 'paid' | 'overdue'; // 分期状态
  paid_date?: string; // 实收日期
  paid_amount?: number; // 实收金额
}

@Entity('receivables')
export class Receivable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  case_id: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  contract_amount: number; // 合同金额

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  received_amount: number; // 已收金额

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  pending_amount: number; // 待收金额

  @Column({ type: 'json', nullable: true })
  installment_plan: InstallmentPlan[]; // 分期计划

  @Column({ type: 'varchar', default: ReceivableStatus.PENDING })
  status: ReceivableStatus;

  @Column({ nullable: true })
  remarks: string;

  @ManyToOne(() => Organization)
  organization: Organization;

  @Column()
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}