import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('number_sequences')
export class NumberSequence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, comment: '所属组织ID' })
  organization_id: string;

  @Column({ type: 'varchar', nullable: false, comment: '编号类型' })
  number_type: string;

  @Column({ type: 'varchar', nullable: false, comment: '业务类型' })
  biz_type: string;

  @Column({ type: 'varchar', nullable: true, comment: '部门代码（分类流水维度）' })
  dept_code: string;

  @Column({ type: 'varchar', nullable: true, comment: '关联案件ID（案件挂接流水维度）' })
  case_id: string;

  @Column({ type: 'varchar', nullable: false, comment: '年份（按年重置维度，不重置时为 all）' })
  year: string;

  @Column({ type: 'int', default: 0, comment: '当前流水号' })
  seq: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
