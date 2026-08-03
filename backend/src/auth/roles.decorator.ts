import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../types';

export const ROLES_KEY = 'roles';
// 设置允许访问的角色列表
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
