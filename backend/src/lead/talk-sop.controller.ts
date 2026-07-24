import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { TalkSOPService } from './talk-sop.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TalkSOPNodeType } from './talk-sop.entity';

@Controller('talk-sop')
@UseGuards(JwtAuthGuard)
export class TalkSOPController {
  constructor(private readonly talkSOPService: TalkSOPService) {}

  // ==================== SOP模板管理接口 ====================

  // 创建SOP模板
  @Post()
  async createSOP(
    @Request() req: any,
    @Body() body: {
      name: string;
      case_type?: string;
      nodes?: Array<{
        node_id?: string;
        node_name: string;
        node_type?: TalkSOPNodeType;
        is_required?: boolean;
        order?: number;
        description?: string;
      }>;
      is_default?: boolean;
    },
  ) {
    return this.talkSOPService.createSOP(
      req.user.userId,
      body.name,
      body.case_type,
      body.nodes,
      body.is_default,
    );
  }

  // 编辑SOP模板
  @Put(':id')
  async updateSOP(
    @Param('id') sopId: string,
    @Request() req: any,
    @Body() body: {
      name?: string;
      case_type?: string;
      nodes?: Array<{
        node_id?: string;
        node_name: string;
        node_type?: TalkSOPNodeType;
        is_required?: boolean;
        order?: number;
        description?: string;
      }>;
      is_default?: boolean;
    },
  ) {
    return this.talkSOPService.updateSOP(
      sopId,
      req.user.userId,
      body.name,
      body.case_type,
      body.nodes,
      body.is_default,
    );
  }

  // 删除SOP模板
  @Delete(':id')
  async deleteSOP(
    @Param('id') sopId: string,
    @Request() req: any,
  ) {
    return this.talkSOPService.deleteSOP(sopId, req.user.userId);
  }

  // 查询SOP模板列表
  @Get()
  async getSOPList(
    @Query('case_type') caseType?: string,
    @Query('enabled') enabled?: string,
  ) {
    const enabledBool = enabled !== undefined ? enabled === 'true' : undefined;
    return this.talkSOPService.getSOPList(caseType, enabledBool);
  }

  // 获取SOP详情
  @Get(':id')
  async getSOPDetail(@Param('id') sopId: string) {
    return this.talkSOPService.getSOPDetail(sopId);
  }

  // 设置默认SOP
  @Post(':id/set-default')
  async setDefaultSOP(
    @Param('id') sopId: string,
    @Request() req: any,
  ) {
    return this.talkSOPService.setDefaultSOP(sopId, req.user.userId);
  }

  // 启用/禁用SOP
  @Post(':id/toggle-enabled')
  async toggleSOPEnabled(
    @Param('id') sopId: string,
    @Request() req: any,
    @Body() body: { enabled: boolean },
  ) {
    return this.talkSOPService.toggleSOPEnabled(sopId, req.user.userId, body.enabled);
  }

  // ==================== SOP节点完成状态追踪接口 ====================

  // 获取商机的SOP进度
  @Get('opportunity/:opportunityId/progress')
  async getOpportunitySOPProgress(
    @Param('opportunityId') opportunityId: string,
    @Request() req: any,
  ) {
    return this.talkSOPService.getOpportunitySOPProgress(opportunityId, req.user.userId);
  }

  // 完成单个节点
  @Post('opportunity/:opportunityId/node/:nodeId/complete')
  async completeNode(
    @Param('opportunityId') opportunityId: string,
    @Param('nodeId') nodeId: string,
    @Request() req: any,
  ) {
    return this.talkSOPService.completeNode(opportunityId, nodeId, req.user.userId);
  }

  // 取消完成节点
  @Post('opportunity/:opportunityId/node/:nodeId/uncomplete')
  async uncompleteNode(
    @Param('opportunityId') opportunityId: string,
    @Param('nodeId') nodeId: string,
    @Request() req: any,
  ) {
    return this.talkSOPService.uncompleteNode(opportunityId, nodeId, req.user.userId);
  }

  // 获取SOP完成百分比
  @Get('opportunity/:opportunityId/completion')
  async getSOPCompletionPercentage(
    @Param('opportunityId') opportunityId: string,
    @Request() req: any,
  ) {
    return this.talkSOPService.getSOPCompletionPercentage(opportunityId, req.user.userId);
  }
}