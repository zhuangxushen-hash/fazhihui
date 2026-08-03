import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { Organization } from '../user/organization.entity';

@Entity('social_likes')
@Unique(['post_id', 'user_id']) // 同一用户对同一动态只能点赞一次
export class SocialLike {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 动态ID
  @Column({ nullable: false })
  post_id: string;

  // 点赞人ID
  @Column({ nullable: false })
  user_id: string;

  @ManyToOne(() => Organization)
  organization: Organization;

  @Column()
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;
}
