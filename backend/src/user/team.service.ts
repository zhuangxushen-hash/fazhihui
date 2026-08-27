import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './team.entity';

/**
 * 团队信息维护服务（组织 → 团队）
 * 管理组织下的团队，支持按组织过滤、启停、增删改。
 */
@Injectable()
export class TeamService {
  constructor(
    @InjectRepository(Team)
    private teamRepository: Repository<Team>,
  ) {}

  /** 查询团队列表（可按组织/状态过滤，按更新时间倒序） */
  async list(params: { organizationId?: string; keyword?: string; status?: string } = {}): Promise<Team[]> {
    const queryBuilder = this.teamRepository.createQueryBuilder('team');
    if (params.organizationId) {
      queryBuilder.andWhere('team.organization_id = :organizationId', { organizationId: params.organizationId });
    }
    if (params.keyword) {
      queryBuilder.andWhere('team.name LIKE :keyword', { keyword: `%${params.keyword}%` });
    }
    if (params.status) {
      queryBuilder.andWhere('team.status = :status', { status: params.status });
    }
    queryBuilder.orderBy('team.updated_at', 'DESC');
    return queryBuilder.getMany();
  }

  /** 查询团队详情 */
  async getById(id: string): Promise<Team> {
    const rec = await this.teamRepository.findOne({ where: { id } });
    if (!rec) throw new NotFoundException('团队不存在');
    return rec;
  }

  /** 新增团队 */
  async create(data: Partial<Team>): Promise<Team> {
    if (!data.name) {
      throw new BadRequestException('团队名称不能为空');
    }
    const rec = this.teamRepository.create(data);
    return this.teamRepository.save(rec);
  }

  /** 更新团队 */
  async update(id: string, data: Partial<Team>): Promise<Team> {
    await this.getById(id);
    await this.teamRepository.update(id, data);
    return this.getById(id);
  }

  /** 删除团队（物理删除；列表不再展示） */
  async remove(id: string): Promise<void> {
    await this.getById(id);
    await this.teamRepository.delete(id);
  }
}