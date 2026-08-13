import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// 单据类型：finance_withdrawal 财务提款 / pay_apply 支付申请 / pay_approve 支付审批
//            repay_apply 报销申请 / repay_approve 报销审批 / invoice_repay 成本票报销
export const FORM_TYPE = {
  FINANCE_WITHDRAWAL: 'finance_withdrawal',
  PAY_APPLY: 'pay_apply',
  PAY_APPROVE: 'pay_approve',
  REPAY_APPLY: 'repay_apply',
  REPAY_APPROVE: 'repay_approve',
  INVOICE_REPAY: 'invoice_repay',
} as const;

@Entity('form_templates')
export class FormTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 模板类型
  @Column({ type: 'varchar', unique: true, comment: '模板类型' })
  form_type: string;

  // 模板名称
  @Column({ type: 'varchar', nullable: false, comment: '模板名称' })
  name: string;

  // 模板描述
  @Column({ type: 'text', nullable: true, comment: '模板描述' })
  description: string;

  // 字段定义（JSON数组：[{key,label,type,required,options}]）
  @Column({ type: 'text', nullable: true, comment: '字段定义JSON' })
  fields: string;

  // 默认审批角色（JSON数组，用于自动匹配审批人）
  @Column({ type: 'text', nullable: true, comment: '默认审批角色JSON' })
  approver_roles: string;

  // 是否启用
  @Column({ type: 'boolean', default: true, comment: '是否启用' })
  enabled: boolean;

  @Column({ type: 'varchar', comment: '机构ID' })
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
