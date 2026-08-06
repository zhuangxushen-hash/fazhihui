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
 * 百度营销（百度广告投放平台）API 对接服务
 * 文档参考：https://fengchao.baidu.com/
 * 部署后需在环境变量配置 BAIDU_MARKETING_APP_ID 和 BAIDU_MARKETING_APP_SECRET
 * 百度营销 API 均使用 POST 方式，请求体为 JSON，响应体统一为 { header, body }
 */
@Injectable()
export class BaiduMarketingService implements IPlatformClient {
  private readonly logger = new Logger(BaiduMarketingService.name);
  readonly platform: PlatformCode = 'baidu_marketing';
  private config = PLATFORM_CONFIGS.baidu_marketing;

  /**
   * 生成 OAuth 授权链接
   * 百度营销使用 response_type=code 授权码模式
   */
  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.appId,
      redirect_uri: `${this.config.redirectUri}/oauth/callback/baidu_marketing`,
      response_type: 'code',
      scope: 'view manage',
      state,
    });
    return `${this.config.authUrl}?${params.toString()}`;
  }

  /**
   * 用授权码换取 access_token
   * 百度返回 access_token / refresh_token / expires_in
   */
  async exchangeCodeForToken(code: string): Promise<PlatformTokenData> {
    const response = await axios.post(this.config.tokenUrl, null, {
      params: {
        grant_type: 'authorization_code',
        code,
        client_id: this.config.appId,
        client_secret: this.config.appSecret,
        redirect_uri: `${this.config.redirectUri}/oauth/callback/baidu_marketing`,
      },
    });

    const data = response.data;
    const expiresIn = data.expires_in || 2592000;
    const now = Date.now();

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: expiresIn,
      expires_at: new Date(now + expiresIn * 1000),
      refresh_expires_at: new Date(now + 10 * 365 * 86400 * 1000),
      raw: response.data,
    };
  }

  /**
   * 刷新 access_token
   * 百度刷新接口与获取接口一致，grant_type 改为 refresh_token
   */
  async refreshToken(refreshToken: string): Promise<PlatformTokenData> {
    const response = await axios.post(this.config.tokenUrl, null, {
      params: {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.config.appId,
        client_secret: this.config.appSecret,
      },
    });

    const data = response.data;
    const expiresIn = data.expires_in || 2592000;
    const now = Date.now();

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token || refreshToken,
      expires_in: expiresIn,
      expires_at: new Date(now + expiresIn * 1000),
      refresh_expires_at: new Date(now + 10 * 365 * 86400 * 1000),
      raw: response.data,
    };
  }

  /**
   * 获取广告主账户信息
   * 百度营销以单账户为主，AccountService/getAccountInfo 返回当前授权账户
   */
  async getAccountList(accessToken: string): Promise<PlatformAccount[]> {
    const url = `${this.config.apiBaseUrl}AccountService/getAccountInfo`;
    const response = await axios.post(url, {
      header: {
        username: this.config.appId,
        password: this.config.appSecret,
        token: accessToken,
      },
      body: {
        accountFields: ['userid', 'bdid', 'balance', 'budget', 'userstat'],
      },
    });

    const body = response.data?.body;
    const data = body?.data?.[0] || body?.data;
    if (!data) {
      return [];
    }

    return [
      {
        account_id: String(data.userid),
        account_name: String(data.bdid || data.userid),
        balance: Number(data.balance || 0),
        status: data.userstat === 0 ? 'active' : 'disabled',
      },
    ];
  }

  /**
   * 获取账户余额
   * 复用 AccountService/getAccountInfo 接口的 balance 字段（单位：元）
   */
  async getAccountBalance(accessToken: string, accountId: string): Promise<number> {
    const url = `${this.config.apiBaseUrl}AccountService/getAccountInfo`;
    const response = await axios.post(url, {
      header: {
        username: this.config.appId,
        password: this.config.appSecret,
        token: accessToken,
      },
      body: {
        accountFields: ['userid', 'balance'],
      },
    });

    const body = response.data?.body;
    const data = body?.data?.[0] || body?.data;
    return Number(data?.balance || 0);
  }

  /**
   * 获取投放计划列表
   * 接口：POST CampaignService/getCampaign
   */
  async getCampaignList(accessToken: string, accountId: string): Promise<PlatformCampaign[]> {
    const url = `${this.config.apiBaseUrl}CampaignService/getCampaign`;
    const response = await axios.post(url, {
      header: {
        username: this.config.appId,
        password: this.config.appSecret,
        token: accessToken,
      },
      body: {
        campaignIds: [],
        campaignFields: [
          'campaignId',
          'campaignName',
          'status',
          'budget',
          'bid',
          'startDate',
          'endDate',
        ],
      },
    });

    const list = response.data?.body?.data || [];
    return list.map((item: any) => ({
      campaign_id: String(item.campaignId),
      campaign_name: item.campaignName,
      status: item.status === 0 ? 'active' : 'paused',
      budget: Number(item.budget || 0),
      bid: Number(item.bid || 0),
      start_date: item.startDate,
      end_date: item.endDate,
    }));
  }

  /**
   * 获取报表数据
   * 接口：POST ReportService/getRealTimeData
   * 百度实时报表按日返回，此处累加汇总
   */
  async getReportData(
    accessToken: string,
    accountId: string,
    startDate: string,
    endDate: string,
  ): Promise<PlatformReport> {
    const url = `${this.config.apiBaseUrl}ReportService/getRealTimeData`;
    const response = await axios.post(url, {
      header: {
        username: this.config.appId,
        password: this.config.appSecret,
        token: accessToken,
      },
      body: {
        reportRequestType: {
          performanceData: ['cost', 'impression', 'click', 'conversion'],
          levelOfDetails: 11,
          unitOfTime: 5,
          startDate,
          endDate,
          device: 0,
        },
      },
    });

    const rows = response.data?.body?.data || [];
    let cost = 0;
    let impression = 0;
    let click = 0;
    let conversion = 0;
    for (const row of rows) {
      cost += Number(row.cost || 0);
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
   * 接口：POST CampaignService/addCampaign
   */
  async createCampaign(
    accessToken: string,
    accountId: string,
    campaign: Partial<PlatformCampaign>,
  ): Promise<string> {
    const url = `${this.config.apiBaseUrl}CampaignService/addCampaign`;
    const response = await axios.post(url, {
      header: {
        username: this.config.appId,
        password: this.config.appSecret,
        token: accessToken,
      },
      body: {
        campaignTypes: [
          {
            campaignName: campaign.campaign_name,
            budget: campaign.budget,
            bid: campaign.bid,
            startDate: campaign.start_date,
            endDate: campaign.end_date,
            status: 0,
          },
        ],
      },
    });

    const campaignId = response.data?.body?.data?.[0]?.campaignId;
    return String(campaignId);
  }

  /**
   * 更新投放计划状态
   * 接口：POST CampaignService/updateCampaign
   * status 取值：0 启用 / 1 暂停
   */
  async updateCampaignStatus(
    accessToken: string,
    accountId: string,
    campaignId: string,
    status: string,
  ): Promise<boolean> {
    const url = `${this.config.apiBaseUrl}CampaignService/updateCampaign`;
    const baiduStatus = status === 'active' ? 0 : 1;
    const response = await axios.post(url, {
      header: {
        username: this.config.appId,
        password: this.config.appSecret,
        token: accessToken,
      },
      body: {
        campaignTypes: [
          {
            campaignId: Number(campaignId),
            status: baiduStatus,
          },
        ],
      },
    });

    return Number(response.data?.header?.status) === 0;
  }

  /**
   * 回传转化数据
   * 接口：POST ConversionService/upload
   * 百度营销通过 clickid 关联点击与转化事件
   */
  async reportConversion(
    accessToken: string,
    accountId: string,
    data: ConversionReportData,
  ): Promise<boolean> {
    const url = `${this.config.apiBaseUrl}ConversionService/upload`;
    const eventTypeMap: Record<string, string> = {
      lead: 'CONVERSION_TYPE_LEAD',
      wechat_add: 'CONVERSION_TYPE_WECHAT_ADD',
      invite: 'CONVERSION_TYPE_INVITE',
      sign: 'CONVERSION_TYPE_SIGN',
    };
    const response = await axios.post(url, {
      header: {
        username: this.config.appId,
        password: this.config.appSecret,
        token: accessToken,
      },
      body: {
        conversionTypes: [
          {
            accountId: Number(accountId),
            clickid: data.click_id,
            conversionType: eventTypeMap[data.event_type] || data.event_type,
            conversionTime: data.timestamp,
            conversionValue: data.amount,
          },
        ],
      },
    });

    return Number(response.data?.header?.status) === 0;
  }
}
