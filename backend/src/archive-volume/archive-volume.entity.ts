import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

// 卷宗类型：electronic电子 / paper纸质
// 卷宗状态：archived已归档 / borrowed已借出 / returned已归还

@Entity('archive_volumes')
@Index(['organization_id'])
@Index(['case_id'])
@Index(['status'])
export class ArchiveVolume {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 关联案件ID
  @Column({ type: 'varchar', nullable: false })
  case_id: string;

  // 卷宗编号
  @Column({ type: 'varchar', nullable: false })
  volume_no: string;

  // 卷宗名称
  @Column({ type: 'varchar', nullable: false })
  name: string;

  // 卷宗类型：electronic电子 / paper纸质
  @Column({ type: 'varchar', nullable: true })
  type: string;

  // 卷宗状态：archived已归档 / borrowed已借出 / returned已归还
  @Column({ type: 'varchar', default: 'archived' })
  status: string;

  // 借阅人ID
  @Column({ type: 'varchar', nullable: true })
  borrower_id: string;

  // 借阅日期
  @Column({ type: 'date', nullable: true })
  borrow_date: Date;

  // 归还日期
  @Column({ type: 'date', nullable: true })
  return_date: Date;

  // 借阅原因
  @Column({ type: 'text', nullable: true })
  borrow_reason: string;

  // 卷宗文件URL
  @Column({ type: 'varchar', nullable: true })
  file_url: string;

  // 所属组织ID
  @Column({ type: 'varchar', nullable: false })
  organization_id: string;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;
}
