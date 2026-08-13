import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CooperativeSource } from './cooperative-source.entity';
import { CooperativeFirm } from './cooperative-firm.entity';
import { DifficultCase } from './difficult-case.entity';
import { CooperativeSourceService } from './cooperative-source.service';
import { CooperativeFirmService } from './cooperative-firm.service';
import { DifficultCaseService } from './difficult-case.service';
import { CooperativeSourceController } from './cooperative-source.controller';
import { CooperativeFirmController } from './cooperative-firm.controller';
import { DifficultCaseController } from './difficult-case.controller';

// 快捷工具模块：协作案源 / 协作律所 / 疑难案件
@Module({
  imports: [TypeOrmModule.forFeature([CooperativeSource, CooperativeFirm, DifficultCase])],
  providers: [CooperativeSourceService, CooperativeFirmService, DifficultCaseService],
  controllers: [CooperativeSourceController, CooperativeFirmController, DifficultCaseController],
  exports: [CooperativeSourceService, CooperativeFirmService, DifficultCaseService],
})
export class ShortcutModule {}
