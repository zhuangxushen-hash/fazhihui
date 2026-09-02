import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CaseStatusConfig } from './case-status-config.entity';

// 系统默认案件状态（组织首次访问时播种，作为自定义起点）
export const DEFAULT_CASE_STATUSES: Array<{
  code: string;
  name: string;
  kind: string;
  sort_order: number;
  is_default?: boolean;
}> = [
  { code: 'pending_assign', name: '待分配', kind: 'neutral', sort_order: 10, is_default: true },
  { code: 'processing', name: '处理中', kind: 'blue', sort_order: 20 },
  { code: 'filing', name: '立案中', kind: 'blue', sort_order: 30 },
  { code: 'evidence', name: '取证中', kind: 'cyan', sort_order: 40 },
  { code: 'hearing', name: '庭审中', kind: 'orange', sort_order: 50 },
  { code: 'appeal', name: '上诉中', kind: 'geekblue', sort_order: 60 },
  { code: 'pending_close', name: '待结案', kind: 'orange', sort_order: 70 },
  { code: 'closed', name: '已结案', kind: 'green', sort_order: 80 },
  { code: 'terminated', name: '已解约', kind: 'orange', sort_order: 90 },
  { code: 'voided', name: '已作废', kind: 'red', sort_order: 100 },
];

@Injectable()
export class CaseStatusConfigService {
  constructor(
    @InjectRepository(CaseStatusConfig)
    private readonly statusRepository: Repository<CaseStatusConfig>,
  ) {}

  /** 生成状态码：随机码保证组织内唯一（名称可改，code 创建后不变） */
  private generateCode(): string {
    return 'st_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  /** 查询组织状态列表；首次访问（无任何配置）时按系统默认播种 */
  async list(orgId: string): Promise<CaseStatusConfig[]> {
    let rows = await this.statusRepository.find({
      where: { organization_id: orgId },
      order: { sort_order: 'ASC', created_at: 'ASC' },
    });
    if (!rows.length) {
      await this.statusRepository.save(
        DEFAULT_CASE_STATUSES.map((s) =>
          this.statusRepository.create({
            organization_id: orgId,
            code: s.code,
            name: s.name,
            kind: s.kind,
            sort_order: s.sort_order,
            is_default: !!s.is_default,
            enabled: true,
          }),
        ),
      );
      rows = await this.statusRepository.find({
        where: { organization_id: orgId },
        order: { sort_order: 'ASC', created_at: 'ASC' },
      });
    }
    return rows;
  }

  /** 新增自定义状态 */
  async create(orgId: string, dto: { name: string; kind?: string; sort_order?: number; is_default?: boolean }): Promise<CaseStatusConfig> {
    if (!dto || !dto.name || !dto.name.trim()) {
      throw new BadRequestException('状态名称不能为空');
    }
    const exists = await this.statusRepository.findOne({
      where: { organization_id: orgId, name: dto.name.trim() },
    });
    if (exists) throw new BadRequestException('状态名称已存在');
    const entity = this.statusRepository.create({
      organization_id: orgId,
      name: dto.name.trim(),
      code: this.generateCode(),
      kind: dto.kind || 'neutral',
      sort_order: dto.sort_order ?? 999,
      is_default: !!dto.is_default,
      enabled: true,
    });
    const saved = await this.statusRepository.save(entity);
    if (saved.is_default) await this.clearOtherDefaults(orgId, saved.id);
    return saved;
  }

  /** 更新状态（名称/配色/排序/启停/默认） */
  async update(orgId: string, id: string, dto: { name?: string; kind?: string; sort_order?: number; enabled?: boolean; is_default?: boolean }): Promise<CaseStatusConfig> {
    const entity = await this.statusRepository.findOne({ where: { id, organization_id: orgId } });
    if (!entity) throw new BadRequestException('状态不存在');
    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) throw new BadRequestException('状态名称不能为空');
      const dup = await this.statusRepository.findOne({ where: { organization_id: orgId, name } });
      if (dup && dup.id !== id) throw new BadRequestException('状态名称已存在');
      entity.name = name;
    }
    if (dto.kind !== undefined) entity.kind = dto.kind;
    if (dto.sort_order !== undefined) entity.sort_order = dto.sort_order;
    if (dto.enabled !== undefined) entity.enabled = dto.enabled;
    if (dto.is_default !== undefined) {
      entity.is_default = dto.is_default;
      if (entity.is_default) {
        entity.enabled = true;
        await this.clearOtherDefaults(orgId, id);
      }
    }
    return this.statusRepository.save(entity);
  }

  /** 删除状态（默认状态被删时自动将首个启用状态设为默认） */
  async remove(orgId: string, id: string): Promise<{ success: boolean }> {
    const entity = await this.statusRepository.findOne({ where: { id, organization_id: orgId } });
    if (!entity) throw new BadRequestException('状态不存在');
    await this.statusRepository.remove(entity);
    if (entity.is_default) {
      const rest = await this.statusRepository.find({
        where: { organization_id: orgId },
        order: { sort_order: 'ASC', created_at: 'ASC' },
      });
      const next = rest.find((r) => r.enabled);
      if (next) {
        next.is_default = true;
        await this.statusRepository.save(next);
      }
    }
    return { success: true };
  }

  private async clearOtherDefaults(orgId: string, keepId: string): Promise<void> {
    await this.statusRepository
      .createQueryBuilder()
      .update(CaseStatusConfig)
      .set({ is_default: false })
      .where('organization_id = :orgId AND id != :keepId', { orgId, keepId })
      .execute();
  }

  /** 生成案件时的默认状态码（供签约完成自动建案用） */
  async defaultStatusCode(orgId: string): Promise<string> {
    const rows = await this.statusRepository.find({
      where: { organization_id: orgId, enabled: true },
      order: { is_default: 'DESC', sort_order: 'ASC' },
    });
    if (!rows.length) return 'pending_assign';
    return (rows.find((r) => r.is_default) || rows[0]).code;
  }
}
