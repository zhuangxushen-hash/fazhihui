import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PushRule } from './push-rule.entity';
import { PushRuleService } from './push-rule.service';
import { PushRuleController } from './push-rule.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PushRule])],
  providers: [PushRuleService],
  controllers: [PushRuleController],
  exports: [PushRuleService],
})
export class PushRuleModule {}
