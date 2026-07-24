import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from '../user/organization.entity';
import { User } from '../user/user.entity';
import { ReportTemplate } from './report-template.entity';

/**
 * 报表导出日志实体
 * 记录每次报表导出的操作信息
 */
@Entity('report_export_logs')
export class ReportExportLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 关联报表模板ID（即时导出可为空）
  @Column({ type: 'varchar', nullable: true })
  template_id: string;

  @ManyToOne(() => ReportTemplate, { nullable: true })
  @JoinColumn({ name: 'template_id' })
  template: ReportTemplate;

  // 导出人ID
  @Column({ type: 'varchar', nullable: false })
  exporter_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'exporter_id' })
  exporter: User;

  // 导出格式（excel/pdf）
  @Column({ type: 'varchar', nullable: false })
  export_format: string;

  // 导出文件路径
  @Column({ type: 'varchar', nullable: false })
  file_path: string;

  // 文件大小（字节）
  @Column({ type: 'integer', nullable: true })
  file_size: number;

  // 导出时使用的筛选条件（JSON 字符串）
  @Column({ type: 'text', nullable: true })
  filters: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column()
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;
}
