import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Organization } from '../user/organization.entity';

// 活动报名记录实体
@Entity('hr_activity_registrations')
export class ActivityRegistration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 活动ID
  @Column({ nullable: false })
  activity_id: string;

  // 报名人ID
  @Column({ nullable: false })
  user_id: string;

  // 报名时间（冗余，便于查询）
  @CreateDateColumn()
  created_at: Date;
}
