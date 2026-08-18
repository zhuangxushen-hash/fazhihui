import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Organization } from '../user/organization.entity';
import { User } from '../user/user.entity';
import { FollowUp } from './follow-up.entity';
import { LeadSource, LeadStatus, CaseType } from '../types';

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  source_channel: LeadSource;

  @Column({ nullable: true })
  source_keyword: string;

  @Column({ type: 'varchar', nullable: true })
  case_type: CaseType;

  @Column({ type: 'varchar', default: LeadStatus.NEW })
  status: LeadStatus;

  @Column({ nullable: true })
  assign_sales_id: string;

  @Column({ nullable: false })
  phone: string;

  @Column({ nullable: true })
  contact_name: string;

  @Column({ type: 'text', nullable: true })
  case_description: string;

  @Column({ nullable: true })
  landing_page: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  service_fee: number;

  @ManyToOne(() => Organization, org => org.leads)
  organization: Organization;

  @Column()
  organization_id: string;

  @ManyToOne(() => User, user => user.assigned_leads)
  assign_sales: User;

  @OneToMany(() => FollowUp, followUp => followUp.lead)
  follow_ups: FollowUp[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ nullable: true })
  follow_up_time: Date;

  // 是否公共线索池
  @Column({ type: 'boolean', default: false, comment: '是否公共线索池' })
  is_public: boolean;

  // 转介绍人（来源：谁介绍的这个客户）
  @Column({ type: 'varchar', nullable: true, comment: '转介绍人' })
  referrer: string;

  // 线索来源明细（比如：朋友推荐-张三、百度搜索-关键词、抖音广告-xx视频）
  @Column({ type: 'varchar', nullable: true, comment: '线索来源明细' })
  lead_source_detail: string;

  // 转化后的案件ID（线索→案件/线索→商机→案件 两种路径都回写）
  @Column({ type: 'varchar', nullable: true, comment: '转化案件ID' })
  case_id: string;

  // 转化时间
  @Column({ type: 'datetime', nullable: true, comment: '转化时间' })
  conversion_time: Date;

  // 转化状态：not_converted未转化/converting转化中/converted已转化
  @Column({ type: 'varchar', default: 'not_converted', comment: '转化状态' })
  conversion_status: string;

  // 单位名称
  @Column({ type: 'varchar', nullable: true, comment: '单位名称' })
  unit_name: string;

  // 业务摘要
  @Column({ type: 'text', nullable: true, comment: '业务摘要' })
  business_summary: string;

  // 所属团队
  @Column({ type: 'varchar', nullable: true, comment: '所属团队' })
  team: string;

  // 主办人
  @Column({ type: 'varchar', nullable: true, comment: '主办人' })
  handler: string;

  // 省份
  @Column({ type: 'varchar', nullable: true, comment: '省份' })
  province: string;

  // 城市
  @Column({ type: 'varchar', nullable: true, comment: '城市' })
  city: string;

  // 联系地址
  @Column({ type: 'varchar', nullable: true, comment: '联系地址' })
  contact_address: string;

  // 预估金额
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, comment: '预估金额' })
  amount: number;

  // 意向等级：high高/medium中/low低
  @Column({ type: 'varchar', nullable: true, comment: '意向等级' })
  intent_level: string;

  // 接洽结果：not_contacted未接洽/contacting接洽中/deal_closed已成交/abandoned已放弃/converted已转化
  @Column({ type: 'varchar', nullable: true, comment: '接洽结果' })
  contact_result: string;

  // 业务员
  @Column({ type: 'varchar', nullable: true, comment: '业务员' })
  assignee: string;

  // 业务来源
  @Column({ type: 'varchar', nullable: true, comment: '业务来源' })
  business_source: string;

  // 登记日期
  @Column({ type: 'date', nullable: true, comment: '登记日期' })
  register_date: Date;
}
