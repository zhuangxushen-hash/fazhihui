import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LegalDocument } from './legal-document.entity';
import { Case } from './case.entity';

@Injectable()
export class LegalDocumentService {
  constructor(
    @InjectRepository(LegalDocument)
    private legalDocumentRepository: Repository<LegalDocument>,
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
  ) {}

  async create(data: Partial<LegalDocument>): Promise<LegalDocument> {
    const entity = this.legalDocumentRepository.create(data);
    return this.legalDocumentRepository.save(entity);
  }

  async findAll(orgId?: string): Promise<LegalDocument[]> {
    const query = this.legalDocumentRepository.createQueryBuilder('doc')
      .where('doc.status = :status', { status: 'active' });
    if (orgId) {
      query.andWhere('(doc.organization_id = :orgId OR doc.is_system = :isSystem)', { orgId, isSystem: true });
    }
    query.orderBy('doc.created_at', 'DESC');
    return query.getMany();
  }

  async findById(id: string): Promise<LegalDocument> {
    return this.legalDocumentRepository.findOne({ where: { id } });
  }

  async update(id: string, data: Partial<LegalDocument>): Promise<LegalDocument> {
    await this.legalDocumentRepository.update(id, data);
    return this.legalDocumentRepository.findOne({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.legalDocumentRepository.update(id, { status: 'inactive' });
  }

  async getTemplatesByCaseType(caseType: string): Promise<LegalDocument[]> {
    return this.legalDocumentRepository.find({
      where: { case_type: caseType, status: 'active' },
      order: { created_at: 'DESC' },
    });
  }

  async generateDocument(templateId: string, variables: Record<string, string>): Promise<{ content: string; template: LegalDocument }> {
    const template = await this.findById(templateId);
    if (!template) {
      throw new Error('模板不存在');
    }
    let content = template.content_template || '';
    if (variables) {
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        content = content.replace(regex, value || '');
      }
    }
    return { content, template };
  }

  async previewDocument(templateId: string, variables: Record<string, string>): Promise<{ content: string; template_name: string }> {
    const result = await this.generateDocument(templateId, variables);
    return {
      content: result.content,
      template_name: result.template.template_name,
    };
  }

  /**
   * 基于模板自动生成委托合同
   * 读取案件信息（client_name, case_type, fee_amount等），根据 templateId 选择模板内容
   * standard标准模板 / simple简版模板，生成合同文本（字符串）返回，不落库
   */
  async generateContract(caseId: string, templateId: string): Promise<{ content: string; case_id: string; template_id: string; generated_at: string }> {
    // 读取案件信息
    const caseEntity = await this.caseRepository.findOne({ where: { id: caseId } });
    if (!caseEntity) {
      throw new Error('案件不存在');
    }

    const clientName = caseEntity.client_name || '委托人';
    const clientPhone = caseEntity.client_phone || '';
    const caseType = caseEntity.case_type || '其他';
    const feeAmount = caseEntity.fee_amount || caseEntity.service_fee || 0;
    const caseNo = caseEntity.case_no || caseId;
    const generatedAt = new Date().toISOString();

    // 根据案件类型映射中文案由
    const caseTypeLabelMap: Record<string, string> = {
      marriage: '婚姻家事',
      traffic: '交通事故',
      labor: '劳动争议',
      debt: '债务逾期',
      criminal: '刑事辩护',
      admin: '行政诉讼',
      other: '其他',
    };
    const caseTypeLabel = caseTypeLabelMap[caseType] || caseType;

    // 根据 templateId 选择模板内容：standard标准模板 / simple简版模板
    if (templateId === 'standard') {
      const content = [
        '委托代理合同',
        '',
        `合同编号：${caseNo}`,
        `签订日期：${generatedAt.slice(0, 10)}`,
        '',
        '甲方（委托人）：' + clientName,
        clientPhone ? '联系电话：' + clientPhone : '',
        '',
        '乙方（受托人）：律师事务所',
        '',
        '第一条 委托事项',
        `甲方因${caseTypeLabel}纠纷一案，委托乙方律师作为代理人，提供法律服务。`,
        '',
        '第二条 代理权限',
        '乙方律师代理权限为一般授权代理，包括但不限于：',
        '1. 代为起诉、应诉；',
        '2. 代为参加庭审，发表代理意见；',
        '3. 代为调查取证、申请证据保全；',
        '4. 代为调解、和解；',
        '5. 代签收法律文书。',
        '',
        '第三条 律师费用',
        `甲方应向乙方支付律师代理费人民币${feeAmount}元（大写：${this.numberToChinese(feeAmount)}元整）。`,
        '律师费应于本合同签订之日起三日内一次性付清。',
        '',
        '第四条 甲方义务',
        '1. 甲方应如实陈述案件事实，提供真实、完整的证据材料；',
        '2. 甲方应积极配合乙方律师开展工作；',
        '3. 甲方应按时支付律师费用及相关办案费用。',
        '',
        '第五条 乙方义务',
        '1. 乙方应勤勉尽责，依法维护甲方合法权益；',
        '2. 乙方应对甲方提供的资料和信息保密；',
        '3. 乙方应及时向甲方通报案件进展。',
        '',
        '第六条 合同变更与解除',
        '本合同一经签订，非经双方协商一致，不得擅自变更或解除。',
        '如甲方单方解除合同，已收取的律师费不予退还。',
        '',
        '第七条 争议解决',
        '本合同履行过程中发生争议，双方应协商解决；协商不成的，可向乙方所在地人民法院起诉。',
        '',
        '第八条 附则',
        '本合同一式两份，甲乙双方各执一份，自双方签字（盖章）之日起生效。',
        '',
        '甲方（签字）：________________',
        '',
        '乙方（盖章）：律师事务所',
        '',
        `签订日期：${generatedAt.slice(0, 10)}`,
      ].filter(line => line !== '' || true).join('\n');
      return { content, case_id: caseId, template_id: templateId, generated_at: generatedAt };
    }

    // simple 简版模板
    const content = [
      '委托代理合同（简版）',
      '',
      `合同编号：${caseNo}`,
      `签订日期：${generatedAt.slice(0, 10)}`,
      '',
      '甲方（委托人）：' + clientName,
      '乙方（受托人）：律师事务所',
      '',
      `甲方因${caseTypeLabel}纠纷一案，委托乙方律师代理。`,
      '',
      `律师代理费：人民币${feeAmount}元。`,
      '',
      '本合同自双方签字之日起生效，一式两份，甲乙双方各执一份。',
      '',
      '甲方（签字）：________________',
      '乙方（盖章）：律师事务所',
      '',
      `签订日期：${generatedAt.slice(0, 10)}`,
    ].join('\n');
    return { content, case_id: caseId, template_id: templateId, generated_at: generatedAt };
  }

  /**
   * 批量生成文书
   * 遍历 caseIds，逐个调用 generateContract，返回结果数组
   */
  async batchGenerate(caseIds: string[], templateId: string): Promise<{ case_id: string; content: string; success: boolean }[]> {
    const results: { case_id: string; content: string; success: boolean }[] = [];
    for (const caseId of caseIds) {
      try {
        const result = await this.generateContract(caseId, templateId);
        results.push({ case_id: caseId, content: result.content, success: true });
      } catch (error) {
        results.push({ case_id: caseId, content: '', success: false });
      }
    }
    return results;
  }

  // 将数字金额转换为大写中文（用于合同金额展示）
  private numberToChinese(num: number): string {
    if (!num || num === 0) return '零';
    const cnNums = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
    const cnIntRadice = ['', '拾', '佰', '仟', '万', '拾', '佰', '仟', '亿'];
    const integerPart = Math.floor(num);
    if (integerPart === 0) return '零';
    const strNum = String(integerPart);
    let result = '';
    for (let i = 0; i < strNum.length; i++) {
      const digit = parseInt(strNum[i], 10);
      const pos = strNum.length - i - 1;
      if (digit !== 0) {
        result += cnNums[digit] + cnIntRadice[pos];
      } else {
        result += cnNums[digit];
      }
    }
    result = result.replace(/零+$/g, '').replace(/零+/g, '零');
    return result;
  }
}