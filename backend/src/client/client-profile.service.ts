import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProfile } from './client-profile.entity';
import { Case } from '../case/case.entity';
import { Lead } from '../lead/lead.entity';

@Injectable()
export class ClientProfileService {
  constructor(
    @InjectRepository(ClientProfile)
    private clientProfileRepository: Repository<ClientProfile>,
    // 注入案件实体仓库，用于按客户名称关联查询案件
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    // 注入线索实体仓库，用于按电话关联查询线索
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
  ) {}

  // 查询客户列表（支持按名称/电话关键字搜索，支持超过X天未联系智能筛选）
  async findAll(organizationId: string, keyword?: string, daysNoContact?: number): Promise<ClientProfile[]> {
    const qb = this.clientProfileRepository
      .createQueryBuilder('c')
      .where('c.organization_id = :orgId', { orgId: organizationId });

    if (keyword) {
      qb.andWhere('(c.name LIKE :kw OR c.phone LIKE :kw)', { kw: `%${keyword}%` });
    }
    // 智能筛选：超过X天未联系（updated_at 早于阈值）
    if (daysNoContact) {
      const threshold = new Date(Date.now() - daysNoContact * 24 * 60 * 60 * 1000);
      qb.andWhere('c.updated_at < :threshold', { threshold });
    }

    qb.orderBy('c.updated_at', 'DESC');
    return qb.getMany();
  }

  // 查询单个客户
  async findOne(id: string): Promise<ClientProfile> {
    const client = await this.clientProfileRepository.findOne({ where: { id } });
    if (!client) {
      throw new NotFoundException('客户不存在');
    }
    return client;
  }

  // 创建客户
  async create(data: Partial<ClientProfile>, organizationId: string): Promise<ClientProfile> {
    const client = this.clientProfileRepository.create({
      ...data,
      organization_id: organizationId,
    });
    return this.clientProfileRepository.save(client);
  }

  // 更新客户
  async update(id: string, data: Partial<ClientProfile>): Promise<ClientProfile> {
    const client = await this.clientProfileRepository.findOne({ where: { id } });
    if (!client) {
      throw new NotFoundException('客户不存在');
    }
    await this.clientProfileRepository.update(id, data);
    return this.clientProfileRepository.findOne({ where: { id } });
  }

  // 删除客户
  async remove(id: string): Promise<void> {
    const client = await this.clientProfileRepository.findOne({ where: { id } });
    if (!client) {
      throw new NotFoundException('客户不存在');
    }
    await this.clientProfileRepository.softDelete(id);
  }

  // 通过 client_name 关联查询案件列表（cases 表 where client_name LIKE）
  async getRelatedCases(clientName: string): Promise<Case[]> {
    if (!clientName) {
      return [];
    }
    return this.caseRepository
      .createQueryBuilder('c')
      .where('c.client_name LIKE :name', { name: `%${clientName}%` })
      .orderBy('c.updated_at', 'DESC')
      .getMany();
  }

  // 通过 phone 关联查询线索列表（leads 表 where phone LIKE）
  async getRelatedLeads(phone: string): Promise<Lead[]> {
    if (!phone) {
      return [];
    }
    return this.leadRepository
      .createQueryBuilder('l')
      .where('l.phone LIKE :phone', { phone: `%${phone}%` })
      .orderBy('l.updated_at', 'DESC')
      .getMany();
  }
}
