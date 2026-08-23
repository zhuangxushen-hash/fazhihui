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
import { DocumentItemService } from './document.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

@Controller('documents')
@UseGuards(JwtAuthGuard)
@Roles(
  UserRole.SUPER_ADMIN,
  UserRole.ORG_ADMIN,
  UserRole.LAWYER,
  UserRole.ASSISTANT,
  UserRole.SALES,
  UserRole.MARKETING,
  UserRole.FINANCE,
)
export class DocumentItemController {
  constructor(private readonly documentService: DocumentItemService) {}

  // 查询文档列表
  @Get()
  async findList(
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
    @Query('name') name: string,
    @Query('category') category: string,
    @Query('case_id') case_id: string,
    @Query('scope') scope: string,
    @Request() req: any,
  ) {
    return this.documentService.findList({
      organization_id: req?.user?.organization_id,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 10,
      name,
      category,
      case_id,
      scope,
    });
  }

  // 查询文档详情
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.documentService.findOne(id);
  }

  // 创建文档（含文件上传URL）
  @Post()
  async create(@Body() body: any, @Request() req: any) {
    return this.documentService.create({
      ...body,
      uploader_id: body.uploader_id || req?.user?.id,
      organization_id: body.organization_id || req?.user?.organization_id,
    });
  }

  // 更新文档
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.documentService.update(id, body);
  }

  // 删除文档
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.documentService.remove(id);
    return { message: '删除成功' };
  }

  // ========== 文档版本管理 ==========

  // 创建文档版本
  @Post(':id/versions')
  async createVersion(
    @Param('id') id: string,
    @Body() body: { file_url?: string; file_type?: string; file_size?: number; description?: string },
    @Request() req: any,
  ) {
    return this.documentService.createVersion({
      document_id: id,
      file_url: body.file_url,
      file_type: body.file_type,
      file_size: body.file_size,
      description: body.description,
      creator_id: req?.user?.id,
      organization_id: req?.user?.organization_id,
    });
  }

  // 查询文档版本列表
  @Get(':id/versions')
  async getVersions(@Param('id') id: string) {
    return this.documentService.getVersions(id);
  }

  // 回滚到指定版本
  @Post(':id/versions/:versionId/rollback')
  async rollbackToVersion(@Param('id') id: string, @Param('versionId') versionId: string) {
    return this.documentService.rollbackToVersion(id, versionId);
  }
}
