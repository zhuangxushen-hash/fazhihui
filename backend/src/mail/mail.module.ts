import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mail } from './mail.entity';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Mail])],
  providers: [MailService],
  controllers: [MailController],
  exports: [MailService],
})
export class MailModule {}
