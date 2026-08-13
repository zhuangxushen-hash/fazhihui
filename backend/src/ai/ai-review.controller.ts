import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AiReviewService } from './ai-review.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

@Controller('ai/review')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER, UserRole.ASSISTANT)
export class AiReviewController {
  constructor(private aiReviewService: AiReviewService) {}

  // ========== 合同审查 ==========

  // 发起合同审查
  @Post('contract')
  reviewContract(
    @Body() body: { title?: string; contract_type?: string; contract_text: string },
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    return this.aiReviewService.reviewContract({
      ...body,
      organization_id: organizationId,
      reviewer_id: req?.user?.id,
    });
  }

  // 查询合同审查记录列表
  @Get('contract')
  getContractReviews(
    @Query('risk_level') riskLevel: string,
    @Query('contract_type') contractType: string,
    @Query('page') page: string,
    @Query('page_size') pageSize: string,
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    return this.aiReviewService.getContractReviews(organizationId, {
      risk_level: riskLevel,
      contract_type: contractType,
      page: page ? Number(page) : undefined,
      page_size: pageSize ? Number(pageSize) : undefined,
    });
  }

  // 查询合同审查详情
  @Get('contract/:id')
  getContractReviewById(@Param('id') id: string) {
    return this.aiReviewService.getContractReviewById(id);
  }

  // 删除合同审查记录
  @Delete('contract/:id')
  deleteContractReview(@Param('id') id: string) {
    return this.aiReviewService.deleteContractReview(id);
  }

  // ========== 法律研究 ==========

  // 创建法律研究任务
  @Post('research')
  createResearchTask(
    @Body() body: { topic: string; keywords?: string[] },
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    return this.aiReviewService.createResearchTask({
      ...body,
      organization_id: organizationId,
      creator_id: req?.user?.id,
    });
  }

  // 查询法律研究任务列表
  @Get('research')
  getResearchTasks(
    @Query('status') status: string,
    @Query('page') page: string,
    @Query('page_size') pageSize: string,
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    return this.aiReviewService.getResearchTasks(organizationId, {
      status,
      page: page ? Number(page) : undefined,
      page_size: pageSize ? Number(pageSize) : undefined,
    });
  }

  // 查询法律研究任务详情
  @Get('research/:id')
  getResearchTaskById(@Param('id') id: string) {
    return this.aiReviewService.getResearchTaskById(id);
  }

  // 删除法律研究任务
  @Delete('research/:id')
  deleteResearchTask(@Param('id') id: string) {
    return this.aiReviewService.deleteResearchTask(id);
  }
}
