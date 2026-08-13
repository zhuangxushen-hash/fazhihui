import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentItem } from './document.entity';
import { DocumentVersion } from './document-version.entity';
import { DocumentItemService } from './document.service';
import { DocumentItemController } from './document.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentItem, DocumentVersion])],
  providers: [DocumentItemService],
  controllers: [DocumentItemController],
  exports: [DocumentItemService],
})
export class DocumentModule {}
