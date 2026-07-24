import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../user/user.entity';
import { Opportunity } from './opportunity.entity';

// 节点类型枚举
export enum TalkSOPNodeType {
  INFO_INPUT = 'info_input',        // 信息录入
  MATERIAL_UPLOAD = 'material_upload', // 材料上传
  COMPLIANCE_CHECK = 'compliance_check', // 合规确认
  SIGNATURE_CONFIRM = 'signature_confirm', // 签字确认
}

// 节点状态枚举
export enum SOPNodeStatus {
  PENDING = 'pending',      // 待完成
  COMPLETED = 'completed',  // 已完成
}

// TalkSOP节点子结构（嵌入JSON）
export interface TalkSOPNode {
  node_id: string;          // 节点ID
  node_name: string;        // 节点名称
  node_type: TalkSOPNodeType; // 节点类型
  is_required: boolean;     // 是否强制节点
  order: number;            // 排序
  description?: string;     // 描述
}

// 谈案SOP模板实体
@Entity('talk_sops')
export class TalkSOP {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;             // SOP模板名称

  @Column({ type: 'varchar', nullable: true })
  case_type: string;        // 适用案件类型

  @Column({ type: 'text' })
  nodes: string;            // JSON节点列表（JSON.stringify(TalkSOPNode[])）

  @Column({ default: false })
  is_default: boolean;      // 是否默认模板

  @Column({ default: true })
  enabled: boolean;         // 是否启用

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

// 商机SOP进度实体
@Entity('opportunity_sop_progress')
export class OpportunitySOPProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  opportunity_id: string;

  @ManyToOne(() => Opportunity)
  @JoinColumn({ name: 'opportunity_id' })
  opportunity: Opportunity;

  @Column()
  node_id: string;          // 节点ID

  @Column({ type: 'varchar', default: SOPNodeStatus.PENDING })
  status: SOPNodeStatus;    // 节点状态

  @Column({ type: 'datetime', nullable: true })
  completed_at: Date;       // 完成时间

  @Column({ nullable: true })
  completed_by: string;     // 完成操作人ID

  @ManyToOne(() => User)
  @JoinColumn({ name: 'completed_by' })
  completedByUser: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}