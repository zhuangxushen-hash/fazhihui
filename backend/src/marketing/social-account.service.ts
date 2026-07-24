import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { SocialAccount } from './social-account.entity';
import { SocialPlatform, SocialAuthStatus } from '../types';

@Injectable()
export class SocialAccountService {
  constructor(
    @InjectRepository(SocialAccount)
    private readonly accountRepository: Repository<SocialAccount>,
  ) {}

  // ========== 账号 CRUD ==========

  /**
   * 创建公域账号
   */
  async create(data: Partial<SocialAccount>): Promise<SocialAccount> {
    const account = this.accountRepository.create(data);
    if (data.auth_token) {
      account.auth_status = SocialAuthStatus.AUTHORIZED;
      account.authorized_at = new Date();
    }
    return this.accountRepository.save(account);
  }

  /**
   * 更新账号
   */
  async update(id: string, data: Partial<SocialAccount>): Promise<SocialAccount> {
    const account = await this.accountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException('公域账号不存在');
    }
    if (data.auth_token && data.auth_token !== account.auth_token) {
      data.auth_status = SocialAuthStatus.AUTHORIZED;
      data.authorized_at = new Date();
    }
    await this.accountRepository.update(id, data);
    return this.accountRepository.findOne({ where: { id } });
  }

  /**
   * 删除账号
   */
  async delete(id: string): Promise<void> {
    const account = await this.accountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException('公域账号不存在');
    }
    await this.accountRepository.delete(id);
  }

  /**
   * 查询单个账号
   */
  async findById(id: string): Promise<SocialAccount> {
    const account = await this.accountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException('公域账号不存在');
    }
    return account;
  }

  /**
   * 查询账号列表（支持按平台、分组、授权状态筛选）
   */
  async findAccounts(
    orgId: string,
    filters?: {
      platform?: SocialPlatform;
      group_name?: string;
      auth_status?: SocialAuthStatus;
      keyword?: string;
    },
  ): Promise<SocialAccount[]> {
    const where: any = { organization_id: orgId };
    if (filters?.platform) {
      where.platform = filters.platform;
    }
    if (filters?.group_name) {
      where.group_name = filters.group_name;
    }
    if (filters?.auth_status) {
      where.auth_status = filters.auth_status;
    }
    if (filters?.keyword) {
      where.account_name = Like(`%${filters.keyword}%`);
    }
    return this.accountRepository.find({
      where,
      order: { created_at: 'DESC' },
    });
  }

  // ========== 分组管理 ==========

  /**
   * 获取组织内全部分组列表（去重）
   */
  async findGroups(orgId: string): Promise<string[]> {
    const rows = await this.accountRepository
      .createQueryBuilder('acc')
      .select('DISTINCT acc.group_name', 'group_name')
      .where('acc.organization_id = :orgId', { orgId })
      .andWhere('acc.group_name IS NOT NULL')
      .andWhere("acc.group_name != ''")
      .getRawMany();
    return rows.map((r: { group_name: string }) => r.group_name);
  }

  /**
   * 创建分组（将若干账号归到一个新分组）
   */
  async createGroup(orgId: string, groupName: string, accountIds: string[]): Promise<void> {
    if (!groupName) {
      throw new Error('分组名称不能为空');
    }
    if (!accountIds || accountIds.length === 0) {
      return;
    }
    await this.accountRepository
      .createQueryBuilder()
      .update(SocialAccount)
      .set({ group_name: groupName })
      .where('organization_id = :orgId', { orgId })
      .andWhere('id IN (:...ids)', { ids: accountIds })
      .execute();
  }

  /**
   * 修改账号所属分组
   */
  async changeGroup(accountIds: string[], groupName: string): Promise<void> {
    if (!accountIds || accountIds.length === 0) return;
    await this.accountRepository.update(
      { id: In(accountIds) },
      { group_name: groupName || null },
    );
  }

  // ========== 授权状态管理 ==========

  /**
   * 更新授权状态
   */
  async updateAuthStatus(id: string, authStatus: SocialAuthStatus): Promise<SocialAccount> {
    const updateData: Partial<SocialAccount> = { auth_status: authStatus };
    if (authStatus === SocialAuthStatus.AUTHORIZED) {
      updateData.authorized_at = new Date();
    } else {
      // 未授权 / 已过期：清空授权时间和令牌
      updateData.authorized_at = null;
      updateData.auth_token = null;
    }
    await this.accountRepository.update(id, updateData);
    return this.accountRepository.findOne({ where: { id } });
  }

  /**
   * 授权账号（保存授权令牌）
   */
  async authorize(id: string, authToken: string): Promise<SocialAccount> {
    await this.accountRepository.update(id, {
      auth_token: authToken,
      auth_status: SocialAuthStatus.AUTHORIZED,
      authorized_at: new Date(),
    });
    return this.accountRepository.findOne({ where: { id } });
  }

  /**
   * 取消授权
   */
  async revoke(id: string): Promise<SocialAccount> {
    await this.accountRepository.update(id, {
      auth_token: null,
      auth_status: SocialAuthStatus.UNAUTHORIZED,
      authorized_at: null,
    });
    return this.accountRepository.findOne({ where: { id } });
  }

  // ========== 数据统计 ==========

  /**
   * 按平台统计账号数及粉丝、点赞、咨询总数
   */
  async getStatsByPlatform(orgId: string) {
    const rows = await this.accountRepository
      .createQueryBuilder('acc')
      .select('acc.platform', 'platform')
      .addSelect('COUNT(*)', 'account_count')
      .addSelect('COALESCE(SUM(acc.followers), 0)', 'total_followers')
      .addSelect('COALESCE(SUM(acc.likes), 0)', 'total_likes')
      .addSelect('COALESCE(SUM(acc.consultations), 0)', 'total_consultations')
      .where('acc.organization_id = :orgId', { orgId })
      .groupBy('acc.platform')
      .getRawMany();
    return rows;
  }

  /**
   * 按分组统计账号数及粉丝、点赞、咨询总数
   */
  async getStatsByGroup(orgId: string) {
    const rows = await this.accountRepository
      .createQueryBuilder('acc')
      .select("COALESCE(acc.group_name, '未分组')", 'group_name')
      .addSelect('COUNT(*)', 'account_count')
      .addSelect('COALESCE(SUM(acc.followers), 0)', 'total_followers')
      .addSelect('COALESCE(SUM(acc.likes), 0)', 'total_likes')
      .addSelect('COALESCE(SUM(acc.consultations), 0)', 'total_consultations')
      .where('acc.organization_id = :orgId', { orgId })
      .groupBy('acc.group_name')
      .getRawMany();
    return rows;
  }

  /**
   * 账号总数和总数汇总
   */
  async getOverview(orgId: string) {
    const row = await this.accountRepository
      .createQueryBuilder('acc')
      .select('COUNT(*)', 'account_count')
      .addSelect('COALESCE(SUM(acc.followers), 0)', 'total_followers')
      .addSelect('COALESCE(SUM(acc.likes), 0)', 'total_likes')
      .addSelect('COALESCE(SUM(acc.consultations), 0)', 'total_consultations')
      .addSelect(`SUM(CASE WHEN acc.auth_status = 'authorized' THEN 1 ELSE 0 END)`, 'authorized_count')
      .addSelect(`SUM(CASE WHEN acc.platform = 'douyin' THEN 1 ELSE 0 END)`, 'douyin_count')
      .addSelect(`SUM(CASE WHEN acc.platform = 'kuaishou' THEN 1 ELSE 0 END)`, 'kuaishou_count')
      .addSelect(`SUM(CASE WHEN acc.platform = 'wechat_video' THEN 1 ELSE 0 END)`, 'wechat_video_count')
      .addSelect(`SUM(CASE WHEN acc.platform = 'wechat_official' THEN 1 ELSE 0 END)`, 'wechat_official_count')
      .where('acc.organization_id = :orgId', { orgId })
      .getRawOne();
    return row;
  }

  /**
   * 更新账号统计数据（粉丝/点赞/咨询数）
   */
  async updateStats(
    id: string,
    data: { followers?: number; likes?: number; consultations?: number },
  ): Promise<SocialAccount> {
    const account = await this.accountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException('公域账号不存在');
    }
    await this.accountRepository.update(id, data);
    return this.accountRepository.findOne({ where: { id } });
  }
}
