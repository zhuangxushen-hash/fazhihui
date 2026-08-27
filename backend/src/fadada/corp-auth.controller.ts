import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CorpAuthService, CreateCorpAuthDto } from './corp-auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

/**
 * 企业授权认证控制器（组织管理 → 认证授权）
 * 平台方为其他企业生成授权链接，企业完成法人/经办人认证后回填 openCorpId。
 * 权限：仅管理员（super_admin, org_admin）可管理企业授权。
 */
@Controller('corp-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
export class CorpAuthController {
  constructor(private readonly corpAuthService: CorpAuthService) {}

  // 企业授权记录列表
  @Get()
  async list() {
    return this.corpAuthService.list();
  }

  // 发起企业授权（生成授权链接）；已授权企业重复调用即为补充授权范围
  @Post()
  async create(@Body() dto: CreateCorpAuthDto) {
    return this.corpAuthService.create(dto);
  }

  // 企业授权记录详情
  @Get(':clientCorpId')
  async getById(@Param('clientCorpId') clientCorpId: string) {
    return this.corpAuthService.getById(clientCorpId);
  }

  // 查询企业授权状态（从法大大拉取后回填本地）
  @Get(':clientCorpId/status')
  async queryStatus(@Param('clientCorpId') clientCorpId: string) {
    return this.corpAuthService.queryStatus(clientCorpId);
  }

  // 授权完成后的重定向回填（携带 openCorpId 等参数回写本地记录）
  @Post(':clientCorpId/redirect')
  async redirectBackfill(
    @Param('clientCorpId') clientCorpId: string,
    @Body() body: {
      open_corp_id?: string;
      auth_status?: string;
      binding_status?: string;
      ident_status?: string;
      auth_result?: string;
      auth_scopes?: string[];
    },
  ) {
    return this.corpAuthService.updateOpenCorpId(clientCorpId, body);
  }
}