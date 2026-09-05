import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { UserService } from '../user/user.service';
import { User } from '../user/user.entity';
import { Organization } from '../user/organization.entity';
import { ClientProfile } from '../client/client-profile.entity';
import { UserRole } from '../types';

@Injectable()
export class AuthService {
  // 微信接口调用凭据缓存（access_token 有效期 7200s，提前 5 分钟刷新）
  private wxAccessTokenCache: { token: string; expiresAt: number } | null = null;

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    // C 端客户档案仓库：C 端账号以客户档案为准（与管理端账号切分）
    @InjectRepository(ClientProfile)
    private clientProfileRepository: Repository<ClientProfile>,
    // 组织仓库：微信授权自动建客户档案时需要归属组织
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>,
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
    // 测试环境万能验证码：非生产环境下 082906 可直接登录任一 C 端客户账号。
    // 仅跳过密码校验，身份仍须存在（C 端账号或客户档案）。
    // 生产环境（NODE_ENV=production）此逻辑不生效，代码同构部署安全。
    const testMasterCode = process.env.NODE_ENV !== 'production' && password === '082906';

    // 1. 优先匹配 C 端账号（users 表 role=client）
    const clientUser = await this.userService.findByPhone(phone);
    if (clientUser && clientUser.role === UserRole.CLIENT) {
      if (!clientUser.status) {
        throw new UnauthorizedException('账号已禁用');
      }
      if (!testMasterCode) {
        const user = await this.validateUser(phone, password);
        if (user.id !== clientUser.id) {
          throw new UnauthorizedException('密码错误');
        }
      }
      const payload = { sub: clientUser.id, phone: clientUser.phone, role: UserRole.CLIENT };
      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: clientUser.id,
          real_name: clientUser.real_name,
          phone: clientUser.phone,
          role: UserRole.CLIENT,
          organization_id: clientUser.organization_id,
        },
      };
    }
    // 2. 按客户档案登录（默认密码 = 身份证号后 8 位）
    const profile = await this.clientProfileRepository.findOne({ where: { phone } });
    if (!profile) {
      throw new UnauthorizedException('该手机号未开通 C 端账号，请联系客户管理员录入客户信息');
    }
    if (!testMasterCode) {
      if (!profile.id_card_no) {
        throw new UnauthorizedException('该手机号未开通 C 端账号，请联系客户管理员录入客户信息');
      }
      const defaultPassword = profile.id_card_no.slice(-8);
      if (password !== defaultPassword) {
        throw new UnauthorizedException('密码错误');
      }
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

  /**
   * 微信小程序手机号快捷登录（web-view 壳）：
   * 1. loginCode → auth.code2Session → openid（用户身份）；
   * 2. phoneCode → auth.getPhoneNumber → 手机号；
   * 3. 按手机号匹配 C 端身份（与 clientLogin 同一套账号体系）并签发 JWT；
   *    若手机号在 users(client) 与客户档案中均无匹配，则自动创建一条
   *    source=「微信小程序」的客户档案（客户增加的一种来源方式），使其成为 C 端客户。
   * phoneCode / loginCode 均为 5 分钟内有效的一次性凭证。
   */
  async wxPhoneLogin(phoneCode: string, loginCode: string) {
    if (!phoneCode || !loginCode) {
      throw new UnauthorizedException('缺少微信授权参数');
    }
    const appid = this.configService.get<string>('WX_MINI_APPID');
    const secret = this.configService.get<string>('WX_MINI_SECRET');
    if (!appid || !secret) {
      throw new UnauthorizedException('小程序登录未配置，请联系管理员');
    }

    // 1. loginCode 换 openid（身份）
    let openid: string;
    try {
      const { data: session } = await axios.get(
        'https://api.weixin.qq.com/sns/jscode2session',
        { params: { appid, secret, js_code: loginCode, grant_type: 'authorization_code' } },
      );
      if (!session.openid) {
        throw new UnauthorizedException(
          `微信登录态校验失败：${session.errcode || ''} ${session.errmsg || ''}`.trim(),
        );
      }
      openid = session.openid;
    } catch (e) {
      if (e instanceof UnauthorizedException) throw e;
      throw new UnauthorizedException('微信登录服务暂不可用，请稍后重试');
    }

    // 2. phoneCode 换手机号
    let phone: string;
    try {
      const accessToken = await this.getWxAccessToken();
      const { data: phoneRes } = await axios.post(
        `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${accessToken}`,
        { code: phoneCode },
      );
      if (phoneRes.errcode !== 0 || !phoneRes.phone_info?.phoneNumber) {
        throw new UnauthorizedException(
          `获取手机号失败：${phoneRes.errcode || ''} ${phoneRes.errmsg || ''}`.trim(),
        );
      }
      phone = phoneRes.phone_info.purePhoneNumber || phoneRes.phone_info.phoneNumber;
    } catch (e) {
      if (e instanceof UnauthorizedException) throw e;
      throw new UnauthorizedException('获取手机号服务暂不可用，请稍后重试');
    }

    // 3. 按 C 端账号体系签发 token（与 clientLogin 同构：手机号即身份，微信侧已完成实名手机号验证）
    const clientUser = await this.userService.findByPhone(phone);
    if (clientUser && clientUser.role === UserRole.CLIENT) {
      if (!clientUser.status) {
        throw new UnauthorizedException('账号已禁用');
      }
      const payload = { sub: clientUser.id, phone: clientUser.phone, role: UserRole.CLIENT };
      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: clientUser.id,
          real_name: clientUser.real_name,
          phone: clientUser.phone,
          role: UserRole.CLIENT,
          organization_id: clientUser.organization_id,
          // 小程序身份标识，供 H5 端关联用户
          wx_openid: openid,
        },
      };
    }
    let profile = await this.clientProfileRepository.findOne({ where: { phone } });
    if (!profile) {
      // 微信授权即注册：自动生成一条「微信小程序」来源的客户档案，
      // 使其成为 C 端客户（客户增加的一种来源方式），并可直接作为 C 端身份登录。
      const organizationId = await this.resolveDefaultOrganizationId();
      profile = this.clientProfileRepository.create({
        name: `微信用户${phone.slice(-4)}`,
        phone,
        type: 'individual',
        source: '微信小程序',
        contact_name: phone,
        organization_id: organizationId,
      });
      profile = await this.clientProfileRepository.save(profile);
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
        wx_openid: openid,
      },
    };
  }

  /**
   * 解析微信授权自动建客户档案时的默认归属组织：
   * 优先取种子创建的「法智汇律所」，否则取库中第一个组织；
   * 两者皆无则明确报错，避免写出 organization_id 为空的脏数据。
   */
  private async resolveDefaultOrganizationId(): Promise<string> {
    const named = await this.orgRepository.findOne({ where: { name: '法智汇律所' } });
    if (named) return named.id;
    const first = await this.orgRepository.find({ take: 1 });
    if (first && first.length) return first[0].id;
    throw new UnauthorizedException('系统未配置默认组织，无法创建客户档案，请联系管理员');
  }

  /**
   * 获取微信接口调用凭据（小程序 access_token），带内存缓存。
   * 注意：多实例部署时建议改为集中缓存（Redis），避免并发刷新导致互相失效。
   */
  private async getWxAccessToken(): Promise<string> {
    if (this.wxAccessTokenCache && Date.now() < this.wxAccessTokenCache.expiresAt) {
      return this.wxAccessTokenCache.token;
    }
    const appid = this.configService.get<string>('WX_MINI_APPID');
    const secret = this.configService.get<string>('WX_MINI_SECRET');
    const { data } = await axios.get('https://api.weixin.qq.com/cgi-bin/token', {
      params: { grant_type: 'client_credential', appid, secret },
    });
    if (!data.access_token) {
      throw new UnauthorizedException(
        `获取微信凭据失败：${data.errcode || ''} ${data.errmsg || ''}`.trim(),
      );
    }
    this.wxAccessTokenCache = {
      token: data.access_token,
      // 提前 5 分钟过期，规避边界失效
      expiresAt: Date.now() + ((data.expires_in || 7200) - 300) * 1000,
    };
    return this.wxAccessTokenCache.token;
  }
}
