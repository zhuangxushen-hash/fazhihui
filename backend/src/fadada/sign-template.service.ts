import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SignTemplate } from './sign-template.entity';

/**
 * 法大大签署模板信息维护服务（B端签约模板维护）
 * 管理法大大 sign-template 模板的业务信息（模板ID、名称、启用状态等）
 */
@Injectable()
export class SignTemplateService {
  constructor(
    @InjectRepository(SignTemplate)
    private signTemplateRepository: Repository<SignTemplate>,
  ) {}

  /** 查询模板列表（可按启用状态/归属组织过滤） */
  async list(params: { organizationId?: string; enabled?: boolean } = {}): Promise<SignTemplate[]> {
    const where: any = {};
    if (params.organizationId) where.organization_id = params.organizationId;
    if (params.enabled !== undefined) where.enabled = params.enabled;
    return this.signTemplateRepository.find({ where, order: { enabled: 'DESC', created_at: 'DESC' } });
  }

  /** 查询模板详情 */
  async getById(id: string): Promise<SignTemplate> {
    const rec = await this.signTemplateRepository.findOne({ where: { id } });
    if (!rec) throw new NotFoundException('签约模板不存在');
    return rec;
  }

  /** 新增签约模板，signTemplateId 重复时视为更新 */
  async upsert(data: Partial<SignTemplate> & { sign_template_id: string }): Promise<SignTemplate> {
    const exists = await this.signTemplateRepository.findOne({
      where: { sign_template_id: data.sign_template_id },
    });
    if (exists) {
      Object.assign(exists, data);
      exists.updated_at = new Date();
      return this.signTemplateRepository.save(exists);
    }
    return this.signTemplateRepository.save(this.signTemplateRepository.create(data));
  }

  /** 更新签名模板 */
  async update(id: string, data: Partial<SignTemplate>): Promise<SignTemplate> {
    const rec = await this.getById(id);
    Object.assign(rec, data);
    rec.updated_at = new Date();
    return this.signTemplateRepository.save(rec);
  }

  /** 删除签约模板（物理删除；列表不再展示） */
  async remove(id: string): Promise<void> {
    const rec = await this.getById(id);
    await this.signTemplateRepository.remove(rec);
  }
}