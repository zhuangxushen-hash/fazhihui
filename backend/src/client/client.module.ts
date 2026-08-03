import { Module, forwardRef } from '@nestjs/common';
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
import { ClientArchive } from './client-archive.entity';
// 客户档案管理（B端）新增实体/服务/控制器
import { ClientProfile } from './client-profile.entity';
import { ClientProfileService } from './client-profile.service';
import { ClientProfileController } from './client-profile.controller';
// Phase4 M3: 客户投诉走合规通道，需注入 ComplianceService（forwardRef 防止潜在循环依赖）
import { ComplianceModule } from '../compliance/compliance.module';

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
      // 模块7.6 云归档
      ClientArchive,
      // 客户档案管理（B端）新增实体
      ClientProfile,
    ]),
    // Phase4 M3: 注入合规服务用于客户投诉走合规通道
    forwardRef(() => ComplianceModule),
  ],
  providers: [ClientService, ClientProfileService],
  controllers: [ClientController, ClientProfileController],
  // Phase4 M2: 导出 ClientService 供 CaseModule 结案触发评价使用
  exports: [ClientProfileService, ClientService],
})
export class ClientModule {}
