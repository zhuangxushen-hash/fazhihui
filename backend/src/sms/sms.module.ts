import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChuanlanSmsClient } from './sms.client';
import { SmsService } from './sms.service';
import { Case } from '../case/case.entity';
import { User } from '../user/user.entity';
import { CasePushNotification } from '../client/case-push-notification.entity';

/**
 * 短信模块：封装创蓝短信发送能力
 * 提供 SmsService（案件 C 端短信提醒，含 20 类节点模板，未配置凭据/模板时跳过并记录日志）。
 * 导出 SmsService 供案件等模块在业务节点触发短信。
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Case, User, CasePushNotification]),
  ],
  providers: [ChuanlanSmsClient, SmsService],
  exports: [SmsService, ChuanlanSmsClient],
})
export class SmsModule {}