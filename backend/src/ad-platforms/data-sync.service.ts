import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { TokenManagerService } from './token-manager.service';
import { AdPlatformToken } from './ad-platform-token.entity';
import { AdPlatformSyncLog } from './ad-platform-sync-log.entity';
import { AdAccount } from '../marketing/ad-account.entity';
import { OceanEngineService } from './platforms/ocean-engine.service';
import { BaiduMarketingService } from './platforms/baidu-marketing.service';
import { TencentAdsService } from './platforms/tencent-ads.service';
import { KuaishouAdsService } from './platforms/kuaishou-ads.service';
import { DouyinOpenService } from './platforms/douyin-open.service';
import {
  IPlatformClient,
  PlatformReport,
} from './interfaces/platform-client.interface';
import { AdPlatform } from '../types';

/**
 * 广告平台数据同步服务
 * 通过定时任务拉取各平台账户余额、投放计划、报表数据
 * 同步结果写入 AdPlatformSyncLog，余额同步后更新 AdAccount.balance
 */
@Injectable()
export class DataSyncService {
  private readonly logger = new Logger(DataSyncService.name);
  private runningTasks: Set<string> = new Set();

  constructor(
    private tokenManagerService: TokenManagerService,
    private oceanEngineService: OceanEngineService,
    private baiduMarketingService: BaiduMarketingService,
    private tencentAdsService: TencentAdsService,
    private kuaishouAdsService: KuaishouAdsService,
    private douyinOpenService: DouyinOpenService,
    @InjectRepository(AdPlatformSyncLog)
    private syncLogRepo: Repository<AdPlatformSyncLog>,
    @InjectRepository(AdPlatformToken)
    private tokenRepo: Repository<AdPlatformToken>,
    @InjectRepository(AdAccount)
    private adAccountRepo: Repository<AdAccount>,
  ) {}

  /** 根据平台标识获取对应的平台客户端 */
  private getClient(platform: string): IPlatformClient {
    const map: Record<string, IPlatformClient> = {
      ocean_engine: this.oceanEngineService,
      baidu_marketing: this.baiduMarketingService,
      tencent_ads: this.tencentAdsService,
      kuaishou_ads: this.kuaishouAdsService,
      douyin_open: this.douyinOpenService,
    };
    return map[platform];
  }

  /**
   * PlatformCode 到 AdPlatform 的映射
   * 用于同步余额时定位 AdAccount 记录
   */
  private mapToAdPlatform(platform: string): AdPlatform {
    switch (platform) {
      case 'ocean_engine':
        return AdPlatform.DOUYIN;
      case 'baidu_marketing':
        return AdPlatform.BAIDU;
      case 'tencent_ads':
        return AdPlatform.TENCENT;
      case 'kuaishou_ads':
        return AdPlatform.KUAISHOU;
      default:
        // douyin_open 等内容运营平台映射为 douyin
        return AdPlatform.DOUYIN;
    }
  }

  /**
   * 定时任务：每 6 小时拉取所有平台账户余额
   * cron 表达式：每 6 小时的第 0 分钟执行
   */
  @Cron('0 */6 * * *')
  async syncAllAccountBalances() {
    const taskKey = 'syncAllAccountBalances';
    if (this.runningTasks.has(taskKey)) return;
    this.runningTasks.add(taskKey);
    try {
      this.logger.log('开始定时同步所有平台账户余额...');
      const groups = await this.findAllOrgPlatformGroups();
      for (const { organization_id, platform } of groups) {
        try {
          await this.syncAccountBalance(organization_id, platform);
        } catch (err) {
          this.logger.error(
            `同步余额失败 ${organization_id}/${platform}: ${err?.message ?? err}`,
          );
        }
      }
      this.logger.log('定时同步账户余额结束');
    } finally {
      this.runningTasks.delete(taskKey);
    }
  }

  /**
   * 定时任务：每天凌晨 1 点拉取所有平台投放计划数据
   */
  @Cron('0 1 * * *')
  async syncAllCampaignLists() {
    const taskKey = 'syncAllCampaignLists';
    if (this.runningTasks.has(taskKey)) return;
    this.runningTasks.add(taskKey);
    try {
      this.logger.log('开始定时同步所有平台投放计划...');
      const groups = await this.findAllOrgPlatformGroups();
      for (const { organization_id, platform } of groups) {
        try {
          await this.syncCampaignList(organization_id, platform);
        } catch (err) {
          this.logger.error(
            `同步投放计划失败 ${organization_id}/${platform}: ${err?.message ?? err}`,
          );
        }
      }
      this.logger.log('定时同步投放计划结束');
    } finally {
      this.runningTasks.delete(taskKey);
    }
  }

  /**
   * 定时任务：每天凌晨 2 点拉取昨日报表数据
   */
  @Cron('0 2 * * *')
  async syncAllReportData() {
    const taskKey = 'syncAllReportData';
    if (this.runningTasks.has(taskKey)) return;
    this.runningTasks.add(taskKey);
    try {
      this.logger.log('开始定时同步所有平台昨日报表...');
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().slice(0, 10);
      const groups = await this.findAllOrgPlatformGroups();
      for (const { organization_id, platform } of groups) {
        try {
          await this.syncReportData(organization_id, platform, dateStr, dateStr);
        } catch (err) {
          this.logger.error(
            `同步报表失败 ${organization_id}/${platform}: ${err?.message ?? err}`,
          );
        }
      }
      this.logger.log('定时同步报表结束');
    } finally {
      this.runningTasks.delete(taskKey);
    }
  }

  /**
   * 查询所有需要同步的组织+平台组合
   * 基于有效 Token 去重，确保只同步已授权的平台
   */
  private async findAllOrgPlatformGroups(): Promise<
    { organization_id: string; platform: string }[]
  > {
    const tokens = await this.tokenRepo.find({
      where: { token_status: 'active' },
    });
    const seen = new Set<string>();
    const groups: { organization_id: string; platform: string }[] = [];
    for (const t of tokens) {
      const key = `${t.organization_id}:${t.platform}`;
      if (!seen.has(key)) {
        seen.add(key);
        groups.push({ organization_id: t.organization_id, platform: t.platform });
      }
    }
    return groups;
  }

  /**
   * 确保获取有效 access_token
   * 若 Token 即将过期则自动刷新并落库，返回最新 Token 与对应客户端
   */
  private async ensureAccessToken(
    orgId: string,
    platform: string,
  ): Promise<{ token: AdPlatformToken; client: IPlatformClient }> {
    const client = this.getClient(platform);
    const token = await this.tokenManagerService.getValidToken(orgId, platform);
    if (
      this.tokenManagerService.isTokenExpiringSoon(token) &&
      token.refresh_token
    ) {
      const tokenData = await client.refreshToken(token.refresh_token);
      // 刷新后保留原有 account_id，避免丢失账户归属
      tokenData.account_id = tokenData.account_id || token.account_id;
      const refreshed = await this.tokenManagerService.saveToken(
        orgId,
        platform,
        tokenData,
      );
      return { token: refreshed, client };
    }
    return { token, client };
  }

  /**
   * 同步指定平台的账户余额
   * 拉取账户列表后更新 AdAccount 余额字段，并写入同步日志
   */
  async syncAccountBalance(orgId: string, platform: string): Promise<void> {
    let recordCount = 0;
    try {
      const { token, client } = await this.ensureAccessToken(orgId, platform);
      const accounts = await client.getAccountList(token.access_token);
      const adPlatform = this.mapToAdPlatform(platform);
      for (const acc of accounts) {
        if (!acc.account_id) continue;
        // 按组织+平台+账户ID定位 AdAccount，更新其余额
        await this.adAccountRepo.update(
          {
            organization_id: orgId,
            platform: adPlatform,
            account_id: acc.account_id,
          },
          { balance: acc.balance },
        );
        recordCount++;
      }
      await this.writeSyncLog(
        orgId,
        platform,
        'balance',
        'success',
        recordCount,
        JSON.stringify({ accounts: accounts.length }),
      );
    } catch (err) {
      await this.writeSyncLog(
        orgId,
        platform,
        'balance',
        'failed',
        recordCount,
        undefined,
        err?.message ?? String(err),
      );
      throw err;
    }
  }

  /**
   * 同步指定平台的投放计划列表
   * 遍历该平台下所有账户，拉取投放计划并写入同步日志
   */
  async syncCampaignList(orgId: string, platform: string): Promise<void> {
    let recordCount = 0;
    const summary: any[] = [];
    try {
      const { token, client } = await this.ensureAccessToken(orgId, platform);
      const accounts = await client.getAccountList(token.access_token);
      for (const acc of accounts) {
        if (!acc.account_id) continue;
        const campaigns = await client.getCampaignList(
          token.access_token,
          acc.account_id,
        );
        for (const c of campaigns) {
          summary.push({
            id: c.campaign_id,
            name: c.campaign_name,
            status: c.status,
          });
        }
        recordCount += campaigns.length;
      }
      await this.writeSyncLog(
        orgId,
        platform,
        'campaign_list',
        'success',
        recordCount,
        JSON.stringify({ campaigns: summary }),
      );
    } catch (err) {
      await this.writeSyncLog(
        orgId,
        platform,
        'campaign_list',
        'failed',
        recordCount,
        undefined,
        err?.message ?? String(err),
      );
      throw err;
    }
  }

  /**
   * 同步指定平台的报表数据
   * 遍历该平台下所有账户，拉取指定时间段的报表并汇总写入同步日志
   */
  async syncReportData(
    orgId: string,
    platform: string,
    startDate: string,
    endDate: string,
  ): Promise<void> {
    let recordCount = 0;
    const summary = { cost: 0, impression: 0, click: 0, conversion: 0 };
    try {
      const { token, client } = await this.ensureAccessToken(orgId, platform);
      const accounts = await client.getAccountList(token.access_token);
      for (const acc of accounts) {
        if (!acc.account_id) continue;
        const report: PlatformReport = await client.getReportData(
          token.access_token,
          acc.account_id,
          startDate,
          endDate,
        );
        summary.cost += report.cost;
        summary.impression += report.impression;
        summary.click += report.click;
        summary.conversion += report.conversion;
        recordCount++;
      }
      await this.writeSyncLog(
        orgId,
        platform,
        'report',
        'success',
        recordCount,
        JSON.stringify({ startDate, endDate, ...summary }),
      );
    } catch (err) {
      await this.writeSyncLog(
        orgId,
        platform,
        'report',
        'failed',
        recordCount,
        undefined,
        err?.message ?? String(err),
      );
      throw err;
    }
  }

  /** 写入同步日志 */
  private async writeSyncLog(
    orgId: string,
    platform: string,
    syncType: string,
    status: string,
    recordCount: number,
    dataSummary?: string,
    errorMessage?: string,
  ): Promise<void> {
    const log = this.syncLogRepo.create({
      organization_id: orgId,
      platform,
      sync_type: syncType,
      status,
      record_count: recordCount,
      data_summary: dataSummary,
      error_message: errorMessage,
    });
    await this.syncLogRepo.save(log);
  }
}
