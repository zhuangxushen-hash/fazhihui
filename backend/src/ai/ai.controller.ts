import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

@Controller('ai')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER, UserRole.ASSISTANT, UserRole.SALES, UserRole.MARKETING, UserRole.FINANCE)
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('marketing/copy')
  generateCopy(@Body() body: { prompt: string; case_type?: string; platform?: string }) {
    return {
      content: this.aiService.generateMarketingCopy(body.prompt, body.case_type, body.platform),
    };
  }

  @Post('marketing/script')
  generateScript(@Body() body: { prompt: string; case_type?: string }) {
    return {
      script: this.aiService.generateVideoScript(body.prompt, body.case_type),
    };
  }

  @Post('legal/document')
  generateDocument(@Body() body: { type: string; data: any }) {
    return {
      document: this.aiService.generateLegalDocument(body.type, body.data),
    };
  }

  @Post('legal/risk-analysis')
  analyzeRisk(@Body() body: { case_type?: string; description?: string; case_data?: any }) {
    const caseData = body.case_data || {
      case_type: body.case_type,
      description: body.description,
    };
    return this.aiService.analyzeCaseRisk(caseData);
  }

  // ========== AI 工具导航与通用接口 ==========

  /**
   * AI 工具导航列表
   * 返回静态分类数据，包含合同审查/法律研究/文书生成/案例分析/智能问答等分类
   */
  @Get('nav')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER, UserRole.ASSISTANT, UserRole.SALES, UserRole.MARKETING, UserRole.FINANCE, UserRole.CLIENT)
  getNav() {
    return {
      categories: [
        {
          key: 'contract_review',
          name: '合同审查',
          description: '智能识别合同风险条款，提供修改建议',
          icon: 'contract',
          path: '/ai/contract-review',
        },
        {
          key: 'legal_research',
          name: '法律研究',
          description: '基于法律知识库的深度研究与分析',
          icon: 'research',
          path: '/ai/legal-research',
        },
        {
          key: 'document_generation',
          name: '文书生成',
          description: '自动生成起诉状、答辩状等法律文书',
          icon: 'document',
          path: '/ai/legal/document',
        },
        {
          key: 'case_analysis',
          name: '案例分析',
          description: '案件风险分析与类案检索',
          icon: 'case',
          path: '/ai/legal/risk-analysis',
        },
        {
          key: 'smart_qa',
          name: '智能问答',
          description: '法律问题智能问答，快速获取专业解答',
          icon: 'chat',
          path: '/ai/chat',
        },
        {
          key: 'similar_cases',
          name: '类案检索',
          description: '检索相似历史案件，辅助案件评估',
          icon: 'search',
          path: '/ai/similar-cases',
        },
        {
          key: 'laws_query',
          name: '法律法规查询',
          description: '查询相关法律法规条文',
          icon: 'law',
          path: '/ai/laws',
        },
        {
          key: 'marketing_copy',
          name: '营销文案',
          description: '生成法律营销推广文案',
          icon: 'marketing',
          path: '/ai/marketing/copy',
        },
      ],
    };
  }

  /**
   * 智能问答
   * 根据用户问题返回预设响应
   */
  @Post('chat')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER, UserRole.ASSISTANT, UserRole.SALES, UserRole.MARKETING, UserRole.FINANCE, UserRole.CLIENT)
  chat(@Body() body: { question: string; case_type?: string }) {
    const question = body.question || '';
    // 预设响应：根据问题关键词返回相应解答
    let answer = '您好，我是法智汇AI助手。';
    if (question.includes('离婚') || question.includes('婚姻')) {
      answer += '关于婚姻家事问题，建议您准备好结婚证、财产证明等相关材料，专业律师会为您详细分析财产分割、子女抚养权等事宜。';
    } else if (question.includes('交通事故')) {
      answer += '关于交通事故问题，建议您保留事故认定书、医疗票据等证据，专业律师可帮您评估赔偿金额并代理理赔。';
    } else if (question.includes('劳动') || question.includes('工资') || question.includes('工伤')) {
      answer += '关于劳动纠纷问题，建议您保留劳动合同、工资流水等证据，可通过劳动仲裁维护合法权益。';
    } else if (question.includes('债务') || question.includes('欠款')) {
      answer += '关于债务纠纷问题，建议您保留借条、转账记录等证据，可通过诉讼方式追讨欠款。';
    } else {
      answer += `您的问题"${question}"已收到，专业律师将为您提供详细解答。建议您描述具体案情以便获得更准确的法律建议。`;
    }
    return {
      answer,
      suggestions: [
        '请描述您的具体案情',
        '您希望获得哪方面的法律帮助？',
        '是否有相关证据材料？',
      ],
    };
  }

  /**
   * 合同审查
   * 调用已有 aiService 方法返回审查结果
   */
  @Post('contract-review')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER, UserRole.ASSISTANT, UserRole.SALES, UserRole.MARKETING, UserRole.FINANCE, UserRole.CLIENT)
  contractReview(@Body() body: { contract_text: string; contract_type?: string }) {
    const contractText = body.contract_text || '';
    const riskItems: string[] = [];
    const suggestions: string[] = [];

    // 简单规则识别风险条款
    if (contractText.includes('违约金') && !contractText.includes('违约责任')) {
      riskItems.push('违约金条款缺乏明确的违约责任界定');
      suggestions.push('建议明确违约责任的具体情形和计算方式');
    }
    if (contractText.includes('自动续约') || contractText.includes('自动续期')) {
      riskItems.push('存在自动续约条款');
      suggestions.push('建议增加续约提前通知机制和取消续约的途径');
    }
    if (!contractText.includes('争议解决') && !contractText.includes('管辖')) {
      riskItems.push('缺少争议解决条款');
      suggestions.push('建议增加争议解决方式（诉讼或仲裁）和管辖法院/仲裁机构');
    }
    if (contractText.includes('最终解释权')) {
      riskItems.push('存在"最终解释权"条款，可能被认定为无效格式条款');
      suggestions.push('建议删除最终解释权条款，避免格式条款无效风险');
    }

    return {
      risk_level: riskItems.length >= 3 ? 'high' : riskItems.length >= 1 ? 'medium' : 'low',
      risk_items: riskItems,
      suggestions,
      summary: `合同审查完成，共发现${riskItems.length}项风险点。${riskItems.length === 0 ? '合同整体风险较低。' : '建议针对上述风险点进行修改完善。'}`,
    };
  }

  /**
   * 法律研究
   * 返回预设响应
   */
  @Post('legal-research')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER, UserRole.ASSISTANT, UserRole.SALES, UserRole.MARKETING, UserRole.FINANCE, UserRole.CLIENT)
  legalResearch(@Body() body: { topic: string; keywords?: string[] }) {
    const topic = body.topic || '';
    return {
      topic,
      summary: `针对"${topic}"的法律研究报告：根据相关法律法规和司法实践，为您整理了以下研究要点。`,
      key_points: [
        '相关法律依据已整理，建议结合具体案情适用',
        '司法实践中存在不同裁判观点，需注意区分',
        '建议关注最新司法解释和指导性案例',
      ],
      references: [
        '建议查阅相关法律法规条文',
        '建议参考最高人民法院指导性案例',
        '建议关注地方法院裁判规则',
      ],
    };
  }

  /**
   * 类案检索
   * 返回预设响应（可后续接入 similar-case.service）
   */
  @Get('similar-cases')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER, UserRole.ASSISTANT, UserRole.SALES, UserRole.MARKETING, UserRole.FINANCE, UserRole.CLIENT)
  similarCases(
    @Query('case_type') caseType: string,
    @Query('keyword') keyword: string,
    @Query('year') year: string,
  ) {
    // 预设响应，后续可接入 SimilarCaseService
    return {
      data: [],
      total: 0,
      message: '类案检索功能已就绪，请通过 /api/similar-cases/search 接口进行详细检索',
      query: { case_type: caseType, keyword, year },
    };
  }

  /**
   * 法律法规查询
   * 返回预设响应（可后续接入 knowledge.service）
   */
  @Get('laws')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER, UserRole.ASSISTANT, UserRole.SALES, UserRole.MARKETING, UserRole.FINANCE, UserRole.CLIENT)
  laws(
    @Query('keyword') keyword: string,
    @Query('category') category: string,
  ) {
    // 预设响应，后续可接入 KnowledgeService
    return {
      data: [],
      total: 0,
      message: '法律法规查询功能已就绪，请通过 /api/knowledge/law-regulations 接口进行详细查询',
      query: { keyword, category },
    };
  }
}
