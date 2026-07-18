import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Lead } from '../lead/lead.entity';
import { Case } from '../case/case.entity';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ nullable: true })
  domain: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  license_no: string;

  @Column({ default: true })
  status: boolean;

  @OneToMany(() => User, user => user.organization)
  users: User[];

  @OneToMany(() => Lead, lead => lead.organization)
  leads: Lead[];

  @OneToMany(() => Case, caseEntity => caseEntity.organization)
  cases: Case[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
