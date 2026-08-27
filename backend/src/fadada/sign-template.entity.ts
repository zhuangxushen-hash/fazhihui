import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

/**
 * 法大大签署任务模板（B端签约模板信息维护）
 * 记录法大大「签署任务模板 sign-template」的 id 与业务信息，
 * 案件详情发起签约时选择该模板，调用法大大 createWithTemplate 发起签署。
 */
@Entity('sign_templates')
export class SignTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 归属组织（律所），为空表示全局模板
  @Column({ type: 'varchar', nullable: true })
  organization_id: string;

  // 法大大签署任务模板 ID（signTemplateId）
  @Column({ type: 'varchar', unique: true })
  sign_template_id: string;

  // 模板名称
  @Column({ type: 'varchar' })
  name: string;

  // 模板描述
  @Column({ type: 'text', nullable: true })
  description: string;

  // 模板归属方企业 openId（可选，用于法大大查询/发起）
  @Column({ type: 'varchar', nullable: true })
  owner_id: string;

  // 是否启用（启用后才能被案件详情发起签约选中）
  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}