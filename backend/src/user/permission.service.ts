import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './permission.entity';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) {}

  async create(permissionData: Partial<Permission>): Promise<Permission> {
    const permission = this.permissionRepository.create(permissionData);
    return this.permissionRepository.save(permission);
  }

  async findAll(module?: string): Promise<Permission[]> {
    const query = this.permissionRepository.createQueryBuilder('permission');
    if (module) {
      query.andWhere('permission.module = :module', { module });
    }
    query.orderBy('permission.sort_order', 'ASC');
    return query.getMany();
  }

  async findById(id: string): Promise<Permission> {
    return this.permissionRepository.findOne({ where: { id } });
  }

  async findByCodes(codes: string[]): Promise<Permission[]> {
    return this.permissionRepository
      .createQueryBuilder('permission')
      .where('permission.code IN (:...codes)', { codes })
      .getMany();
  }

  async update(id: string, permissionData: Partial<Permission>): Promise<Permission> {
    await this.permissionRepository.update(id, permissionData);
    return this.permissionRepository.findOne({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.permissionRepository.delete(id);
  }

  async toggleStatus(id: string): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({ where: { id } });
    permission.status = !permission.status;
    return this.permissionRepository.save(permission);
  }

  async getModules(): Promise<string[]> {
    const result = await this.permissionRepository
      .createQueryBuilder('permission')
      .select('DISTINCT permission.module', 'module')
      .where('permission.module IS NOT NULL')
      .getRawMany();
    return result.map(r => r.module);
  }
}
