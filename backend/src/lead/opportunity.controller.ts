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
  ParseUUIDPipe,
} from '@nestjs/common';
import { OpportunityService } from './opportunity.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OpportunityStage, OpportunityStatus } from '../types';

@Controller('opportunities')
@UseGuards(JwtAuthGuard)
export class OpportunityController {
  constructor(private readonly opportunityService: OpportunityService) {}

  @Get()
  findAll(
    @Query('org_id') orgId: string,
    @Query('stage') stage?: OpportunityStage,
    @Query('status') status?: OpportunityStatus,
    @Query('negotiator_id') negotiator_id?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.opportunityService.findAll(finalOrgId, { stage, status, negotiator_id, page, limit });
  }

  // 获取今日到所列表
  @Get('today-arrivals')
  async getTodayArrivals(@Request() req: any) {
    return this.opportunityService.getTodayArrivals(req.user.id);
  }

  // 获取待跟进商机列表
  @Get('pending')
  async getPendingOpportunities(@Request() req: any) {
    return this.opportunityService.getPendingOpportunities(req.user.id);
  }

  // 获取已签约列表
  @Get('signed')
  async getSignedOpportunities(@Request() req: any) {
    return this.opportunityService.getSignedOpportunities(req.user.id);
  }

  // 获取已流失列表
  @Get('lost')
  async getLostOpportunities(@Request() req: any) {
    return this.opportunityService.getLostOpportunities(req.user.id);
  }

  // 获取商机详情
  @Get(':id')
  async getOpportunityDetail(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Request() req: any,
  ) {
    return this.opportunityService.getOpportunityDetail(id, req.user.id);
  }

  // 创建商机
  @Post()
  async createOpportunity(
    @Request() req: any,
    @Body() body: {
      lead_id: string;
      requirement_note?: string;
      plan_note?: string;
    },
  ) {
    return this.opportunityService.createOpportunity(
      req.user.id,
      body.lead_id,
      body.requirement_note,
      body.plan_note,
    );
  }

  // 更新商机阶段
  @Put(':id/stage')
  async updateStage(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Request() req: any,
    @Body() body: {
      stage: OpportunityStage;
      remark?: string;
    },
  ) {
    return this.opportunityService.updateStage(
      id,
      req.user.id,
      body.stage,
      body.remark,
    );
  }

  // 更新商机信息
  @Put(':id/info')
  async updateOpportunityInfo(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Request() req: any,
    @Body() body: {
      requirement_note?: string;
      plan_note?: string;
    },
  ) {
    return this.opportunityService.updateOpportunityInfo(
      id,
      req.user.id,
      body.requirement_note,
      body.plan_note,
    );
  }

  // 添加报价项
  @Post(':id/quote-items')
  async addQuoteItem(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Request() req: any,
    @Body() body: {
      item_name: string;
      amount: number;
      item_description?: string;
      quantity?: number;
      remark?: string;
    },
  ) {
    return this.opportunityService.addQuoteItem(
      id,
      req.user.id,
      body.item_name,
      body.amount,
      body.item_description,
      body.quantity,
      body.remark,
    );
  }

  // 更新报价项
  @Put(':id/quote-items/:itemId')
  async updateQuoteItem(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @Request() req: any,
    @Body() body: {
      item_name?: string;
      amount?: number;
      item_description?: string;
      quantity?: number;
      remark?: string;
    },
  ) {
    return this.opportunityService.updateQuoteItem(
      id,
      itemId,
      req.user.id,
      body.item_name,
      body.amount,
      body.item_description,
      body.quantity,
      body.remark,
    );
  }

  // 删除报价项
  @Delete(':id/quote-items/:itemId')
  async deleteQuoteItem(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @Request() req: any,
  ) {
    return this.opportunityService.deleteQuoteItem(id, itemId, req.user.id);
  }

  // 签约转化（一键立案）
  @Post(':id/convert-to-case')
  async convertToCase(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Request() req: any,
    @Body() body: {
      case_type?: string;
      case_description?: string;
      service_fee?: number;
    },
  ) {
    return this.opportunityService.convertToCase(id, req.user.id, body);
  }

  // 标记为流失
  @Post(':id/mark-lost')
  async markAsLost(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Request() req: any,
    @Body() body: {
      remark?: string;
    },
  ) {
    return this.opportunityService.markAsLost(id, req.user.id, body.remark);
  }
}