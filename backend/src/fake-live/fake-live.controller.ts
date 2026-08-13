import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Headers,
  Res,
  Req,
} from '@nestjs/common';
import { Response, Request as ExpressRequest } from 'express';
import * as https from 'https';
import * as http from 'http';
import { FakeLiveService } from './fake-live.service';
import { FakeLiveRoomStatus } from './fake-live-room.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';
import { WxLoginDto } from './dto/wx-login.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Controller()
export class FakeLiveController {
  constructor(private fakeLiveService: FakeLiveService) {}

  // ========== 小程序端接口（无需JWT，使用openid认证） ==========

  /**
   * 微信登录
   */
  @Post('fake-live/wx-login')
  async wxLogin(@Body() dto: WxLoginDto) {
    return this.fakeLiveService.wxLogin(dto.code);
  }

  /**
   * 获取当前直播中的房间
   */
  @Get('fake-live/rooms/active')
  async getActiveRoom() {
    return this.fakeLiveService.getActiveRoom();
  }

  /**
   * 获取直播间信息
   */
  @Get('fake-live/rooms/:id')
  async getRoom(@Param('id') id: string) {
    return this.fakeLiveService.findRoomById(id);
  }

  /**
   * 获取直播间历史消息
   */
  @Get('fake-live/rooms/:id/messages')
  async getMessages(
    @Param('id') id: string,
    @Query('limit') limit?: number,
    @Query('since') since?: string,
  ) {
    return this.fakeLiveService.listMessages(id, limit || 100, since);
  }

  /**
   * 发送聊天消息
   */
  @Post('fake-live/rooms/:id/messages')
  async sendMessage(
    @Param('id') roomId: string,
    @Body() dto: SendMessageDto,
    @Headers('authorization') auth?: string,
  ) {
    // 从 authorization header 解析 openid（简化处理，实际应解析 JWT）
    const viewerId = dto.viewer_id || 'anonymous';
    return this.fakeLiveService.sendMessage({
      room_id: roomId,
      viewer_id: viewerId,
      viewer_nickname: dto.viewer_nickname,
      viewer_avatar: dto.viewer_avatar,
      content: dto.content,
    });
  }

  /**
   * 观众进入直播间
   */
  @Post('fake-live/rooms/:id/enter')
  async enterRoom(
    @Param('id') roomId: string,
    @Body() body: { openid: string; nickname?: string; avatar?: string },
  ) {
    return this.fakeLiveService.viewerEnter(roomId, body.openid, body.nickname, body.avatar);
  }

  /**
   * 观众离开直播间
   */
  @Post('fake-live/rooms/:id/leave')
  async leaveRoom(
    @Param('id') roomId: string,
    @Body() body: { openid: string },
  ) {
    return this.fakeLiveService.viewerLeave(roomId, body.openid);
  }

  /**
   * 获取直播间观众列表
   */
  @Get('fake-live/rooms/:id/viewers')
  async getViewers(@Param('id') id: string) {
    return this.fakeLiveService.listViewers(id);
  }

  // ========== 管理后台接口（需要JWT） ==========

  @Get('marketing/fake-live-rooms')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.MARKETING)
  async adminListRooms(
    @Query('org_id') orgId: string,
    @Query('status') status?: FakeLiveRoomStatus,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.fakeLiveService.listRooms(finalOrgId, status);
  }

  @Get('marketing/fake-live-rooms/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.MARKETING)
  async adminGetRoom(@Param('id') id: string) {
    return this.fakeLiveService.findRoomById(id);
  }

  @Post('marketing/fake-live-rooms')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.MARKETING)
  async adminCreateRoom(
    @Body()
    body: {
      title: string;
      anchor_name: string;
      video_url?: string;
      cover_url?: string;
      max_viewers?: number;
    },
    @Request() req: any,
  ) {
    return this.fakeLiveService.createRoom({
      ...body,
      organization_id: req.user.organization_id,
      created_by: req.user.id,
      status: FakeLiveRoomStatus.DRAFT,
    });
  }

  @Put('marketing/fake-live-rooms/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.MARKETING)
  async adminUpdateRoom(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      anchor_name?: string;
      video_url?: string;
      cover_url?: string;
      max_viewers?: number;
    },
  ) {
    return this.fakeLiveService.updateRoom(id, body);
  }

  @Delete('marketing/fake-live-rooms/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.MARKETING)
  async adminDeleteRoom(@Param('id') id: string) {
    await this.fakeLiveService.deleteRoom(id);
    return { success: true };
  }

  @Post('marketing/fake-live-rooms/:id/start')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.MARKETING)
  async adminStartLive(@Param('id') id: string) {
    return this.fakeLiveService.startLive(id);
  }

  @Post('marketing/fake-live-rooms/:id/end')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.MARKETING)
  async adminEndLive(@Param('id') id: string) {
    return this.fakeLiveService.endLive(id);
  }

  @Get('marketing/fake-live-rooms/:id/messages')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.MARKETING)
  async adminGetMessages(
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ) {
    return this.fakeLiveService.listMessages(id, limit || 200);
  }

  @Get('marketing/fake-live-rooms/:id/viewers')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.MARKETING)
  async adminGetViewers(@Param('id') id: string) {
    return this.fakeLiveService.listViewers(id);
  }

  // ========== 视频代理接口（解决跨域问题） ==========

  /**
   * 代理视频流，解决前端直接访问视频的跨域/网络限制问题
   */
  @Get('fake-live/proxy-video')
  proxyVideo(
    @Query('url') videoUrl: string,
    @Res() res: Response,
    @Req() req: ExpressRequest,
  ) {
    if (!videoUrl) {
      res.status(400).json({ error: '缺少 url 参数' });
      return;
    }

    // 限制只能代理 http/https 协议
    if (!videoUrl.startsWith('http://') && !videoUrl.startsWith('https://')) {
      res.status(400).json({ error: '不支持的协议' });
      return;
    }

    const client = videoUrl.startsWith('https://') ? https : http;

    // 构建请求选项，转发 Range 等关键请求头
    const requestHeaders: Record<string, string> = {};
    if (req.headers['range']) {
      requestHeaders['Range'] = req.headers['range'] as string;
    }
    if (req.headers['user-agent']) {
      requestHeaders['User-Agent'] = req.headers['user-agent'] as string;
    }
    requestHeaders['Referer'] = 'https://www.w3schools.com/';

    const proxyReq = client.get(videoUrl, { headers: requestHeaders }, (proxyRes) => {
      // 构建响应头
      const responseHeaders: Record<string, string> = {};
      
      if (proxyRes.headers['content-type']) {
        responseHeaders['Content-Type'] = proxyRes.headers['content-type'] as string;
      }
      if (proxyRes.headers['content-length']) {
        responseHeaders['Content-Length'] = proxyRes.headers['content-length'] as string;
      }
      if (proxyRes.headers['accept-ranges']) {
        responseHeaders['Accept-Ranges'] = proxyRes.headers['accept-ranges'] as string;
      }
      if (proxyRes.headers['content-range']) {
        responseHeaders['Content-Range'] = proxyRes.headers['content-range'] as string;
      }
      responseHeaders['Cache-Control'] = 'public, max-age=3600';
      responseHeaders['Access-Control-Allow-Origin'] = '*';
      responseHeaders['Cross-Origin-Resource-Policy'] = 'cross-origin';

      res.status(proxyRes.statusCode || 206);
      Object.keys(responseHeaders).forEach(key => {
        res.setHeader(key, responseHeaders[key]);
      });

      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      if (!res.headersSent) {
        res.status(502).json({ error: '视频代理失败', message: err.message });
      }
    });

    // 客户端断开时中止代理请求
    req.on('close', () => {
      proxyReq.destroy();
    });
  }
}
