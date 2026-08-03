import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

@Controller('finance/reconciliations')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.FINANCE)
export class ReconciliationController {
  constructor(private reconciliationService: ReconciliationService) {}

  @Get()
  async findAll(@Query('org_id') orgId: string, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.reconciliationService.findAll(finalOrgId);
  }

  @Get('stats')
  async getStats(@Query('org_id') orgId: string, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.reconciliationService.getReconciliationStats(finalOrgId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.reconciliationService.findById(id);
  }

  @Post()
  async create(@Body() body: any) {
    return this.reconciliationService.create(body);
  }

  @Post('run')
  async runReconciliation(
    @Body() body: { period_start: string; period_end: string; org_id?: string },
    @Request() req?: any,
  ) {
    const orgId = body.org_id || req?.user?.organization_id;
    return this.reconciliationService.runReconciliation(body.period_start, body.period_end, orgId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.reconciliationService.remove(id);
  }
}