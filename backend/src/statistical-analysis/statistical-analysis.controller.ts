import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { StatisticalAnalysisService } from './statistical-analysis.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

@Controller('statistical-analysis')
@UseGuards(JwtAuthGuard)
@Roles(
  UserRole.SUPER_ADMIN,
  UserRole.ORG_ADMIN,
  UserRole.MARKETING,
  UserRole.SALES,
  UserRole.LAWYER,
  UserRole.ASSISTANT,
  UserRole.FINANCE,
  UserRole.CLIENT,
)
export class StatisticalAnalysisController {
  constructor(private readonly statisticalAnalysisService: StatisticalAnalysisService) {}

  // 统计分析，按 type 路由到不同统计逻辑
  @Get()
  async query(
    @Query('type') type: string,
    @Query('date_from') date_from: string,
    @Query('date_to') date_to: string,
    @Request() req: any,
  ) {
    return this.statisticalAnalysisService.query({
      organization_id: req?.user?.organization_id,
      type,
      date_from,
      date_to,
    });
  }
}
