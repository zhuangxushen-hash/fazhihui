import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Request,
  Res,
  Redirect,
  UseGuards,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { TokenManagerService } from './token-manager.service';
import { OceanEngineService } from './platforms/ocean-engine.service';
import { BaiduMarketingService } from './platforms/baidu-marketing.service';
import { TencentAdsService } from './platforms/tencent-ads.service';
import { KuaishouAdsService } from './platforms/kuaishou-ads.service';
import { DouyinOpenService } from './platforms/douyin-open.service';
import { IPlatformClient } from './interfaces/platform-client.interface';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

/**
 * 广告平台 OAuth 授权控制器
 * 负责生成授权链接、处理平台回调、管理授权 Token
 * 权限：投放岗(marketing) / 管理员(super_admin, org_admin)
 */
@Controller('ad-platforms')
export class OauthController {
  private readonly logger = new Logger(OauthController.name);

  constructor(
    private tokenManagerService: TokenManagerService,
    private oceanEngineService: OceanEngineService,
    private baiduMarketingService: BaiduMarketingService,
    private tencentAdsService: TencentAdsService,
    private kuaishouAdsService: KuaishouAdsService,
    private douyinOpenService: DouyinOpenService,
  ) {}

  /** 根据平台标识获取对应的平台客户端 */
  private getClient(platform: string): IPlatformClient {
    const map: Record<string, IPlatformClient> = {
      ocean_engine: this.oceanEngineService,
      baidu_marketing: this.baiduMarketingService,
      tencent_ads: this.tencentAdsService,
      kuaishou_ads: this.kuaishouAdsService,
      douyin_open: this.douyinOpenService,
    };
    const client = map[platform];
    if (!client) {
      throw new BadRequestException(`不支持的平台: ${platform}`);
    }
    return client;
  }

  /**
   * 生成授权链接并重定向到平台授权页
   * state 携带 organization_id，平台回调时用于归属组织
   */
  @Get('auth/:platform')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.MARKETING)
  @Redirect()
  auth(@Param('platform') platform: string, @Request() req: any) {
    const client = this.getClient(platform);
    // 将组织ID写入 state，回调时据此归属 Token
    const state = req.user.organization_id;
    const url = client.getAuthUrl(state);
    return { url, statusCode: 302 };
  }

  /**
   * OAuth 回调
   * 接收平台重定向回来的授权码 code，换取 token 后存入数据库
   * 该接口由平台通过浏览器重定向调用，无需 JWT 鉴权
   */
  @Get('callback/:platform')
  async callback(
    @Param('platform') platform: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    if (!code) {
      return this.renderResult(res, false, '未收到授权码', platform);
    }
    // state 中携带组织ID
    const orgId = state;
    if (!orgId) {
      return this.renderResult(res, false, '回调缺少组织标识(state)', platform);
    }
    try {
      const client = this.getClient(platform);
      const tokenData = await client.exchangeCodeForToken(code);
      await this.tokenManagerService.saveToken(orgId, platform, tokenData);
      this.logger.log(`组织 ${orgId} 平台 ${platform} 授权成功`);
      return this.renderResult(res, true, '授权成功', platform);
    } catch (err) {
      this.logger.error(`平台 ${platform} 授权失败: ${err?.message ?? err}`);
      return this.renderResult(res, false, `授权失败: ${err?.message ?? err}`, platform);
    }
  }

  /** 查询当前组织所有平台的授权状态 */
  @Get('tokens')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.MARKETING)
  async tokens(@Request() req: any, @Query('platform') platform?: string) {
    return this.tokenManagerService.getAllTokens(req.user.organization_id, platform);
  }

  /** 删除（取消授权）指定 Token */
  @Delete('tokens/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.MARKETING)
  async deleteToken(@Param('id') id: string) {
    await this.tokenManagerService.deleteToken(id);
    return { success: true };
  }

  /** 手动刷新指定平台的 Token */
  @Post('refresh/:platform')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.MARKETING)
  async refresh(@Param('platform') platform: string, @Request() req: any) {
    const client = this.getClient(platform);
    const token = await this.tokenManagerService.getValidToken(req.user.organization_id, platform);
    if (!token.refresh_token) {
      throw new BadRequestException(`平台 ${platform} 缺少 refresh_token，无法刷新`);
    }
    const tokenData = await client.refreshToken(token.refresh_token);
    // 刷新后保留原有 account_id，避免丢失账户归属
    tokenData.account_id = tokenData.account_id || token.account_id;
    const updated = await this.tokenManagerService.saveToken(
      req.user.organization_id,
      platform,
      tokenData,
    );
    return { success: true, token: updated };
  }

  /** 渲染回调结果页面（供浏览器查看） */
  private renderResult(res: Response, success: boolean, message: string, platform: string): Response {
    const title = success ? '授权成功' : '授权失败';
    const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>${title}</title></head><body style="font-family:sans-serif;text-align:center;padding:60px;"><h2>${title}</h2><p>平台：${platform}</p><p>${message}</p><p style="color:#888;">可以关闭此页面。</p></body></html>`;
    return res.set('Content-Type', 'text/html; charset=utf-8').send(html);
  }
}
