import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ChatArchiveService } from './chat-archive.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('scrm/chat-archives')
@UseGuards(JwtAuthGuard)
export class ChatArchiveController {
  constructor(private chatArchiveService: ChatArchiveService) {}

  @Post()
  create(@Body() body: any) {
    return this.chatArchiveService.create(body);
  }

  @Get()
  findAll(
    @Query('org_id') orgId?: string,
    @Query('client_id') client_id?: string,
    @Query('employee_id') employee_id?: string,
    @Query('message_type') message_type?: string,
  ) {
    return this.chatArchiveService.findAll(orgId, { client_id, employee_id, message_type });
  }

  @Get('search')
  search(
    @Query('org_id') org_id?: string,
    @Query('client_id') client_id?: string,
    @Query('employee_id') employee_id?: string,
    @Query('message_type') message_type?: string,
    @Query('keyword') keyword?: string,
    @Query('start_time') start_time?: string,
    @Query('end_time') end_time?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.chatArchiveService.search({
      org_id, client_id, employee_id, message_type,
      keyword, start_time, end_time, page, limit,
    });
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.chatArchiveService.findById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.chatArchiveService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.chatArchiveService.delete(id);
  }

  @Post(':id/sync-compliance')
  syncToCompliance(@Param('id') id: string, @Request() req) {
    const operatorId = req.user?.id;
    return this.chatArchiveService.syncToCompliance(id, operatorId);
  }

  @Post('batch-sync-compliance')
  batchSyncToCompliance(
    @Body() body: { org_id: string; limit?: number },
    @Request() req,
  ) {
    const operatorId = req.user?.id;
    return this.chatArchiveService.batchSyncToCompliance(body.org_id, operatorId, body.limit);
  }
}
