import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CooperativeSourceService } from './cooperative-source.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

@Controller()
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER, UserRole.ASSISTANT, UserRole.SALES, UserRole.MARKETING)
export class CooperativeSourceController {
  constructor(private readonly sourceService: CooperativeSourceService) {}

  // 查询协作案源列表
  @Get('cooperative-sources')
  async findList(
    @Query('keyword') keyword: string,
    @Query('cooperation_type') cooperationType: string,
    @Query('status') status: string,
    @Request() req: any,
  ) {
    const organizationId = req?.user?.organization_id;
    return this.sourceService.findList({ organization_id: organizationId, keyword, cooperation_type: cooperationType, status });
  }

  // 统计汇总
  @Get('cooperative-sources/stats')
  async getStats(@Request() req: any) {
    const organizationId = req?.user?.organization_id;
    return this.sourceService.getStats(organizationId);
  }

  // 创建协作案源
  @Post('cooperative-sources')
  async create(@Body() body: any, @Request() req: any) {
    const organizationId = body.organization_id || req?.user?.organization_id;
    return this.sourceService.create({ ...body, organization_id: organizationId }, req?.user?.id);
  }

  // 更新状态
  @Put('cooperative-sources/:id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.sourceService.updateStatus(id, body.status);
  }

  // 结案
  @Put('cooperative-sources/:id/close')
  async close(@Param('id') id: string, @Body() body: { close_reason?: string }) {
    return this.sourceService.close(id, body.close_reason);
  }
}
