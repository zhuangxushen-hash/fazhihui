import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CorpAuth } from './corp-auth.entity';
import { FadadaService } from './fadada.service';

/**
 * 法大大企业授权记录业务参数（组织管理 → 认证授权）
 */
export interface CreateCorpAuthDto {
  // 平台方业务组织，可为空表示顶层平台方
  organization_id?: string;
  // 目标企业在本应用范围内的唯一标识（法大大 clientCorpId），同一企业复用
  client_corp_id: string;
  // 企业名称
  corp_name: string;
  // 企业统一社会信用代码
  corp_ident_no?: string;
  // 法定代表人姓名
  legal_rep_name?: string;
  // 经办人姓名
  agent_name?: string;
  // 经办人证件号
  agent_id_card_no?: string;
  // 经办人手机号（法大大登录账号）
  agent_mobile?: string;
  // 授权范围（签署任务需 signtask_init、印章操作需 seal_info 等）
  auth_scopes?: string[];
  // 授权完成后的跳转地址（用于回填 openCorpId）
  redirect_url?: string;
}

/** 企业授权记录查询结果（复用实体类型） */
export type CorpAuthView = CorpAuth;

/**
 * 企业授权认证服务（组织管理 → 认证授权）
 * 平台方为其他企业生成授权链接，企业完成法人/经办人认证后回填 openCorpId。
 */
@Injectable()
export class CorpAuthService {
  private readonly logger = new Logger(CorpAuthService.name);
  // 授权链接默认有效期为 3 天
  private static readonly URL_TTL_MS = 3 * 24 * 60 * 60 * 1000;

  constructor(
    @InjectRepository(CorpAuth)
    private corpAuthRepository: Repository<CorpAuth>,
    private fadadaService: FadadaService,
  ) {}

  /** 企业授权记录列表（按创建时间倒序） */
  async list(): Promise<CorpAuth[]> {
    return this.corpAuthRepository.find({ order: { created_at: 'DESC' } });
  }

  /** 按 clientCorpId 查询企业授权记录 */
  async getById(clientCorpId: string): Promise<CorpAuth> {
    const rec = await this.corpAuthRepository.findOne({ where: { client_corp_id: clientCorpId } });
    if (!rec) throw new NotFoundException('未找到该企业授权记录');
    return rec;
  }

  /**
   * 发起企业授权：生成授权链接。
   * 同一 clientCorpId 表示同一企业，重复调用即为补充授权范围（携带已有 openCorpId 重新调用）。
   */
  async create(dto: CreateCorpAuthDto): Promise<CorpAuthView> {
    // 同企业复用记录（补充授权范围），否则新建
    let rec = await this.corpAuthRepository.findOne({
      where: { client_corp_id: dto.client_corp_id },
    });
    if (!rec) {
      rec = this.corpAuthRepository.create({ client_corp_id: dto.client_corp_id });
    }
    // 更新基础信息
    rec.organization_id = dto.organization_id ?? rec.organization_id;
    rec.corp_name = dto.corp_name;
    rec.corp_ident_no = dto.corp_ident_no ?? rec.corp_ident_no;
    rec.legal_rep_name = dto.legal_rep_name ?? rec.legal_rep_name;
    rec.agent_name = dto.agent_name ?? rec.agent_name;
    rec.agent_id_card_no = dto.agent_id_card_no ?? rec.agent_id_card_no;
    rec.agent_mobile = dto.agent_mobile ?? rec.agent_mobile;
    // 合并授权范围（去重）
    const scopes = dto.auth_scopes && dto.auth_scopes.length ? dto.auth_scopes : [];
    const existing = (rec.auth_scopes ? rec.auth_scopes.split(',') : []).filter(Boolean);
    rec.auth_scopes = Array.from(new Set([...existing, ...scopes])).join(',');
    // 重新进入待授权状态（链接一旦生成即过期为 3 天）
    rec.auth_status = 'authing';
    rec.auth_result = null;

    // 生成授权链接（携带既有 openCorpId 以便补充授权范围）
    let authUrl: string;
    try {
      authUrl = await this.fadadaService.createCorpAuthUrl({
        clientCorpId: rec.client_corp_id,
        corpName: rec.corp_name,
        corpIdentNo: rec.corp_ident_no,
        legalRepName: rec.legal_rep_name,
        agentName: rec.agent_name,
        agentIdCardNo: rec.agent_id_card_no,
        agentMobile: rec.agent_mobile,
        authScopes: scopes.length ? scopes : (existing.length ? existing : []),
        redirectUrl: dto.redirect_url,
      });
    } catch (e: any) {
      // 法大大已授权（业务码 210002）：无需重复生成授权链接，
      // 同步保留该企业标识并从法大大拉取授权信息回填，将本地状态更新为已授权
      if (e?.fadadaAlreadyAuthed) {
        this.logger.log(`企业已授权，无需重复生成授权链接 clientCorpId=${rec.client_corp_id}，同步更新为已授权`);
        rec.auth_status = 'authed';
        rec.auth_result = 'authorized';
        try {
          const remote = await this.fadadaService.queryCorpAuthStatus({ clientCorpId: rec.client_corp_id });
          if (remote) {
            rec.binding_status = remote.bindingStatus || rec.binding_status;
            rec.ident_status = remote.identStatus || rec.ident_status;
            rec.open_corp_id = remote.openCorpId || rec.open_corp_id;
            if (remote.authScope && remote.authScope.length) {
              rec.auth_scopes = remote.authScope.join(',');
            }
          }
        } catch (inner: any) {
          this.logger.warn(`企业已授权但回填授权信息失败 clientCorpId=${rec.client_corp_id}: ${inner?.message || inner}`);
        }
        const saved = await this.corpAuthRepository.save(rec);
        this.logger.log(`企业授权已同步为已授权 clientCorpId=${saved.client_corp_id} openCorpId=${saved.open_corp_id || ''}`);
        return saved;
      }
      throw e;
    }
    rec.auth_url = authUrl;
    rec.url_expire_at = new Date(Date.now() + CorpAuthService.URL_TTL_MS);

    const saved = await this.corpAuthRepository.save(rec);
    this.logger.log(`企业授权链接已生成 clientCorpId=${saved.client_corp_id} 有效期至 ${saved.url_expire_at}`);
    return saved;
  }

  /**
   * 查询企业授权状态：先从法大大拉取授权/认证状态，再回填本地记录。
   */
  async queryStatus(clientCorpId: string): Promise<CorpAuthView> {
    const rec = await this.getById(clientCorpId);
    const remote = await this.fadadaService.queryCorpAuthStatus({ clientCorpId: rec.client_corp_id });
    if (remote) {
      rec.binding_status = remote.bindingStatus || rec.binding_status;
      rec.ident_status = remote.identStatus || rec.ident_status;
      rec.open_corp_id = remote.openCorpId || rec.open_corp_id;
      // 法大大已授权则同步本地状态
      if (remote.bindingStatus === 'authorized') {
        rec.auth_status = 'authed';
        rec.auth_result = 'authorized';
      }
      if (remote.authScope && remote.authScope.length) {
        rec.auth_scopes = remote.authScope.join(',');
      }
      await this.corpAuthRepository.save(rec);
    }
    return rec;
  }

  /**
   * 更新企业授权记录并回填 openCorpId（重定向回填入口）。
   * 供授权完成后的重定向跳转携带参数回写本地记录。
   */
  async updateOpenCorpId(clientCorpId: string, dto: {
    open_corp_id?: string;
    auth_status?: string;
    binding_status?: string;
    ident_status?: string;
    auth_result?: string;
    auth_scopes?: string[];
  }): Promise<CorpAuth> {
    const rec = await this.getById(clientCorpId);
    if (dto.open_corp_id) rec.open_corp_id = dto.open_corp_id;
    if (dto.auth_status) rec.auth_status = dto.auth_status;
    if (dto.binding_status) rec.binding_status = dto.binding_status;
    if (dto.ident_status) rec.ident_status = dto.ident_status;
    if (dto.auth_result !== undefined) rec.auth_result = dto.auth_result;
    if (dto.auth_scopes && dto.auth_scopes.length) {
      rec.auth_scopes = Array.from(new Set(dto.auth_scopes)).join(',');
    }
    const saved = await this.corpAuthRepository.save(rec);
    this.logger.log(`企业授权记录已更新 clientCorpId=${clientCorpId} openCorpId=${saved.open_corp_id} status=${saved.auth_status}`);
    return saved;
  }
}