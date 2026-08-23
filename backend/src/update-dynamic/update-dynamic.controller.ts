import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { UpdateDynamicService } from './update-dynamic.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

// 更新动态控制器：聚合各业务模块的最新变更，生成全所业务动态时间线
@Controller('update-dynamic')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.MARKETING, UserRole.SALES, UserRole.LAWYER, UserRole.ASSISTANT, UserRole.FINANCE)
export class UpdateDynamicController {
  constructor(private readonly updateDynamicService: UpdateDynamicService) {}

  // 业务动态时间线
  @Get('feed')
  getFeed(
    @Query('limit') limit: string,
    @Query('type') type: string,
    @Request() req: any,
  ) {
    const orgId = req?.user?.organization_id;
    return this.updateDynamicService.getFeed(orgId, {
      limit: limit ? Number(limit) : undefined,
      type: type || undefined,
    });
  }
}
