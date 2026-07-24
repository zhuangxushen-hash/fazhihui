import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('scrm_live_codes')
export class LiveCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 活码类型: wework(企微) / personal(个微) / group(群活码)
  @Column({ type: 'varchar', nullable: false })
  code_type: string;

  @Column({ nullable: false })
  name: string;

  // 分流规则: poll(轮询) / load(负载) / region(地域) / case_type(案由)
  @Column({ type: 'varchar', default: 'poll' })
  dispatch_rule: string;

  // 分流配置(JSON 字符串): 例如 { weights: {...}, regions: [...], case_types: [...] }
  @Column({ type: 'text', nullable: true })
  dispatch_config: string;

  @Column({ nullable: true })
  channel_id: string;

  // 绑定的员工/群ID列表(JSON 数组字符串)
  @Column({ type: 'text', nullable: true })
  bound_users: string;

  @Column({ nullable: true })
  qr_code_path: string;

  // 状态: active / inactive
  @Column({ type: 'varchar', default: 'active' })
  status: string;

  @Column({ nullable: true })
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
