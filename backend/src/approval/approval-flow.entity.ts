import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { Organization } from '../user/organization.entity';

// 审批流定义
@Entity('approval_flows')
export class ApprovalFlow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 审批流名称
  @Column({ type: 'varchar', nullable: false })
  name: string;

  // 审批类型：seal用印 / case立案 / contract合同 / finance财务 / other其他
  @Column({ type: 'varchar', nullable: false })
  type: string;

  // 步骤数组：[{ name: 步骤名称, approver_role: 审批角色, order: 顺序 }]
  @Column({ type: 'json', nullable: true })
  steps: any[];

  // 状态：active / inactive，默认 active
  @Column({ type: 'varchar', default: 'active' })
  status: string;

  @Column({ nullable: true })
  organization_id: string;

  @ManyToOne(() => Organization)
  organization: Organization;

  @CreateDateColumn()
  created_at: Date;
}
