import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Case } from '../case/case.entity';
import { User } from '../user/user.entity';
import { Organization } from '../user/organization.entity';

/**
 * 案件进度主动推送记录实体（模块7.2）
 * 用于案件节点变更时主动向客户推送进度通知，屏蔽敏感信息
 */
@Entity('case_push_notifications')
export class CasePushNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 案件ID
  @Column({ type: 'varchar', nullable: false })
  case_id: string;

  @ManyToOne(() => Case)
  @JoinColumn({ name: 'case_id' })
  case: Case;

  // 客户ID
  @Column({ type: 'varchar', nullable: false })
  client_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'client_id' })
  client: User;

  // 节点类型：filing-立案 / court-开庭 / judgment-判决 / closed-结案
  @Column({ type: 'varchar', nullable: false })
  node_type: string;

  // 推送内容（标准化模板生成，屏蔽敏感信息）
  @Column({ type: 'text', nullable: false })
  push_content: string;

  // 推送渠道：wechat-微信 / sms-短信 / in_app-站内信
  @Column({ type: 'varchar', default: 'in_app' })
  push_channel: string;

  // 推送时间
  @Column({ type: 'datetime', nullable: true })
  push_time: Date;

  // 推送状态：pending-待发送 / sent-已发送 / failed-发送失败
  @Column({ type: 'varchar', default: 'pending' })
  status: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ type: 'varchar', nullable: true })
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  // 实际发送时间
  @Column({ type: 'datetime', nullable: true })
  sent_at: Date;
}
