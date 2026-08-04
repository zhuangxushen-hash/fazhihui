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

  @Column({ type: 'varchar', nullable: false })
  organization_id: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}