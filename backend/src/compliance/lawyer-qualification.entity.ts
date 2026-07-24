import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export enum QualificationStatus {
  PENDING = 'pending', // 待审核
  VERIFIED = 'verified', // 已验证
  EXPIRED = 'expired', // 已过期
  REVOKED = 'revoked', // 已吊销
}

export enum LicenseType {
  LAWYER = 'lawyer', // 律师执业证
  PARALEGAL = 'paralegal', // 实习律师证
  LEGAL_WORKER = 'legal_worker', // 基层法律服务工作者
}

@Entity('lawyer_qualifications')
export class LawyerQualification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  user_id: string;

  @Column({ type: 'varchar', nullable: false })
  license_number: string;

  @Column({ type: 'varchar', nullable: false })
  license_type: LicenseType;

  @Column({ type: 'datetime', nullable: false })
  valid_until: Date;

  @Column({ type: 'varchar', default: 'pending' })
  status: QualificationStatus;

  @Column({ type: 'datetime', nullable: true })
  verified_at: Date;

  @Column({ type: 'varchar', nullable: true })
  verified_by: string;

  @Column({ type: 'varchar', nullable: false })
  organization_id: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
