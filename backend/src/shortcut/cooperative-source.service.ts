import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { CooperativeSource, COOPERATION_STATUS } from './cooperative-source.entity';

@Injectable()
export class CooperativeSourceService {
  constructor(
    @InjectRepository(CooperativeSource)
    private readonly sourceRepository: Repository<CooperativeSource>,
  ) {}

  // 生成案源编号：SRC-YYYYMMDD-序号
  private async genSourceNo(orgId: string): Promise<string> {
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const prefix = `SRC-${dateStr}-`;
    const count = await this.sourceRepository
      .createQueryBuilder('s')
      .where('s.organization_id = :orgId', { orgId })
      .andWhere('s.source_no LIKE :prefix', { prefix: `${prefix}%` })
      .getCount();
    return `${prefix}${String(count + 1).padStart(3, '0')}`;
  }

  // 查询列表（keyword/cooperation_type/status 筛选）
  async findList(params: {
    organization_id: string;
    keyword?: string;
    cooperation_type?: string;
    status?: string;
  }): Promise<{ data: CooperativeSource[]; total: number }> {
    const qb = this.sourceRepository.createQueryBuilder('s');
    qb.where('s.organization_id = :orgId', { orgId: params.organization_id });
    if (params.keyword) {
      qb.andWhere('(s.source_name LIKE :kw OR s.partner_name LIKE :kw OR s.source_no LIKE :kw)', {
        kw: `%${params.keyword}%`,
      });
    }
    if (params.cooperation_type) {
      qb.andWhere('s.cooperation_type = :ct', { ct: params.cooperation_type });
    }
    if (params.status) {
      qb.andWhere('s.status = :st', { st: params.status });
    }
    qb.orderBy('s.updated_at', 'DESC');
    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  // 统计汇总
  async getStats(organizationId: string): Promise<{
    total: number;
    processing: number;
    converted: number;
  }> {
    const qb = this.sourceRepository
      .createQueryBuilder('s')
      .where('s.organization_id = :orgId', { orgId: organizationId });
    const total = await qb.getCount();
    const processing = await qb
      .andWhere('s.status = :st', { st: COOPERATION_STATUS.PROCESSING })
      .getCount();
    const converted = await qb
      .andWhere('s.status = :st2', { st2: COOPERATION_STATUS.CONVERTED })
      .getCount();
    return { total, processing, converted };
  }

  // 创建案源
  async create(data: Partial<CooperativeSource>, userId: string): Promise<CooperativeSource> {
    if (!data.source_name || !data.partner_name) {
      throw new BadRequestException('案源名称与协作方为必填项');
    }
    const sourceNo = await this.genSourceNo(data.organization_id);
    const record = this.sourceRepository.create({
      ...data,
      source_no: sourceNo,
      status: data.status || COOPERATION_STATUS.PENDING,
      created_by: userId,
    });
    return this.sourceRepository.save(record);
  }

  // 更新状态
  async updateStatus(id: string, status: string): Promise<CooperativeSource> {
    if (!Object.values(COOPERATION_STATUS).includes(status as (typeof COOPERATION_STATUS)[keyof typeof COOPERATION_STATUS])) {
      throw new BadRequestException('无效的协作状态');
    }
    await this.sourceRepository.update(id, { status });
    return this.findOne(id);
  }

  // 结案
  async close(id: string, closeReason?: string): Promise<CooperativeSource> {
    await this.sourceRepository.update(id, {
      status: COOPERATION_STATUS.CLOSED,
      close_reason: closeReason || null,
    });
    return this.findOne(id);
  }

  // 查询单条
  async findOne(id: string): Promise<CooperativeSource> {
    const record = await this.sourceRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException('协作案源不存在');
    }
    return record;
  }
}
