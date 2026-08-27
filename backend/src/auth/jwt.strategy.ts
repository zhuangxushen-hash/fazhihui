import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { ClientProfile } from '../client/client-profile.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
    // C 端客户档案：C 端登录身份以客户档案 id 作为 JWT sub，解析时兜底查询
    @InjectRepository(ClientProfile)
    private clientProfileRepository: Repository<ClientProfile>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // 优先按 users 表解析（管理端账号 / 已同步的 C 端账号）
    let user: any = await this.userService.findById(payload.sub);
    if (user) {
      return user;
    }
    // C 端客户档案身份：C 端登录以客户档案 id 作为 sub（与管理端账号切分）
    const profile = await this.clientProfileRepository.findOne({ where: { id: payload.sub } });
    if (profile) {
      return {
        id: profile.id,
        real_name: profile.name,
        phone: profile.phone,
        role: payload.role || 'client',
        organization_id: profile.organization_id,
        status: true,
      };
    }
    return null;
  }
}
