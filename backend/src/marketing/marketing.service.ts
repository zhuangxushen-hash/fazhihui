import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketingMaterial } from './marketing-material.entity';
import { AdMaterial } from './ad-material.entity';
import {
  ComplianceType,
  ComplianceResult,
  AdMaterialType,
  AdMaterialStatus,
  MaterialComplianceStatus,
} from '../types';
import { ComplianceService } from '../compliance/compliance.service';

// 合规结果字符串到 MaterialComplianceStatus 的映射
const complianceResultToStatusMap: Record<string, MaterialComplianceStatus> = {
  [ComplianceResult.PASS]: MaterialComplianceStatus.PASSED,
  [ComplianceResult.WARNING]: MaterialComplianceStatus.NEED_MODIFICATION,
  [ComplianceResult.REJECT]: MaterialComplianceStatus.FORBIDDEN,
};

// file_type 到 AdMaterialType 的映射
const fileTypeToAdMaterialType = (fileType?: string): AdMaterialType => {
  if (!fileType) return AdMaterialType.ARTICLE;
  const ft = fileType.toLowerCase();
  if (ft.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ft)) {
    return AdMaterialType.IMAGE;
  }
  if (ft.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv'].includes(ft)) {
    return AdMaterialType.VIDEO;
  }
  if (['script', 'txt'].includes(ft)) {
    return AdMaterialType.SCRIPT;
  }
  return AdMaterialType.ARTICLE;
};

// 将旧版 tags 字符串拆分为数组
const parseTags = (tags?: string): string[] => {
  if (!tags) return [];
  return tags.split(/[,，;；\s]+/).filter(Boolean);
};

@Injectable()
export class MarketingService {
  constructor(
    // 保留旧版 Repository 注入声明（旧表 entity 仍注册于 Module，供 seeds 使用）
    @InjectRepository(MarketingMaterial)
    private marketingMaterialRepository: Repository<MarketingMaterial>,
    // 合并后：素材读写统一使用 AdMaterial 表
    @InjectRepository(AdMaterial)
    private adMaterialRepository: Repository<AdMaterial>,
    private complianceService: ComplianceService,
  ) {}

  // 上传素材：合并后写入 AdMaterial 表
  async uploadMaterial(materialData: Partial<MarketingMaterial>): Promise<AdMaterial> {
    const material = this.adMaterialRepository.create({
      name: materialData.name || '',
      type: fileTypeToAdMaterialType(materialData.file_type),
      tags: parseTags(materialData.tags),
      file_path: materialData.file_path || '',
      channel: materialData.platform,
      status: AdMaterialStatus.DRAFT,
      compliance_status: MaterialComplianceStatus.PENDING,
      organization_id: materialData.organization_id || '',
      uploaded_by_id: materialData.uploaded_by_id || '',
    });
    return this.adMaterialRepository.save(material);
  }

  // 合规检查：合并后更新 AdMaterial 的合规状态
  async checkMaterialCompliance(id: string): Promise<AdMaterial> {
    const material = await this.adMaterialRepository.findOne({ where: { id } });
    if (!material) {
      throw new Error('素材不存在');
    }

    const content = material.name + (Array.isArray(material.tags) ? material.tags.join('') : '');
    const complianceResult = await this.complianceService.checkCompliance(
      content,
      ComplianceType.MARKETING,
      material.organization_id,
      material.uploaded_by_id,
      id,
    );

    material.compliance_status = complianceResultToStatusMap[complianceResult.result] || MaterialComplianceStatus.PENDING;
    material.compliance_detail = complianceResult.suggestion || '';
    material.compliance_checked_at = new Date();
    return this.adMaterialRepository.save(material);
  }

  // 查询素材：合并后从 AdMaterial 表查询
  async findMaterials(orgId: string, filters?: {
    platform?: string;
    is_ai_generated?: boolean;
    compliance_result?: ComplianceResult;
  }): Promise<AdMaterial[]> {
    const qb = this.adMaterialRepository
      .createQueryBuilder('m')
      .where('m.organization_id = :orgId', { orgId });

    if (filters?.platform) {
      qb.andWhere('m.channel = :channel', { channel: filters.platform });
    }
    if (filters?.is_ai_generated !== undefined) {
      if (filters.is_ai_generated) {
        qb.andWhere('m.tags LIKE :aiTag', { aiTag: '%"AI生成"%' });
      } else {
        qb.andWhere('(m.tags NOT LIKE :aiTag OR m.tags IS NULL)', { aiTag: '%"AI生成"%' });
      }
    }
    if (filters?.compliance_result) {
      const status = complianceResultToStatusMap[filters.compliance_result];
      if (status) {
        qb.andWhere('m.compliance_status = :complianceStatus', { complianceStatus: status });
      }
    }

    qb.orderBy('m.created_at', 'DESC');
    return qb.getMany();
  }

  // AI 内容生成：保留原有逻辑不变（不操作表）
  async generateAIContent(prompt: string, caseType?: string): Promise<{ content: string; suggestions: string[] }> {
    return {
      content: `基于您的需求，为您生成以下法律营销文案：\n\n【${caseType || '法律'}服务咨询】\n\n专业律师团队，为您提供一对一法律服务。无论您遇到什么法律问题，我们都将为您提供专业、高效的解决方案。\n\n${prompt}\n\n立即咨询，获取专业法律建议！`,
      suggestions: [
        '建议添加具体服务优势',
        '建议明确服务范围',
        '建议加入客户见证',
      ],
    };
  }

  // 删除素材：合并后从 AdMaterial 表删除
  async deleteMaterial(id: string): Promise<void> {
    await this.adMaterialRepository.delete(id);
  }
}
