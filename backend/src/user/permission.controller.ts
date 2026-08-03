import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

@Controller('permissions')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
export class PermissionController {
  constructor(private permissionService: PermissionService) {}

  @Post()
  create(@Body() body: any) {
    return this.permissionService.create(body);
  }

  @Get()
  findAll(@Query('module') module?: string) {
    return this.permissionService.findAll(module);
  }

  @Get('modules')
  getModules() {
    return this.permissionService.getModules();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.permissionService.findById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.permissionService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.permissionService.delete(id);
  }

  @Put(':id/toggle-status')
  toggleStatus(@Param('id') id: string) {
    return this.permissionService.toggleStatus(id);
  }
}
