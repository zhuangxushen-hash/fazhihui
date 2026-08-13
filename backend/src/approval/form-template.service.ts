import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FormTemplate, FORM_TYPE } from './form-template.entity';

// 各单据类型的默认字段定义
const DEFAULT_TEMPLATES: Record<
  string,
  { name: string; description: string; fields: unknown[]; approver_roles: string[] }
> = {
  [FORM_TYPE.FINANCE_WITHDRAWAL]: {
    name: '财务提款审批单',
    description: '财务提款申请与审批',
    fields: [
      { key: 'withdraw_amount', label: '提款金额', type: 'number', required: true },
      { key: 'account_from', label: '提款账户', type: 'select', required: true, options: ['基本户', '一般户', '其他'] },
      { key: 'purpose', label: '提款用途', type: 'textarea', required: true },
      { key: 'related_case', label: '关联案件', type: 'text', required: false },
      { key: 'remark', label: '备注', type: 'textarea', required: false },
    ],
    approver_roles: ['org_admin', 'finance'],
  },
  [FORM_TYPE.PAY_APPLY]: {
    name: '支付申请单',
    description: '对外支付款项申请',
    fields: [
      { key: 'pay_amount', label: '支付金额', type: 'number', required: true },
      { key: 'payee', label: '收款方', type: 'text', required: true },
      { key: 'pay_method', label: '支付方式', type: 'select', required: true, options: ['对公转账', '网银', '支票'] },
      { key: 'pay_purpose', label: '支付用途', type: 'textarea', required: true },
      { key: 'invoice_required', label: '是否需要发票', type: 'radio', required: false, options: ['是', '否'] },
    ],
    approver_roles: ['org_admin', 'finance'],
  },
  [FORM_TYPE.PAY_APPROVE]: {
    name: '支付审批单',
    description: '支付申请审批确认',
    fields: [
      { key: 'apply_no', label: '关联申请单号', type: 'text', required: true },
      { key: 'pay_amount', label: '审批金额', type: 'number', required: true },
      { key: 'approve_result', label: '审批结果', type: 'radio', required: true, options: ['同意支付', '驳回'] },
      { key: 'approve_comment', label: '审批意见', type: 'textarea', required: false },
    ],
    approver_roles: ['org_admin', 'finance'],
  },
  [FORM_TYPE.REPAY_APPLY]: {
    name: '报销申请单',
    description: '费用报销申请',
    fields: [
      { key: 'reimburse_amount', label: '报销金额', type: 'number', required: true },
      { key: 'expense_type', label: '费用类型', type: 'select', required: true, options: ['差旅费', '办公费', '招待费', '其他'] },
      { key: 'expense_date', label: '费用发生日期', type: 'date', required: true },
      { key: 'expense_desc', label: '费用说明', type: 'textarea', required: true },
      { key: 'attach_invoice', label: '是否附发票', type: 'radio', required: false, options: ['是', '否'] },
    ],
    approver_roles: ['org_admin', 'finance'],
  },
  [FORM_TYPE.REPAY_APPROVE]: {
    name: '报销审批单',
    description: '报销申请审批确认',
    fields: [
      { key: 'apply_no', label: '关联申请单号', type: 'text', required: true },
      { key: 'reimburse_amount', label: '审批金额', type: 'number', required: true },
      { key: 'approve_result', label: '审批结果', type: 'radio', required: true, options: ['同意报销', '驳回'] },
      { key: 'approve_comment', label: '审批意见', type: 'textarea', required: false },
    ],
    approver_roles: ['org_admin', 'finance'],
  },
  [FORM_TYPE.INVOICE_REPAY]: {
    name: '成本票-报销审批单',
    description: '成本发票报销审批',
    fields: [
      { key: 'invoice_no', label: '发票号码', type: 'text', required: true },
      { key: 'invoice_amount', label: '发票金额', type: 'number', required: true },
      { key: 'invoice_date', label: '开票日期', type: 'date', required: true },
      { key: 'cost_type', label: '成本类型', type: 'select', required: true, options: ['办公费', '差旅费', '招待费', '其他'] },
      { key: 'approve_result', label: '审批结果', type: 'radio', required: true, options: ['同意', '驳回'] },
    ],
    approver_roles: ['org_admin', 'finance'],
  },
};

@Injectable()
export class FormTemplateService {
  constructor(
    @InjectRepository(FormTemplate)
    private formTemplateRepository: Repository<FormTemplate>,
  ) {}

  // 初始化默认模板（幂等）
  async initDefaultTemplates(orgId: string): Promise<void> {
    for (const [formType, tpl] of Object.entries(DEFAULT_TEMPLATES)) {
      const existing = await this.formTemplateRepository.findOne({
        where: { form_type: formType, organization_id: orgId },
      });
      if (existing) continue;
      await this.formTemplateRepository.save(
        this.formTemplateRepository.create({
          form_type: formType,
          name: tpl.name,
          description: tpl.description,
          fields: JSON.stringify(tpl.fields),
          approver_roles: JSON.stringify(tpl.approver_roles),
          enabled: true,
          organization_id: orgId,
        }),
      );
    }
  }

  // 查询表单模板列表
  async getTemplates(orgId: string): Promise<FormTemplate[]> {
    // 确保默认模板存在
    await this.initDefaultTemplates(orgId);
    return this.formTemplateRepository.find({
      where: { organization_id: orgId, enabled: true },
      order: { created_at: 'ASC' },
    });
  }

  // 查询单个模板（解析 fields JSON）
  async getTemplateByType(orgId: string, formType: string): Promise<FormTemplate> {
    await this.initDefaultTemplates(orgId);
    const tpl = await this.formTemplateRepository.findOne({
      where: { form_type: formType, organization_id: orgId },
    });
    if (!tpl) {
      throw new NotFoundException('表单模板不存在');
    }
    if (tpl.fields) {
      try {
        tpl.fields = JSON.parse(tpl.fields);
      } catch (e) {
        // 解析失败保持原样
      }
    }
    if (tpl.approver_roles) {
      try {
        tpl.approver_roles = JSON.parse(tpl.approver_roles);
      } catch (e) {
        // 解析失败保持原样
      }
    }
    return tpl;
  }

  /**
   * 根据模板发起审批单据
   * 校验必填字段并构建审批内容
   */
  async createFormApproval(
    orgId: string,
    userId: string,
    data: { form_type: string; form_data: Record<string, unknown>; approvers?: string[]; title?: string },
  ): Promise<FormTemplate> {
    const tpl = await this.formTemplateRepository.findOne({
      where: { form_type: data.form_type, organization_id: orgId },
    });
    if (!tpl) {
      throw new NotFoundException('表单模板不存在');
    }

    // 校验必填字段
    let fields: Array<{ key: string; label: string; required?: boolean }> = [];
    try {
      fields = tpl.fields ? JSON.parse(tpl.fields) : [];
    } catch (e) {
      fields = [];
    }
    for (const field of fields) {
      if (field.required) {
        const value = data.form_data?.[field.key];
        if (value === undefined || value === null || value === '') {
          throw new BadRequestException(`字段"${field.label}"为必填项`);
        }
      }
    }
    return tpl;
  }
}
