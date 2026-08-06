import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CallRecord } from './call-record.entity';
import { CallRecordService } from './call-record.service';
import { CallRecordController } from './call-record.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CallRecord])],
  providers: [CallRecordService],
  controllers: [CallRecordController],
  exports: [CallRecordService],
})
export class CallRecordsModule {}
