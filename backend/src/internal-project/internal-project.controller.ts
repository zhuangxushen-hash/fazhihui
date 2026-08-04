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
import { InternalProjectService } from './internal-project.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

@Controller('internal-projects')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER, UserRole.ASSISTANT)
export class InternalProjectController {
  constructor(private readonly projectService: InternalProjectService) {}

  // 查询内部项目列表
  @Get()
  async findList(
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
    @Query('name') name: string,
    @Query('status') status: string,
    @Query('type') type: string,
    @Request() req: any,
  ) {
    return this.projectService.findList({
      organization_id: req?.user?.organization_id,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 10,
      name,
      status,
      type,
    });
  }

  // 查询内部项目详情
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.projectService.findOne(id);
  }

  // 创建内部项目
  @Post()
  async create(@Body() body: any, @Request() req: any) {
    return this.projectService.create({
      ...body,
      organization_id: body.organization_id || req?.user?.organization_id,
      manager_id: body.manager_id || req?.user?.id,
    });
  }

  // 更新内部项目
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.projectService.update(id, body);
  }

  // 删除内部项目
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.projectService.remove(id);
    return { message: '删除成功' };
  }
}
