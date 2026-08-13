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
import { DifficultCaseService } from './difficult-case.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

@Controller()
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER, UserRole.ASSISTANT, UserRole.SALES, UserRole.MARKETING)
export class DifficultCaseController {
  constructor(private readonly caseService: DifficultCaseService) {}

  // 查询疑难案件列表
  @Get('difficult-cases')
  async findList(
    @Query('keyword') keyword: string,
    @Query('case_type') caseType: string,
    @Query('difficulty_level') difficultyLevel: string,
    @Request() req: any,
  ) {
    const organizationId = req?.user?.organization_id;
    return this.caseService.findList({
      organization_id: organizationId,
      keyword,
      case_type: caseType,
      difficulty_level: difficultyLevel,
    });
  }

  // 统计汇总
  @Get('difficult-cases/stats')
  async getStats(@Request() req: any) {
    const organizationId = req?.user?.organization_id;
    return this.caseService.getStats(organizationId);
  }

  // 创建疑难案件
  @Post('difficult-cases')
  async create(@Body() body: any, @Request() req: any) {
    const organizationId = body.organization_id || req?.user?.organization_id;
    return this.caseService.create({ ...body, organization_id: organizationId }, req?.user?.id);
  }

  // 发起讨论
  @Post('difficult-cases/:id/discussions')
  async addDiscussion(
    @Param('id') id: string,
    @Body() body: { content: string },
    @Request() req: any,
  ) {
    if (!body.content) {
      return this.caseService.addDiscussion(id, req?.user?.id, '');
    }
    return this.caseService.addDiscussion(id, req?.user?.id, body.content);
  }

  // 添加解决方案
  @Post('difficult-cases/:id/solutions')
  async addSolution(
    @Param('id') id: string,
    @Body() body: { content: string },
    @Request() req: any,
  ) {
    if (!body.content) {
      return this.caseService.addSolution(id, req?.user?.id, '');
    }
    return this.caseService.addSolution(id, req?.user?.id, body.content);
  }

  // 更新案件
  @Put('difficult-cases/:id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.caseService.update(id, body);
  }

  // 删除案件
  @Delete('difficult-cases/:id')
  async remove(@Param('id') id: string) {
    await this.caseService.remove(id);
    return { message: '删除成功' };
  }
}
