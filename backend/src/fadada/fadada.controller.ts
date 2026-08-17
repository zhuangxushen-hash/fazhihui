import { Body, Controller, Headers, Post } from '@nestjs/common';
import { FadadaService } from './fadada.service';

/**
 * 法大大开放平台回调入口
 * 法大大平台通过该接口推送实名认证结果与签署任务状态事件
 */
@Controller('fadada')
export class FadadaController {
  constructor(private fadadaService: FadadaService) {}

  @Post('callback')
  callback(
    @Body() body: any,
    @Headers('x-fasc-callback-token') token?: string,
  ) {
    if (!this.fadadaService.verifyCallbackToken(token)) {
      return { handled: false, reason: 'invalid callback token' };
    }
    return this.fadadaService.handleCallback(body);
  }
}
