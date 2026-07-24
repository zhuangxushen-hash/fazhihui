import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ConversionService, CreateConversionEventDto, RoiDimension } from './conversion.service';
import { AdChannel, ConversionEventType } from '../types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('conversions')
@UseGuards(JwtAuthGuard)
export class ConversionController {
  constructor(private conversionService: ConversionService) {}

  /**
   * 通用：创建转化事件（支持四级事件）
   */
  @Post('events')
  createEvent(@Body() body: CreateConversionEventDto) {
    return this.conversionService.createEvent(body);
  }

  /**
   * 线索事件回传
   */
  @Post('lead')
  reportLead(@Body() body: CreateConversionEventDto) {
    return this.conversionService.reportLead(body);
  }

  /**
   * 加微事件回传
   */
  @Post('wechat-add')
  reportWechatAdd(@Body() body: CreateConversionEventDto) {
    return this.conversionService.reportWechatAdd(body);
  }

  /**
   * 邀约到所事件回传
   */
  @Post('invite')
  reportInvite(@Body() body: CreateConversionEventDto) {
    return this.conversionService.reportInvite(body);
  }

  /**
   * 签约回款事件回传
   */
  @Post('sign')
  reportSign(@Body() body: CreateConversionEventDto) {
    return this.conversionService.reportSign(body);
  }

  /**
   * 查询转化事件列表
   */
  @Get('events')
  findEvents(
    @Query('org_id') orgId: string,
    @Query('channel') channel?: AdChannel,
    @Query('account_id') account_id?: string,
    @Query('plan_id') plan_id?: string,
    @Query('material_id') material_id?: string,
    @Query('event_type') event_type?: ConversionEventType,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.conversionService.findEvents(finalOrgId, {
      channel,
      account_id,
      plan_id,
      material_id,
      event_type,
      start_date: start_date ? new Date(start_date) : undefined,
      end_date: end_date ? new Date(end_date) : undefined,
    });
  }

  /**
   * 转化漏斗统计
   */
  @Get('funnel')
  getFunnelStats(
    @Query('org_id') orgId: string,
    @Query('channel') channel?: AdChannel,
    @Query('account_id') account_id?: string,
    @Query('plan_id') plan_id?: string,
    @Query('material_id') material_id?: string,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.conversionService.getFunnelStats(finalOrgId, {
      channel,
      account_id,
      plan_id,
      material_id,
      start_date: start_date ? new Date(start_date) : undefined,
      end_date: end_date ? new Date(end_date) : undefined,
    });
  }

  /**
   * 多维度 ROI 统计
   * dimension: channel | account | plan | material | keyword
   */
  @Get('roi-stats')
  getRoiStats(
    @Query('org_id') orgId: string,
    @Query('dimension') dimension: RoiDimension = 'channel',
    @Query('channel') channel?: AdChannel,
    @Query('account_id') account_id?: string,
    @Query('plan_id') plan_id?: string,
    @Query('material_id') material_id?: string,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.conversionService.getRoiStats(finalOrgId, dimension, {
      channel,
      account_id,
      plan_id,
      material_id,
      start_date: start_date ? new Date(start_date) : undefined,
      end_date: end_date ? new Date(end_date) : undefined,
    });
  }

  /**
   * 手动触发 T+1 素材 ROI 数据更新
   */
  @Post('refresh-material-roi')
  refreshMaterialRoi() {
    return this.conversionService.refreshDailyMaterialRoi();
  }
}
