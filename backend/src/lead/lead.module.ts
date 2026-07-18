import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadService } from './lead.service';
import { LeadController } from './lead.controller';
import { Lead } from './lead.entity';
import { FollowUp } from './follow-up.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Lead, FollowUp])],
  providers: [LeadService],
  controllers: [LeadController],
})
export class LeadModule {}
