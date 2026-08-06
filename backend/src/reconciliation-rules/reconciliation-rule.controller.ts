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
  Req,
} from '@nestjs/common';
import { ReconciliationRuleService } from './reconciliation-rule.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

/**
 * 自动对账规则控制器
 * 权限：管理员(super_admin, org_admin) / 财务岗(finance)
 */
@Controller('reconciliation-rules')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.FINANCE)
export class ReconciliationRuleController {
  constructor(
    private readonly reconciliationRuleService: ReconciliationRuleService,
  ) {}

  // 查询对账规则列表，支持按启用状态筛选
  @Get()
  async findAll(
    @Query('is_active') isActive: string,
    @Req() req: any,
  ) {
    const orgId = req.user.organization_id;
    const active =
      isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.reconciliationRuleService.findByOrg(orgId, { isActive: active });
  }

  // 查询对账规则详情
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.reconciliationRuleService.findById(id);
  }

  // 创建对账规则
  @Post()
  async create(
    @Body() body: {
      rule_name: string;
      match_fields: string[];
      match_condition?: string;
      priority?: number;
      is_active?: boolean;
    },
    @Req() req: any,
  ) {
    return this.reconciliationRuleService.create({
      rule_name: body.rule_name,
      match_fields: body.match_fields,
      match_condition: body.match_condition,
      priority: body.priority !== undefined ? body.priority : 100,
      is_active: body.is_active !== undefined ? body.is_active : true,
      organization_id: req.user.organization_id,
      created_by: req.user.id,
    } as any);
  }

  // 更新对账规则
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: {
      rule_name?: string;
      match_fields?: string[];
      match_condition?: string;
      priority?: number;
      is_active?: boolean;
    },
  ) {
    return this.reconciliationRuleService.update(id, body as any);
  }

  // 切换规则启停状态
  @Put(':id/toggle')
  async toggle(@Param('id') id: string) {
    return this.reconciliationRuleService.toggleActive(id);
  }

  // 删除对账规则
  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.reconciliationRuleService.delete(id);
    return { success: true };
  }
}
