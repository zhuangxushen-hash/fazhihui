import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// 计税状态：pending 待入账 / accounted 已入账 / offset 已冲抵
export const TAX_STATUS = {
  PENDING: 'pending',
  ACCOUNTED: 'accounted',
  OFFSET: 'offset',
} as const;

@Entity('tax_calculations')
export class TaxCalculation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 关联代扣记录（个税结算入账生成的代扣记录）
  @Column({ type: 'varchar', nullable: true, comment: '关联代扣记录ID' })
  withholding_id: string;

  // 被代扣人（员工/律师）
  @Column({ type: 'varchar', nullable: true, comment: '被代扣人ID' })
  user_id: string;

  // 关联案件
  @Column({ type: 'varchar', nullable: true, comment: '关联案件ID' })
  case_id: string;

  // 收入金额
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, comment: '收入金额' })
  income_amount: number;

  // 免征额（默认5000）
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 5000, comment: '免征额' })
  exemption_amount: number;

  // 应纳税所得额
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, comment: '应纳税所得额' })
  taxable_income: number;

  // 适用税率
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, comment: '适用税率(%)' })
  tax_rate: number;

  // 速算扣除数
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, comment: '速算扣除数' })
  quick_deduction: number;

  // 应缴税额
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, comment: '应缴税额' })
  tax_amount: number;

  // 计税月份（YYYY-MM）
  @Column({ type: 'varchar', nullable: true, comment: '计税月份' })
  tax_month: string;

  // 状态
  @Column({ type: 'varchar', default: TAX_STATUS.PENDING, comment: '状态' })
  status: string;

  // 备注
  @Column({ type: 'text', nullable: true, comment: '备注' })
  remark: string;

  @Column({ type: 'varchar', comment: '机构ID' })
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
