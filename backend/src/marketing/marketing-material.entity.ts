import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { Organization } from '../user/organization.entity';
import { User } from '../user/user.entity';

@Entity('marketing_materials')
export class MarketingMaterial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  file_path: string;

  @Column({ nullable: true })
  file_type: string;

  @Column({ nullable: true })
  size: number;

  @Column({ nullable: true })
  tags: string;

  @Column({ nullable: true })
  platform: string;

  @Column({ default: false })
  is_ai_generated: boolean;

  @Column({ default: false })
  compliance_checked: boolean;

  @Column({ nullable: true })
  compliance_result: string;

  @ManyToOne(() => Organization)
  organization: Organization;

  @Column()
  organization_id: string;

  @ManyToOne(() => User)
  uploaded_by: User;

  @Column()
  uploaded_by_id: string;

  @CreateDateColumn()
  created_at: Date;
}
