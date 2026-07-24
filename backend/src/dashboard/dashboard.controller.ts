import { Controller, Get, Post, Put, Delete, Body, Query, Param, UseGuards, Request } from '@nestjs/common';
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
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.dashboardService.getConversionFunnel(finalOrgId, startDate, endDate);
  }

  @Get('channel-roi')
  getChannelROI(
    @Query('org_id') orgId: string,
    @Query('start_date') startDate?: Date,
    @Query('end_date') endDate?: Date,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.dashboardService.getChannelROI(finalOrgId, startDate, endDate);
  }

  @Get('case-stats')
  getCaseStats(@Query('org_id') orgId: string, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.dashboardService.getCaseStats(finalOrgId);
  }

  @Get('compliance-stats')
  getComplianceStats(@Query('org_id') orgId: string, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.dashboardService.getComplianceStats(finalOrgId);
  }

  @Get('revenue-stats')
  getRevenueStats(
    @Query('org_id') orgId: string,
    @Query('start_date') startDate?: Date,
    @Query('end_date') endDate?: Date,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.dashboardService.getRevenueStats(finalOrgId, startDate, endDate);
  }

  @Get('lawyer-performance')
  getLawyerPerformance(
    @Query('org_id') orgId: string,
    @Query('start_date') startDate?: Date,
    @Query('end_date') endDate?: Date,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.dashboardService.getLawyerPerformance(finalOrgId, startDate, endDate);
  }

  @Get('case-type-profit')
  getCaseTypeProfit(
    @Query('org_id') orgId: string,
    @Query('start_date') startDate?: Date,
    @Query('end_date') endDate?: Date,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.dashboardService.getCaseTypeProfit(finalOrgId, startDate, endDate);
  }

  @Get('risk-alerts')
  getRiskAlerts(@Query('org_id') orgId: string, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.dashboardService.getRiskAlerts(finalOrgId);
  }

  @Get('risk-stats')
  getRiskStats(@Query('org_id') orgId: string, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.dashboardService.getRiskStats(finalOrgId);
  }

  // ==================== 8.1 投放转化漏斗看板增强 ====================

  /** 获取漏斗筛选项 */
  @Get('funnel-filter-options')
  getFunnelFilterOptions(@Query('org_id') orgId: string, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.dashboardService.getFunnelFilterOptions(finalOrgId);
  }

  @Get('conversion-funnel-enhanced')
  getConversionFunnelEnhanced(
    @Query('org_id') orgId: string,
    @Query('channel') channel?: string,
    @Query('platform') platform?: string,
    @Query('case_type') caseType?: string,
    @Query('start_date') startDate?: Date,
    @Query('end_date') endDate?: Date,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.dashboardService.getConversionFunnelEnhanced(finalOrgId, {
      channel,
      platform,
      case_type: caseType,
      start_date: startDate,
      end_date: endDate,
    });
  }

  // ==================== 8.2 销售团队绩效看板 ====================

  @Get('sales-performance')
  getSalesPerformance(
    @Query('org_id') orgId: string,
    @Query('start_date') startDate?: Date,
    @Query('end_date') endDate?: Date,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.dashboardService.getSalesPerformance(finalOrgId, startDate, endDate);
  }

  @Get('sales-ranking')
  getSalesRanking(
    @Query('org_id') orgId: string,
    @Query('start_date') startDate?: Date,
    @Query('end_date') endDate?: Date,
    @Query('dimension') dimension?: string,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.dashboardService.getSalesRanking(finalOrgId, startDate, endDate, dimension);
  }

  // ==================== 8.3 办案效能分析看板增强 ====================

  @Get('case-efficiency')
  getCaseEfficiency(
    @Query('org_id') orgId: string,
    @Query('start_date') startDate?: Date,
    @Query('end_date') endDate?: Date,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.dashboardService.getCaseEfficiency(finalOrgId, startDate, endDate);
  }

  // ==================== 8.4 财务经营数据看板增强 ====================

  @Get('finance-dashboard')
  getFinanceDashboard(
    @Query('org_id') orgId: string,
    @Query('start_date') startDate?: Date,
    @Query('end_date') endDate?: Date,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.dashboardService.getFinanceDashboard(finalOrgId, startDate, endDate);
  }

  // ==================== 8.5 合规风险监控看板增强 ====================

  @Get('compliance-risk-dashboard')
  getComplianceRiskDashboard(@Query('org_id') orgId: string, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.dashboardService.getComplianceRiskDashboard(finalOrgId);
  }

  // ==================== 8.6 自定义报表导出 ====================

  /** 创建报表模板 */
  @Post('report-templates')
  createReportTemplate(@Body() body: any) {
    return this.dashboardService.createReportTemplate(body);
  }

  /** 查询报表模板列表 */
  @Get('report-templates')
  getReportTemplates(@Query('org_id') orgId: string, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.dashboardService.getReportTemplates(finalOrgId);
  }

  /** 更新报表模板 */
  @Put('report-templates/:id')
  updateReportTemplate(@Param('id') id: string, @Body() body: any) {
    return this.dashboardService.updateReportTemplate(id, body);
  }

  /** 删除报表模板 */
  @Delete('report-templates/:id')
  deleteReportTemplate(@Param('id') id: string) {
    return this.dashboardService.deleteReportTemplate(id);
  }

  /** 生成报表数据 */
  @Post('reports/generate')
  generateReport(@Body() body: { template_id: string; filters?: any }) {
    return this.dashboardService.generateReport(body.template_id, body.filters);
  }

  /** 导出 Excel */
  @Post('reports/export-excel')
  exportReportToExcel(@Body() body: { template_id: string; filters?: any }) {
    return this.dashboardService.exportReportToExcel(body.template_id, body.filters);
  }

  /** 导出 PDF */
  @Post('reports/export-pdf')
  exportReportToPdf(@Body() body: { template_id: string; filters?: any }) {
    return this.dashboardService.exportReportToPdf(body.template_id, body.filters);
  }

  /** 查询导出日志 */
  @Get('export-logs')
  getExportLogs(
    @Query('org_id') orgId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.dashboardService.getExportLogs(finalOrgId, page ? Number(page) : 1, limit ? Number(limit) : 20);
  }

  /** 订阅报表 */
  @Post('report-templates/:id/subscribe')
  subscribeReport(
    @Param('id') id: string,
    @Body() body: { user_ids: string[]; frequency: string },
  ) {
    return this.dashboardService.subscribeReport(id, body.user_ids, body.frequency);
  }
}
