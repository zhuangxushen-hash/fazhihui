import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SigningCompliance } from '../compliance/signing-compliance.entity';
import { CorpAuth } from './corp-auth.entity';
import { SignTemplate } from './sign-template.entity';
import { SignTemplateField } from './sign-template-field.entity';
import { FadadaService } from './fadada.service';
import { FadadaController } from './fadada.controller';
import { CorpAuthService } from './corp-auth.service';
import { CorpAuthController } from './corp-auth.controller';
import { SignTemplateService } from './sign-template.service';
import { SignTemplateFieldService } from './sign-template-field.service';
import { SignTemplateController } from './sign-template.controller';
// C 端短信提醒：法大大电子签完成后触发收案立项短信
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SigningCompliance, CorpAuth, SignTemplate, SignTemplateField]),
    // C 端短信提醒：法大大电子签完成后触发收案立项短信
    SmsModule,
  ],
  providers: [FadadaService, CorpAuthService, SignTemplateService, SignTemplateFieldService],
  controllers: [FadadaController, CorpAuthController, SignTemplateController],
  exports: [FadadaService, CorpAuthService, SignTemplateService, SignTemplateFieldService],
})
export class FadadaModule {}
