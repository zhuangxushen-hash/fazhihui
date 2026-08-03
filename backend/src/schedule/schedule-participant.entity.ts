import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Organization } from '../user/organization.entity';

// 参与人响应状态常量（使用 varchar，避免使用 enum）
export const ParticipantStatus = {
  PENDING: 'pending', // 待响应
  ACCEPTED: 'accepted', // 已接受
  DECLINED: 'declined', // 已拒绝
} as const;

@Entity('schedule_participants')
export class ScheduleParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 日程ID
  @Column({ type: 'varchar', nullable: false })
  schedule_id: string;

  // 用户ID
  @Column({ type: 'varchar', nullable: false })
  user_id: string;

  // 响应状态：pending待响应 / accepted已接受 / declined已拒绝
  @Column({ type: 'varchar', length: 20, default: ParticipantStatus.PENDING })
  status: string;

  @ManyToOne(() => Organization)
  organization: Organization;

  @Column()
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;
}
