import {
  Controller,
  Post,
  Param,
  Body,
  Request,
  UseGuards,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DataSyncService } from './data-sync.service';

// 已认证请求接口
interface AuthenticatedRequest extends Request {
  user: {
    organization_id: string;
    [key: string]: unknown;
  };
}

/**
 * 广告平台数据同步控制器
 * 提供手动触发的数据同步接口：余额同步、投放计划同步、报表同步
 * 所有接口需 JWT 认证，通过组织身份获取对应平台的授权数据
 */
@Controller('ad-platforms/sync')
export class SyncController {
  private readonly logger = new Logger(SyncController.name);

  constructor(private dataSyncService: DataSyncService) {}

  /**
   * 同步指定平台的账户余额
   * 拉取该组织在指定平台下所有账户的最新余额
   */
  @Post('balance/:platform')
  @UseGuards(JwtAuthGuard)
  async syncBalance(
    @Param('platform') platform: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const orgId = req.user?.organization_id;
    if (!orgId) {
      throw new UnauthorizedException('无法获取组织信息');
    }
    await this.dataSyncService.syncAccountBalance(orgId, platform);
    this.logger.log(`组织 ${orgId} 手动同步平台 ${platform} 余额成功`);
    return {
      success: true,
      platform,
      balance: '已同步最新余额',
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * 同步指定平台的投放计划列表
   * 拉取该组织在指定平台下所有投放计划数据
   */
  @Post('campaigns/:platform')
  @UseGuards(JwtAuthGuard)
  async syncCampaigns(
    @Param('platform') platform: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const orgId = req.user?.organization_id;
    if (!orgId) {
      throw new UnauthorizedException('无法获取组织信息');
    }
    await this.dataSyncService.syncCampaignList(orgId, platform);
    this.logger.log(`组织 ${orgId} 手动同步平台 ${platform} 投放计划成功`);
    return {
      success: true,
      platform,
      synced_count: 0,
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * 同步指定平台的广告报表数据
   * 支持自定义时间范围，默认为最近 7 天
   */
  @Post('report/:platform')
  @UseGuards(JwtAuthGuard)
  async syncReport(
    @Param('platform') platform: string,
    @Body() body: { start_date?: string; end_date?: string },
    @Request() req: AuthenticatedRequest,
  ) {
    const orgId = req.user?.organization_id;
    if (!orgId) {
      throw new UnauthorizedException('无法获取组织信息');
    }
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    const endDate = body.end_date || today.toISOString().slice(0, 10);
    const startDate = body.start_date || sevenDaysAgo.toISOString().slice(0, 10);
    await this.dataSyncService.syncReportData(orgId, platform, startDate, endDate);
    this.logger.log(
      `组织 ${orgId} 手动同步平台 ${platform} 报表成功（${startDate} ~ ${endDate}）`,
    );
    return {
      success: true,
      platform,
      report_data: { start_date: startDate, end_date: endDate },
      updated_at: new Date().toISOString(),
    };
  }
}