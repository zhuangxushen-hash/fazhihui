import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('scrm_script_libraries')
export class ScriptLibrary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 话术分类: greeting(开场白) / case_consult(案由咨询) / objection(异议处理) / closing(促单成交) / follow_up(跟进) / other
  @Column({ type: 'varchar', default: 'other' })
  category: string;

  @Column({ nullable: false })
  title: string;

  @Column({ type: 'text', nullable: false })
  content: string;

  // 关联素材ID列表(JSON 数组字符串)
  @Column({ type: 'text', nullable: true })
  material_ids: string;

  @Column({ nullable: true })
  organization_id: string;

  @Column({ nullable: true })
  created_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
