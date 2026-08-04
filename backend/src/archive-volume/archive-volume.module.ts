import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArchiveVolume } from './archive-volume.entity';
import { ArchiveVolumeService } from './archive-volume.service';
import { ArchiveVolumeController } from './archive-volume.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ArchiveVolume])],
  providers: [ArchiveVolumeService],
  controllers: [ArchiveVolumeController],
  exports: [ArchiveVolumeService],
})
export class ArchiveVolumeModule {}
