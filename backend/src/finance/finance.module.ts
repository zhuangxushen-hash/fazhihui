import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { Fee } from './fee.entity';
import { ProfitShare } from './profit-share.entity';
import { Refund } from './refund.entity';
import { Invoice } from './invoice.entity';
import { PaymentRecord } from './payment-record.entity';
import { PaymentReminder } from './payment-reminder.entity';
import { BusinessFund } from './business-fund.entity';
import { PaymentReminderService } from './payment-reminder.service';
import { InvoiceService } from './invoice.service';
import { BusinessFundService } from './business-fund.service';

// 控制器
import { CommissionController } from './commission.controller';
import { ReconciliationController } from './reconciliation.controller';
import { CaseCostController } from './case-cost.controller';

// 服务
import { CommissionService } from './commission.service';
import { OverdueWarningService } from './overdue-warning.service';
import { ReconciliationService } from './reconciliation.service';
import { CaseCostService } from './case-cost.service';

// 实体
import { CommissionRule } from './commission-rule.entity';
import { CommissionRecord } from './commission-record.entity';
import { CaseCost } from './case-cost.entity';
import { Receivable } from './receivable.entity';
import { OverdueWarning } from './overdue-warning.entity';
import { Reconciliation } from './reconciliation.entity';
import { Case } from '../case/case.entity';
import { User } from '../user/user.entity';
import { UserModule } from '../user/user.module';
// Phase5+6 M8: 注入审计服务，财务核心操作记录审计日志
import { AuditModule } from '../audit/audit.module';
// 财务核算模块（代扣/个税）
import { WithholdingRecord } from './withholding-record.entity';
import { WithholdingBatch } from './withholding-batch.entity';
import { TaxCalculation } from './tax-calculation.entity';
import { FinancialAccountingService } from './financial-accounting.service';
import { FinancialAccountingController } from './financial-accounting.controller';
// 财务报表模块（账户台账/项目收入/发票打印）
import { FinanceStatementService } from './finance-statement.service';
import { FinanceStatementController } from './finance-statement.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // 保留原有实体
      Fee,
      ProfitShare,
      Refund,
      Invoice,
      PaymentRecord,
      // 佣金相关
      CommissionRule,
      CommissionRecord,
      // 案件成本
      CaseCost,
      // 应收款
      Receivable,
      // 逾期预警
      OverdueWarning,
      // 对账
      Reconciliation,
      // 关联实体
      Case,
      User,
      // 催款管理
      PaymentReminder,
      // 业务款管理
      BusinessFund,
      // 财务核算（代扣/个税）
      WithholdingRecord,
      WithholdingBatch,
      TaxCalculation,
    ]),
    UserModule,
    // Phase5+6 M8: 注入审计模块，财务核心操作记录审计日志
    AuditModule,
  ],
  providers: [
    // 保留原有服务
    FinanceService,
    // 佣金服务
    CommissionService,
    // 逾期预警服务
    OverdueWarningService,
    // 对账服务
    ReconciliationService,
    // 催款管理服务
    PaymentReminderService,
    // 发票管理增强服务
    InvoiceService,
    // 业务款管理服务
    BusinessFundService,
    // 案件成本服务
    CaseCostService,
    // 财务核算服务（代扣/个税）
    FinancialAccountingService,
    // 财务报表服务
    FinanceStatementService,
  ],
  controllers: [
    // 保留原有控制器
    FinanceController,
    // 佣金控制器
    CommissionController,
    // 对账控制器
    ReconciliationController,
    // 案件成本控制器
    CaseCostController,
    // 财务核算控制器（代扣/个税）
    FinancialAccountingController,
    // 财务报表控制器
    FinanceStatementController,
  ],
  // Phase5: 导出 CommissionService，供 CaseModule 案件结案时计算佣金使用
  exports: [CommissionService],
})
export class FinanceModule {}
