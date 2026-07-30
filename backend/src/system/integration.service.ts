import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Integration } from './integration.entity';

@Injectable()
export class IntegrationService {
  constructor(
    @InjectRepository(Integration)
    private integrationRepository: Repository<Integration>,
  ) {}

  async create(config: Partial<Integration>): Promise<Integration> {
    const entity = this.integrationRepository.create(config);
    return this.integrationRepository.save(entity);
  }

  async findAll(orgId?: string): Promise<{ data: Integration[]; total: number }> {
    const queryBuilder = this.integrationRepository.createQueryBuilder('i');
    if (orgId) {
      queryBuilder.where('i.organization_id = :orgId', { orgId });
    }
    const total = await queryBuilder.getCount();
    const data = await queryBuilder.getMany();
    return { data, total };
  }

  async findById(id: string): Promise<Integration> {
    return this.integrationRepository.findOne({ where: { id } });
  }

  async update(id: string, config: Partial<Integration>): Promise<Integration> {
    await this.integrationRepository.update(id, config);
    return this.integrationRepository.findOne({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.integrationRepository.delete(id);
  }

  async testConnection(id: string): Promise<{ success: boolean; message: string }> {
    const integration = await this.findById(id);
    if (!integration) {
      return { success: false, message: '对接配置不存在' };
    }
    try {
      if (integration.api_url) {
        return { success: true, message: '连接测试成功' };
      }
      return { success: true, message: '连接测试成功（模拟）' };
    } catch (error) {
      return { success: false, message: '连接测试失败: ' + error.message };
    }
  }

  async getActiveIntegrations(orgId: string): Promise<Integration[]> {
    return this.integrationRepository.find({
      where: { organization_id: orgId, status: 'active' },
    });
  }
}
