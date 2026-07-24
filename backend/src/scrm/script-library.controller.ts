import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ScriptLibraryService } from './script-library.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('scrm/scripts')
@UseGuards(JwtAuthGuard)
export class ScriptLibraryController {
  constructor(private scriptLibraryService: ScriptLibraryService) {}

  @Post()
  create(@Body() body: any) {
    return this.scriptLibraryService.create(body);
  }

  @Get()
  findAll(
    @Query('org_id') orgId?: string,
    @Query('category') category?: string,
  ) {
    return this.scriptLibraryService.findAll(orgId, { category });
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.scriptLibraryService.findById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.scriptLibraryService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.scriptLibraryService.delete(id);
  }

  @Post(':id/send')
  sendScript(
    @Param('id') id: string,
    @Body() body: { client_id: string; employee_id: string },
  ) {
    return this.scriptLibraryService.sendScript(id, body);
  }
}
