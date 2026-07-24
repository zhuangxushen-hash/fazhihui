import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, Between, In } from 'typeorm';
import { SocialPost } from './social-post.entity';
import { SocialAccount } from './social-account.entity';
import { SocialPostStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SocialPostService {
  constructor(
    @InjectRepository(SocialPost)
    private readonly postRepository: Repository<SocialPost>,
    @InjectRepository(SocialAccount)
    private readonly accountRepository: Repository<SocialAccount>,
  ) {}

  // ========== 内容排期 ==========

  /**
   * 创建排期内容
   */
  async create(data: Partial<SocialPost>): Promise<SocialPost> {
    const account = await this.accountRepository.findOne({
      where: { id: data.account_id },
    });
    if (!account) {
      throw new BadRequestException('关联的公域账号不存在');
    }
    const post = this.postRepository.create(data);
    if (data.scheduled_time) {
      post.status = SocialPostStatus.SCHEDULED;
    }
    return this.postRepository.save(post);
  }

  /**
   * 多账号同步发布：为指定多个账号创建同一份内容（同一 sync_batch_id）
   */
  async createMultiAccount(
    accountIds: string[],
    data: {
      title?: string;
      content: string;
      media_files?: string[];
      hashtags?: string;
      scheduled_time?: Date;
    },
    orgId: string,
    creatorId: string,
  ): Promise<SocialPost[]> {
    if (!accountIds || accountIds.length === 0) {
      throw new BadRequestException('请选择至少一个账号');
    }
    const accounts = await this.accountRepository.find({
      where: { id: In(accountIds), organization_id: orgId },
    });
    if (accounts.length === 0) {
      throw new BadRequestException('未找到符合条件的账号');
    }
    const batchId = uuidv4();
    const mediaFilesStr = data.media_files ? JSON.stringify(data.media_files) : null;
    const posts: Partial<SocialPost>[] = accounts.map((account) => ({
      account_id: account.id,
      title: data.title,
      content: data.content,
      media_files: mediaFilesStr,
      hashtags: data.hashtags,
      scheduled_time: data.scheduled_time,
      status: data.scheduled_time ? SocialPostStatus.SCHEDULED : SocialPostStatus.DRAFT,
      sync_batch_id: batchId,
      organization_id: orgId,
      creator_id: creatorId,
    }));
    return this.postRepository.save(posts as any);
  }

  /**
   * 更新排期内容
   */
  async update(id: string, data: Partial<SocialPost>): Promise<SocialPost> {
    const post = await this.postRepository.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException('内容排期不存在');
    }
    if (post.status === SocialPostStatus.PUBLISHED) {
      throw new BadRequestException('已发布的内容不能编辑');
    }
    if (data.scheduled_time) {
      data.status = SocialPostStatus.SCHEDULED;
    } else if (data.scheduled_time === null) {
      data.status = SocialPostStatus.DRAFT;
    }
    await this.postRepository.update(id, data);
    return this.postRepository.findOne({ where: { id } });
  }

  /**
   * 删除排期
   */
  async delete(id: string): Promise<void> {
    const post = await this.postRepository.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException('内容排期不存在');
    }
    await this.postRepository.delete(id);
  }

  /**
   * 查询单条排期
   */
  async findById(id: string): Promise<SocialPost> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: { account: true },
    });
    if (!post) {
      throw new NotFoundException('内容排期不存在');
    }
    return post;
  }

  /**
   * 查询排期列表（支持按账号、状态、时间范围筛选）
   */
  async findPosts(
    orgId: string,
    filters?: {
      account_id?: string;
      status?: SocialPostStatus;
      start_date?: string;
      end_date?: string;
    },
  ): Promise<SocialPost[]> {
    const where: any = { organization_id: orgId };
    if (filters?.account_id) {
      where.account_id = filters.account_id;
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.start_date && filters?.end_date) {
      where.scheduled_time = Between(
        new Date(filters.start_date),
        new Date(filters.end_date),
      );
    } else if (filters?.start_date) {
      where.scheduled_time = Between(new Date(filters.start_date), new Date('2099-12-31'));
    }
    return this.postRepository.find({
      where,
      relations: { account: true },
      order: { scheduled_time: 'ASC', created_at: 'DESC' },
    });
  }

  /**
   * 发布内容（标记为已发布）
   */
  async publish(id: string): Promise<SocialPost> {
    const post = await this.postRepository.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException('内容排期不存在');
    }
    if (post.status === SocialPostStatus.PUBLISHED) {
      throw new BadRequestException('内容已发布');
    }
    await this.postRepository.update(id, {
      status: SocialPostStatus.PUBLISHED,
      published_at: new Date(),
    });
    return this.postRepository.findOne({ where: { id } });
  }

  /**
   * 标记发布失败
   */
  async markFailed(id: string, failReason: string): Promise<SocialPost> {
    await this.postRepository.update(id, {
      status: SocialPostStatus.FAILED,
      fail_reason: failReason,
    });
    return this.postRepository.findOne({ where: { id } });
  }

  /**
   * 取消排期（已排期回退为草稿）
   */
  async cancelSchedule(id: string): Promise<SocialPost> {
    const post = await this.postRepository.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException('内容排期不存在');
    }
    if (post.status === SocialPostStatus.PUBLISHED) {
      throw new BadRequestException('已发布的内容不能取消排期');
    }
    await this.postRepository.update(id, {
      status: SocialPostStatus.DRAFT,
      scheduled_time: null,
    });
    return this.postRepository.findOne({ where: { id } });
  }

  /**
   * 更新互动数据（点赞、评论、分享）
   */
  async updateInteractions(
    id: string,
    data: { likes?: number; comments?: number; shares?: number },
  ): Promise<SocialPost> {
    await this.postRepository.update(id, data);
    return this.postRepository.findOne({ where: { id } });
  }

  /**
   * 自动发布定时任务入口（外部 Cron 调用）
   * 将已到排期时间且状态为 scheduled 的内容标记为已发布
   */
  async autoPublishDue(): Promise<number> {
    const now = new Date();
    const duePosts = await this.postRepository.find({
      where: {
        status: SocialPostStatus.SCHEDULED as any,
        scheduled_time: LessThanOrEqual(now),
      },
    });
    for (const post of duePosts) {
      await this.postRepository.update(post.id, {
        status: SocialPostStatus.PUBLISHED,
        published_at: new Date(),
      });
    }
    return duePosts.length;
  }

  // ========== 内容统计 ==========

  /**
   * 按状态统计数量
   */
  async getStatsByStatus(orgId: string) {
    const rows = await this.postRepository
      .createQueryBuilder('p')
      .select('p.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(p.likes), 0)', 'total_likes')
      .addSelect('COALESCE(SUM(p.comments), 0)', 'total_comments')
      .addSelect('COALESCE(SUM(p.shares), 0)', 'total_shares')
      .where('p.organization_id = :orgId', { orgId })
      .groupBy('p.status')
      .getRawMany();
    return rows;
  }

  /**
   * 按平台统计发布数据（join social_accounts）
   */
  async getStatsByPlatform(orgId: string) {
    const rows = await this.postRepository
      .createQueryBuilder('p')
      .leftJoin(SocialAccount, 'acc', 'acc.id = p.account_id')
      .select('acc.platform', 'platform')
      .addSelect('COUNT(*)', 'post_count')
      .addSelect(`SUM(CASE WHEN p.status = 'published' THEN 1 ELSE 0 END)`, 'published_count')
      .addSelect(`SUM(CASE WHEN p.status = 'scheduled' THEN 1 ELSE 0 END)`, 'scheduled_count')
      .addSelect(`SUM(CASE WHEN p.status = 'failed' THEN 1 ELSE 0 END)`, 'failed_count')
      .addSelect('COALESCE(SUM(p.likes), 0)', 'total_likes')
      .addSelect('COALESCE(SUM(p.comments), 0)', 'total_comments')
      .addSelect('COALESCE(SUM(p.shares), 0)', 'total_shares')
      .where('p.organization_id = :orgId', { orgId })
      .groupBy('acc.platform')
      .getRawMany();
    return rows;
  }

  /**
   * 按日期统计发布数量（时间趋势）
   */
  async getDailyPostTrend(orgId: string, startDate: string, endDate: string) {
    const rows = await this.postRepository
      .createQueryBuilder('p')
      .select("DATE(p.published_at)", 'date')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(p.likes), 0)', 'likes')
      .addSelect('COALESCE(SUM(p.comments), 0)', 'comments')
      .addSelect('COALESCE(SUM(p.shares), 0)', 'shares')
      .where('p.organization_id = :orgId', { orgId })
      .andWhere('p.published_at IS NOT NULL')
      .andWhere('p.published_at BETWEEN :start AND :end', {
        start: new Date(startDate),
        end: new Date(endDate),
      })
      .groupBy('DATE(p.published_at)')
      .orderBy('date', 'ASC')
      .getRawMany();
    return rows;
  }
}
