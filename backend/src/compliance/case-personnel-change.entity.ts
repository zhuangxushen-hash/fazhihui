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

// 5.4.5 人员变更类型
export enum PersonnelChangeType {
  MAIN_LAWYER = 'main_lawyer', // 主办变更
  ASSISTANT = 'assistant', // 协办变更
  DELEGATION = 'delegation', // 转委托
}

// 审批状态
export enum PersonnelChangeStatus {
  PENDING = 'pending', // 待审批
  APPROVED = 'approved', // 已通过
  REJECTED = 'rejected', // 已拒绝
}

@Entity('case_personnel_changes')
export class CasePersonnelChange {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  case_id: string;

  @ManyToOne(() => Case, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'case_id' })
  case: Case;

  @Column({ type: 'varchar', nullable: false })
  change_type: PersonnelChangeType;

  @Column({ type: 'varchar', nullable: true })
  original_person_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'original_person_id' })
  original_person: User;

  @Column({ type: 'varchar', nullable: false })
  new_person_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'new_person_id' })
  new_person: User;

  @Column({ type: 'text', nullable: false })
  reason: string;

  @Column({ type: 'varchar', nullable: true })
  approver_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approver_id' })
  approver: User;

  @Column({ type: 'varchar', default: PersonnelChangeStatus.PENDING })
  status: PersonnelChangeStatus;

  @Column({ type: 'text', nullable: true })
  approval_note: string;

  @Column({ type: 'varchar', nullable: true })
  organization_id: string;

  @Column({ type: 'varchar', nullable: true })
  applicant_id: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'datetime', nullable: true })
  approved_at: Date;
}
