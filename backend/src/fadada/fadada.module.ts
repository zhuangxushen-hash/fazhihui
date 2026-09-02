import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SigningCompliance } from '../compliance/signing-compliance.entity';
import { CorpAuth } from './corp-auth.entity';
import { SignTemplate } from './sign-template.entity';
import { SignTemplateField } from './sign-template-field.entity';
import { FadadaService } from './fadada.service';
import { FadadaController } from './fadada.controller';
import { CorpAuthService } from './corp-auth.service';
import { CorpAuthController } from './corp-auth.controller';
import { SignTemplateService } from './sign-template.service';
import { SignTemplateFieldService } from './sign-template-field.service';
import { SignTemplateController } from './sign-template.controller';
// C 端短信提醒：法大大电子签完成后触发收案立项短信
import { SmsModule } from '../sms/sms.module';
// 新流程（线索→发合同→签约完成生成案件）：签约发起与案件生成直接操作以下实体
import { Contract } from '../contract/contract.entity';
import { ContractStage } from '../contract/contract-stage.entity';
import { Case } from '../case/case.entity';
import { Lead } from '../lead/lead.entity';
import { ClientProfile } from '../client/client-profile.entity';
import { CaseStatusConfig } from '../case/case-status-config.entity';
// 案件/合同编号按组织规则生成
import { NumberRuleModule } from '../number-rule/number-rule.module';
// 发合同建案路径补齐：利冲检索（CaseModule 导出 ConflictCheckService）+ 分润自动触发（FinanceModule 导出 CommissionService）
import { forwardRef } from '@nestjs/common';
import { CaseModule } from '../case/case.module';
import { FinanceModule } from '../finance/finance.module';
// 应收台账实体（签约即建应收，财务侧立即可见待收）
import { Receivable } from '../finance/receivable.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SigningCompliance,
      CorpAuth,
      SignTemplate,
      SignTemplateField,
      Contract,
      ContractStage,
      Case,
      Lead,
      ClientProfile,
      CaseStatusConfig,
      Receivable,
    ]),
    // C 端短信提醒：法大大电子签完成后触发收案立项短信
    SmsModule,
    // 编号规则模块（发合同生成合同号 / 签约完成生成案件编号）
    NumberRuleModule,
    // 利冲检索（forwardRef 防止潜在循环依赖）
    forwardRef(() => CaseModule),
    // 分润自动触发（forwardRef 防止潜在循环依赖）
    forwardRef(() => FinanceModule),
  ],
  providers: [FadadaService, CorpAuthService, SignTemplateService, SignTemplateFieldService],
  controllers: [FadadaController, CorpAuthController, SignTemplateController],
  exports: [FadadaService, CorpAuthService, SignTemplateService, SignTemplateFieldService],
})
export class FadadaModule {}
