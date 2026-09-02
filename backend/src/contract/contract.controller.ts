import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ContractService } from './contract.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

@Controller('contracts')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER, UserRole.ASSISTANT, UserRole.FINANCE, UserRole.SALES)
export class ContractController {
  constructor(private contractService: ContractService) {}

  // 创建合同
  @Post()
  create(@Body() body: any, @Request() req: any) {
    const orgId = body.organization_id || req?.user?.organization_id;
    return this.contractService.create({ ...body, organization_id: orgId });
  }

  // 查询合同列表（扩展为12个查询条件，对齐金助理）
  @Get()
  findAll(
    @Query('org_id') orgId: string,
    @Query('type') type?: string,
    @Query('stage') stage?: string,
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
    @Query('contract_type') contract_type?: string,
    @Query('project_role') project_role?: string,
    @Query('lawyer_id') lawyer_id?: string,
    @Query('electronic_seal_status') electronic_seal_status?: string,
    @Query('paper_seal_status') paper_seal_status?: string,
    @Query('approval_status') approval_status?: string,
    @Query('return_status') return_status?: string,
    @Query('seal_usage_status') seal_usage_status?: string,
    @Query('approval_time') approval_time?: string,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
    @Query('document_keyword') document_keyword?: string,
    @Query('case_id') caseId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.contractService.findAll(finalOrgId, {
      type,
      stage,
      status,
      keyword,
      contract_type,
      project_role,
      lawyer_id,
      electronic_seal_status,
      paper_seal_status,
      approval_status,
      return_status,
      seal_usage_status,
      approval_time,
      start_date,
      end_date,
      document_keyword,
      case_id: caseId,
      page,
      limit,
    });
  }

  // 查询合同详情
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.contractService.findById(id);
  }

  // 更新合同
  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.contractService.update(id, body);
  }

  // 删除合同
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contractService.remove(id);
  }

  // 审查合同
  @Put(':id/review')
  review(@Param('id') id: string, @Body() body: { remarks?: string }) {
    return this.contractService.review(id, body?.remarks);
  }

  // 签订合同
  @Put(':id/sign')
  sign(@Param('id') id: string, @Body() body: { sign_date?: Date; start_date?: Date; end_date?: Date; remarks?: string }) {
    return this.contractService.sign(id, body);
  }

  // 变更合同
  @Put(':id/change')
  change(@Param('id') id: string, @Body() body: { data?: any; remarks?: string }) {
    return this.contractService.change(id, body?.data || {}, body?.remarks);
  }

  // 解约
  @Put(':id/terminate')
  terminate(@Param('id') id: string, @Body() body: { remarks?: string }) {
    return this.contractService.terminate(id, body?.remarks);
  }

  // 作废
  @Put(':id/void')
  void(@Param('id') id: string, @Body() body: { remarks?: string }) {
    return this.contractService.void(id, body?.remarks);
  }

  // 合同更正
  @Put(':id/correct')
  correct(@Param('id') id: string, @Body() body: { reason: string; content: string; operator_id: string }) {
    return this.contractService.correct(id, body);
  }

  // 原件回收登记
  @Put(':id/receive-original')
  receiveOriginal(@Param('id') id: string) {
    return this.contractService.receiveOriginal(id);
  }

  // 分配比例确认
  @Put(':id/confirm-allocation')
  confirmAllocation(@Param('id') id: string, @Body() body: { ratio: Array<{ role: string; ratio: number }> }) {
    return this.contractService.confirmAllocation(id, body?.ratio);
  }

  // ==================== 合同用印状态更新接口（对齐金助理） ====================

  // 更新电子章状态
  @Put(':id/electronic-seal')
  updateElectronicSeal(
    @Param('id') id: string,
    @Body() body: { status: string; operator_id?: string },
  ) {
    return this.contractService.updateElectronicSeal(id, body.status, body.operator_id);
  }

  // 更新纸质章状态
  @Put(':id/paper-seal')
  updatePaperSeal(
    @Param('id') id: string,
    @Body() body: { status: string; operator_id?: string },
  ) {
    return this.contractService.updatePaperSeal(id, body.status, body.operator_id);
  }

  // 更新用印状态（unused→pending→approved→used→voided）
  @Put(':id/seal-usage')
  updateSealUsage(
    @Param('id') id: string,
    @Body() body: { status: string; seal_apply_method?: string; operator_id?: string },
  ) {
    return this.contractService.updateSealUsage(id, body.status, body.seal_apply_method, body.operator_id);
  }

  // ==================== 合同审批接口（对齐金助理） ====================

  // 提交合同审批
  @Put(':id/submit-approval')
  submitApproval(@Param('id') id: string) {
    return this.contractService.submitApproval(id);
  }

  // 合同审批通过
  @Put(':id/approve')
  approve(
    @Param('id') id: string,
    @Body() body: { approver_id: string; comment?: string },
  ) {
    return this.contractService.approve(id, body.approver_id, body.comment);
  }

  // 合同审批退回
  @Put(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() body: { approver_id: string; comment?: string },
  ) {
    return this.contractService.reject(id, body.approver_id, body.comment);
  }

  // ==================== 合同交回管理接口（对齐金助理） ====================

  // 登记合同交回
  @Put(':id/return')
  returnContract(
    @Param('id') id: string,
    @Body() body: { returner_id: string; return_time?: Date },
  ) {
    return this.contractService.returnContract(id, body.returner_id, body.return_time);
  }

  // 撤销合同交回
  @Put(':id/unreturn')
  unreturnContract(@Param('id') id: string) {
    return this.contractService.unreturnContract(id);
  }
}
