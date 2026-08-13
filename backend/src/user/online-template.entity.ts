import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// 模板类型：document 文书模板 / contract 合同模板 / report 报告模板
export const TEMPLATE_TYPE = {
  DOCUMENT: 'document',
  CONTRACT: 'contract',
  REPORT: 'report',
} as const;

@Entity('online_templates')
export class OnlineTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 模板名称
  @Column({ type: 'varchar', nullable: false, comment: '模板名称' })
  name: string;

  // 模板类型
  @Column({ type: 'varchar', default: TEMPLATE_TYPE.DOCUMENT, comment: '模板类型' })
  template_type: string;

  // 模板分类（起诉状/合同/报告等）
  @Column({ type: 'varchar', nullable: true, comment: '模板分类' })
  category: string;

  // 模板内容（含占位符）
  @Column({ type: 'text', nullable: true, comment: '模板内容' })
  content: string;

  // 使用次数
  @Column({ type: 'int', default: 0, comment: '使用次数' })
  usage_count: number;

  // 是否热门
  @Column({ type: 'boolean', default: false, comment: '是否热门' })
  is_hot: boolean;

  // 创建人ID
  @Column({ type: 'varchar', nullable: true, comment: '创建人ID' })
  creator_id: string;

  @Column({ type: 'varchar', comment: '机构ID' })
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
