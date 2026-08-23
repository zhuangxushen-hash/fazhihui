import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('number_departments')
export class NumberDepartment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, comment: '所属组织ID' })
  organization_id: string;

  @Column({ type: 'varchar', nullable: false, comment: '部门名称（如 承德部）' })
  dept_name: string;

  @Column({ type: 'varchar', nullable: false, comment: '部门代码（如 CD-01）' })
  dept_code: string;

  @Column({ type: 'boolean', default: true, comment: '是否启用' })
  enabled: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
