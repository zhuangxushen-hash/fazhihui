import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('scrm_chat_archives')
export class ChatArchive {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  client_id: string;

  @Column({ nullable: false })
  employee_id: string;

  // 消息类型: text / image / voice / video / file
  @Column({ type: 'varchar', default: 'text' })
  message_type: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ nullable: true })
  file_path: string;

  // 消息发送时间
  @Column({ type: 'datetime', nullable: true })
  sent_at: Date;

  // 归档时间
  @CreateDateColumn()
  archived_at: Date;

  @Column({ nullable: true })
  organization_id: string;

  // 是否已同步至合规质检
  @Column({ type: 'boolean', default: false })
  compliance_synced: boolean;

  // 合规质检结果: pass / warning / reject
  @Column({ type: 'varchar', nullable: true })
  compliance_result: string;
}
