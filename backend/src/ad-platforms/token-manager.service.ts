import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdPlatformToken } from './ad-platform-token.entity';
import { PlatformTokenData } from './interfaces/platform-client.interface';

/**
 * 广告平台 Token 管理服务
 * 负责 Token 的存储、读取、过期检测和自动刷新
 */
@Injectable()
export class TokenManagerService {
  private readonly logger = new Logger(TokenManagerService.name);

  constructor(
    @InjectRepository(AdPlatformToken)
    private tokenRepository: Repository<AdPlatformToken>,
  ) {}

  /**
   * 保存或更新 Token
   */
  async saveToken(orgId: string, platform: string, tokenData: PlatformTokenData): Promise<AdPlatformToken> {
    // 查找是否已存在该平台该账户的 Token
    const existing = await this.tokenRepository.findOne({
      where: {
        organization_id: orgId,
        platform,
        account_id: tokenData.account_id || '',
      },
    });

    if (existing) {
      // 更新已有 Token
      await this.tokenRepository.update(existing.id, {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: tokenData.expires_at,
        refresh_expires_at: tokenData.refresh_expires_at,
        token_status: 'active',
      });
      return this.tokenRepository.findOne({ where: { id: existing.id } });
    }

    // 创建新 Token 记录
    const token = this.tokenRepository.create({
      organization_id: orgId,
      platform,
      account_id: tokenData.account_id || '',
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: tokenData.expires_at,
      refresh_expires_at: tokenData.refresh_expires_at,
      token_status: 'active',
    });
    return this.tokenRepository.save(token);
  }

  /**
   * 获取指定平台的有效 Token
   */
  async getValidToken(orgId: string, platform: string, accountId?: string): Promise<AdPlatformToken> {
    const where: any = { organization_id: orgId, platform, token_status: 'active' };
    if (accountId) {
      where.account_id = accountId;
    }
    const token = await this.tokenRepository.findOne({ where, order: { updated_at: 'DESC' } });
    if (!token) {
      throw new NotFoundException(`平台 ${platform} 未找到有效的授权 Token`);
    }
    return token;
  }

  /**
   * 获取指定平台全部 Token
   */
  async getAllTokens(orgId: string, platform?: string): Promise<AdPlatformToken[]> {
    const where: any = { organization_id: orgId, token_status: 'active' };
    if (platform) {
      where.platform = platform;
    }
    return this.tokenRepository.find({ where, order: { updated_at: 'DESC' } });
  }

  /**
   * 检查 Token 是否即将过期（1小时内）
   */
  isTokenExpiringSoon(token: AdPlatformToken): boolean {
    if (!token.expires_at) return false;
    const expireTime = new Date(token.expires_at).getTime();
    const now = Date.now();
    return expireTime - now < 3600000;
  }

  /**
   * 检查 refresh_token 是否已过期
   */
  isRefreshTokenExpired(token: AdPlatformToken): boolean {
    if (!token.refresh_expires_at) return false;
    return new Date(token.refresh_expires_at).getTime() < Date.now();
  }

  /**
   * 标记 Token 失效
   */
  async invalidateToken(tokenId: string): Promise<void> {
    await this.tokenRepository.update(tokenId, { token_status: 'expired' });
  }

  /**
   * 删除 Token
   */
  async deleteToken(tokenId: string): Promise<void> {
    await this.tokenRepository.delete(tokenId);
  }

  /**
   * 查找所有即将过期的 Token（用于定时刷新）
   */
  async findExpiringTokens(): Promise<AdPlatformToken[]> {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 3600000);
    return this.tokenRepository
      .createQueryBuilder('t')
      .where('t.token_status = :status', { status: 'active' })
      .andWhere('t.expires_at IS NOT NULL')
      .andWhere('t.expires_at <= :oneHourLater', { oneHourLater })
      .getMany();
  }
}
