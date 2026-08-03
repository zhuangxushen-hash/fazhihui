import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Organization } from './organization.entity';
import { Lead } from '../lead/lead.entity';
import { Case } from '../case/case.entity';
import { UserRole } from '../types';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  real_name: string;

  @Column({ unique: true, nullable: false })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  @Exclude()
  password: string;

  @Column({ type: 'varchar', nullable: false })
  role: UserRole;

  @Column({ nullable: true })
  credentials_no: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ default: true })
  status: boolean;

  @ManyToOne(() => Organization, org => org.users, { nullable: true })
  organization: Organization;

  @Column({ nullable: true })
  organization_id: string;

  @OneToMany(() => Lead, lead => lead.assign_sales)
  assigned_leads: Lead[];

  @OneToMany(() => Case, caseEntity => caseEntity.assignee_lawyer)
  assigned_cases: Case[];

  // 经验值（工作日志审批/任务完成等积累）
  @Column({ type: 'int', default: 0, comment: '经验值' })
  experience: number;

  // 等级（Lv1起，根据经验值自动计算，每1000经验升1级）
  @Column({ type: 'int', default: 1, comment: '等级' })
  level: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
