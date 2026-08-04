import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ComprehensiveService } from './comprehensive.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

@Controller('comprehensive')
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
export class ComprehensiveController {
  constructor(private readonly comprehensiveService: ComprehensiveService) {}

  // 综合查询，按 type 路由到不同数据源
  @Get('query')
  async query(
    @Query('type') type: string,
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
    @Query('keyword') keyword: string,
    @Query('date_from') date_from: string,
    @Query('date_to') date_to: string,
    @Request() req: any,
  ) {
    return this.comprehensiveService.query({
      organization_id: req?.user?.organization_id,
      type,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 10,
      keyword,
      date_from,
      date_to,
    });
  }
}
