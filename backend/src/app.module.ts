import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { LeadModule } from './lead/lead.module';
import { CaseModule } from './case/case.module';
import { ComplianceModule } from './compliance/compliance.module';
import { FinanceModule } from './finance/finance.module';
import { ClientModule } from './client/client.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { MarketingModule } from './marketing/marketing.module';
import { SeedsModule } from './seeds/seeds.module';
import { AiModule } from './ai/ai.module';
import { ScrmModule } from './scrm/scrm.module';
import { SystemModule } from './system/system.module';
import { WorklogModule } from './worklog/worklog.module';
import { ContractModule } from './contract/contract.module';
import { ApprovalModule } from './approval/approval.module';
import { SealModule } from './seal/seal.module';
import { ScheduleModule } from './schedule/schedule.module';
import { TaskModule } from './task/task.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { BidModule } from './bid/bid.module';
import { DueDiligenceModule } from './due-diligence/due-diligence.module';
import { DiagramModule } from './diagram/diagram.module';
import { HrModule } from './hr/hr.module';
import { SocialModule } from './social/social.module';
import { MailModule } from './mail/mail.module';
import { PropertyPreservationModule } from './property-preservation/property-preservation.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // 全局限流：100次/分钟
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: 60000, limit: 100 }],
    }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'fazhihui.sqlite',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      // 生产环境关闭 synchronize，避免结构同步风险
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    AuthModule,
    UserModule,
    LeadModule,
    CaseModule,
    ComplianceModule,
    FinanceModule,
    ClientModule,
    DashboardModule,
    MarketingModule,
    SeedsModule,
    AiModule,
    ScrmModule,
    SystemModule,
    ApprovalModule,
    WorklogModule,
    ContractModule,
    SealModule,
    ScheduleModule,
    TaskModule,
    KnowledgeModule,
    BidModule,
    DueDiligenceModule,
    DiagramModule,
    HrModule,
    SocialModule,
    MailModule,
    PropertyPreservationModule,
    AuditModule,
  ],
  providers: [
    // 注册全局限流守卫
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
