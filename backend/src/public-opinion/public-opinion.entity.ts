import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

// 来源平台：weibo 微博 / douyin 抖音 / wechat 微信 / zhihu 知乎 / other 其他
// 情感倾向：positive 正面 / neutral 中性 / negative 负面
// 处理状态：pending 待处理 / processing 处理中 / resolved 已解决 / ignored 已忽略

@Entity('public_opinions')
@Index(['organization_id', 'status'])
@Index(['organization_id', 'platform'])
@Index(['organization_id', 'sentiment'])
@Index(['organization_id', 'published_at'])
export class PublicOpinion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 触发关键词
  @Column({ type: 'varchar', nullable: false, comment: '触发关键词' })
  keyword: string;

  // 来源平台：weibo/douyin/wechat/zhihu/other
  @Column({ type: 'varchar', nullable: false, comment: '来源平台' })
  platform: string;

  // 舆情标题
  @Column({ type: 'varchar', nullable: false, comment: '舆情标题' })
  title: string;

  // 内容摘要
  @Column({ type: 'text', nullable: false, comment: '内容摘要' })
  content: string;

  // 原文链接
  @Column({ type: 'varchar', nullable: false, comment: '原文链接' })
  url: string;

  // 情感倾向：positive/neutral/negative
  @Column({ type: 'varchar', default: 'neutral', comment: '情感倾向' })
  sentiment: string;

  // 处理状态：pending/processing/resolved/ignored
  @Column({ type: 'varchar', default: 'pending', comment: '处理状态' })
  status: string;

  // 所属组织ID
  @Column({ type: 'varchar', nullable: false, comment: '所属组织ID' })
  organization_id: string;

  // 处理人ID（可空）
  @Column({ type: 'varchar', nullable: true, comment: '处理人ID' })
  handler_id: string;

  // 处理时间（可空）
  @Column({ type: 'datetime', nullable: true, comment: '处理时间' })
  handled_at: Date;

  // 处理备注（可空）
  @Column({ type: 'text', nullable: true, comment: '处理备注' })
  handle_remark: string;

  // 舆情发布时间
  @Column({ type: 'datetime', nullable: false, comment: '舆情发布时间' })
  published_at: Date;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;
}
