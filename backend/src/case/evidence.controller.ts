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
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  Res,
  Request,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { EvidenceService } from './evidence.service';
import { EvidenceType, EvidenceCategory } from '../types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import * as fs from 'fs';

@Controller('evidences')
@UseGuards(JwtAuthGuard)
export class EvidenceController {
  constructor(private evidenceService: EvidenceService) {}

  // 获取证据列表（按组织，支持筛选和分页）
  @Get()
  async findAll(
    @Query('org_id') orgId: string,
    @Query('type') type?: EvidenceType,
    @Query('category') category?: EvidenceCategory,
    @Query('is_archived') is_archived?: string,
    @Query('case_id') case_id?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.evidenceService.findAll(finalOrgId, {
      type: type as EvidenceType,
      category: category as EvidenceCategory,
      is_archived: is_archived === 'true' ? true : is_archived === 'false' ? false : undefined,
      case_id,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  // 单文件上传
  @Post('upload/:caseId')
  @UseInterceptors(FileInterceptor('file'))
  async uploadEvidence(
    @Param('caseId') caseId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: {
      upload_by_id: string;
      name?: string;
      type?: EvidenceType;
      category?: EvidenceCategory;
      description?: string;
    },
  ) {
    if (!file) {
      throw new BadRequestException('未上传文件');
    }

    return this.evidenceService.uploadEvidence(caseId, file, body.upload_by_id, {
      name: body.name,
      type: body.type as EvidenceType,
      category: body.category as EvidenceCategory,
      description: body.description,
    });
  }

  // 批量上传
  @Post('batch-upload/:caseId')
  @UseInterceptors(FilesInterceptor('files', 20))
  async batchUploadEvidence(
    @Param('caseId') caseId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: {
      upload_by_id: string;
      type?: EvidenceType;
      category?: EvidenceCategory;
    },
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('未上传文件');
    }

    return this.evidenceService.batchUploadEvidence(
      caseId,
      files,
      body.upload_by_id,
      {
        type: body.type as EvidenceType,
        category: body.category as EvidenceCategory,
      },
    );
  }

  // 获取证据列表
  @Get('case/:caseId')
  async getEvidenceList(
    @Param('caseId') caseId: string,
    @Query('type') type?: EvidenceType,
    @Query('category') category?: EvidenceCategory,
    @Query('is_archived') is_archived?: string,
  ) {
    return this.evidenceService.getEvidenceList(caseId, {
      type: type as EvidenceType,
      category: category as EvidenceCategory,
      is_archived: is_archived === 'true' ? true : is_archived === 'false' ? false : undefined,
    });
  }

  // 获取证据详情
  @Get(':id')
  async getEvidenceDetail(@Param('id') id: string) {
    return this.evidenceService.getEvidenceDetail(id);
  }

  // 更新证据分类标注
  @Put(':id/category')
  async updateEvidenceCategory(
    @Param('id') id: string,
    @Body() body: {
      type?: EvidenceType;
      category?: EvidenceCategory;
      description?: string;
      name?: string;
    },
  ) {
    return this.evidenceService.updateEvidenceCategory(id, body);
  }

  // 上传新版本
  @Post(':id/version')
  @UseInterceptors(FileInterceptor('file'))
  async uploadNewVersion(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { upload_by_id: string },
  ) {
    if (!file) {
      throw new BadRequestException('未上传文件');
    }

    return this.evidenceService.uploadNewVersion(id, file, body.upload_by_id);
  }

  // 归档证据（软删除）
  @Put(':id/archive')
  async archiveEvidence(@Param('id') id: string) {
    return this.evidenceService.archiveEvidence(id);
  }

  // 恢复证据
  @Put(':id/restore')
  async restoreEvidence(@Param('id') id: string) {
    return this.evidenceService.restoreEvidence(id);
  }

  // 物理删除证据
  @Delete(':id')
  async deleteEvidence(@Param('id') id: string) {
    await this.evidenceService.deleteEvidenceFile(id);
    return { message: '证据已删除' };
  }

  // 生成证据目录
  @Get('catalog/:caseId')
  async generateEvidenceCatalog(@Param('caseId') caseId: string) {
    return this.evidenceService.generateEvidenceCatalog(caseId);
  }

  // 文件预览/下载
  @Get(':id/preview')
  async previewFile(@Param('id') id: string, @Res() res: Response) {
    const fileInfo = await this.evidenceService.getFilePreviewPath(id);

    // 设置响应头
    res.setHeader('Content-Type', fileInfo.mime_type);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileInfo.name)}"`);

    // 流式传输文件
    const fileStream = fs.createReadStream(fileInfo.path);
    fileStream.pipe(res);
  }

  // 文件下载
  @Get(':id/download')
  async downloadFile(@Param('id') id: string, @Res() res: Response) {
    const fileInfo = await this.evidenceService.getFilePreviewPath(id);

    // 设置响应头，强制下载
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileInfo.name)}"`);

    // 流式传输文件
    const fileStream = fs.createReadStream(fileInfo.path);
    fileStream.pipe(res);
  }

  // 批量归档
  @Put('batch/archive')
  async batchArchiveEvidence(@Body() body: { ids: string[] }) {
    await this.evidenceService.batchArchiveEvidence(body.ids);
    return { message: '批量归档成功' };
  }

  // 批量修改分类
  @Put('batch/category')
  async batchUpdateCategory(
    @Body() body: {
      ids: string[];
      type?: EvidenceType;
      category?: EvidenceCategory;
    },
  ) {
    await this.evidenceService.batchUpdateCategory(body.ids, {
      type: body.type,
      category: body.category,
    });
    return { message: '批量修改成功' };
  }
}