import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
// AI 合同审查与法律研究模块
import { AiReviewController } from './ai-review.controller';
import { AiReviewService } from './ai-review.service';
import { ContractReview } from './contract-review.entity';
import { LegalResearch } from './legal-research.entity';

@Module({
  imports: [
    // 注册合同审查与法律研究实体
    TypeOrmModule.forFeature([ContractReview, LegalResearch]),
  ],
  controllers: [AiController, AiReviewController],
  providers: [AiService, AiReviewService],
})
export class AiModule {}
