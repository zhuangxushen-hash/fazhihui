import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SealService } from './seal.service';
import { SealController } from './seal.controller';
import { Seal } from './seal.entity';
import { SealApplication } from './seal-application.entity';
import { SealRecord } from './seal-record.entity';
import { Contract } from '../contract/contract.entity';
import { ContractModule } from '../contract/contract.module';
import { AuditService } from '../audit/audit.service';
import { AuditLog } from '../audit/audit-log.entity';
import { User } from '../user/user.entity';

@Module({
  imports: [
    // Contract 实体需在 forFeature 注册，SealService 才能注入 ContractRepository 回写合同状态
    TypeOrmModule.forFeature([Seal, SealApplication, SealRecord, Contract, AuditLog, User]),
    forwardRef(() => ContractModule),
  ],
  providers: [SealService, AuditService],
  controllers: [SealController],
  exports: [SealService],
})
export class SealModule {}
