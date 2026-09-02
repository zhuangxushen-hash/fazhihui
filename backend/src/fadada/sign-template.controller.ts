import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { FadadaService } from './fadada.service';
import { SignTemplateService } from './sign-template.service';
import { SignTemplateFieldService } from './sign-template-field.service';
import { SignTemplateField } from './sign-template-field.entity';
import { SignTemplate } from './sign-template.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

/**
 * 法大大签署模板维护与案件发起签约控制器（B端）
 * - 签署模板信息维护：增删改查法大大 sign-template
 * - 案件详情发起签约：选择签署模板 + 签署主体，创建签约并通过模板发起签署
 * 权限：仅管理员（super_admin, org_admin）可维护模板与发起签约。
 */
@Controller('sign-template')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
export class SignTemplateController {
  constructor(
    private readonly signTemplateService: SignTemplateService,
    private readonly fadadaService: FadadaService,
    private readonly signTemplateFieldService: SignTemplateFieldService,
  ) {}

  // 是否为超级管理员（超管可跨组织管理全部签约模板）
  private isSuper(user: any): boolean {
    return user?.role === UserRole.SUPER_ADMIN;
  }

  // 当前用户归属的组织（B端用户无 organization_id 时回退到用户本身 id）
  private ownOrg(user: any): string {
    return user?.organization_id || user.id;
  }

  // 按组织隔离读取模板：非超管只能访问自己组织的模板（无归属的全局模板不可访问）
  private async resolveTemplate(id: string, user: any): Promise<SignTemplate> {
    const tmpl = await this.signTemplateService.getById(id);
    if (!this.isSuper(user) && tmpl.organization_id !== this.ownOrg(user)) {
      throw new ForbiddenException('无权访问该签约模板（按组织隔离，仅本组织模板可用）');
    }
    return tmpl;
  }

  // 签署模板列表（按组织数据隔离 + 可启用/启用中筛选）
  @Get()
  async list(
    @Query() query: { enabled?: string; organization_id?: string },
    @Request() req: any,
  ) {
    // 数据隔离：超管可见全部（可按 organization_id 过滤）；组织管理员只能看到本组织的模板
    let orgId: string | undefined;
    if (this.isSuper(req.user)) {
      orgId = query.organization_id || undefined;
    } else {
      orgId = this.ownOrg(req.user);
    }
    return this.signTemplateService.list({
      organizationId: orgId,
      enabled: query.enabled === undefined ? undefined : query.enabled === 'true',
    });
  }

  // 签署模板详情（按组织隔离）
  @Get(':id')
  async getById(@Param('id') id: string, @Request() req: any) {
    return this.resolveTemplate(id, req.user);
  }

  // 新增/更新签署模板（sign_template_id 重复时更新；归属当前用户所属组织，超管可指定组织）
  @Post()
  async create(
    @Body() dto: { sign_template_id: string; name: string; description?: string; owner_id?: string; enabled?: boolean; organization_id?: string },
    @Request() req: any,
  ) {
    // 数据隔离：组织管理员新增的模板归属自己的组织（忽略传入）；超管可指定组织或建全局模板
    const orgId = this.isSuper(req.user) ? (dto.organization_id || null) : this.ownOrg(req.user);
    return this.signTemplateService.upsert({
      ...dto,
      organization_id: orgId,
    });
  }

  // 更新签署模板信息（按组织隔离）
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: { name?: string; description?: string; owner_id?: string; enabled?: boolean; audio_video_infos?: string },
    @Request() req: any,
  ) {
    await this.resolveTemplate(id, req.user);
    return this.signTemplateService.update(id, dto);
  }

  // 删除签署模板（按组织隔离）
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.resolveTemplate(id, req.user);
    await this.signTemplateService.remove(id);
    return { success: true };
  }

  // 案件详情「发起签约」：基于签署模板创建签署任务，返回客户 C 端签署链接（按组织隔离）
  @Post(':id/launch')
  async launch(
    @Param('id') id: string,
    @Body() dto: {
      case_id: string;
      client_id: string;
      lawyer_id?: string;
      subject: string;
      subject_type?: 'person' | 'corp';
      // 个人客户信息（subject_type=person）
      client?: { clientUserId: string; userName: string; idCardNo?: string; mobile?: string };
      // 企业客户信息（subject_type=corp）
      corp?: { corpName: string; corpIdentNo: string; legalRepName?: string };
      // 律师作为签约方之一
      lawyer?: { lawyerUserId: string; name: string; mobile?: string };
      // 预填字段值（固定值 + 业务员预填），在定稿前写入法大大签署任务
      fillValues?: Array<{ docId?: string | number; fieldId?: string; fieldName?: string; fieldValue: string }>;
    },
    @Request() req: any,
  ) {
    const tmpl = await this.resolveTemplate(id, req.user);
    // 读取模板上配置的互动视频签播报内容（JSON 字符串 → 数组），未配置时后端回退默认播报内容
    // 仅保留播报内容与客户朗读回答两个配置项，剥离 skipVerification，避免旧数据跳过回答验证
    let audioVideoInfos: Array<{ audioText: string; answerText?: string }> | undefined;
    if (tmpl.audio_video_infos) {
      try {
        audioVideoInfos = (JSON.parse(tmpl.audio_video_infos) as Array<{ audioText?: string; answerText?: string }>)
          .filter((i) => i && (i.audioText || '').trim())
          .map((i) => ({
            audioText: i.audioText as string,
            answerText: i.answerText || undefined,
          }));
        if (audioVideoInfos.length === 0) audioVideoInfos = undefined;
      } catch {
        audioVideoInfos = undefined;
      }
    }
    return this.fadadaService.launchSignFromTemplate({
      caseId: dto.case_id,
      clientId: dto.client_id,
      lawyerId: dto.lawyer_id || req.user.id,
      organizationId: req.user.organization_id || req.user.id,
      subject: dto.subject || tmpl.name,
      signTemplateId: tmpl.sign_template_id,
      subjectType: dto.subject_type || 'person',
      client: dto.client,
      corp: dto.corp,
      lawyer: dto.lawyer,
      fillValues: dto.fillValues,
      audioVideoInfos,
    });
  }

  /**
   * 新流程「发合同(签约)」：从线索发起，与案件无关。
   * 创建合同记录（stage=signing）+ 签约记录 + 法大大签署任务；
   * 签约完成后由回调自动生成案件（合同字段+补充信息填入案件管理）。
   */
  @Post(':id/launch-from-lead')
  async launchFromLead(
    @Param('id') id: string,
    @Body() dto: {
      lead_id: string;
      subject: string;
      subject_type?: 'person' | 'corp';
      // 个人客户信息（subject_type=person）
      client?: { clientUserId?: string; userName: string; idCardNo?: string; mobile?: string };
      // 企业客户信息（subject_type=corp）
      corp?: { corpName: string; corpIdentNo: string; legalRepName?: string };
      // 律师作为签约方之一
      lawyer?: { lawyerUserId: string; name: string; mobile?: string };
      // 预填字段值（固定值 + 业务员预填）
      fillValues?: Array<{ docId?: string | number; fieldId?: string; fieldName?: string; fieldValue: string }>;
      // 合同基础信息（合同上已有的字段）
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
      case_supplement?: {
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
    },
    @Request() req: any,
  ) {
    const tmpl = await this.resolveTemplate(id, req.user);
    // 互动视频签播报内容（模板级配置，未配置时后端回退默认）
    let audioVideoInfos: Array<{ audioText: string; answerText?: string }> | undefined;
    if (tmpl.audio_video_infos) {
      try {
        audioVideoInfos = (JSON.parse(tmpl.audio_video_infos) as Array<{ audioText?: string; answerText?: string }>)
          .filter((i) => i && (i.audioText || '').trim())
          .map((i) => ({
            audioText: i.audioText as string,
            answerText: i.answerText || undefined,
          }));
        if (audioVideoInfos.length === 0) audioVideoInfos = undefined;
      } catch {
        audioVideoInfos = undefined;
      }
    }
    return this.fadadaService.launchSignFromLead({
      leadId: dto.lead_id,
      lawyerId: req.user.id,
      organizationId: req.user.organization_id || req.user.id,
      subject: dto.subject || tmpl.name,
      signTemplateId: tmpl.sign_template_id,
      signTemplateLocalId: tmpl.id,
      subjectType: dto.subject_type || 'person',
      client: dto.client ? { ...dto.client, clientUserId: dto.client.clientUserId || dto.client.mobile || '' } : undefined,
      corp: dto.corp,
      lawyer: dto.lawyer,
      fillValues: dto.fillValues,
      audioVideoInfos,
      contract: dto.contract,
      caseSupplement: dto.case_supplement,
    });
  }

  // 同步模板字段：从法大大拉取模板填写控件，覆盖保存到本地配置表（按组织隔离）
  @Post(':id/sync-fields')
  async syncFields(@Param('id') id: string, @Request() req: any) {
    const tmpl = await this.resolveTemplate(id, req.user);
    const fields = await this.fadadaService.getTemplateFillFields(tmpl.sign_template_id);
    await this.signTemplateFieldService.replaceByTemplate(id, fields);
    return { success: true, count: fields.length };
  }

  // 查询模板字段列表（本地已同步的配置，按组织隔离）
  @Get(':id/fields')
  async getFields(@Param('id') id: string, @Request() req: any): Promise<SignTemplateField[]> {
    await this.resolveTemplate(id, req.user);
    return this.signTemplateFieldService.listByTemplate(id);
  }

  // 保存模板字段配置（填写方式/自动带出/固定值/启用，按组织隔离）
  @Post(':id/save-fields-config')
  async saveFieldsConfig(
    @Param('id') id: string,
    @Body() items: Array<{ field_id: string; fill_mode?: string; auto_source?: string; fixed_value?: string; enabled?: boolean }>,
    @Request() req: any,
  ) {
    await this.resolveTemplate(id, req.user);
    await this.signTemplateFieldService.saveConfig(id, items);
    return { success: true };
  }
}