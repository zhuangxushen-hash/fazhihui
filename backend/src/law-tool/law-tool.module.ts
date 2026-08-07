import { Module } from '@nestjs/common';
import { LawToolController } from './law-tool.controller';
import { LawToolService } from './law-tool.service';

@Module({
  controllers: [LawToolController],
  providers: [LawToolService],
  exports: [LawToolService],
})
export class LawToolModule {}
