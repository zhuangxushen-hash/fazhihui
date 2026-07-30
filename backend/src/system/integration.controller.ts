import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { IntegrationService } from './integration.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('system/integrations')
@UseGuards(JwtAuthGuard)
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
