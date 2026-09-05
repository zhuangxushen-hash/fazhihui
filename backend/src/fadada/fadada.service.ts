import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as crypto from 'crypto';
import axios from 'axios';
import PDFDocument = require('pdfkit');
import * as sdk from '@fddnpm/fasc-openapi-node-sdk';
import { SigningCompliance, SigningStatus } from '../compliance/signing-compliance.entity';
// C 端短信提醒：法大大电子签完成后触发收案立项短信
import { SmsService } from '../sms/sms.service';
// 组织管理 → 认证授权：企业授权记录（corp_auths 表）
import { CorpAuth } from './corp-auth.entity';
// 新流程（线索→发合同→签约完成生成案件）：直接操作合同/案件/线索/客户档案实体
import { Contract } from '../contract/contract.entity';
import { Case } from '../case/case.entity';
import { Lead } from '../lead/lead.entity';
import { ClientProfile } from '../client/client-profile.entity';
import { CaseStatusConfig } from '../case/case-status-config.entity';
// 案件/合同编号按组织规则生成
import { NumberRuleService } from '../number-rule/number-rule.service';
import { NumberType } from '../number-rule/number-rule.entity';
// 发合同建案路径补齐：利冲检索 + 应收台账 + 分润自动触发
import { ConflictCheckService } from '../case/conflict-check.service';
import { Receivable, ReceivableStatus } from '../finance/receivable.entity';
import { CommissionService } from '../finance/commission.service';

// 法大大运行模式：
// - mock：本地模拟全流程（开发/演示，无真实账号）
// - uat：调用法大大测试环境（UAT，真实联调）
// - prod：调用法大大正式环境（FASC-OpenAPI）
export type FadadaMode = 'mock' | 'prod' | 'uat';

/**
 * 互动视频签（audio_video）播报内容。
 * 法大大要求：每条 audioText 150 字以内（2026 年 4 月起支持 500 字），
 * 最多 5 条、合计至少 50 个字符；answerText 为要求用户朗读的回答（默认"是的"），
 * skipVerification 是否跳过回答验证（默认 false 不跳过）。
 * 前置条件：法大大账号需订购计费项「互动视频签功能-Signing-video-recording-Function」。
 * 如各律所需定制播报文案，直接修改本数组即可（UTF-8 中文）。
 */
const DEFAULT_AUDIO_VIDEO_INFOS: Array<{
  audioText: string;
  answerText: string;
  skipVerification: boolean;
}> = [
  {
    audioText:
      '您正在签署一份法律服务合同。请在充分阅读并理解合同全部条款后，确认合同当事人信息与您本人信息一致，且合同服务内容、收费标准及双方权利义务均符合您的真实意愿，再进行本次签署。',
    answerText: '是的',
    skipVerification: false,
  },
];

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
  // 法大大用户服务客户端：查询个人用户实时实名认证结果（getUserInfo）
  private userClient: any = null;
  // accessToken 缓存（法大大凭证有效 2 小时，缓存提前 5 分钟续期）
  private accessTokenCache: { token: string; expireAt: number } | null = null;

  constructor(
    private configService: ConfigService,
    @InjectRepository(SigningCompliance)
    private signingComplianceRepository: Repository<SigningCompliance>,
    // 组织管理 → 认证授权：企业授权记录
    @InjectRepository(CorpAuth)
    private corpAuthRepository: Repository<CorpAuth>,
    // 新流程：发合同创建合同记录、签约完成生成案件
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    @InjectRepository(ClientProfile)
    private clientProfileRepository: Repository<ClientProfile>,
    @InjectRepository(CaseStatusConfig)
    private caseStatusConfigRepository: Repository<CaseStatusConfig>,
    // 编号规则（合同号/案件编号）
    private numberRuleService: NumberRuleService,
    // C 端短信提醒：法大大电子签完成后触发收案立项短信
    private smsService: SmsService,
    // 利冲检索（发合同建案即做利益冲突校验）
    private conflictCheckService: ConflictCheckService,
    // 分润自动触发（签约即算分润，幂等）
    private commissionService: CommissionService,
    // 应收台账（签约即建应收）
    @InjectRepository(Receivable)
    private receivableRepository: Repository<Receivable>,
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

  /** 法大大签署完成后异步回调通知地址（法大大回调我们发送短信的入口） */
  private get notifyUrl(): string {
    return this.configService.get("FADADA_NOTIFY_URL") || "";
  }
  private get callbackToken(): string {
    return this.configService.get('FADADA_CALLBACK_TOKEN') || '';
  }

  /** 校验法大大回调 token（配置后生效；未配置则跳过校验，生产环境建议配置） */
  verifyCallbackToken(token?: string): boolean {
    if (!this.callbackToken) return true;
    return token === this.callbackToken;
  }

  /**
   * 验签法大大正式回调（HMAC-SHA256）
   * 规则：将 X-FASC-App-Id / X-FASC-Sign-Type / X-FASC-Timestamp / X-FASC-Nonce / X-FASC-Event / bizContent
   *  的键值对按 ASCII 码升序排列，拼成 key1=val1&key2=val2... 格式的字符串，
   *  再用 appSecret 作为密钥做 HMAC-SHA256，结果与 X-FASC-Sign 比对。
   *
   * @returns true 验签通过；false 验签失败；null 跳过（UAT/MOCK 模式无 AppSecret 时）
   */
  verifyCallbackSign(headers: Record<string, string | undefined>, bizContent: string): boolean | null {
    const appSecret = this.configService.get('FADADA_UAT_APP_SECRET') || this.configService.get('FADADA_APP_SECRET');
    if (!appSecret) {
      this.logger.log('verifyCallbackSign: 未配置 AppSecret，跳过回调验签');
      return null;
    }
    const sign = headers.sign;
    const timestamp = headers.timestamp;
    if (!sign || !timestamp) {
      this.logger.warn('verifyCallbackSign: 缺少 X-FASC-Sign 或 X-FASC-Timestamp 头，验签失败');
      return false;
    }
    // 按法大大签名规则，将请求头参数 + bizContent 按 ASCII 排序后拼接
    const paramMap: Record<string, string> = {};
    if (headers.appId) paramMap['X-FASC-App-Id'] = headers.appId;
    if (headers.signType) paramMap['X-FASC-Sign-Type'] = headers.signType;
    if (timestamp) paramMap['X-FASC-Timestamp'] = timestamp;
    if (headers.nonce) paramMap['X-FASC-Nonce'] = headers.nonce;
    if (headers.event) paramMap['X-FASC-Event'] = headers.event;
    paramMap['bizContent'] = bizContent || '';
    const sortedKeys = Object.keys(paramMap).sort();
    const strToSign = sortedKeys.map(function(k) { return k + '=' + paramMap[k]; }).join('&');
    const computed = crypto.createHmac('sha256', appSecret).update(strToSign).digest('hex');
    const ok = computed === sign;
    if (!ok) {
      this.logger.warn('verifyCallbackSign: HMAC-SHA256 验签失败 computed=' + computed + ' received=' + sign);
    } else {
      this.logger.log('verifyCallbackSign: HMAC-SHA256 验签通过');
    }
    return ok;
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
    if (!this.userClient) this.userClient = new sdk.userClient.Client(clientConfig);
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
    this.userClient.credential.accessToken = token;
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
   * 查询法大大侧个人用户实时实名认证结果（以法大大为准，本地 verify_status 仅作回写缓存）。
   * - 返回 identStatus: identified=已认证且有效 / unidentified=未认证
   * - 返回 bindingStatus: authorized=已授权本应用 / unauthorized=未授权
   * - mock 模式无真实法大大用户，返回 unidentified（由调用方回退本地 verify_status 判断）
   * - 查询异常不抛错（返回 unidentified），由调用方决定回退策略
   */
  async getUserRealNameStatus(clientUserId: string): Promise<{
    identStatus: 'identified' | 'unidentified';
    bindingStatus?: string;
    mode: FadadaMode;
  }> {
    if (!this.enabled) {
      throw new Error('法大大电子签未启用（FADADA_ENABLED=false）');
    }
    if (this.mode === 'mock') {
      return { identStatus: 'unidentified', mode: 'mock' };
    }
    try {
      await this.assertProdReady();
      const res = await this.userClient.getUserInfo({ clientUserId });
      const data = res?.data?.data;
      console.log(
        `法大大 getUserInfo 实名查询 clientUserId=${clientUserId} 响应.data=${JSON.stringify(res?.data || null)}`,
      );
      return {
        identStatus: data?.identStatus === 'identified' ? 'identified' : 'unidentified',
        bindingStatus: data?.bindingStatus,
        mode: 'prod',
      };
    } catch (e) {
      // 查询失败（网络/用户不存在等）不阻断业务，按未认证处理，调用方回退本地状态
      this.logger.warn(`法大大实名结果查询失败 clientUserId=${clientUserId}：${(e as Error)?.message}`);
      return { identStatus: 'unidentified', mode: 'prod' };
    }
  }

  /**
   * 获取个人实名认证链接（身份鉴别-个人认证）
   * - prod：法大大个人授权页（人脸识别 + 实名账号绑定 + 应用授权）
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
            // C端客户验证方式只保留互动视频签（audio_video）：签署时录制音视频
            verifyMethods: ['audio_video'],
            identifiedView: true,
            readingToEnd: true,
            signerSignMethod: 'standard',
            // 互动视频签：签署时录制音视频（配合 verifyMethods=audio_video）
            audioVideoInfos: DEFAULT_AUDIO_VIDEO_INFOS,
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
      notifyUrl: this.notifyUrl || undefined,
    });
    const signTaskId = createRes?.data?.data?.signTaskId;
    if (!signTaskId) {
      throw new Error('法大大签署任务创建失败：' + (createRes?.data?.msg || '未知错误'));
    }
    await this.signTaskClient.start({ signTaskId });
    // 获取签署链接（不传 freeLogin：免登会跳过 audio_video 互动视频签，录不了音视频）
    const urlParams1: any = {
      signTaskId,
      actorId: 'client',
      redirectUrl: this.redirectUrl || undefined,
    };
    console.log('法大大 getActorUrl 请求体(camel+snake)=' + JSON.stringify(urlParams1));
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
   * 获取签署音视频下载链接（互动视频签 audio_video 录制，flv 格式，有效期 24 小时）。
   * 注意：签署完成后一般 5 分钟才可下载；法大大仅保存 3 天，需在有效期内及时获取。
   * 调用法大大接口 /sign-task/actor/get-audio-video-download-url（SDK 未封装，走通用 request）。
   */
  async getSignAudioVideoUrl(signTaskId: string, actorId: string): Promise<string> {
    if (this.mode === 'mock') return '';
    await this.assertProdReady();
    const res = await this.signTaskClient.request({
      url: '/sign-task/actor/get-audio-video-download-url',
      reqMethod: 'POST',
      req: { signTaskId, actorId },
    });
    const data = res?.data?.data;
    if (!data) {
      throw new Error('法大大签署音视频获取失败：' + (res?.data?.msg || '未知错误'));
    }
    // 法大大开放平台文档未明确响应字段名，兼容多种可能命名
    const downloadUrl = data.downloadUrl || data.url || data.audioVideoUrl || data.videoUrl || data.fileUrl || '';
    if (!downloadUrl) {
      throw new Error('法大大签署音视频获取失败：返回数据缺少下载地址');
    }
    return downloadUrl;
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
    // 互动视频签（audio_video）播报内容（模板管理按模板配置，未配置时回退默认）
    audioVideoInfos?: Array<{ audioText: string; answerText?: string }>;
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
    // 个人客户手机号必填：手机号会作为 CLT_手机号 贯穿 createWithTemplate / getActorUrl，
    // 用于法大大 actor 在「个人授权链接API」实名授权环节绑定手机号。
    if (params.subjectType !== 'corp' && !params.client?.mobile) {
      throw new Error('客户手机号必填：请先在客户/线索信息中补充手机号，再发起签约');
    }
    // 互动视频签（audio_video）播报内容：优先使用模板管理中配置的内容（每模板可不同），未配置时回退默认播报内容
    const audioVideoInfos: any[] =
      params.audioVideoInfos && params.audioVideoInfos.length > 0
        ? params.audioVideoInfos
        : DEFAULT_AUDIO_VIDEO_INFOS;
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
    // 标准两步流程（对齐法大大文档 6YHMCFJJC4/FIJYQHAS802K7UD9）：
    //   ① 客户在 C 端打开「个人授权链接API」(getUserAuthUrl) 做人脸识别 + 实名账号绑定；
    //   ② C 端 submit-prefill 校验 verify_status=verified 后，调 getActorUrl 拿签署链接；
    //   ③ 客户在签署页通过互动视频签（audio_video，含朗读授权文本+人脸核身）完成意愿确认。
    // 本配置用于 createWithTemplate 阶段 actor 元信息：freeLogin=false（不打免登快捷签）、
    // identifiedView=true（签署页提示"已实名"），意愿验证仍走 audio_video 录屏。
    // isQuickSign 的降级分支仅作防御兜底（手机号必填校验后正常恒为 true）。
    const isQuickSign = !!params.client?.mobile;
    console.log(
      `法大大创建签署任务 快捷签判断 isQuickSign=${isQuickSign} mobile=${params.client?.mobile || '(空)'} clientUserId=${params.client?.clientUserId || '(空)'}`,
    );
    const clientActorSignConfig = isQuickSign
      ? ({
          // 意愿验证：使用互动视频签（audio_video）确认签署意愿
          verifyMethods: ['audio_video'],
          // 不走免登（必须先经个人授权链接API 完成实名），签署页提示"已实名"
          identifiedView: true,
          freeLogin: false,
          readingToEnd: true,
          signerSignMethod: 'standard',
          // snake_case 兼容别名（法大大 API 可能需要 snake_case）
          free_login: false,
          identified_view: true,
          reading_to_end: true,
          signer_sign_method: 'standard',
          // 互动视频签播报内容（配合 verifyMethods=audio_video 启用音视频录制）
          audioVideoInfos,
        })
      : ({ verifyMethods: ['audio_video'], identifiedView: true, readingToEnd: true, signerSignMethod: 'standard',
          free_login: false, identified_view: true, reading_to_end: true, signer_sign_method: 'standard',
          audioVideoInfos });
    const clientActor = {
      actor: {
        actorId: clientActorId,
        actorType: sdk.ActorTypeEnum.PERSON,
        actorName: params.client?.userName || params.corp?.corpName || '客户',
        permissions: [sdk.Permissions.FILL, sdk.Permissions.SIGN],
        // 客户在 C 端签署流程中完成法大大实名认证，此处不预先绑定 actorOpenId
        identNameForMatch: (params.client?.userName || params.corp?.corpName) || undefined,
        // certType 不传，法大大默认身份证；手动传 'idcard' 会被法大大后端校验为不合法
        certNoForMatch: params.client?.idCardNo || undefined,
        accountName: params.client?.mobile || undefined,
        // accountEditable: true, // 豸帮帮没提此字段，先不传（默认 false）
        // accountEditable=true: 开启"二要素快捷签"——手机号+姓名匹配即可，无需法大大已有账号
        // clientUserId 统一口径：优先用调用方传入的「本地客户档案 ID」（与 C 端实名注册、
        // 法大大侧 accountName↔clientUserId 绑定一致）；拿不到时才回退 CLT_手机号派生。
        // 注意：法大大会校验 accountName 与 clientUserId 必须指向同一用户——手机号一旦
        // 绑定过某个 clientUserId，再用其他 clientUserId + 同手机号发起任务会报
        // 「accountName与clientUserId不匹配, 非同一用户」。
        clientUserId:
          params.client?.clientUserId ||
          (params.client?.mobile ? 'CLT_' + params.client.mobile : undefined),
        notification: { sendNotification: false },
      },
      // 关联客户需填写的控件，避免模板校验「签署任务不是提交状态」
      fillFields: personFillFields?.length ? personFillFields : undefined,
      signConfigInfo: clientActorSignConfig,
    };
    console.log(
      `法大大客户参与方 actor=${JSON.stringify(clientActor.actor)} signConfigInfo=${JSON.stringify(clientActorSignConfig)}`,
    );
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
      notifyUrl: this.notifyUrl || undefined,
      watermarks: [],
    };
    console.log('法大大 createWithTemplate 完整请求体=' + JSON.stringify(createWithTemplateReq));
    const createRes = await this.signTaskClient.createWithTemplate(createWithTemplateReq);
    console.log('法大大 createWithTemplate 响应.data=' + JSON.stringify(createRes?.data));
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
    clientMobile?: string;
    /** 本地客户档案 ID：法大大 clientUserId 的统一口径（与实名注册一致，用于免登判断） */
    clientUserId?: string;
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
    // 一律走标准签署链接（不传 freeLogin）：免登链接会跳过法大大签署页的
    // 互动视频签（audio_video）意愿核身，导致已实名客户签合同时不录音频视频。
    // 实名前置由 submit-prefill 已拦截（未实名根本到不了这里），此处直接取链接。
    const urlParams2: any = {
      signTaskId: params.signTaskId,
      actorId: params.actorId,
      // 法大大建议：传与 createWithTemplate 一致的 clientUserId，确保快捷签链路完整
      // 统一口径：本地客户档案 ID（优先），回退 CLT_手机号（旧数据兼容）
      clientUserId: params.clientUserId || (params.clientMobile ? 'CLT_' + params.clientMobile : undefined),
      // 签署完成后重定向回 C 端案件列表（法大大 getActorUrl 接口支持 redirectUrl 参数）
      redirectUrl: this.redirectUrl || undefined,
    };
    console.log('法大大 getActorUrl 请求体=' + JSON.stringify(urlParams2));
    const urlRes = await this.signTaskClient.getActorUrl(urlParams2);
    console.log('法大大 getActorUrl 响应.data=' + JSON.stringify(urlRes?.data));
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
      console.log(`法大大模板签署任务 start 响应=${JSON.stringify(startRes?.data || startRes)}`);
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
      console.log(`法大大模板签署任务 finalizeDoc 响应=${JSON.stringify(finalizeRes?.data || finalizeRes)}`);
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
    console.log(`法大大合同预览链接响应 raw=${JSON.stringify(res?.data || res)}`);
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
    // 互动视频签（audio_video）播报内容（模板管理按模板配置，未配置时回退默认）
    audioVideoInfos?: Array<{ audioText: string; answerText?: string }>;
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
      // 2. 发合同时录入的客户实名信息同步到客户管理（补录身份证号/替换占位姓名）
      if (params.subjectType !== 'corp' && params.client) {
        const profile = await this.clientProfileRepository.findOne({ where: { id: params.clientId } });
        if (profile) {
          await this.syncRealNameToProfile(profile, params.client.userName, params.client.idCardNo);
        }
      }
      // 3. 基于签署模板发起签署，获取客户 C 端签署链接
      // clientUserId 统一用本地客户档案 ID（clientId）：与 C 端实名注册、法大大侧
      // accountName↔clientUserId 绑定保持一致，避免「非同一用户」校验报错
      const res = await this.createSignTaskFromTemplate({
        signingId: signing.id,
        subject: params.subject,
        signTemplateId: params.signTemplateId,
        subjectType: params.subjectType,
        client: params.client ? { ...params.client, clientUserId: params.clientId } : undefined,
        corp: params.corp,
        lawyer: params.lawyer,
        fillValues: params.fillValues,
        audioVideoInfos: params.audioVideoInfos,
      });
      // 3. 回填签署任务信息并更新状态
      signing.fadada_sign_task_id = res.signTaskId;
      signing.fadada_actor_id = res.actorId;
      // 优先用 embedUrl（带 isFreeLogin=1 参数，法大大后端识别快捷签），短链作 fallback
      signing.sign_url = (res as any).embedUrl || res.signUrl;
      await this.signingComplianceRepository.save(signing);
      // 4. 作废该案件同一客户的历史进行中签约（pending/reviewing）：
      //    同一案件重新发起签约后，遗留的旧签约仍带有效法大大任务（且基于旧模板快照），
      //    C 端「去填写并签约」入口按时间取最新待签记录时若新记录已进入后续态，
      //    会命中这些旧记录导致跳转到旧的法大大任务链接。故仅在本次发起成功后才作废旧记录。
      await this.invalidateStaleSignings(params.caseId, params.clientId, signing.id);
      return { signingId: signing.id, signTaskId: res.signTaskId, actorId: res.actorId, signUrl: (res as any).embedUrl || res.signUrl, mode: res.mode };
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

  // ==================== 新流程：线索 → 发合同(签约) → 签约完成生成案件 ====================

  /** 回退合同号（未配置组织编号规则时使用） */
  private fallbackContractNo(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `HT-${y}${m}${d}-${rand}`;
  }

  /** 回退案件号（未配置组织编号规则时使用） */
  private fallbackCaseNo(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `AJ-${y}${m}${d}-${rand}`;
  }

  /**
   * 发合同实名信息同步到客户管理（按需补录，不覆盖客户已维护的数据）：
   * - 身份证号：仅档案缺失时补录（法大大实名核验/案件建档复用）；
   * - 姓名：仅档案姓名为占位（微信用户XXXX / 客户XXXX / 手机号）时替换为录入的真实姓名。
   */
  private async syncRealNameToProfile(
    profile: ClientProfile,
    userName?: string,
    idCardNo?: string,
  ): Promise<void> {
    try {
      const patch: Partial<ClientProfile> = {};
      if (idCardNo && !profile.id_card_no) patch.id_card_no = idCardNo;
      if (
        userName &&
        (!profile.name ||
          /^微信用户\d+$/.test(profile.name) ||
          /^客户\d+$/.test(profile.name) ||
          profile.name === profile.phone)
      ) {
        patch.name = userName;
      }
      if (Object.keys(patch).length > 0) {
        await this.clientProfileRepository.update(profile.id, patch);
        this.logger.log(
          `发合同实名信息已同步客户档案 clientId=${profile.id} fields=${Object.keys(patch).join(',')}`,
        );
      }
    } catch (e) {
      this.logger.warn(
        `发合同同步客户档案失败（不阻断）clientId=${profile.id}: ${(e as Error)?.message || e}`,
      );
    }
  }

  /**
   * 新流程「发合同(签约)」：从线索发起，与案件无关。
   * 1) 创建合同记录（stage=signing，关联线索，保存生成案件补充信息 case_supplement）
   * 2) 创建签约合规记录（case_id 空串、lead_id/contract_id 关联）
   * 3) 基于签署模板发起法大大签署任务
   * 签署完成后由回调自动生成案件（generateCaseFromContract）。
   */
  async launchSignFromLead(params: {
    leadId: string;
    lawyerId: string;
    organizationId: string;
    subject: string;
    signTemplateId: string;
    signTemplateLocalId?: string;
    subjectType: 'person' | 'corp';
    client?: SigningClientInfo;
    corp?: SigningCorpInfo;
    lawyer?: { lawyerUserId: string; name: string; mobile?: string };
    fillValues?: Array<{ docId?: string | number; fieldId?: string; fieldName?: string; fieldValue: string }>;
    audioVideoInfos?: Array<{ audioText: string; answerText?: string }>;
    // 合同基础信息（发合同页填写；合同上已有的字段）
    contract?: {
      type?: string;
      amount?: number;
      fee_type?: string;
      payment_method?: string;
      start_date?: string;
      end_date?: string;
      remarks?: string;
    };
    // 批量补充的「生成案件用」信息（合同上没有的字段）
    caseSupplement?: {
      case_type?: string;
      case_category?: string;
      case_name?: string;
      opposing_party?: string;
      assignee_lawyer_id?: string;
      assistant_lawyer_ids?: string[];
      fee_amount?: number;
      fee_type?: string;
      payment_method?: string;
      description?: string;
      contact_address?: string;
      court?: string;
    };
  }) {
    const lead = await this.leadRepository.findOne({ where: { id: params.leadId } });
    if (!lead) throw new Error('线索不存在');
    const orgId = lead.organization_id || params.organizationId;

    // 1. 创建合同记录（发合同 → 待签署）
    let contractNo: string | null = null;
    try {
      const bizType = NumberRuleService.mapContractTypeToBizType(params.contract?.type || 'entrust');
      if (bizType) {
        contractNo = await this.numberRuleService.generateNumber(orgId, {
          numberType: NumberType.CONTRACT,
          bizType,
        });
      }
    } catch (e) {
      this.logger.warn(`发合同：按编号规则生成合同号失败，回退随机编号 ${(e as Error)?.message || e}`);
    }
    const supplement = params.caseSupplement || {};
    // 案件编号：发合同时即预生成（按组织编号规则 + 案件大类映射），
    // 签约完成建案时沿用同一编号，保证「发合同告知客户的案件号 = 最终案件号」。
    // 生成失败不阻塞发合同：留空，建案时回退到建案时生成。
    let preCaseNo: string | null = null;
    try {
      const caseBizType = NumberRuleService.mapCategoryToBizType(supplement.case_category || 'civil');
      if (caseBizType) {
        preCaseNo = await this.numberRuleService.generateNumber(orgId, {
          numberType: NumberType.CASE,
          bizType: caseBizType,
        });
      }
    } catch (e) {
      this.logger.warn(`发合同：预生成案件编号失败，建案时回退生成 ${(e as Error)?.message || e}`);
    }
    const clientName = params.subjectType === 'corp'
      ? params.corp?.corpName || lead.contact_name || lead.phone
      : params.client?.userName || lead.contact_name || lead.phone;
    const clientPhone = params.client?.mobile || lead.phone || '';
    const contract = await this.contractRepository.save(
      this.contractRepository.create({
        contract_no: contractNo || this.fallbackContractNo(),
        case_no: preCaseNo || null,
        title: params.subject || '法律服务合同',
        type: params.contract?.type || 'entrust',
        client_name: clientName,
        client_phone: clientPhone,
        amount: params.contract?.amount ?? (lead.amount ? Number(lead.amount) : 0),
        start_date: params.contract?.start_date ? new Date(params.contract.start_date) : undefined,
        end_date: params.contract?.end_date ? new Date(params.contract.end_date) : undefined,
        stage: 'signing',
        status: 'active',
        remarks: params.contract?.remarks || null,
        fee_type: params.contract?.fee_type || supplement.fee_type || null,
        payment_method: params.contract?.payment_method || supplement.payment_method || null,
        related_lead_id: lead.id,
        lead_lawyer_id: supplement.assignee_lawyer_id || null,
        template_id: params.signTemplateLocalId || null,
        case_supplement: JSON.stringify(supplement),
        organization_id: orgId,
      } as Partial<Contract>),
    );

    // 2. 创建签约合规记录（无案件，case_id 空串）
    const signing: SigningCompliance = await this.signingComplianceRepository.save(
      this.signingComplianceRepository.create({
        case_id: '',
        client_id: '',
        lead_id: lead.id,
        contract_id: contract.id,
        lawyer_id: params.lawyerId,
        organization_id: orgId,
        contract_template_id: params.signTemplateId,
        subject_type: params.subjectType,
        status: SigningStatus.PENDING,
        verify_status: 'none',
        id_card_no: params.client?.idCardNo || null,
        corp_name: params.corp?.corpName || null,
        corp_ident_no: params.corp?.corpIdentNo || null,
        legal_rep_name: params.corp?.legalRepName || null,
        contract_content: params.subject,
        prefill_values: params.fillValues && params.fillValues.length > 0 ? JSON.stringify(params.fillValues) : null,
      } as Partial<SigningCompliance>),
    );

    try {
      // 3. 发合同时录入的客户实名信息同步到客户管理：
      //    无档案 → 立即建档（source=合同签约），客户即时出现在客户管理，
      //    且手机号即可通过微信授权登录 C 端；
      //    有档案 → 补录身份证号/替换占位姓名。
      //    档案 ID 作为法大大 clientUserId（与 C 端实名注册口径一致），
      //    同步异常时回退 CLT_手机号，不阻断发合同。
      let leadClientUserId: string | undefined = params.client?.clientUserId;
      if (params.subjectType !== 'corp') {
        const phone = params.client?.mobile || lead.phone;
        if (phone) {
          let profile = await this.clientProfileRepository.findOne({ where: { phone } });
          if (!profile) {
            profile = await this.clientProfileRepository.save(
              this.clientProfileRepository.create({
                name: params.client?.userName || lead.contact_name || `客户${phone.slice(-4)}`,
                phone,
                type: 'individual',
                source: '合同签约',
                contact_name: params.client?.userName || lead.contact_name || phone,
                id_card_no: params.client?.idCardNo || null,
                organization_id: orgId,
              } as Partial<ClientProfile>),
            );
            this.logger.log(`发合同自动建档 phone=${phone} clientId=${profile.id}`);
          } else {
            await this.syncRealNameToProfile(profile, params.client?.userName, params.client?.idCardNo);
          }
          leadClientUserId = profile.id;
        }
      }
      const res = await this.createSignTaskFromTemplate({
        signingId: signing.id,
        subject: params.subject,
        signTemplateId: params.signTemplateId,
        subjectType: params.subjectType,
        client: params.client ? { ...params.client, clientUserId: leadClientUserId } : undefined,
        corp: params.corp,
        lawyer: params.lawyer,
        fillValues: params.fillValues,
        audioVideoInfos: params.audioVideoInfos,
      });
      signing.fadada_sign_task_id = res.signTaskId;
      signing.fadada_actor_id = res.actorId;
      signing.sign_url = (res as any).embedUrl || res.signUrl;
      await this.signingComplianceRepository.save(signing);
      return {
        contractId: contract.id,
        contractNo: contract.contract_no,
        caseNo: contract.case_no || '',
        signingId: signing.id,
        signTaskId: res.signTaskId,
        actorId: res.actorId,
        signUrl: (res as any).embedUrl || res.signUrl,
        mode: res.mode,
      };
    } catch (e) {
      // 发起失败：清理合同与签约记录，避免脏数据
      await this.signingComplianceRepository.remove(signing).catch(() => undefined);
      await this.contractRepository.remove(contract).catch(() => undefined);
      throw e;
    }
  }

  /**
   * 客户级「发合同(签约)」：直接从客户档案发起，不依赖线索。
   * 合同记录写入 client_id、related_lead_id 留空；签约完成后同样由回调自动生成案件
   * （generateCaseFromContract 对无线索完全兼容：按手机号找/建客户档案生成案件）。
   */
  async launchSignFromClient(params: {
    clientId: string;
    lawyerId: string;
    organizationId: string;
    subject: string;
    signTemplateId: string;
    signTemplateLocalId?: string;
    subjectType: 'person' | 'corp';
    client?: SigningClientInfo;
    corp?: SigningCorpInfo;
    lawyer?: { lawyerUserId: string; name: string; mobile?: string };
    fillValues?: Array<{ docId?: string | number; fieldId?: string; fieldName?: string; fieldValue: string }>;
    audioVideoInfos?: Array<{ audioText: string; answerText?: string }>;
    contract?: {
      type?: string;
      amount?: number;
      fee_type?: string;
      payment_method?: string;
      start_date?: string;
      end_date?: string;
      remarks?: string;
    };
    caseSupplement?: {
      case_type?: string;
      case_category?: string;
      case_name?: string;
      opposing_party?: string;
      assignee_lawyer_id?: string;
      assistant_lawyer_ids?: string[];
      fee_amount?: number;
      fee_type?: string;
      payment_method?: string;
      description?: string;
      contact_address?: string;
      court?: string;
    };
  }) {
    const client = await this.clientProfileRepository.findOne({ where: { id: params.clientId } });
    if (!client) throw new Error('客户不存在');
    const orgId = client.organization_id || params.organizationId;

    // 发合同时录入的客户实名信息同步到客户管理（补录身份证号/替换占位姓名）
    if (params.subjectType !== 'corp' && params.client) {
      await this.syncRealNameToProfile(client, params.client.userName, params.client.idCardNo);
    }

    // 1. 创建合同记录（发合同 → 待签署）
    let contractNo: string | null = null;
    try {
      const bizType = NumberRuleService.mapContractTypeToBizType(params.contract?.type || 'entrust');
      if (bizType) {
        contractNo = await this.numberRuleService.generateNumber(orgId, {
          numberType: NumberType.CONTRACT,
          bizType,
        });
      }
    } catch (e) {
      this.logger.warn(`客户发合同：按编号规则生成合同号失败，回退随机编号 ${(e as Error)?.message || e}`);
    }
    const supplement = params.caseSupplement || {};
    // 案件编号：发合同时即预生成（与线索发合同一致，保证签约前后案件号一致）
    let preCaseNo: string | null = null;
    try {
      const caseBizType = NumberRuleService.mapCategoryToBizType(supplement.case_category || 'civil');
      if (caseBizType) {
        preCaseNo = await this.numberRuleService.generateNumber(orgId, {
          numberType: NumberType.CASE,
          bizType: caseBizType,
        });
      }
    } catch (e) {
      this.logger.warn(`客户发合同：预生成案件编号失败，建案时回退生成 ${(e as Error)?.message || e}`);
    }
    const clientName = params.subjectType === 'corp'
      ? params.corp?.corpName || client.name || client.contact_name || ''
      : params.client?.userName || client.name || client.contact_name || '';
    const clientPhone = params.client?.mobile || client.phone || '';
    const contract = await this.contractRepository.save(
      this.contractRepository.create({
        contract_no: contractNo || this.fallbackContractNo(),
        case_no: preCaseNo || null,
        title: params.subject || '法律服务合同',
        type: params.contract?.type || 'entrust',
        client_name: clientName,
        client_phone: clientPhone,
        amount: params.contract?.amount ?? 0,
        start_date: params.contract?.start_date ? new Date(params.contract.start_date) : undefined,
        end_date: params.contract?.end_date ? new Date(params.contract.end_date) : undefined,
        stage: 'signing',
        status: 'active',
        remarks: params.contract?.remarks || null,
        fee_type: params.contract?.fee_type || supplement.fee_type || null,
        payment_method: params.contract?.payment_method || supplement.payment_method || null,
        related_lead_id: undefined,
        client_id: client.id,
        lead_lawyer_id: supplement.assignee_lawyer_id || null,
        template_id: params.signTemplateLocalId || null,
        case_supplement: JSON.stringify(supplement),
        organization_id: orgId,
      } as Partial<Contract>),
    );

    // 2. 创建签约合规记录（无案件，case_id 空串；client_id 关联客户档案）
    const signing: SigningCompliance = await this.signingComplianceRepository.save(
      this.signingComplianceRepository.create({
        case_id: '',
        client_id: client.id,
        lead_id: '',
        contract_id: contract.id,
        lawyer_id: params.lawyerId,
        organization_id: orgId,
        contract_template_id: params.signTemplateId,
        subject_type: params.subjectType,
        status: SigningStatus.PENDING,
        verify_status: 'none',
        id_card_no: params.client?.idCardNo || client.id_card_no || null,
        corp_name: params.corp?.corpName || null,
        corp_ident_no: params.corp?.corpIdentNo || null,
        legal_rep_name: params.corp?.legalRepName || null,
        contract_content: params.subject,
        prefill_values: params.fillValues && params.fillValues.length > 0 ? JSON.stringify(params.fillValues) : null,
      } as Partial<SigningCompliance>),
    );

    try {
      // 3. 基于签署模板发起法大大签署任务
      // clientUserId 统一用本地客户档案 ID（params.clientId）：与 C 端实名注册、
      // 法大大侧 accountName↔clientUserId 绑定保持一致，避免「非同一用户」校验报错
      const res = await this.createSignTaskFromTemplate({
        signingId: signing.id,
        subject: params.subject,
        signTemplateId: params.signTemplateId,
        subjectType: params.subjectType,
        client: params.client ? { ...params.client, clientUserId: params.clientId } : undefined,
        corp: params.corp,
        lawyer: params.lawyer,
        fillValues: params.fillValues,
        audioVideoInfos: params.audioVideoInfos,
      });
      signing.fadada_sign_task_id = res.signTaskId;
      signing.fadada_actor_id = res.actorId;
      signing.sign_url = (res as any).embedUrl || res.signUrl;
      await this.signingComplianceRepository.save(signing);
      return {
        contractId: contract.id,
        contractNo: contract.contract_no,
        caseNo: contract.case_no || '',
        signingId: signing.id,
        signTaskId: res.signTaskId,
        actorId: res.actorId,
        signUrl: (res as any).embedUrl || res.signUrl,
        mode: res.mode,
      };
    } catch (e) {
      // 发起失败：清理合同与签约记录，避免脏数据
      await this.signingComplianceRepository.remove(signing).catch(() => undefined);
      await this.contractRepository.remove(contract).catch(() => undefined);
      throw e;
    }
  }

  /**
   * 签约完成自动生成案件：合同字段 + 发合同时批量补充的信息 填入案件管理。
   * 映射关系（合同 → 案件）：
   *   client_name/client_phone → client_name/client_phone
   *   amount → fee_amount/service_fee/amount
   *   sign_date → filing_date（签约即收案）
   *   lead_lawyer_id → assignee_lawyer_id
   *   case_supplement（案由/案件大类/案件名称/对方当事人/收费方式/案件描述…）→ 对应案件字段
   * 同时回写：contract.case_id、case.contract_id、线索转化状态、案件状态取组织默认状态。
   */
  async generateCaseFromContract(contractId: string): Promise<Case | null> {
    const contract = await this.contractRepository.findOne({ where: { id: contractId } });
    if (!contract) {
      this.logger.warn(`生成案件失败：合同 ${contractId} 不存在`);
      return null;
    }
    if (contract.case_id) {
      // 已生成过案件，幂等返回
      const existed = await this.caseRepository.findOne({ where: { id: contract.case_id } });
      if (existed) return existed;
    }

    let supplement: any = {};
    try {
      supplement = contract.case_supplement ? JSON.parse(contract.case_supplement) : {};
    } catch (e) {
      supplement = {};
    }
    const lead = contract.related_lead_id
      ? await this.leadRepository.findOne({ where: { id: contract.related_lead_id } })
      : null;

    // 客户档案：按手机号查找，无则自动建档（保证 C 端可见案件）
    let clientId: string | null = null;
    const phone = contract.client_phone || lead?.phone || '';
    if (phone) {
      let profile = await this.clientProfileRepository.findOne({ where: { phone } });
      if (!profile) {
        const created = this.clientProfileRepository.create({
          name: contract.client_name || lead?.contact_name || `客户${phone.slice(-4)}`,
          phone,
          type: 'individual',
          source: '合同签约',
          contact_name: contract.client_name || lead?.contact_name || phone,
          organization_id: contract.organization_id,
        } as Partial<ClientProfile>);
        profile = await this.clientProfileRepository.save(created);
      }
      clientId = profile.id;
    }

    // 案件编号：优先沿用发合同时预生成的编号（保证签约前后案件号一致）；
    // 历史合同无预生成编号时，按组织编号规则生成，回退 AJ- 随机
    let caseNo: string | null = contract.case_no || null;
    if (!caseNo) {
      try {
        const bizType = NumberRuleService.mapCategoryToBizType(supplement.case_category || 'civil');
        if (bizType) {
          caseNo = await this.numberRuleService.generateNumber(contract.organization_id, {
            numberType: NumberType.CASE,
            bizType,
          });
        }
      } catch (e) {
        this.logger.warn(`生成案件编号失败，回退随机编号：${(e as Error)?.message || e}`);
      }
    }

    const statusConfigRepo = this.caseStatusConfigRepository;
    let statusCode = 'pending_assign';
    try {
      const defaults = await statusConfigRepo.find({
        where: { organization_id: contract.organization_id, enabled: true },
        order: { is_default: 'DESC', sort_order: 'ASC' },
      });
      if (defaults.length) statusCode = (defaults.find((d: any) => d.is_default) || defaults[0]).code;
    } catch (e) {
      this.logger.warn(`读取组织默认案件状态失败，使用 pending_assign：${(e as Error)?.message || e}`);
    }

    const now = new Date();
    const caseEntity = this.caseRepository.create({
      case_type: supplement.case_type || lead?.case_type || 'other',
      case_category: supplement.case_category || 'civil',
      case_name: supplement.case_name || contract.title,
      client_name: contract.client_name,
      client_phone: contract.client_phone || lead?.phone,
      client_id: clientId || undefined,
      client_type: contract.client_name === supplement.opposing_party ? 'enterprise' : 'individual',
      opposing_party: supplement.opposing_party || null,
      contact_address: supplement.contact_address || lead?.contact_address || null,
      court: supplement.court || null,
      amount: Number(contract.amount) || undefined,
      fee_amount: supplement.fee_amount != null ? Number(supplement.fee_amount) : Number(contract.amount) || undefined,
      service_fee: supplement.fee_amount != null ? Number(supplement.fee_amount) : Number(contract.amount) || undefined,
      fee_type: supplement.fee_type || contract.fee_type || null,
      payment_method: supplement.payment_method || contract.payment_method || null,
      description: supplement.description || lead?.case_description || lead?.business_summary || null,
      assignee_lawyer_id: supplement.assignee_lawyer_id || contract.lead_lawyer_id || null,
      assistant_lawyer_ids: Array.isArray(supplement.assistant_lawyer_ids) && supplement.assistant_lawyer_ids.length
        ? JSON.stringify(supplement.assistant_lawyer_ids) : null,
      case_source: '合同签约',
      source_detail: lead ? `线索-${lead.source_channel || ''}` : null,
      referrer: lead?.referrer || null,
      status: statusCode as any,
      stage: 'intake',
      filing_date: contract.sign_date || now,
      case_no: caseNo || this.fallbackCaseNo(),
      contract_id: contract.id,
      related_lead_id: contract.related_lead_id || null,
      organization_id: contract.organization_id,
    } as Partial<Case>);
    // 案件与应收放进同一数据库事务，保证原子性：要么「案件 + 应收」都写入、要么都回滚，
    // 彻底消除原先各自独立 save 导致的「有案无应收」半成功状态。
    const savedCase = await this.caseRepository.manager.transaction(async (manager) => {
      const c = await manager.save(caseEntity);
      const feeAmount = Number(c.fee_amount || 0);
      await manager.save(
        manager.create(Receivable, {
          case_id: c.id,
          organization_id: c.organization_id,
          contract_amount: feeAmount,
          received_amount: 0,
          pending_amount: feeAmount,
          status: ReceivableStatus.PENDING,
        }),
      );
      return c;
    });

    // ===== 发合同建案路径补齐（设计缺口 G2/G3）=====
    // 1) 利益冲突检索：签约建案即做校验。命中冲突【或】查询异常，均将案件挂起待合规复核，
    //    不再静默放行（利冲是合规红线，失败必须可见、可补检）。
    try {
      const conflictResult = await this.conflictCheckService.check({
        partyName: savedCase.client_name || '',
        opposingParty: savedCase.opposing_party || '',
        partyPhone: savedCase.client_phone || undefined,
        orgId: savedCase.organization_id,
        caseId: savedCase.id,
        checkerId: savedCase.assignee_lawyer_id || undefined,
      });
      if (conflictResult.check_result === 'conflict') {
        await this.caseRepository.update(savedCase.id, { approval_status: 'conflict_hold' } as any);
      }
    } catch (conflictErr) {
      // 利冲查询异常：仍挂起案件待人工复核，并强告警（不再静默吞掉导致漏检）
      await this.caseRepository
        .update(savedCase.id, { approval_status: 'conflict_hold' } as any)
        .catch(() => undefined);
      this.logger.error(`签约建案利冲检索失败，案件已挂起待复核 caseId=${savedCase.id}`, conflictErr);
    }

    // 2) 分润：签约时案件未结案、应收未完成，checkAndTriggerCommission 必然 skipped（属无效死代码）。
    //    分润统一由「结案 / 全款到账」触发（见 case.service:766/989、finance.service:202），此处移除无效调用。

    // 回写合同：已签 + 关联案件
    await this.contractRepository.update(contract.id, {
      stage: 'signed',
      case_id: savedCase.id,
      sign_date: contract.sign_date || now,
    });

    // 回写线索：转化完成
    if (lead) {
      await this.leadRepository.update(lead.id, {
        case_id: savedCase.id,
        conversion_status: 'converted',
        conversion_time: now,
        contact_result: 'converted',
      } as any);
    }
    this.logger.log(`合同签约完成自动生成案件：合同 ${contract.contract_no} → 案件 ${savedCase.case_no}`);
    return savedCase;
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
          // 兼容两种 clientUserId 口径：直接匹配本地 client_id（旧口径），或
          // 「CLT_手机号」（新统一口径）→ 通过手机号反查客户档案得到本地 client_id
          let localClientId: string | null = clientUserId;
          if (clientUserId.startsWith('CLT_')) {
            const phone = clientUserId.slice(4);
            const profile = await this.clientProfileRepository.findOne({ where: { phone } });
            localClientId = profile?.id || null;
          }
          const target = localClientId
            ? await this.signingComplianceRepository.findOne({
                where: { client_id: localClientId, verify_status: 'pending' },
                order: { created_at: 'DESC' },
              })
            : null;
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
              // 兜底：无论是否走过标准两步流程，签署任务完成时同步将实名状态置为 verified，
              // 保证看板/状态查询口径准确（已实名的 actor 会先收 user-* 回调，这里仅用于防御性兜底）。
              if (target.verify_status !== 'verified') {
                target.verify_status = 'verified';
                if (!target.verify_time) target.verify_time = new Date();
              }
            } else if (eventId === 'sign-task-signed') {
              if (target.status !== SigningStatus.SIGNED) target.status = SigningStatus.REVIEWING;
            } else {
              target.status = SigningStatus.REJECTED;
            }
            await this.signingComplianceRepository.save(target);
            this.logger.log(`签署状态回调已更新签约记录 ${target.id}: status=${target.status}`);
            // 新流程：发合同（线索驱动，无案件）签约完成 → 自动生成案件（合同字段+补充信息填入案件管理）
            if (
              target.status === SigningStatus.SIGNED &&
              !target.case_id &&
              target.contract_id
            ) {
              try {
                const newCase = await this.generateCaseFromContract(target.contract_id);
                if (newCase) {
                  target.case_id = newCase.id;
                  await this.signingComplianceRepository.save(target);
                }
              } catch (genErr) {
                // 建案失败不再静默：标记合同 stage=case_failed，后台合同列表可见并可重跑生成案件，
                // 避免「有签约、无案件」隐形失败。
                await this.contractRepository
                  .update(target.contract_id, { stage: 'case_failed' } as any)
                  .catch(() => undefined);
                this.logger.error(
                  `签约完成自动生成案件失败 contractId=${target.contract_id}: ${(genErr as Error)?.message || genErr}`,
                  (genErr as Error)?.stack,
                );
              }
            }
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
