import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiagramService } from './diagram.service';
import { DiagramController } from './diagram.controller';
import { Diagram } from './diagram.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Diagram])],
  providers: [DiagramService],
  controllers: [DiagramController],
  exports: [DiagramService],
})
export class DiagramModule {}
