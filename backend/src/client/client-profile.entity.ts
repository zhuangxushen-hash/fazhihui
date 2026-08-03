import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, Index } from 'typeorm';
import { Organization } from '../user/organization.entity';

@Entity('client_profiles')
@Index(['organization_id'])
@Index(['phone'])
export class ClientProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 客户名称
  @Column({ type: 'varchar', nullable: false, comment: '客户名称' })
  name: string;

  // 客户类型：individual个人/enterprise企业
  @Column({ type: 'varchar', default: 'individual', comment: '客户类型' })
  type: string;

  // 联系人
  @Column({ type: 'varchar', nullable: true, comment: '联系人' })
  contact_name: string;

  // 电话
  @Column({ type: 'varchar', nullable: true, comment: '电话' })
  phone: string;

  // 邮箱
  @Column({ type: 'varchar', nullable: true, comment: '邮箱' })
  email: string;

  // 地址
  @Column({ type: 'varchar', nullable: true, comment: '地址' })
  address: string;

  // 客户来源
  @Column({ type: 'varchar', nullable: true, comment: '客户来源' })
  source: string;

  // 客户价值等级：high高/medium中/low低
  @Column({ type: 'varchar', default: 'medium', comment: '客户价值等级' })
  value_level: string;

  // 满意度1-5
  @Column({ type: 'int', default: 3, comment: '满意度1-5' })
  satisfaction: number;

  // 备注
  @Column({ type: 'text', nullable: true, comment: '备注' })
  remarks: string;

  @ManyToOne(() => Organization)
  organization: Organization;

  @Column()
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date;
}
