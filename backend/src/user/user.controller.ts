import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

@Controller('users')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  findAll(@Query('org_id') orgId?: string, @Query('name') name?: string, @Query('phone') phone?: string, @Query('role') role?: string, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.userService.findAll(finalOrgId, name, phone, role);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.MARKETING, UserRole.SALES, UserRole.LAWYER, UserRole.ASSISTANT, UserRole.FINANCE)
  findById(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateUserDto: Partial<CreateUserDto>) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.userService.delete(id);
  }

  @Put(':id/reset-password')
  resetPassword(@Param('id') id: string, @Body() body: { password: string }) {
    return this.userService.resetPassword(id, body.password);
  }

  @Post('organization')
  createOrganization(@Body() body: { name: string }) {
    return this.userService.createOrganization(body.name);
  }

  // 获取用户经验值/等级信息
  @Get(':id/level')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.MARKETING, UserRole.SALES, UserRole.LAWYER, UserRole.ASSISTANT, UserRole.FINANCE)
  getLevelInfo(@Param('id') id: string) {
    return this.userService.getLevelInfo(id);
  }

  // 增加用户经验值
  @Post(':id/experience')
  addExperience(@Param('id') id: string, @Body() body: { amount: number; reason?: string }) {
    return this.userService.addExperience(id, body.amount, body.reason);
  }
}
