import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { Fee } from './fee.entity';
import { ProfitShare } from './profit-share.entity';
import { Refund } from './refund.entity';
import { Invoice } from './invoice.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Fee, ProfitShare, Refund, Invoice])],
  providers: [FinanceService],
  controllers: [FinanceController],
})
export class FinanceModule {}
