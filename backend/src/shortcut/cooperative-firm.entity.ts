import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// 协作律所实体：快捷工具-协作律所
@Entity('cooperative_firms')
export class CooperativeFirm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 律所编号（自动生成）
  @Column({ type: 'varchar', nullable: false })
  firm_no: string;

  // 律所名称
  @Column({ type: 'varchar', nullable: false })
  firm_name: string;

  // 律所类型：local 本地 / chain 连锁 / boutique 精品 / other 其他
  @Column({ type: 'varchar', default: 'local' })
  firm_type: string;

  // 合作领域（逗号分隔）
  @Column({ type: 'varchar', nullable: true })
  cooperation_scope: string;

  // 联系人
  @Column({ type: 'varchar', nullable: true })
  contact_person: string;

  // 联系电话
  @Column({ type: 'varchar', nullable: true })
  contact_phone: string;

  // 所在地区
  @Column({ type: 'varchar', nullable: true })
  region: string;

  // 律所规模
  @Column({ type: 'varchar', nullable: true })
  firm_size: string;

  // 合作评级：A / B / C
  @Column({ type: 'varchar', default: 'B' })
  rating: string;

  // 合作状态：active 合作中 / paused 暂停 / ended 已终止
  @Column({ type: 'varchar', default: 'active' })
  status: string;

  // 备注
  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
