import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { InternalProject } from './internal-project.entity';

@Injectable()
export class InternalProjectService {
  constructor(
    @InjectRepository(InternalProject)
    private readonly projectRepository: Repository<InternalProject>,
  ) {}

  // 创建内部项目
  async create(data: Partial<InternalProject>): Promise<InternalProject> {
    const project = this.projectRepository.create(data);
    return this.projectRepository.save(project);
  }

  // 分页查询内部项目列表，支持 name/status/type 筛选
  async findList(params: {
    organization_id: string;
    page?: number;
    pageSize?: number;
    name?: string;
    status?: string;
    type?: string;
  }): Promise<{ list: InternalProject[]; total: number; page: number; pageSize: number }> {
    const page = Number(params.page) > 0 ? Number(params.page) : 1;
    const pageSize = Number(params.pageSize) > 0 ? Number(params.pageSize) : 10;
    const where: any = {};
    if (params.organization_id) {
      where.organization_id = params.organization_id;
    }
    if (params.name) {
      where.name = Like(`%${params.name}%`);
    }
    if (params.status) {
      where.status = params.status;
    }
    if (params.type) {
      where.type = params.type;
    }
    const [list, total] = await this.projectRepository.findAndCount({
      where,
      order: { updated_at: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { list, total, page, pageSize };
  }

  // 查询单条内部项目
  async findOne(id: string): Promise<InternalProject> {
    return this.projectRepository.findOne({ where: { id } });
  }

  // 更新内部项目
  async update(id: string, data: Partial<InternalProject>): Promise<InternalProject> {
    await this.projectRepository.update(id, data);
    return this.projectRepository.findOne({ where: { id } });
  }

  // 删除内部项目
  async remove(id: string): Promise<void> {
    await this.projectRepository.delete(id);
  }
}
