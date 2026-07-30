import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('menus')
export class Menu {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  parent_id: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  path: string;

  @Column({ nullable: true })
  icon: string;

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @Column({ default: true })
  is_visible: boolean;

  @Column({ type: 'json', nullable: true })
  permissions: string[];

  @Column({ nullable: true })
  component: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
