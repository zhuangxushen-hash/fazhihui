import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './role.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async create(roleData: Partial<Role>): Promise<Role> {
    const role = this.roleRepository.create(roleData);
    return this.roleRepository.save(role);
  }

  async findAll(orgId: string): Promise<Role[]> {
    return this.roleRepository.find({
      where: { organization_id: orgId },
      order: { created_at: 'DESC' },
    });
  }

  async findById(id: string): Promise<Role> {
    return this.roleRepository.findOne({ where: { id } });
  }

  async update(id: string, roleData: Partial<Role>): Promise<Role> {
    await this.roleRepository.update(id, roleData);
    return this.roleRepository.findOne({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.roleRepository.delete(id);
  }

  async toggleStatus(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({ where: { id } });
    role.status = !role.status;
    return this.roleRepository.save(role);
  }
}
