import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ChannelTrackingService } from './channel-tracking.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

@Controller('scrm/channels')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.MARKETING, UserRole.SALES)
export class ChannelTrackingController {
  constructor(private channelTrackingService: ChannelTrackingService) {}

  @Post()
  create(@Body() body: any) {
    return this.channelTrackingService.create(body);
  }

  @Get()
  findAll(
    @Query('org_id') orgId?: string,
    @Query('channel_group') channel_group?: string,
    @Query('live_code_id') live_code_id?: string,
  ) {
    return this.channelTrackingService.findAll(orgId, { channel_group, live_code_id });
  }

  @Get('statistics/list')
  getStatistics(
    @Query('org_id') orgId?: string,
    @Query('channel_group') channel_group?: string,
  ) {
    return this.channelTrackingService.getStatistics(orgId, { channel_group });
  }

  @Get('statistics/groups')
  getGroupComparison(@Query('org_id') orgId?: string) {
    return this.channelTrackingService.getGroupComparison(orgId);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.channelTrackingService.findById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.channelTrackingService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.channelTrackingService.delete(id);
  }

  @Post(':id/scan')
  recordScan(@Param('id') id: string) {
    return this.channelTrackingService.recordScan(id);
  }

  @Post(':id/add')
  recordAdd(@Param('id') id: string) {
    return this.channelTrackingService.recordAdd(id);
  }

  @Post(':id/invite')
  recordInvite(@Param('id') id: string) {
    return this.channelTrackingService.recordInvite(id);
  }

  @Post(':id/sign')
  recordSign(@Param('id') id: string) {
    return this.channelTrackingService.recordSign(id);
  }
}
