import { Body, Controller, Delete, Get, Param, Put, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';
import { CaseStatusConfigService } from './case-status-config.service';
import { CaseStatusConfig } from './case-status-config.entity';

/**
 * 案件状态字典（组织级自定义）。
 * - 查询：B 端所有登录角色（案件管理列表/筛选用）
 * - 增删改：仅管理员
 * 首次查询时自动按系统默认状态播种。
 */
@Controller('case-statuses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CaseStatusConfigController {
  constructor(private readonly statusConfigService: CaseStatusConfigService) {}

  private orgOf(req: any): string {
    return req?.user?.organization_id || req?.user?.id;
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ORG_ADMIN,
    UserRole.SALES,
    UserRole.LAWYER,
    UserRole.ASSISTANT,
    UserRole.FINANCE,
  )
  async list(@Query('organization_id') organizationId: string, @Request() req: any): Promise<CaseStatusConfig[]> {
    const orgId = req?.user?.role === UserRole.SUPER_ADMIN
      ? organizationId || this.orgOf(req)
      : this.orgOf(req);
    return this.statusConfigService.list(orgId);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  async create(
    @Body() dto: { name: string; kind?: string; sort_order?: number; is_default?: boolean },
    @Request() req: any,
  ) {
    return this.statusConfigService.create(this.orgOf(req), dto);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() dto: { name?: string; kind?: string; sort_order?: number; enabled?: boolean; is_default?: boolean },
    @Request() req: any,
  ) {
    return this.statusConfigService.update(this.orgOf(req), id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.statusConfigService.remove(this.orgOf(req), id);
  }
}
