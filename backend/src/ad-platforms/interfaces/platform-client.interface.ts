import { PlatformCode } from '../ad-platforms.config';

/**
 * 平台客户端通用接口
 * 五大广告平台均实现此接口，统一调用方式
 */
export interface IPlatformClient {
  /** 平台标识 */
  readonly platform: PlatformCode;

  /** 生成 OAuth 授权链接 */
  getAuthUrl(state: string): string;

  /** 用授权码换取 access_token 和 refresh_token */
  exchangeCodeForToken(code: string): Promise<PlatformTokenData>;

  /** 刷新 access_token */
  refreshToken(refreshToken: string): Promise<PlatformTokenData>;

  /** 获取广告主账户列表 */
  getAccountList(accessToken: string): Promise<PlatformAccount[]>;

  /** 获取账户余额 */
  getAccountBalance(accessToken: string, accountId: string): Promise<number>;

  /** 获取投放计划列表 */
  getCampaignList(accessToken: string, accountId: string): Promise<PlatformCampaign[]>;

  /** 获取投放报表数据（消耗、展示、点击等） */
  getReportData(
    accessToken: string,
    accountId: string,
    startDate: string,
    endDate: string,
  ): Promise<PlatformReport>;

  /** 创建投放计划 */
  createCampaign(accessToken: string, accountId: string, campaign: Partial<PlatformCampaign>): Promise<string>;

  /** 更新投放计划状态（启动/暂停） */
  updateCampaignStatus(accessToken: string, accountId: string, campaignId: string, status: string): Promise<boolean>;

  /** 回传转化数据 */
  reportConversion(accessToken: string, accountId: string, data: ConversionReportData): Promise<boolean>;
}

/** 平台 Token 数据结构 */
export interface PlatformTokenData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: Date;
  refresh_expires_at?: Date;
  account_id?: string;
  advertiser_id?: string;
  raw?: unknown;
}

/** 平台广告主账户信息 */
export interface PlatformAccount {
  account_id: string;
  account_name: string;
  balance: number;
  status: string;
  company?: string;
}

/** 平台投放计划信息 */
export interface PlatformCampaign {
  campaign_id: string;
  campaign_name: string;
  status: string;
  budget: number;
  bid?: number;
  start_date?: string;
  end_date?: string;
  platform_campaign_id?: string;
}

/** 平台报表数据 */
export interface PlatformReport {
  cost: number;
  impression: number;
  click: number;
  conversion: number;
  ctr: number;
  cpc: number;
  cpm: number;
  roi?: number;
  raw?: unknown;
}

/** 转化回传数据 */
export interface ConversionReportData {
  event_type: 'lead' | 'wechat_add' | 'invite' | 'sign';
  click_id?: string;
  conversion_id?: string;
  amount?: number;
  timestamp: string;
  raw?: unknown;
}
