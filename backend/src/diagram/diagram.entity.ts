import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Organization } from '../user/organization.entity';

// 图表类型: mindmap思维导图 / flowchart流程图 / relation法律关系图 / organization组织架构
// content 字段为 JSON 字符串: { nodes: [{ id, x, y, text, color }], edges: [{ from, to, label }] }

@Entity('diagrams')
export class Diagram {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false, comment: '图表标题' })
  title: string;

  @Column({ type: 'varchar', nullable: false, comment: '图表类型' })
  type: string;

  @Column({ type: 'text', nullable: true, comment: '图表内容JSON: {nodes:[{id,x,y,text,color}],edges:[{from,to,label}]}' })
  content: string;

  @Column({ type: 'varchar', nullable: true, comment: '关联案件ID' })
  case_id: string;

  @Column({ type: 'varchar', nullable: true, comment: '创建人ID' })
  creator_id: string;

  @ManyToOne(() => Organization)
  organization: Organization;

  @Column({ nullable: true })
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
