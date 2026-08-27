import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { SignTemplate } from './sign-template.entity';

/**
 * 法大大签署任务模板字段配置（B端模板字段维护）
 * 记录法大大 sign-template 文档内的填写控件（字段名称/编码/类型/归属参与方），
 * 并配置每个字段的填写方式：
 * - client：由 C 端客户签署时填写
 * - prefill：由业务员发起签约时预填（可自动带出，也可手动补充）
 * - fixed：固定值，在模板维护中直接写上，发起签约时自动带入
 */
@Entity('sign_template_fields')
export class SignTemplateField {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 关联的签署模板（sign_templates.id）
  @Column({ type: 'varchar' })
  template_id: string;

  // 字段所在文档序号（fieldDocId）
  @Column({ type: 'varchar', nullable: true })
  field_doc_id: string;

  // 字段编码（fieldId，法大大控件标识）
  @Column({ type: 'varchar' })
  field_id: string;

  // 字段名称（法大大模板中的控件名称）
  @Column({ type: 'varchar' })
  field_name: string;

  // 字段类型（text_single_line / id_card / amount / number 等填写控件）
  @Column({ type: 'varchar', nullable: true })
  field_type: string;

  // 是否必填（法大大模板控件定义）
  @Column({ type: 'boolean', default: false })
  required: boolean;

  // 填写提示（法大大模板控件 tips）
  @Column({ type: 'varchar', nullable: true })
  tips: string;

  // 校验格式（法大大模板控件 checkFormat，如手机号/邮箱等）
  @Column({ type: 'varchar', nullable: true })
  check_format: string;

  // 字段归属参与方（乙方 / 甲方 / 空=未绑定），用于区分是律所填还是客户填
  @Column({ type: 'varchar', nullable: true })
  actor: string;

  // 字段填写方式：client(客户C端填) / prefill(业务员预填) / fixed(固定值)
  @Column({ type: 'varchar', default: 'client' })
  fill_mode: string;

  // 预填字段的自动带出键（如 case.subject / client.name 等，供前端自动带出）
  @Column({ type: 'varchar', nullable: true })
  auto_source: string;

  // 固定值（fill_mode=fixed 时生效，发起签约自动带入）
  @Column({ type: 'text', nullable: true })
  fixed_value: string;

  // 是否启用该字段配置
  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @ManyToOne(() => SignTemplate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'template_id' })
  template: SignTemplate;
}