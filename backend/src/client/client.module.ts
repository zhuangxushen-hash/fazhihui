import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientService } from './client.service';
import { ClientController } from './client.controller';
import { Case } from '../case/case.entity';
import { Document } from '../case/document.entity';
import { Complaint } from '../compliance/complaint.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Case, Document, Complaint])],
  providers: [ClientService],
  controllers: [ClientController],
})
export class ClientModule {}
