import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { DueDiligenceService } from './due-diligence.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

@Controller()
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER)
export class DueDiligenceController {
  constructor(private readonly ddService: DueDiligenceService) {}

  // 发起尽调查询
  @Post('due-diligences')
  async create(
    @Body() body: { company_name: string; query_type: string; organization_id?: string; template_id?: string },
    @Request() req: any,
  ) {
    return this.ddService.create({
      company_name: body.company_name,
      query_type: body.query_type,
      operator_id: req?.user?.id,
      organization_id: body.organization_id || req?.user?.organization_id,
      template_id: body.template_id,
    });
  }

  // 查询尽调记录列表
  @Get('due-diligences')
  async findAll(
    @Query('org_id') orgId: string,
    @Query('keyword') keyword?: string,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.ddService.findAll(finalOrgId, keyword);
  }

  // 查询单条尽调详情
  @Get('due-diligences/:id')
  async findOne(@Param('id') id: string) {
    return this.ddService.findOne(id);
  }
}
