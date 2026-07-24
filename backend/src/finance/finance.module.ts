import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { Fee } from './fee.entity';
import { ProfitShare } from './profit-share.entity';
import { Refund } from './refund.entity';
import { Invoice } from './invoice.entity';
import { PaymentRecord } from './payment-record.entity';

// 控制器
import { CommissionController } from './commission.controller';

// 服务
import { CommissionService } from './commission.service';
import { OverdueWarningService } from './overdue-warning.service';

// 实体
import { CommissionRule } from './commission-rule.entity';
import { CommissionRecord } from './commission-record.entity';
import { CaseCost } from './case-cost.entity';
import { Receivable } from './receivable.entity';
import { OverdueWarning } from './overdue-warning.entity';
import { Case } from '../case/case.entity';
import { User } from '../user/user.entity';

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
      // 关联实体
      Case,
      User,
    ]),
  ],
  providers: [
    // 保留原有服务
    FinanceService,
    // 佣金服务
    CommissionService,
    // 逾期预警服务
    OverdueWarningService,
  ],
  controllers: [
    // 保留原有控制器
    FinanceController,
    // 佣金控制器
    CommissionController,
  ],
})
export class FinanceModule {}
