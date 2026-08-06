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
 * 巨量引擎（抖音广告投放平台）API 对接服务
 * 文档参考：https://open.oceanengine.com/
 * 部署后需在环境变量配置 OCEAN_ENGINE_APP_ID 和 OCEAN_ENGINE_APP_SECRET
 */
@Injectable()
export class OceanEngineService implements IPlatformClient {
  private readonly logger = new Logger(OceanEngineService.name);
  readonly platform: PlatformCode = 'ocean_engine';
  private config = PLATFORM_CONFIGS.ocean_engine;

  /**
   * 生成 OAuth 授权链接
   * 巨量引擎使用 scope=ad_management 授权广告管理权限
   */
  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.appId,
      redirect_uri: `${this.config.redirectUri}/oauth/callback/ocean_engine`,
      response_type: 'code',
      scope: 'ad_management',
      state,
    });
    return `${this.config.authUrl}?${params.toString()}`;
  }

  /**
   * 用授权码换取 access_token
   * 巨量引擎返回 access_token / refresh_token / expires_in / advertiser_ids
   */
  async exchangeCodeForToken(code: string): Promise<PlatformTokenData> {
    const response = await axios.post(this.config.tokenUrl, {
      app_id: this.config.appId,
      secret: this.config.appSecret,
      grant_type: 'authorization_code',
      code,
    });

    const data = response.data?.data || response.data;
    const expiresIn = data.expires_in || 86400;
    const now = Date.now();
    const advertiserId = Array.isArray(data.advertiser_ids) ? data.advertiser_ids[0] : data.advertiser_id;

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: expiresIn,
      expires_at: new Date(now + expiresIn * 1000),
      refresh_expires_at: new Date(now + 30 * 86400 * 1000),
      advertiser_id: advertiserId,
      raw: response.data,
    };
  }

  /**
   * 刷新 access_token
   * 巨量引擎刷新接口与获取接口一致，grant_type 改为 refresh_token
   */
  async refreshToken(refreshToken: string): Promise<PlatformTokenData> {
    const response = await axios.post(this.config.tokenUrl, {
      app_id: this.config.appId,
      secret: this.config.appSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    const data = response.data?.data || response.data;
    const expiresIn = data.expires_in || 86400;
    const now = Date.now();

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token || refreshToken,
      expires_in: expiresIn,
      expires_at: new Date(now + expiresIn * 1000),
      refresh_expires_at: new Date(now + 30 * 86400 * 1000),
      raw: response.data,
    };
  }

  /**
   * 获取广告主账户列表
   * 接口：GET /advertiser/list/
   */
  async getAccountList(accessToken: string): Promise<PlatformAccount[]> {
    const url = `${this.config.apiBaseUrl}advertiser/list/`;
    const response = await axios.get(url, {
      params: { access_token: accessToken },
    });

    const list = response.data?.data?.list || [];
    return list.map((item: any) => ({
      account_id: String(item.id || item.advertiser_id),
      account_name: item.name || item.company || '',
      balance: Number(item.balance || 0),
      status: item.status === 'ENABLE' ? 'active' : 'disabled',
      company: item.company,
    }));
  }

  /**
   * 获取账户余额
   * 接口：GET /advertiser/info/
   * 巨量引擎账户信息接口返回 balance 字段（单位：元）
   */
  async getAccountBalance(accessToken: string, accountId: string): Promise<number> {
    const url = `${this.config.apiBaseUrl}advertiser/info/`;
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
   * 接口：GET /campaign/list/
   */
  async getCampaignList(accessToken: string, accountId: string): Promise<PlatformCampaign[]> {
    const url = `${this.config.apiBaseUrl}campaign/list/`;
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
      status: item.status === 'CAMPAIGN_STATUS_ENABLE' ? 'active' : 'paused',
      budget: Number(item.budget || 0),
      bid: Number(item.bid || 0),
      start_date: item.start_time,
      end_date: item.end_time,
    }));
  }

  /**
   * 获取报表数据
   * 巨量引擎报表需先创建报表任务，再轮询获取结果
   * 此处使用综合统计接口 /report/integrated/get/ 直接获取汇总数据
   */
  async getReportData(
    accessToken: string,
    accountId: string,
    startDate: string,
    endDate: string,
  ): Promise<PlatformReport> {
    const url = `${this.config.apiBaseUrl}report/integrated/get/`;
    const response = await axios.get(url, {
      params: {
        access_token: accessToken,
        advertiser_id: accountId,
        start_date: startDate.replace(/-/g, ''),
        end_date: endDate.replace(/-/g, ''),
        group_by: 'STAT_GROUP_STAT_TIME',
        time_granularity: 'STAT_TIME_GRANULARITY_DAILY',
        fields: JSON.stringify(['stat_cost', 'show_cnt', 'click_cnt', 'convert_cnt']),
      },
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
   * 接口：POST /campaign/create/
   */
  async createCampaign(
    accessToken: string,
    accountId: string,
    campaign: Partial<PlatformCampaign>,
  ): Promise<string> {
    const url = `${this.config.apiBaseUrl}campaign/create/`;
    const response = await axios.post(url, {
      access_token: accessToken,
      advertiser_id: Number(accountId),
      campaign_name: campaign.campaign_name,
      budget: campaign.budget,
      bid: campaign.bid,
      start_time: campaign.start_date,
      end_time: campaign.end_date,
      status: 'CAMPAIGN_STATUS_ENABLE',
    });

    const campaignId = response.data?.data?.campaign_id;
    return String(campaignId);
  }

  /**
   * 更新投放计划状态
   * 接口：POST /campaign/update/status/
   * status 取值：active 启用 / paused 暂停
   */
  async updateCampaignStatus(
    accessToken: string,
    accountId: string,
    campaignId: string,
    status: string,
  ): Promise<boolean> {
    const url = `${this.config.apiBaseUrl}campaign/update/status/`;
    const oceanStatus = status === 'active' ? 'CAMPAIGN_STATUS_ENABLE' : 'CAMPAIGN_STATUS_DISABLE';
    const response = await axios.post(url, {
      access_token: accessToken,
      advertiser_id: Number(accountId),
      campaign_id: Number(campaignId),
      status: oceanStatus,
    });

    return Number(response.data?.code) === 0;
  }

  /**
   * 回传转化数据
   * 接口：POST /convert_data/
   * 巨量引擎通过 click_id 关联点击与转化事件
   */
  async reportConversion(
    accessToken: string,
    accountId: string,
    data: ConversionReportData,
  ): Promise<boolean> {
    const url = `${this.config.apiBaseUrl}convert_data/`;
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
