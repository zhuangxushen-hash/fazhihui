import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from '../user/organization.entity';
import { Case } from '../case/case.entity';
import { User } from '../user/user.entity';

// 来源渠道
export enum TicketSourceChannel {
  CLIENT_PORTAL = 'client_portal', // C端
  PHONE = 'phone', // 电话
  WECHAT = 'wechat', // 微信
  ENTERPRISE_WECHAT = 'enterprise_wechat', // 企业微信
  OTHER = 'other', // 其他
}

// 投诉类型
export enum TicketComplaintType {
  SERVICE_ATTITUDE = 'service_attitude', // 服务态度
  CASE_PROGRESS = 'case_progress', // 案件进展
  FEE_ISSUE = 'fee_issue', // 收费问题
  LAWYER_PROFESSIONAL = 'lawyer_professional', // 律师专业度
  OTHER = 'other', // 其他
}

// 严重等级
export enum TicketSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// 工单状态
export enum TicketStatus {
  PENDING = 'pending', // 待处理
  PROCESSING = 'processing', // 处理中
  RESOLVED = 'resolved', // 已解决
  CLOSED = 'closed', // 已关闭
  ESCALATED = 'escalated', // 已升级
}

// 处理记录条目结构
export interface ProcessRecord {
  action: string; // 动作：create/assign/process/status_change/escalate/resolve/close/note
  operator_id: string; // 操作人ID
  operator_name?: string; // 操作人姓名
  content: string; // 处理内容
  from_status?: string; // 状态变更前
  to_status?: string; // 状态变更后
  created_at: string; // 记录时间 ISO
}

@Entity('complaint_tickets')
export class ComplaintTicket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false, unique: true })
  ticket_number: string;

  @Column({ type: 'varchar', nullable: false })
  source_channel: TicketSourceChannel;

  @Column({ type: 'varchar', nullable: false })
  complaint_type: TicketComplaintType;

  @Column({ type: 'varchar', default: TicketSeverity.LOW })
  severity_level: TicketSeverity;

  @Column({ type: 'varchar', nullable: false })
  title: string;

  @Column({ type: 'text', nullable: false })
  content: string;

  @Column({ nullable: true })
  case_id: string;

  @ManyToOne(() => Case, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'case_id' })
  case: Case;

  @Column({ nullable: true })
  client_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'client_id' })
  client: User;

  @Column({ nullable: true })
  client_name: string;

  @Column({ nullable: true })
  client_phone: string;

  @Column({ nullable: true })
  handler_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'handler_id' })
  handler: User;

  @Column({ type: 'varchar', default: TicketStatus.PENDING })
  status: TicketStatus;

  // 处理记录数组（JSON 永久保存）
  @Column({ type: 'text', nullable: true })
  process_records: string;

  @Column({ type: 'datetime', nullable: true })
  resolved_at: Date;

  @Column({ type: 'datetime', nullable: true })
  closed_at: Date;

  // 归档标记
  @Column({ type: 'boolean', default: false })
  archived: boolean;

  @Column({ type: 'datetime', nullable: true })
  archived_at: Date;

  // 升级标记
  @Column({ type: 'boolean', default: false })
  escalated: boolean;

  @Column({ type: 'datetime', nullable: true })
  escalated_at: Date;

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ nullable: true })
  organization_id: string;

  // 解决方案（结案时填写）
  @Column({ type: 'text', nullable: true })
  resolution: string;

  // 满意度评分
  @Column({ type: 'integer', nullable: true })
  satisfaction_score: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
