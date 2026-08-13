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
import { CooperativeFirmService } from './cooperative-firm.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

@Controller('cooperative-firms')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER, UserRole.ASSISTANT, UserRole.SALES, UserRole.MARKETING)
export class CooperativeFirmController {
  constructor(private readonly firmService: CooperativeFirmService) {}

  // 查询协作律所列表
  @Get()
  async findList(
    @Query('keyword') keyword: string,
    @Query('firm_type') firmType: string,
    @Query('status') status: string,
    @Query('page') page: string,
    @Query('page_size') pageSize: string,
    @Request() req: any,
  ) {
    const organizationId = req?.user?.organization_id;
    return this.firmService.findList({
      organization_id: organizationId,
      keyword,
      firm_type: firmType,
      status,
      page: page ? Number(page) : undefined,
      page_size: pageSize ? Number(pageSize) : undefined,
    });
  }

  // 统计汇总
  @Get('stats')
  async getStats(@Request() req: any) {
    const organizationId = req?.user?.organization_id;
    return this.firmService.getStats(organizationId);
  }

  // 创建协作律所
  @Post()
  async create(@Body() body: any, @Request() req: any) {
    const organizationId = body.organization_id || req?.user?.organization_id;
    return this.firmService.create({ ...body, organization_id: organizationId });
  }

  // 更新协作律所
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.firmService.update(id, body);
  }

  // 删除协作律所
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.firmService.remove(id);
    return { message: '删除成功' };
  }
}
