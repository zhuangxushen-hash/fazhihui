import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { RoleService } from './role.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RoleController {
  constructor(private roleService: RoleService) {}

  @Post()
  create(@Body() body: any, @Request() req: any) {
    return this.roleService.create({
      ...body,
      organization_id: req.user.organization_id,
    });
  }

  @Get()
  findAll(@Request() req: any) {
    return this.roleService.findAll(req.user.organization_id);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.roleService.findById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.roleService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.roleService.delete(id);
  }

  @Put(':id/toggle-status')
  toggleStatus(@Param('id') id: string) {
    return this.roleService.toggleStatus(id);
  }
}
