import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApprovalService } from './approval.service';
import { ApprovalController } from './approval.controller';
import { ApprovalFlow } from './approval-flow.entity';
import { ApprovalRequest } from './approval-request.entity';
import { ApprovalStep } from './approval-step.entity';
import { User } from '../user/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ApprovalFlow, ApprovalRequest, ApprovalStep, User])],
  providers: [ApprovalService],
  controllers: [ApprovalController],
})
export class ApprovalModule {}
