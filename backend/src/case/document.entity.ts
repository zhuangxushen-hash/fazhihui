import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { Case } from './case.entity';
import { User } from '../user/user.entity';

@Entity('documents')
export class Document {
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

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: false })
  is_ai_generated: boolean;

  @ManyToOne(() => Case, caseEntity => caseEntity.documents)
  case: Case;

  @Column()
  case_id: string;

  @ManyToOne(() => User)
  uploaded_by: User;

  @Column()
  uploaded_by_id: string;

  @CreateDateColumn()
  created_at: Date;
}
