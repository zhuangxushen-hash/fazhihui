import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Lead } from '../lead/lead.entity';
import { Case } from '../case/case.entity';
import { Fee } from '../finance/fee.entity';
import { ProfitShare } from '../finance/profit-share.entity';
import { ComplianceRecord } from '../compliance/compliance-record.entity';
import { User } from '../user/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Lead, Case, Fee, ProfitShare, ComplianceRecord, User])],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
