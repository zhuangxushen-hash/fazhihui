import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  findAll(@Query('org_id') orgId?: string, @Query('name') name?: string, @Query('phone') phone?: string, @Query('role') role?: string) {
    return this.userService.findAll(orgId, name, phone, role);
  }

  @Get(':id')
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
}
