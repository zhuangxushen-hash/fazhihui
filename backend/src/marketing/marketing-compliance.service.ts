import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdMaterial } from './ad-material.entity';
import { MaterialComplianceStatus } from '../types';

// 违规关键词分类（与 compliance 模块保持一致，复用同一套规则）
// absolute: 绝对化用语（轻微违规 → 需修改）
// exaggerate: 夸大效果（轻微违规 → 需修改）
// promise: 虚假承诺/包胜诉（严重违规 → 禁止发布）
// fee: 违规收费（严重违规 → 禁止发布）
const VIOLATION_KEYWORDS: Record<string, string[]> = {
  absolute: ['最', '第一', '唯一', '顶级', '首选', '独家', '极品', '万能', '国家级', '世界级', '最佳', '最优', '最强', '最大', '最低价', '最便宜', '100%'],
  promise: ['包赢', '必赢', '一定赢', '保证胜诉', '确保胜诉', '稳赢', '百分百胜诉', '不赢不收费', '包胜诉', '绝对赢', '保证打赢', '承诺胜诉'],
  exaggerate: ['秒批', '神速', '当天解决', '立刻', '马上', '极速', '秒到账', '百分百成功', '一定立案', '保证立案', '一定能赢', '最快', '秒回'],
  fee: ['风险代理全免', '零费用', '不收费', '免费打官司', '超低价', '内部价', '关系费', '加急费', '保关系', '给好处费', '回扣'],
};

// 违规类型标签与整改建议
const KEYWORD_META: Record<string, { label: string; suggestion: string; severity: 'minor' | 'serious' }> = {
  absolute: {
    label: '绝对化用语',
    suggestion: '避免使用绝对化用语，违反《广告法》第九条',
    severity: 'minor',
  },
  promise: {
    label: '虚假承诺',
    suggestion: '禁止对案件结果作出虚假承诺，违反律师执业规范',
    severity: 'serious',
  },
  exaggerate: {
    label: '夸大效果',
    suggestion: '避免夸大宣传效果，可能构成虚假广告',
    severity: 'minor',
  },
  fee: {
    label: '违规收费',
    suggestion: '禁止违规收费或暗示不正当关系，违反律师收费管理规定',
    severity: 'serious',
  },
};

export interface ViolationItem {
  keyword: string;
  type: string;
  label: string;
  suggestion: string;
  severity: 'minor' | 'serious';
  positions: number[];
}

export interface CompliancePrecheckResult {
  status: MaterialComplianceStatus;
  violations: ViolationItem[];
  summary: string;
  suggestions: string[];
  // 高亮文本片段（前端用于渲染违规位置）
  highlights: Array<{
    keyword: string;
    start: number;
    end: number;
    severity: 'minor' | 'serious';
  }>;
}

export interface PrecheckContentDto {
  content: string;
  material_id?: string;
}

/**
 * 营销内容合规预审服务（Task 1.6.1 / 1.6.2）
 * - 输入内容文本
 * - 检测违规：夸大宣传、包胜诉承诺、绝对化用语、违规收费承诺
 * - 复用 compliance 模块的 VIOLATION_KEYWORDS
 * - 三分类：通过 / 需修改 / 禁止发布
 */
@Injectable()
export class MarketingComplianceService {
  private readonly logger = new Logger(MarketingComplianceService.name);

  constructor(
    @InjectRepository(AdMaterial)
    private adMaterialRepository: Repository<AdMaterial>,
  ) {}

  /**
   * 合规预审核心逻辑（Task 1.6.1 + 1.6.2）
   * 三分类：
   *   - PASSED: 无违规
   *   - NEED_MODIFICATION: 仅轻微违规（绝对化用语、夸大效果）
   *   - FORBIDDEN: 严重违规（虚假承诺、违规收费）
   */
  async precheckContent(dto: PrecheckContentDto): Promise<CompliancePrecheckResult> {
    const { content, material_id } = dto;

    if (!content || !content.trim()) {
      return {
        status: MaterialComplianceStatus.NEED_MODIFICATION,
        violations: [],
        summary: '内容为空，请输入待审核内容',
        suggestions: ['请输入营销内容后再进行合规预审'],
        highlights: [],
      };
    }

    const violations: ViolationItem[] = [];
    const highlights: CompliancePrecheckResult['highlights'] = [];

    // 遍历各类型违规关键词
    for (const [type, keywords] of Object.entries(VIOLATION_KEYWORDS)) {
      const meta = KEYWORD_META[type];
      for (const keyword of keywords) {
        const positions = this.findAllPositions(content, keyword);
        if (positions.length > 0) {
          violations.push({
            keyword,
            type,
            label: meta.label,
            suggestion: meta.suggestion,
            severity: meta.severity,
            positions,
          });
          for (const pos of positions) {
            highlights.push({
              keyword,
              start: pos,
              end: pos + keyword.length,
              severity: meta.severity,
            });
          }
        }
      }
    }

    // 三分类判定
    let status: MaterialComplianceStatus;
    const hasSerious = violations.some((v) => v.severity === 'serious');
    const hasMinor = violations.some((v) => v.severity === 'minor');

    if (violations.length === 0) {
      status = MaterialComplianceStatus.PASSED;
    } else if (hasSerious) {
      status = MaterialComplianceStatus.FORBIDDEN;
    } else if (hasMinor) {
      status = MaterialComplianceStatus.NEED_MODIFICATION;
    } else {
      status = MaterialComplianceStatus.PASSED;
    }

    // 生成汇总说明
    const summary = this.buildSummary(status, violations);
    const suggestions = this.buildSuggestions(violations);

    // 若提供了素材 ID，则同步更新素材的合规状态
    if (material_id) {
      await this.updateMaterialComplianceStatus(material_id, {
        status,
        violations,
        summary,
        suggestions,
        highlights,
      });
    }

    return {
      status,
      violations,
      summary,
      suggestions,
      highlights,
    };
  }

  /**
   * 更新素材的合规预审状态（Task 1.6.3）
   */
  async updateMaterialComplianceStatus(
    materialId: string,
    result: CompliancePrecheckResult,
  ): Promise<AdMaterial> {
    const material = await this.adMaterialRepository.findOne({ where: { id: materialId } });
    if (!material) {
      throw new Error('素材不存在');
    }
    material.compliance_status = result.status;
    material.compliance_detail = JSON.stringify({
      violations: result.violations,
      summary: result.summary,
      suggestions: result.suggestions,
      highlights: result.highlights,
      checked_at: new Date().toISOString(),
    });
    material.compliance_checked_at = new Date();
    return this.adMaterialRepository.save(material);
  }

  /**
   * 校验素材是否可绑定投放计划（Task 1.6.3）
   * - 仅 PASSED 状态可绑定
   * - 其他状态返回错误
   */
  async validateMaterialForPlanBinding(materialId: string): Promise<{
    allowed: boolean;
    reason: string;
    material?: AdMaterial;
  }> {
    const material = await this.adMaterialRepository.findOne({ where: { id: materialId } });
    if (!material) {
      return {
        allowed: false,
        reason: '素材不存在',
      };
    }
    if (material.compliance_status === MaterialComplianceStatus.PASSED) {
      return { allowed: true, reason: '合规预审通过', material };
    }
    const reasonMap: Record<MaterialComplianceStatus, string> = {
      [MaterialComplianceStatus.PENDING]: '素材尚未完成合规预审，请先进行预审',
      [MaterialComplianceStatus.PASSED]: '合规预审通过',
      [MaterialComplianceStatus.NEED_MODIFICATION]: '素材合规预审未通过（需修改），禁止绑定投放计划',
      [MaterialComplianceStatus.FORBIDDEN]: '素材合规预审未通过（禁止发布），禁止绑定投放计划',
    };
    return {
      allowed: false,
      reason: reasonMap[material.compliance_status] || '素材合规状态不允许绑定',
      material,
    };
  }

  /**
   * 查询素材的合规预审结果
   */
  async getMaterialComplianceResult(materialId: string): Promise<{
    material_id: string;
    status: MaterialComplianceStatus;
    detail: CompliancePrecheckResult | null;
    checked_at: Date | null;
  }> {
    const material = await this.adMaterialRepository.findOne({ where: { id: materialId } });
    if (!material) {
      throw new Error('素材不存在');
    }
    let detail: CompliancePrecheckResult | null = null;
    if (material.compliance_detail) {
      try {
        const parsed = JSON.parse(material.compliance_detail);
        detail = {
          status: material.compliance_status,
          violations: parsed.violations || [],
          summary: parsed.summary || '',
          suggestions: parsed.suggestions || [],
          highlights: parsed.highlights || [],
        };
      } catch {
        detail = null;
      }
    }
    return {
      material_id: materialId,
      status: material.compliance_status,
      detail,
      checked_at: material.compliance_checked_at,
    };
  }

  /**
   * 查找关键词在文本中的所有位置
   */
  private findAllPositions(text: string, keyword: string): number[] {
    const positions: number[] = [];
    if (!keyword) return positions;
    let index = text.indexOf(keyword);
    while (index !== -1) {
      positions.push(index);
      index = text.indexOf(keyword, index + keyword.length);
    }
    return positions;
  }

  /**
   * 构建汇总说明
   */
  private buildSummary(status: MaterialComplianceStatus, violations: ViolationItem[]): string {
    if (status === MaterialComplianceStatus.PASSED) {
      return '合规预审通过，未检测到违规内容';
    }
    const seriousCount = violations.filter((v) => v.severity === 'serious').length;
    const minorCount = violations.filter((v) => v.severity === 'minor').length;
    if (status === MaterialComplianceStatus.FORBIDDEN) {
      return `检测到严重违规（${seriousCount} 项），禁止发布。同时存在轻微违规 ${minorCount} 项。`;
    }
    return `检测到轻微违规（${minorCount} 项），需修改后方可发布`;
  }

  /**
   * 构建修改建议列表
   */
  private buildSuggestions(violations: ViolationItem[]): string[] {
    const suggestions: string[] = [];
    const seen = new Set<string>();
    for (const v of violations) {
      const key = `${v.type}-${v.keyword}`;
      if (!seen.has(key)) {
        seen.add(key);
        suggestions.push(`【${v.label}】"${v.keyword}" - ${v.suggestion}`);
      }
    }
    return suggestions;
  }
}
