import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Lead } from '../lead/lead.entity';
import { Case } from '../case/case.entity';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  name: string;

  // 组织简称
  @Column({ type: 'varchar', nullable: true })
  short_name: string;

  // 联系人
  @Column({ type: 'varchar', nullable: true })
  contact_name: string;

  // 联系电话
  @Column({ type: 'varchar', nullable: true })
  contact_phone: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ nullable: true })
  domain: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  license_no: string;

  // 组织描述
  @Column({ type: 'text', nullable: true })
  description: string;

  // 状态：active 正常 / inactive 停用
  @Column({ type: 'varchar', default: 'active' })
  status: string;

  @OneToMany(() => User, user => user.organization)
  users: User[];

  @OneToMany(() => Lead, lead => lead.organization)
  leads: Lead[];

  @OneToMany(() => Case, caseEntity => caseEntity.organization)
  cases: Case[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
