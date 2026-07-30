import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'varchar', default: 'system' })
  type: string;

  @Column({ default: 'high' })
  level: string;

  @Column({ nullable: true })
  sender_id: string;

  @Column({ nullable: false })
  receiver_id: string;

  @Column({ type: 'boolean', default: false })
  is_read: boolean;

  @Column({ nullable: true })
  related_type: string;

  @Column({ nullable: true })
  related_id: string;

  @Column({ type: 'json', nullable: true })
  extra_data: any;

  @CreateDateColumn()
  created_at: Date;
}
