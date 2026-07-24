import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LiveCode } from './live-code.entity';

@Injectable()
export class LiveCodeService {
  constructor(
    @InjectRepository(LiveCode)
    private liveCodeRepository: Repository<LiveCode>,
  ) {}

  async create(data: Partial<LiveCode>): Promise<LiveCode> {
    if (Array.isArray(data.bound_users)) {
      data.bound_users = JSON.stringify(data.bound_users);
    }
    if (data.dispatch_config && typeof data.dispatch_config !== 'string') {
      data.dispatch_config = JSON.stringify(data.dispatch_config);
    }
    const entity = this.liveCodeRepository.create(data);
    return this.liveCodeRepository.save(entity);
  }

  async findAll(orgId?: string, filters?: {
    code_type?: string;
    status?: string;
    channel_id?: string;
  }): Promise<LiveCode[]> {
    const where: any = {};
    if (orgId) where.organization_id = orgId;
    if (filters?.code_type) where.code_type = filters.code_type;
    if (filters?.status) where.status = filters.status;
    if (filters?.channel_id) where.channel_id = filters.channel_id;
    return this.liveCodeRepository.find({ where, order: { created_at: 'DESC' } });
  }

  async findById(id: string): Promise<LiveCode> {
    const liveCode = await this.liveCodeRepository.findOne({ where: { id } });
    if (!liveCode) {
      throw new NotFoundException('活码不存在');
    }
    return liveCode;
  }

  async update(id: string, data: Partial<LiveCode>): Promise<LiveCode> {
    if (Array.isArray(data.bound_users)) {
      data.bound_users = JSON.stringify(data.bound_users);
    }
    if (data.dispatch_config && typeof data.dispatch_config !== 'string') {
      data.dispatch_config = JSON.stringify(data.dispatch_config);
    }
    await this.liveCodeRepository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const result = await this.liveCodeRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('活码不存在');
    }
  }

  /**
   * 配置分流规则
   */
  async updateDispatchRule(
    id: string,
    rule: string,
    config: any,
  ): Promise<LiveCode> {
    const liveCode = await this.findById(id);
    liveCode.dispatch_rule = rule;
    liveCode.dispatch_config = typeof config === 'string' ? config : JSON.stringify(config);
    return this.liveCodeRepository.save(liveCode);
  }

  /**
   * 模拟分流(根据规则选出目标员工ID)
   */
  async dispatch(id: string, context?: { region?: string; case_type?: string }): Promise<{ target_user: string | null }> {
    const liveCode = await this.findById(id);
    const boundUsers: string[] = liveCode.bound_users
      ? JSON.parse(liveCode.bound_users)
      : [];
    if (boundUsers.length === 0) {
      return { target_user: null };
    }

    const config: any = liveCode.dispatch_config
      ? JSON.parse(liveCode.dispatch_config)
      : {};

    switch (liveCode.dispatch_rule) {
      case 'load': {
        // 负载均衡: 选当前分配最少的人(用配置中的 current_loads 近似)
        const loads: Record<string, number> = config.current_loads || {};
        let minLoad = Infinity;
        let target = boundUsers[0];
        for (const userId of boundUsers) {
          const load = loads[userId] || 0;
          if (load < minLoad) {
            minLoad = load;
            target = userId;
          }
        }
        return { target_user: target };
      }
      case 'region': {
        // 地域匹配
        if (context?.region && config.regions) {
          const regionMap: Record<string, string[]> = config.regions;
          for (const [region, users] of Object.entries(regionMap)) {
            if (region === context.region && (users as string[]).length > 0) {
              return { target_user: (users as string[])[0] };
            }
          }
        }
        return { target_user: boundUsers[0] };
      }
      case 'case_type': {
        // 案由匹配
        if (context?.case_type && config.case_types) {
          const caseMap: Record<string, string[]> = config.case_types;
          for (const [ct, users] of Object.entries(caseMap)) {
            if (ct === context.case_type && (users as string[]).length > 0) {
              return { target_user: (users as string[])[0] };
            }
          }
        }
        return { target_user: boundUsers[0] };
      }
      case 'poll':
      default: {
        // 轮询: 用时间戳取模模拟轮询
        const idx = Math.floor(Date.now() / 1000) % boundUsers.length;
        return { target_user: boundUsers[idx] };
      }
    }
  }
}
