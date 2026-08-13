import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FakeLiveRoom } from './fake-live-room.entity';
import { FakeLiveMessage } from './fake-live-message.entity';
import { FakeLiveViewer } from './fake-live-viewer.entity';
import { FakeLiveService } from './fake-live.service';
import { FakeLiveController } from './fake-live.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([FakeLiveRoom, FakeLiveMessage, FakeLiveViewer]),
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES_IN', '7d') },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [FakeLiveService],
  controllers: [FakeLiveController],
  exports: [FakeLiveService],
})
export class FakeLiveModule {}
