import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

// 自动对账规则实体：定义对账匹配字段、条件和优先级

@Entity('reconciliation_rules')
@Index(['organization_id', 'is_active'])
@Index(['organization_id', 'priority'])
export class ReconciliationRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 规则名称
  @Column({ type: 'varchar', nullable: false, comment: '规则名称' })
  rule_name: string;

  // 匹配字段（JSON字符串，如 ["amount","date"]）
  @Column({ type: 'text', nullable: false, comment: '匹配字段（JSON数组）' })
  match_fields: string;

  // 匹配条件描述
  @Column({ type: 'text', nullable: true, comment: '匹配条件描述' })
  match_condition: string;

  // 优先级（数字越小越高）
  @Column({ type: 'integer', default: 100, comment: '优先级（数字越小越高）' })
  priority: number;

  // 是否启用
  @Column({ type: 'boolean', default: true, comment: '是否启用' })
  is_active: boolean;

  // 所属组织ID
  @Column({ type: 'varchar', nullable: false, comment: '所属组织ID' })
  organization_id: string;

  // 创建人ID
  @Column({ type: 'varchar', nullable: false, comment: '创建人ID' })
  created_by: string;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;
}
