import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('deployment_configs')
export class DeploymentConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  config_name: string;

  @Column({ type: 'varchar', default: 'single' })
  server_type: 'single' | 'cluster';

  @Column({ nullable: true })
  server_host: string;

  @Column({ type: 'int', nullable: true })
  server_port: number;

  @Column({ type: 'varchar', default: 'mysql' })
  db_type: string;

  @Column({ nullable: true })
  db_host: string;

  @Column({ nullable: true })
  db_name: string;

  @Column({ nullable: true })
  db_user: string;

  @Column({ type: 'varchar', default: 'redis' })
  cache_type: string;

  @Column({ nullable: true })
  cache_host: string;

  @Column({ type: 'varchar', default: 'active' })
  config_status: 'active' | 'inactive';

  @Column({ nullable: true })
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
