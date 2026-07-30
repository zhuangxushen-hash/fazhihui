import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeploymentConfig } from './deployment-config.entity';

@Injectable()
export class DeploymentConfigService {
  constructor(
    @InjectRepository(DeploymentConfig)
    private deploymentConfigRepository: Repository<DeploymentConfig>,
  ) {}

  async create(config: Partial<DeploymentConfig>): Promise<DeploymentConfig> {
    const entity = this.deploymentConfigRepository.create(config);
    return this.deploymentConfigRepository.save(entity);
  }

  async findAll(orgId?: string): Promise<{ data: DeploymentConfig[]; total: number }> {
    const queryBuilder = this.deploymentConfigRepository.createQueryBuilder('dc');
    if (orgId) {
      queryBuilder.where('dc.organization_id = :orgId', { orgId });
    }
    const total = await queryBuilder.getCount();
    const data = await queryBuilder.getMany();
    return { data, total };
  }

  async findById(id: string): Promise<DeploymentConfig> {
    return this.deploymentConfigRepository.findOne({ where: { id } });
  }

  async update(id: string, config: Partial<DeploymentConfig>): Promise<DeploymentConfig> {
    await this.deploymentConfigRepository.update(id, config);
    return this.deploymentConfigRepository.findOne({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.deploymentConfigRepository.delete(id);
  }

  async getActiveConfig(orgId: string): Promise<DeploymentConfig> {
    return this.deploymentConfigRepository.findOne({
      where: { organization_id: orgId, config_status: 'active' },
    });
  }
}
