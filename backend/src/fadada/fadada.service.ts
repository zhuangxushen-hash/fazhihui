import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import axios from 'axios';
import PDFDocument = require('pdfkit');
import * as sdk from '@fddnpm/fasc-openapi-node-sdk';
import { SigningCompliance, SigningStatus } from '../compliance/signing-compliance.entity';

export type FadadaMode = 'mock' | 'prod';

export interface SigningClientInfo {
  clientUserId: string;
  userName: string;
  idCardNo?: string;
  mobile?: string;
}

/** 企业实名认证/企业签署主体的企业信息 */
export interface SigningCorpInfo {
  corpName: string;
  corpIdentNo: string;
  legalRepName?: string;
  // 经办人信息（企业实名认证页面带入，为空则需经办人在页面填写）
  agentName?: string;
  agentIdCardNo?: string;
  agentMobile?: string;
}

export interface FadadaConfigDto {
  enabled: boolean;
  mode: FadadaMode;
  provider: string;
  redirectUrl: string;
}

/**
 * 法大大电子签服务：身份鉴别（个人实名认证）+ 电子签名（签署任务）
 * - mock 模式：本地模拟全流程（无真实账号时的开发/演示环境）
 * - prod 模式：调用法大大开放平台 FASC-OpenAPI（HMAC-SHA256 签名）
 */
@Injectable()
export class FadadaService {
  private readonly logger = new Logger(FadadaService.name);
  private euiClient: any = null;
  private signTaskClient: any = null;
  private toolClient: any = null;
  private docClient: any = null;

  constructor(
    private configService: ConfigService,
    @InjectRepository(SigningCompliance)
    private signingComplianceRepository: Repository<SigningCompliance>,
  ) {}

  get enabled(): boolean {
    return this.configService.get('FADADA_ENABLED') === 'true';
  }

  get mode(): FadadaMode {
    return this.configService.get('FADADA_MODE') === 'prod' ? 'prod' : 'mock';
  }

  get config(): FadadaConfigDto {
    return {
      enabled: this.enabled,
      mode: this.mode,
      provider: 'fadada',
      redirectUrl: this.configService.get('FADADA_REDIRECT_URL') || '',
    };
  }

  private get appId(): string {
    return this.configService.get('FADADA_APP_ID') || '';
  }

  private get appSecret(): string {
    return this.configService.get('FADADA_APP_SECRET') || '';
  }

  private get serverUrl(): string {
    return this.configService.get('FADADA_API_URL') || 'https://openapi.fadada.com';
  }

  private get redirectUrl(): string {
    return this.configService.get('FADADA_REDIRECT_URL') || '';
  }

  private get initiatorOpenId(): string {
    return this.configService.get('FADADA_INITIATOR_OPEN_ID') || 'LAWFIRM';
  }

  private get pdfFontPath(): string {
    return this.configService.get('FADADA_PDF_FONT') || '';
  }

  private get callbackToken(): string {
    return this.configService.get('FADADA_CALLBACK_TOKEN') || '';
  }

  /** 校验法大大回调 token（配置后生效；未配置则跳过校验，生产环境建议配置） */
  verifyCallbackToken(token?: string): boolean {
    if (!this.callbackToken) return true;
    return token === this.callbackToken;
  }

  private ensureClients() {
    const clientConfig = {
      serverUrl: this.serverUrl,
      credential: { appId: this.appId, appSecret: this.appSecret },
      profile: { reqTimeout: 30 },
    };
    if (!this.euiClient) this.euiClient = new sdk.euiClient.Client(clientConfig);
    if (!this.signTaskClient) this.signTaskClient = new sdk.signTaskClient.Client(clientConfig);
    if (!this.toolClient) this.toolClient = new sdk.toolClient.Client(clientConfig);
    if (!this.docClient) this.docClient = new sdk.docClient.Client(clientConfig);
  }

  private assertProdReady() {
    if (!this.appId || !this.appSecret) {
      throw new Error('法大大未配置 FADADA_APP_ID/FADADA_APP_SECRET，无法调用正式电子签接口');
    }
    this.ensureClients();
  }

  /**
   * 获取个人实名认证链接（身份鉴别）
   * - prod：法大大个人授权认证页（姓名/证件号/手机号实名 + 电子签授权）
   * - mock：本地模拟认证页
   */
  async getRealNameAuthUrl(info: SigningClientInfo & { signingId: string }): Promise<{
    verifyUrl: string;
    transactionId: string;
    mode: FadadaMode;
  }> {
    if (!this.enabled) {
      throw new Error('法大大电子签未启用（FADADA_ENABLED=false）');
    }
    if (this.mode === 'mock') {
      return {
        verifyUrl: `/client/mock-fadada?mode=verify&signing_id=${info.signingId}`,
        transactionId: info.signingId,
        mode: 'mock',
      };
    }
    this.assertProdReady();
    const res = await this.euiClient.getUserAuthUrl({
      clientUserId: info.clientUserId,
      accountName: info.mobile || undefined,
      userIdentInfo: {
        userName: info.userName,
        userIdentType: sdk.IdentTypeEnum.ID_CARD,
        userIdentNo: info.idCardNo || '',
        mobile: info.mobile || undefined,
        identMethod: ['face', 'mobile'],
      },
      authScopes: ['ident_info', 'signtask_info', 'signtask_init', 'signtask_file'],
      redirectUrl: this.redirectUrl || undefined,
    });
    const data = res?.data?.data;
    if (!data?.authUrl) {
      throw new Error('法大大实名认证链接获取失败：' + (res?.data?.msg || '未知错误'));
    }
    return { verifyUrl: data.authUrl, transactionId: info.signingId, mode: 'prod' };
  }

  /**
   * 获取企业实名认证链接（身份鉴别-企业认证）
   * - prod：法大大企业授权认证页（企业名称/信用代码实名 + 经办人授权）
   * - mock：本地模拟认证页（复用个人认证入口，标识 corp）
   */
  async getCorpAuthUrl(info: SigningCorpInfo & { signingId: string }): Promise<{
    verifyUrl: string;
    transactionId: string;
    mode: FadadaMode;
  }> {
    if (!this.enabled) {
      throw new Error('法大大电子签未启用（FADADA_ENABLED=false）');
    }
    if (this.mode === 'mock') {
      return {
        verifyUrl: `/client/mock-fadada?mode=verify&signing_id=${info.signingId}`,
        transactionId: info.signingId,
        mode: 'mock',
      };
    }
    this.assertProdReady();
    const res = await this.euiClient.getCorpAuthUrl({
      clientCorpId: 'CORP_' + info.signingId,
      clientUserId: 'OPR_' + info.signingId,
      accountName: info.agentMobile || undefined,
      corpIdentInfo: {
        corpName: info.corpName,
        corpIdentType: sdk.CorpIdentTypeEnum.CORP,
        corpIdentNo: info.corpIdentNo,
        legalRepName: info.legalRepName || undefined,
        corpIdentMethod: ['legalRep', 'agent'],
      },
      oprIdentInfo: {
        userName: info.agentName || undefined,
        userIdentType: sdk.IdentTypeEnum.ID_CARD,
        userIdentNo: info.agentIdCardNo || undefined,
        mobile: info.agentMobile || undefined,
        oprIdentMethod: ['face', 'mobile'],
      },
      authScopes: ['ident_info', 'signtask_info', 'signtask_init', 'signtask_file'],
      redirectUrl: this.redirectUrl || undefined,
    });
    const data = res?.data?.data;
    const eUrl = data?.eUrl;
    if (!eUrl) {
      throw new Error('法大大企业实名认证链接获取失败：' + (res?.data?.msg || '未知错误'));
    }
    return { verifyUrl: eUrl, transactionId: info.signingId, mode: 'prod' };
  }

  /**
   * 创建法大大签署任务并返回客户专属签署链接
   * - prod：上传合同 PDF → 创建签署任务 → 提交任务 → 获取客户签署链接
   * - mock：返回本地模拟签署页
   */
  async createSignTask(params: {
    signingId: string;
    subject: string;
    docName: string;
    docContent: string;
    client: SigningClientInfo;
    // 签约主体类型：person 个人签名 / corp 企业签名（企业时以企业主体作为客户参与方）
    subjectType?: 'person' | 'corp';
    // 企业主体信息（subjectType=corp 时必填）
    corp?: SigningCorpInfo;
    lawyer?: { lawyerUserId: string; name: string; mobile?: string };
  }): Promise<{ signTaskId: string; actorId: string; signUrl: string; mode: FadadaMode }> {
    if (!this.enabled) {
      throw new Error('法大大电子签未启用（FADADA_ENABLED=false）');
    }
    if (this.mode === 'mock') {
      return {
        signTaskId: `MOCK-${Date.now()}`,
        actorId: 'client',
        signUrl: `/client/mock-fadada?mode=sign&signing_id=${params.signingId}`,
        mode: 'mock',
      };
    }
    this.assertProdReady();
    const pdf = await this.generateContractPdf(params.docName, params.docContent);
    const docFileId = await this.uploadPdf(pdf, params.docName);
    const isCorp = params.subjectType === 'corp';
    const clientActor = isCorp
      ? {
          actor: {
            actorId: 'client',
            actorType: sdk.ActorTypeEnum.CORP,
            actorName: params.corp?.corpName || params.client.userName,
            permissions: [sdk.Permissions.SIGN],
            actorOpenId: 'CORP_' + params.signingId,
            identNameForMatch: params.corp?.corpName,
            certNoForMatch: params.corp?.corpIdentNo,
            notification: { sendNotification: false },
          },
          signConfigInfo: {
            verifyMethods: ['corp'],
            identifiedView: true,
            readingToEnd: true,
            signerSignMethod: 'standard',
          },
        }
      : {
          actor: {
            actorId: 'client',
            actorType: sdk.ActorTypeEnum.PERSON,
            actorName: params.client.userName,
            permissions: [sdk.Permissions.SIGN],
            actorOpenId: params.client.clientUserId,
            identNameForMatch: params.client.userName,
            certNoForMatch: params.client.idCardNo,
            accountName: params.client.mobile || undefined,
            clientUserId: params.client.clientUserId,
            notification: { sendNotification: false },
          },
          signConfigInfo: {
            verifyMethods: ['face', 'sms'],
            identifiedView: true,
            readingToEnd: true,
            signerSignMethod: 'standard',
          },
        };
    const actors: any[] = [clientActor];
    if (params.lawyer) {
      actors.push({
        actor: {
          actorId: 'lawyer',
          actorType: sdk.ActorTypeEnum.PERSON,
          actorName: params.lawyer.name,
          permissions: [sdk.Permissions.SIGN],
          actorOpenId: params.lawyer.lawyerUserId,
          accountName: params.lawyer.mobile || undefined,
          notification: { sendNotification: false },
        },
        signConfigInfo: { verifyMethods: ['sms'], identifiedView: true, signerSignMethod: 'standard' },
      });
    }
    const createRes = await this.signTaskClient.create({
      signTaskSubject: params.subject,
      initiator: { idType: sdk.IdTypeEnum.CORP, openId: this.initiatorOpenId },
      signDocType: 'contract',
      transReferenceId: params.signingId,
      docs: [{ docId: '1', docName: params.docName, docFileId: docFileId }],
      actors,
      autoStart: false,
      autoFinish: true,
    });
    const signTaskId = createRes?.data?.data?.signTaskId;
    if (!signTaskId) {
      throw new Error('法大大签署任务创建失败：' + (createRes?.data?.msg || '未知错误'));
    }
    await this.signTaskClient.start({ signTaskId });
    const urlRes = await this.signTaskClient.getActorUrl({
      signTaskId,
      actorId: 'client',
      redirectUrl: this.redirectUrl || undefined,
    });
    const signUrl = urlRes?.data?.data?.actorSignTaskUrl;
    if (!signUrl) {
      throw new Error('法大大签署链接获取失败：' + (urlRes?.data?.msg || '未知错误'));
    }
    return { signTaskId, actorId: 'client', signUrl, mode: 'prod' };
  }

  /** 查询签署任务当前状态（prod 模式调用法大大，mock 模式直接返回 pending） */
  async querySignTaskStatus(signTaskId: string): Promise<string> {
    if (this.mode === 'mock') return 'pending';
    this.assertProdReady();
    const res = await this.signTaskClient.getDetail({ signTaskId });
    return res?.data?.data?.signTaskStatus || 'unknown';
  }

  /**
   * 处理法大大平台回调事件（幂等）：
   * - user-authorize / user-three-element-verify / user-four-element-verify：实名认证结果
   * - sign-task-signed / sign-task-finished / sign-task-sign-rejected / sign-task-canceled / sign-task-abolish：签署状态
   */
  async handleCallback(body: any): Promise<{ handled: boolean; eventId?: string }> {
    const eventId = body?.eventId || body?.event_id;
    if (!eventId) return { handled: false };
    this.logger.log(`收到法大大回调事件: ${eventId}`);
    try {
      if (eventId.startsWith('user-')) {
        const clientUserId = body?.clientUserId;
        if (clientUserId) {
          const target = await this.signingComplianceRepository.findOne({
            where: { client_id: clientUserId, verify_status: 'pending' },
            order: { created_at: 'DESC' },
          });
          if (target) {
            const ok =
              eventId === 'user-authorize'
                ? body?.authResult === 'success' || body?.identProcessStatus === 'success'
                : body?.verifyResult === true;
            target.verify_status = ok ? 'verified' : 'failed';
            if (ok) target.verify_time = new Date();
            await this.signingComplianceRepository.save(target);
            this.logger.log(`实名认证回调已更新签约记录 ${target.id}: verify_status=${target.verify_status}`);
          }
        }
        return { handled: true, eventId };
      }
      if (
        eventId === 'sign-task-signed' ||
        eventId === 'sign-task-finished' ||
        eventId === 'sign-task-sign-rejected' ||
        eventId === 'sign-task-canceled' ||
        eventId === 'sign-task-abolish'
      ) {
        const signTaskId = body?.signTaskId;
        if (signTaskId) {
          const target = await this.signingComplianceRepository.findOne({
            where: { fadada_sign_task_id: signTaskId },
          });
          if (target) {
            if (eventId === 'sign-task-finished') {
              target.status = SigningStatus.SIGNED;
              target.signed_time = new Date();
            } else if (eventId === 'sign-task-signed') {
              if (target.status !== SigningStatus.SIGNED) target.status = SigningStatus.REVIEWING;
            } else {
              target.status = SigningStatus.REJECTED;
            }
            await this.signingComplianceRepository.save(target);
            this.logger.log(`签署状态回调已更新签约记录 ${target.id}: status=${target.status}`);
          }
        }
        return { handled: true, eventId };
      }
    } catch (e: any) {
      this.logger.error(`法大大回调处理失败: ${e?.message}`, e?.stack);
    }
    return { handled: false, eventId };
  }

  /** 上传合同 PDF 到法大大云存储并返回 fileId */
  private async uploadPdf(pdfBuffer: Buffer, fileName: string): Promise<string> {
    const uploadRes = await this.docClient.getUploadUrl({ fileType: 'doc' });
    const { uploadUrl, fddFileUrl } = uploadRes?.data?.data || {};
    if (!uploadUrl) throw new Error('法大大文档上传地址获取失败');
    await axios.put(uploadUrl, pdfBuffer, {
      headers: { 'Content-Type': 'application/pdf' },
      timeout: 60000,
    });
    const processRes = await this.docClient.fileProcess({
      fddFileUrlList: [{ fileType: 'doc', fddFileUrl, fileName }],
    });
    const fileIdList = processRes?.data?.data?.fileIdList || [];
    if (!fileIdList.length) throw new Error('法大大文档处理失败：' + (processRes?.data?.msg || '未知错误'));
    return fileIdList[0].fileId;
  }

  /** 根据合同文本生成 A4 PDF（中文排版，字体自动探测/可配置） */
  private async generateContractPdf(docName: string, content: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const fontPath = this.resolveCjkFont();
        const doc = new PDFDocument({ size: 'A4', margin: 50, info: { Title: docName } });
        const chunks: Buffer[] = [];
        doc.on('data', (c: Buffer) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        if (fontPath) doc.font(fontPath);
        doc.fontSize(16).text(docName, { align: 'center' });
        doc.moveDown();
        doc.fontSize(11).text(content, { lineGap: 8 });
        doc.end();
      } catch (e) {
        reject(e);
      }
    });
  }

  /** 探测系统可用的中文字体（macOS/Linux），可用 FADADA_PDF_FONT 显式指定 */
  private resolveCjkFont(): string | null {
    const candidates = [
      this.pdfFontPath,
      '/System/Library/Fonts/PingFang.ttc',
      '/System/Library/Fonts/STHeiti Light.ttc',
      '/System/Library/Fonts/Hiragino Sans GB.ttc',
      '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
      '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',
      '/usr/share/fonts/truetype/arphic/uming.ttc',
      '/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf',
    ].filter(Boolean);
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
    return null;
  }
}
