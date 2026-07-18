import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export enum SalesChannel {
  PHONE = 'phone',
  WECHAT = 'wechat',
  QQ = 'qq',
  OTHER = 'other',
}

export enum SalesCheckResult {
  PASS = 'pass',
  WARNING = 'warning',
  VIOLATION = 'violation',
}

@Entity('sales_compliance')
export class SalesCompliance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  lead_id: string;

  @Column({ type: 'varchar', nullable: false })
  sales_id: string;

  @Column({ type: 'varchar', nullable: false })
  channel: SalesChannel;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'varchar', nullable: true })
  audio_url: string;

  @Column({ type: 'varchar', default: 'pass' })
  check_result: SalesCheckResult;

  @Column({ type: 'text', nullable: true })
  violation_details: string;

  @Column({ type: 'boolean', default: false })
  risk_disclosure_accepted: boolean;

  @Column({ type: 'datetime', nullable: true })
  risk_disclosure_time: Date;

  @Column({ type: 'text', nullable: true })
  risk_disclosure_content: string;

  @Column({ type: 'varchar', nullable: false })
  organization_id: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}