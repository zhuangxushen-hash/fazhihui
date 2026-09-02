import { Controller, Get, Post, Put, Delete, Body, Query, Param, UseGuards, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.MARKETING, UserRole.SALES, UserRole.LAWYER, UserRole.ASSISTANT, UserRole.FINANCE)
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

  /** 投诉率看板：投诉案件率 + 投诉金额 + 来源/类型分布 */
  @Get('complaint-rate-stats')
  getComplaintRateStats(@Query('org_id') orgId: string, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.dashboardService.getComplaintRateStats(finalOrgId);
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
  generateReport(@Body() body: any) {
    // 基于已保存模板生成
    if (body.template_id) {
      return this.dashboardService.generateReport(body.template_id, body.filters);
    }
    // 前端一键生成：无模板，直接按维度/指标/时间范围生成
    return this.dashboardService.generateReportFromConfig(body);
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

  // ==================== 8.7 人效分析 ====================

  @Get('hr-efficiency')
  getHREfficiencyStats(
    @Query('org_id') orgId: string,
    @Query('start_date') startDate?: Date,
    @Query('end_date') endDate?: Date,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.dashboardService.getHREfficiencyStats(finalOrgId, startDate, endDate);
  }

  @Get('hr-ranking')
  getLawyerEfficiencyRanking(
    @Query('org_id') orgId: string,
    @Query('start_date') startDate?: Date,
    @Query('end_date') endDate?: Date,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.dashboardService.getLawyerEfficiencyRanking(finalOrgId, startDate, endDate);
  }

  // ==================== 8.8 盈利模型模拟器 ====================

  @Post('profit-model/simulate')
  calculateProfitModel(@Body() body: {
    caseType: string;
    avgFee: number;
    avgCost: number;
    conversionRate: number;
    orgMargin: number;
    lawyerMargin: number;
    salesMargin: number;
    marketingMargin: number;
  }) {
    return this.dashboardService.calculateProfitModel(body);
  }

  // ==================== 数据大屏 ====================

  /** 数据大屏聚合数据 */
  @Get('screen-data')
  getScreenData(@Query('org_id') orgId: string, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.dashboardService.getScreenData(finalOrgId);
  }

  // ==================== T11 看板聚合新路由 ====================

  @Get('finance')
  async financeDashboard(@Request() req: any) {
    const orgId = req?.user?.organization_id;
    return this.dashboardService.getFinanceIntegratedDashboard(orgId);
  }

  @Get('case-efficiency-dashboard')
  async caseEfficiencyDashboard(@Request() req: any) {
    const orgId = req?.user?.organization_id;
    return this.dashboardService.getCaseEfficiencyDashboard(orgId);
  }

  @Get('tasks')
  async taskDashboard(@Request() req: any) {
    const orgId = req?.user?.organization_id;
    return this.dashboardService.getTaskDashboard(orgId);
  }

  /** T11: 核心指标聚合看板（7项核心指标从业务表实时聚合） */
  @Get('core-metrics')
  async coreMetrics(@Request() req: any) {
    const orgId = req?.user?.organization_id;
    return this.dashboardService.getCoreMetrics(orgId);
  }
}
