import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import axios from 'axios';
import PDFDocument = require('pdfkit');
import * as sdk from '@fddnpm/fasc-openapi-node-sdk';
import { SigningCompliance, SigningStatus } from '../compliance/signing-compliance.entity';
// C 端短信提醒：法大大电子签完成后触发收案立项短信
import { SmsService } from '../sms/sms.service';
// 组织管理 → 认证授权：企业授权记录（corp_auths 表）
import { CorpAuth } from './corp-auth.entity';

// 法大大运行模式：
// - mock：本地模拟全流程（开发/演示，无真实账号）
// - uat：调用法大大测试环境（UAT，真实联调）
// - prod：调用法大大正式环境（FASC-OpenAPI）
export type FadadaMode = 'mock' | 'prod' | 'uat';

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
  private serviceClient: any = null;
  private templateClient: any = null;
  private corpClient: any = null;
  // accessToken 缓存（法大大凭证有效 2 小时，缓存提前 5 分钟续期）
  private accessTokenCache: { token: string; expireAt: number } | null = null;

  constructor(
    private configService: ConfigService,
    @InjectRepository(SigningCompliance)
    private signingComplianceRepository: Repository<SigningCompliance>,
    // 组织管理 → 认证授权：企业授权记录
    @InjectRepository(CorpAuth)
    private corpAuthRepository: Repository<CorpAuth>,
    // C 端短信提醒：法大大电子签完成后触发收案立项短信
    private smsService: SmsService,
  ) {}

  /**
   * 触发 C 端短信（失败不影响电子签回调主流程）
   */
  private async triggerSms(caseId: string, nodeType: string): Promise<void> {
    try {
      await this.smsService.sendCaseSms({ caseId, nodeType });
    } catch (e) {
      // 短信发送失败不影响电子签回调主流程
      this.logger.error(`触发 C 端短信失败 caseId=${caseId} nodeType=${nodeType}`, (e as Error)?.message || e);
    }
  }

  get enabled(): boolean {
    return this.configService.get('FADADA_ENABLED') === 'true';
  }

  get mode(): FadadaMode {
    const m = this.configService.get('FADADA_MODE') || 'mock';
    // prod / uat 均视为真实调用（区别于 mock）
    if (m === 'prod') return 'prod';
    if (m === 'uat') return 'uat';
    return 'mock';
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
    // uat 模式使用测试环境专用 AppId，否则沿用正式 AppId
    if (this.mode === 'uat') {
      return this.configService.get('FADADA_UAT_APP_ID') || this.configService.get('FADADA_APP_ID') || '';
    }
    return this.configService.get('FADADA_APP_ID') || '';
  }

  private get appSecret(): string {
    // uat 模式使用测试环境专用 AppSecret，否则沿用正式 AppSecret
    if (this.mode === 'uat') {
      return this.configService.get('FADADA_UAT_APP_SECRET') || this.configService.get('FADADA_APP_SECRET') || '';
    }
    return this.configService.get('FADADA_APP_SECRET') || '';
  }

  private get serverUrl(): string {
    // uat 模式使用法大大测试环境 API 地址（含 /api/v5/ 路径，SDK 按相对接口路径拼接）
    if (this.mode === 'uat') {
      return this.configService.get('FADADA_UAT_API_URL') || 'https://uat-api.fadada.com/api/v5';
    }
    return this.configService.get('FADADA_API_URL') || 'https://openapi.fadada.com';
  }

  private get redirectUrl(): string {
    return this.configService.get('FADADA_REDIRECT_URL') || '';
  }

  private get initiatorOpenId(): string {
    return this.configService.get('FADADA_INITIATOR_OPEN_ID') || 'LAWFIRM';
  }

  /** 发起签约的律所名称（corp 参与方「乙方」用印主体） */
  private get firmName(): string {
    return this.configService.get('FADADA_FIRM_NAME') || '广东莞康律师事务所';
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
    if (!this.serviceClient) this.serviceClient = new sdk.serviceClient.Client(clientConfig);
    if (!this.templateClient) this.templateClient = new sdk.templateClient.Client(clientConfig);
    if (!this.corpClient) this.corpClient = new sdk.corpClient.Client(clientConfig);
  }

  /**
   * 获取法大大服务访问凭证（accessToken，有效 2 小时）。
   * 缓存未过期则复用；过期（提前 5 分钟）时重新获取并写入所有业务 SDK 客户端。
   */
  private async ensureAccessToken(): Promise<void> {
    this.ensureClients();
    // 缓存未过期则复用（防止每次请求都重新获取 token）
    if (this.accessTokenCache && this.accessTokenCache.expireAt > Date.now()) {
      return;
    }
    const res = await this.serviceClient.getAccessToken();
    const data = res?.data?.data;
    if (!data?.accessToken) {
      throw new Error('法大大获取 accessToken 失败：' + (res?.data?.msg || '未知错误'));
    }
    const expiresIn = Number(data.expiresIn) || 7200;
    const token = data.accessToken;
    this.accessTokenCache = { token, expireAt: Date.now() + (expiresIn - 300) * 1000 };
    // 将 accessToken 写入各业务 SDK 客户端凭据（签名接口后续请求需要携带）
    this.euiClient.credential.accessToken = token;
    this.signTaskClient.credential.accessToken = token;
    this.toolClient.credential.accessToken = token;
    this.docClient.credential.accessToken = token;
    this.templateClient.credential.accessToken = token;
    this.corpClient.credential.accessToken = token;
    this.logger.log(`法大大 accessToken 已获取（有效期 ${expiresIn}s），已写入各 SDK 客户端`);
  }

  private async assertProdReady() {
    if (!this.appId || !this.appSecret) {
      throw new Error('法大大未配置 FADADA_APP_ID/FADADA_APP_SECRET，无法调用正式电子签接口');
    }
    // 确保客户端已初始化且 accessToken 已获取（业务接口需要携带凭证）
    await this.ensureAccessToken();
  }

  /**
   * 获取个人实名认证链接（身份鉴别）
   * - prod：法大大个人授权认证页（姓名/证件号/手机号实名 + 电子签授权）
   * - mock：本地模拟认证页
   */
  async getRealNameAuthUrl(
    info: SigningClientInfo & { signingId: string },
    redirectUrl?: string,
  ): Promise<{
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
    await this.assertProdReady();
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
      redirectUrl: redirectUrl || this.redirectUrl || undefined,
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
  async getCorpAuthUrl(
    info: SigningCorpInfo & { signingId: string },
    redirectUrl?: string,
  ): Promise<{
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
    await this.assertProdReady();
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
      redirectUrl: redirectUrl || this.redirectUrl || undefined,
    });
    const data = res?.data?.data;
    const eUrl = data?.eUrl;
    if (!eUrl) {
      throw new Error('法大大企业实名认证链接获取失败：' + (res?.data?.msg || '未知错误'));
    }
    return { verifyUrl: eUrl, transactionId: info.signingId, mode: 'prod' };
  }

  /**
   * 获取企业授权链接（组织管理 → 认证授权，平台型应用让其他企业接入本应用）。
   * 同一 clientCorpId 表示同一企业，重复调用即为补充授权范围。
   * - prod：调用法大大 /corp/get-auth-url 生成授权链接
   * - mock：返回本地模拟授权地址
   */
  async createCorpAuthUrl(params: {
    clientCorpId: string;
    corpName: string;
    corpIdentNo?: string;
    legalRepName?: string;
    agentName?: string;
    agentIdCardNo?: string;
    agentMobile?: string;
    authScopes: string[];
    redirectUrl?: string;
  }): Promise<string> {
    if (!this.enabled) {
      throw new Error('法大大电子签未启用（FADADA_ENABLED=false）');
    }
    if (this.mode === 'mock') {
      return `/fadada/mock-corp-auth?clientCorpId=${encodeURIComponent(params.clientCorpId)}` +
        `&corpName=${encodeURIComponent(params.corpName)}`;
    }
    await this.assertProdReady();
    const agentMobile = params.agentMobile?.trim();
    const res = await this.euiClient.getCorpAuthUrl({
      clientCorpId: params.clientCorpId,
      // 经办人在业务系统中的唯一标识（用于授权完成回调定位）
      clientUserId: agentMobile ? 'AGENT_' + agentMobile : params.clientCorpId,
      accountName: agentMobile || undefined,
      corpIdentInfo: {
        corpName: params.corpName,
        corpIdentType: sdk.CorpIdentTypeEnum.CORP,
        corpIdentNo: params.corpIdentNo || undefined,
        legalRepName: params.legalRepName || undefined,
        // 法人认证 或 经办人（授权人）认证
        corpIdentMethod: ['legalRep', 'agent'],
      },
      // 企业名称与信用代码锁定不可由经办人修改，保障主体一致
      corpNonEditableInfo: ['corpName', 'corpIdentNo'],
      oprIdentInfo: {
        userName: params.agentName || undefined,
        userIdentType: sdk.IdentTypeEnum.ID_CARD,
        userIdentNo: params.agentIdCardNo || undefined,
        mobile: agentMobile || undefined,
        oprIdentMethod: ['face', 'mobile'],
      },
      authScopes: params.authScopes.length ? params.authScopes : ['signtask_init', 'signtask_info', 'signtask_file', 'seal_info', 'ident_info'],
      redirectUrl: params.redirectUrl || this.redirectUrl || undefined,
    });
    const authUrl = (res?.data?.data as any)?.authUrl || (res?.data?.data as any)?.eUrl;
    if (!authUrl) {
      // 完整打印返回结构，便于定位法大大业务错误码
      this.logger.error(`法大大企业授权链接响应详情：${JSON.stringify(res?.data || {})}`);
      const bizCode = (res?.data as any)?.data?.code || (res?.data as any)?.code;
      const bizMsg = (res?.data as any)?.data?.msg || (res?.data as any)?.data?.message || (res?.data as any)?.msg;
      const err = new Error(`法大大企业授权链接获取失败：${bizMsg || (res?.data as any)?.msg || '未知错误'}${bizCode ? `（业务码 ${bizCode}）` : ''}`);
      // 标记是否为"企业已授权"业务结果，供上层捕获后同步保存并更新授权状态
      (err as any).fadadaBizCode = bizCode;
      (err as any).fadadaAlreadyAuthed = bizCode === '210002' || /已授权/.test(bizMsg || '');
      throw err;
    }
    return authUrl;
  }

  /**
   * 查询企业授权状态（组织管理 → 认证授权）。
   * 调用法大大 /corp/get 获取企业基本信息、认证状态、授权状态与授权范围。
   * - prod：查询法大大
   * - mock：返回模拟已授权状态
   */
  async queryCorpAuthStatus(by: { clientCorpId?: string; openCorpId?: string }): Promise<{
    clientCorpId?: string;
    openCorpId?: string;
    bindingStatus?: string;
    authScope?: string[];
    identStatus?: string;
  }> {
    if (this.mode === 'mock') {
      return {
        clientCorpId: by.clientCorpId,
        openCorpId: by.openCorpId || by.clientCorpId,
        bindingStatus: 'authorized',
        authScope: [],
        identStatus: 'identified',
      };
    }
    await this.assertProdReady();
    const res = await this.corpClient.get({
      clientCorpId: by.clientCorpId || undefined,
      openCorpId: by.openCorpId || undefined,
    });
    return res?.data?.data || null;
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
    await this.assertProdReady();
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
    // 获取签署链接时同时传 freeLogin / free_login（SDK 类型定义未包含但法大大后端可能需要）
    const urlParams1: any = {
      signTaskId,
      actorId: 'client',
      redirectUrl: this.redirectUrl || undefined,
      freeLogin: true,
      free_login: true,
    };
    this.logger.log('法大大 getActorUrl 请求体(camel+snake)=' + JSON.stringify(urlParams1));
    const urlRes = await this.signTaskClient.getActorUrl(urlParams1);
    const signUrl = urlRes?.data?.data?.actorSignTaskUrl;
    if (!signUrl) {
      throw new Error('法大大签署链接获取失败：' + (urlRes?.data?.msg || '未知错误'));
    }
    return { signTaskId, actorId: 'client', signUrl, mode: 'prod' };
  }

  /** 查询签署任务当前状态（prod 模式调用法大大，mock 模式直接返回 pending） */
  async querySignTaskStatus(signTaskId: string): Promise<string> {
    if (this.mode === 'mock') return 'pending';
    await this.assertProdReady();
    const res = await this.signTaskClient.getDetail({ signTaskId });
    return res?.data?.data?.signTaskStatus || 'unknown';
  }

  /**
   * 基于法大大「签署任务模板 sign-template」发起签署任务（B端案件详情发起签约）。
   * - prod：createWithTemplate 创建签署任务 → start → 获取客户签署链接
   * - mock：返回本地模拟签署页
   * 说明：模板签署无需手动生成 PDF，模板本身已含文档与签区；
   * 参与方(actors)由调用方传入（客户 + 律师），发起的发起方 initiator 需已完成企业授权（openCorpId）。
   */
  async createSignTaskFromTemplate(params: {
    signingId: string;
    subject?: string;
    signTemplateId: string;
    // 签约主体类型：person 个人客户 / corp 企业客户
    subjectType?: 'person' | 'corp';
    // 个人客户信息（subjectType=person 时使用）
    client?: SigningClientInfo;
    // 企业客户信息（subjectType=corp 时使用）
    corp?: SigningCorpInfo;
    // 律师（发起方签署人）
    lawyer?: { lawyerUserId: string; name: string; mobile?: string };
    // 预填字段值列表（固定值 + 业务员预填），配合 fillFieldValues 在定稿前写入
    fillValues?: Array<{ docId?: string | number; fieldId?: string; fieldName?: string; fieldValue: string }>;
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
    await this.assertProdReady();
    // 读取签署模板详情，获取模板内定义的参与方标识（actorId），以便按序匹配签区。
    // 业务约定：person 参与方 = 客户（C端签名），corp 参与方 = 律所（发起方用印）。
    const tmplDetail = await this.fetchSignTemplateDetail(params.signTemplateId);
    const tmplActors: any[] = tmplDetail?.actors || [];
    const personActors = tmplActors.filter((a) => a?.actorInfo?.actorType === 'person');
    const corpActors = tmplActors.filter((a) => a?.actorInfo?.actorType === 'corp');
    const clientActorId = personActors[0]?.actorInfo?.actorId || '甲方';
    const firmActorId = corpActors[0]?.actorInfo?.actorId || '乙方';
    // 模板中甲方（person 参与方）需要填写的控件清单，继承给客户参与方，使其作为填写参与方在 C 端填写后再签署
    const personFillFields: any[] = personActors[0]?.fillFields || [];
    // 模板中乙方（corp 参与方）的待填控件清单不再继承给律所参与方：
    // 产品流程为「客户签完即由免验证签场景码自动盖章」，律所全程无人工动作，
    // 若把乙方面向的控件挂到 firmActor，会在法大大任务里形成「企业待填写」欠账，
    // 出现签署环节卡在企业填字段的状态。乙方的字段值统一由本系统在 start 前
    // 通过 fillFieldValues 全局写入（该接口按 docId+fieldId 写入，与控件归属无关），
    // 因此乙方可填性不受影响，只是不再让企业参与方背负填写义务。
    // 客户参与方（映射到模板 person 参与方，C端填写必填控件后再签署）
    // permissions 同时含 fill 与 sign：客户打开单链接后先补充必填控件，再执行签约动作
    // 个人快捷签：客户持有有效手机号时开启免登签署（freeLogin），打开链接直接进入合同详情页，
    // 无需登录法大大账号；identifiedView=false 允许未实名用户查看任务，
    // 实名认证与签署意愿验证合二为一。快捷签仅对个人参与方有效，
    // 且意愿验证方式仅支持 实名手机号(sms)/人脸识别(face)，故快捷签场景收窄 verifyMethods。
    // 快捷签判断：个人客户有手机号即可开启免登签署（freeLogin + identifiedView=false）。
    // 无手机号时降级为普通签署（identifiedView=true，需实名后查看）。
    const isQuickSign = !!params.client?.mobile;
    this.logger.log(
      `法大大创建签署任务 快捷签判断 isQuickSign=${isQuickSign} mobile=${params.client?.mobile || '(空)'} clientUserId=${params.client?.clientUserId || '(空)'}`,
    );
    const clientActorSignConfig = isQuickSign
      ? ({
          // 快捷签意愿验证：仅允许人脸识别后签署（限制为 face 方式）
          verifyMethods: ['face'],
          identifiedView: false,
          freeLogin: true,
          readingToEnd: true,
          signerSignMethod: 'standard',
          // 免验证签整合：客户完成签署即完成实名授权，无需另行单独办理实名认证
          authorizeFreeSign: true,
          // snake_case 兼容别名（法大大 API 可能需要 snake_case）
          free_login: true,
          identified_view: false,
          reading_to_end: true,
          signer_sign_method: 'standard',
          authorize_free_sign: true,
        })
      : ({ verifyMethods: ['face'], identifiedView: true, readingToEnd: true, signerSignMethod: 'standard',
          free_login: false, identified_view: true, reading_to_end: true, signer_sign_method: 'standard' });
    this.logger.log(
      `法大大客户参与方 signConfigInfo=${JSON.stringify(clientActorSignConfig)}`,
    );
    const clientActor = {
      actor: {
        actorId: clientActorId,
        actorType: sdk.ActorTypeEnum.PERSON,
        actorName: params.client?.userName || params.corp?.corpName || '客户',
        permissions: [sdk.Permissions.FILL, sdk.Permissions.SIGN],
        // 客户在 C 端签署流程中完成法大大实名认证，此处不预先绑定 actorOpenId
        identNameForMatch: params.client?.userName || params.corp?.corpName,
        certNoForMatch: params.client?.idCardNo || '',
        accountName: params.client?.mobile || undefined,
        clientUserId: params.client?.clientUserId,
        notification: { sendNotification: false },
      },
      // 关联客户需填写的控件，避免模板校验「签署任务不是提交状态」
      fillFields: personFillFields?.length ? personFillFields : undefined,
      signConfigInfo: clientActorSignConfig,
    };
    // 律所参与方（映射到模板 corp 参与方，发起方仅用印：待填控件不再挂载，
    // 字段值由 fillFieldValues 全局写入，企业零填写动作、随免验证签自动盖章）
    // 合同模板为制式文本，企业端无需通读至末页，故 readingToEnd 显式置为 false
    // （客户参与方的阅读要求不在此调整，维持原配置）
    const firmActor = {
      actor: {
        actorId: firmActorId,
        actorType: sdk.ActorTypeEnum.CORP,
        actorName: this.firmName,
        permissions: [sdk.Permissions.SIGN],
        actorOpenId: this.initiatorOpenId,
        notification: { sendNotification: false },
      },
      signConfigInfo: { verifyMethods: ['sms', 'face', 'pw'], identifiedView: true, readingToEnd: false, signerSignMethod: 'standard' },
    };
    const actors: any[] = [firmActor, clientActor];
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
    // 组装最终请求体并打印完整日志，便于排查 freeLogin 等参数是否正确传入
    const createWithTemplateReq = {
      signTaskSubject: params.subject || '法律顾问签约',
      initiator: { idType: sdk.IdTypeEnum.CORP, openId: this.initiatorOpenId },
      signTemplateId: params.signTemplateId,
      transReferenceId: params.signingId,
      actors,
      businessId: this.configService.get('FADADA_BUSINESS_ID') || '451799554c41a58c4f8e6e549cf792f3',
      autoStart: false,
      // autoFillFinalize=true: C 端 start 提交后，所有必填控件填完时法大大自动定稿，
      // 直接进入签署阶段，跳过手动 finalizeDoc 的中间状态。
      autoFillFinalize: true,
      autoFinish: true,
      watermarks: [],
    };
    this.logger.log('法大大 createWithTemplate 完整请求体=' + JSON.stringify(createWithTemplateReq));
    const createRes = await this.signTaskClient.createWithTemplate(createWithTemplateReq);
    const signTaskId = createRes?.data?.data?.signTaskId;
    if (!signTaskId) {
      throw new Error('法大大模板签署任务创建失败：' + (createRes?.data?.msg || '请求成功'));
    }
    // 模板签署：B端创建 → 写入预填字段(固定值+业务员预填，客户后仍需填写的必填控件在此之后)。
    // 关键约束：填写接口(fillFieldValues)必须在提交(start)之前调用；
    // 任务现处于「填写中」状态，后续由 C 端客户在本系统 C 端页面补全其余必填控件后，
    // 再调用 completeClientPrefillAndSign 完成 提交→定稿→ 并返回签署链接，从而实现「补充完整信息后再签约」闭环。
    if (params.fillValues && params.fillValues.length > 0) {
      const compiled = params.fillValues
        .filter((v) => v && v.fieldValue !== undefined && v.fieldValue !== null && v.fieldValue !== '')
        .map((v) => ({
          docId: String(v.docId ?? ''),
          fieldId: v.fieldId,
          fieldName: v.fieldName,
          fieldValue: String(v.fieldValue),
        }));
      // 逐字段写入并容错：auto_source 自动带出的值可能不符合控件格式（如数字控件填了案件编号），
      // 单个字段失败仅记录日志并跳过，避免整批填充失败导致 B 端预填全部丢失（C 端重复填写/不回显）。
      for (const item of compiled) {
        try {
          const r = await this.signTaskClient.fillFieldValues({ signTaskId, docFieldValues: [item] });
          const code = r?.data?.code;
          if (code && code !== '100000') {
            this.logger.warn(
              `B端预填字段写入失败 fieldId=${item.fieldId} fieldName=${item.fieldName} code=${code} msg=${r?.data?.msg || ''}`,
            );
          }
        } catch (e) {
          this.logger.warn(`B端预填字段写入异常 fieldId=${item.fieldId} fieldName=${item.fieldName} msg=${(e as Error)?.message || e}`);
        }
      }
    }
    // 不再跳转法大大预填 H5 页面：返回签署任务ID，由 C 端本系统页面收集字段后点击签约再取签署链接。
    return { signTaskId, actorId: clientActorId, signUrl: '', mode: 'prod' };
  }

  /**
   * C端获取签署任务待填字段：返回客户在法大大签署任务中仍需补充的「填写类」必填控件，
   * 并从模板控件定义同步输入限制（required/tips/checkFormat 等），供 C 端页面展示。
   * 金额类控件(amount)无法通过 API 填充，且属业务字段（由 B 端/平台维护），此处一并过滤，避免 C 端填写导致整体填充失败。
   * 仅在任务处于填写中（未提交/未定稿）时有效；mock 模式直接返回空数组。
   */
  async getClientPrefillFields(signTaskId: string): Promise<Array<{
    field_doc_id: string;
    field_id: string;
    field_name: string;
    field_type: string;
    required: boolean;
    tips: string;
    check_format: string;
    default_value: string;
  }>> {
    if (this.mode === 'mock') return [];
    await this.assertProdReady();
    // 从任务详情获取模板ID，再读取模板控件定义中的输入限制（required/tips/checkFormat）
    const detailRes = await this.signTaskClient.getDetail({ signTaskId }).catch(() => null);
    const templateId = detailRes?.data?.data?.templateId || '';
    const limits: Record<string, { required: boolean; tips: string; check_format: string; default_value: string }> = {};
    if (templateId) {
      const tmplDetail = await this.fetchSignTemplateDetail(templateId).catch(() => null);
      (tmplDetail?.docs || []).forEach((d: any) => {
        (d?.docFields || []).forEach((f: any) => {
          const text = f?.fieldTextSingleLine || f?.fieldTextMultiLine || f?.fieldIdCard || f?.fieldNumber || f?.fieldFillDate || null;
          if (f?.fieldId) {
            limits[f.fieldId] = {
              required: !!text?.required,
              tips: text?.tips || '',
              check_format: text?.checkFormat || '',
              default_value: text?.defaultValue || '',
            };
          }
        });
      });
    }
    const res = await this.signTaskClient.getSignTaskFieldList({ signTaskId });
    const fields: any[] = res?.data?.data?.fillFields || [];
    // 过滤出「填写类」且尚未填写的控件（fieldValue 为空），作为 C 端预填表单字段；
    // 金额控件(amount)不能通过 API 填充，过滤掉不展示给客户
    return fields
      .filter((f) => this.isFillableFieldType(f?.fieldType) && !f?.fieldValue && (f?.fieldType || '') !== 'amount')
      .map((f) => ({
        field_doc_id: String(f?.docId ?? ''),
        field_id: f?.fieldId || '',
        field_name: f?.fieldName || f?.fieldId || '',
        field_type: f?.fieldType || '',
        required: !!(limits[f?.fieldId]?.required),
        tips: limits[f?.fieldId]?.tips || '',
        check_format: limits[f?.fieldId]?.check_format || '',
        default_value: limits[f?.fieldId]?.default_value || '',
      }));
  }

  /**
   * 逐字段填充签署任务控件（共用）：
   * 金额控件(amount)无法通过 API 填充（211407），查询任务字段列表并过滤；
   * 其余字段逐字段写入并容错，单个字段值非法仅记录日志跳过，避免整体填充失败导致信息丢失。
   */
  private async fillValuesWithTolerance(
    signTaskId: string,
    values: Array<{ docId?: string | number; fieldId?: string; fieldName?: string; fieldValue: string }>,
  ): Promise<void> {
    const compiled = (values || [])
      .filter((v) => v && v.fieldValue !== undefined && v.fieldValue !== null && v.fieldValue !== '')
      .map((v) => ({
        docId: String(v.docId ?? ''),
        fieldId: v.fieldId,
        fieldName: v.fieldName,
        fieldValue: String(v.fieldValue),
      }));
    if (compiled.length === 0) return;
    const fieldRes = await this.signTaskClient
      .getSignTaskFieldList({ signTaskId })
      .catch(() => null);
    const amountFieldIds = new Set(
      ((fieldRes?.data?.data?.fillFields || []) as any[])
        .filter((f) => f?.fieldType === 'amount')
        .map((f) => f?.fieldId),
    );
    for (const item of compiled) {
      if (amountFieldIds.has(item.fieldId)) continue;
      try {
        const r = await this.signTaskClient.fillFieldValues({ signTaskId, docFieldValues: [item] });
        const code = r?.data?.code;
        if (code && code !== '100000') {
          this.logger.warn(`C端字段写入失败 fieldId=${item.fieldId} fieldName=${item.fieldName} code=${code} msg=${r?.data?.msg || ''}`);
        }
      } catch (e) {
        this.logger.warn(`C端字段写入异常 fieldId=${item.fieldId} fieldName=${item.fieldName} msg=${(e as Error)?.message || e}`);
      }
    }
  }

  /**
   * C端完成待填字段后调用的签约动作：填充字段 → 提交任务(start) → 定稿(finalizeDoc) → 获取客户签署链接。
   * 返回签署链接(signUrl)与可嵌入链接(embedUrl，供 C 端 iframe 内嵌签署页)。
   * mock 模式直接返回本地模拟签署链接。
   */
  async completeClientPrefillAndSign(params: {
    signTaskId: string;
    actorId: string;
    signingId: string;
    values: Array<{ docId?: string | number; fieldId?: string; fieldName?: string; fieldValue: string }>;
  }): Promise<{ signUrl: string; embedUrl: string; mode: FadadaMode }> {
    if (this.mode === 'mock') {
      return { signUrl: `/client/mock-fadada?mode=sign&signing_id=${params.signingId}`, embedUrl: '', mode: 'mock' };
    }
    await this.assertProdReady();
    // 1. 填充客户补充的字段（必须在提交之前调用）
    await this.fillValuesWithTolerance(params.signTaskId, params.values);
    // 2/3. 提交任务(start)并定稿(finalizeDoc)。这两个动作都是「一次性」状态流转，重复点击"去签署"
    //     会对已推进的任务再次触发，法大大返回 211055「签署任务不是创建中状态」/ 211125「不是填写完成状态」。
    //     因此先读取任务当前状态，仅当处于对应流转前置状态时才调用，已推进则跳过，做到幂等容错。
    let taskStatus = '';
    const detailRes = await this.signTaskClient.getDetail({ signTaskId: params.signTaskId }).catch(() => null);
    taskStatus = detailRes?.data?.data?.signTaskStatus || '';
    // 任务状态参考：task_created=创建中、fill_progress=填写中、fill_complete=填写完成、sign_progress=签署中、finished=已完成
    if (taskStatus === 'preview' || taskStatus === 'task_created' || !taskStatus) {
      // 处于创建/预览态才算真正「创建中」，才允许 start 提交
      await this.trySubmitSignTask(params.signTaskId);
      // start 成功后进入「填写中」，此时字段已由 C 端填过，可尝试定稿；若字段未全（如含金额控件跳过），
      // 定稿会返回业务错误，降级为日志即可，客户仍可进入法大大页面补齐。
      await this.tryFinalizeSignTask(params.signTaskId);
    } else if (taskStatus === 'fill_progress') {
      // 已提交过(start 生效)，处于填写中：直接尝试定稿转为签署中；失败不阻断，取链接让客户在法大大页面确认
      await this.tryFinalizeSignTask(params.signTaskId);
    }
    // 处于 fill_complete / sign_progress / finished 等更后置状态时，start 与 finalize 均已生效，直接取链接
    // 4. 获取客户参与方签署链接
    // 获取签署链接时同时传 freeLogin / free_login（SDK 类型定义未包含但法大大后端可能需要）
    const urlParams2: any = {
      signTaskId: params.signTaskId,
      actorId: params.actorId,
      freeLogin: true,
      free_login: true,
    };
    this.logger.log('法大大 getActorUrl 请求体(camel+snake)=' + JSON.stringify(urlParams2));
    const urlRes = await this.signTaskClient.getActorUrl(urlParams2);
    const signUrl = urlRes?.data?.data?.actorSignTaskUrl;
    const embedUrl = urlRes?.data?.data?.actorSignTaskEmbedUrl || '';
    if (!signUrl) {
      // 附加签署任务当前状态日志，便于定位状态流转问题
      const detailRes = await this.signTaskClient
        .getDetail({ signTaskId: params.signTaskId })
        .catch(() => null);
      this.logger.error(
        `法大大签署链接获取失败 signTaskId=${params.signTaskId} actorId=${params.actorId} 任务详情=${JSON.stringify(detailRes?.data?.data || detailRes?.data)}`,
      );
      throw new Error('法大大签署链接获取失败：' + (urlRes?.data?.msg || '未知错误'));
    }
    return { signUrl, embedUrl, mode: 'prod' };
  }

  /**
   * 提交签署任务(start)：仅在任务仍处于「创建中/预览」态时生效。
   * 若任务已推进（如重复调用），法大大返回非 100000 业务码，此处降级为 WARN 日志而不抛错，
   * 避免 C 端「去签署」重复点击导致 Internal Server Error。
   * 但若提交失败原因明确（如必填控件未填写），需透出具体原因给前端，便于客户补齐后重试。
   */
  private async trySubmitSignTask(signTaskId: string): Promise<void> {
    try {
      const startRes = await this.signTaskClient.start({ signTaskId });
      this.logger.log(`法大大模板签署任务 start 响应=${JSON.stringify(startRes?.data || startRes)}`);
      if (startRes?.data?.code && startRes.data.code !== '100000') {
        const code = startRes.data.code;
        const msg = startRes.data.msg || '';
        // 211148=必填控件未填写：这是真实业务阻塞，直接抛错让前端提示客户补齐字段后重试
        if (code === '211148') {
          throw new Error(`签署任务提交失败：${msg}`);
        }
        // 其余情况（如任务已推进 211055）为幂等场景，降级为 WARN 继续取链接
        this.logger.warn(
          `法大大签署任务 start 未生效 code=${code} msg=${msg}，继续取签署链接`,
        );
      }
    } catch (e) {
      if ((e as Error)?.message?.startsWith('签署任务提交失败')) {
        throw e;
      }
      // 网络/签名异常也降级，不阻断后续取链接
      this.logger.warn(`法大大签署任务 start 调用异常 msg=${(e as Error)?.message || e}`);
    }
  }

  /**
   * 定稿文档(finalizeDoc)：仅在任务处于「填写中」时尝试转「填写完成」。
   * 未到定稿时机（如存在未填必填控件）时法大大返回非 100000，同样降级为 WARN，
   * 客户仍可进入法大大签署页面补齐字段并签署。
   */
  private async tryFinalizeSignTask(signTaskId: string): Promise<void> {
    try {
      const finalizeRes = await this.signTaskClient.finalizeDoc({ signTaskId });
      this.logger.log(`法大大模板签署任务 finalizeDoc 响应=${JSON.stringify(finalizeRes?.data || finalizeRes)}`);
      if (finalizeRes?.data?.code && finalizeRes.data.code !== '100000') {
        this.logger.warn(
          `法大大签署任务 finalizeDoc 未生效 code=${finalizeRes.data.code} msg=${finalizeRes.data.msg || ''}，继续取签署链接`,
        );
      }
    } catch (e) {
      this.logger.warn(`法大大签署任务 finalizeDoc 调用异常 msg=${(e as Error)?.message || e}`);
    }
  }

  /**
   * C端预填字段后获取合同预览链接（不提交任务）：填充字段 → 获取签署任务预览地址。
   * 客户预览确认后再调用 completeClientPrefillAndSign 正式签约。
   * mock 模式返回本地模拟预览页。
   */
  async getClientPreviewUrl(params: {
    signTaskId: string;
    signingId: string;
    values: Array<{ docId?: string | number; fieldId?: string; fieldName?: string; fieldValue: string }>;
  }): Promise<{ previewUrl: string; mode: FadadaMode }> {
    if (this.mode === 'mock') {
      return { previewUrl: `/client/mock-fadada?mode=preview&signing_id=${params.signingId}`, mode: 'mock' };
    }
    await this.assertProdReady();
    // 填充客户填写的字段（逐字段容错，预览展示填写后的合同内容）
    await this.fillValuesWithTolerance(params.signTaskId, params.values);
    // 获取签署任务预览链接（任务仍处于填写中，文档未定稿）
    const res = await this.signTaskClient.getSignTaskPreviewUrl({ signTaskId: params.signTaskId });
    // 记录法大大返回的完整预览链接原始值，便于排查预览域名不可达问题（如 80005605.uat-e.fadada.com）
    this.logger.log(`法大大合同预览链接响应 raw=${JSON.stringify(res?.data || res)}`);
    const previewUrl = res?.data?.data?.signTaskPreviewUrl;
    if (!previewUrl) {
      throw new Error('合同预览链接获取失败：' + (res?.data?.msg || '未知错误'));
    }
    return { previewUrl, mode: 'prod' };
  }

  /**
   * 读取法大大签署任务模板详情，返回模板原始 data（含参与方 actors、文档控件等）。
   * ownerId 使用发起方主体（当前律所），与模板归属方一致。
   */
  private async fetchSignTemplateDetail(signTemplateId: string): Promise<any> {
    const res = await this.templateClient.getSignTemplateDetail({
      ownerId: { idType: 'corp', openId: this.initiatorOpenId },
      signTemplateId,
    });
    return res?.data?.data || null;
  }

  /** 属于"填写类"的控件类型（需业务填充内容），签名/印章/签署日期等归为非填写。 */
  private isFillableFieldType(type?: string): boolean {
    if (!type) return false;
    if (
      type === 'person_sign' ||
      type === 'corp_seal' ||
      type === 'corp_seal_cross_page' ||
      type === 'date_sign' ||
      type === 'remark_sign'
    ) {
      return false;
    }
    return true;
  }

  /**
   * 整理法大大签署任务模板的"填写字段"清单（供同步到本地模板维护 & 发起时填充）。
   * 返回每个填写控件：fieldDocId/fieldId/fieldName/fieldType/归属参与方(actor)，
   * 并同步模板控件的输入限制（required/tips/checkFormat）。
   * 依据参与方 fillFields 关联控件归属（乙方/甲方）。
   */
  async getTemplateFillFields(signTemplateId: string): Promise<Array<{
    field_doc_id: string;
    field_id: string;
    field_name: string;
    field_type: string;
    actor: string;
    required: boolean;
    tips: string;
    check_format: string;
  }>> {
    await this.assertProdReady();
    const detail = await this.fetchSignTemplateDetail(signTemplateId);
    const docs: any[] = detail?.docs || [];
    const actors: any[] = detail?.actors || [];
    // 控件 code -> 归属参与方（来自各参与方 fillFields）
    const ownerMap: Record<string, string> = {};
    actors.forEach((a) => {
      const aid = a?.actorInfo?.actorId;
      (a?.fillFields || []).forEach((f) => {
        if (f?.fieldId) ownerMap[f.fieldId] = aid;
      });
    });
    const result: Array<{
      field_doc_id: string;
      field_id: string;
      field_name: string;
      field_type: string;
      actor: string;
      required: boolean;
      tips: string;
      check_format: string;
    }> = [];
    docs.forEach((d) => {
      (d?.docFields || []).forEach((f: any) => {
        if (!this.isFillableFieldType(f?.fieldType)) return;
        // 控件输入限制：单行/多行文本、身份证、数字、日期等控件的必填/提示/校验格式
        const text = f?.fieldTextSingleLine || f?.fieldTextMultiLine || f?.fieldIdCard || f?.fieldNumber || f?.fieldFillDate || null;
        result.push({
          field_doc_id: String(d?.docId ?? ''),
          field_id: f?.fieldId || '',
          field_name: f?.fieldName || '',
          field_type: f?.fieldType || '',
          actor: ownerMap[f?.fieldId] || '',
          required: !!text?.required,
          tips: text?.tips || '',
          check_format: text?.checkFormat || '',
        });
      });
    });
    return result;
  }

  /**
   * B端案件详情「发起签约」：创建签约合规记录并通过签署模板发起签署任务。
   * 返回签约记录与客户 C 端签署链接；发起失败则回滚已创建的签约记录。
   */
  async launchSignFromTemplate(params: {
    caseId: string;
    clientId: string;
    lawyerId: string;
    organizationId: string;
    subject: string;
    signTemplateId: string;
    subjectType: 'person' | 'corp';
    client?: SigningClientInfo;
    corp?: SigningCorpInfo;
    lawyer?: { lawyerUserId: string; name: string; mobile?: string };
    // 预填字段值列表（固定值 + 业务员预填）
    fillValues?: Array<{ docId?: string | number; fieldId?: string; fieldName?: string; fieldValue: string }>;
  }) {
    // 1. 创建签约合规记录（pending，引用法大大签署模板）
    const signing: SigningCompliance = await this.signingComplianceRepository.save(
      this.signingComplianceRepository.create({
        case_id: params.caseId,
        client_id: params.clientId,
        lawyer_id: params.lawyerId,
        organization_id: params.organizationId,
        contract_template_id: params.signTemplateId,
        subject_type: params.subjectType,
        status: SigningStatus.PENDING,
        verify_status: 'none',
        id_card_no: params.client?.idCardNo || null,
        corp_name: params.corp?.corpName || null,
        corp_ident_no: params.corp?.corpIdentNo || null,
        legal_rep_name: params.corp?.legalRepName || null,
        contract_content: params.subject,
        // 保存系统预填 + 业务员预填的字段值，C 端提交签署时一并传参法大大，避免信息丢失
        prefill_values: params.fillValues && params.fillValues.length > 0 ? JSON.stringify(params.fillValues) : null,
      } as Partial<SigningCompliance>),
    );
    try {
      // 2. 基于签署模板发起签署，获取客户 C 端签署链接
      const res = await this.createSignTaskFromTemplate({
        signingId: signing.id,
        subject: params.subject,
        signTemplateId: params.signTemplateId,
        subjectType: params.subjectType,
        client: params.client,
        corp: params.corp,
        lawyer: params.lawyer,
        fillValues: params.fillValues,
      });
      // 3. 回填签署任务信息并更新状态
      signing.fadada_sign_task_id = res.signTaskId;
      signing.fadada_actor_id = res.actorId;
      signing.sign_url = res.signUrl;
      await this.signingComplianceRepository.save(signing);
      // 4. 作废该案件同一客户的历史进行中签约（pending/reviewing）：
      //    同一案件重新发起签约后，遗留的旧签约仍带有效法大大任务（且基于旧模板快照），
      //    C 端「去填写并签约」入口按时间取最新待签记录时若新记录已进入后续态，
      //    会命中这些旧记录导致跳转到旧的法大大任务链接。故仅在本次发起成功后才作废旧记录。
      await this.invalidateStaleSignings(params.caseId, params.clientId, signing.id);
      return { signingId: signing.id, signTaskId: res.signTaskId, actorId: res.actorId, signUrl: res.signUrl, mode: res.mode };
    } catch (e) {
      // 发起失败时清理已创建的签约记录，避免产生脏数据
      await this.signingComplianceRepository.remove(signing).catch(() => undefined);
      throw e;
    }
  }

  /**
   * 作废指定案件+客户的进行中历史签约（pending/reviewing → rejected）。
   * 用于重新发起签约后清理旧签约：旧签约关联的法大大任务基于旧模板快照，
   * 继续存活会让 C 端签约入口误命中并跳转到旧的签署链接，故在新发起成功后将旧的置为失效终态。
   */
  private async invalidateStaleSignings(caseId: string, clientId: string, currentSigningId: string): Promise<void> {
    try {
      const result = await this.signingComplianceRepository
        .createQueryBuilder()
        .update(SigningCompliance)
        .set({ status: SigningStatus.REJECTED })
        .where('case_id = :caseId', { caseId })
        .andWhere('client_id = :clientId', { clientId })
        .andWhere('id != :id', { id: currentSigningId })
        .andWhere('status IN (:...statuses)', { statuses: [SigningStatus.PENDING, SigningStatus.REVIEWING] })
        .execute();
      if (result.affected && result.affected > 0) {
        this.logger.log(`重新发起签约：已作废案件 ${caseId} 客户 ${clientId} 的历史进行中签约 ${result.affected} 条`);
      }
    } catch (e) {
      // 作废旧签约失败不影响本次新签约的正常使用，仅记录日志便于排查
      this.logger.warn(`作废旧签约失败 caseId=${caseId} clientId=${clientId}: ${(e as Error)?.message || e}`);
    }
  }

  /**
   * 处理法大大平台回调事件（幂等）：
   * - user-authorize / user-three-element-verify / user-four-element-verify：实名认证结果
   * - corporate-authorize / corp-authorize：企业授权结果（回填 openCorpId）
   * - sign-task-signed / sign-task-finished / sign-task-sign-rejected / sign-task-canceled / sign-task-abolish：签署状态
   */
  async handleCallback(body: any): Promise<{ handled: boolean; eventId?: string }> {
    const eventId = body?.eventId || body?.event_id;
    if (!eventId) return { handled: false };
    this.logger.log(`收到法大大回调事件: ${eventId}`);
    try {
      // 企业授权完成回调：通过 clientCorpId 定位授权记录，回填 openCorpId 并更新授权状态
      if (eventId === 'corp-authorize' || eventId === 'corporate-authorize') {
        const clientCorpId = body?.clientCorpId;
        if (clientCorpId) {
          const rec = await this.corpAuthRepository.findOne({
            where: { client_corp_id: clientCorpId },
          });
          if (rec) {
            const ok = body?.authResult === 'success';
            rec.open_corp_id = body?.openCorpId || rec.open_corp_id;
            rec.binding_status = ok ? 'authorized' : 'unauthorized';
            rec.ident_status = body?.corpIdentProcessStatus === 'success' ? 'identified' : rec.ident_status;
            rec.auth_status = ok ? 'authed' : 'failed';
            rec.auth_result = body?.authFailedReason || (ok ? 'authorized' : 'auth failed');
            rec.auth_scopes = Array.isArray(body?.authScope) ? body.authScope.join(',') : rec.auth_scopes;
            await this.corpAuthRepository.save(rec);
            this.logger.log(`企业授权回调已更新记录 ${rec.id}: clientCorpId=${clientCorpId} openCorpId=${rec.open_corp_id} status=${rec.auth_status}`);
          }
        }
        return { handled: true, eventId };
      }
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
            // 法大大电子签完成：客户签约完成，触发收案立项短信（失败不影响回调主流程）
            if (target.status === SigningStatus.SIGNED && target.case_id) {
              this.triggerSms(target.case_id, 'filing');
            }
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
        const fontInfo = this.resolveCjkFont();
        const doc = new PDFDocument({ size: 'A4', margin: 50, info: { Title: docName } });
        const chunks: Buffer[] = [];
        doc.on('data', (c: Buffer) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        if (fontInfo) {
          // ttc 集合字体（如 macOS 系统字体）需先提取具体子字体为临时 ttf 供 pdfkit 使用
          const ttfPath = this.ttcPathToTempTtf(fontInfo.path, fontInfo.preferSc);
          if (ttfPath) doc.font(ttfPath);
        }
        doc.fontSize(16).text(docName, { align: 'center' });
        doc.moveDown();
        doc.fontSize(11).text(content, { lineGap: 8 });
        doc.end();
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * 将 .ttc 字体集集合中的某个子字体导出为临时 .ttf 文件（pdfkit 只支持单体 TrueType/OpenType 字体）。
   * - 单字体（.ttf/.otf）路径或显式配置直接返回原路径（pdfkit 可直接使用）
   * - .ttc 集合：用 fontkit 选中简体子字体（family 名含 SC/GB），导出临时 ttf
   */
  private ttcPathToTempTtf(fontPath: string, preferSc?: boolean): string | null {
    if (fontPath.toLowerCase().endsWith('.ttc')) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const fontkit = require('fontkit');
        const collection: any = fontkit.openSync(fontPath);
        const fonts: any[] = Array.isArray(collection.fonts) ? collection.fonts : [collection];
        let target = fonts[0];
        if (preferSc) {
          const sc = fonts.find(
            (f: any) => typeof f.familyName === 'string' && /(SC|GB)/.test(f.familyName),
          );
          if (sc) target = sc;
        }
        if (typeof target.getBuffer !== 'function') {
          this.logger.warn(`法大大 PDF 字体集合中找不到可导出子字体：${fontPath}`);
          return null;
        }
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fdd-font-'));
        const tmpTtf = path.join(tmpDir, 'font.ttf');
        fs.writeFileSync(tmpTtf, target.getBuffer());
        this.logger.log(`已从字体集合导出子字体 ${target.familyName}/${target.postscriptName} -> ${tmpTtf}`);
        return tmpTtf;
      } catch (e) {
        this.logger.warn(`法大大 PDF 字体集合导出失败：${(e as Error)?.message || e}`);
        return null;
      }
    }
    return fontPath;
  }

  /** 探测系统可用的中文字体（macOS/Linux），可用 FADADA_PDF_FONT 显式指定 */
  private resolveCjkFont(): { path: string; preferSc?: boolean } | null {
    // 显式配置的字体（ttf/otf/ttc 均可）
    if (this.pdfFontPath && fs.existsSync(this.pdfFontPath)) {
      return { path: this.pdfFontPath };
    }
    // 优先单体字体（.ttf/.otf，pdfkit 可直接加载）：
    // macOS 系统自带的 Arial Unicode 单体字体，覆盖中日韩统一表意文字
    const singleFonts = [
      '/System/Library/Fonts/Supplemental/Arial Unicode.ttf',
    ].filter(fs.existsSync);
    if (singleFonts.length) return { path: singleFonts[0] };
    // macOS ttc 集合字体（仅在此前单体字体不存在时尝试，优先简体 SC/GB）
    const ttcCandidates: { path: string; preferSc: boolean }[] = [
      { path: '/System/Library/Fonts/PingFang.ttc', preferSc: true },
      { path: '/System/Library/Fonts/Hiragino Sans GB.ttc', preferSc: true },
      { path: '/System/Library/Fonts/STHeiti Light.ttc', preferSc: true },
    ];
    for (const c of ttcCandidates) {
      if (fs.existsSync(c.path)) return c;
    }
    // Linux 常见中文字体
    const fontCandidates = [
      '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
      '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',
      '/usr/share/fonts/truetype/arphic/uming.ttc',
      '/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf',
    ].filter(fs.existsSync);
    return fontCandidates.length ? { path: fontCandidates[0] } : null;
  }
}
