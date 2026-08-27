import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { TeamService } from './team.service';
import { Team } from './team.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

/**
 * 团队维护控制器（组织 → 团队）
 * - 每个组织下可维护多个团队（增删改查、启停）
 * - 用户管理可给用户关联所属团队
 * 权限：仅管理员（super_admin, org_admin）可维护团队；团队列表按组织数据隔离。
 */
@Controller('teams')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  // 是否为超级管理员（超管可跨组织管理全部团队）
  private isSuper(user: any): boolean {
    return user?.role === UserRole.SUPER_ADMIN;
  }

  // 当前用户归属的组织
  private ownOrg(user: any): string {
    return user?.organization_id || user.id;
  }

  // 按组织隔离读取团队：非超管只能访问自己组织的团队（无归属的全局团队不可访问）
  private async resolveTeam(id: string, user: any): Promise<Team> {
    const rec = await this.teamService.getById(id);
    if (!this.isSuper(user) && rec.organization_id !== this.ownOrg(user)) {
      throw new ForbiddenException('无权访问该团队（按组织隔离，仅本组织团队可用）');
    }
    return rec;
  }

  // 团队列表（按组织数据隔离 + 关键字/状态筛选）
  @Get()
  async list(
    @Query() query: { organization_id?: string; keyword?: string; status?: string },
    @Request() req: any,
  ) {
    // 数据隔离：超管可见全部（可按 organization_id 过滤）；组织管理员只能看到本组织的团队
    let orgId: string | undefined;
    if (this.isSuper(req.user)) {
      orgId = query.organization_id || undefined;
    } else {
      orgId = this.ownOrg(req.user);
    }
    return this.teamService.list({ organizationId: orgId, keyword: query.keyword, status: query.status });
  }

  // 团队详情（按组织隔离）
  @Get(':id')
  async getById(@Param('id') id: string, @Request() req: any) {
    return this.resolveTeam(id, req.user);
  }

  // 新增团队（归属当前用户所属组织，超管可指定组织）
  @Post()
  async create(
    @Body() dto: { name: string; organization_id?: string; leader_id?: string; description?: string; status?: string },
    @Request() req: any,
  ) {
    // 数据隔离：组织管理员新增的团队归属自己的组织（忽略传入）；超管可指定组织或建全局团队
    const orgId = this.isSuper(req.user) ? (dto.organization_id || null) : this.ownOrg(req.user);
    return this.teamService.create({
      name: dto.name,
      organization_id: orgId,
      leader_id: dto.leader_id,
      description: dto.description,
      status: dto.status || 'active',
    });
  }

  // 更新团队（按组织隔离）
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: { name?: string; leader_id?: string; description?: string; status?: string; organization_id?: string },
    @Request() req: any,
  ) {
    await this.resolveTeam(id, req.user);
    // 组织归属仅在超管时可变更，组织管理员不可改（保持数据隔离）
    const data: Partial<Team> = {
      name: dto.name,
      leader_id: dto.leader_id,
      description: dto.description,
      status: dto.status,
    };
    if (this.isSuper(req.user) && dto.organization_id !== undefined) {
      data.organization_id = dto.organization_id || null;
    }
    return this.teamService.update(id, data);
  }

  // 删除团队（按组织隔离）
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.resolveTeam(id, req.user);
    await this.teamService.remove(id);
    return { success: true };
  }
}