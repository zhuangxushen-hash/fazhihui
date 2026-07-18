import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketingService } from './marketing.service';
import { MarketingController } from './marketing.controller';
import { MarketingMaterial } from './marketing-material.entity';
import { ComplianceModule } from '../compliance/compliance.module';

@Module({
  imports: [TypeOrmModule.forFeature([MarketingMaterial]), ComplianceModule],
  providers: [MarketingService],
  controllers: [MarketingController],
})
export class MarketingModule {}
