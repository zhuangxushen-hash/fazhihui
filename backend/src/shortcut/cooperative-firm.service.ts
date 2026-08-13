import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { CooperativeFirm } from './cooperative-firm.entity';

@Injectable()
export class CooperativeFirmService {
  constructor(
    @InjectRepository(CooperativeFirm)
    private readonly firmRepository: Repository<CooperativeFirm>,
  ) {}

  // 生成律所编号：CF-YYYYMMDD-序号
  private async genFirmNo(orgId: string): Promise<string> {
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const prefix = `CF-${dateStr}-`;
    const count = await this.firmRepository
      .createQueryBuilder('f')
      .where('f.organization_id = :orgId', { orgId })
      .andWhere('f.firm_no LIKE :prefix', { prefix: `${prefix}%` })
      .getCount();
    return `${prefix}${String(count + 1).padStart(3, '0')}`;
  }

  // 查询列表（keyword/firm_type/status 筛选）
  async findList(params: {
    organization_id: string;
    keyword?: string;
    firm_type?: string;
    status?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ data: CooperativeFirm[]; total: number; page: number; page_size: number }> {
    const page = params.page > 0 ? params.page : 1;
    const pageSize = params.page_size > 0 ? params.page_size : 10;
    const where: Record<string, unknown> = { organization_id: params.organization_id };
    if (params.keyword) {
      (where as any).firm_name = Like(`%${params.keyword}%`);
    }
    if (params.firm_type) {
      where.firm_type = params.firm_type;
    }
    if (params.status) {
      where.status = params.status;
    }
    const [data, total] = await this.firmRepository.findAndCount({
      where,
      order: { updated_at: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { data, total, page, page_size: pageSize };
  }

  // 统计汇总
  async getStats(organizationId: string): Promise<{
    total: number;
    active: number;
    paused: number;
  }> {
    const qb = this.firmRepository
      .createQueryBuilder('f')
      .where('f.organization_id = :orgId', { orgId: organizationId });
    const total = await qb.getCount();
    const active = await qb.andWhere('f.status = :st', { st: 'active' }).getCount();
    const paused = await qb.andWhere('f.status = :st2', { st2: 'paused' }).getCount();
    return { total, active, paused };
  }

  // 创建协作律所
  async create(data: Partial<CooperativeFirm>): Promise<CooperativeFirm> {
    if (!data.firm_name) {
      throw new BadRequestException('律所名称为必填项');
    }
    const firmNo = await this.genFirmNo(data.organization_id);
    const record = this.firmRepository.create({
      ...data,
      firm_no: firmNo,
      status: data.status || 'active',
      rating: data.rating || 'B',
    });
    return this.firmRepository.save(record);
  }

  // 更新协作律所
  async update(id: string, data: Partial<CooperativeFirm>): Promise<CooperativeFirm> {
    await this.firmRepository.update(id, data);
    return this.firmRepository.findOne({ where: { id } });
  }

  // 删除协作律所
  async remove(id: string): Promise<void> {
    await this.firmRepository.delete(id);
  }
}
