import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { PublicOpinion } from './public-opinion.entity';
import { OpinionKeyword } from './opinion-keyword.entity';

@Injectable()
export class PublicOpinionService {
  constructor(
    @InjectRepository(PublicOpinion)
    private readonly opinionRepository: Repository<PublicOpinion>,
    @InjectRepository(OpinionKeyword)
    private readonly keywordRepository: Repository<OpinionKeyword>,
  ) {}

  // ========== 舆情相关 ==========

  // 创建舆情记录
  async create(data: Partial<PublicOpinion>): Promise<PublicOpinion> {
    const opinion = this.opinionRepository.create(data);
    return this.opinionRepository.save(opinion);
  }

  // 查询舆情详情
  async findById(id: string): Promise<PublicOpinion> {
    const opinion = await this.opinionRepository.findOne({ where: { id } });
    if (!opinion) {
      throw new NotFoundException('舆情记录不存在');
    }
    return opinion;
  }

  // 按组织查询舆情列表，支持按平台、状态、情感、关键词筛选
  async findByOrg(
    orgId: string,
    filters?: {
      platform?: string;
      status?: string;
      sentiment?: string;
      keyword?: string;
    },
  ): Promise<PublicOpinion[]> {
    const where: any = { organization_id: orgId };
    if (filters?.platform) {
      where.platform = filters.platform;
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.sentiment) {
      where.sentiment = filters.sentiment;
    }
    if (filters?.keyword) {
      where.keyword = Like(`%${filters.keyword}%`);
    }
    return this.opinionRepository.find({
      where,
      order: { published_at: 'DESC' },
    });
  }

  // 更新舆情状态
  async updateStatus(
    id: string,
    data: {
      status: string;
      handler_id?: string;
      handle_remark?: string;
    },
  ): Promise<PublicOpinion> {
    const opinion = await this.opinionRepository.findOne({ where: { id } });
    if (!opinion) {
      throw new NotFoundException('舆情记录不存在');
    }
    await this.opinionRepository.update(id, {
      status: data.status,
      handler_id: data.handler_id || opinion.handler_id,
      handle_remark: data.handle_remark || opinion.handle_remark,
      handled_at: new Date(),
    });
    return this.opinionRepository.findOne({ where: { id } });
  }

  // 更新舆情（通用）
  async update(id: string, data: Partial<PublicOpinion>): Promise<PublicOpinion> {
    const opinion = await this.opinionRepository.findOne({ where: { id } });
    if (!opinion) {
      throw new NotFoundException('舆情记录不存在');
    }
    await this.opinionRepository.update(id, data);
    return this.opinionRepository.findOne({ where: { id } });
  }

  // 删除舆情记录
  async delete(id: string): Promise<void> {
    const opinion = await this.opinionRepository.findOne({ where: { id } });
    if (!opinion) {
      throw new NotFoundException('舆情记录不存在');
    }
    await this.opinionRepository.delete(id);
  }

  // ========== 关键词相关 ==========

  // 创建关键词
  async createKeyword(data: Partial<OpinionKeyword>): Promise<OpinionKeyword> {
    const keyword = this.keywordRepository.create(data);
    return this.keywordRepository.save(keyword);
  }

  // 查询组织的关键词列表
  async findKeywords(
    orgId: string,
    isActive?: boolean,
  ): Promise<OpinionKeyword[]> {
    const where: any = { organization_id: orgId };
    if (isActive !== undefined) {
      where.is_active = isActive;
    }
    return this.keywordRepository.find({
      where,
      order: { updated_at: 'DESC' },
    });
  }

  // 更新关键词
  async updateKeyword(
    id: string,
    data: Partial<OpinionKeyword>,
  ): Promise<OpinionKeyword> {
    const keyword = await this.keywordRepository.findOne({ where: { id } });
    if (!keyword) {
      throw new NotFoundException('关键词不存在');
    }
    await this.keywordRepository.update(id, data);
    return this.keywordRepository.findOne({ where: { id } });
  }

  // 删除关键词
  async deleteKeyword(id: string): Promise<void> {
    const keyword = await this.keywordRepository.findOne({ where: { id } });
    if (!keyword) {
      throw new NotFoundException('关键词不存在');
    }
    await this.keywordRepository.delete(id);
  }
}
