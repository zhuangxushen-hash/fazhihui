import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SealService } from './seal.service';
import { SealController } from './seal.controller';
import { Seal } from './seal.entity';
import { SealApplication } from './seal-application.entity';
import { SealRecord } from './seal-record.entity';
import { ContractModule } from '../contract/contract.module';
import { AuditService } from '../audit/audit.service';
import { AuditLog } from '../audit/audit-log.entity';
import { User } from '../user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Seal, SealApplication, SealRecord, AuditLog, User]),
    forwardRef(() => ContractModule),
  ],
  providers: [SealService, AuditService],
  controllers: [SealController],
  exports: [SealService],
})
export class SealModule {}
