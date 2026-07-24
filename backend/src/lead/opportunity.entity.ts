import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Lead } from './lead.entity';
import { User } from '../user/user.entity';
import { OpportunityStage, OpportunityStatus } from '../types';

@Entity('opportunities')
export class Opportunity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  lead_id: string;

  @ManyToOne(() => Lead)
  @JoinColumn({ name: 'lead_id' })
  lead: Lead;

  @Column()
  negotiator_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'negotiator_id' })
  negotiator: User;

  @Column({ type: 'varchar', default: OpportunityStage.FIRST_CONTACT })
  stage: OpportunityStage;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  quote_amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  actual_amount: number;

  @Column({ type: 'varchar', default: OpportunityStatus.ACTIVE })
  status: OpportunityStatus;

  @Column({ type: 'text', nullable: true })
  requirement_note: string;

  @Column({ type: 'text', nullable: true })
  plan_note: string;

  @OneToMany(() => OpportunityQuoteItem, item => item.opportunity)
  quote_items: OpportunityQuoteItem[];

  @OneToMany(() => OpportunityStageLog, log => log.opportunity)
  stage_logs: OpportunityStageLog[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity('opportunity_quote_items')
export class OpportunityQuoteItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  opportunity_id: string;

  @ManyToOne(() => Opportunity, opportunity => opportunity.quote_items)
  @JoinColumn({ name: 'opportunity_id' })
  opportunity: Opportunity;

  @Column({ nullable: false })
  item_name: string;

  @Column({ type: 'text', nullable: true })
  item_description: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  amount: number;

  @Column({ default: 1 })
  quantity: number;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity('opportunity_stage_logs')
export class OpportunityStageLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  opportunity_id: string;

  @ManyToOne(() => Opportunity, opportunity => opportunity.stage_logs)
  @JoinColumn({ name: 'opportunity_id' })
  opportunity: Opportunity;

  @Column({ type: 'varchar', nullable: false })
  from_stage: OpportunityStage;

  @Column({ type: 'varchar', nullable: false })
  to_stage: OpportunityStage;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column()
  operator_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'operator_id' })
  operator: User;

  @CreateDateColumn()
  created_at: Date;
}