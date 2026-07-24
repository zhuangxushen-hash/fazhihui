import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('scrm_client_tag_relations')
export class ClientTagRelation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  client_id: string;

  @Column({ nullable: false })
  tag_id: string;

  // 打标人ID(auto 表示系统自动打标)
  @Column({ nullable: true })
  tagged_by: string;

  @CreateDateColumn()
  tagged_at: Date;

  @Column({ nullable: true })
  organization_id: string;
}
