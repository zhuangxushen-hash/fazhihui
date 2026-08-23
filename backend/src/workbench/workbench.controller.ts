import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { WorkbenchService } from './workbench.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

// 个人工作台控制器：聚合个人待办/今日日程/待写日志/待办审批等数据
@Controller('workbench')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.MARKETING, UserRole.SALES, UserRole.LAWYER, UserRole.ASSISTANT, UserRole.FINANCE)
export class WorkbenchController {
  constructor(private readonly workbenchService: WorkbenchService) {}

  // 个人工作台聚合概览
  @Get('summary')
  getSummary(@Request() req: any) {
    const userId = req?.user?.id;
    const orgId = req?.user?.organization_id;
    return this.workbenchService.getSummary(userId, orgId);
  }
}
