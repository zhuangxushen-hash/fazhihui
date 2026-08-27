import { Controller, Post, Body, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuditService } from '../audit/audit.service';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private auditService: AuditService,
  ) {}

  // 登录接口限流：5次/60秒，防止暴力破解
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('login')
  async login(@Body() body: { phone: string; password: string }, @Req() req: Request) {
    const result = await this.authService.login(body.phone, body.password);
    // 记录登录审计日志
    await this.auditService.logAction({
      user_id: result.user?.id,
      user_name: result.user?.real_name,
      action: 'login',
      ip: req?.ip || (req?.connection as any)?.remoteAddress,
      detail: JSON.stringify({ phone: body.phone }),
    });
    return result;
  }

  // C 端客户登录（与登录接口共用限流，防止暴力破解）
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('client-login')
  async clientLogin(@Body() body: { phone: string; password: string }, @Req() req: Request) {
    const result = await this.authService.clientLogin(body.phone, body.password);
    // 记录登录审计日志
    await this.auditService.logAction({
      user_id: result.user?.id,
      user_name: result.user?.real_name,
      action: 'client-login',
      ip: req?.ip || (req?.connection as any)?.remoteAddress,
      detail: JSON.stringify({ phone: body.phone }),
    });
    return result;
  }

  @Post('verify')
  async verify(@Body() body: { token: string }) {
    return this.authService.verifyToken(body.token);
  }
}
