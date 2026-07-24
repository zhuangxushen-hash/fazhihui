import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Organization } from '../user/organization.entity';
import { User } from '../user/user.entity';
import { AdMaterialType, AdMaterialStatus, MaterialComplianceStatus } from '../types';

/**
 * 投放素材实体
 * 用于素材效能管理：CRUD、标签管理、效果统计、效能排行
 */
@Entity('ad_materials')
@Index(['organization_id', 'status'])
@Index(['organization_id', 'type'])
export class AdMaterial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  name: string;

  @Column({ type: 'varchar', nullable: false })
  type: AdMaterialType;

  // 标签 JSON 数组（如 ['离婚', '抚养权', '高转化']）
  @Column({ type: 'simple-json', nullable: true })
  tags: string[];

  // 素材文件路径或内容引用
  @Column({ nullable: true })
  file_path: string;

  // 关联投放账户ID（字符串松耦合，避免与 Task 1.1 强依赖）
  @Column({ nullable: true })
  account_id: string;

  // 关联投放计划ID（字符串松耦合，避免与 Task 1.2 强依赖）
  @Column({ nullable: true })
  plan_id: string;

  // 投放渠道
  @Column({ type: 'varchar', nullable: true })
  channel: string;

  // 效果数据
  @Column({ type: 'int', default: 0 })
  impressions: number;

  @Column({ type: 'int', default: 0 })
  clicks: number;

  @Column({ type: 'int', default: 0 })
  conversions: number;

  // 消耗金额（单位：元）
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  cost: number;

  // ROI = 回款金额 / 消耗金额（T+1 自动计算）
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  roi: number;

  @Column({ type: 'varchar', default: AdMaterialStatus.DRAFT })
  status: AdMaterialStatus;

  // 合规预审状态（Task 1.6 营销内容合规预审）
  @Column({ type: 'varchar', default: MaterialComplianceStatus.PENDING })
  compliance_status: MaterialComplianceStatus;

  // 合规预审详情（违规位置、修改建议等 JSON 字符串）
  @Column({ type: 'text', nullable: true })
  compliance_detail: string;

  // 合规预审时间
  @Column({ type: 'datetime', nullable: true })
  compliance_checked_at: Date;

  // 内容文本（AI 生成内容入库时保存的文本）
  @Column({ type: 'text', nullable: true })
  content_text: string;

  // 案由类型（用于 AI 生成内容入库时标记）
  @Column({ type: 'varchar', nullable: true })
  case_type: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column()
  organization_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaded_by_id' })
  uploaded_by: User;

  @Column()
  uploaded_by_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
