import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

// 案件节点推送规则实体：定义各节点（立案/开庭/结案等）的推送开关、内容模板与推送渠道

@Entity('push_rules')
@Index(['organization_id', 'node_type'])
export class PushRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 节点类型：filing-案件立案 / court-案件开庭 / closed-案件结案 / evidence-证据提交 / document-文书生成 / judgment-案件判决
  @Column({ type: 'varchar', nullable: false, comment: '节点类型' })
  node_type: string;

  // 节点中文名称（如 案件立案）
  @Column({ type: 'varchar', nullable: true, comment: '节点中文名称' })
  node_label: string;

  // 是否启用推送
  @Column({ type: 'boolean', default: false, comment: '是否启用推送' })
  enabled: boolean;

  // 推送内容模板（支持变量占位符）
  @Column({ type: 'text', nullable: true, comment: '推送内容模板' })
  content_template: string;

  // 推送渠道（JSON字符串数组，如 ["app","sms"]）
  @Column({ type: 'text', nullable: true, comment: '推送渠道（JSON数组）' })
  channels: string;

  // 所属组织ID
  @Column({ type: 'varchar', nullable: false, comment: '所属组织ID' })
  organization_id: string;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;
}
