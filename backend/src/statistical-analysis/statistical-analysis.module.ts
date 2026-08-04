import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Case } from '../case/case.entity';
import { PaymentRecord } from '../finance/payment-record.entity';
import { Receivable } from '../finance/receivable.entity';
import { StatisticalAnalysisService } from './statistical-analysis.service';
import { StatisticalAnalysisController } from './statistical-analysis.controller';

@Module({
  // 在本模块内重新注册已有实体，独立注入 Repository
  imports: [TypeOrmModule.forFeature([Case, PaymentRecord, Receivable])],
  providers: [StatisticalAnalysisService],
  controllers: [StatisticalAnalysisController],
  exports: [StatisticalAnalysisService],
})
export class StatisticalAnalysisModule {}
