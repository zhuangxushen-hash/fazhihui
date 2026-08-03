import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { MenuService } from './menu.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

@Controller('menus')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
export class MenuController {
  constructor(private menuService: MenuService) {}

  @Post()
  create(@Body() body: any) {
    return this.menuService.create(body);
  }

  @Get()
  findAll() {
    return this.menuService.findAll();
  }

  @Get('tree')
  getMenuTree() {
    return this.menuService.getMenuTree();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.menuService.findById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.menuService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.menuService.delete(id);
  }

  @Put(':id/toggle-visibility')
  toggleVisibility(@Param('id') id: string) {
    return this.menuService.toggleVisibility(id);
  }
}
