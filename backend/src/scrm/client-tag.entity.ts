import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('scrm_client_tags')
export class ClientTag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  tag_name: string;

  // 标签类型: auto(自动) / manual(手动)
  @Column({ type: 'varchar', default: 'manual' })
  tag_type: string;

  // 标签分类: source(来源) / case_type(案由) / intention(意向等级) / stage(跟进阶段) / custom
  @Column({ type: 'varchar', default: 'custom' })
  category: string;

  // 自动打标规则配置(JSON 字符串)
  // 例如: { trigger: 'source_channel', value: 'douyin' } 或 { trigger: 'case_type', value: 'marriage' }
  @Column({ type: 'text', nullable: true })
  rule_config: string;

  @Column({ nullable: true })
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
