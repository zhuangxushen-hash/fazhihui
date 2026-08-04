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
import { ArchiveVolumeService } from './archive-volume.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

@Controller('archive-volumes')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER, UserRole.ASSISTANT)
export class ArchiveVolumeController {
  constructor(private readonly volumeService: ArchiveVolumeService) {}

  // 查询卷宗列表
  @Get()
  async findList(
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
    @Query('case_id') case_id: string,
    @Query('status') status: string,
    @Query('borrower_id') borrower_id: string,
    @Request() req: any,
  ) {
    return this.volumeService.findList({
      organization_id: req?.user?.organization_id,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 10,
      case_id,
      status,
      borrower_id,
    });
  }

  // 查询卷宗详情
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.volumeService.findOne(id);
  }

  // 创建卷宗归档记录
  @Post()
  async create(@Body() body: any, @Request() req: any) {
    return this.volumeService.create({
      ...body,
      organization_id: body.organization_id || req?.user?.organization_id,
    });
  }

  // 借阅申请
  @Post(':id/borrow')
  async borrow(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.volumeService.borrow(id, {
      ...body,
      borrower_id: body.borrower_id || req?.user?.id,
    });
  }

  // 上传卷宗文件
  @Post(':id/upload')
  async upload(@Param('id') id: string, @Body() body: any) {
    return this.volumeService.upload(id, body.file_url);
  }

  // 更新卷宗
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.volumeService.update(id, body);
  }
}
