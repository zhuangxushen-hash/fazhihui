import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { SocialPost, PostType } from './social-post.entity';
import { SocialComment } from './social-comment.entity';
import { SocialLike } from './social-like.entity';
import { User } from '../user/user.entity';

@Injectable()
export class SocialService {
  constructor(
    @InjectRepository(SocialPost)
    private readonly postRepository: Repository<SocialPost>,
    @InjectRepository(SocialComment)
    private readonly commentRepository: Repository<SocialComment>,
    @InjectRepository(SocialLike)
    private readonly likeRepository: Repository<SocialLike>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  // ==================== 动态管理 ====================

  // 创建动态
  async createPost(userId: string, orgId: string, data: Partial<SocialPost>): Promise<SocialPost> {
    const postData: Partial<SocialPost> = {
      user_id: userId,
      organization_id: orgId,
      content: data.content,
      post_type: data.post_type || PostType.NORMAL,
      related_case_id: data.related_case_id || null,
      view_count: 0,
      like_count: 0,
      comment_count: 0,
    };
    // images 字段为图片URL数组，需 JSON.stringify 存储
    if (data.images) {
      postData.images = typeof data.images === 'string' ? data.images : JSON.stringify(data.images);
    }
    const post = this.postRepository.create(postData);
    return this.postRepository.save(post);
  }

  // 查询动态列表（带分页和类型筛选，返回用户名）
  async findAllPosts(
    orgId: string,
    postType?: string,
    page?: number,
    limit?: number,
  ): Promise<{ data: any[]; total: number }> {
    const qb = this.postRepository
      .createQueryBuilder('p')
      .where('p.organization_id = :orgId', { orgId });

    if (postType) {
      qb.andWhere('p.post_type = :postType', { postType });
    }

    qb.orderBy('p.created_at', 'DESC');

    const currentPage = page && page > 0 ? page : 1;
    const currentLimit = limit && limit > 0 ? limit : 20;
    qb.skip((currentPage - 1) * currentLimit).take(currentLimit);

    const [posts, total] = await qb.getManyAndCount();

    // 批量查询用户名映射
    const userIds = [...new Set(posts.map(p => p.user_id))];
    let userMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const users = await this.userRepository.find({ where: { id: In(userIds) } });
      userMap = users.reduce((acc, u) => {
        acc[u.id] = u.real_name;
        return acc;
      }, {} as Record<string, string>);
    }

    const data = posts.map(p => ({
      ...p,
      user_name: userMap[p.user_id] || p.user_id.slice(0, 8),
      images: p.images ? this.parseImages(p.images) : [],
    }));

    return { data, total };
  }

  // 查询单条动态详情（同时返回评论和点赞列表）
  async findOnePost(id: string): Promise<any> {
    const post = await this.postRepository.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException('动态不存在');
    }
    // 增加阅读量
    await this.incrementViewCount(id);

    // 查询评论
    const comments = await this.commentRepository.find({
      where: { post_id: id },
      order: { created_at: 'ASC' },
    });

    // 查询点赞
    const likes = await this.likeRepository.find({ where: { post_id: id } });

    // 查询发布人姓名
    const author = await this.userRepository.findOne({ where: { id: post.user_id } });

    // 查询评论人姓名
    const commentUserIds = [...new Set(comments.map(c => c.user_id))];
    let commentUserMap: Record<string, string> = {};
    if (commentUserIds.length > 0) {
      const commentUsers = await this.userRepository.find({ where: { id: In(commentUserIds) } });
      commentUserMap = commentUsers.reduce((acc, u) => {
        acc[u.id] = u.real_name;
        return acc;
      }, {} as Record<string, string>);
    }

    return {
      ...post,
      images: post.images ? this.parseImages(post.images) : [],
      user_name: author?.real_name || post.user_id.slice(0, 8),
      comments: comments.map(c => ({
        ...c,
        user_name: commentUserMap[c.user_id] || c.user_id.slice(0, 8),
      })),
      likes,
    };
  }

  // 删除动态（仅作者可删，同步删除关联的评论和点赞，使用事务保证一致性）
  async deletePost(id: string, userId: string): Promise<void> {
    const post = await this.postRepository.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException('动态不存在');
    }
    if (post.user_id !== userId) {
      throw new BadRequestException('只能删除自己发布的动态');
    }
    // 同步删除关联的评论和点赞
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(SocialComment, { post_id: id });
      await manager.delete(SocialLike, { post_id: id });
      await manager.delete(SocialPost, id);
    });
  }

  // ==================== 评论管理 ====================

  // 添加评论
  async addComment(
    postId: string,
    userId: string,
    orgId: string,
    content: string,
    parentId?: string,
  ): Promise<SocialComment> {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('动态不存在');
    }
    const comment = this.commentRepository.create({
      post_id: postId,
      user_id: userId,
      organization_id: orgId,
      content,
      parent_id: parentId || null,
    });
    const saved = await this.commentRepository.save(comment);
    // 同步更新动态的评论数
    await this.postRepository.update(postId, { comment_count: post.comment_count + 1 });
    return saved;
  }

  // 查询动态的评论列表
  async findComments(postId: string): Promise<any[]> {
    const comments = await this.commentRepository.find({
      where: { post_id: postId },
      order: { created_at: 'ASC' },
    });
    // 批量查询评论人姓名
    const userIds = [...new Set(comments.map(c => c.user_id))];
    let userMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const users = await this.userRepository.find({ where: { id: In(userIds) } });
      userMap = users.reduce((acc, u) => {
        acc[u.id] = u.real_name;
        return acc;
      }, {} as Record<string, string>);
    }
    return comments.map(c => ({
      ...c,
      user_name: userMap[c.user_id] || c.user_id.slice(0, 8),
    }));
  }

  // 删除评论
  async deleteComment(id: string, userId: string): Promise<void> {
    const comment = await this.commentRepository.findOne({ where: { id } });
    if (!comment) {
      throw new NotFoundException('评论不存在');
    }
    if (comment.user_id !== userId) {
      throw new BadRequestException('只能删除自己发布的评论');
    }
    await this.commentRepository.delete(id);
    // 同步减少动态的评论数
    const post = await this.postRepository.findOne({ where: { id: comment.post_id } });
    if (post && post.comment_count > 0) {
      await this.postRepository.update(post.id, { comment_count: post.comment_count - 1 });
    }
  }

  // ==================== 点赞管理 ====================

  // 点赞
  async likePost(postId: string, userId: string, orgId: string): Promise<SocialLike> {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('动态不存在');
    }
    // 检查是否已点赞
    const existing = await this.likeRepository.findOne({
      where: { post_id: postId, user_id: userId },
    });
    if (existing) {
      throw new BadRequestException('已经点赞过该动态');
    }
    const like = this.likeRepository.create({
      post_id: postId,
      user_id: userId,
      organization_id: orgId,
    });
    const saved = await this.likeRepository.save(like);
    // 同步更新动态的点赞数
    await this.postRepository.update(postId, { like_count: post.like_count + 1 });
    return saved;
  }

  // 取消点赞
  async unlikePost(postId: string, userId: string): Promise<void> {
    const existing = await this.likeRepository.findOne({
      where: { post_id: postId, user_id: userId },
    });
    if (!existing) {
      throw new BadRequestException('未点赞过该动态');
    }
    await this.likeRepository.delete(existing.id);
    // 同步减少动态的点赞数
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (post && post.like_count > 0) {
      await this.postRepository.update(postId, { like_count: post.like_count - 1 });
    }
  }

  // 查询动态的点赞列表
  async findLikes(postId: string): Promise<SocialLike[]> {
    return this.likeRepository.find({ where: { post_id: postId } });
  }

  // ==================== 内部方法 ====================

  // 增加阅读量
  private async incrementViewCount(id: string): Promise<void> {
    const post = await this.postRepository.findOne({ where: { id } });
    if (post) {
      await this.postRepository.update(id, { view_count: post.view_count + 1 });
    }
  }

  // 解析图片JSON字符串
  private parseImages(imagesStr: string): string[] {
    try {
      return JSON.parse(imagesStr);
    } catch {
      return [];
    }
  }
}
