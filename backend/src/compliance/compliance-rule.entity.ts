import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum CheckStage {
  ACQUISITION = 'acquisition', // 获客
  NEGOTIATION = 'negotiation', // 谈案
  SIGNING = 'signing', // 签约
  CASE_HANDLING = 'case_handling', // 办案
  CLOSING = 'closing', // 结案
  FINANCE = 'finance', // 财务
}

export enum RuleType {
  KEYWORD = 'keyword', // 关键词
  REGEX = 'regex', // 正则
  MANUAL = 'manual', // 人工
}

@Entity('compliance_rules')
export class ComplianceRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Column({ type: 'varchar', nullable: false })
  check_stage: CheckStage;

  @Column({ type: 'varchar', nullable: false })
  rule_type: RuleType;

  // JSON 配置：关键词数组 / 正则表达式 / 人工检查说明
  @Column({ type: 'text', nullable: false })
  conditions: string;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
