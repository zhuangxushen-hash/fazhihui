import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AdAccount } from './ad-account.entity';
import { AdAccountWarning } from './ad-account-warning.entity';
import { AdPlatform, AdAccountStatus, AdAccountWarningStatus } from '../types';

@Injectable()
export class AdAccountService {
  private readonly logger = new Logger(AdAccountService.name);

  constructor(
    @InjectRepository(AdAccount)
    private accountRepository: Repository<AdAccount>,
    @InjectRepository(AdAccountWarning)
    private warningRepository: Repository<AdAccountWarning>,
  ) {}

  /**
   * 创建广告账户
   */
  async create(data: Partial<AdAccount>): Promise<AdAccount> {
    const account = this.accountRepository.create(data);
    if (data.auth_token) {
      account.authorized_at = new Date();
    }
    return this.accountRepository.save(account);
  }

  /**
   * 更新账户
   */
  async update(id: string, data: Partial<AdAccount>): Promise<AdAccount> {
    const account = await this.accountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException('广告账户不存在');
    }
    // 如果更新了 auth_token，刷新授权时间
    if (data.auth_token && data.auth_token !== account.auth_token) {
      data.authorized_at = new Date();
    }
    await this.accountRepository.update(id, data);
    return this.accountRepository.findOne({ where: { id } });
  }

  /**
   * 删除账户
   */
  async delete(id: string): Promise<void> {
    const account = await this.accountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException('广告账户不存在');
    }
    await this.accountRepository.delete(id);
  }

  /**
   * 查询单个账户
   */
  async findById(id: string): Promise<AdAccount> {
    const account = await this.accountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException('广告账户不存在');
    }
    return account;
  }

  /**
   * 查询账户列表（支持按平台、分组、状态筛选）
   */
  async findAccounts(orgId: string, filters?: {
    platform?: AdPlatform;
    group_name?: string;
    status?: AdAccountStatus;
    keyword?: string;
  }): Promise<AdAccount[]> {
    const where: any = { organization_id: orgId };
    if (filters?.platform) {
      where.platform = filters.platform;
    }
    if (filters?.group_name) {
      where.group_name = filters.group_name;
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.keyword) {
      where.account_name = Like(`%${filters.keyword}%`);
    }
    return this.accountRepository.find({
      where,
      order: { created_at: 'DESC' },
    });
  }

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
   * 创建分组（即将若干账户归到一个新分组）
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
      .update(AdAccount)
      .set({ group_name: groupName })
      .where('organization_id = :orgId', { orgId })
      .andWhere('id IN (:...ids)', { ids: accountIds })
      .execute();
  }

  /**
   * 修改账户所属分组
   */
  async changeGroup(accountIds: string[], groupName: string): Promise<void> {
    if (!accountIds || accountIds.length === 0) return;
    await this.accountRepository.update(
      { id: In(accountIds) },
      { group_name: groupName || null },
    );
  }

  /**
   * 更新账户余额
   */
  async updateBalance(id: string, balance: number): Promise<AdAccount> {
    await this.accountRepository.update(id, { balance });
    return this.accountRepository.findOne({ where: { id } });
  }

  /**
   * 更新账户阈值
   */
  async updateThreshold(id: string, threshold: number): Promise<AdAccount> {
    await this.accountRepository.update(id, { threshold });
    return this.accountRepository.findOne({ where: { id } });
  }

  /**
   * 更新账户状态
   */
  async updateStatus(id: string, status: AdAccountStatus): Promise<AdAccount> {
    await this.accountRepository.update(id, { status });
    return this.accountRepository.findOne({ where: { id } });
  }

  // ========== 余额预警相关 ==========

  /**
   * 每天凌晨 2 点检查账户余额，低于阈值生成预警记录
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async checkBalanceWarnings() {
    this.logger.log('开始检查广告账户余额预警...');
    try {
      const accounts = await this.accountRepository.find({
        where: { status: AdAccountStatus.ACTIVE as any },
      });

      let warningCount = 0;
      for (const account of accounts) {
        if (account.threshold > 0 && Number(account.balance) < Number(account.threshold)) {
          await this.createOrUpdateWarning(account);
          warningCount++;
        }
      }
      this.logger.log(`余额预警检查完成，共生成/更新 ${warningCount} 条预警记录`);
    } catch (error) {
      this.logger.error('检查广告账户余额预警失败', error);
    }
  }

  /**
   * 创建或更新余额预警记录
   */
  private async createOrUpdateWarning(account: AdAccount): Promise<void> {
    // 查找是否已存在未处理的预警
    const existing = await this.warningRepository.findOne({
      where: {
        account_id: account.id,
        status: AdAccountWarningStatus.PENDING as any,
      },
    });

    if (existing) {
      // 更新余额快照
      await this.warningRepository.update(existing.id, {
        balance: account.balance,
        threshold: account.threshold,
        account_name: account.account_name,
        platform: account.platform,
      });
    } else {
      const warning = this.warningRepository.create({
        account_id: account.id,
        platform: account.platform,
        account_name: account.account_name,
        balance: account.balance,
        threshold: account.threshold,
        organization_id: account.organization_id,
        status: AdAccountWarningStatus.PENDING,
      });
      await this.warningRepository.save(warning);
    }
  }

  /**
   * 查询预警列表
   */
  async findWarnings(orgId: string, status?: AdAccountWarningStatus): Promise<AdAccountWarning[]> {
    const where: any = { organization_id: orgId };
    if (status) {
      where.status = status;
    }
    return this.warningRepository.find({
      where,
      order: { created_at: 'DESC' },
    });
  }

  /**
   * 标记预警已通知
   */
  async markWarningNotified(id: string): Promise<AdAccountWarning> {
    await this.warningRepository.update(id, { status: AdAccountWarningStatus.NOTIFIED });
    return this.warningRepository.findOne({ where: { id } });
  }

  /**
   * 标记预警已解决
   */
  async markWarningResolved(id: string, remarks?: string): Promise<AdAccountWarning> {
    await this.warningRepository.update(id, {
      status: AdAccountWarningStatus.RESOLVED,
      remarks,
    });
    return this.warningRepository.findOne({ where: { id } });
  }

  /**
   * 手动触发余额检查
   */
  async manualCheck(): Promise<string> {
    await this.checkBalanceWarnings();
    return '手动检查完成';
  }
}
