import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { LawyerRating } from './lawyer-rating.entity';
import { LawyerCenterService } from './lawyer-center.service';
import { LawyerCenterController } from './lawyer-center.controller';

// 律师中心模块：律师列表 / 律师主页 / 评级管理
@Module({
  imports: [TypeOrmModule.forFeature([User, LawyerRating])],
  providers: [LawyerCenterService],
  controllers: [LawyerCenterController],
  exports: [LawyerCenterService],
})
export class LawyerCenterModule {}
