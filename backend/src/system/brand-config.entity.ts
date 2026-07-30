import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('brand_configs')
export class BrandConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  brand_name: string;

  @Column({ nullable: true })
  logo_url: string;

  @Column({ nullable: true })
  favicon_url: string;

  @Column({ nullable: true })
  primary_color: string;

  @Column({ nullable: true })
  secondary_color: string;

  @Column({ type: 'varchar', default: 'light' })
  theme_type: 'light' | 'dark' | 'custom';

  @Column({ nullable: true })
  login_banner_url: string;

  @Column({ nullable: true })
  copyright_text: string;

  @Column({ nullable: true })
  icp_number: string;

  @Column({ type: 'varchar', default: 'active' })
  status: 'active' | 'inactive';

  @Column({ nullable: true })
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
