import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadService } from './lead.service';
import { LeadController } from './lead.controller';
import { Lead } from './lead.entity';
import { FollowUp } from './follow-up.entity';
import { CaseModule } from '../case/case.module';

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
import { UserModule } from '../user/user.module';
// Phase4 M9/M11: 邀约录音质检与谈案SOP节点完成质检均需注入 ComplianceService（forwardRef 防止潜在循环依赖）
import { ComplianceModule } from '../compliance/compliance.module';
// Phase5+6 L3: 注入审计模块，交接操作记录审计日志
import { AuditModule } from '../audit/audit.module';

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
    UserModule,
    // 导入 CaseModule 以使用 ConflictCheckService（利冲检查），用 forwardRef 防止循环依赖
    forwardRef(() => CaseModule),
    // Phase4 M9/M11: 注入合规服务用于邀约录音质检与谈案SOP节点质检
    forwardRef(() => ComplianceModule),
    // Phase5+6 L3: 注入审计模块，交接操作记录审计日志
    AuditModule,
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
  // Phase4 M12: 导出 LeadService 供 MarketingModule 转化事件回流线索状态使用
  exports: [LeadService],
})
export class LeadModule {}
