import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PushRuleService } from './push-rule.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

/**
 * 案件节点推送规则配置控制器
 * 供前端推送规则配置页面（PushRuleConfig）调用
 */
@Controller('case-push-notifications')
@UseGuards(JwtAuthGuard)
@Roles(
  UserRole.SUPER_ADMIN,
  UserRole.ORG_ADMIN,
  UserRole.MARKETING,
  UserRole.SALES,
  UserRole.LAWYER,
  UserRole.ASSISTANT,
  UserRole.FINANCE,
)
export class PushRuleController {
  constructor(private readonly pushRuleService: PushRuleService) {}

  // 获取全部推送规则（org_id 优先取 query，否则取登录用户所属组织）
  @Get('rules')
  findRules(@Query('org_id') orgId: string, @Request() req: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.pushRuleService.findRules(finalOrgId);
  }

  // 获取单个节点推送规则
  @Get('rules/:nodeType')
  findRule(@Param('nodeType') nodeType: string, @Request() req: any) {
    const finalOrgId = req?.user?.organization_id;
    return this.pushRuleService.findRule(finalOrgId, nodeType);
  }

  // 批量更新推送规则
  // 注意：必须定义在 PUT rules/:nodeType 之前，否则 batch 会被识别为 :nodeType
  @Put('rules/batch')
  batchUpdate(
    @Body() body: { rules: Array<{ node_type: string }> },
    @Request() req: any,
  ) {
    const finalOrgId = req?.user?.organization_id;
    return this.pushRuleService.batchUpdateRules(finalOrgId, body.rules || []);
  }

  // 更新单个节点推送规则
  @Put('rules/:nodeType')
  updateRule(
    @Param('nodeType') nodeType: string,
    @Body()
    body: {
      enabled?: boolean;
      content_template?: string;
      channels?: string[];
    },
    @Request() req: any,
  ) {
    const finalOrgId = req?.user?.organization_id;
    return this.pushRuleService.updateRule(finalOrgId, nodeType, body);
  }
}
