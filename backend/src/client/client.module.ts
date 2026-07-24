import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientService } from './client.service';
import { ClientController } from './client.controller';
import { Case } from '../case/case.entity';
import { Document } from '../case/document.entity';
import { Evidence } from '../case/evidence.entity';
import { Complaint } from '../compliance/complaint.entity';
import { ComplaintTicket } from '../compliance/complaint-ticket.entity';
import { ContractTemplate } from '../compliance/contract-template.entity';
import { SigningCompliance } from '../compliance/signing-compliance.entity';
import { PaymentRecord } from '../finance/payment-record.entity';
import { Lead } from '../lead/lead.entity';
import { AdMaterial } from '../marketing/ad-material.entity';
import { User } from '../user/user.entity';
import { CasePushNotification } from './case-push-notification.entity';
import { ClientConsultation } from './client-consultation.entity';
import { ServiceRating } from './service-rating.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Case,
      Document,
      Evidence,
      Complaint,
      ComplaintTicket,
      ContractTemplate,
      SigningCompliance,
      PaymentRecord,
      Lead,
      AdMaterial,
      User,
      // 模块7 C端客户服务新增实体
      CasePushNotification,
      ClientConsultation,
      ServiceRating,
    ]),
  ],
  providers: [ClientService],
  controllers: [ClientController],
})
export class ClientModule {}
