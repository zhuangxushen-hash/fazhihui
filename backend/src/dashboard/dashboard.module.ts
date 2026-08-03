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
import { ConversionEvent } from '../marketing/conversion-event.entity';
import { InviteTask } from '../lead/invite-task.entity';
import { Opportunity } from '../lead/opportunity.entity';
import { CaseTask } from '../case/case-task.entity';
import { CaseWarning } from '../case/case-warning.entity';
import { CaseCost } from '../finance/case-cost.entity';
import { ComplianceCheckResult } from '../compliance/compliance-check-result.entity';
import { ComplaintTicket } from '../compliance/complaint-ticket.entity';
import { ReportTemplate } from './report-template.entity';
import { ReportExportLog } from './report-export-log.entity';
import { ServiceRating } from '../client/service-rating.entity';
// Phase5+6 L5: 补全 DashboardService 注入所需的财务相关实体
import { PaymentRecord } from '../finance/payment-record.entity';
import { Receivable } from '../finance/receivable.entity';
import { Invoice } from '../finance/invoice.entity';
import { CommissionRecord } from '../finance/commission-record.entity';
// Phase5+6 L5: 注入用户模块，获取 NotificationService 用于风险推送
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Lead,
      Case,
      Fee,
      ProfitShare,
      ComplianceRecord,
      User,
      ConversionEvent,
      InviteTask,
      Opportunity,
      CaseTask,
      CaseWarning,
      CaseCost,
      ComplianceCheckResult,
      ComplaintTicket,
      ReportTemplate,
      ReportExportLog,
      ServiceRating,
      // Phase5+6 L5: 补全 DashboardService 注入所需的财务相关实体
      PaymentRecord,
      Receivable,
      Invoice,
      CommissionRecord,
    ]),
    // Phase5+6 L5: 注入用户模块，获取 NotificationService 用于风险推送
    UserModule,
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
