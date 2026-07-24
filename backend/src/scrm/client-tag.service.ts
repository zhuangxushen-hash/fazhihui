import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ClientTag } from './client-tag.entity';
import { ClientTagRelation } from './client-tag-relation.entity';

@Injectable()
export class ClientTagService {
  constructor(
    @InjectRepository(ClientTag)
    private clientTagRepository: Repository<ClientTag>,
    @InjectRepository(ClientTagRelation)
    private clientTagRelationRepository: Repository<ClientTagRelation>,
  ) {}

  // ============ 标签 CRUD ============

  async createTag(data: Partial<ClientTag>): Promise<ClientTag> {
    if (data.rule_config && typeof data.rule_config !== 'string') {
      data.rule_config = JSON.stringify(data.rule_config);
    }
    const entity = this.clientTagRepository.create(data);
    return this.clientTagRepository.save(entity);
  }

  async findAllTags(orgId?: string, filters?: {
    tag_type?: string;
    category?: string;
  }): Promise<ClientTag[]> {
    const where: any = {};
    if (orgId) where.organization_id = orgId;
    if (filters?.tag_type) where.tag_type = filters.tag_type;
    if (filters?.category) where.category = filters.category;
    return this.clientTagRepository.find({ where, order: { created_at: 'DESC' } });
  }

  async findTagById(id: string): Promise<ClientTag> {
    const tag = await this.clientTagRepository.findOne({ where: { id } });
    if (!tag) {
      throw new NotFoundException('标签不存在');
    }
    return tag;
  }

  async updateTag(id: string, data: Partial<ClientTag>): Promise<ClientTag> {
    if (data.rule_config && typeof data.rule_config !== 'string') {
      data.rule_config = JSON.stringify(data.rule_config);
    }
    await this.clientTagRepository.update(id, data);
    return this.findTagById(id);
  }

  async deleteTag(id: string): Promise<void> {
    // 删除标签的同时删除关联关系
    await this.clientTagRelationRepository.delete({ tag_id: id });
    const result = await this.clientTagRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('标签不存在');
    }
  }

  // ============ 标签关系 ============

  /**
   * 给客户打单个标签
   */
  async tagClient(data: {
    client_id: string;
    tag_id: string;
    tagged_by?: string;
    organization_id?: string;
  }): Promise<ClientTagRelation> {
    // 防重复
    const existing = await this.clientTagRelationRepository.findOne({
      where: { client_id: data.client_id, tag_id: data.tag_id },
    });
    if (existing) {
      return existing;
    }
    const relation = this.clientTagRelationRepository.create({
      client_id: data.client_id,
      tag_id: data.tag_id,
      tagged_by: data.tagged_by || 'auto',
      organization_id: data.organization_id,
    });
    return this.clientTagRelationRepository.save(relation);
  }

  /**
   * 批量打标
   */
  async batchTagClients(data: {
    client_ids: string[];
    tag_id: string;
    tagged_by?: string;
    organization_id?: string;
  }): Promise<{ success_count: number }> {
    let success = 0;
    for (const clientId of data.client_ids) {
      const existing = await this.clientTagRelationRepository.findOne({
        where: { client_id: clientId, tag_id: data.tag_id },
      });
      if (!existing) {
        const relation = this.clientTagRelationRepository.create({
          client_id: clientId,
          tag_id: data.tag_id,
          tagged_by: data.tagged_by || 'auto',
          organization_id: data.organization_id,
        });
        await this.clientTagRelationRepository.save(relation);
        success += 1;
      }
    }
    return { success_count: success };
  }

  /**
   * 移除客户标签
   */
  async untagClient(clientId: string, tagId: string): Promise<void> {
    await this.clientTagRelationRepository.delete({
      client_id: clientId,
      tag_id: tagId,
    });
  }

  /**
   * 查询客户的全部标签
   */
  async getClientTags(clientId: string): Promise<ClientTag[]> {
    const relations = await this.clientTagRelationRepository.find({
      where: { client_id: clientId },
    });
    if (relations.length === 0) return [];
    const tagIds = relations.map(r => r.tag_id);
    return this.clientTagRepository.find({ where: { id: In(tagIds) } });
  }

  /**
   * 查询某标签下的全部客户ID
   */
  async getClientsByTag(tagId: string): Promise<string[]> {
    const relations = await this.clientTagRelationRepository.find({
      where: { tag_id: tagId },
    });
    return relations.map(r => r.client_id);
  }

  // ============ 自动打标逻辑 ============

  /**
   * 自动打标: 根据客户上下文匹配自动标签
   * 支持触发条件: source_channel / case_type / intention_level / follow_stage
   */
  async autoTagClient(clientId: string, context: {
    source_channel?: string;
    case_type?: string;
    intention_level?: string;
    follow_stage?: string;
    organization_id?: string;
  }): Promise<{ matched_count: number; matched_tags: ClientTag[] }> {
    const autoTags = await this.clientTagRepository.find({
      where: { tag_type: 'auto', organization_id: context.organization_id as any },
    });

    const matchedTags: ClientTag[] = [];
    for (const tag of autoTags) {
      if (!tag.rule_config) continue;
      try {
        const rule: any = JSON.parse(tag.rule_config);
        const trigger = rule.trigger;
        const value = rule.value;
        let isMatch = false;
        switch (trigger) {
          case 'source_channel':
            isMatch = context.source_channel === value;
            break;
          case 'case_type':
            isMatch = context.case_type === value;
            break;
          case 'intention_level':
            isMatch = context.intention_level === value;
            break;
          case 'follow_stage':
            isMatch = context.follow_stage === value;
            break;
        }
        if (isMatch) {
          matchedTags.push(tag);
          await this.tagClient({
            client_id: clientId,
            tag_id: tag.id,
            tagged_by: 'auto',
            organization_id: context.organization_id,
          });
        }
      } catch {
        // 忽略解析错误
      }
    }
    return { matched_count: matchedTags.length, matched_tags: matchedTags };
  }
}
