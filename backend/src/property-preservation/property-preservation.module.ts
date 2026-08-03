import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertyPreservation } from './property-preservation.entity';
import { PropertyPreservationService } from './property-preservation.service';
import { PropertyPreservationController } from './property-preservation.controller';
import { Case } from '../case/case.entity';
import { CaseWarning } from '../case/case-warning.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PropertyPreservation, Case, CaseWarning])],
  controllers: [PropertyPreservationController],
  providers: [PropertyPreservationService],
  exports: [PropertyPreservationService, TypeOrmModule],
})
export class PropertyPreservationModule {}
