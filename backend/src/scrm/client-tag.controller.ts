import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ClientTagService } from './client-tag.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('scrm/client-tags')
@UseGuards(JwtAuthGuard)
export class ClientTagController {
  constructor(private clientTagService: ClientTagService) {}

  @Post()
  createTag(@Body() body: any) {
    return this.clientTagService.createTag(body);
  }

  @Get()
  findAllTags(
    @Query('org_id') orgId?: string,
    @Query('tag_type') tag_type?: string,
    @Query('category') category?: string,
  ) {
    return this.clientTagService.findAllTags(orgId, { tag_type, category });
  }

  @Get(':id')
  findTagById(@Param('id') id: string) {
    return this.clientTagService.findTagById(id);
  }

  @Put(':id')
  updateTag(@Param('id') id: string, @Body() body: any) {
    return this.clientTagService.updateTag(id, body);
  }

  @Delete(':id')
  deleteTag(@Param('id') id: string) {
    return this.clientTagService.deleteTag(id);
  }

  @Post('relations')
  tagClient(@Body() body: any) {
    return this.clientTagService.tagClient(body);
  }

  @Post('relations/batch')
  batchTagClients(@Body() body: any) {
    return this.clientTagService.batchTagClients(body);
  }

  @Delete('relations/:clientId/:tagId')
  untagClient(@Param('clientId') clientId: string, @Param('tagId') tagId: string) {
    return this.clientTagService.untagClient(clientId, tagId);
  }

  @Get('relations/client/:clientId')
  getClientTags(@Param('clientId') clientId: string) {
    return this.clientTagService.getClientTags(clientId);
  }

  @Get('relations/tag/:tagId')
  getClientsByTag(@Param('tagId') tagId: string) {
    return this.clientTagService.getClientsByTag(tagId);
  }

  @Post('auto-tag/:clientId')
  autoTagClient(
    @Param('clientId') clientId: string,
    @Body() body: any,
  ) {
    return this.clientTagService.autoTagClient(clientId, body);
  }
}
