import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReconciliationRule } from './reconciliation-rule.entity';
import { ReconciliationRuleService } from './reconciliation-rule.service';
import { ReconciliationRuleController } from './reconciliation-rule.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ReconciliationRule])],
  providers: [ReconciliationRuleService],
  controllers: [ReconciliationRuleController],
  exports: [ReconciliationRuleService],
})
export class ReconciliationRulesModule {}
