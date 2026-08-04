import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

// 所有角色均可访问的角色列表
const ALL_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ORG_ADMIN,
  UserRole.MARKETING,
  UserRole.SALES,
  UserRole.LAWYER,
  UserRole.ASSISTANT,
  UserRole.FINANCE,
  UserRole.CLIENT,
];

@Controller('users')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
export class UserController {
  constructor(
    private userService: UserService,
    // 追加注入 User Repository 用于个人信息相关操作
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  findAll(@Query('org_id') orgId?: string, @Query('name') name?: string, @Query('phone') phone?: string, @Query('role') role?: string, @Request() req?: any) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.userService.findAll(finalOrgId, name, phone, role);
  }

  // ==================== 个人信息管理（必须在 @Get(':id') 之前定义）====================

  /**
   * 获取当前登录用户个人信息
   */
  @Get('profile')
  @Roles(...ALL_ROLES)
  async getProfile(@Request() req: any) {
    const userId = req?.user?.id;
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    delete user.password;
    return user;
  }

  /**
   * 更新个人信息（real_name, avatar, phone, email 等）
   */
  @Put('profile')
  @Roles(...ALL_ROLES)
  async updateProfile(@Body() body: Partial<User>, @Request() req: any) {
    const userId = req?.user?.id;
    // 不允许通过此接口修改密码和角色
    const { password, role, id, ...rest } = body;
    await this.userRepository.update(userId, rest);
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) {
      delete user.password;
    }
    return user;
  }

  /**
   * 修改密码（验证旧密码，更新新密码）
   */
  @Put('password')
  @Roles(...ALL_ROLES)
  async changePassword(@Body() body: { old_password: string; new_password: string }, @Request() req: any) {
    const userId = req?.user?.id;
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    // 验证旧密码
    const isOldPasswordValid = await bcrypt.compare(body.old_password, user.password);
    if (!isOldPasswordValid) {
      throw new BadRequestException('旧密码不正确');
    }
    // 加密新密码并更新
    const hashedPassword = await bcrypt.hash(body.new_password, parseInt(process.env.BCRYPT_ROUNDS || '10'));
    await this.userRepository.update(userId, { password: hashedPassword });
    return { message: '密码修改成功' };
  }

  /**
   * 更新银行账户信息
   */
  @Put('bank')
  @Roles(...ALL_ROLES)
  async updateBank(@Body() body: { bank_account?: string; bank_name?: string }, @Request() req: any) {
    const userId = req?.user?.id;
    await this.userRepository.update(userId, body);
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) {
      delete user.password;
    }
    return user;
  }

  /**
   * 修改手机号
   */
  @Put('phone')
  @Roles(...ALL_ROLES)
  async updatePhone(@Body() body: { phone: string }, @Request() req: any) {
    const userId = req?.user?.id;
    // 检查手机号是否已被其他用户使用
    const existing = await this.userRepository.findOne({ where: { phone: body.phone } });
    if (existing && existing.id !== userId) {
      throw new BadRequestException('该手机号已被使用');
    }
    await this.userRepository.update(userId, { phone: body.phone });
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) {
      delete user.password;
    }
    return user;
  }

  /**
   * 修改邮箱
   */
  @Put('email')
  @Roles(...ALL_ROLES)
  async updateEmail(@Body() body: { email: string }, @Request() req: any) {
    const userId = req?.user?.id;
    await this.userRepository.update(userId, { email: body.email });
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) {
      delete user.password;
    }
    return user;
  }

  // ==================== 以下为原有路由（:id 等参数路由）====================

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
