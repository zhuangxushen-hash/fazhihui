import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Organization } from '../user/organization.entity';

// 会议室状态常量（使用 varchar，避免使用 enum）
export const MeetingRoomStatus = {
  AVAILABLE: 'available', // 可用
  INACTIVE: 'inactive', // 停用
} as const;

@Entity('meeting_rooms')
export class MeetingRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 名称
  @Column({ type: 'varchar', nullable: false })
  name: string;

  // 位置
  @Column({ type: 'varchar', nullable: true })
  location: string;

  // 容纳人数
  @Column({ type: 'int', default: 0 })
  capacity: number;

  // 状态：available可用 / inactive停用
  @Column({ type: 'varchar', length: 20, default: MeetingRoomStatus.AVAILABLE })
  status: string;

  @ManyToOne(() => Organization)
  organization: Organization;

  @Column()
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;
}
