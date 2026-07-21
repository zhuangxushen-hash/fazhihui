import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CaseService } from './case.service';
import { CaseStatus, CaseType } from '../types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('cases')
@UseGuards(JwtAuthGuard)
export class CaseController {
  constructor(private caseService: CaseService) {}

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
  ) {
    return this.caseService.findAll(orgId, { status, case_type, assignee_lawyer_id, page, limit, case_no, client_name });
  }

  @Get('overdue')
  getOverdueCases(@Query('org_id') orgId: string) {
    return this.caseService.getOverdueCases(orgId);
  }

  @Get('high-risk')
  getHighRiskCases(@Query('org_id') orgId: string) {
    return this.caseService.getHighRiskCases(orgId);
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

  @Post('check-overdue')
  checkOverdue() {
    return this.caseService.checkOverdue();
  }
}
