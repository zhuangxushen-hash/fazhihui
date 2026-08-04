import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HrLeave } from './leave.entity';
import { Attendance } from './attendance.entity';
import { MaterialRequisition } from './material-requisition.entity';
import { HrActivity } from './activity.entity';
import { ActivityRegistration } from './activity-registration.entity';
import { HrService } from './hr.service';
import { HrController } from './hr.controller';
import { User } from '../user/user.entity';

@Module({
  // 注册5个实体（请假/考勤/物品申购/活动/活动报名），并追加 User 实体用于员工档案管理
  imports: [
    TypeOrmModule.forFeature([
      HrLeave,
      Attendance,
      MaterialRequisition,
      HrActivity,
      ActivityRegistration,
      User,
    ]),
  ],
  providers: [HrService],
  controllers: [HrController],
  exports: [HrService],
})
export class HrModule {}
