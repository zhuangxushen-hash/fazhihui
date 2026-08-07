import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Organization } from '../user/organization.entity';

// 邮件类型常量（使用 varchar，避免使用 enum）
export const MailType = {
  INBOX: 'inbox', // 收件
  SENT: 'sent', // 已发
  DRAFT: 'draft', // 草稿
  TRASH: 'trash', // 已删
} as const;

@Entity('mails')
export class Mail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 发件人ID
  @Column({ nullable: false })
  sender_id: string;

  // 收件人ID数组JSON
  @Column({ type: 'text', nullable: false })
  recipient_ids: string;

  // 抄送人ID数组JSON（可空）
  @Column({ type: 'text', nullable: true })
  cc_ids: string;

  // 主题
  @Column({ type: 'varchar', length: 255 })
  subject: string;

  // 正文
  @Column({ type: 'text' })
  content: string;

  // 附件JSON数组（可空）
  @Column({ type: 'text', nullable: true })
  attachments: string;

  // 是否已读
  @Column({ type: 'boolean', default: false })
  is_read: boolean;

  // 是否星标
  @Column({ type: 'boolean', default: false })
  is_starred: boolean;

  // 邮件类型：inbox收件 / sent已发 / draft草稿 / trash已删
  @Column({ type: 'varchar', length: 20, default: MailType.INBOX })
  mail_type: string;

  // 发送时间
  @Column({ type: 'datetime', nullable: true })
  sent_time: Date;

  @ManyToOne(() => Organization)
  organization: Organization;

  @Column()
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
