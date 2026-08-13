import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// 代扣类型：fixed_cost 固定费用 / salary 工资 / income_tax 个税
export const WITHHOLDING_TYPE = {
  FIXED_COST: 'fixed_cost',
  SALARY: 'salary',
  INCOME_TAX: 'income_tax',
} as const;

// 代扣状态：pending 待代扣 / processing 执行中 / completed 已代扣 / failed 失败 / cancelled 已撤销 / offset 已冲抵
export const WITHHOLDING_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  OFFSET: 'offset',
} as const;

@Entity('withholding_records')
export class WithholdingRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 代扣编号（自动生成，如 WH20260813001）
  @Column({ type: 'varchar', unique: true, comment: '代扣编号' })
  withholding_no: string;

  // 关联代扣批次
  @Column({ type: 'varchar', nullable: true, comment: '代扣批次ID' })
  batch_id: string;

  // 关联案件
  @Column({ type: 'varchar', nullable: true, comment: '关联案件ID' })
  case_id: string;

  // 关联被代扣人（员工/律师）
  @Column({ type: 'varchar', nullable: true, comment: '被代扣人ID' })
  user_id: string;

  // 代扣类型
  @Column({ type: 'varchar', default: WITHHOLDING_TYPE.FIXED_COST, comment: '代扣类型' })
  withholding_type: string;

  // 代扣金额
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, comment: '代扣金额' })
  amount: number;

  // 代扣状态
  @Column({ type: 'varchar', default: WITHHOLDING_STATUS.PENDING, comment: '代扣状态' })
  status: string;

  // 执行时间
  @Column({ type: 'datetime', nullable: true, comment: '执行时间' })
  executed_at: Date;

  // 失败原因
  @Column({ type: 'text', nullable: true, comment: '失败原因' })
  fail_reason: string;

  // 冲抵/撤销原因
  @Column({ type: 'text', nullable: true, comment: '撤销或冲抵原因' })
  cancel_reason: string;

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
