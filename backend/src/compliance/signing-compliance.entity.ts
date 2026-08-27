import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { RiskDisclosure } from './risk-disclosure.entity';

export enum SigningStatus {
  PENDING = 'pending',
  REVIEWING = 'reviewing',
  SIGNED = 'signed',
  REJECTED = 'rejected',
}

@Entity('signing_compliance')
export class SigningCompliance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  case_id: string;

  @Column({ type: 'varchar', nullable: false })
  client_id: string;

  @Column({ type: 'varchar', nullable: false })
  lawyer_id: string;

  @Column({ type: 'varchar', nullable: true })
  contract_template_id: string;

  @Column({ type: 'varchar', default: 'pending' })
  status: SigningStatus;

  @Column({ type: 'boolean', default: false })
  lawyer_qualification_verified: boolean;

  // ========== 风险告知：外键关联（B8 合并） ==========
  // 新外键字段（主）：关联风险告知记录
  @Column({ type: 'varchar', nullable: true })
  risk_disclosure_id: string;

  @ManyToOne(() => RiskDisclosure, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'risk_disclosure_id' })
  risk_disclosure: RiskDisclosure;

  // ========== 冗余兼容字段（保留原逻辑，不要删除） ==========
  // 冗余字段：若 risk_disclosure_id 为空则继续使用；否则自动同步取值
  @Column({ type: 'boolean', default: false })
  risk_disclosure_signed: boolean;

  @Column({ type: 'boolean', default: false })
  contract_compliance_passed: boolean;

  @Column({ type: 'text', nullable: true })
  contract_compliance_issues: string;

  @Column({ type: 'text', nullable: true })
  contract_content: string;

  @Column({ type: 'datetime', nullable: true })
  signed_time: Date;

  @Column({ type: 'datetime', nullable: true })
  risk_disclosure_time: Date;

  // ========== 法大大电子签（身份鉴别 + 电子签名） ==========
  // 签约主体类型：person 个人 / corp 企业（企业时走企业实名认证，以企业主体签署）
  @Column({ type: 'varchar', default: 'person', comment: '签约主体类型 person/corp' })
  subject_type: string;

  // 客户身份证号（个人实名认证/签署主体证件匹配）
  @Column({ type: 'varchar', nullable: true })
  id_card_no: string;

  // 企业名称（企业实名认证/签署主体匹配）
  @Column({ type: 'varchar', nullable: true, comment: '企业名称' })
  corp_name: string;

  // 企业统一社会信用代码
  @Column({ type: 'varchar', nullable: true, comment: '企业统一社会信用代码' })
  corp_ident_no: string;

  // 企业法定代表人姓名（企业实名认证用）
  @Column({ type: 'varchar', nullable: true, comment: '企业法定代表人' })
  legal_rep_name: string;

  // 实名认证状态：none 未认证 / pending 认证中 / verified 已认证 / failed 认证失败
  @Column({ type: 'varchar', default: 'none' })
  verify_status: string;

  // 法大大实名认证交易流水号（自定义追踪号）
  @Column({ type: 'varchar', nullable: true })
  fadada_verify_transaction_id: string;

  // 法大大签署任务ID
  @Column({ type: 'varchar', nullable: true })
  fadada_sign_task_id: string;

  // 法大大签署任务中客户参与方ID
  @Column({ type: 'varchar', nullable: true })
  fadada_actor_id: string;

  // 法大大签署链接（参与方专属链接）
  @Column({ type: 'varchar', nullable: true })
  sign_url: string;

  // B端发起时预填字段值（系统自动带出 + 业务员预填，JSON 数组），C 端提交签署时一并传入法大大，避免信息丢失
  @Column({ type: 'text', nullable: true })
  prefill_values: string;

  // 实名认证完成时间
  @Column({ type: 'datetime', nullable: true })
  verify_time: Date;

  @Column({ type: 'varchar', nullable: false })
  organization_id: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}