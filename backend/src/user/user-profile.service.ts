import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { OnlineTemplate } from './online-template.entity';
import { RecentConcern, CONCERN_TYPE } from './recent-concern.entity';
import { VipSubscription } from '../order/vip-subscription.entity';
import { User } from './user.entity';

@Injectable()
export class UserProfileService {
  constructor(
    @InjectRepository(OnlineTemplate)
    private templateRepository: Repository<OnlineTemplate>,
    @InjectRepository(RecentConcern)
    private concernRepository: Repository<RecentConcern>,
    @InjectRepository(VipSubscription)
    private vipSubscriptionRepository: Repository<VipSubscription>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // ========== 在线模板 ==========

  /**
   * 查询在线模板列表
   */
  async getTemplates(
    orgId: string,
    filters: { template_type?: string; category?: string; keyword?: string; page?: number; page_size?: number },
  ): Promise<{ data: OnlineTemplate[]; total: number }> {
    const qb = this.templateRepository
      .createQueryBuilder('t')
      .where('t.organization_id = :orgId', { orgId });
    if (filters.template_type) {
      qb.andWhere('t.template_type = :type', { type: filters.template_type });
    }
    if (filters.category) {
      qb.andWhere('t.category = :category', { category: filters.category });
    }
    if (filters.keyword) {
      qb.andWhere('t.name LIKE :kw', { kw: `%${filters.keyword}%` });
    }
    qb.orderBy('t.usage_count', 'DESC').addOrderBy('t.created_at', 'DESC');

    const page = Number(filters.page) || 1;
    const pageSize = Number(filters.page_size) || 20;
    const [data, total] = await qb.clone().skip((page - 1) * pageSize).take(pageSize).getManyAndCount();
    return { data, total };
  }

  /**
   * 查询模板详情
   */
  async getTemplateById(orgId: string, id: string): Promise<OnlineTemplate> {
    const tpl = await this.templateRepository.findOne({ where: { id, organization_id: orgId } });
    if (!tpl) {
      throw new NotFoundException('模板不存在');
    }
    return tpl;
  }

  /**
   * 创建模板
   */
  async createTemplate(data: {
    name: string;
    template_type?: string;
    category?: string;
    content?: string;
    organization_id: string;
    creator_id?: string;
  }): Promise<OnlineTemplate> {
    if (!data.name) {
      throw new BadRequestException('模板名称不能为空');
    }
    const tpl = this.templateRepository.create({
      name: data.name,
      template_type: data.template_type || 'document',
      category: data.category || null,
      content: data.content || null,
      usage_count: 0,
      is_hot: false,
      creator_id: data.creator_id || null,
      organization_id: data.organization_id,
    });
    return this.templateRepository.save(tpl);
  }

  /**
   * 更新模板
   */
  async updateTemplate(
    orgId: string,
    id: string,
    data: Partial<Pick<OnlineTemplate, 'name' | 'template_type' | 'category' | 'content' | 'is_hot'>>,
  ): Promise<OnlineTemplate> {
    await this.templateRepository.update({ id, organization_id: orgId }, data);
    return this.getTemplateById(orgId, id);
  }

  /**
   * 删除模板
   */
  async deleteTemplate(orgId: string, id: string): Promise<void> {
    const tpl = await this.templateRepository.findOne({ where: { id, organization_id: orgId } });
    if (!tpl) {
      throw new NotFoundException('模板不存在');
    }
    await this.templateRepository.delete(id);
  }

  /**
   * 使用模板（使用次数+1）
   */
  async useTemplate(orgId: string, id: string): Promise<OnlineTemplate> {
    const tpl = await this.getTemplateById(orgId, id);
    await this.templateRepository.update(id, { usage_count: (tpl.usage_count || 0) + 1 });
    return this.getTemplateById(orgId, id);
  }

  // ========== 最近关注 ==========

  /**
   * 添加关注
   */
  async addConcern(data: {
    user_id: string;
    target_id: string;
    target_type: string;
    target_name?: string;
    organization_id: string;
  }): Promise<RecentConcern> {
    if (!data.target_id || !data.target_type) {
      throw new BadRequestException('关注对象信息不完整');
    }
    // 去重：同一用户对同一对象只保留一条
    const existing = await this.concernRepository.findOne({
      where: { user_id: data.user_id, target_id: data.target_id, target_type: data.target_type },
    });
    if (existing) {
      return existing;
    }
    const concern = this.concernRepository.create({
      user_id: data.user_id,
      target_id: data.target_id,
      target_type: data.target_type,
      target_name: data.target_name || null,
      organization_id: data.organization_id,
    });
    return this.concernRepository.save(concern);
  }

  /**
   * 查询我的关注列表
   */
  async getMyConcerns(
    userId: string,
    filters: { target_type?: string; page?: number; page_size?: number },
  ): Promise<{ data: RecentConcern[]; total: number }> {
    const qb = this.concernRepository
      .createQueryBuilder('c')
      .where('c.user_id = :userId', { userId });
    if (filters.target_type) {
      qb.andWhere('c.target_type = :type', { type: filters.target_type });
    }
    qb.orderBy('c.created_at', 'DESC');

    const page = Number(filters.page) || 1;
    const pageSize = Number(filters.page_size) || 20;
    const [data, total] = await qb.clone().skip((page - 1) * pageSize).take(pageSize).getManyAndCount();
    return { data, total };
  }

  /**
   * 取消关注
   */
  async removeConcern(userId: string, id: string): Promise<void> {
    const concern = await this.concernRepository.findOne({ where: { id, user_id: userId } });
    if (!concern) {
      throw new NotFoundException('关注记录不存在');
    }
    await this.concernRepository.delete(id);
  }

  // ========== VIP 记录 ==========

  /**
   * 查询我的VIP订阅记录
   */
  async getMyVipRecords(userId: string): Promise<VipSubscription[]> {
    return this.vipSubscriptionRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * 查询VIP开通状态（最近一条生效中或最新）
   */
  async getMyVipStatus(userId: string): Promise<{
    is_vip: boolean;
    current: VipSubscription | null;
    records: VipSubscription[];
  }> {
    const records = await this.vipSubscriptionRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
    const now = new Date();
    const current = records.find((r) => {
      if (r.status !== 'active') return false;
      if (!r.end_date) return false;
      return new Date(r.end_date) >= now;
    });
    return {
      is_vip: !!current,
      current: current || null,
      records,
    };
  }
}
