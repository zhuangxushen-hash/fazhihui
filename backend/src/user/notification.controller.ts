import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.MARKETING, UserRole.SALES, UserRole.LAWYER, UserRole.ASSISTANT, UserRole.FINANCE)
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  create(@Body() body: any) {
    return this.notificationService.create(body);
  }

  @Get()
  findAll(
    @Query('is_read') isRead: string,
    @Query('type') type: string,
    @Query('level') level: string,
    @Query('keyword') keyword: string,
    @Query('admin') admin: string,
    @Request() req: any,
  ) {
    // 管理端模式：返回所有通知
    if (admin === 'true') {
      const params: any = {};
      if (type) params.type = type;
      if (level) params.level = level;
      if (isRead !== undefined && isRead !== '') params.isRead = isRead === 'true';
      if (keyword) params.keyword = keyword;
      return this.notificationService.findAll(params);
    }
    // 普通模式：返回当前用户通知
    return this.notificationService.findAllByUserId(
      req.user.id,
      isRead !== undefined && isRead !== '' ? isRead === 'true' : undefined,
    );
  }

  @Get('unread-count')
  getUnreadCount(@Request() req: any) {
    return this.notificationService.getUnreadCount(req.user.id);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.notificationService.findById(id);
  }

  @Put(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }

  @Put('mark-all-read')
  markAllAsRead(@Request() req: any) {
    return this.notificationService.markAllAsRead(req.user.id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.notificationService.delete(id);
  }

  @Delete('clear-all')
  clearAll(@Request() req: any) {
    return this.notificationService.deleteByUserId(req.user.id);
  }
}
