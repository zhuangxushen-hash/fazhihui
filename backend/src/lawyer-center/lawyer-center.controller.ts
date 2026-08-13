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
import { LawyerCenterService } from './lawyer-center.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

@Controller()
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER, UserRole.ASSISTANT, UserRole.SALES, UserRole.MARKETING)
export class LawyerCenterController {
  constructor(private readonly lawyerService: LawyerCenterService) {}

  // 查询组织内律师列表
  @Get('lawyers')
  async findLawyers(
    @Query('name') name: string,
    @Query('level') level: string,
    @Query('page') page: string,
    @Query('page_size') pageSize: string,
    @Request() req: any,
  ) {
    const organizationId = req?.user?.organization_id;
    return this.lawyerService.findLawyers(organizationId, {
      name,
      level,
      page: page ? Number(page) : undefined,
      page_size: pageSize ? Number(pageSize) : undefined,
    });
  }

  // 律师主页聚合信息
  @Get('lawyers/:id')
  async getLawyerHome(@Param('id') id: string, @Request() req: any) {
    const organizationId = req?.user?.organization_id;
    return this.lawyerService.getLawyerHome(organizationId, id);
  }

  // 评级管理列表
  @Get('lawyer-ratings')
  async findRatings(
    @Query('level') level: string,
    @Query('keyword') keyword: string,
    @Query('page') page: string,
    @Query('page_size') pageSize: string,
    @Request() req: any,
  ) {
    const organizationId = req?.user?.organization_id;
    return this.lawyerService.findRatings(organizationId, {
      level,
      keyword,
      page: page ? Number(page) : undefined,
      page_size: pageSize ? Number(pageSize) : undefined,
    });
  }

  // 提交评级
  @Post('lawyer-ratings')
  async createRating(@Body() body: any, @Request() req: any) {
    const organizationId = body.organization_id || req?.user?.organization_id;
    return this.lawyerService.createRating(organizationId, req?.user?.id, body);
  }

  // 更新评级
  @Put('lawyer-ratings/:id')
  async updateRating(@Param('id') id: string, @Body() body: any) {
    return this.lawyerService.updateRating(id, body);
  }

  // 删除评级
  @Delete('lawyer-ratings/:id')
  async removeRating(@Param('id') id: string) {
    await this.lawyerService.removeRating(id);
    return { message: '删除成功' };
  }
}
