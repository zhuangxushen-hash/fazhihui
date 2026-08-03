import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { CaseService } from './case.service';
import { LegalDocumentService } from './legal-document.service';
import { CaseStatus, CaseType, UserRole} from '../types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('cases')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.SALES, UserRole.LAWYER, UserRole.ASSISTANT, UserRole.FINANCE)
export class CaseController {
  constructor(
    private caseService: CaseService,
    private legalDocumentService: LegalDocumentService,
  ) {}

  @Post()
  create(@Body() body: Partial<{
    case_type: CaseType;
    client_id: string;
    organization_id: string;
    fee_amount?: number;
    amount?: number;
    description?: string;
    case_no?: string;
    client_name?: string;
    client_phone?: string;
    court?: string;
    filing_date?: Date;
    expected_close_date?: Date;
  }>) {
    return this.caseService.create(body);
  }

  @Get()
  findAll(
    @Query('org_id') orgId: string,
    @Query('status') status?: CaseStatus,
    @Query('case_type') case_type?: CaseType,
    @Query('assignee_lawyer_id') assignee_lawyer_id?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('case_no') case_no?: string,
    @Query('client_name') client_name?: string,
    @Query('days_no_maintain') days_no_maintain?: number,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.caseService.findAll(finalOrgId, { status, case_type, assignee_lawyer_id, page, limit, case_no, client_name, days_no_maintain: Number(days_no_maintain) || undefined });
  }

  @Get('overdue')
  getOverdueCases(@Query('org_id') orgId: string, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.caseService.getOverdueCases(finalOrgId);
  }

  @Get('high-risk')
  getHighRiskCases(@Query('org_id') orgId: string, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.caseService.getHighRiskCases(finalOrgId);
  }

  // 生成委托合同：基于模板自动生成，body 接收 { case_id, template_id }
  @Post('documents/generate-contract')
  generateContract(@Body() body: { case_id: string; template_id: string }) {
    return this.legalDocumentService.generateContract(body.case_id, body.template_id);
  }

  // 批量生成文书：body 接收 { case_ids: string[], template_id }
  @Post('documents/batch-generate')
  batchGenerate(@Body() body: { case_ids: string[]; template_id: string }) {
    return this.legalDocumentService.batchGenerate(body.case_ids, body.template_id);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.caseService.findById(id);
  }

  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: CaseStatus }) {
    return this.caseService.updateStatus(id, body.status);
  }

  @Put(':id/assign')
  assignLawyer(@Param('id') id: string, @Body() body: { lawyer_id: string }) {
    return this.caseService.assignLawyer(id, body.lawyer_id);
  }

  @Put(':id/deadline')
  updateDeadline(@Param('id') id: string, @Body() body: { deadline: Date }) {
    return this.caseService.updateDeadline(id, body.deadline);
  }

  @Post(':id/documents')
  uploadDocument(
    @Param('id') id: string,
    @Body() body: { name: string; file_path: string; file_type?: string; uploaded_by_id: string },
  ) {
    return this.caseService.uploadDocument(id, body);
  }

  @Get(':id/documents')
  getDocuments(@Param('id') id: string) {
    return this.caseService.getDocuments(id);
  }

  @Post(':id/close')
  closeCase(@Param('id') id: string) {
    return this.caseService.closeCase(id);
  }

  @Put(':id/risk')
  updateRiskLevel(@Param('id') id: string, @Body() body: { risk_level: string; risk_notes?: string }) {
    return this.caseService.updateRiskLevel(id, body.risk_level, body.risk_notes);
  }

  // 案件变更
  @Put(':id/change')
  changeCase(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Request() req?: any,
  ) {
    const operatorId = req?.user?.id;
    return this.caseService.changeCase(id, body?.reason, operatorId);
  }

  // 案件解约
  @Put(':id/terminate')
  terminateCase(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Request() req?: any,
  ) {
    const operatorId = req?.user?.id;
    return this.caseService.terminateCase(id, body?.reason, operatorId);
  }

  // 案件作废
  @Put(':id/void')
  voidCase(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Request() req?: any,
  ) {
    const operatorId = req?.user?.id;
    return this.caseService.voidCase(id, body?.reason, operatorId);
  }

  @Post('check-overdue')
  checkOverdue() {
    return this.caseService.checkOverdue();
  }

  // 出函：出庭函/所函
  @Post(':id/generate-letter')
  generateLetter(
    @Param('id') id: string,
    @Body() body: { type: string },
  ) {
    return this.caseService.generateLetter(id, body?.type);
  }

  // 生成结案报告
  @Post(':id/close-report')
  closeCaseReport(@Param('id') id: string) {
    return this.caseService.closeCaseReport(id);
  }

  // 结案归档
  @Post(':id/archive')
  archiveCase(@Param('id') id: string) {
    return this.caseService.archiveCase(id);
  }

  // 项目导出（返回案件详细信息用于前端导出）
  @Get(':id/export')
  async exportProject(@Param('id') id: string) {
    return this.caseService.exportProject(id);
  }

  // 批量分配项目（将多个案件分配给同一律师）
  @Post('batch-assign')
  async batchAssign(@Body() body: { case_ids: string[]; lawyer_id: string }) {
    return this.caseService.batchAssign(body.case_ids, body.lawyer_id);
  }

  // 提交审批
  @Post(':id/submit-approval')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER)
  submitApproval(@Param('id') id: string) {
    return this.caseService.submitApproval(id);
  }

  // 审批通过
  @Post(':id/approve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  approve(
    @Param('id') id: string,
    @Body() body: { approver_id: string; comment?: string },
  ) {
    return this.caseService.approve(id, body.approver_id, body.comment);
  }

  // 审批驳回
  @Post(':id/reject')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  reject(
    @Param('id') id: string,
    @Body() body: { approver_id: string; comment?: string },
  ) {
    return this.caseService.reject(id, body.approver_id, body.comment);
  }
}
