import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SigningCompliance } from '../compliance/signing-compliance.entity';
import { FadadaService } from './fadada.service';
import { FadadaController } from './fadada.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SigningCompliance])],
  providers: [FadadaService],
  controllers: [FadadaController],
  exports: [FadadaService],
})
export class FadadaModule {}
