import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocialPost } from './social-post.entity';
import { SocialComment } from './social-comment.entity';
import { SocialLike } from './social-like.entity';
import { User } from '../user/user.entity';
import { SocialService } from './social.service';
import { SocialController } from './social.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SocialPost, SocialComment, SocialLike, User])],
  providers: [SocialService],
  controllers: [SocialController],
  exports: [SocialService],
})
export class SocialModule {}
