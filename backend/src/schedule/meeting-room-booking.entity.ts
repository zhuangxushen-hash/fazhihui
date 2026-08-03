import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Organization } from '../user/organization.entity';

// 会议室预约状态常量（使用 varchar，避免使用 enum）
export const BookingStatus = {
  PENDING: 'pending', // 待审批
  APPROVED: 'approved', // 已批准
  REJECTED: 'rejected', // 已拒绝
} as const;

@Entity('meeting_room_bookings')
export class MeetingRoomBooking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 会议室ID
  @Column({ type: 'varchar', nullable: false })
  room_id: string;

  // 关联日程ID
  @Column({ type: 'varchar', nullable: false })
  schedule_id: string;

  // 预约日期
  @Column({ type: 'date', nullable: false })
  booking_date: string;

  // 开始时间
  @Column({ type: 'datetime', nullable: false })
  start_time: Date;

  // 结束时间
  @Column({ type: 'datetime', nullable: false })
  end_time: Date;

  // 预约人ID
  @Column({ type: 'varchar', nullable: false })
  booker_id: string;

  // 状态：pending待审批 / approved已批准 / rejected已拒绝
  @Column({ type: 'varchar', length: 20, default: BookingStatus.PENDING })
  status: string;

  @ManyToOne(() => Organization)
  organization: Organization;

  @Column()
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;
}
