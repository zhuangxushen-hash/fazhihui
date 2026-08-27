import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { User } from '../user/user.entity';
import { ClientProfile } from '../client/client-profile.entity';
import { UserRole } from '../types';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    // C 端客户档案仓库：C 端账号以客户档案为准（与管理端账号切分）
    @InjectRepository(ClientProfile)
    private clientProfileRepository: Repository<ClientProfile>,
  ) {}

  async validateUser(phone: string, password: string): Promise<User> {
    const user = await this.userService.findByPhone(phone);
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    if (!user.status) {
      throw new UnauthorizedException('账号已禁用');
    }
    if (!user.password) {
      throw new UnauthorizedException('用户未设置密码');
    }
    const isValid = await this.userService.validatePassword(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('密码错误');
    }
    return user;
  }

  async login(phone: string, password: string) {
    const user = await this.validateUser(phone, password);
    const payload = { sub: user.id, phone: user.phone, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        real_name: user.real_name,
        phone: user.phone,
        role: user.role,
        organization_id: user.organization_id,
      },
    };
  }

  /**
   * C 端客户登录（与管理端账号切分）：
   * 1. 优先校验 users 表中 role=client 的账号（支持客户修改过的密码）；
   * 2. 否则按客户档案登录：手机号 + 身份证号后 8 位（默认密码）。
   *    支持手机号被管理端账号占用、但同时在客户管理中录入了同手机号客户的情形
   *    （C 端身份以客户档案为准，不影响管理端账号）。
   */
  async clientLogin(phone: string, password: string) {
    // 1. 优先匹配 C 端账号（users 表 role=client）
    const clientUser = await this.userService.findByPhone(phone);
    if (clientUser && clientUser.role === UserRole.CLIENT) {
      const user = await this.validateUser(phone, password);
      const payload = { sub: user.id, phone: user.phone, role: UserRole.CLIENT };
      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: user.id,
          real_name: user.real_name,
          phone: user.phone,
          role: UserRole.CLIENT,
          organization_id: user.organization_id,
        },
      };
    }
    // 2. 按客户档案登录（默认密码 = 身份证号后 8 位）
    const profile = await this.clientProfileRepository.findOne({ where: { phone } });
    if (!profile || !profile.id_card_no) {
      throw new UnauthorizedException('该手机号未开通 C 端账号，请联系客户管理员录入客户信息');
    }
    const defaultPassword = profile.id_card_no.slice(-8);
    if (password !== defaultPassword) {
      throw new UnauthorizedException('密码错误');
    }
    const payload = { sub: profile.id, phone: profile.phone, role: UserRole.CLIENT };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: profile.id,
        real_name: profile.name,
        phone: profile.phone,
        role: UserRole.CLIENT,
        organization_id: profile.organization_id,
      },
    };
  }

  async verifyToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.userService.findById(payload.sub);
      return user;
    } catch {
      throw new UnauthorizedException('Token无效');
    }
  }
}
