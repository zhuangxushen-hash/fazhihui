import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NumberRule } from './number-rule.entity';
import { NumberSequence } from './number-sequence.entity';
import { NumberDepartment } from './number-department.entity';
import { NumberRuleService } from './number-rule.service';
import { NumberRuleController } from './number-rule.controller';
import { Organization } from '../user/organization.entity';
import { Contract } from '../contract/contract.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NumberRule,
      NumberSequence,
      NumberDepartment,
      Organization,
      Contract,
    ]),
  ],
  providers: [NumberRuleService],
  controllers: [NumberRuleController],
  exports: [NumberRuleService],
})
export class NumberRuleModule {}
