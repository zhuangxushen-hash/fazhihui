import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { SealService } from './seal.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

@Controller()
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER, UserRole.ASSISTANT)
export class SealController {
  constructor(private sealService: SealService) {}

  // ===================== 印章管理 =====================

  @Get('seals')
  findAllSeals(@Request() req: any) {
    return this.sealService.findAllSeals(req.user.organization_id);
  }

  @Post('seals')
  createSeal(@Body() body: any, @Request() req: any) {
    return this.sealService.createSeal({
      ...body,
      organization_id: req.user.organization_id,
    });
  }

  @Get('seals/:id')
  findSealById(@Param('id') id: string) {
    return this.sealService.findSealById(id);
  }

  @Put('seals/:id')
  updateSeal(@Param('id') id: string, @Body() body: any) {
    return this.sealService.updateSeal(id, body);
  }

  @Delete('seals/:id')
  deleteSeal(@Param('id') id: string) {
    return this.sealService.deleteSeal(id);
  }

  @Put('seals/:id/toggle-status')
  toggleSealStatus(@Param('id') id: string) {
    return this.sealService.toggleSealStatus(id);
  }

  // ===================== 用印申请（9个查询条件 + 作废收回接口 + 纸质/电子用印区分） =====================

  @Get('seal-applications')
  findApplications(
    @Query('status') status: string,
    @Query('seal_medium') seal_medium?: string,
    @Query('document_type') document_type?: string,
    @Query('document_category') document_category?: string,
    @Query('void_status') void_status?: string,
    @Query('keyword') keyword?: string,
    @Query('creator_id') creator_id?: string,
    @Query('apply_date_start') apply_date_start?: string,
    @Query('apply_date_end') apply_date_end?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Request() req?: any,
  ) {
    return this.sealService.findApplications(req.user.organization_id, {
      status,
      seal_medium,
      document_type,
      document_category,
      void_status,
      keyword,
      creator_id,
      apply_date_start,
      apply_date_end,
      page,
      limit,
    });
  }

  @Post('seal-applications')
  createApplication(@Body() body: any, @Request() req: any) {
    return this.sealService.createApplication({
      ...body,
      applicant_id: req.user.id,
      organization_id: req.user.organization_id,
      apply_time: body.apply_time || new Date(),
    });
  }

  @Put('seal-applications/:id')
  updateApplication(@Param('id') id: string, @Body() body: any) {
    return this.sealService.updateApplication(id, body);
  }

  @Put('seal-applications/:id/approve')
  approveApplication(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.sealService.approveApplication(id, req.user.id, body?.approve_comment);
  }

  @Put('seal-applications/:id/reject')
  rejectApplication(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.sealService.rejectApplication(id, req.user.id, body?.approve_comment);
  }

  @Put('seal-applications/:id/use')
  useApplication(@Param('id') id: string, @Request() req: any) {
    return this.sealService.useApplication(id, req.user.id);
  }

  @Put('seal-applications/batch-use')
  batchUseApplications(@Body() body: { ids: string[] }, @Request() req: any) {
    return this.sealService.batchUseApplications(body.ids, req.user.id);
  }

  // 批量作废用印申请
  @Post('seal-applications/batch-void')
  batchVoidApplications(@Body() body: { ids: string[]; reason?: string }, @Request() req: any) {
    return this.sealService.batchVoid(body.ids || [], body.reason, req.user.id);
  }

  // 单个作废用印申请
  @Put('seal-applications/:id/void')
  voidApplication(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @Request() req: any,
  ) {
    return this.sealService.voidApplication(id, body?.reason, req.user.id);
  }

  // 收回已作废的用印文档
  @Put('seal-applications/:id/recover')
  recoverApplication(@Param('id') id: string, @Request() req: any) {
    return this.sealService.recoverApplication(id, req.user.id);
  }

  // ===================== 盖章记录（支持按纸质/电子筛选） =====================

  @Get('seal-records')
  findRecords(
    @Query('seal_medium') seal_medium?: string,
    @Query('keyword') keyword?: string,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Request() req?: any,
  ) {
    return this.sealService.findRecords(req.user.organization_id, {
      seal_medium,
      keyword,
      start_date,
      end_date,
      page,
      limit,
    });
  }
}
