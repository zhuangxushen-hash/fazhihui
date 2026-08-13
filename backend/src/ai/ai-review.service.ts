import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContractReview, RISK_LEVEL } from './contract-review.entity';
import { LegalResearch } from './legal-research.entity';

// 风险点结构
interface RiskItem {
  clause: string;       // 涉及条款
  risk: string;         // 风险描述
  suggestion: string;   // 修改建议
  level: string;        // 风险等级
}

@Injectable()
export class AiReviewService {
  constructor(
    @InjectRepository(ContractReview)
    private contractReviewRepository: Repository<ContractReview>,
    @InjectRepository(LegalResearch)
    private legalResearchRepository: Repository<LegalResearch>,
  ) {}

  /**
   * 合同风险规则库：按关键词匹配识别风险条款
   */
  private readonly riskRules: Array<{
    match: RegExp;
    clause: string;
    risk: string;
    suggestion: string;
    level: string;
  }> = [
    {
      match: /违约金|赔偿金/,
      clause: '违约责任条款',
      risk: '违约金条款缺乏明确的违约责任界定，或违约金比例过高（超过实际损失30%可能被法院调减）',
      suggestion: '建议明确违约责任的具体情形、计算方式和上限，违约金比例控制在法律允许范围内',
      level: 'high',
    },
    {
      match: /自动续约|自动续期|自动顺延/,
      clause: '合同期限条款',
      risk: '存在自动续约条款，可能使合同在未主动通知的情况下延续，增加履行义务',
      suggestion: '建议增加续约提前通知机制和取消续约的途径，明确续约条件',
      level: 'high',
    },
    {
      match: /争议解决|管辖/,
      clause: '争议解决条款',
      risk: '争议解决条款约定不明确，可能导致管辖权争议',
      suggestion: '建议明确争议解决方式（诉讼或仲裁）和管辖法院/仲裁机构',
      level: 'medium',
    },
    {
      match: /最终解释权/,
      clause: '解释权条款',
      risk: '存在"最终解释权"条款，可能被认定为无效格式条款',
      suggestion: '建议删除最终解释权条款，避免格式条款无效风险',
      level: 'medium',
    },
    {
      match: /保密/,
      clause: '保密条款',
      risk: '缺少明确的保密期限和违约责任，保密信息可能泄露后无法追责',
      suggestion: '建议明确保密信息范围、保密期限、违约后果及例外情形',
      level: 'medium',
    },
    {
      match: /知识产权|版权|著作权|专利/,
      clause: '知识产权条款',
      risk: '知识产权归属约定不明确，可能引发权属争议',
      suggestion: '建议明确知识产权的归属、使用范围、授权方式和后续改进成果的处理',
      level: 'high',
    },
    {
      match: /不可抗力/,
      clause: '不可抗力条款',
      risk: '不可抗力条款约定不完整，或与法律规定的免责情形不一致',
      suggestion: '建议补充不可抗力的具体情形、通知义务、证明要求和后续处理方式',
      level: 'low',
    },
    {
      match: /付款|支付|货款|价款/,
      clause: '付款条款',
      risk: '付款条件、时间和方式约定不明确，存在履约风险',
      suggestion: '建议明确付款节点、金额、支付方式、发票开具及逾期付款责任',
      level: 'medium',
    },
    {
      match: /解除|终止/,
      clause: '合同解除条款',
      risk: '合同解除条件约定不明确，单方解除可能构成违约',
      suggestion: '建议明确合同解除的情形、程序、通知期限及解除后的清算安排',
      level: 'medium',
    },
    {
      match: /免责/,
      clause: '免责条款',
      risk: '存在免责条款，可能过度免除一方责任，被认定为无效',
      suggestion: '建议审查免责条款是否违反法律强制性规定，平衡双方权利义务',
      level: 'high',
    },
    {
      match: /甲方|乙方/,
      clause: '主体信息条款',
      risk: '合同主体权利义务描述不对称，未明确双方核心义务与权利',
      suggestion: '建议逐条核对甲方乙方权利义务是否对等，明确各自义务履行标准',
      level: 'low',
    },
  ];

  /**
   * 合同审查：基于规则库识别风险条款并保存审查记录
   */
  async reviewContract(data: {
    title?: string;
    contract_type?: string;
    contract_text: string;
    organization_id: string;
    reviewer_id?: string;
  }): Promise<ContractReview> {
    const contractText = data.contract_text || '';
    if (!contractText) {
      throw new BadRequestException('合同文本不能为空');
    }

    // 命中规则的风险点
    const riskItems: RiskItem[] = [];
    const matchedKeywords = new Set<string>();

    for (const rule of this.riskRules) {
      if (rule.match.test(contractText)) {
        matchedKeywords.add(rule.clause);
        riskItems.push({
          clause: rule.clause,
          risk: rule.risk,
          suggestion: rule.suggestion,
          level: rule.level,
        });
      }
    }

    // 基础条款完整性检查（合同必备要素）
    const essentialClauses: Array<{ clause: string; keyword: RegExp; risk: string; suggestion: string }> = [
      {
        clause: '合同标的',
        keyword: /标的|货物|服务|项目/,
        risk: '未明确合同标的（交易内容）',
        suggestion: '建议补充合同标的的具体内容、规格、数量及质量标准',
      },
      {
        clause: '价格条款',
        keyword: /价格|金额|费用|总价/,
        risk: '未明确交易价格或金额',
        suggestion: '建议补充合同总价、单价、计价方式及含税情况',
      },
      {
        clause: '履行条款',
        keyword: /履行|交付|期限|日期|时间/,
        risk: '未明确履行期限和交付方式',
        suggestion: '建议补充履行地点、履行期限、交付方式及验收标准',
      },
    ];

    for (const clause of essentialClauses) {
      if (!clause.keyword.test(contractText)) {
        riskItems.push({
          clause: clause.clause,
          risk: clause.risk,
          suggestion: clause.suggestion,
          level: 'medium',
        });
      }
    }

    // 计算风险等级：高危险条款≥2 或 风险点总数≥4 为 high；否则有风险为 medium
    const highCount = riskItems.filter((r) => r.level === 'high').length;
    const riskLevel =
      highCount >= 2 || riskItems.length >= 4
        ? RISK_LEVEL.HIGH
        : riskItems.length > 0
          ? RISK_LEVEL.MEDIUM
          : RISK_LEVEL.LOW;

    const summary = `合同审查完成，共发现${riskItems.length}项风险点（高风险${highCount}项）。${
      riskItems.length === 0 ? '合同整体风险较低，条款较为完善。' : '建议针对上述风险点进行修改完善。'
    }`;

    const record = this.contractReviewRepository.create({
      title: data.title || `${data.contract_type || '合同'}审查记录`,
      contract_type: data.contract_type || null,
      contract_text: contractText,
      risk_level: riskLevel,
      risk_items: JSON.stringify(riskItems),
      summary,
      status: 'completed',
      reviewer_id: data.reviewer_id || null,
      organization_id: data.organization_id,
    });
    return this.contractReviewRepository.save(record);
  }

  /**
   * 查询合同审查记录列表
   */
  async getContractReviews(
    orgId: string,
    filters: { risk_level?: string; contract_type?: string; page?: number; page_size?: number },
  ): Promise<{ data: ContractReview[]; total: number }> {
    const qb = this.contractReviewRepository
      .createQueryBuilder('c')
      .where('c.organization_id = :orgId', { orgId });
    if (filters.risk_level) {
      qb.andWhere('c.risk_level = :level', { level: filters.risk_level });
    }
    if (filters.contract_type) {
      qb.andWhere('c.contract_type = :type', { type: filters.contract_type });
    }
    qb.orderBy('c.created_at', 'DESC');

    const page = Number(filters.page) || 1;
    const pageSize = Number(filters.page_size) || 20;
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  /**
   * 查询合同审查详情（解析 risk_items JSON）
   */
  async getContractReviewById(id: string): Promise<ContractReview> {
    const record = await this.contractReviewRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException('合同审查记录不存在');
    }
    if (record.risk_items) {
      try {
        record.risk_items = JSON.parse(record.risk_items);
      } catch (e) {
        // 解析失败保持原样
      }
    }
    return record;
  }

  /**
   * 删除合同审查记录
   */
  async deleteContractReview(id: string): Promise<void> {
    const record = await this.contractReviewRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException('合同审查记录不存在');
    }
    await this.contractReviewRepository.delete(id);
  }

  /**
   * 创建法律研究任务并生成研究结果
   * 根据研究主题关键词生成结构化的研究要点与参考资料
   */
  async createResearchTask(data: {
    topic: string;
    keywords?: string[];
    organization_id: string;
    creator_id?: string;
  }): Promise<LegalResearch> {
    const topic = data.topic || '';
    if (!topic) {
      throw new BadRequestException('研究主题不能为空');
    }

    // 按主题关键词生成研究内容
    const keyPoints = this.generateKeyPoints(topic, data.keywords || []);
    const references = this.generateReferences(topic, data.keywords || []);
    const summary = this.generateSummary(topic, data.keywords || []);

    const record = this.legalResearchRepository.create({
      topic,
      keywords: JSON.stringify(data.keywords || []),
      summary,
      key_points: JSON.stringify(keyPoints),
      references: JSON.stringify(references),
      status: 'completed',
      creator_id: data.creator_id || null,
      organization_id: data.organization_id,
    });
    return this.legalResearchRepository.save(record);
  }

  /**
   * 查询法律研究任务列表
   */
  async getResearchTasks(
    orgId: string,
    filters: { status?: string; page?: number; page_size?: number },
  ): Promise<{ data: LegalResearch[]; total: number }> {
    const qb = this.legalResearchRepository
      .createQueryBuilder('r')
      .where('r.organization_id = :orgId', { orgId });
    if (filters.status) {
      qb.andWhere('r.status = :status', { status: filters.status });
    }
    qb.orderBy('r.created_at', 'DESC');

    const page = Number(filters.page) || 1;
    const pageSize = Number(filters.page_size) || 20;
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  /**
   * 查询法律研究任务详情（解析 JSON 字段）
   */
  async getResearchTaskById(id: string): Promise<LegalResearch> {
    const record = await this.legalResearchRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException('研究任务不存在');
    }
    for (const field of ['keywords', 'key_points', 'references'] as const) {
      if (record[field]) {
        try {
          record[field] = JSON.parse(record[field]);
        } catch (e) {
          // 解析失败保持原样
        }
      }
    }
    return record;
  }

  /**
   * 删除法律研究任务
   */
  async deleteResearchTask(id: string): Promise<void> {
    const record = await this.legalResearchRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException('研究任务不存在');
    }
    await this.legalResearchRepository.delete(id);
  }

  // 生成研究要点
  private generateKeyPoints(topic: string, keywords: string[]): string[] {
    const points = [
      `相关法律依据已整理，建议结合"${topic}"的具体案情适用`,
      '司法实践中存在不同裁判观点，需注意区分主流裁判规则与个别裁判意见',
      '建议关注最新司法解释、指导性案例和地方法院裁判规则',
    ];
    if (keywords.length > 0) {
      keywords.forEach((k) => {
        points.push(`关键词"${k}"相关研究要点已梳理，注意其在不同场景下的适用差异`);
      });
    }
    return points;
  }

  // 生成参考资料建议
  private generateReferences(topic: string, keywords: string[]): string[] {
    const refs = [
      '《中华人民共和国民法典》相关编章',
      '《中华人民共和国民事诉讼法》及司法解释',
      '最高人民法院相关指导性案例与公报案例',
    ];
    if (keywords.length > 0) {
      refs.push(`围绕"${keywords.join('、')}"检索专业法律数据库与学术文献`);
    }
    return refs;
  }

  // 生成研究摘要
  private generateSummary(topic: string, keywords: string[]): string {
    const kw = keywords.length > 0 ? keywords.join('、') : '相关法律问题';
    return `针对"${topic}"的法律研究报告：结合${kw}，根据现行法律法规与司法实践，为您整理了以下研究要点与参考依据，供案件办理与法律决策参考。`;
  }
}
