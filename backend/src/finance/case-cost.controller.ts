import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CaseCostService } from './case-cost.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

@Controller('finance/case-costs')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.FINANCE, UserRole.LAWYER, UserRole.ASSISTANT)
export class CaseCostController {
  constructor(private caseCostService: CaseCostService) {}

  // 创建成本记录
  @Post()
  async create(@Body() body: any) {
    return this.caseCostService.create(body);
  }

  // 按案件查询成本列表
  @Get('case/:caseId')
  async findByCaseId(@Param('caseId') caseId: string) {
    return this.caseCostService.findByCaseId(caseId);
  }

  // 案件成本汇总
  @Get('summary/:caseId')
  async getCaseCostSummary(@Param('caseId') caseId: string) {
    return this.caseCostService.getCaseCostSummary(caseId);
  }

  // 更新成本记录
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.caseCostService.update(id, body);
  }

  // 删除成本记录
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.caseCostService.remove(id);
    return { success: true };
  }
}
