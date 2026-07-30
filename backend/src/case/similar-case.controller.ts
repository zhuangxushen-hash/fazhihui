import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { SimilarCaseService } from './similar-case.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('similar-cases')
@UseGuards(JwtAuthGuard)
export class SimilarCaseController {
  constructor(private similarCaseService: SimilarCaseService) {}

  @Post('search')
  search(
    @Body() body: {
      case_type?: string;
      amount?: number;
      court?: string;
      year?: number;
    },
    @Request() req?: any,
  ) {
    const orgId = req?.user?.organization_id;
    return this.similarCaseService.searchSimilarCases({
      ...body,
      orgId,
    });
  }

  @Get('stats')
  getStats(
    @Query('org_id') orgId: string,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.similarCaseService.getCaseMatchingStats(finalOrgId);
  }
}