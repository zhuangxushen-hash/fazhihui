import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicOpinion } from './public-opinion.entity';
import { OpinionKeyword } from './opinion-keyword.entity';
import { PublicOpinionService } from './public-opinion.service';
import { PublicOpinionController } from './public-opinion.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PublicOpinion, OpinionKeyword])],
  providers: [PublicOpinionService],
  controllers: [PublicOpinionController],
  exports: [PublicOpinionService],
})
export class PublicOpinionModule {}
