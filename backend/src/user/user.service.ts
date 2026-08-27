import { Injectable, BadRequestException } from '@nestjs/common';
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

  async findById(id: string, desensitize = true): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    // desensitize 为 false 时（管理端查看/编辑）返回真实手机号，仅移除密码，避免脱敏号被回填覆盖真实号码
    if (desensitize) return desensitizeUser(user);
    if (user) delete user.password;
    return user;
  }

  async findAll(orgId?: string, name?: string, phone?: string, role?: string, desensitize = true): Promise<{ data: User[]; total: number }> {
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

    // desensitize 为 false 时（管理端列表）返回真实手机号，仅移除密码，避免脱敏号被回填覆盖真实号码
    if (!desensitize) {
      data.forEach(u => delete u.password);
      return { data, total };
    }
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

  async createOrganization(data: Partial<Organization>): Promise<Organization> {
    // 组织名称为必填字段，缺失时抛出异常（保留原有必填校验逻辑）
    if (!data.name) {
      throw new BadRequestException('组织名称不能为空');
    }
    const org = this.orgRepository.create(data);
    return this.orgRepository.save(org);
  }

  // 查询组织列表：keyword 模糊匹配组织名称或简称，status 精确筛选（如传值），按更新时间倒序排列
  async findOrganizations(keyword?: string, status?: string): Promise<Organization[]> {
    const queryBuilder = this.orgRepository.createQueryBuilder('org');
    if (keyword) {
      // keyword 模糊匹配组织名称或简称
      queryBuilder.andWhere('(org.name LIKE :keyword OR org.short_name LIKE :keyword)', { keyword: `%${keyword}%` });
    }
    if (status) {
      // status 精确筛选
      queryBuilder.andWhere('org.status = :status', { status });
    }
    // 按更新时间倒序排列
    queryBuilder.orderBy('org.updated_at', 'DESC');
    return queryBuilder.getMany();
  }

  // 更新组织信息：先执行更新，再查询返回更新后的组织
  async updateOrganization(id: string, data: Partial<Organization>): Promise<Organization> {
    await this.orgRepository.update(id, data);
    return this.orgRepository.findOne({ where: { id } });
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
