import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('marketing/copy')
  generateCopy(@Body() body: { prompt: string; case_type?: string; platform?: string }) {
    return {
      content: this.aiService.generateMarketingCopy(body.prompt, body.case_type, body.platform),
    };
  }

  @Post('marketing/script')
  generateScript(@Body() body: { prompt: string; case_type?: string }) {
    return {
      script: this.aiService.generateVideoScript(body.prompt, body.case_type),
    };
  }

  @Post('legal/document')
  generateDocument(@Body() body: { type: string; data: any }) {
    return {
      document: this.aiService.generateLegalDocument(body.type, body.data),
    };
  }

  @Post('legal/risk-analysis')
  analyzeRisk(@Body() body: { case_type?: string; description?: string; case_data?: any }) {
    const caseData = body.case_data || {
      case_type: body.case_type,
      description: body.description,
    };
    return this.aiService.analyzeCaseRisk(caseData);
  }
}
