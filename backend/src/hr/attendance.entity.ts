import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Organization } from '../user/organization.entity';

// 考勤状态常量（使用 varchar，避免使用 enum）
export const AttendanceStatus = {
  NORMAL: 'normal', // 正常
  LATE: 'late', // 迟到
  EARLY_LEAVE: 'early_leave', // 早退
  ABSENT: 'absent', // 缺勤
  LEAVE: 'leave', // 请假
} as const;

@Entity('hr_attendances')
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 用户ID
  @Column({ nullable: false })
  user_id: string;

  // 考勤日期（YYYY-MM-DD）
  @Column({ type: 'date' })
  attendance_date: string;

  // 上班打卡时间
  @Column({ type: 'datetime', nullable: true })
  clock_in_time: Date;

  // 下班打卡时间
  @Column({ type: 'datetime', nullable: true })
  clock_out_time: Date;

  // 状态：normal正常 / late迟到 / early_leave早退 / absent缺勤 / leave请假
  @Column({ type: 'varchar', length: 20, default: AttendanceStatus.NORMAL })
  status: string;

  // 工作时长（小时）
  @Column({ type: 'decimal', precision: 5, scale: 1, default: 0 })
  work_hours: number;

  // 备注
  @Column({ type: 'text', nullable: true })
  remarks: string;

  @ManyToOne(() => Organization)
  organization: Organization;

  @Column()
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
