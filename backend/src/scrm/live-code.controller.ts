import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { LiveCodeService } from './live-code.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('scrm/live-codes')
@UseGuards(JwtAuthGuard)
export class LiveCodeController {
  constructor(private liveCodeService: LiveCodeService) {}

  @Post()
  create(@Body() body: any) {
    return this.liveCodeService.create(body);
  }

  @Get()
  findAll(
    @Query('org_id') orgId?: string,
    @Query('code_type') code_type?: string,
    @Query('status') status?: string,
    @Query('channel_id') channel_id?: string,
  ) {
    return this.liveCodeService.findAll(orgId, { code_type, status, channel_id });
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.liveCodeService.findById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.liveCodeService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.liveCodeService.delete(id);
  }

  @Put(':id/dispatch-rule')
  updateDispatchRule(
    @Param('id') id: string,
    @Body() body: { dispatch_rule: string; dispatch_config: any },
  ) {
    return this.liveCodeService.updateDispatchRule(id, body.dispatch_rule, body.dispatch_config);
  }

  @Post(':id/dispatch')
  dispatch(
    @Param('id') id: string,
    @Body() body?: { region?: string; case_type?: string },
  ) {
    return this.liveCodeService.dispatch(id, body);
  }
}
