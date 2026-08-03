import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Diagram } from './diagram.entity';

// 图表类型常量（使用 varchar，避免使用 enum）
export const DiagramType = {
  MINDMAP: 'mindmap',           // 思维导图
  FLOWCHART: 'flowchart',       // 流程图
  RELATION: 'relation',         // 法律关系图
  ORGANIZATION: 'organization', // 组织架构
} as const;

// 图表内容默认结构
const DEFAULT_CONTENT = JSON.stringify({ nodes: [], edges: [] });

@Injectable()
export class DiagramService {
  constructor(
    @InjectRepository(Diagram)
    private diagramRepository: Repository<Diagram>,
  ) {}

  // 创建图表
  async create(data: Partial<Diagram>): Promise<Diagram> {
    if (!data.content) {
      data.content = DEFAULT_CONTENT;
    }
    const diagram = this.diagramRepository.create(data);
    return this.diagramRepository.save(diagram);
  }

  // 查询图表列表，支持按 type/keyword/case_id 筛选
  async findAll(orgId: string, filters?: {
    type?: string;
    keyword?: string;
    case_id?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Diagram[]; total: number }> {
    const query = this.diagramRepository.createQueryBuilder('diagram')
      .where('diagram.organization_id = :orgId', { orgId });

    if (filters?.type) {
      query.andWhere('diagram.type = :type', { type: filters.type });
    }
    if (filters?.case_id) {
      query.andWhere('diagram.case_id = :case_id', { case_id: filters.case_id });
    }
    if (filters?.keyword) {
      query.andWhere('(diagram.title LIKE :kw)', { kw: `%${filters.keyword}%` });
    }

    query.orderBy('diagram.updated_at', 'DESC');
    const total = await query.getCount();
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    query.skip((page - 1) * limit).take(limit);

    const data = await query.getMany();
    return { data, total };
  }

  // 根据ID查询图表详情
  async findById(id: string): Promise<Diagram> {
    return this.diagramRepository.findOne({ where: { id } });
  }

  // 按创建人查询图表
  async findByCreator(creatorId: string, orgId: string): Promise<Diagram[]> {
    return this.diagramRepository.find({
      where: { creator_id: creatorId, organization_id: orgId },
      order: { updated_at: 'DESC' },
    });
  }

  // 更新图表
  async update(id: string, data: Partial<Diagram>): Promise<Diagram> {
    await this.diagramRepository.update(id, data);
    return this.diagramRepository.findOne({ where: { id } });
  }

  // 删除图表
  async remove(id: string): Promise<void> {
    await this.diagramRepository.delete(id);
  }
}
