import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketingMaterial } from './marketing-material.entity';
import { ComplianceService } from '../compliance/compliance.service';
import { ComplianceType, ComplianceResult } from '../types';

@Injectable()
export class MarketingService {
  constructor(
    @InjectRepository(MarketingMaterial)
    private marketingMaterialRepository: Repository<MarketingMaterial>,
    private complianceService: ComplianceService,
  ) {}

  async uploadMaterial(materialData: Partial<MarketingMaterial>): Promise<MarketingMaterial> {
    const material = this.marketingMaterialRepository.create(materialData);
    return this.marketingMaterialRepository.save(material);
  }

  async checkMaterialCompliance(id: string): Promise<MarketingMaterial> {
    const material = await this.marketingMaterialRepository.findOne({ where: { id } });
    if (!material) {
      throw new Error('素材不存在');
    }

    const content = material.name + (material.tags || '');
    const complianceResult = await this.complianceService.checkCompliance(
      content,
      ComplianceType.MARKETING,
      material.organization_id,
      material.uploaded_by_id,
      id,
    );

    material.compliance_checked = true;
    material.compliance_result = complianceResult.result;
    return this.marketingMaterialRepository.save(material);
  }

  async findMaterials(orgId: string, filters?: {
    platform?: string;
    is_ai_generated?: boolean;
    compliance_result?: ComplianceResult;
  }): Promise<MarketingMaterial[]> {
    const query = { organization_id: orgId } as any;
    if (filters?.platform) {
      query.platform = filters.platform;
    }
    if (filters?.is_ai_generated !== undefined) {
      query.is_ai_generated = filters.is_ai_generated;
    }
    if (filters?.compliance_result) {
      query.compliance_result = filters.compliance_result;
    }
    return this.marketingMaterialRepository.find({ where: query, order: { created_at: 'DESC' } });
  }

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

  async deleteMaterial(id: string): Promise<void> {
    await this.marketingMaterialRepository.delete(id);
  }
}
