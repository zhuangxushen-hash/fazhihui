import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

// 财产保全类型：pre-litigation诉前保全 / litigation诉讼保全 / arbitration仲裁保全 / enforcement执行保全
// 保全状态：draft草稿 / pending待审批 / approved已批准 / implemented已实施 / released已解除 / expired已过期 / rejected被驳回
// 财产类型：cash银行存款 / real_estate房产 / vehicle车辆 / equity股权 / securities证券 / receivable应收账款 / other其他

@Entity('property_preservation')
export class PropertyPreservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 保全编号（自动生成）
  @Column({ type: 'varchar', nullable: false, comment: '保全编号' })
  preservation_no: string;

  // 关联案件ID
  @Column({ type: 'varchar', nullable: true, comment: '关联案件ID' })
  case_id: string;

  // 关联案件名称（冗余）
  @Column({ type: 'varchar', nullable: true, comment: '关联案件名称' })
  case_name: string;

  // 关联合同ID
  @Column({ type: 'varchar', nullable: true, comment: '关联合同ID' })
  contract_id: string;

  // 保全类型
  @Column({ type: 'varchar', default: 'litigation', comment: '保全类型' })
  preservation_type: string;

  // 保全状态
  @Column({ type: 'varchar', default: 'draft', comment: '保全状态' })
  status: string;

  // 申请人（本方）
  @Column({ type: 'varchar', nullable: false, comment: '申请人（本方）' })
  applicant: string;

  // 被申请人（对方）
  @Column({ type: 'varchar', nullable: false, comment: '被申请人（对方）' })
  respondent: string;

  // 申请保全金额
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, comment: '申请保全金额' })
  amount: number;

  // 实际保全金额
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, comment: '实际保全金额' })
  actual_amount: number;

  // 受理法院
  @Column({ type: 'varchar', nullable: true, comment: '受理法院' })
  court: string;

  // 审判庭
  @Column({ type: 'varchar', nullable: true, comment: '审判庭' })
  court_room: string;

  // 承办法官
  @Column({ type: 'varchar', nullable: true, comment: '承办法官' })
  judge: string;

  // 财产类型
  @Column({ type: 'varchar', default: 'other', comment: '财产类型' })
  property_type: string;

  // 财产明细（JSON字符串：[{type, name, value, location}]）
  @Column({ type: 'text', nullable: true, comment: '财产明细JSON' })
  property_details: string;

  // 担保方式：cash现金/insurance保函/guarantee保证/pledge抵押/pledge_assets质押
  @Column({ type: 'varchar', default: 'insurance', comment: '担保方式' })
  guarantee_method: string;

  // 担保金额
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, comment: '担保金额' })
  guarantee_amount: number;

  // 保函/担保公司名称
  @Column({ type: 'varchar', nullable: true, comment: '保函/担保公司名称' })
  guarantee_company: string;

  // 申请日期
  @Column({ type: 'date', nullable: true, comment: '申请日期' })
  apply_date: Date;

  // 受理日期
  @Column({ type: 'date', nullable: true, comment: '受理日期' })
  accept_date: Date;

  // 实施日期（裁定日期）
  @Column({ type: 'date', nullable: true, comment: '实施日期' })
  implement_date: Date;

  // 到期日期
  @Column({ type: 'date', nullable: true, comment: '到期日期' })
  expire_date: Date;

  // 解除日期
  @Column({ type: 'date', nullable: true, comment: '解除日期' })
  release_date: Date;

  // 裁定文书名称
  @Column({ type: 'varchar', nullable: true, comment: '裁定文书名称' })
  ruling_document: string;

  // 裁定文书编号
  @Column({ type: 'varchar', nullable: true, comment: '裁定文书编号' })
  ruling_no: string;

  // 主办律师ID
  @Column({ type: 'varchar', nullable: true, comment: '主办律师ID' })
  lead_lawyer_id: string;

  // 协办律师ID（JSON字符串数组）
  @Column({ type: 'text', nullable: true, comment: '协办律师ID JSON' })
  assistant_lawyer_ids: string;

  // 业务主管ID
  @Column({ type: 'varchar', nullable: true, comment: '业务主管ID' })
  supervisor_id: string;

  // 审批人ID
  @Column({ type: 'varchar', nullable: true, comment: '审批人ID' })
  approver_id: string;

  // 审批时间
  @Column({ type: 'datetime', nullable: true, comment: '审批时间' })
  approve_time: Date;

  // 审批意见
  @Column({ type: 'text', nullable: true, comment: '审批意见' })
  approve_comment: string;

  // 备注
  @Column({ type: 'text', nullable: true, comment: '备注' })
  remarks: string;

  // 附件（JSON字符串数组：[{name, path, size}]）
  @Column({ type: 'text', nullable: true, comment: '附件JSON' })
  attachments: string;

  @Column({ type: 'varchar', nullable: false, comment: '组织ID' })
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
