import {
  Controller,
  Post,
  Param,
  Body,
  Query,
  Headers,
  UnauthorizedException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { LeadService } from '../lead/lead.service';
import { AdPlatformToken } from './ad-platform-token.entity';
import { AdAccount } from '../marketing/ad-account.entity';
import { ConversionEvent } from '../marketing/conversion-event.entity';
import { PLATFORM_CONFIGS, PlatformCode } from './ad-platforms.config';
import {
  AdPlatform,
  AdChannel,
  LeadSource,
  ConversionEventType,
} from '../types';

/** 归一化后的线索/转化字段 */
interface NormalizedLead {
  phone: string;
  name: string;
  campaign_id: string;
  ad_id: string;
  clue_id: string;
  account_id: string;
}

/**
 * Webhook 线索归集控制器
 * 接收各广告平台的线索留资与转化数据回调
 * 无需 JWT 鉴权（外部平台回调），但需通过签名校验
 */
@Controller('ad-platforms/webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    @InjectRepository(AdPlatformToken)
    private tokenRepo: Repository<AdPlatformToken>,
    @InjectRepository(AdAccount)
    private adAccountRepo: Repository<AdAccount>,
    @InjectRepository(ConversionEvent)
    private conversionEventRepo: Repository<ConversionEvent>,
    // 通过 forwardRef 注入 LeadService，用于线索入库
    @Inject(forwardRef(() => LeadService))
    private leadService: LeadService,
  ) {}

  /**
   * 接收平台线索留资回调
   * 数据归一化后入库到 leads 表
   */
  @Post(':platform/lead')
  async lead(
    @Param('platform') platform: string,
    @Body() body: any,
    @Query('signature') querySignature: string,
    @Headers('x-signature') headerSignature: string,
    @Headers('signature') headerSignature2: string,
  ) {
    // 验签：签名可由 query 或 header 传入
    this.verifySignature(
      platform,
      body,
      querySignature || headerSignature || headerSignature2,
    );
    const data = this.normalizeLead(platform, body);
    if (!data.phone) {
      throw new BadRequestException('线索缺少手机号');
    }
    const orgId = await this.resolveOrgId(platform, data.account_id);
    if (!orgId) {
      throw new BadRequestException('无法识别线索归属组织');
    }
    const lead = await this.leadService.create({
      source_channel: this.mapToLeadSource(platform),
      phone: data.phone,
      contact_name: data.name,
      case_description: data.clue_id ? `广告线索 ${data.clue_id}` : '广告线索留资',
      landing_page: `webhook/${platform}/lead`,
      lead_source_detail: data.campaign_id
        ? `${platform}/${data.campaign_id}`
        : platform,
      organization_id: orgId,
    });
    this.logger.log(`收到 ${platform} 线索回调，已入库 lead=${lead.id}`);
    return { success: true, lead_id: lead.id };
  }

  /**
   * 接收转化数据回调
   * 数据归一化后记录到 conversion_events 表
   */
  @Post(':platform/conversion')
  async conversion(
    @Param('platform') platform: string,
    @Body() body: any,
    @Query('signature') querySignature: string,
    @Headers('x-signature') headerSignature: string,
    @Headers('signature') headerSignature2: string,
  ) {
    this.verifySignature(
      platform,
      body,
      querySignature || headerSignature || headerSignature2,
    );
    const data = this.normalizeLead(platform, body);
    const orgId = await this.resolveOrgId(platform, data.account_id);
    if (!orgId) {
      throw new BadRequestException('无法识别转化数据归属组织');
    }
    const event = this.conversionEventRepo.create({
      channel: this.mapToAdChannel(platform),
      account_id: data.account_id,
      plan_id: data.campaign_id,
      event_type: this.mapEventType(body.event_type),
      amount: Number(body.amount || 0),
      keyword: body.keyword,
      organization_id: orgId,
    });
    const saved = await this.conversionEventRepo.save(event);
    this.logger.log(`收到 ${platform} 转化回调，已入库 event=${saved.id}`);
    return { success: true, event_id: saved.id };
  }

  /**
   * Webhook 验签
   * 使用平台 appSecret 对请求体计算 HMAC-SHA256，与传入签名做时序安全比对
   */
  private verifySignature(platform: string, body: any, signature: string): void {
    const config = PLATFORM_CONFIGS[platform as PlatformCode];
    if (!config) {
      throw new BadRequestException(`不支持的平台: ${platform}`);
    }
    if (!config.appSecret || !signature) {
      throw new UnauthorizedException('验签失败：缺少签名或平台密钥未配置');
    }
    const expected = crypto
      .createHmac('sha256', config.appSecret)
      .update(JSON.stringify(body))
      .digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      throw new UnauthorizedException('验签失败：签名不匹配');
    }
  }

  /**
   * 各平台线索/转化数据归一化
   * 将不同平台的字段名映射为统一结构
   */
  private normalizeLead(platform: string, body: any): NormalizedLead {
    switch (platform) {
      case 'ocean_engine':
        // 巨量引擎：clue_id/name/phone/form_id/campaign_id/ad_id/advertiser_id
        return {
          phone: body.phone,
          name: body.name,
          campaign_id: body.campaign_id,
          ad_id: body.ad_id,
          clue_id: body.clue_id,
          account_id: body.advertiser_id,
        };
      case 'baidu_marketing':
        // 百度营销：clue_id/name/phone/plan_id/unit_id/idea_id/account_id
        return {
          phone: body.phone,
          name: body.name,
          campaign_id: body.plan_id,
          ad_id: body.idea_id,
          clue_id: body.clue_id,
          account_id: body.account_id,
        };
      case 'tencent_ads':
        // 腾讯广告：outer_leads_id/name/phone/leads_form_id/adgroup_id/account_id
        return {
          phone: body.phone,
          name: body.name,
          campaign_id: body.campaign_id,
          ad_id: body.adgroup_id,
          clue_id: body.outer_leads_id,
          account_id: body.account_id,
        };
      case 'kuaishou_ads':
        // 磁力引擎：clue_id/name/phone/campaign_id/advertiser_id
        return {
          phone: body.phone,
          name: body.name,
          campaign_id: body.campaign_id,
          ad_id: body.ad_id,
          clue_id: body.clue_id,
          account_id: body.advertiser_id,
        };
      case 'douyin_open':
        // 抖音运营：open_id/name/phone/campaign_id
        return {
          phone: body.phone,
          name: body.name,
          campaign_id: body.campaign_id,
          ad_id: body.ad_id,
          clue_id: body.clue_id,
          account_id: body.open_id,
        };
      default:
        return {
          phone: body.phone,
          name: body.name,
          campaign_id: body.campaign_id,
          ad_id: body.ad_id,
          clue_id: body.clue_id,
          account_id: body.account_id,
        };
    }
  }

  /**
   * 根据平台账户标识解析归属组织ID
   * 优先查 AdPlatformToken，其次查 AdAccount
   */
  private async resolveOrgId(
    platform: string,
    accountId: string,
  ): Promise<string> {
    if (accountId) {
      const token = await this.tokenRepo.findOne({
        where: { platform, account_id: accountId, token_status: 'active' },
      });
      if (token) {
        return token.organization_id;
      }
      const acc = await this.adAccountRepo.findOne({
        where: {
          platform: this.mapToAdPlatform(platform),
          account_id: accountId,
        },
      });
      if (acc) {
        return acc.organization_id;
      }
    }
    return null;
  }

  /** 平台标识到 LeadSource 的映射 */
  private mapToLeadSource(platform: string): LeadSource {
    switch (platform) {
      case 'ocean_engine':
        return LeadSource.DOUYIN;
      case 'baidu_marketing':
        return LeadSource.BAIDU;
      case 'kuaishou_ads':
        return LeadSource.KUAISHOU;
      case 'tencent_ads':
        return LeadSource.OTHER;
      default:
        return LeadSource.DOUYIN;
    }
  }

  /** 平台标识到 AdPlatform 的映射 */
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
        return AdPlatform.DOUYIN;
    }
  }

  /** 平台标识到 AdChannel 的映射 */
  private mapToAdChannel(platform: string): AdChannel {
    switch (platform) {
      case 'ocean_engine':
        return AdChannel.DOUYIN;
      case 'baidu_marketing':
        return AdChannel.BAIDU;
      case 'kuaishou_ads':
        return AdChannel.KUAISHOU;
      case 'tencent_ads':
        return AdChannel.OTHER;
      default:
        return AdChannel.DOUYIN;
    }
  }

  /** 转化事件类型映射 */
  private mapEventType(eventType: string): ConversionEventType {
    switch (eventType) {
      case 'lead':
        return ConversionEventType.LEAD;
      case 'wechat_add':
        return ConversionEventType.WECHAT_ADD;
      case 'invite':
        return ConversionEventType.INVITE;
      case 'sign':
        return ConversionEventType.SIGN;
      default:
        return ConversionEventType.LEAD;
    }
  }
}
