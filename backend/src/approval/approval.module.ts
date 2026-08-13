import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApprovalService } from './approval.service';
import { ApprovalController } from './approval.controller';
import { ApprovalFlow } from './approval-flow.entity';
import { ApprovalRequest } from './approval-request.entity';
import { ApprovalStep } from './approval-step.entity';
import { User } from '../user/user.entity';
// 审批单据表单模板模块
import { FormTemplate } from './form-template.entity';
import { FormTemplateService } from './form-template.service';
import { FormTemplateController } from './form-template.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ApprovalFlow, ApprovalRequest, ApprovalStep, User, FormTemplate])],
  providers: [ApprovalService, FormTemplateService],
  controllers: [ApprovalController, FormTemplateController],
})
export class ApprovalModule {}
