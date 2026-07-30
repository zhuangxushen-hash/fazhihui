import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { BrandConfigService } from './brand-config.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('system/brand-configs')
@UseGuards(JwtAuthGuard)
export class BrandConfigController {
  constructor(private brandConfigService: BrandConfigService) {}

  @Post()
  create(@Body() body: any, @Request() req: any) {
    const orgId = body.organization_id || req?.user?.organization_id;
    return this.brandConfigService.create({ ...body, organization_id: orgId });
  }

  @Get()
  findAll(@Query('org_id') orgId?: string, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.brandConfigService.findAll(finalOrgId);
  }

  @Get('active')
  getActiveBrandConfig(@Request() req?: any) {
    const orgId = req?.user?.organization_id;
    return this.brandConfigService.getActiveBrandConfig(orgId);
  }

  @Put('theme')
  updateTheme(@Body() body: any, @Request() req: any) {
    const orgId = body.organization_id || req?.user?.organization_id;
    return this.brandConfigService.updateTheme(orgId, body);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.brandConfigService.findById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.brandConfigService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.brandConfigService.delete(id);
  }
}
