import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

// 编号类型
export enum NumberType {
  CASE = 'case', // 案件编号
  CONTRACT = 'contract', // 合同号
  LEGAL_DOCUMENT = 'legal_document', // 法律文书编号
  ARCHIVE = 'archive', // 归档编号
}

// 流水类型
export enum FlowType {
  CATEGORY = 'category', // 分类流水：每个部门/分类的流水号单独编
  TOTAL = 'total', // 总流水：所有分类的流水号混在一起编
  SEPARATE = 'separate', // 单独编号：独立流水维度
}

@Entity('number_rules')
export class NumberRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, comment: '所属组织ID' })
  organization_id: string;

  @Column({ type: 'varchar', nullable: false, comment: '编号类型：case案件/contract合同/legal_document法律文书/archive归档' })
  number_type: string;

  @Column({ type: 'varchar', nullable: false, comment: '业务类型（民事诉讼/非诉/咨询等，或文书类型）' })
  biz_type: string;

  @Column({ type: 'varchar', nullable: true, comment: '部门代码（如 CD-01，为空表示默认规则不区分部门）' })
  dept_code: string;

  @Column({ type: 'varchar', nullable: false, comment: '编号格式模板，支持占位符 {year}年份 {shortName}组织简称 {deptCode}部门代码 {bizWord}业务字 {seq}流水号 {date}日期 {contractNo}案件挂接合同号' })
  format: string;

  @Column({ type: 'varchar', nullable: true, comment: '业务类型字（民/非/咨等，或文书简称）' })
  biz_word: string;

  @Column({ type: 'varchar', default: FlowType.CATEGORY, comment: '流水类型：category分类/total总/separate单独' })
  flow_type: string;

  @Column({ type: 'boolean', default: true, comment: '是否按年重置' })
  reset_yearly: boolean;

  @Column({ type: 'boolean', default: false, comment: '法律文书是否挂接案件（true=合同号-文书流水，false=独立编号）' })
  link_case: boolean;

  @Column({ type: 'boolean', default: true, comment: '是否启用' })
  enabled: boolean;

  @Column({ type: 'text', nullable: true, comment: '备注' })
  remarks: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
