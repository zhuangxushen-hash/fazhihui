import { Body, Controller, HttpCode, HttpException, HttpStatus, Post, Headers, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { FadadaService } from './fadada.service';

/**
 * 法大大开放平台回调入口
 * 法大大平台通过该接口推送实名认证结果与签署任务状态事件
 *
 * 回调协议要点（来自法大大豸帮帮官方对接文档）：
 * - 请求格式：application/x-www-form-urlencoded（body 中 bizContent 为事件 JSON 字符串）
 * - 验签方式：HMAC-SHA256，按 ASCII 排序后用 appSecret 签名
 * - 事件名在请求头 X-FASC-Event 中（如 sign-task-finished）
 * - 必须返回 HTTP 200 且 body 包含 success，否则法大大会重试（3分钟/30分钟/8小时）
 */
@Controller('fadada')
export class FadadaController {
  constructor(private fadadaService: FadadaService) {}

  @Post('callback')
  @HttpCode(200)
  callback(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      // 从 body 中取出 bizContent 字段（兼容 x-www-form-urlencoded 和 JSON 两种格式）
      const rawBody: any = (req as any).body || {};
      // body 可能是 urlencoded 解析后的 { bizContent: '...' }
      // 也可能是 JSON 解析后的 { eventId, ... }（我们自己调试用）
      const bizContentStr = typeof rawBody === 'string'
        ? rawBody
        : (rawBody.bizContent || (rawBody.eventId ? JSON.stringify(rawBody) : ''));

      // 读取法大大请求头
      const headers = {
        appId: req.headers['x-fasc-app-id'] as string | undefined,
        signType: req.headers['x-fasc-sign-type'] as string | undefined,
        sign: req.headers['x-fasc-sign'] as string | undefined,
        timestamp: req.headers['x-fasc-timestamp'] as string | undefined,
        nonce: req.headers['x-fasc-nonce'] as string | undefined,
        event: req.headers['x-fasc-event'] as string | undefined,
        callbackToken: req.headers['x-fasc-callback-token'] as string | undefined,
      };

      // 异步处理业务：先立即响应 success，再在后台执行回调逻辑
      // 这样即使内部处理耗时，法大大也认为回调成功，不会重试
      res.status(HttpStatus.OK).json({ msg: 'success' });

      // 后台异步执行（不等待结果，避免法大大因超时重试）
      setImmediate(() => {
        this.handleCallbackAsync(headers, bizContentStr);
      });
    } catch (e) {
      // 任何异常也要返回 success，防止法大大重试风暴
      console.error('[法大大回调] 处理异常:', (e as Error)?.message || e);
      res.status(HttpStatus.OK).json({ msg: 'success' });
    }
  }

  /**
   * 后台异步处理法大大回调（验签 + 业务逻辑）
   */
  private async handleCallbackAsync(headers: any, bizContentStr: string) {
    try {
      // 1. 验签：法大大正式回调要求 HMAC-SHA256 验签
      const skipVerify = this.fadadaService.verifyCallbackSign(headers, bizContentStr);
      if (skipVerify === false) {
        console.warn('[法大大回调] 验签失败，跳过处理');
        return;
      }

      // 2. 解析 bizContent JSON
      let bodyJson: any = {};
      if (bizContentStr) {
        try {
          bodyJson = JSON.parse(bizContentStr);
        } catch {
          // bizContent 不是合法 JSON，可能是我们自己调试传的原始 body
          bodyJson = bizContentStr as any;
        }
      }

      // 3. 法大大事件名在 header X-FASC-Event 中，统一合并到 body.eventId 供后续处理
      if (headers.event && !bodyJson.eventId) {
        bodyJson.eventId = headers.event;
      }

      // 4. 执行回调业务逻辑（更新签署状态 + 触发短信）
      await this.fadadaService.handleCallback(bodyJson);
    } catch (e) {
      console.error('[法大大回调] 异步处理异常:', (e as Error)?.message || e);
    }
  }
}
