import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { UserModule } from '../user/user.module';
import { RolesGuard } from './roles.guard';
import { AuditModule } from '../audit/audit.module';
// C 端客户档案：C 端登录身份与管理端账号切分，以客户档案为准
import { ClientProfile } from '../client/client-profile.entity';
// 组织实体：微信授权自动建客户档案时需要归属组织
import { Organization } from '../user/organization.entity';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES_IN') },
      }),
      inject: [ConfigService],
    }),
    UserModule,
    AuditModule,
    TypeOrmModule.forFeature([ClientProfile, Organization]),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    // 全局注册角色守卫：所有受保护controller自动生效
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
