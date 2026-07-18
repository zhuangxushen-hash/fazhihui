import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export enum ContentStatus {
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DRAFT = 'draft',
}

export enum PlatformType {
  DOUYIN = 'douyin',
  BAIDU = 'baidu',
  KUAISHOU = 'kuaishou',
  WECHAT = 'wechat',
  OTHER = 'other',
}

@Entity('marketing_contents')
export class MarketingContent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  title: string;

  @Column({ type: 'text', nullable: false })
  content: string;

  @Column({ type: 'varchar', nullable: false })
  content_type: string;

  @Column({ type: 'varchar', nullable: false })
  platform: PlatformType;

  @Column({ type: 'varchar', default: 'draft' })
  status: ContentStatus;

  @Column({ type: 'text', nullable: true })
  compliance_issues: string;

  @Column({ type: 'text', nullable: true })
  compliance_suggestions: string;

  @Column({ type: 'datetime', nullable: true })
  review_time: Date;

  @Column({ type: 'varchar', nullable: true })
  reviewer_id: string;

  @Column({ type: 'varchar', nullable: false })
  organization_id: string;

  @Column({ type: 'varchar', nullable: false })
  operator_id: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}