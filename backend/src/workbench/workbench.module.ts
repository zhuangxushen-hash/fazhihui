import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkbenchService } from './workbench.service';
import { WorkbenchController } from './workbench.controller';
import { Task } from '../task/task.entity';
import { Schedule } from '../schedule/schedule.entity';
import { ScheduleParticipant } from '../schedule/schedule-participant.entity';
import { Worklog } from '../worklog/worklog.entity';
import { ApprovalStep } from '../approval/approval-step.entity';
import { ApprovalRequest } from '../approval/approval-request.entity';
import { Case } from '../case/case.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Task,
      Schedule,
      ScheduleParticipant,
      Worklog,
      ApprovalStep,
      ApprovalRequest,
      Case,
    ]),
  ],
  providers: [WorkbenchService],
  controllers: [WorkbenchController],
  exports: [WorkbenchService],
})
export class WorkbenchModule {}
