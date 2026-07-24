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
import { MaterialService, CreateAdMaterialDto, UpdateEffectDto, MaterialRankingFilters, MaterialRankMetric } from './material.service';
import { AdMaterial } from './ad-material.entity';
import { AdMaterialType, AdMaterialStatus, MaterialComplianceStatus } from '../types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ad-materials')
@UseGuards(JwtAuthGuard)
export class MaterialController {
  constructor(private materialService: MaterialService) {}

  @Post()
  create(@Body() body: CreateAdMaterialDto) {
    return this.materialService.create(body);
  }

  /**
   * Task 1.5.3：AI 生成内容一键保存到素材库（自动打标签）
   */
  @Post('save-generated')
  saveGeneratedContent(@Body() body: {
    title: string;
    content: string;
    case_type: string;
    content_type: string;
    tags?: string[];
    organization_id: string;
    uploaded_by_id: string;
    channel?: string;
  }) {
    return this.materialService.saveGeneratedContent(body);
  }

  @Get()
  findMaterials(
    @Query('org_id') orgId: string,
    @Query('type') type?: AdMaterialType,
    @Query('tag') tag?: string,
    @Query('status') status?: AdMaterialStatus,
    @Query('channel') channel?: string,
    @Query('account_id') account_id?: string,
    @Query('plan_id') plan_id?: string,
    @Query('compliance_status') compliance_status?: MaterialComplianceStatus,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    const filters: MaterialRankingFilters = {};
    if (type) filters.type = type;
    if (tag) filters.tag = tag;
    if (status) filters.status = status;
    if (channel) filters.channel = channel;
    if (account_id) filters.account_id = account_id;
    if (plan_id) filters.plan_id = plan_id;
    if (compliance_status) filters.compliance_status = compliance_status;
    return this.materialService.findMaterials(finalOrgId, filters);
  }

  @Get('tags')
  getAllTags(@Query('org_id') orgId: string, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.materialService.getAllTags(finalOrgId);
  }

  @Get('ranking')
  getRanking(
    @Query('org_id') orgId: string,
    @Query('metric') metric: MaterialRankMetric = 'roi',
    @Query('limit') limit?: number,
    @Query('high_threshold') high_threshold?: number,
    @Query('low_threshold') low_threshold?: number,
    @Query('type') type?: AdMaterialType,
    @Query('tag') tag?: string,
    @Query('status') status?: AdMaterialStatus,
    @Query('channel') channel?: string,
    @Query('account_id') account_id?: string,
    @Query('plan_id') plan_id?: string,
    @Query('compliance_status') compliance_status?: MaterialComplianceStatus,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    const filters: MaterialRankingFilters = {};
    if (type) filters.type = type;
    if (tag) filters.tag = tag;
    if (status) filters.status = status;
    if (channel) filters.channel = channel;
    if (account_id) filters.account_id = account_id;
    if (plan_id) filters.plan_id = plan_id;
    if (compliance_status) filters.compliance_status = compliance_status;
    return this.materialService.getRanking(
      finalOrgId,
      metric,
      filters,
      limit ? parseInt(String(limit), 10) : 20,
      high_threshold ? Number(high_threshold) : undefined,
      low_threshold ? Number(low_threshold) : undefined,
    );
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.materialService.findById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<AdMaterial>) {
    return this.materialService.update(id, body);
  }

  @Put(':id/effect')
  updateEffect(@Param('id') id: string, @Body() body: UpdateEffectDto) {
    return this.materialService.updateEffect(id, body);
  }

  /**
   * Task 1.6.3：素材绑定投放计划（前置校验合规状态）
   */
  @Put(':id/bind-plan')
  bindToPlan(@Param('id') id: string, @Body() body: { plan_id: string }) {
    return this.materialService.bindToPlan(id, body.plan_id);
  }

  @Post(':id/tags')
  addTag(@Param('id') id: string, @Body() body: { tag: string }) {
    return this.materialService.addTag(id, body.tag);
  }

  @Delete(':id/tags/:tag')
  removeTag(@Param('id') id: string, @Param('tag') tag: string) {
    return this.materialService.removeTag(id, tag);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.materialService.delete(id);
  }
}
