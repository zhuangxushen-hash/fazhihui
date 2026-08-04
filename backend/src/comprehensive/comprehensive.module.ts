import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Case } from '../case/case.entity';
import { Lead } from '../lead/lead.entity';
import { Contract } from '../contract/contract.entity';
import { Invoice } from '../finance/invoice.entity';
import { ApprovalRequest } from '../approval/approval-request.entity';
import { ClientProfile } from '../client/client-profile.entity';
import { DocumentItem } from '../document/document.entity';
import { ComprehensiveService } from './comprehensive.service';
import { ComprehensiveController } from './comprehensive.controller';

@Module({
  // 在本模块内重新注册已有实体，独立注入 Repository
  imports: [
    TypeOrmModule.forFeature([
      Case,
      Lead,
      Contract,
      Invoice,
      ApprovalRequest,
      ClientProfile,
      DocumentItem,
    ]),
  ],
  providers: [ComprehensiveService],
  controllers: [ComprehensiveController],
  exports: [ComprehensiveService],
})
export class ComprehensiveModule {}
