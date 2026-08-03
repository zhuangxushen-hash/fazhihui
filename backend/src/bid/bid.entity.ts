import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// 投标状态：preparing 准备中 / submitted 已投标 / won 中标 / lost 未中标
export const BID_STATUS = {
  PREPARING: 'preparing',
  SUBMITTED: 'submitted',
  WON: 'won',
  LOST: 'lost',
} as const;

@Entity('bids')
export class Bid {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  project_name: string; // 项目名称

  @Column({ type: 'varchar', nullable: false })
  tenderer: string; // 招标方

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  bid_amount: number; // 投标金额

  @Column({ type: 'date', nullable: false })
  deadline: Date; // 截止日期

  @Column({ type: 'date', nullable: true })
  bid_date: Date; // 投标日期（可空）

  @Column({ type: 'varchar', default: BID_STATUS.PREPARING })
  status: string; // 投标状态

  @Column({ type: 'date', nullable: true })
  result_date: Date; // 结果日期（可空）

  @Column({ type: 'varchar', nullable: true })
  manager_id: string; // 负责人

  @Column({ type: 'text', nullable: true })
  remarks: string; // 备注（可空）

  @Column()
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
