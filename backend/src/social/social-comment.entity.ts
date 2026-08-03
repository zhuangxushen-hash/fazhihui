import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Organization } from '../user/organization.entity';

@Entity('social_comments')
export class SocialComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 动态ID
  @Column({ nullable: false })
  post_id: string;

  // 评论人ID
  @Column({ nullable: false })
  user_id: string;

  // 评论内容
  @Column({ type: 'text' })
  content: string;

  // 父评论ID（回复，可空）
  @Column({ nullable: true })
  parent_id: string;

  @ManyToOne(() => Organization)
  organization: Organization;

  @Column()
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;
}
