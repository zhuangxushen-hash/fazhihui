import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LegalDocument } from './legal-document.entity';

@Injectable()
export class LegalDocumentService {
  constructor(
    @InjectRepository(LegalDocument)
    private legalDocumentRepository: Repository<LegalDocument>,
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
}