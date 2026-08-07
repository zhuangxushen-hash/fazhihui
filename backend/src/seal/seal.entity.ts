import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';

// 印章类型：official公章 / financial财务章 / contract合同章 / personal法人章
// 印章状态：active启用 / inactive停用

@Entity('seals')
export class Seal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Column({ type: 'varchar', nullable: false })
  type: string;

  @Column({ type: 'varchar', default: 'active' })
  status: string;

  @Column({ type: 'varchar', nullable: true })
  manager_id: string;

  // 是否电子印章
  @Column({ type: 'boolean', default: false, comment: '是否电子印章' })
  is_electronic: boolean;

  // 支持水印
  @Column({ type: 'boolean', default: false, comment: '支持水印' })
  support_watermark: boolean;

  // 支持骑缝章
  @Column({ type: 'boolean', default: false, comment: '支持骑缝章' })
  support_paging_seal: boolean;

  @Column({ type: 'varchar', nullable: false })
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
