import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrandConfig } from './brand-config.entity';

@Injectable()
export class BrandConfigService {
  constructor(
    @InjectRepository(BrandConfig)
    private brandConfigRepository: Repository<BrandConfig>,
  ) {}

  async create(config: Partial<BrandConfig>): Promise<BrandConfig> {
    const entity = this.brandConfigRepository.create(config);
    return this.brandConfigRepository.save(entity);
  }

  async findAll(orgId?: string): Promise<{ data: BrandConfig[]; total: number }> {
    const queryBuilder = this.brandConfigRepository.createQueryBuilder('bc');
    if (orgId) {
      queryBuilder.where('bc.organization_id = :orgId', { orgId });
    }
    const total = await queryBuilder.getCount();
    const data = await queryBuilder.getMany();
    return { data, total };
  }

  async findById(id: string): Promise<BrandConfig> {
    return this.brandConfigRepository.findOne({ where: { id } });
  }

  async update(id: string, config: Partial<BrandConfig>): Promise<BrandConfig> {
    await this.brandConfigRepository.update(id, config);
    return this.brandConfigRepository.findOne({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.brandConfigRepository.delete(id);
  }

  async getActiveBrandConfig(orgId: string): Promise<BrandConfig> {
    return this.brandConfigRepository.findOne({
      where: { organization_id: orgId, status: 'active' },
    });
  }

  async updateTheme(orgId: string, colors: { primary_color?: string; secondary_color?: string; theme_type?: string }): Promise<BrandConfig> {
    const config = await this.getActiveBrandConfig(orgId);
    if (config) {
      return this.update(config.id, colors as Partial<BrandConfig>);
    }
    return this.create({
      brand_name: 'Default',
      organization_id: orgId,
      status: 'active',
      theme_type: (colors.theme_type as any) || 'custom',
      primary_color: colors.primary_color,
      secondary_color: colors.secondary_color,
    });
  }
}
