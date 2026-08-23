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
import { NumberRuleService } from './number-rule.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

// 编号规则配置：按组织配置案件/合同/法律文书/归档编号规则
@Controller('number-rules')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
export class NumberRuleController {
  constructor(private readonly numberRuleService: NumberRuleService) {}

  // ==================== 编号规则 ====================

  // 规则列表（可按编号类型筛选）
  @Get('rules')
  listRules(
    @Query('numberType') numberType: string,
    @Request() req: any,
  ) {
    const orgId = req?.user?.organization_id;
    return this.numberRuleService.listRules(orgId, numberType);
  }

  // 新建规则
  @Post('rules')
  createRule(@Body() body: any, @Request() req: any) {
    const orgId = req?.user?.organization_id;
    return this.numberRuleService.createRule(orgId, body);
  }

  // 更新规则
  @Put('rules/:id')
  updateRule(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    const orgId = req?.user?.organization_id;
    return this.numberRuleService.updateRule(orgId, id, body);
  }

  // 删除规则
  @Delete('rules/:id')
  deleteRule(@Param('id') id: string, @Request() req: any) {
    const orgId = req?.user?.organization_id;
    return this.numberRuleService.deleteRule(orgId, id);
  }

  // 预览编号（不消耗流水）
  @Post('preview')
  preview(@Body() body: any, @Request() req: any) {
    const orgId = req?.user?.organization_id;
    return this.numberRuleService.preview(orgId, body);
  }

  // ==================== 编号部门 ====================

  // 部门列表
  @Get('departments')
  listDepartments(@Request() req: any) {
    const orgId = req?.user?.organization_id;
    return this.numberRuleService.listDepartments(orgId);
  }

  // 新建部门
  @Post('departments')
  createDepartment(@Body() body: any, @Request() req: any) {
    const orgId = req?.user?.organization_id;
    return this.numberRuleService.createDepartment(orgId, body);
  }

  // 更新部门
  @Put('departments/:id')
  updateDepartment(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    const orgId = req?.user?.organization_id;
    return this.numberRuleService.updateDepartment(orgId, id, body);
  }

  // 删除部门
  @Delete('departments/:id')
  deleteDepartment(@Param('id') id: string, @Request() req: any) {
    const orgId = req?.user?.organization_id;
    return this.numberRuleService.deleteDepartment(orgId, id);
  }
}
