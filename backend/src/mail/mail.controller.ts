import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { MailService } from './mail.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

@Controller('mail')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.MARKETING, UserRole.SALES, UserRole.LAWYER, UserRole.ASSISTANT, UserRole.FINANCE)
export class MailController {
  constructor(private readonly mailService: MailService) {}

  // 发送邮件
  @Post('send')
  send(@Body() body: any, @Request() req: any) {
    const userId = req?.user?.id;
    const orgId = req?.user?.organization_id;
    return this.mailService.send(userId, orgId, body);
  }

  // 保存草稿
  @Post('draft')
  saveDraft(@Body() body: any, @Request() req: any) {
    const userId = req?.user?.id;
    const orgId = req?.user?.organization_id;
    return this.mailService.saveDraft(userId, orgId, body);
  }

  // 收件箱（支持 keyword/is_read/is_starred 筛选）
  @Get('inbox')
  findInbox(
    @Query('keyword') keyword: string,
    @Query('is_read') is_read: string,
    @Query('is_starred') is_starred: string,
    @Request() req: any,
  ) {
    const userId = req?.user?.id;
    const orgId = req?.user?.organization_id;
    // 字符串转布尔
    const isRead = is_read === undefined ? undefined : is_read === 'true';
    const isStarred = is_starred === undefined ? undefined : is_starred === 'true';
    return this.mailService.findInbox(userId, orgId, keyword, isRead, isStarred);
  }

  // 已发送
  @Get('sent')
  findSent(@Request() req: any) {
    const userId = req?.user?.id;
    const orgId = req?.user?.organization_id;
    return this.mailService.findSent(userId, orgId);
  }

  // 草稿箱
  @Get('drafts')
  findDrafts(@Request() req: any) {
    const userId = req?.user?.id;
    const orgId = req?.user?.organization_id;
    return this.mailService.findDrafts(userId, orgId);
  }

  // 已删除
  @Get('trash')
  findTrash(@Request() req: any) {
    const userId = req?.user?.id;
    const orgId = req?.user?.organization_id;
    return this.mailService.findTrash(userId, orgId);
  }

  // 标记已读
  @Put(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.mailService.markAsRead(id);
  }

  // 星标切换
  @Put(':id/star')
  toggleStar(@Param('id') id: string) {
    return this.mailService.toggleStar(id);
  }

  // 移到已删除
  @Put(':id/trash')
  moveToTrash(@Param('id') id: string) {
    return this.mailService.moveToTrash(id);
  }

  // 彻底删除
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mailService.remove(id);
  }
}
