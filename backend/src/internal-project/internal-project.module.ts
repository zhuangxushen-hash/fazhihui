import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InternalProject } from './internal-project.entity';
import { InternalProjectService } from './internal-project.service';
import { InternalProjectController } from './internal-project.controller';

@Module({
  imports: [TypeOrmModule.forFeature([InternalProject])],
  providers: [InternalProjectService],
  controllers: [InternalProjectController],
  exports: [InternalProjectService],
})
export class InternalProjectModule {}
