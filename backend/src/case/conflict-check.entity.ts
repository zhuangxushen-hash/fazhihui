import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Case } from './case.entity';
import { User } from '../user/user.entity';
import { Organization } from '../user/organization.entity';

/**
 * 利冲检索记录实体
 * 用于记录当事人与对方当事人的利益冲突检索结果
 */
@Entity('conflict_checks')
export class ConflictCheck {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 关联案件ID（可空，检索时可能尚未创建案件）
  @Column({ type: 'varchar', nullable: true })
  case_id: string;

  // 当事人姓名
  @Column({ type: 'varchar', nullable: false })
  party_name: string;

  // 对方当事人姓名
  @Column({ type: 'varchar', nullable: false })
  opposing_party: string;

  // 当事人电话（可空）
  @Column({ type: 'varchar', nullable: true })
  party_phone: string;

  // 检索结果：clear=无冲突 / warning=有风险 / conflict=有冲突
  @Column({ type: 'varchar', default: 'clear' })
  check_result: string;

  // 冲突详情（可空，记录命中的案件信息）
  @Column({ type: 'text', nullable: true })
  conflict_detail: string;

  // 本案角色：client委托人/opposing对方
  @Column({ type: 'varchar', default: 'client', comment: '本案角色' })
  party_role: string;

  // 冲突项目/案源名称
  @Column({ type: 'varchar', nullable: true, comment: '冲突项目/案源名称' })
  conflict_case_name: string;

  // 审批状态：pending待审批/approved已通过/rejected已驳回
  @Column({ type: 'varchar', default: 'pending', comment: '审批状态' })
  approval_status: string;

  // 业务主管ID
  @Column({ type: 'varchar', nullable: true, comment: '业务主管ID' })
  supervisor_id: string;

  // 所属团队
  @Column({ type: 'varchar', nullable: true, comment: '所属团队' })
  team_id: string;

  // 检索人ID
  @Column({ type: 'varchar', nullable: true })
  checker_id: string;

  // 组织ID
  @Column({ type: 'varchar', nullable: false })
  organization_id: string;

  @ManyToOne(() => Case, { nullable: true })
  @JoinColumn({ name: 'case_id' })
  case: Case;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'checker_id' })
  checker: User;

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
