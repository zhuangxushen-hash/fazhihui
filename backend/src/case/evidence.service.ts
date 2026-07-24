import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Evidence } from './evidence.entity';
import { Case } from './case.entity';
import { EvidenceType, EvidenceCategory } from '../types';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EvidenceService {
  constructor(
    @InjectRepository(Evidence)
    private evidenceRepository: Repository<Evidence>,
  ) {}

  // 单文件上传
  async uploadEvidence(
    caseId: string,
    file: Express.Multer.File,
    uploadById: string,
    evidenceData: {
      name?: string;
      type?: EvidenceType;
      category?: EvidenceCategory;
      description?: string;
    },
  ): Promise<Evidence> {
    const uploadDir = path.join(process.cwd(), 'uploads', 'evidences', caseId);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `${uuidv4()}_${file.originalname}`;
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, file.buffer);

    const evidence = this.evidenceRepository.create({
      name: evidenceData.name || file.originalname,
      type: evidenceData.type || EvidenceType.OTHER,
      category: evidenceData.category || EvidenceCategory.OTHER,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.mimetype,
      description: evidenceData.description,
      case_id: caseId,
      upload_by_id: uploadById,
      version: 1,
    });

    return this.evidenceRepository.save(evidence);
  }

  // 批量上传
  async batchUploadEvidence(
    caseId: string,
    files: Express.Multer.File[],
    uploadById: string,
    commonData: {
      type?: EvidenceType;
      category?: EvidenceCategory;
    } = {},
  ): Promise<Evidence[]> {
    const results: Evidence[] = [];
    for (const file of files) {
      const evidence = await this.uploadEvidence(caseId, file, uploadById, {
        type: commonData.type,
        category: commonData.category,
      });
      results.push(evidence);
    }
    return results;
  }

  // 更新证据分类标注
  async updateEvidenceCategory(
    id: string,
    data: {
      type?: EvidenceType;
      category?: EvidenceCategory;
      description?: string;
      name?: string;
    },
  ): Promise<Evidence> {
    const evidence = await this.evidenceRepository.findOne({ where: { id } });
    if (!evidence) {
      throw new NotFoundException('证据不存在');
    }

    Object.assign(evidence, data);
    return this.evidenceRepository.save(evidence);
  }

  // 获取案件证据列表
  async getEvidenceList(
    caseId: string,
    filters?: {
      type?: EvidenceType;
      category?: EvidenceCategory;
      is_archived?: boolean;
    },
  ): Promise<Evidence[]> {
    const query = this.evidenceRepository.createQueryBuilder('evidence')
      .where('evidence.case_id = :caseId', { caseId });

    if (filters?.type) {
      query.andWhere('evidence.type = :type', { type: filters.type });
    }
    if (filters?.category) {
      query.andWhere('evidence.category = :category', { category: filters.category });
    }
    if (filters?.is_archived !== undefined) {
      query.andWhere('evidence.is_archived = :is_archived', { is_archived: filters.is_archived });
    }

    query.orderBy('evidence.upload_at', 'DESC');
    return query.getMany();
  }

  // 获取证据详情（包含版本历史）
  async getEvidenceDetail(id: string): Promise<Evidence> {
    const evidence = await this.evidenceRepository.findOne({
      where: { id },
      relations: { versions: true, upload_by: true },
    });
    if (!evidence) {
      throw new NotFoundException('证据不存在');
    }
    return evidence;
  }

  // 上传新版本
  async uploadNewVersion(
    id: string,
    file: Express.Multer.File,
    uploadById: string,
  ): Promise<Evidence> {
    const originalEvidence = await this.evidenceRepository.findOne({ where: { id } });
    if (!originalEvidence) {
      throw new NotFoundException('原证据不存在');
    }

    const uploadDir = path.join(process.cwd(), 'uploads', 'evidences', originalEvidence.case_id);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `${uuidv4()}_${file.originalname}`;
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, file.buffer);

    // 获取最新版本号
    const versions = await this.evidenceRepository.find({
      where: { parent_evidence_id: id },
      order: { version: 'DESC' },
    });
    const newVersion = versions.length > 0 ? versions[0].version + 1 : 2;

    const newEvidence = this.evidenceRepository.create({
      name: originalEvidence.name,
      type: originalEvidence.type,
      category: originalEvidence.category,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.mimetype,
      description: originalEvidence.description,
      case_id: originalEvidence.case_id,
      upload_by_id: uploadById,
      parent_evidence_id: id,
      version: newVersion,
    });

    return this.evidenceRepository.save(newEvidence);
  }

  // 软删除（归档）
  async archiveEvidence(id: string): Promise<Evidence> {
    const evidence = await this.evidenceRepository.findOne({ where: { id } });
    if (!evidence) {
      throw new NotFoundException('证据不存在');
    }

    evidence.is_archived = true;
    return this.evidenceRepository.save(evidence);
  }

  // 恢复归档的证据
  async restoreEvidence(id: string): Promise<Evidence> {
    const evidence = await this.evidenceRepository.findOne({ where: { id } });
    if (!evidence) {
      throw new NotFoundException('证据不存在');
    }

    evidence.is_archived = false;
    return this.evidenceRepository.save(evidence);
  }

  // 生成证据目录（按类型分组）
  async generateEvidenceCatalog(caseId: string): Promise<{
    case_id: string;
    generated_at: Date;
    categories: {
      category: EvidenceCategory;
      category_name: string;
      items: {
        type: EvidenceType;
        type_name: string;
        evidences: Evidence[];
        count: number;
      }[];
      total_count: number;
    }[];
    total_count: number;
  }> {
    const evidences = await this.evidenceRepository.find({
      where: { case_id: caseId, is_archived: false },
      order: { category: 'ASC', type: 'ASC', upload_at: 'ASC' },
    });

    const categoryNames: Record<EvidenceCategory, string> = {
      [EvidenceCategory.PLAINTIFF]: '原告证据',
      [EvidenceCategory.DEFENDANT]: '被告证据',
      [EvidenceCategory.COURT]: '法院材料',
      [EvidenceCategory.OTHER]: '其他',
    };

    const typeNames: Record<EvidenceType, string> = {
      [EvidenceType.CONTRACT]: '合同',
      [EvidenceType.EVIDENCE]: '证据',
      [EvidenceType.DOCUMENT]: '文书',
      [EvidenceType.OTHER]: '其他',
    };

    const result = {
      case_id: caseId,
      generated_at: new Date(),
      categories: [] as any[],
      total_count: evidences.length,
    };

    // 按分类分组
    const categoryGroups: Record<EvidenceCategory, Evidence[]> = {
      [EvidenceCategory.PLAINTIFF]: [],
      [EvidenceCategory.DEFENDANT]: [],
      [EvidenceCategory.COURT]: [],
      [EvidenceCategory.OTHER]: [],
    };

    evidences.forEach(e => {
      if (!categoryGroups[e.category]) {
        categoryGroups[e.category] = [];
      }
      categoryGroups[e.category].push(e);
    });

    // 按类型二级分组
    Object.keys(categoryGroups).forEach((categoryKey) => {
      const category = categoryKey as EvidenceCategory;
      const items = categoryGroups[category];
      if (items.length === 0) return;

      const typeGroups: Record<EvidenceType, Evidence[]> = {
        [EvidenceType.CONTRACT]: [],
        [EvidenceType.EVIDENCE]: [],
        [EvidenceType.DOCUMENT]: [],
        [EvidenceType.OTHER]: [],
      };

      items.forEach(e => {
        if (!typeGroups[e.type]) {
          typeGroups[e.type] = [];
        }
        typeGroups[e.type].push(e);
      });

      const categoryItems = Object.keys(typeGroups)
        .filter(typeKey => typeGroups[typeKey as EvidenceType].length > 0)
        .map(typeKey => {
          const type = typeKey as EvidenceType;
          const typeEvidences = typeGroups[type];
          return {
            type,
            type_name: typeNames[type],
            evidences: typeEvidences,
            count: typeEvidences.length,
          };
        });

      result.categories.push({
        category,
        category_name: categoryNames[category],
        items: categoryItems,
        total_count: items.length,
      });
    });

    return result;
  }

  // 获取文件预览路径
  async getFilePreviewPath(id: string): Promise<{ path: string; mime_type: string; name: string }> {
    const evidence = await this.evidenceRepository.findOne({ where: { id } });
    if (!evidence) {
      throw new NotFoundException('证据不存在');
    }

    if (!fs.existsSync(evidence.file_path)) {
      throw new NotFoundException('文件不存在');
    }

    return {
      path: evidence.file_path,
      mime_type: evidence.mime_type,
      name: evidence.name,
    };
  }

  // 物理删除文件（谨慎使用）
  async deleteEvidenceFile(id: string): Promise<void> {
    const evidence = await this.evidenceRepository.findOne({ where: { id } });
    if (!evidence) {
      throw new NotFoundException('证据不存在');
    }

    if (fs.existsSync(evidence.file_path)) {
      fs.unlinkSync(evidence.file_path);
    }

    await this.evidenceRepository.remove(evidence);
  }

  // 批量归档
  async batchArchiveEvidence(ids: string[]): Promise<void> {
    await this.evidenceRepository.update(
      { id: In(ids) },
      { is_archived: true }
    );
  }

  // 批量修改分类
  async batchUpdateCategory(
    ids: string[],
    data: {
      type?: EvidenceType;
      category?: EvidenceCategory;
    },
  ): Promise<void> {
    await this.evidenceRepository.update(
      { id: In(ids) },
      data
    );
  }

  // 获取证据列表（按组织，支持筛选和分页）
  async findAll(
    orgId: string,
    filters?: {
      type?: EvidenceType;
      category?: EvidenceCategory;
      is_archived?: boolean;
      case_id?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<{ data: Evidence[]; total: number }> {
    const query = this.evidenceRepository.createQueryBuilder('evidence')
      .where('evidence.case_id IN (SELECT id FROM cases WHERE organization_id = :orgId)', { orgId });

    if (filters?.type) {
      query.andWhere('evidence.type = :type', { type: filters.type });
    }
    if (filters?.category) {
      query.andWhere('evidence.category = :category', { category: filters.category });
    }
    if (filters?.is_archived !== undefined) {
      query.andWhere('evidence.is_archived = :is_archived', { is_archived: filters.is_archived });
    }
    if (filters?.case_id) {
      query.andWhere('evidence.case_id = :case_id', { case_id: filters.case_id });
    }

    const total = await query.getCount();
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    query.skip((page - 1) * limit).take(limit);

    query.orderBy('evidence.upload_at', 'DESC');
    const data = await query.getMany();
    return { data, total };
  }
}