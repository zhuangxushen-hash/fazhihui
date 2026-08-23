import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaseService } from './case.service';
import { CaseController } from './case.controller';
import { Case } from './case.entity';
import { Document } from './document.entity';
import { User } from '../user/user.entity';
import { Contract } from '../contract/contract.entity';
import { Receivable } from '../finance/receivable.entity';
import { ContractModule } from '../contract/contract.module';
import { FinanceModule } from '../finance/finance.module';
import { UserModule } from '../user/user.module';
// Phase4: H7 SOP联动需注入 ComplianceService；M2 结案触发评价需注入 ClientService
import { ComplianceModule } from '../compliance/compliance.module';
import { ClientModule } from '../client/client.module';
// Phase5 M8: 案件核心操作审计日志需注入 AuditModule
import { AuditModule } from '../audit/audit.module';
// C 端短信提醒模块
import { SmsModule } from '../sms/sms.module';
// 编号规则配置模块（案件/法律文书/归档编号按组织规则生成）
import { NumberRuleModule } from '../number-rule/number-rule.module';

// 控制器
import { CaseTaskController } from './case-task.controller';
import { CaseWarningController } from './case-warning.controller';
import { EvidenceController } from './evidence.controller';
import { CaseSopTemplateController } from './case-sop-template.controller';
import { LegalDocumentController } from './legal-document.controller';
import { SimilarCaseController } from './similar-case.controller';
// 利冲检索控制器
import { ConflictCheckController } from './conflict-check.controller';

// 服务
import { CaseTaskService } from './case-task.service';
import { CaseWarningService } from './case-warning.service';
import { EvidenceService } from './evidence.service';
import { CaseSopTemplateService } from './case-sop-template.service';
import { CaseTaskCommentService } from './case-task-comment.service';
import { LegalDocumentService } from './legal-document.service';
import { SimilarCaseService } from './similar-case.service';
// 利冲检索服务
import { ConflictCheckService } from './conflict-check.service';

// 实体
import { CaseTask } from './case-task.entity';
import { CaseTaskComment } from './case-task-comment.entity';
import { CaseWarning } from './case-warning.entity';
import { Evidence } from './evidence.entity';
import { CaseSOPTemplate } from './case-sop-template.entity';
import { LegalDocument } from './legal-document.entity';
// 利冲检索实体
import { ConflictCheck } from './conflict-check.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // 保留原有实体
      Case,
      Document,
      User,
      // 案件任务与评论
      CaseTask,
      CaseTaskComment,
      // 案件预警
      CaseWarning,
      // 证据管理
      Evidence,
      // 案件SOP模板
      CaseSOPTemplate,
      // 法律文书模板
      LegalDocument,
      // 利冲检索记录
      ConflictCheck,
      // 合同与应收
      Contract,
      Receivable,
    ]),
    forwardRef(() => ContractModule),
    forwardRef(() => FinanceModule),
    UserModule,
    // Phase4 H7: 注入合规服务用于案件创建后生成SOP
    ComplianceModule,
    // Phase4 M2: 注入客户服务用于结案触发评价（forwardRef 防止潜在循环依赖）
    forwardRef(() => ClientModule),
    // Phase5 M8: 注入审计模块用于案件核心操作记录审计日志
    AuditModule,
    // C 端短信提醒模块（供案件节点触发短信）
    SmsModule,
    // 编号规则配置模块（供案件/文书/归档编号生成）
    NumberRuleModule,
  ],
  providers: [
    // 保留原有服务
    CaseService,
    // 案件任务服务
    CaseTaskService,
    CaseTaskCommentService,
    // 案件预警服务
    CaseWarningService,
    // 证据管理服务
    EvidenceService,
    // 案件SOP模板服务
    CaseSopTemplateService,
    // 法律文书服务
    LegalDocumentService,
    // 类案匹配服务
    SimilarCaseService,
    // 利冲检索服务
    ConflictCheckService,
  ],
  controllers: [
    // 保留原有控制器
    CaseController,
    // 案件任务控制器
    CaseTaskController,
    // 案件预警控制器
    CaseWarningController,
    // 证据管理控制器
    EvidenceController,
    // 案件SOP模板控制器
    CaseSopTemplateController,
    // 法律文书控制器
    LegalDocumentController,
    // 类案匹配控制器
    SimilarCaseController,
    // 利冲检索控制器
    ConflictCheckController,
  ],
  // Phase4: 导出 ConflictCheckService，供 LeadModule 等模块使用（利冲检查）
  exports: [ConflictCheckService],
})
export class CaseModule {}