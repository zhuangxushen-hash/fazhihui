import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * 伪直播观众记录实体
 * 记录观众进入/离开直播间的行为
 */
@Entity('fake_live_viewers')
@Index(['room_id', 'openid'])
export class FakeLiveViewer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 直播间ID
  @Column({ nullable: false })
  room_id: string;

  // 微信openid
  @Column({ nullable: false })
  openid: string;

  // 观众昵称
  @Column({ nullable: true })
  nickname: string;

  // 观众头像URL
  @Column({ nullable: true })
  avatar: string;

  // 进入时间
  @Column({ type: 'datetime', nullable: true })
  enter_at: Date;

  // 离开时间
  @Column({ type: 'datetime', nullable: true })
  leave_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
