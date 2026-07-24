import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { AdPlanService } from './ad-plan.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdPlanStatus } from '../types';

/**
 * 投放计划管理控制器
 * 权限：投放岗(marketing) / 管理员(super_admin, org_admin)
 */
@Controller('ad-plans')
@UseGuards(JwtAuthGuard)
export class AdPlanController {
  constructor(private adPlanService: AdPlanService) {}

  // 权限校验：仅投放岗/管理员可操作
  private checkPermission(req: any): void {
    const allowedRoles = ['super_admin', 'org_admin', 'marketing'];
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new ForbiddenException('无操作权限，仅投放岗或管理员可操作投放计划');
    }
  }

  // ========== 计划 CRUD ==========

  @Post()
  async create(
    @Body() body: {
      account_id: string;
      plan_name: string;
      case_type: string;
      budget?: number;
      bid?: number;
      status?: AdPlanStatus;
      platform_plan_id?: string;
      start_date?: string;
      end_date?: string;
    },
    @Request() req: any,
  ) {
    this.checkPermission(req);
    return this.adPlanService.create(
      {
        ...body,
        start_date: body.start_date ? new Date(body.start_date) : undefined,
        end_date: body.end_date ? new Date(body.end_date) : undefined,
        organization_id: req.user.organization_id,
        creator_id: req.user.id,
      },
      req.user.id,
    );
  }

  @Get()
  async findAll(
    @Query('org_id') orgId: string,
    @Query('account_id') accountId?: string,
    @Query('case_type') caseType?: string,
    @Query('status') status?: AdPlanStatus,
    @Query('keyword') keyword?: string,
    @Query('platform') platform?: string,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.adPlanService.findPlans(finalOrgId, {
      account_id: accountId,
      case_type: caseType,
      status,
      keyword,
      platform,
    });
  }

  @Get(':id/logs')
  async findLogs(@Param('id') id: string) {
    return this.adPlanService.findLogs(id);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.adPlanService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: Partial<{
      account_id: string;
      plan_name: string;
      case_type: string;
      budget: number;
      bid: number;
      status: AdPlanStatus;
      platform_plan_id: string;
      start_date: string;
      end_date: string;
    }>,
    @Request() req: any,
  ) {
    this.checkPermission(req);
    const data: any = { ...body };
    if (body.start_date) data.start_date = new Date(body.start_date);
    if (body.end_date) data.end_date = new Date(body.end_date);
    return this.adPlanService.update(id, data, req.user.id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    this.checkPermission(req);
    await this.adPlanService.delete(id, req.user.id);
    return { success: true };
  }

  // ========== 单项操作 ==========

  @Put(':id/budget')
  async adjustBudget(
    @Param('id') id: string,
    @Body() body: { budget: number },
    @Request() req: any,
  ) {
    this.checkPermission(req);
    return this.adPlanService.adjustBudget(id, body.budget, req.user.id);
  }

  @Put(':id/bid')
  async adjustBid(
    @Param('id') id: string,
    @Body() body: { bid: number },
    @Request() req: any,
  ) {
    this.checkPermission(req);
    return this.adPlanService.adjustBid(id, body.bid, req.user.id);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: AdPlanStatus },
    @Request() req: any,
  ) {
    this.checkPermission(req);
    return this.adPlanService.batchUpdateStatus([id], body.status, req.user.id);
  }

  // ========== 批量操作 ==========

  @Post('batch/status')
  async batchUpdateStatus(
    @Body() body: { plan_ids: string[]; status: AdPlanStatus },
    @Request() req: any,
  ) {
    this.checkPermission(req);
    return this.adPlanService.batchUpdateStatus(body.plan_ids, body.status, req.user.id);
  }

  @Post('batch/budget')
  async batchAdjustBudget(
    @Body() body: { plan_ids: string[]; budget: number },
    @Request() req: any,
  ) {
    this.checkPermission(req);
    return this.adPlanService.batchAdjustBudget(body.plan_ids, body.budget, req.user.id);
  }

  // ========== 复制 / 迁移 ==========

  @Post(':id/copy')
  async copyPlan(
    @Param('id') id: string,
    @Body() body: { new_plan_name?: string },
    @Request() req: any,
  ) {
    this.checkPermission(req);
    return this.adPlanService.copyPlan(id, body?.new_plan_name, req.user.id);
  }

  @Put(':id/migrate')
  async migratePlan(
    @Param('id') id: string,
    @Body() body: { target_account_id: string },
    @Request() req: any,
  ) {
    this.checkPermission(req);
    return this.adPlanService.migratePlan(id, body.target_account_id, req.user.id);
  }
}
