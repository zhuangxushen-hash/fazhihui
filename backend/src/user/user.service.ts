import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import { desensitizeUser } from '../utils/desensitize';

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
      user.password = await bcrypt.hash(user.password, parseInt(process.env.BCRYPT_ROUNDS || '10'));
    }
    return this.userRepository.save(user);
  }

  async findByPhone(phone: string): Promise<User> {
    return this.userRepository.findOne({ where: { phone } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    return desensitizeUser(user);
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

    return { data: data.map(user => desensitizeUser(user)), total };
  }

  async update(id: string, updateUserDto: Partial<CreateUserDto>): Promise<User> {
    await this.userRepository.update(id, updateUserDto);
    return this.userRepository.findOne({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  async resetPassword(id: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || '10'));
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

  // 根据经验值计算等级（每1000经验升1级，最低Lv1）
  private calculateLevel(experience: number): number {
    return Math.max(1, Math.floor(experience / 1000) + 1);
  }

  // 增加经验值，自动升级等级
  async addExperience(userId: string, amount: number, reason?: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return null;
    }
    const newExperience = (user.experience || 0) + amount;
    const newLevel = this.calculateLevel(newExperience);
    await this.userRepository.update(userId, {
      experience: newExperience,
      level: newLevel,
    });
    return this.userRepository.findOne({ where: { id: userId } });
  }

  // 获取用户经验值/等级信息
  async getLevelInfo(userId: string): Promise<{ experience: number; level: number; nextLevelExperience: number; progress: number }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return null;
    }
    const experience = user.experience || 0;
    const level = user.level || 1;
    const currentLevelBaseExp = (level - 1) * 1000;
    const nextLevelBaseExp = level * 1000;
    const nextLevelExperience = nextLevelBaseExp - experience;
    const progress = ((experience - currentLevelBaseExp) / 1000) * 100;
    return {
      experience,
      level,
      nextLevelExperience,
      progress: Math.max(0, Math.min(100, progress)),
    };
  }
}
