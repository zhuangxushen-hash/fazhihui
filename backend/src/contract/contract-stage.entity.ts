import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { Organization } from '../user/organization.entity';
import { Contract } from './contract.entity';

// 合同阶段记录: 记录合同每次阶段变更的历史
@Entity('contract_stages')
export class ContractStage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false, comment: '合同ID' })
  contract_id: string;

  @Column({ type: 'varchar', nullable: false, comment: '阶段名称' })
  stage_name: string;

  @Column({ type: 'varchar', nullable: false, comment: '阶段状态' })
  stage_status: string;

  @Column({ type: 'date', nullable: true, comment: '阶段开始日期' })
  start_date: Date;

  @Column({ type: 'date', nullable: true, comment: '阶段结束日期' })
  end_date: Date;

  @Column({ type: 'text', nullable: true, comment: '备注' })
  remarks: string;

  @ManyToOne(() => Organization)
  organization: Organization;

  @Column()
  organization_id: string;

  @ManyToOne(() => Contract, contract => contract.stages)
  contract: Contract;

  @CreateDateColumn()
  created_at: Date;
}
