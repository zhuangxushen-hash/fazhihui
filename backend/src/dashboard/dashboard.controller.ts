import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('conversion-funnel')
  getConversionFunnel(
    @Query('org_id') orgId: string,
    @Query('start_date') startDate?: Date,
    @Query('end_date') endDate?: Date,
  ) {
    return this.dashboardService.getConversionFunnel(orgId, startDate, endDate);
  }

  @Get('channel-roi')
  getChannelROI(
    @Query('org_id') orgId: string,
    @Query('start_date') startDate?: Date,
    @Query('end_date') endDate?: Date,
  ) {
    return this.dashboardService.getChannelROI(orgId, startDate, endDate);
  }

  @Get('case-stats')
  getCaseStats(@Query('org_id') orgId: string) {
    return this.dashboardService.getCaseStats(orgId);
  }

  @Get('compliance-stats')
  getComplianceStats(@Query('org_id') orgId: string) {
    return this.dashboardService.getComplianceStats(orgId);
  }

  @Get('revenue-stats')
  getRevenueStats(
    @Query('org_id') orgId: string,
    @Query('start_date') startDate?: Date,
    @Query('end_date') endDate?: Date,
  ) {
    return this.dashboardService.getRevenueStats(orgId, startDate, endDate);
  }

  @Get('lawyer-performance')
  getLawyerPerformance(
    @Query('org_id') orgId: string,
    @Query('start_date') startDate?: Date,
    @Query('end_date') endDate?: Date,
  ) {
    return this.dashboardService.getLawyerPerformance(orgId, startDate, endDate);
  }

  @Get('case-type-profit')
  getCaseTypeProfit(
    @Query('org_id') orgId: string,
    @Query('start_date') startDate?: Date,
    @Query('end_date') endDate?: Date,
  ) {
    return this.dashboardService.getCaseTypeProfit(orgId, startDate, endDate);
  }

  @Get('risk-alerts')
  getRiskAlerts(@Query('org_id') orgId: string) {
    return this.dashboardService.getRiskAlerts(orgId);
  }

  @Get('risk-stats')
  getRiskStats(@Query('org_id') orgId: string) {
    return this.dashboardService.getRiskStats(orgId);
  }
}
