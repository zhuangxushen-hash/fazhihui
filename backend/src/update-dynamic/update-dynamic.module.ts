import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UpdateDynamicService } from './update-dynamic.service';
import { UpdateDynamicController } from './update-dynamic.controller';
import { Case } from '../case/case.entity';
import { Contract } from '../contract/contract.entity';
import { PaymentRecord } from '../finance/payment-record.entity';
import { SealApplication } from '../seal/seal-application.entity';
import { ApprovalRequest } from '../approval/approval-request.entity';
import { Worklog } from '../worklog/worklog.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Case,
      Contract,
      PaymentRecord,
      SealApplication,
      ApprovalRequest,
      Worklog,
    ]),
  ],
  providers: [UpdateDynamicService],
  controllers: [UpdateDynamicController],
  exports: [UpdateDynamicService],
})
export class UpdateDynamicModule {}
