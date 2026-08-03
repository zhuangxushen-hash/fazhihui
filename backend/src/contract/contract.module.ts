import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractService } from './contract.service';
import { ContractController } from './contract.controller';
import { Contract } from './contract.entity';
import { ContractStage } from './contract-stage.entity';
import { SealModule } from '../seal/seal.module';
// Phase5 M8: 合同核心操作审计日志需注入 AuditModule
import { AuditModule } from '../audit/audit.module';
// Phase5 L2: 合同审批通过后自动生成委托合同需注册 LegalDocumentService
import { LegalDocumentService } from '../case/legal-document.service';
import { LegalDocument } from '../case/legal-document.entity';
import { Case } from '../case/case.entity';
// Phase5 M8: 审计日志需查询操作人用户名，注入 User 实体
import { User } from '../user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Contract, ContractStage, LegalDocument, Case, User]),
    forwardRef(() => SealModule),
    // Phase5 M8: 注入审计模块用于合同核心操作记录审计日志
    AuditModule,
  ],
  providers: [ContractService, LegalDocumentService],
  controllers: [ContractController],
  exports: [ContractService],
})
export class ContractModule {}
