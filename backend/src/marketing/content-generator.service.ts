import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentTemplate } from './content-template.entity';

export interface GenerateContentDto {
  case_type: string;
  content_type: string;
  selling_points: string;
  template_id?: string;
}

export interface GeneratedContentResult {
  title: string;
  content: string;
  case_type: string;
  content_type: string;
  template_id?: string;
  tags: string[];
}

// 案由中文标签
const CASE_TYPE_LABELS: Record<string, string> = {
  marriage: '婚姻家事',
  traffic: '交通事故',
  labor: '劳动争议',
  debt: '债务纠纷',
  other: '综合法律',
};

// 内容类型中文标签
const CONTENT_TYPE_LABELS: Record<string, string> = {
  video_script: '短视频脚本',
  copywriting: '朋友圈文案',
  live_script: '直播话术',
  article: '科普图文',
};

// 预置模板库：按 案由 + 内容类型 索引
// 模板变量：{selling_points} 核心卖点关键词、{case_label} 案由中文标签
const PRESET_TEMPLATES: Array<{
  case_type: string;
  content_type: string;
  title: string;
  content: string;
}> = [
  // ========== 婚姻家事 ==========
  {
    case_type: 'marriage',
    content_type: 'video_script',
    title: '婚姻家事短视频脚本',
    content: `【视频标题】遭遇婚姻困境？专业律师来帮您
【开篇吸引】（3秒）
"如果您的婚姻正在经历危机，请先别急着做决定，看完这条视频。"
【场景一】痛点共鸣（15秒）
面对离婚、财产分割、子女抚养权等难题，很多人不知道如何维护自己的合法权益。
【场景二】专业解答（30秒）
{case_label}律师团队，专注于婚姻家事法律领域，为您提供：
{selling_points}
【场景三】服务承诺（15秒）
专业律师一对一咨询，为您分析案件情况，制定个性化解决方案。
【结尾引导】（5秒）
点击下方链接，立即获取专业法律建议。`,
  },
  {
    case_type: 'marriage',
    content_type: 'copywriting',
    title: '婚姻家事朋友圈文案',
    content: `💞 婚姻不易，维权有道

遇到婚姻家事法律问题不知所措？
专业{case_label}律师团队，为您提供专业法律服务。

✨ 我们的服务：
{selling_points}

✨ 选择我们的理由：
• 资深律师团队，办案经验丰富
• 一对一专业咨询，保护客户隐私
• 个性化解决方案，维护您的权益

📞 立即咨询，让专业律师为您解答疑惑
（点击下方链接或私信联系）`,
  },
  {
    case_type: 'marriage',
    content_type: 'live_script',
    title: '婚姻家事直播话术',
    content: `【开场白】
各位观众朋友们大家好，欢迎来到直播间，我是专注于{case_label}案件的律师。今天我们将和大家聊聊婚姻家事中常见的法律问题。
【话题引入】
离婚时财产怎么分？孩子的抚养权归谁？这些都是大家最关心的问题。
【核心卖点】
我们的团队擅长处理各类婚姻家事案件：
{selling_points}
【互动引导】
如果您也遇到类似问题，可以在评论区留言或私信我，我将为您详细解答。
【服务说明】
我们提供一对一专业法律咨询，根据您的具体情况制定方案。
【结尾引导】
关注我，了解更多法律知识。有需要的朋友点击下方链接预约咨询。`,
  },
  {
    case_type: 'marriage',
    content_type: 'article',
    title: '婚姻家事科普图文',
    content: `# 婚姻家事法律知识科普

## 一、常见婚姻家事法律问题

婚姻家事案件涉及离婚、财产分割、子女抚养权、赡养义务等多个方面。面对这些问题，了解相关法律知识至关重要。

## 二、法律要点解析

### 1. 离婚方式
离婚可分为协议离婚和诉讼离婚两种方式。协议离婚需双方自愿，并对子女抚养、财产分割等事项达成一致；诉讼离婚则适用于一方不同意离婚或双方无法达成协议的情况。

### 2. 财产分割
夫妻共同财产原则上均等分割，但会根据具体情况有所调整。个人财产归个人所有。

### 3. 子女抚养权
法院会根据子女的最佳利益原则判决抚养权归属，考虑父母的经济条件、抚养能力等因素。

## 三、我们的专业服务

{case_label}律师团队，专注于婚姻家事法律领域，为您提供：
{selling_points}

## 四、温馨提示

婚姻家事案件涉及个人隐私和家庭关系，建议咨询专业律师，根据具体情况制定维权方案。

> 免责声明：本文仅为一般性法律知识科普，不构成具体法律意见。具体问题请咨询专业律师。`,
  },

  // ========== 交通事故 ==========
  {
    case_type: 'traffic',
    content_type: 'video_script',
    title: '交通事故短视频脚本',
    content: `【视频标题】发生交通事故怎么办？律师教您正确处理
【开篇吸引】（3秒）
"发生交通事故后，这样做才能最大程度维护您的权益。"
【场景一】事故处理流程（20秒）
发生交通事故后，第一时间报警、保留证据、及时就医。这些步骤缺一不可。
【场景二】赔偿项目（25秒）
交通事故赔偿包括医疗费、误工费、护理费、伤残赔偿金等多个项目。
【场景三】专业服务（15秒）
{case_label}律师团队，专注于交通事故案件，为您提供：
{selling_points}
【结尾引导】（5秒）
遇到交通事故法律问题，点击下方链接咨询专业律师。`,
  },
  {
    case_type: 'traffic',
    content_type: 'copywriting',
    title: '交通事故朋友圈文案',
    content: `🚗 交通事故维权，专业律师帮您

发生交通事故不知如何处理？
赔偿金额怎么算？伤残鉴定怎么做？

专业{case_label}律师团队为您服务：
{selling_points}

✨ 服务优势：
• 协助事故责任认定
• 帮助伤残等级鉴定
• 代理赔偿协商与诉讼
• 全程跟进案件进度

📞 遇到交通事故法律问题，立即咨询专业律师
（点击下方链接或私信联系）`,
  },
  {
    case_type: 'traffic',
    content_type: 'live_script',
    title: '交通事故直播话术',
    content: `【开场白】
大家好，欢迎来到直播间，我是专注于{case_label}案件的律师。今天我们聊聊交通事故赔偿的那些事。
【话题引入】
发生交通事故后，很多人不知道自己能获得哪些赔偿，也不知道该如何维权。
【核心卖点】
我们的团队在交通事故案件方面经验丰富：
{selling_points}
【互动引导】
如果您遇到交通事故问题，可以在评论区描述您的情况，我来为您分析。
【服务说明】
我们提供事故责任认定指导、伤残鉴定协助、赔偿协商与诉讼代理等全流程服务。
【结尾引导】
有需要的朋友点击下方链接预约咨询，关注我了解更多法律知识。`,
  },
  {
    case_type: 'traffic',
    content_type: 'article',
    title: '交通事故科普图文',
    content: `# 交通事故处理与赔偿指南

## 一、交通事故处理流程

发生交通事故后，应当依次完成以下步骤：
1. 立即停车，保护现场
2. 及时报警，等待交警处理
3. 救助伤员，及时就医
4. 配合调查，保留证据
5. 申请事故责任认定

## 二、赔偿项目详解

交通事故赔偿主要包括：
- **医疗费**：因治疗产生的合理费用
- **误工费**：因误工减少的收入
- **护理费**：住院期间的护理支出
- **伤残赔偿金**：根据伤残等级确定
- **精神损害抚慰金**：造成严重精神损害的赔偿

## 三、伤残鉴定

伤残鉴定是确定赔偿金额的重要依据，建议在治疗终结后及时申请鉴定。

## 四、我们的专业服务

{case_label}律师团队，专注于交通事故案件，为您提供：
{selling_points}

## 五、温馨提示

交通事故案件涉及多个法律环节，建议及时咨询专业律师，避免错过维权时机。

> 免责声明：本文仅为一般性法律知识科普，不构成具体法律意见。具体问题请咨询专业律师。`,
  },

  // ========== 劳动争议 ==========
  {
    case_type: 'labor',
    content_type: 'video_script',
    title: '劳动争议短视频脚本',
    content: `【视频标题】公司拖欠工资、违法解除合同？教你依法维权
【开篇吸引】（3秒）
"老板拖欠工资、违法辞退？这些维权途径您一定要知道。"
【场景一】常见问题（20秒）
拖欠工资、不签劳动合同、违法解除合同、不缴社保，这些违法行为损害了劳动者的权益。
【场景二】维权途径（25秒）
劳动者可以通过协商、投诉、劳动仲裁、诉讼等方式维护合法权益。
【场景三】专业服务（15秒）
{case_label}律师团队，专注于劳动争议案件，为您提供：
{selling_points}
【结尾引导】（5秒）
遇到劳动法律问题，点击下方链接咨询专业律师。`,
  },
  {
    case_type: 'labor',
    content_type: 'copywriting',
    title: '劳动争议朋友圈文案',
    content: `💼 劳动维权，专业律师为您撑腰

公司拖欠工资？违法解除劳动合同？不缴社保？

专业{case_label}律师团队，帮您依法维权：
{selling_points}

✨ 我们能帮您：
• 追讨拖欠工资和经济补偿
• 申请劳动仲裁和诉讼
• 处理工伤认定和赔偿
• 维护劳动者合法权益

📞 遇到劳动法律问题，立即咨询专业律师
（点击下方链接或私信联系）`,
  },
  {
    case_type: 'labor',
    content_type: 'live_script',
    title: '劳动争议直播话术',
    content: `【开场白】
大家好，欢迎来到直播间，我是专注于{case_label}案件的律师。今天我们聊聊劳动维权那些事。
【话题引入】
很多劳动者在公司拖欠工资、违法解除合同时不知道如何维权，今天就来给大家详细讲解。
【核心卖点】
我们的团队在劳动争议案件方面经验丰富：
{selling_points}
【互动引导】
如果您遇到劳动法律问题，可以在评论区描述情况，我来为您分析解答。
【服务说明】
我们提供劳动仲裁申请、诉讼代理、工伤认定协助等专业服务。
【结尾引导】
有需要的朋友点击下方链接预约咨询，关注我了解更多法律知识。`,
  },
  {
    case_type: 'labor',
    content_type: 'article',
    title: '劳动争议科普图文',
    content: `# 劳动争议维权指南

## 一、常见劳动争议类型

劳动争议主要包括以下几种类型：
1. 拖欠工资纠纷
2. 违法解除劳动合同
3. 未签订劳动合同
4. 工伤认定与赔偿
5. 社保缴纳纠纷

## 二、维权途径

### 1. 协商解决
劳动者可与用人单位协商解决争议。

### 2. 劳动监察投诉
向劳动监察部门投诉，由其责令用人单位改正违法行为。

### 3. 劳动仲裁
向劳动争议仲裁委员会申请仲裁，是劳动争议解决的法定前置程序。

### 4. 诉讼
对仲裁裁决不服的，可向人民法院提起诉讼。

## 三、维权要点

- 注意保留工资条、考勤记录、劳动合同等证据
- 劳动仲裁时效为一年，自权利受到侵害之日起计算
- 工伤认定应在事故发生后一年内申请

## 四、我们的专业服务

{case_label}律师团队，专注于劳动争议案件，为您提供：
{selling_points}

## 五、温馨提示

劳动争议案件程序复杂，建议咨询专业律师，依法维护自身权益。

> 免责声明：本文仅为一般性法律知识科普，不构成具体法律意见。具体问题请咨询专业律师。`,
  },

  // ========== 债务纠纷 ==========
  {
    case_type: 'debt',
    content_type: 'video_script',
    title: '债务纠纷短视频脚本',
    content: `【视频标题】借钱不还怎么办？律师教您合法追讨
【开篇吸引】（3秒）
"朋友借钱不还？这样做才能合法追回欠款。"
【场景一】常见问题（20秒）
借款到期不还、没有借条、转移财产，这些都是债务纠纷中常见的问题。
【场景二】追讨方式（25秒）
通过协商、发律师函、申请支付令、诉讼等方式追讨欠款。
【场景三】专业服务（15秒）
{case_label}律师团队，专注于债务纠纷案件，为您提供：
{selling_points}
【结尾引导】（5秒）
遇到债务纠纷，点击下方链接咨询专业律师。`,
  },
  {
    case_type: 'debt',
    content_type: 'copywriting',
    title: '债务纠纷朋友圈文案',
    content: `💰 债务追讨，专业律师帮您维权

借钱不还？欠款追回困难？
没有借条？对方转移财产？

专业{case_label}律师团队，为您提供：
{selling_points}

✨ 我们能帮您：
• 协助收集和固定证据
• 申请财产保全防止转移
• 代理诉讼和强制执行
• 制定个性化追讨方案

📞 遇到债务纠纷，立即咨询专业律师
（点击下方链接或私信联系）`,
  },
  {
    case_type: 'debt',
    content_type: 'live_script',
    title: '债务纠纷直播话术',
    content: `【开场白】
大家好，欢迎来到直播间，我是专注于{case_label}案件的律师。今天我们聊聊债务追讨那些事。
【话题引入】
借钱不还是很多人头疼的问题，今天就来教大家如何合法有效地追讨欠款。
【核心卖点】
我们的团队在债务纠纷案件方面经验丰富：
{selling_points}
【互动引导】
如果您遇到债务问题，可以在评论区描述情况，我来为您分析。
【服务说明】
我们提供证据收集指导、财产保全申请、诉讼代理、强制执行等专业服务。
【结尾引导】
有需要的朋友点击下方链接预约咨询，关注我了解更多法律知识。`,
  },
  {
    case_type: 'debt',
    content_type: 'article',
    title: '债务纠纷科普图文',
    content: `# 债务纠纷维权指南

## 一、债务纠纷常见类型

1. 民间借贷纠纷
2. 合同欠款纠纷
3. 担保债务纠纷
4. 不当得利返还

## 二、追讨方式

### 1. 协商解决
与债务人协商还款方案，可签订还款协议。

### 2. 律师函催收
委托律师发送律师函，正式要求债务人履行还款义务。

### 3. 申请支付令
债权债务关系明确的，可向法院申请支付令。

### 4. 诉讼
向人民法院提起诉讼，通过司法程序解决纠纷。

### 5. 强制执行
判决生效后，债务人仍不履行的，可申请法院强制执行。

## 三、维权要点

- 借条、转账记录、聊天记录等都是重要证据
- 诉讼时效为三年，自履行期限届满之日起计算
- 可申请财产保全，防止债务人转移财产

## 四、我们的专业服务

{case_label}律师团队，专注于债务纠纷案件，为您提供：
{selling_points}

## 五、温馨提示

债务纠纷涉及证据收集、程序选择等专业问题，建议咨询专业律师。

> 免责声明：本文仅为一般性法律知识科普，不构成具体法律意见。具体问题请咨询专业律师。`,
  },
];

/**
 * AI 内容生成服务（Task 1.5.2）
 * 基于模板+变量替换方式生成营销内容，不依赖外部 AI API
 */
@Injectable()
export class ContentGeneratorService {
  private readonly logger = new Logger(ContentGeneratorService.name);

  constructor(
    @InjectRepository(ContentTemplate)
    private templateRepository: Repository<ContentTemplate>,
  ) {}

  /**
   * 初始化预置模板（应用启动时调用）
   */
  async seedPresetTemplates(): Promise<void> {
    const existingCount = await this.templateRepository.count();
    if (existingCount > 0) {
      return;
    }
    const templates = PRESET_TEMPLATES.map((t) =>
      this.templateRepository.create({
        case_type: t.case_type,
        content_type: t.content_type,
        title: t.title,
        content: t.content,
        version: 1,
        is_active: true,
      }),
    );
    await this.templateRepository.save(templates);
    this.logger.log(`预置 ${templates.length} 个 AI 内容模板`);
  }

  /**
   * 查询模板列表
   */
  async findTemplates(filters?: {
    case_type?: string;
    content_type?: string;
    is_active?: boolean;
  }): Promise<ContentTemplate[]> {
    const where: any = {};
    if (filters?.case_type) where.case_type = filters.case_type;
    if (filters?.content_type) where.content_type = filters.content_type;
    if (filters?.is_active !== undefined) where.is_active = filters.is_active;
    return this.templateRepository.find({ where, order: { created_at: 'ASC' } });
  }

  /**
   * 根据 ID 查询模板
   */
  async findTemplateById(id: string): Promise<ContentTemplate | null> {
    return this.templateRepository.findOne({ where: { id } });
  }

  /**
   * 生成营销内容（Task 1.5.2 核心）
   * 输入：案由类型 + 核心卖点关键词
   * 输出：基于模板+变量替换生成的内容文本
   */
  async generateContent(dto: GenerateContentDto): Promise<GeneratedContentResult> {
    const { case_type, content_type, selling_points, template_id } = dto;

    // 选择模板：优先指定模板，否则按 案由+内容类型 匹配
    let template: ContentTemplate | null = null;
    if (template_id) {
      template = await this.findTemplateById(template_id);
    }
    if (!template) {
      template = await this.templateRepository.findOne({
        where: { case_type, content_type, is_active: true },
      });
    }
    // 兜底：若没有匹配模板，使用 other 案由的模板
    if (!template) {
      template = await this.templateRepository.findOne({
        where: { case_type: 'other', content_type, is_active: true },
      });
    }
    // 仍然没有：使用任意一个该内容类型的模板
    if (!template) {
      template = await this.templateRepository.findOne({
        where: { content_type, is_active: true },
      });
    }

    if (!template) {
      throw new Error(`未找到匹配的内容模板：案由=${case_type}，内容类型=${content_type}`);
    }

    const caseLabel = CASE_TYPE_LABELS[case_type] || CASE_TYPE_LABELS.other;
    const sellingPointsText = this.formatSellingPoints(selling_points, content_type);

    // 变量替换
    const generatedContent = template.content
      .replace(/\{case_label\}/g, caseLabel)
      .replace(/\{selling_points\}/g, sellingPointsText);

    // 生成标题
    const title = `${caseLabel}-${CONTENT_TYPE_LABELS[content_type] || content_type}-${new Date().toLocaleDateString('zh-CN')}`;

    // 自动标签：案由 + 内容类型
    const tags = [caseLabel, CONTENT_TYPE_LABELS[content_type] || content_type, 'AI生成'];

    return {
      title,
      content: generatedContent,
      case_type,
      content_type,
      template_id: template.id,
      tags,
    };
  }

  /**
   * 格式化卖点文本
   */
  private formatSellingPoints(sellingPoints: string, contentType: string): string {
    if (!sellingPoints || !sellingPoints.trim()) {
      return '• 专业律师团队，办案经验丰富\n• 一对一专业咨询，方案个性化\n• 全程跟进服务，及时反馈进度';
    }
    // 支持逗号、顿号、换行分隔
    const points = sellingPoints
      .split(/[,，、\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (points.length === 0) {
      return sellingPoints;
    }

    // 朋友圈文案/直播话术使用圆点列表
    if (contentType === 'copywriting' || contentType === 'live_script') {
      return points.map((p) => `• ${p}`).join('\n');
    }
    // 视频脚本使用编号列表
    if (contentType === 'video_script') {
      return points.map((p, i) => `${i + 1}. ${p}`).join('\n');
    }
    // 图文使用列表
    return points.map((p) => `- ${p}`).join('\n');
  }
}
