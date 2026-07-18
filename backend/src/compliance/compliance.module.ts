import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplianceService } from './compliance.service';
import { ComplianceController } from './compliance.controller';
import { ComplianceRecord } from './compliance-record.entity';
import { Complaint } from './complaint.entity';
import { MarketingContent } from './marketing-content.entity';
import { SalesCompliance } from './sales-compliance.entity';
import { SigningCompliance } from './signing-compliance.entity';
import { CaseSOP } from './case-sop.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ComplianceRecord, Complaint, MarketingContent, SalesCompliance, SigningCompliance, CaseSOP])],
  providers: [ComplianceService],
  controllers: [ComplianceController],
  exports: [ComplianceService],
})
export class ComplianceModule {}
