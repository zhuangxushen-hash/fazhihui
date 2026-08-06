/**
 * 广告平台对接配置
 * 各平台 App ID 和 App Secret 在此统一配置
 * 部署后在配置文件或环境变量中填入真实凭证
 */

export type PlatformCode = 'ocean_engine' | 'baidu_marketing' | 'tencent_ads' | 'kuaishou_ads' | 'douyin_open';

export interface PlatformConfig {
  /** 平台标识 */
  code: PlatformCode;
  /** 平台中文名称 */
  name: string;
  /** OAuth 授权地址 */
  authUrl: string;
  /** Token 获取地址 */
  tokenUrl: string;
  /** API 基础地址 */
  apiBaseUrl: string;
  /** 回调地址前缀（部署后替换为真实域名） */
  redirectUri: string;
  /** App ID（部署后填入） */
  appId: string;
  /** App Secret（部署后填入） */
  appSecret: string;
  /** Token 刷新间隔（秒） */
  refreshIntervalSec: number;
}

/**
 * 五大广告平台配置
 * appId/appSecret 留空，部署后从环境变量或配置文件读取
 */
export const PLATFORM_CONFIGS: Record<PlatformCode, PlatformConfig> = {
  // 巨量引擎（抖音广告投放平台）
  ocean_engine: {
    code: 'ocean_engine',
    name: '巨量引擎',
    authUrl: 'https://open.oceanengine.com/audit/oauth.html',
    tokenUrl: 'https://ad.oceanengine.com/open_api/2/oauth2/access_token/',
    apiBaseUrl: 'https://ad.oceanengine.com/open_api/2/',
    redirectUri: process.env.OAUTH_REDIRECT_BASE || 'http://localhost:3001',
    appId: process.env.OCEAN_ENGINE_APP_ID || '',
    appSecret: process.env.OCEAN_ENGINE_APP_SECRET || '',
    refreshIntervalSec: 86400,
  },
  // 百度营销（百度广告投放平台）
  baidu_marketing: {
    code: 'baidu_marketing',
    name: '百度营销',
    authUrl: 'https://open.baidu.com/oauth/2.0/authorize',
    tokenUrl: 'https://open.baidu.com/oauth/2.0/token',
    apiBaseUrl: 'https://api.baidu.com/json/sms/v3/',
    redirectUri: process.env.OAUTH_REDIRECT_BASE || 'http://localhost:3001',
    appId: process.env.BAIDU_MARKETING_APP_ID || '',
    appSecret: process.env.BAIDU_MARKETING_APP_SECRET || '',
    refreshIntervalSec: 2592000,
  },
  // 腾讯广告（广点通广告投放平台）
  tencent_ads: {
    code: 'tencent_ads',
    name: '腾讯广告',
    authUrl: 'https://developers.e.qq.com/oauth/authorize',
    tokenUrl: 'https://api.e.qq.com/oauth/token',
    apiBaseUrl: 'https://api.e.qq.com/v1.1/',
    redirectUri: process.env.OAUTH_REDIRECT_BASE || 'http://localhost:3001',
    appId: process.env.TENCENT_ADS_APP_ID || '',
    appSecret: process.env.TENCENT_ADS_APP_SECRET || '',
    refreshIntervalSec: 86400,
  },
  // 磁力引擎（快手广告投放平台）
  kuaishou_ads: {
    code: 'kuaishou_ads',
    name: '磁力引擎',
    authUrl: 'https://open.kuaishou.com/oauth2/authorize',
    tokenUrl: 'https://open.kuaishou.com/oauth2/access_token',
    apiBaseUrl: 'https://open.kuaishou.com/openapi/',
    redirectUri: process.env.OAUTH_REDIRECT_BASE || 'http://localhost:3001',
    appId: process.env.KUAISHOU_ADS_APP_ID || '',
    appSecret: process.env.KUAISHOU_ADS_APP_SECRET || '',
    refreshIntervalSec: 86400,
  },
  // 抖音运营（抖音开放平台，内容运营数据）
  douyin_open: {
    code: 'douyin_open',
    name: '抖音运营',
    authUrl: 'https://open.douyin.com/platform/oauth/connect/',
    tokenUrl: 'https://open.douyin.com/oauth/access_token/',
    apiBaseUrl: 'https://open.douyin.com/',
    redirectUri: process.env.OAUTH_REDIRECT_BASE || 'http://localhost:3001',
    appId: process.env.DOUYIN_OPEN_APP_ID || '',
    appSecret: process.env.DOUYIN_OPEN_APP_SECRET || '',
    refreshIntervalSec: 604800,
  },
};
