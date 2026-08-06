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
 * 腾讯广告（广点通广告投放平台）API 对接服务
 * 文档参考：https://developers.e.qq.com/
 * 部署后需在环境变量配置 TENCENT_ADS_APP_ID 和 TENCENT_ADS_APP_SECRET
 * 腾讯广告 API 使用 GET 请求 + access_token 查询参数，账号通过 account_id 区分
 */
@Injectable()
export class TencentAdsService implements IPlatformClient {
  private readonly logger = new Logger(TencentAdsService.name);
  readonly platform: PlatformCode = 'tencent_ads';
  private config = PLATFORM_CONFIGS.tencent_ads;

  /**
   * 生成 OAuth 授权链接
   * 腾讯广告使用授权码模式，state 用于防 CSRF
   */
  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.appId,
      redirect_uri: `${this.config.redirectUri}/oauth/callback/tencent_ads`,
      response_type: 'code',
      scope: 'ads_management ads_report',
      state,
    });
    return `${this.config.authUrl}?${params.toString()}`;
  }

  /**
   * 用授权码换取 access_token
   * 腾讯广告返回 access_token / refresh_token / expires_in / refresh_token_expires_in
   */
  async exchangeCodeForToken(code: string): Promise<PlatformTokenData> {
    const response = await axios.post(this.config.tokenUrl, null, {
      params: {
        client_id: this.config.appId,
        client_secret: this.config.appSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${this.config.redirectUri}/oauth/callback/tencent_ads`,
      },
    });

    const data = response.data;
    const expiresIn = data.expires_in || 86400;
    const refreshExpiresIn = data.refresh_token_expires_in || 30 * 86400;
    const now = Date.now();

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: expiresIn,
      expires_at: new Date(now + expiresIn * 1000),
      refresh_expires_at: new Date(now + refreshExpiresIn * 1000),
      account_id: data.authority_id ? String(data.authority_id) : undefined,
      raw: response.data,
    };
  }

  /**
   * 刷新 access_token
   * 腾讯广告刷新接口与获取接口一致，grant_type 改为 refresh_token
   */
  async refreshToken(refreshToken: string): Promise<PlatformTokenData> {
    const response = await axios.post(this.config.tokenUrl, null, {
      params: {
        client_id: this.config.appId,
        client_secret: this.config.appSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      },
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
   * 接口：GET /advertiser_list/get
   * 返回当前授权账户下可管理的广告主列表
   */
  async getAccountList(accessToken: string): Promise<PlatformAccount[]> {
    const url = `${this.config.apiBaseUrl}advertiser_list/get`;
    const response = await axios.get(url, {
      params: {
        access_token: accessToken,
      },
    });

    const list = response.data?.data?.list || [];
    return list.map((item: any) => ({
      account_id: String(item.advertiser_id || item.account_id),
      account_name: item.corporation_name || item.advertiser_name || '',
      balance: Number(item.balance || 0),
      status: item.status === 'ADVERTISER_STATUS_NORMAL' ? 'active' : 'disabled',
      company: item.corporation_name,
    }));
  }

  /**
   * 获取账户余额
   * 接口：GET /advertiser/get
   * 腾讯广告账户信息接口返回 balance 字段（单位：分），需转换为元
   */
  async getAccountBalance(accessToken: string, accountId: string): Promise<number> {
    const url = `${this.config.apiBaseUrl}advertiser/get`;
    const response = await axios.get(url, {
      params: {
        access_token: accessToken,
        advertiser_id: accountId,
      },
    });

    const info = response.data?.data;
    // 腾讯广告余额单位为分，转换为元
    return Number(info?.balance || 0) / 100;
  }

  /**
   * 获取投放计划列表
   * 接口：GET /campaigns/get
   */
  async getCampaignList(accessToken: string, accountId: string): Promise<PlatformCampaign[]> {
    const url = `${this.config.apiBaseUrl}campaigns/get`;
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
      status: item.configured_status === 'AD_STATUS_NORMAL' ? 'active' : 'paused',
      budget: Number(item.daily_budget || 0) / 100,
      start_date: item.begin_date,
      end_date: item.end_date,
    }));
  }

  /**
   * 获取报表数据
   * 接口：GET /reports/custom_get（异步报表）
   * 此处使用实时统计接口 /real_time_cost/get 获取汇总消耗数据
   */
  async getReportData(
    accessToken: string,
    accountId: string,
    startDate: string,
    endDate: string,
  ): Promise<PlatformReport> {
    const url = `${this.config.apiBaseUrl}real_time_cost/get`;
    const response = await axios.get(url, {
      params: {
        access_token: accessToken,
        advertiser_id: accountId,
        date_range: JSON.stringify({ start: startDate, end: endDate }),
        group_by: ['date'],
      },
    });

    const rows = response.data?.data?.list || [];
    let cost = 0;
    let impression = 0;
    let click = 0;
    let conversion = 0;
    for (const row of rows) {
      cost += Number(row.cost || 0) / 100;
      impression += Number(row.impression || 0);
      click += Number(row.click || 0);
      conversion += Number(row.conversion || 0);
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
   * 接口：POST /campaigns/add
   * 金额单位为分，需将元转换为分
   */
  async createCampaign(
    accessToken: string,
    accountId: string,
    campaign: Partial<PlatformCampaign>,
  ): Promise<string> {
    const url = `${this.config.apiBaseUrl}campaigns/add`;
    const response = await axios.post(url, null, {
      params: {
        access_token: accessToken,
        advertiser_id: accountId,
      },
      data: {
        campaign_name: campaign.campaign_name,
        daily_budget: Math.round((campaign.budget || 0) * 100),
        campaign_type: 'CAMPAIGN_TYPE_NORMAL',
        promoted_object_type: 'PROMOTED_OBJECT_TYPE_LINK',
        begin_date: campaign.start_date,
        end_date: campaign.end_date,
        configured_status: 'AD_STATUS_NORMAL',
      },
    });

    const campaignId = response.data?.data?.campaign_id;
    return String(campaignId);
  }

  /**
   * 更新投放计划状态
   * 接口：POST /campaigns/update
   * status 取值：active 启用 / paused 暂停
   */
  async updateCampaignStatus(
    accessToken: string,
    accountId: string,
    campaignId: string,
    status: string,
  ): Promise<boolean> {
    const url = `${this.config.apiBaseUrl}campaigns/update`;
    const tencentStatus = status === 'active' ? 'AD_STATUS_NORMAL' : 'AD_STATUS_SUSPEND';
    const response = await axios.post(url, null, {
      params: {
        access_token: accessToken,
        advertiser_id: accountId,
      },
      data: {
        campaign_id: Number(campaignId),
        configured_status: tencentStatus,
      },
    });

    return Number(response.data?.code) === 0;
  }

  /**
   * 回传转化数据
   * 接口：POST /user_actions/add
   * 腾讯广告通过 user_action_set_id 和 click_id 关联用户行为
   */
  async reportConversion(
    accessToken: string,
    accountId: string,
    data: ConversionReportData,
  ): Promise<boolean> {
    const url = `${this.config.apiBaseUrl}user_actions/add`;
    const eventTypeMap: Record<string, string> = {
      lead: 'LEAD',
      wechat_add: 'COMPLETE_ORDER',
      invite: 'INVITE',
      sign: 'SIGN_UP',
    };
    const response = await axios.post(url, null, {
      params: {
        access_token: accessToken,
      },
      data: {
        user_action_set_id: Number(accountId),
        actions: [
          {
            click_id: data.click_id,
            action_type: eventTypeMap[data.event_type] || data.event_type,
            action_time: Math.floor(new Date(data.timestamp).getTime() / 1000),
            value: data.amount,
          },
        ],
      },
    });

    return Number(response.data?.code) === 0;
  }
}
