import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { DocumentItem } from './document.entity';

@Injectable()
export class DocumentItemService {
  constructor(
    @InjectRepository(DocumentItem)
    private readonly documentRepository: Repository<DocumentItem>,
  ) {}

  // 创建文档
  async create(data: Partial<DocumentItem>): Promise<DocumentItem> {
    const doc = this.documentRepository.create(data);
    return this.documentRepository.save(doc);
  }

  // 分页查询文档列表，支持 name/category/case_id 筛选
  async findList(params: {
    organization_id: string;
    page?: number;
    pageSize?: number;
    name?: string;
    category?: string;
    case_id?: string;
  }): Promise<{ list: DocumentItem[]; total: number; page: number; pageSize: number }> {
    const page = Number(params.page) > 0 ? Number(params.page) : 1;
    const pageSize = Number(params.pageSize) > 0 ? Number(params.pageSize) : 10;
    const where: any = {};
    if (params.organization_id) {
      where.organization_id = params.organization_id;
    }
    if (params.name) {
      where.name = Like(`%${params.name}%`);
    }
    if (params.category) {
      where.category = params.category;
    }
    if (params.case_id) {
      where.case_id = params.case_id;
    }
    const [list, total] = await this.documentRepository.findAndCount({
      where,
      order: { updated_at: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { list, total, page, pageSize };
  }

  // 查询单条文档
  async findOne(id: string): Promise<DocumentItem> {
    return this.documentRepository.findOne({ where: { id } });
  }

  // 更新文档
  async update(id: string, data: Partial<DocumentItem>): Promise<DocumentItem> {
    await this.documentRepository.update(id, data);
    return this.documentRepository.findOne({ where: { id } });
  }

  // 删除文档
  async remove(id: string): Promise<void> {
    await this.documentRepository.delete(id);
  }
}
