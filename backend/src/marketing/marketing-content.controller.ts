import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ContentGeneratorService, GenerateContentDto } from './content-generator.service';
import {
  MarketingComplianceService,
  PrecheckContentDto,
} from './marketing-compliance.service';
import { MaterialService } from './material.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/**
 * AI 营销内容生成 + 合规预审控制器（Task 1.5 + 1.6）
 */
@Controller('marketing-content')
@UseGuards(JwtAuthGuard)
export class MarketingContentController {
  constructor(
    private contentGeneratorService: ContentGeneratorService,
    private marketingComplianceService: MarketingComplianceService,
    private materialService: MaterialService,
  ) {}

  // ============ Task 1.5.1: 内容模板查询 ============

  @Get('templates')
  findTemplates(
    @Query('case_type') case_type?: string,
    @Query('content_type') content_type?: string,
    @Query('is_active') is_active?: string,
  ) {
    return this.contentGeneratorService.findTemplates({
      case_type,
      content_type,
      is_active: is_active === undefined ? undefined : is_active === 'true',
    });
  }

  @Get('templates/:id')
  findTemplateById(@Param('id') id: string) {
    return this.contentGeneratorService.findTemplateById(id);
  }

  // ============ Task 1.5.2: AI 内容生成 ============

  @Post('generate')
  generateContent(@Body() body: GenerateContentDto) {
    return this.contentGeneratorService.generateContent(body);
  }

  // ============ Task 1.5.3: 生成内容一键入库素材库 ============

  @Post('save-to-material')
  saveToMaterial(@Body() body: {
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

  // ============ Task 1.6.1 + 1.6.2: 合规预审 ============

  @Post('compliance-precheck')
  precheckCompliance(@Body() body: PrecheckContentDto) {
    return this.marketingComplianceService.precheckContent(body);
  }

  @Get('compliance/:materialId')
  getMaterialCompliance(@Param('materialId') materialId: string) {
    return this.marketingComplianceService.getMaterialComplianceResult(materialId);
  }

  // ============ Task 1.6.3: 素材绑定投放计划前置校验 ============

  @Get('bind-check/:materialId')
  validateMaterialForBinding(@Param('materialId') materialId: string) {
    return this.marketingComplianceService.validateMaterialForPlanBinding(materialId);
  }
}
