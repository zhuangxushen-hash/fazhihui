import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bid } from './bid.entity';
import { BidRecord } from './bid-record.entity';
import { BidService } from './bid.service';
import { BidController } from './bid.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Bid, BidRecord])],
  providers: [BidService],
  controllers: [BidController],
  exports: [BidService],
})
export class BidModule {}
