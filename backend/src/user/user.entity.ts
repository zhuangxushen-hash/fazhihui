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

  // 所属团队 id（可选，关联 team 表；用户管理维护）
  @Column({ type: 'varchar', nullable: true })
  team_id: string;

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

  // 员工档案扩展字段：部门
  @Column({ type: 'varchar', nullable: true, comment: '部门' })
  department: string;

  // 员工档案扩展字段：职位
  @Column({ type: 'varchar', nullable: true, comment: '职位' })
  position: string;

  // 员工档案扩展字段：入职日期
  @Column({ type: 'date', nullable: true, comment: '入职日期' })
  hire_date: Date;

  // 员工档案扩展字段：银行账号
  @Column({ type: 'varchar', nullable: true, comment: '银行账号' })
  bank_account: string;

  // 员工档案扩展字段：开户行
  @Column({ type: 'varchar', nullable: true, comment: '开户行' })
  bank_name: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
