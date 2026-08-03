import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Worklog } from './worklog.entity';
import { WorklogService } from './worklog.service';
import { WorklogController } from './worklog.controller';
import { Schedule } from '../schedule/schedule.entity';
import { UserModule } from '../user/user.module';
import { TaskModule } from '../task/task.module';
// Phase4 M10: 工作日志审批通过后回写案件成本，直接注入 CaseCost 实体仓库
import { CaseCost } from '../finance/case-cost.entity';

@Module({
  // 导入 Schedule 实体以支持 WorklogService 的"日程转日志"功能
  // 导入 UserModule 以支持审批通过时增加经验值
  // 导入 TaskModule 以支持工作日志关联任务及审批通过后自动更新任务进度
  // 导入 CaseCost 实体以支持工作日志审批通过后回写案件人力成本
  imports: [TypeOrmModule.forFeature([Worklog, Schedule, CaseCost]), UserModule, TaskModule],
  providers: [WorklogService],
  controllers: [WorklogController],
  exports: [WorklogService],
})
export class WorklogModule {}
