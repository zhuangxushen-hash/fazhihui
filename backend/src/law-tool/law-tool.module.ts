import { Module } from '@nestjs/common';
import { LawToolController } from './law-tool.controller';

@Module({
  controllers: [LawToolController],
})
export class LawToolModule {}
