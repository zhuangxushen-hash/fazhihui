import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Post()
  create(@Body() body: any) {
    return this.notificationService.create(body);
  }

  @Get()
  findAll(@Query('is_read') isRead: boolean, @Request() req: any) {
    return this.notificationService.findAllByUserId(req.user.id, isRead);
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
