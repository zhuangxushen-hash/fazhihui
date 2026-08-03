import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { IntegrationService } from './integration.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

@Controller('system/integrations')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
export class IntegrationController {
  constructor(private integrationService: IntegrationService) {}

  @Post()
  create(@Body() body: any, @Request() req: any) {
    const orgId = body.organization_id || req?.user?.organization_id;
    return this.integrationService.create({ ...body, organization_id: orgId });
  }

  @Get()
  findAll(@Query('org_id') orgId?: string, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.integrationService.findAll(finalOrgId);
  }

  @Get('active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.MARKETING, UserRole.SALES, UserRole.LAWYER, UserRole.ASSISTANT, UserRole.FINANCE)
  getActiveIntegrations(@Request() req?: any) {
    const orgId = req?.user?.organization_id;
    return this.integrationService.getActiveIntegrations(orgId);
  }

  @Post(':id/test')
  testConnection(@Param('id') id: string) {
    return this.integrationService.testConnection(id);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.integrationService.findById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.integrationService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.integrationService.delete(id);
  }
}
