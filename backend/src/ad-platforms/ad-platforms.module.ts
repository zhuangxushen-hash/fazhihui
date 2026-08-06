import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdPlatformToken } from './ad-platform-token.entity';
import { AdPlatformSyncLog } from './ad-platform-sync-log.entity';
import { AdAccount } from '../marketing/ad-account.entity';
import { ConversionEvent } from '../marketing/conversion-event.entity';
import { TokenManagerService } from './token-manager.service';
import { DataSyncService } from './data-sync.service';
import { OceanEngineService } from './platforms/ocean-engine.service';
import { BaiduMarketingService } from './platforms/baidu-marketing.service';
import { TencentAdsService } from './platforms/tencent-ads.service';
import { KuaishouAdsService } from './platforms/kuaishou-ads.service';
import { DouyinOpenService } from './platforms/douyin-open.service';
import { OauthController } from './oauth.controller';
import { WebhookController } from './webhook.controller';
import { MarketingModule } from '../marketing/marketing.module';
import { LeadModule } from '../lead/lead.module';

/**
 * 广告平台对接模块
 * 装配 Token 管理、数据同步、OAuth 授权、Webhook 线索归集
 * 通过 forwardRef 注入 MarketingModule（用到 AdAccount 实体）和 LeadModule（用到 LeadService）
 */
@Module({
  imports: [
    // AdAccount/ConversionEvent 在本模块直接注册仓储，用于余额更新与转化事件入库
    TypeOrmModule.forFeature([
      AdPlatformToken,
      AdPlatformSyncLog,
      AdAccount,
      ConversionEvent,
    ]),
    forwardRef(() => MarketingModule),
    forwardRef(() => LeadModule),
  ],
  providers: [
    TokenManagerService,
    DataSyncService,
    OceanEngineService,
    BaiduMarketingService,
    TencentAdsService,
    KuaishouAdsService,
    DouyinOpenService,
  ],
  controllers: [OauthController, WebhookController],
  exports: [
    TokenManagerService,
    OceanEngineService,
    BaiduMarketingService,
    TencentAdsService,
    KuaishouAdsService,
    DouyinOpenService,
  ],
})
export class AdPlatformsModule {}
