import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

// 审计日志实体：记录用户敏感操作
@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 操作人 ID
  @Column({ nullable: true, comment: '操作人 ID' })
  user_id: string;

  // 操作人姓名
  @Column({ nullable: true, comment: '操作人姓名' })
  user_name: string;

  // 操作类型：login/logout/create/update/delete/approve/reject 等
  @Column({ type: 'varchar', comment: '操作类型' })
  action: string;

  // 资源类型：case/contract/invoice/seal/user 等
  @Column({ type: 'varchar', nullable: true, comment: '资源类型' })
  resource_type: string;

  // 资源 ID
  @Column({ type: 'varchar', nullable: true, comment: '资源 ID' })
  resource_id: string;

  // 操作 IP 地址
  @Column({ type: 'varchar', nullable: true, comment: '操作 IP' })
  ip: string;

  // 操作详情（JSON 字符串）
  @Column({ type: 'text', nullable: true, comment: '操作详情' })
  detail: string;

  @CreateDateColumn()
  created_at: Date;
}
