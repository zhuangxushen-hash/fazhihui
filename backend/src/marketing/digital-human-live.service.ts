import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DigitalHumanLive, DigitalHumanLiveStatus } from './digital-human-live.entity';

@Injectable()
export class DigitalHumanLiveService {
  constructor(
    @InjectRepository(DigitalHumanLive)
    private liveRepository: Repository<DigitalHumanLive>,
  ) {}

  /**
   * 创建数字人直播
   */
  async create(data: Partial<DigitalHumanLive>): Promise<DigitalHumanLive> {
    const live = this.liveRepository.create(data);
    return this.liveRepository.save(live);
  }

  /**
   * 更新数字人直播
   */
  async update(id: string, data: Partial<DigitalHumanLive>): Promise<DigitalHumanLive> {
    const live = await this.liveRepository.findOne({ where: { id } });
    if (!live) {
      throw new NotFoundException('数字人直播不存在');
    }
    if (live.status === DigitalHumanLiveStatus.LIVE) {
      throw new BadRequestException('直播进行中，无法修改');
    }
    await this.liveRepository.update(id, data);
    return this.liveRepository.findOne({ where: { id } });
  }

  /**
   * 删除数字人直播
   */
  async delete(id: string): Promise<void> {
    const live = await this.liveRepository.findOne({ where: { id } });
    if (!live) {
      throw new NotFoundException('数字人直播不存在');
    }
    if (live.status === DigitalHumanLiveStatus.LIVE) {
      throw new BadRequestException('直播进行中，无法删除');
    }
    await this.liveRepository.delete(id);
  }

  /**
   * 查询单个直播详情
   */
  async findById(id: string): Promise<DigitalHumanLive> {
    const live = await this.liveRepository.findOne({ where: { id } });
    if (!live) {
      throw new NotFoundException('数字人直播不存在');
    }
    return live;
  }

  /**
   * 开播
   */
  async startLive(id: string): Promise<DigitalHumanLive> {
    const live = await this.liveRepository.findOne({ where: { id } });
    if (!live) {
      throw new NotFoundException('数字人直播不存在');
    }
    if (live.status === DigitalHumanLiveStatus.LIVE) {
      throw new BadRequestException('直播已在进行中');
    }
    const now = new Date();
    await this.liveRepository.update(id, {
      status: DigitalHumanLiveStatus.LIVE,
      actual_start: now,
      scheduled_start: live.scheduled_start || now,
    });
    return this.liveRepository.findOne({ where: { id } });
  }

  /**
   * 结束直播
   */
  async endLive(id: string): Promise<DigitalHumanLive> {
    const live = await this.liveRepository.findOne({ where: { id } });
    if (!live) {
      throw new NotFoundException('数字人直播不存在');
    }
    if (live.status !== DigitalHumanLiveStatus.LIVE) {
      throw new BadRequestException('直播未在进行中，无法结束');
    }
    const now = new Date();
    const actualStart = live.actual_start || live.scheduled_start;
    let duration: number = 0;
    if (actualStart) {
      duration = Math.round((now.getTime() - new Date(actualStart).getTime()) / 60000);
    }
    await this.liveRepository.update(id, {
      status: DigitalHumanLiveStatus.ENDED,
      actual_end: now,
      duration,
    });
    return this.liveRepository.findOne({ where: { id } });
  }

  /**
   * 获取直播统计数据
   */
  async getLiveStats(orgId: string): Promise<{
    total_sessions: number;
    live_sessions: number;
    ended_sessions: number;
    total_viewers: number;
    total_likes: number;
    total_conversions: number;
    conversion_rate: number;
  }> {
    const lives = await this.liveRepository.find({
      where: { organization_id: orgId },
    });
    const totalSessions = lives.length;
    const liveSessions = lives.filter(l => l.status === DigitalHumanLiveStatus.LIVE).length;
    const endedSessions = lives.filter(l => l.status === DigitalHumanLiveStatus.ENDED).length;
    const totalViewers = lives.reduce((sum, l) => sum + (l.viewer_count || 0), 0);
    const totalLikes = lives.reduce((sum, l) => sum + (l.like_count || 0), 0);
    const totalConversions = lives.reduce((sum, l) => sum + (l.conversion_count || 0), 0);
    const conversionRate = totalViewers > 0 ? Math.round((totalConversions / totalViewers) * 10000) / 100 : 0;

    return {
      total_sessions: totalSessions,
      live_sessions: liveSessions,
      ended_sessions: endedSessions,
      total_viewers: totalViewers,
      total_likes: totalLikes,
      total_conversions: totalConversions,
      conversion_rate: conversionRate,
    };
  }

  /**
   * 直播列表（支持按状态筛选）
   */
  async listLiveSessions(orgId: string, status?: DigitalHumanLiveStatus): Promise<DigitalHumanLive[]> {
    const queryBuilder = this.liveRepository
      .createQueryBuilder('live')
      .where('live.organization_id = :orgId', { orgId });

    if (status) {
      queryBuilder.andWhere('live.status = :status', { status });
    }

    queryBuilder.orderBy('live.updated_at', 'DESC');
    return queryBuilder.getMany();
  }
}