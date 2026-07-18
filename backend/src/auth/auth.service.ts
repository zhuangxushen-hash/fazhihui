import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { User } from '../user/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
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
