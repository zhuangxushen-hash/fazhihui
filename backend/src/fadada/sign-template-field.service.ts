import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SignTemplateField } from './sign-template-field.entity';

/**
 * 法大大签署模板字段配置服务
 * 管理 sign_template_fields：模板字段的同步保存、查询与更新（填写方式/自动带出/固定值）。
 */
@Injectable()
export class SignTemplateFieldService {
  constructor(
    @InjectRepository(SignTemplateField)
    private fieldRepository: Repository<SignTemplateField>,
  ) {}

  /** 查询模板字段列表（按文档序号排序，保证书写顺序） */
  async listByTemplate(templateId: string): Promise<SignTemplateField[]> {
    return this.fieldRepository.find({
      where: { template_id: templateId },
      order: { field_doc_id: 'ASC', created_at: 'ASC' },
    });
  }

  /** 计算给定配置在模板内的字段数量（用于判断是否需要创建记录） */
  async countByTemplate(templateId: string): Promise<number> {
    return this.fieldRepository.count({ where: { template_id: templateId } });
  }

  /** 批量覆盖保存模板字段（先清空旧配置，再写入新的） */
  async replaceByTemplate(
    templateId: string,
    fields: Array<{
      field_doc_id?: string;
      field_id: string;
      field_name: string;
      field_type?: string;
      actor?: string;
      required?: boolean;
      tips?: string;
      check_format?: string;
      fill_mode?: string;
      auto_source?: string;
      fixed_value?: string;
    }>,
  ): Promise<void> {
    // 删除该模板原有字段配置
    await this.fieldRepository.delete({ template_id: templateId });
    // 写入新的字段记录
    if (fields.length > 0) {
      const rows = fields.map((f) =>
        this.fieldRepository.create({
          template_id: templateId,
          field_doc_id: f.field_doc_id || '',
          field_id: f.field_id,
          field_name: f.field_name,
          field_type: f.field_type || '',
          actor: f.actor || null,
          required: !!f.required,
          tips: f.tips || null,
          check_format: f.check_format || null,
          fill_mode: f.fill_mode || 'client',
          auto_source: f.auto_source || null,
          fixed_value: f.fixed_value || null,
        }),
      );
      await this.fieldRepository.save(rows);
    }
  }

  /** 保存单个字段配置（更新 fill_mode / auto_source / fixed_value） */
  async saveConfig(
    templateId: string,
    items: Array<{ field_id: string; fill_mode?: string; auto_source?: string; fixed_value?: string; enabled?: boolean }>,
  ): Promise<string> {
    for (const item of items) {
      const rec = await this.fieldRepository.findOne({
        where: { template_id: templateId, field_id: item.field_id },
      });
      if (!rec) continue;
      if (item.fill_mode !== undefined) rec.fill_mode = item.fill_mode;
      if (item.auto_source !== undefined) rec.auto_source = item.auto_source;
      if (item.fixed_value !== undefined) rec.fixed_value = item.fixed_value;
      if (item.enabled !== undefined) rec.enabled = item.enabled;
      rec.updated_at = new Date();
      await this.fieldRepository.save(rec);
    }
    return 'ok';
  }

  /** 查询模板详情（不存在抛异常） */
  async getByTemplateAndFieldId(templateId: string, fieldId: string): Promise<SignTemplateField> {
    const rec = await this.fieldRepository.findOne({ where: { template_id: templateId, field_id: fieldId } });
    if (!rec) throw new NotFoundException('模板字段不存在');
    return rec;
  }
}