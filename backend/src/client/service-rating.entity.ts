import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Case } from '../case/case.entity';
import { User } from '../user/user.entity';
import { Organization } from '../user/organization.entity';

/**
 * 服务评价实体（模块7.5）
 * 用于客户对案件服务进行评价，支持审核与好评沉淀至素材库
 */
@Entity('service_ratings')
@Index(['organization_id', 'status'])
@Index(['client_id'])
@Index(['case_id'])
export class ServiceRating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 案件ID
  @Column({ type: 'varchar', nullable: false })
  case_id: string;

  @ManyToOne(() => Case)
  @JoinColumn({ name: 'case_id' })
  case: Case;

  // 客户ID
  @Column({ type: 'varchar', nullable: false })
  client_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'client_id' })
  client: User;

  // 评分 1-5
  @Column({ type: 'integer', nullable: false })
  rating: number;

  // 评价内容
  @Column({ type: 'text', nullable: true })
  content: string;

  // 状态：pending-待审核 / approved-已通过 / rejected-已驳回 / converted_to_material-已沉淀素材
  @Column({ type: 'varchar', default: 'pending' })
  status: string;

  // 是否已沉淀为素材
  @Column({ type: 'boolean', default: false })
  is_converted_to_material: boolean;

  // 沉淀后的素材ID（关联 AdMaterial）
  @Column({ type: 'varchar', nullable: true })
  material_id: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ type: 'varchar', nullable: true })
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  // 审核时间
  @Column({ type: 'datetime', nullable: true })
  reviewed_at: Date;

  // 审核人ID
  @Column({ type: 'varchar', nullable: true })
  reviewer_id: string;
}
