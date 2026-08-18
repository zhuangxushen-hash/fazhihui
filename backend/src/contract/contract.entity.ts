import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, OneToMany, Index } from 'typeorm';
import { Organization } from '../user/organization.entity';
import { ContractStage } from './contract-stage.entity';

// 合同类型: entrust委托 / consultant顾问 / other其他
// 合同阶段: drafting起草 / reviewing审查 / signed已签 / performing履行 / completed完成 / terminated解约 / voided作废

@Entity('contracts')
@Index(['organization_id'])
@Index(['status'])
@Index(['seal_usage_status'])
@Index(['return_status'])
export class Contract {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false, comment: '合同编号' })
  contract_no: string;

  @Column({ type: 'varchar', nullable: false, comment: '合同标题' })
  title: string;

  @Column({ type: 'varchar', nullable: false, comment: '合同类型' })
  type: string;

  @Column({ type: 'varchar', nullable: true, comment: '关联案件ID' })
  case_id: string;

  @Column({ type: 'varchar', nullable: false, comment: '客户名称' })
  client_name: string;

  @Column({ type: 'varchar', nullable: true, comment: '客户电话' })
  client_phone: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, comment: '合同金额' })
  amount: number;

  @Column({ type: 'date', nullable: true, comment: '签订日期' })
  sign_date: Date;

  @Column({ type: 'date', nullable: true, comment: '开始日期' })
  start_date: Date;

  @Column({ type: 'date', nullable: true, comment: '结束日期' })
  end_date: Date;

  @Column({ type: 'varchar', default: 'drafting', comment: '合同阶段' })
  stage: string;

  @Column({ type: 'varchar', default: 'active', comment: '状态' })
  status: string;

  @Column({ type: 'text', nullable: true, comment: '备注' })
  remarks: string;

  // 对方当事人
  @Column({ type: 'varchar', nullable: true, comment: '对方当事人' })
  opposing_party: string;

  // 分配比例（JSON字符串：[{role,ratio}]，SQLite无JSON类型）
  @Column({ type: 'text', nullable: true, comment: '分配比例JSON' })
  allocation_ratio: string;

  // 原件回收状态：not_received待回收/received已回收/na无需
  @Column({ type: 'varchar', default: 'not_received', comment: '原件回收状态' })
  original_status: string;

  // 质保金
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, comment: '质保金' })
  quality_deposit: number;

  // 合同模板ID
  @Column({ type: 'varchar', nullable: true, comment: '合同模板ID' })
  template_id: string;

  // 审查意见
  @Column({ type: 'text', nullable: true, comment: '审查意见' })
  review_comment: string;

  // 审查人ID
  @Column({ type: 'varchar', nullable: true, comment: '审查人ID' })
  reviewer_id: string;

  // 审查时间
  @Column({ type: 'datetime', nullable: true, comment: '审查时间' })
  review_time: Date;

  // 更正记录（JSON字符串）
  @Column({ type: 'text', nullable: true, comment: '更正记录JSON' })
  change_records: string;

  // 电子章状态：none未用/pending待盖章/used已盖章
  @Column({ type: 'varchar', default: 'none', comment: '电子章状态' })
  electronic_seal_status: string;

  // 纸质章状态：none未用/pending待盖章/used已盖章
  @Column({ type: 'varchar', default: 'none', comment: '纸质章状态' })
  paper_seal_status: string;

  // 申请用章方式：paper纸质/electronic电子/both双章
  @Column({ type: 'varchar', nullable: true, comment: '申请用章方式' })
  seal_apply_method: string;

  // 用印状态：unused未用印/pending审批中/approved已批准/used已用印/voided已作废
  @Column({ type: 'varchar', default: 'unused', comment: '用印状态' })
  seal_usage_status: string;

  // 合同文档名称
  @Column({ type: 'varchar', nullable: true, comment: '合同文档名称' })
  contract_document_name: string;

  // 合同文档编号
  @Column({ type: 'varchar', nullable: true, comment: '合同文档编号' })
  contract_document_no: string;

  // 项目角色：applicant申请人/respondent被申请人/plaintiff原告/defendant被告/other其他
  @Column({ type: 'varchar', nullable: true, comment: '项目角色' })
  project_role: string;

  // 主办律师ID
  @Column({ type: 'varchar', nullable: true, comment: '主办律师ID' })
  lead_lawyer_id: string;

  // 协助律师ID数组（JSON字符串）
  @Column({ type: 'text', nullable: true, comment: '协助律师ID JSON' })
  assistant_lawyer_ids: string;

  // 审批状态：pending待审批/approved已通过/rejected已退回
  @Column({ type: 'varchar', default: 'pending', comment: '审批状态' })
  approval_status: string;

  // 审批时间
  @Column({ type: 'datetime', nullable: true, comment: '审批时间' })
  approval_time: Date;

  // 审批人ID
  @Column({ type: 'varchar', nullable: true, comment: '审批人ID' })
  approver_id: string;

  // 合同交回状态：not_returned待交回/returned已交回/na无需
  @Column({ type: 'varchar', default: 'not_returned', comment: '合同交回状态' })
  return_status: string;

  // 协办人
  @Column({ type: 'varchar', nullable: true, comment: '协办人' })
  co_handler: string;

  // 主办人
  @Column({ type: 'varchar', nullable: true, comment: '主办人' })
  handler: string;

  // 服务费
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, comment: '服务费' })
  fee_amount: number;

  // 已收金额
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, comment: '已收金额' })
  paid_amount: number;

  // 未收金额
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, comment: '未收金额' })
  unpaid_amount: number;

  // 收款状态：not_paid未收款/partial_paid部分收款/fully_paid已收齐
  @Column({ type: 'varchar', default: 'not_paid', comment: '收款状态' })
  payment_status: string;

  // 返还状态：no_refund无退款/partial_refund部分退款/refunded已退款
  @Column({ type: 'varchar', default: 'no_refund', comment: '返还状态' })
  refund_status: string;

  // 接收日期
  @Column({ type: 'date', nullable: true, comment: '接收日期' })
  receive_date: Date;

  // 原件是否已接收
  @Column({ type: 'boolean', default: false, comment: '原件是否已接收' })
  original_received: boolean;

  // 合同分类
  @Column({ type: 'varchar', nullable: true, comment: '合同分类' })
  contract_category: string;

  // 合同来源
  @Column({ type: 'varchar', nullable: true, comment: '合同来源' })
  contract_source: string;

  // 胜诉费比例
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, comment: '胜诉费比例' })
  success_fee_ratio: number;

  // 业务类型：fixed固定收费/risk风险收费/hybrid混合收费
  @Column({ type: 'varchar', nullable: true, comment: '业务类型' })
  fee_type: string;

  // 计费周期：hourly按小时/monthly按月/case_based按案件
  @Column({ type: 'varchar', nullable: true, comment: '计费周期' })
  billing_cycle: string;

  // 付款方式：one_time一次性/installment分期/milestone里程碑
  @Column({ type: 'varchar', nullable: true, comment: '付款方式' })
  payment_method: string;

  // 分期数
  @Column({ type: 'integer', nullable: true, comment: '分期数' })
  installment_count: number;

  // 每期金额
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, comment: '每期金额' })
  installment_amount: number;

  // 退款金额
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, comment: '退款金额' })
  refund_amount: number;

  // 退款原因
  @Column({ type: 'text', nullable: true, comment: '退款原因' })
  refund_reason: string;

  // 退款日期
  @Column({ type: 'date', nullable: true, comment: '退款日期' })
  refund_date: Date;

  // 解约日期
  @Column({ type: 'date', nullable: true, comment: '解约日期' })
  termination_date: Date;

  // 解约原因
  @Column({ type: 'text', nullable: true, comment: '解约原因' })
  termination_reason: string;

  // 作废原因
  @Column({ type: 'text', nullable: true, comment: '作废原因' })
  void_reason: string;

  // 作废日期
  @Column({ type: 'date', nullable: true, comment: '作废日期' })
  void_date: Date;

  // 更正次数
  @Column({ type: 'integer', default: 0, comment: '更正次数' })
  correction_count: number;

  // 最后更正日期
  @Column({ type: 'datetime', nullable: true, comment: '最后更正日期' })
  last_correction_date: Date;

  // 关联线索ID
  @Column({ type: 'varchar', nullable: true, comment: '关联线索ID' })
  related_lead_id: string;

  // 开票状态
  @Column({ type: 'varchar', nullable: true, comment: '开票状态' })
  invoice_status: string;

  // 开票金额
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, comment: '开票金额' })
  invoice_amount: number;

  // 税额
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, comment: '税额' })
  tax_amount: number;

  // 净额（不含税）
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, comment: '净额' })
  net_amount: number;

  // 是否已结清（根据应收台账判断）
  @Column({ type: 'boolean', default: false, comment: '是否已结清（实收=应收时true）' })
  is_settled: boolean;

  // 交回人ID
  @Column({ type: 'varchar', nullable: true, comment: '交回人ID' })
  returner_id: string;

  // 交回时间
  @Column({ type: 'datetime', nullable: true, comment: '交回时间' })
  return_time: Date;

  @ManyToOne(() => Organization)
  organization: Organization;

  @Column()
  organization_id: string;

  @OneToMany(() => ContractStage, stage => stage.contract)
  stages: ContractStage[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date;
}
