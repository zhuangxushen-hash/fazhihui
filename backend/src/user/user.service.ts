import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    if (user.password) {
      user.password = await bcrypt.hash(user.password, parseInt(process.env.BCRYPT_ROUNDS));
    }
    return this.userRepository.save(user);
  }

  async findByPhone(phone: string): Promise<User> {
    return this.userRepository.findOne({ where: { phone } });
  }

  async findById(id: string): Promise<User> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findAll(orgId?: string, name?: string, phone?: string, role?: string): Promise<{ data: User[]; total: number }> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    
    if (orgId) {
      queryBuilder.where('user.organization_id = :orgId', { orgId });
    }
    if (name) {
      queryBuilder.andWhere('user.real_name LIKE :name', { name: `%${name}%` });
    }
    if (phone) {
      queryBuilder.andWhere('user.phone LIKE :phone', { phone: `%${phone}%` });
    }
    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    const total = await queryBuilder.getCount();
    const data = await queryBuilder.getMany();
    
    return { data, total };
  }

  async update(id: string, updateUserDto: Partial<CreateUserDto>): Promise<User> {
    await this.userRepository.update(id, updateUserDto);
    return this.userRepository.findOne({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  async resetPassword(id: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS));
    await this.userRepository.update(id, { password: hashedPassword });
    return this.userRepository.findOne({ where: { id } });
  }

  async createOrganization(name: string): Promise<Organization> {
    const org = this.orgRepository.create({ name });
    return this.orgRepository.save(org);
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
