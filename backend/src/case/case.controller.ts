import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, NotFoundException, ForbiddenException, UseInterceptors, UploadedFile, BadRequestException, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as fs from 'fs';
import { CaseService } from './case.service';
import { LegalDocumentService } from './legal-document.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
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
  create(
    @Body() dto: CreateCaseDto,
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    return this.caseService.create(dto, organizationId);
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
  async generateContract(
    @Body() body: { case_id: string; template_id: string },
    @Request() req?: any,
  ) {
    const existing = await this.caseService.findById(body.case_id);
    if (!existing) throw new NotFoundException('案件不存在');
    if (req?.user?.organization_id && existing.organization_id !== req.user.organization_id) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.legalDocumentService.generateContract(body.case_id, body.template_id);
  }

  // 批量生成文书：body 接收 { case_ids: string[], template_id }
  @Post('documents/batch-generate')
  async batchGenerate(
    @Body() body: { case_ids: string[]; template_id: string },
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    for (const caseId of body.case_ids) {
      const existing = await this.caseService.findById(caseId);
      if (!existing) throw new NotFoundException(`案件 ${caseId} 不存在`);
      if (organizationId && existing.organization_id !== organizationId) {
        throw new ForbiddenException(`无权访问案件 ${caseId}`);
      }
    }
    return this.legalDocumentService.batchGenerate(body.case_ids, body.template_id);
  }

  @Get(':id')
  async findById(@Param('id') id: string, @Request() req?: any) {
    const existing = await this.caseService.findById(id);
    if (!existing) throw new NotFoundException('案件不存在');
    if (req?.user?.organization_id && existing.organization_id !== req.user.organization_id) {
      throw new ForbiddenException('无权访问该资源');
    }
    return existing;
  }

  // 删除案件（软删除，保留数据可回滚）
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req?: any) {
    await this.caseService.softDelete(id, req?.user);
    return { success: true };
  }

  // 案件详情聚合（概要/当事人/团队/时间节点/费用/文档）
  @Get(':id/detail')
  async findDetail(@Param('id') id: string, @Request() req?: any) {
    const existing = await this.caseService.findById(id);
    if (!existing) throw new NotFoundException('案件不存在');
    if (req?.user?.organization_id && existing.organization_id !== req.user.organization_id) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.caseService.findDetail(id);
  }

  // 详情编辑更新（参考金助理案件编辑能力）
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCaseDto,
    @Request() req?: any,
  ) {
    return this.caseService.update(id, dto, req?.user);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: CaseStatus },
    @Request() req?: any,
  ) {
    const existing = await this.caseService.findById(id);
    if (!existing) throw new NotFoundException('案件不存在');
    if (req?.user?.organization_id && existing.organization_id !== req.user.organization_id) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.caseService.updateStatus(id, body.status);
  }

  @Put(':id/assign')
  async assignLawyer(
    @Param('id') id: string,
    @Body() body: { lawyer_id: string },
    @Request() req?: any,
  ) {
    const existing = await this.caseService.findById(id);
    if (!existing) throw new NotFoundException('案件不存在');
    if (req?.user?.organization_id && existing.organization_id !== req.user.organization_id) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.caseService.assignLawyer(id, body.lawyer_id);
  }

  @Put(':id/deadline')
  async updateDeadline(
    @Param('id') id: string,
    @Body() body: { deadline: Date },
    @Request() req?: any,
  ) {
    const existing = await this.caseService.findById(id);
    if (!existing) throw new NotFoundException('案件不存在');
    if (req?.user?.organization_id && existing.organization_id !== req.user.organization_id) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.caseService.updateDeadline(id, body.deadline);
  }

  @Post(':id/documents')
  async uploadDocument(
    @Param('id') id: string,
    @Body() body: { name: string; file_path: string; file_type?: string; uploaded_by_id: string },
    @Request() req?: any,
  ) {
    const existing = await this.caseService.findById(id);
    if (!existing) throw new NotFoundException('案件不存在');
    if (req?.user?.organization_id && existing.organization_id !== req.user.organization_id) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.caseService.uploadDocument(id, body);
  }

  @Get(':id/documents')
  async getDocuments(@Param('id') id: string, @Request() req?: any) {
    const existing = await this.caseService.findById(id);
    if (!existing) throw new NotFoundException('案件不存在');
    if (req?.user?.organization_id && existing.organization_id !== req.user.organization_id) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.caseService.getDocuments(id);
  }

  // 案件文档真实文件上传（multipart）：保存文件并创建文档记录
  @Post(':id/documents/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocumentFile(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { doc_type?: string; name?: string },
    @Request() req?: any,
  ) {
    const existing = await this.caseService.findById(id);
    if (!existing) throw new NotFoundException('案件不存在');
    if (req?.user?.organization_id && existing.organization_id !== req.user.organization_id) {
      throw new ForbiddenException('无权访问该资源');
    }
    if (!file) {
      throw new BadRequestException('未上传文件');
    }
    return this.caseService.uploadDocumentFile(id, file, req?.user?.id, body.doc_type, body.name);
  }

  // 案件文档下载（回流保存的本地文件）
  @Get(':id/documents/:docId/download')
  async downloadDocument(
    @Param('id') id: string,
    @Param('docId') docId: string,
    @Res() res: Response,
  ) {
    const fileInfo = await this.caseService.getDocumentForDownload(docId);
    res.setHeader('Content-Type', fileInfo.mime);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileInfo.name)}"`);
    const fileStream = fs.createReadStream(fileInfo.path);
    fileStream.pipe(res);
  }

  @Post(':id/close')
  async closeCase(@Param('id') id: string, @Request() req?: any) {
    const existing = await this.caseService.findById(id);
    if (!existing) throw new NotFoundException('案件不存在');
    if (req?.user?.organization_id && existing.organization_id !== req.user.organization_id) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.caseService.closeCase(id);
  }

  @Put(':id/risk')
  async updateRiskLevel(
    @Param('id') id: string,
    @Body() body: { risk_level: string; risk_notes?: string },
    @Request() req?: any,
  ) {
    const existing = await this.caseService.findById(id);
    if (!existing) throw new NotFoundException('案件不存在');
    if (req?.user?.organization_id && existing.organization_id !== req.user.organization_id) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.caseService.updateRiskLevel(id, body.risk_level, body.risk_notes);
  }

  // 案件变更
  @Put(':id/change')
  async changeCase(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Request() req?: any,
  ) {
    const existing = await this.caseService.findById(id);
    if (!existing) throw new NotFoundException('案件不存在');
    if (req?.user?.organization_id && existing.organization_id !== req.user.organization_id) {
      throw new ForbiddenException('无权访问该资源');
    }
    const operatorId = req?.user?.id;
    return this.caseService.changeCase(id, body?.reason, operatorId);
  }

  // 案件解约
  @Put(':id/terminate')
  async terminateCase(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Request() req?: any,
  ) {
    const existing = await this.caseService.findById(id);
    if (!existing) throw new NotFoundException('案件不存在');
    if (req?.user?.organization_id && existing.organization_id !== req.user.organization_id) {
      throw new ForbiddenException('无权访问该资源');
    }
    const operatorId = req?.user?.id;
    return this.caseService.terminateCase(id, body?.reason, operatorId);
  }

  // 案件作废
  @Put(':id/void')
  async voidCase(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Request() req?: any,
  ) {
    const existing = await this.caseService.findById(id);
    if (!existing) throw new NotFoundException('案件不存在');
    if (req?.user?.organization_id && existing.organization_id !== req.user.organization_id) {
      throw new ForbiddenException('无权访问该资源');
    }
    const operatorId = req?.user?.id;
    return this.caseService.voidCase(id, body?.reason, operatorId);
  }

  @Post('check-overdue')
  checkOverdue() {
    return this.caseService.checkOverdue();
  }

  // 出函：出庭函/所函
  @Post(':id/generate-letter')
  async generateLetter(
    @Param('id') id: string,
    @Body() body: { type: string },
    @Request() req?: any,
  ) {
    const existing = await this.caseService.findById(id);
    if (!existing) throw new NotFoundException('案件不存在');
    if (req?.user?.organization_id && existing.organization_id !== req.user.organization_id) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.caseService.generateLetter(id, body?.type);
  }

  // 生成结案报告
  @Post(':id/close-report')
  async closeCaseReport(@Param('id') id: string, @Request() req?: any) {
    const existing = await this.caseService.findById(id);
    if (!existing) throw new NotFoundException('案件不存在');
    if (req?.user?.organization_id && existing.organization_id !== req.user.organization_id) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.caseService.closeCaseReport(id);
  }

  // 结案归档
  @Post(':id/archive')
  async archiveCase(@Param('id') id: string, @Request() req?: any) {
    const existing = await this.caseService.findById(id);
    if (!existing) throw new NotFoundException('案件不存在');
    if (req?.user?.organization_id && existing.organization_id !== req.user.organization_id) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.caseService.archiveCase(id);
  }

  // 项目导出（返回案件详细信息用于前端导出）
  @Get(':id/export')
  async exportProject(@Param('id') id: string, @Request() req?: any) {
    const existing = await this.caseService.findById(id);
    if (!existing) throw new NotFoundException('案件不存在');
    if (req?.user?.organization_id && existing.organization_id !== req.user.organization_id) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.caseService.exportProject(id);
  }

  // 批量分配项目（将多个案件分配给同一律师）
  @Post('batch-assign')
  async batchAssign(
    @Body() body: { case_ids: string[]; lawyer_id: string },
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    for (const caseId of body.case_ids) {
      const existing = await this.caseService.findById(caseId);
      if (!existing) throw new NotFoundException(`案件 ${caseId} 不存在`);
      if (organizationId && existing.organization_id !== organizationId) {
        throw new ForbiddenException(`无权访问案件 ${caseId}`);
      }
    }
    return this.caseService.batchAssign(body.case_ids, body.lawyer_id);
  }

  // 13.8 缺口6: 批量结案（将多个案件批量结案）
  @Post('batch-close')
  async batchClose(
    @Body() body: { case_ids: string[] },
    @Request() req?: any,
  ) {
    if (!body?.case_ids?.length) {
      throw new NotFoundException('请选择要结案的案件');
    }
    const organizationId = req?.user?.organization_id;
    for (const caseId of body.case_ids) {
      const existing = await this.caseService.findById(caseId);
      if (!existing) throw new NotFoundException(`案件 ${caseId} 不存在`);
      if (organizationId && existing.organization_id !== organizationId) {
        throw new ForbiddenException(`无权访问案件 ${caseId}`);
      }
    }
    return this.caseService.batchClose(body.case_ids);
  }

  // 13.8 缺口6: 批量归档（将多个案件批量归档）
  @Post('batch-archive')
  async batchArchive(
    @Body() body: { case_ids: string[] },
    @Request() req?: any,
  ) {
    if (!body?.case_ids?.length) {
      throw new NotFoundException('请选择要归档的案件');
    }
    const organizationId = req?.user?.organization_id;
    for (const caseId of body.case_ids) {
      const existing = await this.caseService.findById(caseId);
      if (!existing) throw new NotFoundException(`案件 ${caseId} 不存在`);
      if (organizationId && existing.organization_id !== organizationId) {
        throw new ForbiddenException(`无权访问案件 ${caseId}`);
      }
    }
    return this.caseService.batchArchive(body.case_ids);
  }

  // 提交审批
  @Post(':id/submit-approval')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER)
  async submitApproval(@Param('id') id: string, @Request() req?: any) {
    const existing = await this.caseService.findById(id);
    if (!existing) throw new NotFoundException('案件不存在');
    if (req?.user?.organization_id && existing.organization_id !== req.user.organization_id) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.caseService.submitApproval(id);
  }

  // 审批通过
  @Post(':id/approve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  async approve(
    @Param('id') id: string,
    @Body() body: { approver_id: string; comment?: string },
    @Request() req?: any,
  ) {
    const existing = await this.caseService.findById(id);
    if (!existing) throw new NotFoundException('案件不存在');
    if (req?.user?.organization_id && existing.organization_id !== req.user.organization_id) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.caseService.approve(id, body.approver_id, body.comment);
  }

  // 审批驳回
  @Post(':id/reject')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  async reject(
    @Param('id') id: string,
    @Body() body: { approver_id: string; comment?: string },
    @Request() req?: any,
  ) {
    const existing = await this.caseService.findById(id);
    if (!existing) throw new NotFoundException('案件不存在');
    if (req?.user?.organization_id && existing.organization_id !== req.user.organization_id) {
      throw new ForbiddenException('无权访问该资源');
    }
    return this.caseService.reject(id, body.approver_id, body.comment);
  }
}
