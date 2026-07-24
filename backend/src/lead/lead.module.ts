import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadService } from './lead.service';
import { LeadController } from './lead.controller';
import { Lead } from './lead.entity';
import { FollowUp } from './follow-up.entity';

// 控制器
import { LeadPoolController } from './lead-pool.controller';
import { LeadAssignmentController } from './lead-assignment.controller';
import { InviteTaskController } from './invite-task.controller';
import { OpportunityController } from './opportunity.controller';
import { TalkSOPController } from './talk-sop.controller';
import { HandoverController } from './handover.controller';

// 服务
import { LeadPoolService } from './lead-pool.service';
import { LeadAssignmentService } from './lead-assignment.service';
import { InviteTaskService } from './invite-task.service';
import { OpportunityService } from './opportunity.service';
import { TalkSOPService } from './talk-sop.service';
import { HandoverService } from './handover.service';

// 实体
import { InviteTask } from './invite-task.entity';
import { Opportunity, OpportunityQuoteItem, OpportunityStageLog } from './opportunity.entity';
import { TalkSOP, OpportunitySOPProgress } from './talk-sop.entity';
import { LeadPool } from './lead-pool.entity';
import { LeadAssignment } from './lead-assignment.entity';
import { LeadAssignmentLog } from './lead-assignment-log.entity';
import { HandoverLog } from './handover-log.entity';
import { User } from '../user/user.entity';
import { Case } from '../case/case.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // 保留原有实体
      Lead,
      FollowUp,
      // 线索池与分配相关
      LeadPool,
      LeadAssignment,
      LeadAssignmentLog,
      // 邀约任务
      InviteTask,
      // 商机与谈案SOP
      Opportunity,
      OpportunityQuoteItem,
      OpportunityStageLog,
      TalkSOP,
      OpportunitySOPProgress,
      // 交接日志
      HandoverLog,
      // 关联实体
      User,
      Case,
    ]),
  ],
  providers: [
    // 保留原有服务
    LeadService,
    // 线索池与分配服务
    LeadPoolService,
    LeadAssignmentService,
    // 邀约任务服务
    InviteTaskService,
    // 商机与谈案SOP服务
    OpportunityService,
    TalkSOPService,
    // 交接服务
    HandoverService,
  ],
  controllers: [
    // 保留原有控制器
    LeadController,
    // 线索池与分配控制器
    LeadPoolController,
    LeadAssignmentController,
    // 邀约任务控制器
    InviteTaskController,
    // 商机与谈案SOP控制器
    OpportunityController,
    TalkSOPController,
    // 交接控制器
    HandoverController,
  ],
})
export class LeadModule {}
