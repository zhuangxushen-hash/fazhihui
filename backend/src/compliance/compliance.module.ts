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
import { TalkQualityCheck } from './talk-quality-check.entity';
import { ReportTemplate } from '../dashboard/report-template.entity';
import { ReportExportLog } from '../dashboard/report-export-log.entity';
import { UserModule } from '../user/user.module';
// 引入投诉工单与案件SOP模板实体（Phase4: M3 投诉走合规通道、H7 SOP模板联动）
import { ComplaintTicket } from './complaint-ticket.entity';
import { CaseSOPTemplate } from '../case/case-sop-template.entity';
// 合并后：案件SOP操作统一使用 CaseTask 表
import { CaseTask } from '../case/case-task.entity';
import { Case } from '../case/case.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ComplianceRecord, Complaint, MarketingContent, SalesCompliance, SigningCompliance, CaseSOP, TalkQualityCheck, ReportTemplate, ReportExportLog, ComplaintTicket, CaseSOPTemplate, CaseTask, Case]), UserModule],
  providers: [ComplianceService],
  controllers: [ComplianceController],
  exports: [ComplianceService],
})
export class ComplianceModule {}
