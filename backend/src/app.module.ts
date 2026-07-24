import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'fazhihui.sqlite',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
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
  ],
})
export class AppModule {}
