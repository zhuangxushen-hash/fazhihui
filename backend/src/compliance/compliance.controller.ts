import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
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
  ) {
    return this.complianceService.getComplianceRecords(orgId, type, result);
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
  getComplaints(@Query('org_id') orgId: string, @Query('status') status?: ComplaintStatus) {
    return this.complianceService.getComplaints(orgId, status);
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
  getMarketingContents(@Query('org_id') orgId: string, @Query('status') status?: string) {
    return this.complianceService.getMarketingContents(orgId, status);
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
  getSalesComplianceRecords(@Query('org_id') orgId: string, @Query('lead_id') leadId?: string) {
    return this.complianceService.getSalesComplianceRecords(orgId, leadId);
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
  getSigningCompliance(@Query('org_id') orgId: string, @Query('case_id') caseId?: string) {
    return this.complianceService.getSigningCompliance(orgId, caseId);
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
  getCaseSOP(@Query('case_id') caseId: string) {
    return this.complianceService.getCaseSOP(caseId);
  }

  @Get('case-sop/stats')
  getCaseSOPStats(@Query('org_id') orgId: string) {
    return this.complianceService.getCaseSOPStats(orgId);
  }
}
