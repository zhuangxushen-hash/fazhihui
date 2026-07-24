import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Case } from '../case/case.entity';
import { User } from '../user/user.entity';
import { Organization } from '../user/organization.entity';

/**
 * 客户AI咨询记录实体（模块7.3）
 * 用于记录客户向AI提出的法律咨询及AI回答，支持转人工工单
 */
@Entity('client_consultations')
export class ClientConsultation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 客户ID
  @Column({ type: 'varchar', nullable: false })
  client_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'client_id' })
  client: User;

  // 关联案件ID（可选）
  @Column({ type: 'varchar', nullable: true })
  case_id: string;

  @ManyToOne(() => Case, { nullable: true })
  @JoinColumn({ name: 'case_id' })
  case: Case;

  // 客户问题
  @Column({ type: 'text', nullable: false })
  question: string;

  // AI回答
  @Column({ type: 'text', nullable: true })
  ai_answer: string;

  // 是否已转人工
  @Column({ type: 'boolean', default: false })
  is_transferred_to_human: boolean;

  // 转人工后生成的工单ID（关联 Complaint 实体）
  @Column({ type: 'varchar', nullable: true })
  ticket_id: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ type: 'varchar', nullable: true })
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;
}
