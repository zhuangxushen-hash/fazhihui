import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DueDiligence } from './due-diligence.entity';
import { DueDiligenceService } from './due-diligence.service';
import { DueDiligenceController } from './due-diligence.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DueDiligence])],
  providers: [DueDiligenceService],
  controllers: [DueDiligenceController],
  exports: [DueDiligenceService],
})
export class DueDiligenceModule {}
