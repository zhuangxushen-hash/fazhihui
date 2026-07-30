import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { DeploymentConfigService } from './deployment-config.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('system/deployment-configs')
@UseGuards(JwtAuthGuard)
export class DeploymentConfigController {
  constructor(private deploymentConfigService: DeploymentConfigService) {}

  @Post()
  create(@Body() body: any, @Request() req: any) {
    const orgId = body.organization_id || req?.user?.organization_id;
    return this.deploymentConfigService.create({ ...body, organization_id: orgId });
  }

  @Get()
  findAll(@Query('org_id') orgId?: string, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.deploymentConfigService.findAll(finalOrgId);
  }

  @Get('active')
  getActiveConfig(@Request() req?: any) {
    const orgId = req?.user?.organization_id;
    return this.deploymentConfigService.getActiveConfig(orgId);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.deploymentConfigService.findById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.deploymentConfigService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.deploymentConfigService.delete(id);
  }
}
