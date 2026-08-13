import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DifficultCase } from './difficult-case.entity';

@Injectable()
export class DifficultCaseService {
  constructor(
    @InjectRepository(DifficultCase)
    private readonly caseRepository: Repository<DifficultCase>,
  ) {}

  // 生成案件编号：DC-YYYYMMDD-序号
  private async genCaseNo(orgId: string): Promise<string> {
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const prefix = `DC-${dateStr}-`;
    const count = await this.caseRepository
      .createQueryBuilder('c')
      .where('c.organization_id = :orgId', { orgId })
      .andWhere('c.case_no LIKE :prefix', { prefix: `${prefix}%` })
      .getCount();
    return `${prefix}${String(count + 1).padStart(3, '0')}`;
  }

  // 查询列表（keyword/case_type/difficulty_level 筛选）
  async findList(params: {
    organization_id: string;
    keyword?: string;
    case_type?: string;
    difficulty_level?: string;
  }): Promise<{ data: DifficultCase[]; total: number }> {
    const qb = this.caseRepository.createQueryBuilder('c');
    qb.where('c.organization_id = :orgId', { orgId: params.organization_id });
    if (params.keyword) {
      qb.andWhere('(c.case_name LIKE :kw OR c.case_no LIKE :kw OR c.main_lawyer LIKE :kw)', {
        kw: `%${params.keyword}%`,
      });
    }
    if (params.case_type) {
      qb.andWhere('c.case_type = :ct', { ct: params.case_type });
    }
    if (params.difficulty_level) {
      qb.andWhere('c.difficulty_level = :dl', { dl: params.difficulty_level });
    }
    qb.orderBy('c.updated_at', 'DESC');
    const [data, total] = await qb.getManyAndCount();
    // 解析 JSON 记录字段（转为对象供前端展示，不改变实体字段类型）
    data.forEach((c) => {
      (c as any).discussion_log = this.parseLog(c.discussion_log);
      (c as any).solution_log = this.parseLog(c.solution_log);
    });
    return { data, total };
  }

  // 统计汇总
  async getStats(organizationId: string): Promise<{
    total: number;
    discussing: number;
    solved: number;
  }> {
    const qb = this.caseRepository
      .createQueryBuilder('c')
      .where('c.organization_id = :orgId', { orgId: organizationId });
    const total = await qb.getCount();
    const discussing = await qb.andWhere('c.status = :st', { st: 'discussing' }).getCount();
    const solved = await qb.andWhere('c.status = :st2', { st2: 'solved' }).getCount();
    return { total, discussing, solved };
  }

  // 创建疑难案件
  async create(data: Partial<DifficultCase>, userId: string): Promise<DifficultCase> {
    if (!data.case_name) {
      throw new BadRequestException('案件名称为必填项');
    }
    const caseNo = await this.genCaseNo(data.organization_id);
    const record = this.caseRepository.create({
      ...data,
      case_no: caseNo,
      status: data.status || 'discussing',
      discussion_count: 0,
      solution_count: 0,
      discussion_log: JSON.stringify([]),
      solution_log: JSON.stringify([]),
      created_by: userId,
    });
    return this.caseRepository.save(record);
  }

  // 发起讨论
  async addDiscussion(id: string, userId: string, content: string): Promise<DifficultCase> {
    const record = await this.caseRepository.findOne({ where: { id } });
    if (!record) {
      throw new BadRequestException('案件不存在');
    }
    const logs = this.parseLog(record.discussion_log);
    logs.push({
      user_id: userId,
      content,
      created_at: new Date().toISOString(),
    });
    record.discussion_count = (record.discussion_count || 0) + 1;
    record.discussion_log = JSON.stringify(logs);
    return this.caseRepository.save(record);
  }

  // 添加解决方案
  async addSolution(id: string, userId: string, content: string): Promise<DifficultCase> {
    const record = await this.caseRepository.findOne({ where: { id } });
    if (!record) {
      throw new BadRequestException('案件不存在');
    }
    const logs = this.parseLog(record.solution_log);
    logs.push({
      user_id: userId,
      content,
      created_at: new Date().toISOString(),
    });
    record.solution_count = (record.solution_count || 0) + 1;
    record.solution_log = JSON.stringify(logs);
    return this.caseRepository.save(record);
  }

  // 更新案件（含解决状态）
  async update(id: string, data: Partial<DifficultCase>): Promise<DifficultCase> {
    await this.caseRepository.update(id, data);
    return this.caseRepository.findOne({ where: { id } });
  }

  // 删除案件
  async remove(id: string): Promise<void> {
    await this.caseRepository.delete(id);
  }

  // 解析 JSON 日志
  private parseLog(log: string): unknown[] {
    if (!log) return [];
    try {
      return JSON.parse(log);
    } catch {
      return [];
    }
  }
}
