import { Injectable, Logger } from '@nestjs/common';

/**
 * 创蓝云通讯（253云通讯）短信发送客户端
 * 接口文档：https://doc.chuanglan.com/docs/PA4N31T5HDWA1768
 * 模板ID发送方式：POST https://smssh.253.com/msg/sms/v2/tpl/send
 * 凭据从环境变量读取：CHUANGLAN_ACCOUNT（API账号）、CHUANGLAN_PASSWORD（API密码）、CHUANGLAN_SIGNATURE（短信签名，可选）
 * 未配置账号密码时跳过发送并记录日志，不影响业务主流程
 */
@Injectable()
export class ChuanlanSmsClient {
  private readonly logger = new Logger(ChuanlanSmsClient.name);

  // 发送短信接口地址（模板ID发送方式）
  private readonly apiUrl = 'https://smssh.253.com/msg/sms/v2/tpl/send';

  /**
   * 发送一条短信
   * @param opts.phone 接收手机号（11位）
   * @param opts.templateId 创蓝审核通过的模板ID
   * @param opts.params 模板变量（param1..paramN 自动按顺序生成）
   * @param opts.signature 短信签名，如【XX律所】（模板未关联签名时必传）
   * @param opts.uid 自定义流水号（状态回执回传）
   */
  async send(opts: {
    phone: string;
    templateId: string;
    params?: Record<string, string>;
    signature?: string;
    uid?: string;
  }): Promise<boolean> {
    const account = process.env.CHUANGLAN_ACCOUNT;
    const password = process.env.CHUANGLAN_PASSWORD;
    if (!account || !password) {
      this.logger.warn('创蓝短信未配置账号密码（CHUANGLAN_ACCOUNT/CHUANGLAN_PASSWORD），跳过短信发送');
      return false;
    }

    const timestamp = String(Math.floor(Date.now() / 1000));
    const nonce = this.randomNonce();

    // 将变量对象映射为 param1..paramN，保证与模板变量顺序一致
    const paramObj: Record<string, string> = {};
    if (opts.params) {
      let index = 1;
      for (const key of Object.keys(opts.params)) {
        paramObj[`param${index}`] = opts.params[key] ?? '';
        index += 1;
      }
    }

    const body: Record<string, string> = {
      account,
      password,
      nonce,
      timestamp,
      phoneNumbers: opts.phone,
      templateId: opts.templateId,
      templateParamJson: JSON.stringify([paramObj]),
      report: 'true',
      uid: opts.uid || '',
      extend: '',
    };
    const signature = opts.signature || process.env.CHUANGLAN_SIGNATURE || '';
    if (signature) {
      body.signature = signature;
    }

    try {
      const resp = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const text = await resp.text();
      let data: { code?: string; errorMsg?: string; msgId?: string } = {};
      try {
        data = JSON.parse(text) as { code?: string; errorMsg?: string; msgId?: string };
      } catch {
        // 非 JSON 响应，保留原始报文用于排查
        data = { code: 'parse_error', errorMsg: text };
      }

      if (data.code === '000000') {
        this.logger.log(`短信发送成功 phone=${opts.phone} templateId=${opts.templateId} uid=${opts.uid || ''} msgId=${data.msgId || ''}`);
        return true;
      }

      this.logger.error(
        `短信发送失败 code=${data.code || ''} errorMsg=${data.errorMsg || ''} phone=${opts.phone} templateId=${opts.templateId} raw=${text.slice(0, 500)}`,
      );
      return false;
    } catch (error) {
      this.logger.error(`短信发送异常 phone=${opts.phone} templateId=${opts.templateId}`, (error as Error)?.message || error);
      return false;
    }
  }

  // 生成32位随机字符串（nonce）
  private randomNonce(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i += 1) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }
}