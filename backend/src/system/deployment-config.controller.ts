import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { DeploymentConfigService } from './deployment-config.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

@Controller('system/deployment-configs')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
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
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.MARKETING, UserRole.SALES, UserRole.LAWYER, UserRole.ASSISTANT, UserRole.FINANCE)
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
