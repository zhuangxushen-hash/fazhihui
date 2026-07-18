import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaseService } from './case.service';
import { CaseController } from './case.controller';
import { Case } from './case.entity';
import { Document } from './document.entity';
import { User } from '../user/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Case, Document, User])],
  providers: [CaseService],
  controllers: [CaseController],
})
export class CaseModule {}
