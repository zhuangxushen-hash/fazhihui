import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, DeleteDateColumn, Index } from 'typeorm';

// 用印申请状态：pending待审批 / approved已通过 / rejected已驳回 / used已盖章 / voided已作废
// 用印介质：paper纸质 / electronic电子

@Entity('seal_applications')
@Index(['status'])
export class SealApplication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  applicant_id: string;

  @Column({ type: 'varchar', nullable: true })
  case_id: string;

  // 关联合同ID
  @Column({ type: 'varchar', nullable: true, comment: '关联合同ID' })
  contract_id: string;

  @Column({ type: 'varchar', nullable: false })
  seal_id: string;

  @Column({ type: 'varchar', nullable: false })
  document_name: string;

  // 文档编号
  @Column({ type: 'varchar', nullable: true, comment: '文档编号' })
  document_no: string;

  // 文档创建人ID
  @Column({ type: 'varchar', nullable: true, comment: '文档创建人ID' })
  creator_id: string;

  // 文档类型：contract合同/letter函件/other其他
  @Column({ type: 'varchar', default: 'contract', comment: '文档类型' })
  document_type: string;

  // 文书类别：所函/出庭函/律所证明/律师函/其他
  @Column({ type: 'varchar', nullable: true, comment: '文书类别' })
  document_category: string;

  // 用印介质：paper纸质/electronic电子
  @Column({ type: 'varchar', default: 'paper', comment: '用印介质' })
  seal_medium: string;

  @Column({ type: 'text', nullable: false })
  purpose: string;

  @Column({ type: 'int', default: 1 })
  usage_count: number;

  @Column({ type: 'varchar', default: 'pending' })
  status: string;

  @Column({ type: 'datetime', nullable: false })
  apply_time: Date;

  @Column({ type: 'datetime', nullable: true })
  approve_time: Date;

  @Column({ type: 'varchar', nullable: true })
  approver_id: string;

  @Column({ type: 'text', nullable: true })
  approve_comment: string;

  // 涉密标记
  @Column({ type: 'boolean', default: false, comment: '涉密标记' })
  is_confidential: boolean;

  // 盖章类型：normal普通/watermark水印/paging骑缝
  @Column({ type: 'varchar', default: 'normal', comment: '盖章类型' })
  seal_type: string;

  // 作废状态：not_voided未作废/voided已作废/recovered已收回
  @Column({ type: 'varchar', default: 'not_voided', comment: '作废收回状态' })
  void_status: string;

  // 作废原因
  @Column({ type: 'text', nullable: true, comment: '作废原因' })
  void_reason: string;

  // 作废时间
  @Column({ type: 'datetime', nullable: true, comment: '作废时间' })
  void_time: Date;

  // 作废操作人ID
  @Column({ type: 'varchar', nullable: true, comment: '作废操作人ID' })
  void_operator_id: string;

  // 收回时间
  @Column({ type: 'datetime', nullable: true, comment: '收回时间' })
  recover_time: Date;

  // 收回操作人ID
  @Column({ type: 'varchar', nullable: true, comment: '收回操作人ID' })
  recover_operator_id: string;

  // 项目/案源名称（冗余存储，方便查询）
  @Column({ type: 'varchar', nullable: true, comment: '项目/案源名称' })
  case_name: string;

  @Column({ type: 'varchar', nullable: false })
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date;
}
