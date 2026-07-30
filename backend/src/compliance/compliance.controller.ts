import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { ComplianceType, ComplianceResult, ComplaintType, ComplaintStatus } from '../types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlatformType } from './marketing-content.entity';
import { SalesChannel } from './sales-compliance.entity';

@Controller('compliance')
@UseGuards(JwtAuthGuard)
export class ComplianceController {
  constructor(private complianceService: ComplianceService) {}

  @Post('check')
  checkCompliance(@Body() body: {
    content: string;
    type: ComplianceType;
    organization_id: string;
    operator_id: string;
    source_id?: string;
  }) {
    return this.complianceService.checkCompliance(body.content, body.type, body.organization_id, body.operator_id, body.source_id);
  }

  @Get('records')
  getComplianceRecords(
    @Query('org_id') orgId: string,
    @Query('type') type?: ComplianceType,
    @Query('result') result?: ComplianceResult,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.complianceService.getComplianceRecords(finalOrgId, type, result);
  }

  @Post('complaint')
  createComplaint(@Body() body: {
    type: ComplaintType;
    content: string;
    client_id: string;
    client_name: string;
    client_phone: string;
    organization_id: string;
    case_id?: string;
    evidence_files?: string;
  }) {
    return this.complianceService.createComplaint(body);
  }

  @Put('complaint/:id/status')
  updateComplaintStatus(@Param('id') id: string, @Body() body: {
    status: ComplaintStatus;
    assignee_id?: string;
    process_note?: string;
  }) {
    return this.complianceService.updateComplaintStatus(id, body.status, body.assignee_id, body.process_note);
  }

  @Put('complaint/:id/close')
  closeComplaint(@Param('id') id: string, @Body() body: {
    resolution: string;
    satisfaction_score?: number;
  }) {
    return this.complianceService.closeComplaint(id, body.resolution, body.satisfaction_score);
  }

  @Get('complaints')
  getComplaints(@Query('org_id') orgId: string, @Query('status') status?: ComplaintStatus, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.complianceService.getComplaints(finalOrgId, status);
  }

  @Get('complaint/:id')
  getComplaintById(@Param('id') id: string) {
    return this.complianceService.getComplaintById(id);
  }

  @Post('marketing-content')
  createMarketingContent(@Body() body: {
    title: string;
    content: string;
    content_type: string;
    platform: PlatformType;
    organization_id: string;
    operator_id: string;
  }) {
    return this.complianceService.createMarketingContent(body);
  }

  @Put('marketing-content/:id/review')
  reviewMarketingContent(@Param('id') id: string, @Body() body: {
    reviewer_id: string;
    status: string;
    issues?: string;
  }) {
    return this.complianceService.reviewMarketingContent(id, body.reviewer_id, body.status as any, body.issues);
  }

  @Get('marketing-content')
  getMarketingContents(@Query('org_id') orgId: string, @Query('status') status?: string, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.complianceService.getMarketingContents(finalOrgId, status);
  }

  @Post('sales-compliance')
  createSalesCompliance(@Body() body: {
    lead_id: string;
    sales_id: string;
    channel: SalesChannel;
    content?: string;
    audio_url?: string;
    organization_id: string;
  }) {
    return this.complianceService.createSalesCompliance(body);
  }

  @Post('sales-compliance/:leadId/risk-disclosure')
  recordRiskDisclosure(@Param('leadId') leadId: string, @Body() body: {
    content: string;
  }) {
    return this.complianceService.recordRiskDisclosure(leadId, body.content);
  }

  @Get('sales-compliance')
  getSalesComplianceRecords(@Query('org_id') orgId: string, @Query('lead_id') leadId?: string, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.complianceService.getSalesComplianceRecords(finalOrgId, leadId);
  }

  @Post('signing-compliance')
  createSigningCompliance(@Body() body: {
    case_id: string;
    client_id: string;
    lawyer_id: string;
    contract_template_id?: string;
    contract_content?: string;
    organization_id: string;
  }) {
    return this.complianceService.createSigningCompliance(body);
  }

  @Put('signing-compliance/:id/risk-disclosure')
  signRiskDisclosure(@Param('id') id: string) {
    return this.complianceService.signRiskDisclosure(id);
  }

  @Put('signing-compliance/:id/complete')
  completeSigning(@Param('id') id: string) {
    return this.complianceService.completeSigning(id);
  }

  @Get('signing-compliance')
  getSigningCompliance(@Query('org_id') orgId: string, @Query('case_id') caseId?: string, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.complianceService.getSigningCompliance(finalOrgId, caseId);
  }

  @Post('case-sop')
  createCaseSOP(@Body() body: {
    case_id: string;
    case_type: string;
    organization_id: string;
  }) {
    return this.complianceService.createCaseSOP(body.case_id, body.case_type, body.organization_id);
  }

  @Put('case-sop/:id/complete')
  completeCaseSOP(@Param('id') id: string, @Body() body: {
    operator_id: string;
    notes?: string;
  }) {
    return this.complianceService.completeCaseSOP(id, body.operator_id, body.notes);
  }

  @Put('case-sop/:id/verify-evidence')
  verifyEvidence(@Param('id') id: string, @Body() body: {
    check_result: string;
  }) {
    return this.complianceService.verifyEvidence(id, body.check_result);
  }

  @Get('case-sop')
  getCaseSOP(@Query('case_id') caseId?: string) {
    return this.complianceService.getCaseSOP(caseId);
  }

  @Get('case-sop/stats')
  getCaseSOPStats(@Query('org_id') orgId: string, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.complianceService.getCaseSOPStats(finalOrgId);
  }

  // ========== 谈案AI质检接口 ==========

  @Post('talk-quality-check')
  runTalkQualityCheck(@Body() body: {
    invite_task_id: string;
    check_type: string;
    content: string;
    organization_id: string;
    inviter_id: string;
  }) {
    return this.complianceService.runTalkQualityCheck(
      body.invite_task_id,
      body.check_type,
      body.content,
      body.organization_id,
      body.inviter_id,
    );
  }

  @Get('talk-quality-checks')
  getTalkQualityChecks(
    @Query('org_id') orgId: string,
    @Query('handle_status') handleStatus?: string,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.complianceService.getTalkQualityChecks(finalOrgId, handleStatus);
  }

  @Put('talk-quality-check/:id/handle')
  handleQualityCheck(@Param('id') id: string, @Body() body: {
    handler_id: string;
    handle_note: string;
  }) {
    return this.complianceService.handleQualityCheck(id, body.handler_id, body.handle_note);
  }

  @Get('talk-quality-checks/stats')
  getQualityCheckStats(@Query('org_id') orgId: string, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.complianceService.getQualityCheckStats(finalOrgId);
  }

  // ========== 合规档案导出接口 ==========

  @Get('export-templates')
  getExportTemplates(@Query('org_id') orgId: string, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.complianceService.getExportTemplates(finalOrgId);
  }

  @Post('export')
  createExport(@Body() body: {
    template_id?: string;
    organization_id: string;
    exporter_id: string;
    export_format?: string;
    filters?: any;
  }, @Request() req?: any) {
    const finalBody = {
      ...body,
      organization_id: body.organization_id || req?.user?.organization_id,
      exporter_id: body.exporter_id || req?.user?.id,
    };
    return this.complianceService.createExport(finalBody);
  }

  @Get('export-history')
  getExportHistory(@Query('org_id') orgId: string, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.complianceService.getExportHistory(finalOrgId);
  }

  @Post('export-archive')
  exportComplianceArchive(@Body() body: {
    organization_id: string;
    filters?: any;
  }, @Request() req?: any) {
    const finalOrgId = body.organization_id || req?.user?.organization_id;
    return this.complianceService.exportComplianceArchive(finalOrgId, body.filters);
  }

  // ========== 销售合规审查接口 ==========

  @Get('sales-reviews')
  getSalesComplianceReviews(
    @Query('org_id') orgId: string,
    @Query('status') status?: string,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.complianceService.getSalesComplianceReviews(finalOrgId, status);
  }

  @Put('sales-reviews/:id/review')
  reviewSalesCompliance(
    @Param('id') id: string,
    @Body() body: {
      reviewer_id: string;
      result: string;
      note?: string;
      risk_level?: string;
    },
    @Request() req?: any,
  ) {
    const reviewerId = body.reviewer_id || req?.user?.id;
    return this.complianceService.reviewSalesCompliance(id, reviewerId, body.result, body.note, body.risk_level);
  }

  @Get('sales-reviews/stats')
  getSalesReviewStats(@Query('org_id') orgId: string, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.complianceService.getSalesReviewStats(finalOrgId);
  }
}
