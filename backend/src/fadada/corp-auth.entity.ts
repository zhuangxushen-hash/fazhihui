import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * 法大大企业授权记录（组织管理 → 认证授权）
 * 平台方为需要接入本应用的其他企业生成授权链接，目标企业完成法人/经办人认证与授权范围确认，
 * 授权完成后通过回调或重定向获取法大大分配的 openCorpId（企业主体唯一标识）。
 * 说明：自建应用（仅当前企业）无需授权，此模块适用于平台型应用接入其他企业主体的场景。
 */
@Entity('corp_auths')
export class CorpAuth {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 平台方业务组织（管理体系下的机构），可为空表示顶层平台方
  @Column({ type: 'varchar', nullable: true })
  organization_id: string;

  // 目标企业在本应用范围内的唯一标识（法大大 clientCorpId），同一企业复用
  @Column({ type: 'varchar', unique: true })
  client_corp_id: string;

  // 企业名称
  @Column({ type: 'varchar' })
  corp_name: string;

  // 企业统一社会信用代码
  @Column({ type: 'varchar', nullable: true })
  corp_ident_no: string;

  // 法定代表人姓名
  @Column({ type: 'varchar', nullable: true })
  legal_rep_name: string;

  // 经办人姓名
  @Column({ type: 'varchar', nullable: true })
  agent_name: string;

  // 经办人证件号
  @Column({ type: 'varchar', nullable: true })
  agent_id_card_no: string;

  // 经办人手机号（法大大登录账号）
  @Column({ type: 'varchar', nullable: true })
  agent_mobile: string;

  // 授权范围，逗号分隔存储（ident_info / seal_info / signtask_init / signtask_info / signtask_file / organization / template）
  @Column({ type: 'text', nullable: true })
  auth_scopes: string;

  // 法大大为目标企业分配的 openCorpId（授权完成后回填）
  @Column({ type: 'varchar', nullable: true })
  open_corp_id: string;

  // 授权状态：authing 待授权，authed 已授权，failed 授权失败
  @Column({ type: 'varchar', default: 'authing' })
  auth_status: string;

  // 法大大企业授权状态：authorized / unauthorized
  @Column({ type: 'varchar', nullable: true })
  binding_status: string;

  // 企业实名认证状态：identified / unidentified
  @Column({ type: 'varchar', nullable: true })
  ident_status: string;

  // 生成的授权链接
  @Column({ type: 'text', nullable: true })
  auth_url: string;

  // 授权链接过期时间（默认 3 天）
  @Column({ type: 'datetime', nullable: true })
  url_expire_at: Date;

  // 最近一次授权结果说明（成功/fail/失败原因）
  @Column({ type: 'text', nullable: true })
  auth_result: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}