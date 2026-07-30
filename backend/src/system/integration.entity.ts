import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('integrations')
export class Integration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  integration_name: string;

  @Column({ type: 'varchar', default: 'third_party' })
  integration_type: 'wechat' | 'wework' | 'alipay' | 'third_party' | 'api';

  @Column({ nullable: true })
  app_id: string;

  @Column({ type: 'text', nullable: true })
  app_secret: string;

  @Column({ nullable: true })
  api_url: string;

  @Column({ nullable: true })
  webhook_url: string;

  @Column({ type: 'varchar', default: 'pending' })
  status: 'active' | 'inactive' | 'pending';

  @Column({ type: 'text', nullable: true })
  config: string;

  @Column({ nullable: true })
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
