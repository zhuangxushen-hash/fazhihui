import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WITHHOLDING_TYPE } from './withholding-record.entity';

// 批次状态：pending 待执行 / processing 执行中 / completed 已完成 / failed 部分失败 / cancelled 已取消
export const BATCH_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

@Entity('withholding_batches')
export class WithholdingBatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 批次编号（自动生成，如 WHB20260813001）
  @Column({ type: 'varchar', unique: true, comment: '批次编号' })
  batch_no: string;

  // 代扣类型
  @Column({ type: 'varchar', default: WITHHOLDING_TYPE.FIXED_COST, comment: '代扣类型' })
  withholding_type: string;

  // 记录总数
  @Column({ type: 'int', default: 0, comment: '记录总数' })
  total_count: number;

  // 成功数量
  @Column({ type: 'int', default: 0, comment: '成功数量' })
  success_count: number;

  // 失败数量
  @Column({ type: 'int', default: 0, comment: '失败数量' })
  fail_count: number;

  // 代扣总金额
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, comment: '代扣总金额' })
  total_amount: number;

  // 批次状态
  @Column({ type: 'varchar', default: BATCH_STATUS.PENDING, comment: '批次状态' })
  status: string;

  // 操作人ID
  @Column({ type: 'varchar', nullable: true, comment: '操作人ID' })
  operator_id: string;

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
