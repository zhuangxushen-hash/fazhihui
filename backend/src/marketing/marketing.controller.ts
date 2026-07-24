import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { MarketingService } from './marketing.service';
import { ComplianceResult } from '../types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('marketing')
@UseGuards(JwtAuthGuard)
export class MarketingController {
  constructor(private marketingService: MarketingService) {}

  @Post('materials')
  uploadMaterial(@Body() body: {
    name: string;
    file_path: string;
    file_type?: string;
    size?: number;
    tags?: string;
    platform?: string;
    organization_id: string;
    uploaded_by_id: string;
  }) {
    return this.marketingService.uploadMaterial(body);
  }

  @Post('materials/:id/compliance')
  checkMaterialCompliance(@Param('id') id: string) {
    return this.marketingService.checkMaterialCompliance(id);
  }

  @Get('materials')
  findMaterials(
    @Query('org_id') orgId: string,
    @Query('platform') platform?: string,
    @Query('is_ai_generated') is_ai_generated?: boolean,
    @Query('compliance_result') compliance_result?: ComplianceResult,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.marketingService.findMaterials(finalOrgId, { platform, is_ai_generated, compliance_result });
  }

  @Delete('materials/:id')
  deleteMaterial(@Param('id') id: string) {
    return this.marketingService.deleteMaterial(id);
  }

  @Post('content/ai-generate')
  generateAIContent(@Body() body: { prompt: string; case_type?: string }) {
    return this.marketingService.generateAIContent(body.prompt, body.case_type);
  }
}
