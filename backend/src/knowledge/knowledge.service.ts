import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KnowledgeArticle, ArticleStatus } from './knowledge-article.entity';
import { LawRegulation } from './law-regulation.entity';
import { CasePrecedent } from './case-precedent.entity';

// 文章查询参数
export interface ArticleQueryParams {
  keyword?: string; // 关键词（匹配标题）
  category?: string; // 分类
  author_id?: string; // 作者
  status?: string; // 状态
}

// 法规查询参数
export interface LawRegulationQueryParams {
  keyword?: string; // 关键词（匹配标题）
  category?: string; // 分类
}

// 判例查询参数
export interface CasePrecedentQueryParams {
  keyword?: string; // 关键词（匹配案件名称）
  court?: string; // 法院
  case_type?: string; // 案件类型
  judgment_type?: string; // 裁判文书类型
}

@Injectable()
export class KnowledgeService {
  constructor(
    @InjectRepository(KnowledgeArticle)
    private articleRepository: Repository<KnowledgeArticle>,
    @InjectRepository(LawRegulation)
    private lawRegulationRepository: Repository<LawRegulation>,
    @InjectRepository(CasePrecedent)
    private casePrecedentRepository: Repository<CasePrecedent>,
  ) {}

  // ============ 律所知识文章 ============

  // 创建文章
  async createArticle(userId: string, orgId: string, data: Partial<KnowledgeArticle>): Promise<KnowledgeArticle> {
    const article = this.articleRepository.create({
      ...data,
      author_id: userId,
      organization_id: orgId,
      status: data.status || ArticleStatus.PUBLISHED,
      view_count: 0,
    });
    return this.articleRepository.save(article);
  }

  // 查询文章列表（支持按分类/关键词查询）
  async findArticles(orgId: string, params: ArticleQueryParams = {}): Promise<KnowledgeArticle[]> {
    const qb = this.articleRepository
      .createQueryBuilder('a')
      .where('a.organization_id = :orgId', { orgId });

    if (params.category) {
      qb.andWhere('a.category = :category', { category: params.category });
    }
    if (params.author_id) {
      qb.andWhere('a.author_id = :authorId', { authorId: params.author_id });
    }
    if (params.status) {
      qb.andWhere('a.status = :status', { status: params.status });
    }
    if (params.keyword) {
      qb.andWhere('(a.title LIKE :keyword OR a.content LIKE :keyword)', {
        keyword: `%${params.keyword}%`,
      });
    }

    qb.orderBy('a.created_at', 'DESC');
    return qb.getMany();
  }

  // 查询单篇文章
  async findArticleById(id: string): Promise<KnowledgeArticle> {
    const article = await this.articleRepository.findOne({ where: { id } });
    if (!article) {
      throw new NotFoundException('文章不存在');
    }
    return article;
  }

  // 更新文章
  async updateArticle(id: string, data: Partial<KnowledgeArticle>): Promise<KnowledgeArticle> {
    const article = await this.articleRepository.findOne({ where: { id } });
    if (!article) {
      throw new NotFoundException('文章不存在');
    }
    await this.articleRepository.update(id, data);
    return this.articleRepository.findOne({ where: { id } });
  }

  // 删除文章
  async deleteArticle(id: string): Promise<void> {
    const article = await this.articleRepository.findOne({ where: { id } });
    if (!article) {
      throw new NotFoundException('文章不存在');
    }
    await this.articleRepository.delete(id);
  }

  // 浏览量+1
  async incrementView(id: string): Promise<KnowledgeArticle> {
    const article = await this.articleRepository.findOne({ where: { id } });
    if (!article) {
      throw new NotFoundException('文章不存在');
    }
    await this.articleRepository.increment({ id }, 'view_count', 1);
    return this.articleRepository.findOne({ where: { id } });
  }

  // ============ 法律法规 ============

  // 创建法规
  async createLawRegulation(data: Partial<LawRegulation>): Promise<LawRegulation> {
    const regulation = this.lawRegulationRepository.create(data);
    return this.lawRegulationRepository.save(regulation);
  }

  // 查询法规列表（支持按分类/关键词查询）
  async findLawRegulations(params: LawRegulationQueryParams = {}): Promise<LawRegulation[]> {
    const qb = this.lawRegulationRepository.createQueryBuilder('r');

    if (params.category) {
      qb.andWhere('r.category = :category', { category: params.category });
    }
    if (params.keyword) {
      qb.andWhere('(r.title LIKE :keyword OR r.content LIKE :keyword)', {
        keyword: `%${params.keyword}%`,
      });
    }

    qb.orderBy('r.effective_date', 'DESC').addOrderBy('r.created_at', 'DESC');
    return qb.getMany();
  }

  // 查询单部法规
  async findLawRegulationById(id: string): Promise<LawRegulation> {
    const regulation = await this.lawRegulationRepository.findOne({ where: { id } });
    if (!regulation) {
      throw new NotFoundException('法规不存在');
    }
    return regulation;
  }

  // 更新法规
  async updateLawRegulation(id: string, data: Partial<LawRegulation>): Promise<LawRegulation> {
    const regulation = await this.lawRegulationRepository.findOne({ where: { id } });
    if (!regulation) {
      throw new NotFoundException('法规不存在');
    }
    await this.lawRegulationRepository.update(id, data);
    return this.lawRegulationRepository.findOne({ where: { id } });
  }

  // 删除法规
  async deleteLawRegulation(id: string): Promise<void> {
    const regulation = await this.lawRegulationRepository.findOne({ where: { id } });
    if (!regulation) {
      throw new NotFoundException('法规不存在');
    }
    await this.lawRegulationRepository.delete(id);
  }

  // ============ 裁判文书 ============

  // 创建判例
  async createCasePrecedent(data: Partial<CasePrecedent>): Promise<CasePrecedent> {
    const precedent = this.casePrecedentRepository.create(data);
    return this.casePrecedentRepository.save(precedent);
  }

  // 查询判例列表（支持按法院/类型/关键词查询）
  async findCasePrecedents(params: CasePrecedentQueryParams = {}): Promise<CasePrecedent[]> {
    const qb = this.casePrecedentRepository.createQueryBuilder('c');

    if (params.court) {
      qb.andWhere('c.court LIKE :court', { court: `%${params.court}%` });
    }
    if (params.case_type) {
      qb.andWhere('c.case_type = :caseType', { caseType: params.case_type });
    }
    if (params.judgment_type) {
      qb.andWhere('c.judgment_type = :judgmentType', { judgmentType: params.judgment_type });
    }
    if (params.keyword) {
      qb.andWhere('(c.case_name LIKE :keyword OR c.case_no LIKE :keyword OR c.summary LIKE :keyword)', {
        keyword: `%${params.keyword}%`,
      });
    }

    qb.orderBy('c.judgment_date', 'DESC').addOrderBy('c.created_at', 'DESC');
    return qb.getMany();
  }

  // 查询单个判例
  async findCasePrecedentById(id: string): Promise<CasePrecedent> {
    const precedent = await this.casePrecedentRepository.findOne({ where: { id } });
    if (!precedent) {
      throw new NotFoundException('判例不存在');
    }
    return precedent;
  }

  // 更新判例
  async updateCasePrecedent(id: string, data: Partial<CasePrecedent>): Promise<CasePrecedent> {
    const precedent = await this.casePrecedentRepository.findOne({ where: { id } });
    if (!precedent) {
      throw new NotFoundException('判例不存在');
    }
    await this.casePrecedentRepository.update(id, data);
    return this.casePrecedentRepository.findOne({ where: { id } });
  }

  // 删除判例
  async deleteCasePrecedent(id: string): Promise<void> {
    const precedent = await this.casePrecedentRepository.findOne({ where: { id } });
    if (!precedent) {
      throw new NotFoundException('判例不存在');
    }
    await this.casePrecedentRepository.delete(id);
  }
}
