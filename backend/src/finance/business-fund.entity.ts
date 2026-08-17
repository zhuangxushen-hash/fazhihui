import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// 业务款类型：income 收入 / expense 支出
export const FUND_TYPE = {
  INCOME: 'income',
  EXPENSE: 'expense',
} as const;

// 业务款分类：lawyer_fee 律师费 / agency_fee 代理费 / preservation_fee 保全费 / appraisal_fee 鉴定费 / other 其他
export const FUND_CATEGORY = {
  LAWYER_FEE: 'lawyer_fee',
  AGENCY_FEE: 'agency_fee',
  PRESERVATION_FEE: 'preservation_fee',
  APPRAISAL_FEE: 'appraisal_fee',
  OTHER: 'other',
} as const;

@Entity('business_funds')
export class BusinessFund {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  case_id: string; // 关联案件（可空）

  @Column({ type: 'varchar', nullable: false })
  type: string; // 类型：income 收入 / expense 支出

  @Column({ type: 'varchar', nullable: false })
  category: string; // 分类：律师费/代理费/保全费/鉴定费/其他

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  amount: number; // 金额

  @Column({ type: 'varchar', nullable: false })
  payer: string; // 付款方

  @Column({ type: 'varchar', nullable: false })
  payee: string; // 收款方

  @Column({ type: 'date', nullable: false })
  payment_date: Date; // 付款日期

  @Column({ type: 'varchar', nullable: true })
  payment_method: string; // 付款方式（可空）

  @Column({ type: 'text', nullable: true })
  remarks: string; // 备注（可空）

  // 入账状态：pending待入账/accounted已入账
  @Column({ type: 'varchar', default: 'pending', comment: '入账状态' })
  account_status: string;

  // 入账时间
  @Column({ type: 'datetime', nullable: true, comment: '入账时间' })
  account_time: Date;

  // 分账记录（JSON字符串：[{role,amount}]）
  @Column({ type: 'text', nullable: true, comment: '分账记录JSON' })
  allocation_records: string;

  // 税费分摊金额
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, comment: '税费分摊金额' })
  tax_share: number;

  // 质保金金额
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, comment: '质保金金额' })
  quality_deposit: number;

  // 13.8 缺口7: 记录状态 active有效 / voided已撤销 / red_flushed已红冲
  @Column({ type: 'varchar', default: 'active', comment: '记录状态' })
  status: string;

  // 红冲原因
  @Column({ type: 'text', nullable: true, comment: '红冲原因' })
  red_flush_reason: string;

  // 红冲时间
  @Column({ type: 'datetime', nullable: true, comment: '红冲时间' })
  red_flush_time: Date;

  // 关联冲销记录ID（红冲负数记录指向原记录）
  @Column({ type: 'varchar', nullable: true, comment: '关联冲销记录ID' })
  reversal_of_id: string;

  @Column()
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
