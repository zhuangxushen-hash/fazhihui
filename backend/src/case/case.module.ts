import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaseService } from './case.service';
import { CaseController } from './case.controller';
import { Case } from './case.entity';
import { Document } from './document.entity';
import { User } from '../user/user.entity';

// 控制器
import { CaseTaskController } from './case-task.controller';
import { CaseWarningController } from './case-warning.controller';
import { EvidenceController } from './evidence.controller';
import { CaseSopTemplateController } from './case-sop-template.controller';

// 服务
import { CaseTaskService } from './case-task.service';
import { CaseWarningService } from './case-warning.service';
import { EvidenceService } from './evidence.service';
import { CaseSopTemplateService } from './case-sop-template.service';
import { CaseTaskCommentService } from './case-task-comment.service';

// 实体
import { CaseTask } from './case-task.entity';
import { CaseTaskComment } from './case-task-comment.entity';
import { CaseWarning } from './case-warning.entity';
import { Evidence } from './evidence.entity';
import { CaseSOPTemplate } from './case-sop-template.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // 保留原有实体
      Case,
      Document,
      User,
      // 案件任务与评论
      CaseTask,
      CaseTaskComment,
      // 案件预警
      CaseWarning,
      // 证据管理
      Evidence,
      // 案件SOP模板
      CaseSOPTemplate,
    ]),
  ],
  providers: [
    // 保留原有服务
    CaseService,
    // 案件任务服务
    CaseTaskService,
    CaseTaskCommentService,
    // 案件预警服务
    CaseWarningService,
    // 证据管理服务
    EvidenceService,
    // 案件SOP模板服务
    CaseSopTemplateService,
  ],
  controllers: [
    // 保留原有控制器
    CaseController,
    // 案件任务控制器
    CaseTaskController,
    // 案件预警控制器
    CaseWarningController,
    // 证据管理控制器
    EvidenceController,
    // 案件SOP模板控制器
    CaseSopTemplateController,
  ],
})
export class CaseModule {}
