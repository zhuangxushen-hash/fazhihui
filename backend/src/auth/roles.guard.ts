import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ROLES_KEY } from './roles.decorator';
import { UserRole } from '../types';
import * as jwt from 'jsonwebtoken';

/**
 * JWT载荷接口
 */
interface JwtPayload {
  sub: string;
  phone?: string;
  role?: UserRole;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 读取方法上的角色元数据，如果未设置则允许所有角色通过
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    let user = request.user;
    // 全局守卫先于 controller 级别的 JwtAuthGuard 执行，
    // 此时 request.user 可能尚未被设置，需手动从 Authorization 头解析 JWT
    if (!user) {
      const authHeader = request.headers?.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const secret = this.configService.get('JWT_SECRET');
          const payload = jwt.verify(token, secret) as JwtPayload;
          // 直接从JWT载荷构造用户对象，无需查询数据库
          user = {
            id: payload.sub,
            role: payload.role,
            phone: payload.phone,
          };
          // 写回 request.user，供后续 JwtAuthGuard 及业务逻辑复用
          request.user = user;
        } catch {
          throw new UnauthorizedException('Token无效');
        }
      }
    }
    if (!user) {
      // 未提供有效凭证，属于未认证（401），而非无权限（403）
      throw new UnauthorizedException('未登录');
    }
    // super_admin 拥有所有接口访问权
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }
    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(`当前角色(${user.role})无权限访问此接口`);
    }
    return true;
  }
}
