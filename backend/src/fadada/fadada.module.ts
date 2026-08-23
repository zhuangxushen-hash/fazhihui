import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SigningCompliance } from '../compliance/signing-compliance.entity';
import { FadadaService } from './fadada.service';
import { FadadaController } from './fadada.controller';
// C 端短信提醒：法大大电子签完成后触发收案立项短信
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SigningCompliance]),
    // C 端短信提醒：法大大电子签完成后触发收案立项短信
    SmsModule,
  ],
  providers: [FadadaService],
  controllers: [FadadaController],
  exports: [FadadaService],
})
export class FadadaModule {}
