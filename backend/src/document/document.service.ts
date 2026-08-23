import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, DataSource } from 'typeorm';
import { DocumentItem } from './document.entity';
import { DocumentVersion } from './document-version.entity';

@Injectable()
export class DocumentItemService {
  constructor(
    @InjectRepository(DocumentItem)
    private readonly documentRepository: Repository<DocumentItem>,
    @InjectRepository(DocumentVersion)
    private readonly versionRepository: Repository<DocumentVersion>,
    private readonly dataSource: DataSource,
  ) {}

  // 创建文档
  async create(data: Partial<DocumentItem>): Promise<DocumentItem> {
    // 未指定归属范围时默认个人文档
    const doc = this.documentRepository.create({
      ...data,
      scope: data.scope || 'personal',
    });
    return this.documentRepository.save(doc);
  }

  // 分页查询文档列表，支持 name/category/case_id/scope 筛选
  async findList(params: {
    organization_id: string;
    page?: number;
    pageSize?: number;
    name?: string;
    category?: string;
    case_id?: string;
    scope?: string;
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
    if (params.scope) {
      where.scope = params.scope;
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
    // 级联删除该文档的版本记录
    await this.versionRepository.delete({ document_id: id });
  }

  // ========== 文档版本管理 ==========

  /**
   * 创建文档版本
   * 首次更新时创建版本v1，之后每次更新递增版本号
   */
  async createVersion(data: {
    document_id: string;
    file_url?: string;
    file_type?: string;
    file_size?: number;
    description?: string;
    creator_id?: string;
    organization_id: string;
  }): Promise<DocumentVersion> {
    const doc = await this.documentRepository.findOne({ where: { id: data.document_id } });
    if (!doc) {
      throw new NotFoundException('文档不存在');
    }

    // 计算当前最新版本号
    const latest = await this.versionRepository
      .createQueryBuilder('v')
      .where('v.document_id = :documentId', { documentId: data.document_id })
      .orderBy('v.version_no', 'DESC')
      .getOne();
    const nextVersion = latest ? latest.version_no + 1 : 1;

    return this.dataSource.transaction(async (manager) => {
      // 保存版本记录
      const version = manager.create(DocumentVersion, {
        document_id: data.document_id,
        version_no: nextVersion,
        file_url: data.file_url || doc.file_url,
        file_type: data.file_type || doc.file_type,
        file_size: data.file_size || doc.file_size,
        description: data.description,
        creator_id: data.creator_id || null,
        organization_id: data.organization_id,
      });
      const saved = await manager.save(DocumentVersion, version);
      return saved;
    });
  }

  /**
   * 查询文档版本列表
   */
  async getVersions(documentId: string): Promise<DocumentVersion[]> {
    const doc = await this.documentRepository.findOne({ where: { id: documentId } });
    if (!doc) {
      throw new NotFoundException('文档不存在');
    }
    return this.versionRepository.find({
      where: { document_id: documentId },
      order: { version_no: 'DESC' },
    });
  }

  /**
   * 回滚到指定版本
   * 将文档的 file_url/file_type/file_size 更新为目标版本的数据
   */
  async rollbackToVersion(documentId: string, versionId: string): Promise<DocumentItem> {
    const doc = await this.documentRepository.findOne({ where: { id: documentId } });
    if (!doc) {
      throw new NotFoundException('文档不存在');
    }
    const version = await this.versionRepository.findOne({ where: { id: versionId, document_id: documentId } });
    if (!version) {
      throw new NotFoundException('版本记录不存在');
    }
    await this.documentRepository.update(documentId, {
      file_url: version.file_url,
      file_type: version.file_type,
      file_size: version.file_size,
    });
    return this.documentRepository.findOne({ where: { id: documentId } });
  }
}
