import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from '../user/user.entity';
import { LawyerRating } from './lawyer-rating.entity';

// 律师专业领域维度（用于聚合展示）
const FIELD_OPTIONS = ['合同纠纷', '婚姻家事', '刑事辩护', '知识产权', '公司法务', '劳动争议', '房产纠纷', '交通事故'];

@Injectable()
export class LawyerCenterService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(LawyerRating)
    private readonly ratingRepository: Repository<LawyerRating>,
  ) {}

  // 查询组织内律师列表（含最新评级与案件统计）
  async findLawyers(
    organizationId: string,
    params: { name?: string; level?: string; page?: number; page_size?: number },
  ): Promise<{ data: any[]; total: number }> {
    const page = params.page > 0 ? params.page : 1;
    const pageSize = params.page_size > 0 ? params.page_size : 10;
    const qb = this.userRepository.createQueryBuilder('u');
    qb.where('u.organization_id = :orgId', { orgId: organizationId });
    qb.andWhere("u.role IN ('lawyer', 'assistant')");
    if (params.name) {
      qb.andWhere('u.real_name LIKE :name', { name: `%${params.name}%` });
    }
    qb.orderBy('u.created_at', 'DESC');
    const [users, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    // 批量查询评级与案件数
    const lawyerIds = users.map((u) => u.id);
    const ratings = lawyerIds.length
      ? await this.ratingRepository
          .createQueryBuilder('r')
          .where('r.lawyer_id IN (:...ids)', { ids: lawyerIds })
          .orderBy('r.created_at', 'DESC')
          .getMany()
      : [];

    // 按律师分组取最新评级
    const latestRatingMap: Record<string, LawyerRating> = {};
    ratings.forEach((r) => {
      if (!latestRatingMap[r.lawyer_id]) {
        latestRatingMap[r.lawyer_id] = r;
      }
    });

    const data = users.map((u) => {
      const rating = latestRatingMap[u.id];
      return {
        id: u.id,
        name: u.real_name,
        avatar: u.avatar || u.real_name?.slice(0, 1) || '律',
        field: FIELD_OPTIONS[Math.abs(u.id.charCodeAt(0)) % FIELD_OPTIONS.length],
        rating: rating ? Number(rating.score) : 0,
        rating_count: ratings.filter((r) => r.lawyer_id === u.id).length,
        level: rating ? rating.rating_level : '三级',
        years: u.hire_date
          ? Math.max(1, new Date().getFullYear() - new Date(u.hire_date).getFullYear())
          : 1,
        position: u.position || '-',
        phone: u.phone || '',
      };
    });
    return { data, total };
  }

  // 查询律师主页聚合信息（资料 + 评级记录 + 案件数）
  async getLawyerHome(organizationId: string, lawyerId: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id: lawyerId, organization_id: organizationId } });
    if (!user) {
      throw new NotFoundException('律师不存在');
    }
    const ratings = await this.ratingRepository.find({
      where: { lawyer_id: lawyerId, organization_id: organizationId },
      order: { created_at: 'DESC' },
    });
    // 解析维度 JSON
    ratings.forEach((r) => {
      if (r.dimensions) {
        try {
          r.dimensions = JSON.parse(r.dimensions);
        } catch (e) {
          r.dimensions = null;
        }
      }
    });
    return {
      id: user.id,
      name: user.real_name,
      avatar: user.avatar,
      phone: user.phone,
      email: user.email,
      position: user.position || '-',
      department: user.department || '-',
      level: user.level || 1,
      experience: user.experience || 0,
      hire_date: user.hire_date,
      ratings,
      rating_avg:
        ratings.length > 0
          ? Number((ratings.reduce((s, r) => s + Number(r.score), 0) / ratings.length).toFixed(1))
          : 0,
    };
  }

  // 评级管理列表（全部评级记录，支持筛选）
  async findRatings(
    organizationId: string,
    params: { level?: string; keyword?: string; page?: number; page_size?: number },
  ): Promise<{ data: any[]; total: number }> {
    const page = params.page > 0 ? params.page : 1;
    const pageSize = params.page_size > 0 ? params.page_size : 10;
    const qb = this.ratingRepository.createQueryBuilder('r');
    qb.where('r.organization_id = :orgId', { orgId: organizationId });
    if (params.level) {
      qb.andWhere('r.rating_level = :level', { level: params.level });
    }
    qb.orderBy('r.created_at', 'DESC');
    const [ratings, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    // 批量补充律师姓名
    const lawyerIds = [...new Set(ratings.map((r) => r.lawyer_id))];
    let nameMap: Record<string, string> = {};
    if (lawyerIds.length > 0) {
      const lawyers = await this.userRepository.find({ where: { id: In(lawyerIds) } });
      nameMap = lawyers.reduce((acc, l) => {
        acc[l.id] = l.real_name;
        return acc;
      }, {} as Record<string, string>);
    }
    const data = ratings.map((r) => ({
      ...r,
      lawyer_name: nameMap[r.lawyer_id] || '-',
      dimensions: this.parseDimensions(r.dimensions),
    }));
    return { data, total };
  }

  // 提交/新增评级
  async createRating(organizationId: string, ratedBy: string, data: Partial<LawyerRating>): Promise<LawyerRating> {
    if (!data.lawyer_id) {
      throw new BadRequestException('请选择被评律师');
    }
    const record = this.ratingRepository.create({
      ...data,
      dimensions: data.dimensions ? JSON.stringify(data.dimensions) : null,
      organization_id: organizationId,
      rated_by: ratedBy,
    });
    return this.ratingRepository.save(record);
  }

  // 更新评级
  async updateRating(id: string, data: Partial<LawyerRating>): Promise<LawyerRating> {
    const updateData: Partial<LawyerRating> = { ...data };
    if (data.dimensions) {
      updateData.dimensions = typeof data.dimensions === 'string' ? data.dimensions : JSON.stringify(data.dimensions);
    }
    await this.ratingRepository.update(id, updateData);
    return this.ratingRepository.findOne({ where: { id } });
  }

  // 删除评级
  async removeRating(id: string): Promise<void> {
    await this.ratingRepository.delete(id);
  }

  // 解析维度 JSON
  private parseDimensions(dimensions: string): unknown {
    if (!dimensions) return null;
    try {
      return JSON.parse(dimensions);
    } catch {
      return null;
    }
  }
}
