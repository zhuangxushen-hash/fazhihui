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
 * 磁力引擎（快手广告投放平台）API 对接服务
 * 文档参考：https://open.kuaishou.com/
 * 部署后需在环境变量配置 KUAISHOU_ADS_APP_ID 和 KUAISHOU_ADS_APP_SECRET
 * 快手广告 API 通过 access_token 鉴权，账户通过 advertiser_id 区分
 */
@Injectable()
export class KuaishouAdsService implements IPlatformClient {
  private readonly logger = new Logger(KuaishouAdsService.name);
  readonly platform: PlatformCode = 'kuaishou_ads';
  private config = PLATFORM_CONFIGS.kuaishou_ads;

  /**
   * 生成 OAuth 授权链接
   * 快手使用 scope=ad_management 授权广告管理权限
   */
  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.appId,
      redirect_uri: `${this.config.redirectUri}/oauth/callback/kuaishou_ads`,
      response_type: 'code',
      scope: 'ad_management',
      state,
    });
    return `${this.config.authUrl}?${params.toString()}`;
  }

  /**
   * 用授权码换取 access_token
   * 快手返回 access_token / refresh_token / expires_in / refresh_token_expires_in / advertiser_ids
   */
  async exchangeCodeForToken(code: string): Promise<PlatformTokenData> {
    const response = await axios.post(this.config.tokenUrl, {
      app_id: this.config.appId,
      sign: this.config.appSecret,
      grant_type: 'authorization_code',
      code,
    });

    const data = response.data;
    const expiresIn = data.expires_in || 86400;
    const refreshExpiresIn = data.refresh_token_expires_in || 30 * 86400;
    const now = Date.now();
    const advertiserId = Array.isArray(data.advertiser_ids) ? data.advertiser_ids[0] : undefined;

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: expiresIn,
      expires_at: new Date(now + expiresIn * 1000),
      refresh_expires_at: new Date(now + refreshExpiresIn * 1000),
      advertiser_id: advertiserId,
      raw: response.data,
    };
  }

  /**
   * 刷新 access_token
   * 快手刷新接口与获取接口一致，grant_type 改为 refresh_token
   */
  async refreshToken(refreshToken: string): Promise<PlatformTokenData> {
    const response = await axios.post(this.config.tokenUrl, {
      app_id: this.config.appId,
      sign: this.config.appSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    const data = response.data;
    const expiresIn = data.expires_in || 86400;
    const refreshExpiresIn = data.refresh_token_expires_in || 30 * 86400;
    const now = Date.now();

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token || refreshToken,
      expires_in: expiresIn,
      expires_at: new Date(now + expiresIn * 1000),
      refresh_expires_at: new Date(now + refreshExpiresIn * 1000),
      raw: response.data,
    };
  }

  /**
   * 获取广告主账户列表
   * 接口：GET /v1/account/list
   * 返回当前授权账户下可管理的广告主列表
   */
  async getAccountList(accessToken: string): Promise<PlatformAccount[]> {
    const url = `${this.config.apiBaseUrl}v1/account/list`;
    const response = await axios.get(url, {
      params: {
        access_token: accessToken,
      },
    });

    const list = response.data?.data?.list || [];
    return list.map((item: any) => ({
      account_id: String(item.advertiser_id || item.account_id),
      account_name: item.name || item.company || '',
      balance: Number(item.balance || 0),
      status: item.status === 'STATUS_ENABLE' ? 'active' : 'disabled',
      company: item.company,
    }));
  }

  /**
   * 获取账户余额
   * 接口：GET /v1/account/info
   * 快手账户信息接口返回 balance 字段（单位：元）
   */
  async getAccountBalance(accessToken: string, accountId: string): Promise<number> {
    const url = `${this.config.apiBaseUrl}v1/account/info`;
    const response = await axios.get(url, {
      params: {
        access_token: accessToken,
        advertiser_id: accountId,
      },
    });

    const info = response.data?.data;
    return Number(info?.balance || 0);
  }

  /**
   * 获取投放计划列表
   * 接口：GET /v1/campaign/list
   */
  async getCampaignList(accessToken: string, accountId: string): Promise<PlatformCampaign[]> {
    const url = `${this.config.apiBaseUrl}v1/campaign/list`;
    const response = await axios.get(url, {
      params: {
        access_token: accessToken,
        advertiser_id: accountId,
        page: 1,
        page_size: 100,
      },
    });

    const list = response.data?.data?.list || [];
    return list.map((item: any) => ({
      campaign_id: String(item.campaign_id),
      campaign_name: item.campaign_name,
      status: item.status === 'STATUS_ENABLE' ? 'active' : 'paused',
      budget: Number(item.day_budget || item.budget || 0),
      bid: Number(item.bid || 0),
      start_date: item.put_start_time,
      end_date: item.put_end_time,
    }));
  }

  /**
   * 获取报表数据
   * 接口：POST /v1/report/campaign_report
   * 快手报表按计划维度返回，此处累加汇总
   */
  async getReportData(
    accessToken: string,
    accountId: string,
    startDate: string,
    endDate: string,
  ): Promise<PlatformReport> {
    const url = `${this.config.apiBaseUrl}v1/report/campaign_report`;
    const response = await axios.post(url, {
      access_token: accessToken,
      advertiser_id: accountId,
      start_date: startDate.replace(/-/g, ''),
      end_date: endDate.replace(/-/g, ''),
      group_by: 'STAT_GROUP_BY_STAT_TIME',
      time_granularity: 'DAILY',
      fields: ['stat_cost', 'show_cnt', 'click_cnt', 'convert_cnt'],
    });

    const rows = response.data?.data?.list || [];
    let cost = 0;
    let impression = 0;
    let click = 0;
    let conversion = 0;
    for (const row of rows) {
      cost += Number(row.stat_cost || 0);
      impression += Number(row.show_cnt || 0);
      click += Number(row.click_cnt || 0);
      conversion += Number(row.convert_cnt || 0);
    }

    const ctr = impression > 0 ? click / impression : 0;
    const cpc = click > 0 ? cost / click : 0;
    const cpm = impression > 0 ? (cost / impression) * 1000 : 0;

    return {
      cost,
      impression,
      click,
      conversion,
      ctr,
      cpc,
      cpm,
      raw: response.data,
    };
  }

  /**
   * 创建投放计划
   * 接口：POST /v1/campaign/create
   */
  async createCampaign(
    accessToken: string,
    accountId: string,
    campaign: Partial<PlatformCampaign>,
  ): Promise<string> {
    const url = `${this.config.apiBaseUrl}v1/campaign/create`;
    const response = await axios.post(url, {
      access_token: accessToken,
      advertiser_id: Number(accountId),
      campaign_name: campaign.campaign_name,
      day_budget: campaign.budget,
      bid: campaign.bid,
      put_start_time: campaign.start_date,
      put_end_time: campaign.end_date,
      status: 'STATUS_ENABLE',
    });

    const campaignId = response.data?.data?.campaign_id;
    return String(campaignId);
  }

  /**
   * 更新投放计划状态
   * 接口：POST /v1/campaign/update/status
   * status 取值：active 启用 / paused 暂停
   */
  async updateCampaignStatus(
    accessToken: string,
    accountId: string,
    campaignId: string,
    status: string,
  ): Promise<boolean> {
    const url = `${this.config.apiBaseUrl}v1/campaign/update/status`;
    const kuaishouStatus = status === 'active' ? 'STATUS_ENABLE' : 'STATUS_DISABLE';
    const response = await axios.post(url, {
      access_token: accessToken,
      advertiser_id: Number(accountId),
      campaign_id: Number(campaignId),
      status: kuaishouStatus,
    });

    return Number(response.data?.code) === 0;
  }

  /**
   * 回传转化数据
   * 接口：POST /v1/convert/upload
   * 快手通过 click_id 关联点击与转化事件
   */
  async reportConversion(
    accessToken: string,
    accountId: string,
    data: ConversionReportData,
  ): Promise<boolean> {
    const url = `${this.config.apiBaseUrl}v1/convert/upload`;
    const eventTypeMap: Record<string, string> = {
      lead: 'CONVERSION_TYPE_LEAD',
      wechat_add: 'CONVERSION_TYPE_WECHAT_ADD',
      invite: 'CONVERSION_TYPE_INVITE',
      sign: 'CONVERSION_TYPE_SIGN',
    };
    const response = await axios.post(url, {
      access_token: accessToken,
      advertiser_id: Number(accountId),
      click_id: data.click_id,
      event_type: eventTypeMap[data.event_type] || data.event_type,
      convert_id: data.conversion_id,
      convert_time: data.timestamp,
      amount: data.amount,
    });

    return Number(response.data?.code) === 0;
  }
}
