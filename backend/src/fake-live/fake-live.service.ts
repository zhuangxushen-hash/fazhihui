import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FakeLiveRoom, FakeLiveRoomStatus } from './fake-live-room.entity';
import { FakeLiveMessage } from './fake-live-message.entity';
import { FakeLiveViewer } from './fake-live-viewer.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';

@Injectable()
export class FakeLiveService {
  private readonly logger = new Logger(FakeLiveService.name);

  constructor(
    @InjectRepository(FakeLiveRoom)
    private roomRepository: Repository<FakeLiveRoom>,
    @InjectRepository(FakeLiveMessage)
    private messageRepository: Repository<FakeLiveMessage>,
    @InjectRepository(FakeLiveViewer)
    private viewerRepository: Repository<FakeLiveViewer>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // ========== 微信登录 ==========

  /**
   * 微信小程序 code2session 登录
   */
  async wxLogin(code: string): Promise<{ token: string; openid: string }> {
    const appid = this.configService.get('WX_MINI_APPID');
    const secret = this.configService.get('WX_MINI_SECRET');

    if (!appid || !secret) {
      // 开发环境：使用固定的 mock openid，保证同一用户身份稳定
      // 格式：dev_test_openid_${code}，确保不同 code 对应不同用户，但同一 code 始终映射到同一 openid
      const mockOpenid = `dev_test_openid_${code}`;
      const token = this.jwtService.sign({ openid: mockOpenid }, { expiresIn: '7d' });
      return { token, openid: mockOpenid };
    }

    try {
      const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;
      const data = await this._httpsGet(url);
      const parsed = JSON.parse(data);
      const { openid, session_key } = parsed;

      if (!openid) {
        throw new BadRequestException('微信登录失败：无法获取 openid');
      }

      const token = this.jwtService.sign({ openid, session_key }, { expiresIn: '7d' });
      return { token, openid };
    } catch (error) {
      this.logger.error('微信登录失败:', error.message);
      throw new BadRequestException('微信登录失败');
    }
  }

  /**
   * 使用 Node.js 原生 https 发起 GET 请求
   */
  private _httpsGet(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });
  }

  // ========== 直播间管理 ==========

  /**
   * 创建直播间
   */
  async createRoom(data: Partial<FakeLiveRoom>): Promise<FakeLiveRoom> {
    const room = this.roomRepository.create(data);
    return this.roomRepository.save(room);
  }

  /**
   * 更新直播间
   */
  async updateRoom(id: string, data: Partial<FakeLiveRoom>): Promise<FakeLiveRoom> {
    const room = await this.roomRepository.findOne({ where: { id } });
    if (!room) {
      throw new NotFoundException('直播间不存在');
    }
    await this.roomRepository.update(id, data);
    return this.roomRepository.findOne({ where: { id } });
  }

  /**
   * 删除直播间
   */
  async deleteRoom(id: string): Promise<void> {
    const result = await this.roomRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('直播间不存在');
    }
  }

  /**
   * 查询单个直播间
   */
  async findRoomById(id: string): Promise<FakeLiveRoom> {
    const room = await this.roomRepository.findOne({ where: { id } });
    if (!room) {
      throw new NotFoundException('直播间不存在');
    }
    return room;
  }

  /**
   * 直播间列表（支持状态筛选）
   */
  async listRooms(orgId?: string, status?: FakeLiveRoomStatus): Promise<FakeLiveRoom[]> {
    const queryBuilder = this.roomRepository
      .createQueryBuilder('room')
      .orderBy('room.updated_at', 'DESC');

    if (orgId) {
      queryBuilder.andWhere('room.organization_id = :orgId', { orgId });
    }
    if (status) {
      queryBuilder.andWhere('room.status = :status', { status });
    }

    return queryBuilder.getMany();
  }

  /**
   * 获取当前正在直播中的房间
   */
  async getActiveRoom(): Promise<FakeLiveRoom | null> {
    try {
      const room = await this.roomRepository
        .createQueryBuilder('room')
        .where('room.status = :status', { status: FakeLiveRoomStatus.LIVE })
        .orderBy('room.updated_at', 'DESC')
        .getOne();
      return room || null;
    } catch {
      return null;
    }
  }

  // ========== 直播操作 ==========

  /**
   * 开启直播
   */
  async startLive(id: string): Promise<FakeLiveRoom> {
    const room = await this.findRoomById(id);
    if (room.status === FakeLiveRoomStatus.LIVE) {
      throw new BadRequestException('直播已在进行中');
    }
    const now = new Date();
    await this.roomRepository.update(id, {
      status: FakeLiveRoomStatus.LIVE,
      actual_start: now,
    });
    return this.roomRepository.findOne({ where: { id } });
  }

  /**
   * 结束直播
   */
  async endLive(id: string): Promise<FakeLiveRoom> {
    const room = await this.findRoomById(id);
    if (room.status !== FakeLiveRoomStatus.LIVE) {
      throw new BadRequestException('直播未在进行中，无法结束');
    }
    const now = new Date();
    const actualStart = room.actual_start;
    let duration = 0;
    if (actualStart) {
      duration = Math.round((now.getTime() - new Date(actualStart).getTime()) / 60000);
    }
    await this.roomRepository.update(id, {
      status: FakeLiveRoomStatus.ENDED,
      actual_end: now,
      duration,
    });
    return this.roomRepository.findOne({ where: { id } });
  }

  // ========== 观众管理 ==========

  /**
   * 观众进入直播间
   */
  async viewerEnter(roomId: string, openid: string, nickname?: string, avatar?: string): Promise<FakeLiveViewer> {
    await this.findRoomById(roomId);
    const now = new Date();
    await this.roomRepository.increment({ id: roomId }, 'viewer_count', 1);

    const viewer = this.viewerRepository.create({
      room_id: roomId,
      openid,
      nickname,
      avatar,
      enter_at: now,
    });
    return this.viewerRepository.save(viewer);
  }

  /**
   * 观众离开直播间
   */
  async viewerLeave(roomId: string, openid: string): Promise<any> {
    const viewer = await this.viewerRepository.findOne({
      where: { room_id: roomId, openid },
      order: { created_at: 'DESC' },
    });
    if (viewer) {
      viewer.leave_at = new Date();
      return await this.viewerRepository.save(viewer);
    }
    return { openid, leave_at: new Date() };
  }

  /**
   * 获取观众列表
   */
  async listViewers(roomId: string): Promise<FakeLiveViewer[]> {
    return this.viewerRepository.find({
      where: { room_id: roomId },
      order: { created_at: 'DESC' },
    });
  }

  // ========== 聊天消息 ==========

  /**
   * 发送聊天消息
   */
  async sendMessage(data: Partial<FakeLiveMessage>): Promise<FakeLiveMessage> {
    const message = this.messageRepository.create(data);
    return this.messageRepository.save(message);
  }

  /**
   * 获取直播间历史消息
   */
  async listMessages(roomId: string, limit: number = 100, since?: string): Promise<FakeLiveMessage[]> {
    const queryBuilder = this.messageRepository
      .createQueryBuilder('msg')
      .where('msg.room_id = :roomId', { roomId });

    if (since) {
      queryBuilder.andWhere('msg.created_at > :since', { since });
    }

    return queryBuilder
      .orderBy('msg.created_at', 'ASC')
      .take(limit)
      .getMany();
  }
}
