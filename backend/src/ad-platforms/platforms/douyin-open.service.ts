import axios from 'axios';
import { Injectable, Logger } from '@nestjs/common';
import { PLATFORM_CONFIGS, PlatformCode } from '../ad-platforms.config';
import {
  IPlatformClient,
  PlatformTokenData,
  PlatformAccount,
  PlatformCampaign,
  PlatformReport,
  ConversionReportData,
} from '../interfaces/platform-client.interface';

/**
 * 抖音运营（抖音开放平台）API 对接服务
 * 文档参考：https://open.douyin.com/
 * 部署后需在环境变量配置 DOUYIN_OPEN_APP_ID 和 DOUYIN_OPEN_APP_SECRET
 * 抖音开放平台为内容运营平台，与广告投放平台不同：
 * - 账户概念对应抖音号（通过 /oauth/userinfo/ 获取）
 * - 计划概念对应发布的视频（通过 /video/list/ 获取）
 * - 报表数据对应视频与互动数据（通过 /video/data/ 获取）
 * - 创建计划/状态更新/转化回传等广告相关操作不适用此平台
 */
@Injectable()
export class DouyinOpenService implements IPlatformClient {
  private readonly logger = new Logger(DouyinOpenService.name);
  readonly platform: PlatformCode = 'douyin_open';
  private config = PLATFORM_CONFIGS.douyin_open;

  /**
   * 生成 OAuth 授权链接
   * 抖音开放平台使用 scope=user_info,video.create,video.data 授权内容运营权限
   */
  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_key: this.config.appId,
      redirect_uri: `${this.config.redirectUri}/oauth/callback/douyin_open`,
      response_type: 'code',
      scope: 'user_info,video.create,video.data',
      state,
    });
    return `${this.config.authUrl}?${params.toString()}`;
  }

  /**
   * 用授权码换取 access_token
   * 抖音返回 access_token / refresh_token / expires_in / refresh_expires_in / open_id
   */
  async exchangeCodeForToken(code: string): Promise<PlatformTokenData> {
    const response = await axios.post(this.config.tokenUrl, {
      client_key: this.config.appId,
      client_secret: this.config.appSecret,
      grant_type: 'authorization_code',
      code,
    });

    const data = response.data?.data || response.data;
    const expiresIn = data.expires_in || 604800;
    const refreshExpiresIn = data.refresh_expires_in || 30 * 86400;
    const now = Date.now();

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: expiresIn,
      expires_at: new Date(now + expiresIn * 1000),
      refresh_expires_at: new Date(now + refreshExpiresIn * 1000),
      account_id: data.open_id,
      raw: response.data,
    };
  }

  /**
   * 刷新 access_token
   * 抖音刷新接口与获取接口一致，grant_type 改为 refresh_token
   */
  async refreshToken(refreshToken: string): Promise<PlatformTokenData> {
    const response = await axios.post(this.config.tokenUrl, {
      client_key: this.config.appId,
      client_secret: this.config.appSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    const data = response.data?.data || response.data;
    const expiresIn = data.expires_in || 604800;
    const refreshExpiresIn = data.refresh_expires_in || 30 * 86400;
    const now = Date.now();

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token || refreshToken,
      expires_in: expiresIn,
      expires_at: new Date(now + expiresIn * 1000),
      refresh_expires_at: new Date(now + refreshExpiresIn * 1000),
      account_id: data.open_id,
      raw: response.data,
    };
  }

  /**
   * 获取账户信息（抖音号信息）
   * 接口：GET /oauth/userinfo/
   * 抖音运营为单账户模式，返回当前授权的抖音号信息
   * 内容运营平台无余额概念，balance 固定为 0
   */
  async getAccountList(accessToken: string): Promise<PlatformAccount[]> {
    const url = `${this.config.apiBaseUrl}oauth/userinfo/`;
    const response = await axios.get(url, {
      params: {
        access_token: accessToken,
      },
    });

    const data = response.data?.data;
    if (!data) {
      return [];
    }

    return [
      {
        account_id: String(data.open_id),
        account_name: data.nickname || data.screen_name || '',
        balance: 0,
        status: 'active',
        company: data.union_id,
      },
    ];
  }

  /**
   * 获取账户余额
   * 抖音开放平台为内容运营平台，无账户余额概念，固定返回 0
   */
  async getAccountBalance(accessToken: string, accountId: string): Promise<number> {
    return 0;
  }

  /**
   * 获取视频列表（映射为投放计划列表）
   * 接口：GET /video/list/
   * 抖音运营以视频内容为核心，视频列表映射为计划列表
   */
  async getCampaignList(accessToken: string, accountId: string): Promise<PlatformCampaign[]> {
    const url = `${this.config.apiBaseUrl}video/list/`;
    const response = await axios.get(url, {
      params: {
        access_token: accessToken,
        open_id: accountId,
        cursor: 0,
        count: 20,
      },
    });

    const list = response.data?.data?.list || [];
    return list.map((item: any) => ({
      campaign_id: String(item.item_id || item.video_id),
      campaign_name: item.title || '',
      status: item.status === 'PUBLISHED' ? 'active' : 'paused',
      budget: 0,
      start_date: item.create_time
        ? new Date(item.create_time * 1000).toISOString().slice(0, 10)
        : undefined,
    }));
  }

  /**
   * 获取视频数据报表
   * 接口：GET /video/data/
   * 获取指定视频的播放、点赞、评论等数据，累加汇总为报表
   * 抖音运营平台的数据维度与广告平台不同，此处将视频数据映射为报表字段
   */
  async getReportData(
    accessToken: string,
    accountId: string,
    startDate: string,
    endDate: string,
  ): Promise<PlatformReport> {
    const url = `${this.config.apiBaseUrl}video/data/`;
    const response = await axios.get(url, {
      params: {
        access_token: accessToken,
        open_id: accountId,
        start_date: startDate.replace(/-/g, ''),
        end_date: endDate.replace(/-/g, ''),
      },
    });

    const list = response.data?.data?.list || [];
    let impression = 0;
    let click = 0;
    let conversion = 0;
    for (const item of list) {
      // 播放量映射为展示数
      impression += Number(item.play_count || 0);
      // 点赞数映射为点击数
      click += Number(item.digg_count || 0);
      // 评论数映射为转化数
      conversion += Number(item.comment_count || 0);
    }

    const ctr = impression > 0 ? click / impression : 0;

    return {
      cost: 0,
      impression,
      click,
      conversion,
      ctr,
      cpc: 0,
      cpm: 0,
      raw: response.data,
    };
  }

  /**
   * 创建投放计划
   * 抖音运营平台无投放计划概念，此操作不适用
   * 抖音开放平台的视频发布需调用 /video/upload/ 与 /video/create/ 完整流程
   * 此方法返回空字符串表示不支持直接创建
   */
  async createCampaign(
    accessToken: string,
    accountId: string,
    campaign: Partial<PlatformCampaign>,
  ): Promise<string> {
    this.logger.warn('抖音运营平台不支持直接创建投放计划，请使用视频发布流程');
    return '';
  }

  /**
   * 更新投放计划状态
   * 抖音运营平台无投放计划状态概念，此操作不适用
   * 返回 false 表示不支持此操作
   */
  async updateCampaignStatus(
    accessToken: string,
    accountId: string,
    campaignId: string,
    status: string,
  ): Promise<boolean> {
    this.logger.warn('抖音运营平台不支持更新投放计划状态');
    return false;
  }

  /**
   * 回传转化数据
   * 抖音运营平台为内容运营平台，无转化回传接口
   * 返回 false 表示不支持此操作
   */
  async reportConversion(
    accessToken: string,
    accountId: string,
    data: ConversionReportData,
  ): Promise<boolean> {
    this.logger.warn('抖音运营平台不支持回传转化数据');
    return false;
  }
}
