import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * 伪直播聊天消息实体
 * 记录观众在直播间发送的文字消息
 */
@Entity('fake_live_messages')
@Index(['room_id', 'created_at'])
export class FakeLiveMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 直播间ID
  @Column({ nullable: false })
  room_id: string;

  // 观众唯一标识(微信openid)
  @Column({ nullable: false })
  viewer_id: string;

  // 观众昵称
  @Column({ nullable: true })
  viewer_nickname: string;

  // 观众头像URL
  @Column({ nullable: true })
  viewer_avatar: string;

  // 消息内容
  @Column({ type: 'text', nullable: false })
  content: string;

  @CreateDateColumn()
  created_at: Date;
}
