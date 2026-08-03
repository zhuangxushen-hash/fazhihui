import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, OneToMany, Index } from 'typeorm';
import { Organization } from '../user/organization.entity';
import { User } from '../user/user.entity';
import { Document } from './document.entity';
import { CaseType, CaseStatus } from '../types';

@Entity('cases')
@Index(['organization_id'])
@Index(['status'])
@Index(['case_type'])
@Index(['assignee_lawyer_id'])
@Index(['created_at'])
export class Case {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  case_type: CaseType;

  @Column({ type: 'varchar', default: CaseStatus.PENDING_ASSIGN })
  status: CaseStatus;

  @Column({ nullable: true })
  client_id: string;

  @Column({ nullable: true })
  assignee_lawyer_id: string;

  @Column({ nullable: true })
  lead_id: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  fee_amount: number;

  // 已收款金额（等于该案件所有 payment_record.amount 之和）
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, comment: '已收款金额（回款合计）' })
  fee_collected: number;

  // 已开票金额（该案件所有发票金额合计，Task9 回写）
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, comment: '已开票金额' })
  invoiced_amount: number;

  // 已到账金额（财务台账到账合计，Task7 备用）
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, comment: '已到账金额' })
  settled_amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  service_fee: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  amount: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  deadline: Date;

  @Column({ nullable: true })
  court: string;

  @Column({ nullable: true })
  case_no: string;

  @Column({ nullable: true })
  client_name: string;

  @Column({ nullable: true })
  client_phone: string;

  @Column({ nullable: true })
  filing_date: Date;

  @Column({ nullable: true })
  expected_close_date: Date;

  @Column({ type: 'varchar', default: 'low' })
  risk_level: string;

  @Column({ type: 'text', nullable: true })
  risk_notes: string;

  @Column({ type: 'boolean', default: false })
  is_overdue: boolean;

  // 案件变更状态：normal=正常 / changed=已变更 / terminated=已解约 / voided=已作废
  @Column({ type: 'varchar', default: 'normal' })
  change_status: string;

  // 变更/解约/作废原因（可空）
  @Column({ type: 'text', nullable: true })
  change_reason: string;

  // 变更/解约/作废操作时间（可空）
  @Column({ type: 'datetime', nullable: true })
  change_time: Date;

  // 变更/解约/作废操作人ID（可空）
  @Column({ type: 'varchar', nullable: true })
  change_operator_id: string;

  // 案件名称（区别于案由 case_type）
  @Column({ type: 'varchar', nullable: true, comment: '案件名称' })
  case_name: string;

  // 案件大类：civil民事/criminal刑事/admin行政/consultant顾问
  @Column({ type: 'varchar', default: 'civil', comment: '案件大类' })
  case_category: string;

  // 客户类型：individual个人/enterprise企业
  @Column({ type: 'varchar', default: 'individual', comment: '客户类型' })
  client_type: string;

  // 对方当事人
  @Column({ type: 'varchar', nullable: true, comment: '对方当事人' })
  opposing_party: string;

  // 对方代理人
  @Column({ type: 'varchar', nullable: true, comment: '对方代理人' })
  opposing_agent: string;

  // 审判庭地点
  @Column({ type: 'varchar', nullable: true, comment: '审判庭地点' })
  court_room: string;

  // 协助律师ID数组（JSON字符串，SQLite无JSON类型）
  @Column({ type: 'text', nullable: true, comment: '协助律师ID数组JSON' })
  assistant_lawyer_ids: string;

  // 律师团队
  @Column({ type: 'varchar', nullable: true, comment: '律师团队' })
  team_id: string;

  // 案件来源
  @Column({ type: 'varchar', nullable: true, comment: '案件来源' })
  case_source: string;

  // 质保金
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, comment: '质保金' })
  quality_deposit: number;

  // 关联合同ID
  @Column({ type: 'varchar', nullable: true, comment: '关联合同ID' })
  contract_id: string;

  // 关联商机ID（商机转案件路径回写）
  @Column({ type: 'varchar', nullable: true, comment: '关联商机ID' })
  opportunity_id: string;

  // 转介绍人（从线索/商机同步）
  @Column({ type: 'varchar', nullable: true, comment: '转介绍人' })
  referrer: string;

  // 来源明细（从线索/商机同步）
  @Column({ type: 'varchar', nullable: true, comment: '来源明细' })
  source_detail: string;

  // 涉密标记
  @Column({ type: 'boolean', default: false, comment: '涉密标记' })
  is_confidential: boolean;

  // 案件阶段：intake收案/processing办案/closing结案/closed已结案
  @Column({ type: 'varchar', default: 'intake', comment: '案件阶段' })
  stage: string;

  // 审批状态 pending/approved/rejected
  @Column({ type: 'varchar', default: 'pending', comment: '审批状态 pending/approved/rejected' })
  approval_status: string;

  // 审批人ID
  @Column({ type: 'varchar', nullable: true, comment: '审批人ID' })
  approver_id: string;

  // 审批时间
  @Column({ type: 'datetime', nullable: true, comment: '审批时间' })
  approval_time: Date;

  // 审批意见
  @Column({ type: 'text', nullable: true, comment: '审批意见' })
  approval_comment: string;

  @ManyToOne(() => Organization, org => org.cases)
  organization: Organization;

  @Column()
  organization_id: string;

  @ManyToOne(() => User, user => user.assigned_cases)
  assignee_lawyer: User;

  @OneToMany(() => Document, document => document.case)
  documents: Document[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date;
}
