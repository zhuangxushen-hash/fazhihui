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
} from '@nestjs/common';
import { WorklogService } from './worklog.service';
import { Worklog } from './worklog.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

@Controller('worklogs')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.MARKETING, UserRole.SALES, UserRole.LAWYER, UserRole.ASSISTANT, UserRole.FINANCE)
export class WorklogController {
  constructor(private readonly worklogService: WorklogService) {}

  // 查询工作日志列表
  @Get()
  findAll(
    @Query('user_id') userId: string,
    @Query('case_id') caseId: string,
    @Query('status') status: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req: any,
  ) {
    const orgId = req?.user?.organization_id;
    return this.worklogService.findAll(orgId, {
      user_id: userId,
      case_id: caseId,
      status,
      startDate,
      endDate,
    });
  }

  // 工时统计（注意：此路由需在 :id 路由之前声明，避免 stats 被当作 id）
  @Get('stats')
  getStats(
    @Query('user_id') userId: string,
    @Query('case_id') caseId: string,
    @Query('status') status: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req: any,
  ) {
    const orgId = req?.user?.organization_id;
    return this.worklogService.getStats(orgId, {
      user_id: userId,
      case_id: caseId,
      status,
      startDate,
      endDate,
    });
  }

  // 工时打印数据：按时间段筛选工时记录，按用户分组聚合（注意：此路由需在 :id 路由之前声明）
  @Get('print')
  getPrintData(
    @Query('user_id') userId: string,
    @Query('status') status: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req: any,
  ) {
    const orgId = req?.user?.organization_id;
    return this.worklogService.getPrintData(orgId, {
      user_id: userId,
      status,
      startDate,
      endDate,
    });
  }

  // 查询我的工作日志（按当前登录用户）
  @Get('mine')
  findByUser(
    @Query('case_id') caseId: string,
    @Query('status') status: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req: any,
  ) {
    const userId = req?.user?.id;
    return this.worklogService.findByUser(userId, {
      case_id: caseId,
      status,
      startDate,
      endDate,
    });
  }

  // 创建工作日志
  @Post()
  create(@Body() body: Partial<Worklog>, @Request() req: any) {
    const userId = req?.user?.id;
    const orgId = req?.user?.organization_id;
    return this.worklogService.create(userId, orgId, body);
  }

  // 日程转工作日志：根据日程ID生成一条工作日志
  @Post('convert-schedule/:scheduleId')
  convertFromSchedule(
    @Param('scheduleId') scheduleId: string,
    @Request() req: any,
  ) {
    const userId = req?.user?.id;
    const orgId = req?.user?.organization_id;
    return this.worklogService.convertFromSchedule(
      scheduleId,
      userId,
      orgId,
    );
  }

  // 更新工作日志（仅草稿可编辑）
  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<Worklog>) {
    return this.worklogService.update(id, body);
  }

  // 提交工作日志：草稿 -> 已提交
  @Put(':id/submit')
  submit(@Param('id') id: string) {
    return this.worklogService.submit(id);
  }

  // 审批通过：已提交 -> 已通过
  @Put(':id/approve')
  approve(
    @Param('id') id: string,
    @Body() body: { comment?: string },
    @Request() req: any,
  ) {
    const approverId = req?.user?.id;
    return this.worklogService.approve(id, approverId, body?.comment);
  }

  // 驳回：已提交 -> 已驳回
  @Put(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() body: { comment?: string },
    @Request() req: any,
  ) {
    const approverId = req?.user?.id;
    return this.worklogService.reject(id, approverId, body?.comment);
  }

  // 删除工作日志
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.worklogService.delete(id);
  }
}
