import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

/**
 * 审计日志查询控制器
 * 权限：仅管理员(super_admin, org_admin) 可查询审计日志
 */
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  // 查询审计日志列表，支持按用户、操作类型、资源类型、时间范围筛选
  @Get()
  async findAll(
    @Query('user_id') userId: string,
    @Query('action') action: string,
    @Query('resource_type') resourceType: string,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.auditService.findAll({
      user_id: userId,
      action,
      resource_type: resourceType,
      start_date: startDate,
      end_date: endDate,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }
}
