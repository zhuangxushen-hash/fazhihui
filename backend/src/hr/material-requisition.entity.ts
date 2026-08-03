import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Organization } from '../user/organization.entity';

// 物品类型常量（使用 varchar，避免使用 enum）
export const MaterialType = {
  PURCHASE: 'purchase', // 申购
  RECEIVE: 'receive', // 领用
} as const;

// 物品状态常量（使用 varchar，避免使用 enum）
export const MaterialStatus = {
  PENDING: 'pending', // 待审批
  APPROVED: 'approved', // 已批准
  REJECTED: 'rejected', // 已驳回
  FULFILLED: 'fulfilled', // 已发放
} as const;

@Entity('hr_material_requisitions')
export class MaterialRequisition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 申请人ID
  @Column({ nullable: false })
  user_id: string;

  // 物品名称
  @Column({ nullable: false })
  material_name: string;

  // 数量
  @Column({ type: 'int', default: 1 })
  quantity: number;

  // 单位
  @Column({ type: 'varchar', length: 20, default: '个' })
  unit: string;

  // 类型：purchase申购 / receive领用
  @Column({ type: 'varchar', length: 20, default: MaterialType.PURCHASE })
  type: string;

  // 用途
  @Column({ type: 'text', nullable: true })
  purpose: string;

  // 状态：pending待审批 / approved已批准 / rejected已驳回 / fulfilled已发放
  @Column({ type: 'varchar', length: 20, default: MaterialStatus.PENDING })
  status: string;

  // 审批人ID
  @Column({ nullable: true })
  approver_id: string;

  // 审批意见
  @Column({ type: 'text', nullable: true })
  approve_comment: string;

  // 审批时间
  @Column({ type: 'datetime', nullable: true })
  approve_time: Date;

  @ManyToOne(() => Organization)
  organization: Organization;

  @Column()
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
