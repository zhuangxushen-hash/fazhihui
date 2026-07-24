import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdMaterial } from './ad-material.entity';
import { AdMaterialType, AdMaterialStatus, MaterialComplianceStatus } from '../types';

export interface CreateAdMaterialDto {
  name: string;
  type: AdMaterialType;
  tags?: string[];
  file_path?: string;
  account_id?: string;
  plan_id?: string;
  channel?: string;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  cost?: number;
  status?: AdMaterialStatus;
  organization_id: string;
  uploaded_by_id: string;
  // Task 1.5.3：AI 生成内容入库时携带的字段
  content_text?: string;
  case_type?: string;
  compliance_status?: MaterialComplianceStatus;
}

export interface UpdateEffectDto {
  impressions?: number;
  clicks?: number;
  conversions?: number;
  cost?: number;
}

export interface MaterialRankingFilters {
  type?: AdMaterialType;
  tag?: string;
  status?: AdMaterialStatus;
  channel?: string;
  account_id?: string;
  plan_id?: string;
  compliance_status?: MaterialComplianceStatus;
}

export type MaterialRankMetric = 'impressions' | 'clicks' | 'conversions' | 'roi';

// 默认 ROI 阈值（百分比）。ROI = 回款/消耗 * 100
const DEFAULT_HIGH_ROI_THRESHOLD = 200;
const DEFAULT_LOW_ROI_THRESHOLD = 100;

/**
 * 素材效能管理服务
 * - 素材 CRUD
 * - 标签管理（添加/删除标签、按标签筛选）
 * - 效果数据更新
 * - 效果排行与高/低效自动标记
 */
@Injectable()
export class MaterialService {
  constructor(
    @InjectRepository(AdMaterial)
    private adMaterialRepository: Repository<AdMaterial>,
  ) {}

  async create(dto: CreateAdMaterialDto): Promise<AdMaterial> {
    const material = this.adMaterialRepository.create({
      name: dto.name,
      type: dto.type,
      tags: dto.tags || [],
      file_path: dto.file_path,
      account_id: dto.account_id,
      plan_id: dto.plan_id,
      channel: dto.channel,
      impressions: dto.impressions || 0,
      clicks: dto.clicks || 0,
      conversions: dto.conversions || 0,
      cost: dto.cost || 0,
      status: dto.status || AdMaterialStatus.DRAFT,
      organization_id: dto.organization_id,
      uploaded_by_id: dto.uploaded_by_id,
      // Task 1.5.3：AI 生成内容入库时携带的字段
      content_text: dto.content_text,
      case_type: dto.case_type,
      compliance_status: dto.compliance_status || MaterialComplianceStatus.PENDING,
    });
    return this.adMaterialRepository.save(material);
  }

  /**
   * Task 1.5.3：AI 生成内容一键保存到素材库
   * 自动打标签（案由 + 内容类型）
   */
  async saveGeneratedContent(dto: {
    title: string;
    content: string;
    case_type: string;
    content_type: string;
    tags?: string[];
    organization_id: string;
    uploaded_by_id: string;
    channel?: string;
  }): Promise<AdMaterial> {
    // 根据内容类型映射到 AdMaterialType
    const typeMap: Record<string, AdMaterialType> = {
      video_script: AdMaterialType.SCRIPT,
      copywriting: AdMaterialType.ARTICLE,
      live_script: AdMaterialType.SCRIPT,
      article: AdMaterialType.ARTICLE,
    };
    const materialType = typeMap[dto.content_type] || AdMaterialType.ARTICLE;

    // 自动打标签：案由 + 内容类型 + 自定义标签
    const caseTypeLabels: Record<string, string> = {
      marriage: '婚姻家事',
      traffic: '交通事故',
      labor: '劳动争议',
      debt: '债务纠纷',
      other: '综合法律',
    };
    const contentTypeLabels: Record<string, string> = {
      video_script: '短视频脚本',
      copywriting: '朋友圈文案',
      live_script: '直播话术',
      article: '科普图文',
    };
    const autoTags = [
      caseTypeLabels[dto.case_type] || dto.case_type,
      contentTypeLabels[dto.content_type] || dto.content_type,
      'AI生成',
      ...(dto.tags || []),
    ];
    // 去重
    const uniqueTags = Array.from(new Set(autoTags));

    return this.create({
      name: dto.title,
      type: materialType,
      tags: uniqueTags,
      content_text: dto.content,
      case_type: dto.case_type,
      organization_id: dto.organization_id,
      uploaded_by_id: dto.uploaded_by_id,
      channel: dto.channel,
      status: AdMaterialStatus.DRAFT,
      compliance_status: MaterialComplianceStatus.PENDING,
    });
  }

  /**
   * Task 1.6.3：素材绑定投放计划（前置校验合规状态）
   * 未通过预审的素材返回错误
   */
  async bindToPlan(materialId: string, planId: string): Promise<AdMaterial> {
    const material = await this.findById(materialId);
    if (material.compliance_status !== MaterialComplianceStatus.PASSED) {
      const reasonMap: Record<MaterialComplianceStatus, string> = {
        [MaterialComplianceStatus.PENDING]: '素材尚未完成合规预审，请先进行预审',
        [MaterialComplianceStatus.PASSED]: '合规预审通过',
        [MaterialComplianceStatus.NEED_MODIFICATION]: '素材合规预审未通过（需修改），禁止绑定投放计划',
        [MaterialComplianceStatus.FORBIDDEN]: '素材合规预审未通过（禁止发布），禁止绑定投放计划',
      };
      throw new BadRequestException(reasonMap[material.compliance_status] || '素材合规状态不允许绑定');
    }
    material.plan_id = planId;
    return this.adMaterialRepository.save(material);
  }

  async update(id: string, data: Partial<AdMaterial>): Promise<AdMaterial> {
    const material = await this.adMaterialRepository.findOne({ where: { id } });
    if (!material) {
      throw new Error('素材不存在');
    }
    // Task 1.6.3：若更新涉及绑定投放计划（plan_id 由空变为非空），
    // 必须校验合规预审状态
    if (
      data.plan_id &&
      data.plan_id !== material.plan_id
    ) {
      if (material.compliance_status !== MaterialComplianceStatus.PASSED) {
        const reasonMap: Record<MaterialComplianceStatus, string> = {
          [MaterialComplianceStatus.PENDING]: '素材尚未完成合规预审，请先进行预审',
          [MaterialComplianceStatus.PASSED]: '合规预审通过',
          [MaterialComplianceStatus.NEED_MODIFICATION]: '素材合规预审未通过（需修改），禁止绑定投放计划',
          [MaterialComplianceStatus.FORBIDDEN]: '素材合规预审未通过（禁止发布），禁止绑定投放计划',
        };
        throw new BadRequestException(
          reasonMap[material.compliance_status] || '素材合规状态不允许绑定',
        );
      }
    }
    Object.assign(material, data);
    return this.adMaterialRepository.save(material);
  }

  async delete(id: string): Promise<void> {
    await this.adMaterialRepository.delete(id);
  }

  async findById(id: string): Promise<AdMaterial> {
    const material = await this.adMaterialRepository.findOne({ where: { id } });
    if (!material) {
      throw new Error('素材不存在');
    }
    return material;
  }

  /**
   * 素材列表查询（支持类型、标签、状态筛选）
   */
  async findMaterials(
    orgId: string,
    filters: MaterialRankingFilters = {},
  ): Promise<AdMaterial[]> {
    const qb = this.adMaterialRepository
      .createQueryBuilder('m')
      .where('m.organization_id = :orgId', { orgId });

    if (filters.type) qb.andWhere('m.type = :type', { type: filters.type });
    if (filters.status) qb.andWhere('m.status = :status', { status: filters.status });
    if (filters.channel) qb.andWhere('m.channel = :channel', { channel: filters.channel });
    if (filters.account_id) qb.andWhere('m.account_id = :accountId', { accountId: filters.account_id });
    if (filters.plan_id) qb.andWhere('m.plan_id = :planId', { planId: filters.plan_id });
    if (filters.compliance_status) qb.andWhere('m.compliance_status = :complianceStatus', { complianceStatus: filters.compliance_status });
    if (filters.tag) {
      // simple-json 存储为 JSON 字符串，使用 LIKE 模糊匹配标签
      qb.andWhere('m.tags LIKE :tag', { tag: `%"${filters.tag}"%` });
    }

    qb.orderBy('m.created_at', 'DESC');
    return qb.getMany();
  }

  /**
   * 添加标签
   */
  async addTag(id: string, tag: string): Promise<AdMaterial> {
    const material = await this.findById(id);
    const tags = material.tags || [];
    if (!tags.includes(tag)) {
      tags.push(tag);
      material.tags = tags;
      return this.adMaterialRepository.save(material);
    }
    return material;
  }

  /**
   * 删除标签
   */
  async removeTag(id: string, tag: string): Promise<AdMaterial> {
    const material = await this.findById(id);
    const tags = material.tags || [];
    material.tags = tags.filter((t) => t !== tag);
    return this.adMaterialRepository.save(material);
  }

  /**
   * 更新效果数据（增量累加，避免覆盖）
   */
  async updateEffect(id: string, dto: UpdateEffectDto): Promise<AdMaterial> {
    const material = await this.findById(id);
    if (dto.impressions !== undefined) {
      material.impressions = (material.impressions || 0) + Number(dto.impressions);
    }
    if (dto.clicks !== undefined) {
      material.clicks = (material.clicks || 0) + Number(dto.clicks);
    }
    if (dto.conversions !== undefined) {
      material.conversions = (material.conversions || 0) + Number(dto.conversions);
    }
    if (dto.cost !== undefined) {
      material.cost = (Number(material.cost) || 0) + Number(dto.cost);
    }
    // 重算 ROI：基于已记录的 roi（由 ConversionService T+1 任务维护），
    // 这里仅在消耗 > 0 且无 T+1 数据时按当前 roi 字段做兜底
    return this.adMaterialRepository.save(material);
  }

  /**
   * 素材效果排行
   * 自动标记高转化（roi >= highThreshold）和低效（roi < lowThreshold）素材
   */
  async getRanking(
    orgId: string,
    metric: MaterialRankMetric = 'roi',
    filters: MaterialRankingFilters = {},
    limit: number = 20,
    highThreshold: number = DEFAULT_HIGH_ROI_THRESHOLD,
    lowThreshold: number = DEFAULT_LOW_ROI_THRESHOLD,
  ): Promise<Array<AdMaterial & { performance: 'high' | 'low' | 'normal' }>> {
    const qb = this.adMaterialRepository
      .createQueryBuilder('m')
      .where('m.organization_id = :orgId', { orgId });

    if (filters.type) qb.andWhere('m.type = :type', { type: filters.type });
    if (filters.status) qb.andWhere('m.status = :status', { status: filters.status });
    if (filters.channel) qb.andWhere('m.channel = :channel', { channel: filters.channel });
    if (filters.account_id) qb.andWhere('m.account_id = :accountId', { accountId: filters.account_id });
    if (filters.plan_id) qb.andWhere('m.plan_id = :planId', { planId: filters.plan_id });
    if (filters.compliance_status) qb.andWhere('m.compliance_status = :complianceStatus', { complianceStatus: filters.compliance_status });
    if (filters.tag) {
      qb.andWhere('m.tags LIKE :tag', { tag: `%"${filters.tag}"%` });
    }

    const validMetrics = ['impressions', 'clicks', 'conversions', 'roi'];
    const orderMetric = validMetrics.includes(metric) ? metric : 'roi';
    qb.orderBy(`m.${orderMetric}`, 'DESC').limit(limit);

    const materials = await qb.getMany();
    return materials.map((m) => {
      const roi = Number(m.roi) || 0;
      let performance: 'high' | 'low' | 'normal' = 'normal';
      if (metric === 'roi') {
        if (roi >= highThreshold) performance = 'high';
        else if (roi < lowThreshold) performance = 'low';
      } else {
        // 非 ROI 指标时，根据 ROI 字段做高/低效标记
        if (roi >= highThreshold) performance = 'high';
        else if (roi < lowThreshold && roi > 0) performance = 'low';
      }
      return { ...m, performance };
    });
  }

  /**
   * 获取组织内所有标签集合
   */
  async getAllTags(orgId: string): Promise<string[]> {
    const materials = await this.adMaterialRepository.find({
      where: { organization_id: orgId },
    });
    const tagSet = new Set<string>();
    for (const m of materials) {
      if (Array.isArray(m.tags)) {
        m.tags.forEach((t) => tagSet.add(t));
      }
    }
    return Array.from(tagSet).sort();
  }
}
