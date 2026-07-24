import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketingService } from './marketing.service';
import { MarketingController } from './marketing.controller';
import { MarketingMaterial } from './marketing-material.entity';
import { ComplianceModule } from '../compliance/compliance.module';

// 控制器
import { AdAccountController } from './ad-account.controller';
import { AdPlanController } from './ad-plan.controller';
import { MaterialController } from './material.controller';
import { SocialAccountController } from './social-account.controller';
import { ConversionController } from './conversion.controller';
import { SocialPostController } from './social-post.controller';
import { MarketingContentController } from './marketing-content.controller';

// 服务
import { AdAccountService } from './ad-account.service';
import { AdPlanService } from './ad-plan.service';
import { MaterialService } from './material.service';
import { SocialAccountService } from './social-account.service';
import { ConversionService } from './conversion.service';
import { SocialPostService } from './social-post.service';
import { MarketingComplianceService } from './marketing-compliance.service';
import { ContentGeneratorService } from './content-generator.service';

// 实体
import { AdAccount } from './ad-account.entity';
import { AdAccountWarning } from './ad-account-warning.entity';
import { AdPlan } from './ad-plan.entity';
import { AdPlanLog } from './ad-plan-log.entity';
import { AdMaterial } from './ad-material.entity';
import { SocialAccount } from './social-account.entity';
import { SocialPost } from './social-post.entity';
import { ConversionEvent } from './conversion-event.entity';
import { ContentTemplate } from './content-template.entity';
import { Lead } from '../lead/lead.entity';
import { Case } from '../case/case.entity';
import { User } from '../user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // 保留原有实体
      MarketingMaterial,
      // 广告账户与计划
      AdAccount,
      AdAccountWarning,
      AdPlan,
      AdPlanLog,
      AdMaterial,
      // 社交账号与发布
      SocialAccount,
      SocialPost,
      // 转化事件
      ConversionEvent,
      // 内容模板
      ContentTemplate,
      // 关联实体
      Lead,
      Case,
      User,
    ]),
    ComplianceModule,
  ],
  providers: [
    // 保留原有服务
    MarketingService,
    // 广告账户与计划服务
    AdAccountService,
    AdPlanService,
    // 素材服务
    MaterialService,
    // 社交账号与发布服务
    SocialAccountService,
    SocialPostService,
    // 转化服务
    ConversionService,
    // 营销合规服务
    MarketingComplianceService,
    // 内容生成服务
    ContentGeneratorService,
  ],
  controllers: [
    // 保留原有控制器
    MarketingController,
    // 广告账户与计划控制器
    AdAccountController,
    AdPlanController,
    // 素材控制器
    MaterialController,
    // 社交账号与发布控制器
    SocialAccountController,
    SocialPostController,
    // 转化控制器
    ConversionController,
    // 营销内容控制器
    MarketingContentController,
  ],
})
export class MarketingModule {}
