import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('seal_records')
export class SealRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  application_id: string;

  @Column({ type: 'varchar', nullable: false })
  seal_id: string;

  @Column({ type: 'varchar', nullable: false })
  operator_id: string;

  @Column({ type: 'varchar', nullable: false })
  document_name: string;

  @Column({ type: 'int', default: 1 })
  usage_count: number;

  @Column({ type: 'datetime', nullable: false })
  seal_time: Date;

  @Column({ type: 'varchar', nullable: false })
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  // 软删除时间（DeleteDateColumn 查询默认过滤已删除记录）
  @DeleteDateColumn({ nullable: true })
  deleted_at: Date;
}
