import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { ComplianceType, ComplianceResult, ComplaintType, ComplaintStatus, UserRole} from '../types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { PlatformType } from './marketing-content.entity';
import { SalesChannel } from './sales-compliance.entity';
// 合规规则管理
import { CheckStage, RuleType } from './compliance-rule.entity';
// 合规检查结果
import { CheckResultType, HandleStatus, TargetType } from './compliance-check-result.entity';
// 财务税务合规校验
import { FinanceCheckType, FinanceTargetType, FinanceCheckResult, FinanceHandleStatus } from './finance-compliance-check.entity';
// 办案交付合规检查
import { CaseCheckType, CaseCheckResult, CaseRiskLevel, CaseCheckHandleStatus } from './case-compliance-check.entity';
// 人员变更申请
import { PersonnelChangeType, PersonnelChangeStatus } from './case-personnel-change.entity';
// 结案归档
import { ArchiveStatus } from './case-archive.entity';
// 客诉工单
import { TicketSourceChannel, TicketComplaintType, TicketSeverity, TicketStatus } from './complaint-ticket.entity';

@Controller('compliance')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER, UserRole.FINANCE, UserRole.SALES, UserRole.MARKETING)
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

  // ========== 营销内容提交接口 ==========

  @Post('marketing-content/:id/submit')
  @Roles(UserRole.MARKETING, UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  submitMarketingContent(
    @Param('id') id: string,
    @Body() body: { operator_id: string },
  ) {
    return this.complianceService.submitMarketingContent(id, body.operator_id);
  }

  // ========== 合规规则管理接口 ==========

  @Post('compliance-rule')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  createComplianceRule(
    @Body() body: {
      name: string;
      check_stage: CheckStage;
      rule_type: RuleType;
      conditions: string;
      enabled?: boolean;
    },
  ) {
    return this.complianceService.createComplianceRule(body);
  }

  @Get('compliance-rule')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER, UserRole.FINANCE)
  getComplianceRules(
    @Query('check_stage') checkStage?: CheckStage,
    @Query('enabled_only') enabledOnly?: boolean,
  ) {
    return this.complianceService.getComplianceRules(checkStage, enabledOnly);
  }

  @Get('compliance-rule/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER, UserRole.FINANCE)
  getComplianceRuleById(@Param('id') id: string) {
    return this.complianceService.getComplianceRuleById(id);
  }

  @Put('compliance-rule/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  updateComplianceRule(
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      check_stage?: CheckStage;
      rule_type?: RuleType;
      conditions?: string;
      enabled?: boolean;
    },
  ) {
    return this.complianceService.updateComplianceRule(id, body);
  }

  @Delete('compliance-rule/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  deleteComplianceRule(@Param('id') id: string) {
    return this.complianceService.deleteComplianceRule(id);
  }

  @Put('compliance-rule/:id/toggle')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  toggleComplianceRule(
    @Param('id') id: string,
    @Body() body: { enabled: boolean },
  ) {
    return this.complianceService.toggleComplianceRule(id, body.enabled);
  }

  // ========== 检查结果查询接口 ==========

  @Get('check-results')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER, UserRole.FINANCE)
  getCheckResults(
    @Query('target_type') targetType?: TargetType,
    @Query('target_id') targetId?: string,
    @Query('check_result') checkResult?: CheckResultType,
    @Query('handle_status') handleStatus?: HandleStatus,
    @Query('is_inspection') isInspection?: boolean,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    return this.complianceService.getCheckResults({
      target_type: targetType,
      target_id: targetId,
      check_result: checkResult,
      handle_status: handleStatus,
      is_inspection: isInspection,
      start_date: startDate,
      end_date: endDate,
    });
  }

  @Get('check-results/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER, UserRole.FINANCE)
  getCheckResultById(@Param('id') id: string) {
    return this.complianceService.getCheckResultById(id);
  }

  @Put('check-results/:id/handle')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER, UserRole.FINANCE)
  handleCheckResult(
    @Param('id') id: string,
    @Body() body: {
      handler_id: string;
      handle_status: HandleStatus;
      handle_note?: string;
    },
  ) {
    return this.complianceService.handleCheckResult(id, body.handler_id, body.handle_status, body.handle_note);
  }

  // ========== 巡检管理接口 ==========

  @Post('inspection/trigger')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  triggerInspection() {
    return this.complianceService.triggerInspection();
  }

  // ========== 留痕档案管理接口 ==========

  @Get('archive')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER, UserRole.FINANCE)
  getArchive(
    @Query('org_id') orgId?: string,
    @Query('platform') platform?: string,
    @Query('status') status?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.complianceService.getArchive({
      org_id: finalOrgId,
      platform,
      status,
      start_date: startDate,
      end_date: endDate,
    });
  }

  @Get('archive/export')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.FINANCE)
  exportArchive(
    @Query('org_id') orgId?: string,
    @Query('platform') platform?: string,
    @Query('status') status?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.complianceService.exportArchive({
      org_id: finalOrgId,
      platform,
      status,
      start_date: startDate,
      end_date: endDate,
    });
  }

  // ========== 财务税务合规校验接口 ==========

  @Post('finance-check/receivable/:receivableId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.FINANCE)
  checkReceivable(@Param('receivableId') receivableId: string) {
    return this.complianceService.checkReceivable(receivableId);
  }

  @Post('finance-check/receivable/batch')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.FINANCE)
  batchCheckReceivables(
    @Body() body: { org_id?: string },
    @Request() req?: any,
  ) {
    const finalOrgId = body.org_id || req?.user?.organization_id;
    return this.complianceService.batchCheckReceivables(finalOrgId);
  }

  @Post('finance-check/invoice')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.FINANCE)
  checkInvoice(@Body() body: { case_id?: string }) {
    return this.complianceService.checkInvoice(body.case_id);
  }

  @Post('finance-check/commission/:caseId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.FINANCE)
  checkCommission(@Param('caseId') caseId: string) {
    return this.complianceService.checkCommission(caseId);
  }

  @Post('finance-check/commission/batch')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.FINANCE)
  batchCheckCommission() {
    return this.complianceService.batchCheckCommission();
  }

  @Get('finance-check')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.FINANCE)
  getFinanceChecks(
    @Query('org_id') orgId?: string,
    @Query('check_type') checkType?: FinanceCheckType,
    @Query('target_type') targetType?: FinanceTargetType,
    @Query('check_result') checkResult?: FinanceCheckResult,
    @Query('handle_status') handleStatus?: FinanceHandleStatus,
    @Query('case_id') caseId?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.complianceService.getFinanceChecks({
      org_id: finalOrgId,
      check_type: checkType,
      target_type: targetType,
      check_result: checkResult,
      handle_status: handleStatus,
      case_id: caseId,
      start_date: startDate,
      end_date: endDate,
    });
  }

  @Get('finance-check/stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.FINANCE)
  getFinanceCheckStats(
    @Query('org_id') orgId?: string,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.complianceService.getFinanceCheckStats(finalOrgId);
  }

  @Get('finance-check/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.FINANCE)
  getFinanceCheckById(@Param('id') id: string) {
    return this.complianceService.getFinanceCheckById(id);
  }

  @Put('finance-check/:id/handle')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.FINANCE)
  handleFinanceCheck(
    @Param('id') id: string,
    @Body() body: {
      handler_id: string;
      handle_status: FinanceHandleStatus;
      handle_note?: string;
    },
  ) {
    return this.complianceService.handleFinanceCheck(id, body.handler_id, body.handle_status, body.handle_note);
  }

  // ========== 客诉与舆情闭环管控接口 ==========

  @Post('complaint-ticket')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER)
  createComplaintTicket(
    @Body() body: {
      source_channel: TicketSourceChannel;
      complaint_type: TicketComplaintType;
      severity_level: TicketSeverity;
      title: string;
      content: string;
      case_id?: string;
      client_id?: string;
      client_name?: string;
      client_phone?: string;
      organization_id?: string;
      creator_id?: string;
    },
    @Request() req?: any,
  ) {
    const finalBody = {
      ...body,
      organization_id: body.organization_id || req?.user?.organization_id,
    };
    return this.complianceService.createComplaintTicketFull(finalBody);
  }

  @Get('complaint-tickets')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER)
  getComplaintTickets(
    @Query('org_id') orgId?: string,
    @Query('status') status?: TicketStatus,
    @Query('severity_level') severityLevel?: TicketSeverity,
    @Query('complaint_type') complaintType?: TicketComplaintType,
    @Query('source_channel') sourceChannel?: TicketSourceChannel,
    @Query('handler_id') handlerId?: string,
    @Query('client_id') clientId?: string,
    @Query('archived') archived?: boolean,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.complianceService.getComplaintTickets({
      org_id: finalOrgId,
      status,
      severity_level: severityLevel,
      complaint_type: complaintType,
      source_channel: sourceChannel,
      handler_id: handlerId,
      client_id: clientId,
      archived,
      start_date: startDate,
      end_date: endDate,
    });
  }

  @Get('complaint-ticket/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER)
  getComplaintTicketDetail(@Param('id') id: string) {
    return this.complianceService.getComplaintTicketDetail(id);
  }

  @Get('complaint-tickets/client/:clientId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER)
  getClientComplaintHistory(@Param('clientId') clientId: string) {
    return this.complianceService.getClientComplaintHistory(clientId);
  }

  @Post('complaint-ticket/:id/process-record')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER)
  addProcessRecord(
    @Param('id') id: string,
    @Body() body: {
      operator_id: string;
      content: string;
      action?: string;
    },
  ) {
    return this.complianceService.addProcessRecord(id, body.operator_id, body.content, body.action);
  }

  @Put('complaint-ticket/:id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER)
  changeTicketStatus(
    @Param('id') id: string,
    @Body() body: {
      operator_id: string;
      status: TicketStatus;
      note?: string;
    },
  ) {
    return this.complianceService.changeTicketStatus(id, body.operator_id, body.status, body.note);
  }

  @Put('complaint-ticket/:id/resolve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER)
  resolveTicket(
    @Param('id') id: string,
    @Body() body: {
      operator_id: string;
      resolution: string;
    },
  ) {
    return this.complianceService.resolveTicket(id, body.operator_id, body.resolution);
  }

  @Put('complaint-ticket/:id/close')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER)
  closeTicket(
    @Param('id') id: string,
    @Body() body: {
      operator_id: string;
      resolution: string;
      satisfaction_score?: number;
    },
  ) {
    return this.complianceService.closeTicket(id, body.operator_id, body.resolution, body.satisfaction_score);
  }

  @Put('complaint-ticket/:id/escalate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER)
  escalateTicket(
    @Param('id') id: string,
    @Body() body: {
      operator_id: string;
      reason: string;
    },
  ) {
    return this.complianceService.escalateTicket(id, body.operator_id, body.reason);
  }

  @Post('complaint-tickets/batch')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  batchProcessTickets(
    @Body() body: {
      ids: string[];
      action: string;
      operator_id: string;
      handler_id?: string;
      note?: string;
      resolution?: string;
    },
  ) {
    return this.complianceService.batchProcessTickets(body);
  }

  @Get('complaint-tickets/stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER)
  getComplaintTicketStats(
    @Query('org_id') orgId?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.complianceService.getComplaintTicketStats(finalOrgId, startDate, endDate);
  }

  @Get('complaint-tickets/report')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER)
  getComplaintTicketReport(
    @Query('org_id') orgId?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.complianceService.getComplaintTicketReport(finalOrgId, startDate, endDate);
  }

  // ========== 办案交付合规管控接口 ==========

  @Get('case-sop/:caseId/mandatory-check')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER)
  getSOPMandatoryCheck(@Param('caseId') caseId: string) {
    return this.complianceService.getSOPMandatoryCheck(caseId);
  }

  @Post('case/:caseId/validate-transition')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER)
  validateCaseTransition(
    @Param('caseId') caseId: string,
    @Body() body: { target_status: string },
  ) {
    return this.complianceService.validateCaseTransition(caseId, body.target_status);
  }

  @Get('overdue-risk-ledger')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER)
  getOverdueRiskLedger(
    @Query('org_id') orgId?: string,
    @Query('risk_level') riskLevel?: CaseRiskLevel,
    @Query('handle_status') handleStatus?: CaseCheckHandleStatus,
    @Query('case_id') caseId?: string,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.complianceService.getOverdueRiskLedger({
      org_id: finalOrgId,
      risk_level: riskLevel,
      handle_status: handleStatus,
      case_id: caseId,
    });
  }

  @Get('overdue-risk-stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER)
  getOverdueRiskStats(
    @Query('org_id') orgId?: string,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.complianceService.getOverdueRiskStats(finalOrgId);
  }

  @Post('case-inspection/trigger')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  triggerCaseInspection() {
    return this.complianceService.triggerCaseInspection();
  }

  @Get('case-compliance-checks')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER)
  getCaseComplianceChecks(
    @Query('org_id') orgId?: string,
    @Query('case_id') caseId?: string,
    @Query('check_type') checkType?: CaseCheckType,
    @Query('check_result') checkResult?: CaseCheckResult,
    @Query('risk_level') riskLevel?: CaseRiskLevel,
    @Query('handle_status') handleStatus?: CaseCheckHandleStatus,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.complianceService.getCaseComplianceChecks({
      org_id: finalOrgId,
      case_id: caseId,
      check_type: checkType,
      check_result: checkResult,
      risk_level: riskLevel,
      handle_status: handleStatus,
    });
  }

  @Get('case-compliance-checks/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER)
  getCaseComplianceCheckDetail(@Param('id') id: string) {
    return this.complianceService.getCaseComplianceCheckDetail(id);
  }

  @Put('case-compliance-checks/:id/handle')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER)
  handleCaseComplianceCheck(
    @Param('id') id: string,
    @Body() body: {
      handler_id: string;
      handle_status: CaseCheckHandleStatus;
      handle_note?: string;
    },
  ) {
    return this.complianceService.handleCaseComplianceCheck(id, body.handler_id, body.handle_status, body.handle_note);
  }

  @Post('personnel-change')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER)
  createPersonnelChange(
    @Body() body: {
      case_id: string;
      change_type: PersonnelChangeType;
      original_person_id?: string;
      new_person_id: string;
      reason: string;
      organization_id?: string;
      applicant_id?: string;
    },
    @Request() req?: any,
  ) {
    const finalBody = {
      ...body,
      organization_id: body.organization_id || req?.user?.organization_id,
      applicant_id: body.applicant_id || req?.user?.id,
    };
    return this.complianceService.createPersonnelChange(finalBody);
  }

  @Put('personnel-change/:id/approve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  approvePersonnelChange(
    @Param('id') id: string,
    @Body() body: {
      approver_id: string;
      decision: PersonnelChangeStatus;
      approval_note?: string;
    },
  ) {
    return this.complianceService.approvePersonnelChange(id, body.approver_id, body.decision, body.approval_note);
  }

  @Get('personnel-change')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER)
  getPersonnelChanges(
    @Query('org_id') orgId?: string,
    @Query('case_id') caseId?: string,
    @Query('change_type') changeType?: PersonnelChangeType,
    @Query('status') status?: PersonnelChangeStatus,
    @Query('applicant_id') applicantId?: string,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.complianceService.getPersonnelChanges({
      org_id: finalOrgId,
      case_id: caseId,
      change_type: changeType,
      status,
      applicant_id: applicantId,
    });
  }

  @Get('personnel-change/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER)
  getPersonnelChangeById(@Param('id') id: string) {
    return this.complianceService.getPersonnelChangeById(id);
  }

  @Get('personnel-change/:caseId/pending-check')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER)
  checkPendingPersonnelChange(@Param('caseId') caseId: string) {
    return this.complianceService.checkPendingPersonnelChange(caseId);
  }

  // ========== 结案归档合规管控接口 ==========

  @Post('case-archive/:caseId/check')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER)
  checkCaseArchive(@Param('caseId') caseId: string) {
    return this.complianceService.checkCaseArchive(caseId);
  }

  @Get('case-archive/:caseId/preview')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER)
  previewCaseArchive(@Param('caseId') caseId: string) {
    return this.complianceService.previewCaseArchive(caseId);
  }

  @Post('case-archive/:caseId/archive')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER)
  executeArchive(
    @Param('caseId') caseId: string,
    @Body() body: { operator_id: string },
  ) {
    return this.complianceService.executeArchive(caseId, body.operator_id);
  }

  @Get('case-archive/:caseId/export')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER)
  exportCaseArchive(@Param('caseId') caseId: string) {
    return this.complianceService.exportCaseArchive(caseId);
  }

  @Get('case-archive')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER)
  searchCaseArchives(
    @Query('org_id') orgId?: string,
    @Query('keyword') keyword?: string,
    @Query('archive_status') archiveStatus?: ArchiveStatus,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.complianceService.searchCaseArchives({
      org_id: finalOrgId,
      keyword,
      archive_status: archiveStatus,
      start_date: startDate,
      end_date: endDate,
    });
  }

  @Get('case-archive/case/:caseId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER)
  getCaseArchiveByCaseId(@Param('caseId') caseId: string) {
    return this.complianceService.getCaseArchiveByCaseId(caseId);
  }

  @Get('case-archive/detail/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER)
  getCaseArchiveDetail(@Param('id') id: string) {
    return this.complianceService.getCaseArchiveDetail(id);
  }
}
