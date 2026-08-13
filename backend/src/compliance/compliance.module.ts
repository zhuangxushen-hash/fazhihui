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
import { User } from '../user/user.entity';
// 引入投诉工单与案件SOP模板实体（Phase4: M3 投诉走合规通道、H7 SOP模板联动）
import { ComplaintTicket } from './complaint-ticket.entity';
import { CaseSOPTemplate } from '../case/case-sop-template.entity';
// 合并后：案件SOP操作统一使用 CaseTask 表
import { CaseTask } from '../case/case-task.entity';
import { Case } from '../case/case.entity';
// 合规规则管理
import { ComplianceRule } from './compliance-rule.entity';
// 合规检查结果
import { ComplianceCheckResult } from './compliance-check-result.entity';
// 财务税务合规校验
import { FinanceComplianceCheck } from './finance-compliance-check.entity';
// 办案交付合规检查
import { CaseComplianceCheck } from './case-compliance-check.entity';
// 人员变更申请
import { CasePersonnelChange } from './case-personnel-change.entity';
// 结案归档
import { CaseArchive } from './case-archive.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    ComplianceRecord, Complaint, MarketingContent, SalesCompliance, SigningCompliance,
    CaseSOP, TalkQualityCheck, ReportTemplate, ReportExportLog, ComplaintTicket,
    CaseSOPTemplate, CaseTask, Case,
    ComplianceRule, ComplianceCheckResult, FinanceComplianceCheck,
    CaseComplianceCheck, CasePersonnelChange, CaseArchive,
    User,
  ]), UserModule],
  providers: [ComplianceService],
  controllers: [ComplianceController],
  exports: [ComplianceService],
})
export class ComplianceModule {}
