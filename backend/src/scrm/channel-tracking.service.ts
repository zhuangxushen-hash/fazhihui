import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChannelTracking } from './channel-tracking.entity';

@Injectable()
export class ChannelTrackingService {
  constructor(
    @InjectRepository(ChannelTracking)
    private channelTrackingRepository: Repository<ChannelTracking>,
  ) {}

  async create(data: Partial<ChannelTracking>): Promise<ChannelTracking> {
    const entity = this.channelTrackingRepository.create(data);
    return this.channelTrackingRepository.save(entity);
  }

  async findAll(orgId?: string, filters?: {
    channel_group?: string;
    live_code_id?: string;
  }): Promise<ChannelTracking[]> {
    const where: any = {};
    if (orgId) where.organization_id = orgId;
    if (filters?.channel_group) where.channel_group = filters.channel_group;
    if (filters?.live_code_id) where.live_code_id = filters.live_code_id;
    return this.channelTrackingRepository.find({ where, order: { created_at: 'DESC' } });
  }

  async findById(id: string): Promise<ChannelTracking> {
    const channel = await this.channelTrackingRepository.findOne({ where: { id } });
    if (!channel) {
      throw new NotFoundException('渠道不存在');
    }
    return channel;
  }

  async update(id: string, data: Partial<ChannelTracking>): Promise<ChannelTracking> {
    await this.channelTrackingRepository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const result = await this.channelTrackingRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('渠道不存在');
    }
  }

  /**
   * 记录扫码事件
   */
  async recordScan(id: string): Promise<ChannelTracking> {
    const channel = await this.findById(id);
    channel.scan_count += 1;
    return this.channelTrackingRepository.save(channel);
  }

  /**
   * 记录加微事件
   */
  async recordAdd(id: string): Promise<ChannelTracking> {
    const channel = await this.findById(id);
    channel.add_count += 1;
    return this.channelTrackingRepository.save(channel);
  }

  /**
   * 记录邀约事件
   */
  async recordInvite(id: string): Promise<ChannelTracking> {
    const channel = await this.findById(id);
    channel.invite_count += 1;
    return this.channelTrackingRepository.save(channel);
  }

  /**
   * 记录签约事件
   */
  async recordSign(id: string): Promise<ChannelTracking> {
    const channel = await this.findById(id);
    channel.sign_count += 1;
    return this.channelTrackingRepository.save(channel);
  }

  /**
   * 渠道转化效果统计
   * 包含: 扫码量/加微量/加微率/邀约率/签约率
   */
  async getStatistics(orgId?: string, filters?: {
    channel_group?: string;
  }): Promise<any[]> {
    const channels = await this.findAll(orgId, filters);
    return channels.map(ch => {
      const addRate = ch.scan_count > 0 ? (ch.add_count / ch.scan_count) : 0;
      const inviteRate = ch.add_count > 0 ? (ch.invite_count / ch.add_count) : 0;
      const signRate = ch.invite_count > 0 ? (ch.sign_count / ch.invite_count) : 0;
      const overallRate = ch.scan_count > 0 ? (ch.sign_count / ch.scan_count) : 0;
      return {
        ...ch,
        add_rate: Number(addRate.toFixed(4)),
        invite_rate: Number(inviteRate.toFixed(4)),
        sign_rate: Number(signRate.toFixed(4)),
        overall_rate: Number(overallRate.toFixed(4)),
        is_high_conversion: overallRate >= 0.05, // 高转化标记: 签约率 >= 5%
      };
    });
  }

  /**
   * 渠道分组对比
   */
  async getGroupComparison(orgId?: string): Promise<any[]> {
    const channels = await this.findAll(orgId);
    const groupMap: Record<string, any> = {};
    for (const ch of channels) {
      const group = ch.channel_group || '未分组';
      if (!groupMap[group]) {
        groupMap[group] = {
          channel_group: group,
          scan_count: 0,
          add_count: 0,
          invite_count: 0,
          sign_count: 0,
          channel_count: 0,
        };
      }
      groupMap[group].scan_count += ch.scan_count;
      groupMap[group].add_count += ch.add_count;
      groupMap[group].invite_count += ch.invite_count;
      groupMap[group].sign_count += ch.sign_count;
      groupMap[group].channel_count += 1;
    }
    return Object.values(groupMap).map((g: any) => {
      const addRate = g.scan_count > 0 ? (g.add_count / g.scan_count) : 0;
      const inviteRate = g.add_count > 0 ? (g.invite_count / g.add_count) : 0;
      const signRate = g.invite_count > 0 ? (g.sign_count / g.invite_count) : 0;
      const overallRate = g.scan_count > 0 ? (g.sign_count / g.scan_count) : 0;
      return {
        ...g,
        add_rate: Number(addRate.toFixed(4)),
        invite_rate: Number(inviteRate.toFixed(4)),
        sign_rate: Number(signRate.toFixed(4)),
        overall_rate: Number(overallRate.toFixed(4)),
      };
    });
  }
}
