import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, BadRequestException, Res } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import { ClientService } from './client.service';
import { ComplaintType, UserRole } from '../types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { PaymentStatus, PaymentMethod } from '../finance/payment-record.entity';

@Controller('client')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.CLIENT, UserRole.LAWYER, UserRole.ASSISTANT)
export class ClientController {
  constructor(private clientService: ClientService) {}

  @Post('cases')
  getClientCases(@Body() body: { client_id: string }) {
    return this.clientService.getClientCases(body.client_id);
  }

  @Post('cases/:id')
  getCaseDetail(@Param('id') id: string, @Body() body: { client_id: string }) {
    return this.clientService.getCaseDetail(id, body.client_id);
  }

  @Post('cases/:id/documents')
  uploadDocument(
    @Param('id') id: string,
    @Body() body: { client_id: string; name: string; file_path: string; file_type?: string },
  ) {
    return this.clientService.uploadDocument(id, body.client_id, body);
  }

  @Post('cases/:id/documents/list')
  getCaseDocuments(@Param('id') id: string, @Body() body: { client_id: string }) {
    return this.clientService.getCaseDocuments(id, body.client_id);
  }

  // C端下载案件文书（客户本人上传或 B 端勾选「展示给客户」的本地存储文件）
  @Post('cases/:id/documents/:docId/download')
  async downloadCaseDocument(
    @Param('id') id: string,
    @Param('docId') docId: string,
    @Body() body: { client_id: string },
    @Res() res: Response,
  ) {
    const fileInfo = await this.clientService.getCaseDocumentForDownload(id, docId, body.client_id);
    res.setHeader('Content-Type', fileInfo.mime);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileInfo.name)}"`);
    const fileStream = fs.createReadStream(fileInfo.path);
    fileStream.pipe(res);
  }

  @Post('ai/consult')
  aiConsult(@Body() body: { question: string }) {
    return this.clientService.aiConsult(body.question);
  }

  @Post('complaint')
  createComplaint(@Body() body: {
    type: ComplaintType;
    content: string;
    client_id: string;
    client_name: string;
    client_phone: string;
    organization_id: string;
    case_id?: string;
    evidence_files?: string;
  }) {
    return this.clientService.createComplaint(body);
  }

  @Post('complaints')
  getClientComplaints(@Body() body: { client_id: string }) {
    return this.clientService.getClientComplaints(body.client_id);
  }

  @Post('payments')
  getClientPayments(@Body() body: { client_id: string }) {
    return this.clientService.getClientPayments(body.client_id);
  }

  @Post('service-fee')
  getClientServiceFee(@Body() body: { client_id: string }) {
    return this.clientService.getClientServiceFee(body.client_id);
  }

  // ==================== 模块7.2 案件进度主动推送 ====================

  // 查询案件推送记录（C端 POST）
  @Post('cases/:id/push-notifications')
  getPushNotificationsByCase(
    @Param('id') id: string,
    @Body() body: { client_id: string },
  ) {
    return this.clientService.getPushNotificationsByCase(id, body.client_id);
  }

  // 查询客户全部推送记录（C端 POST）
  @Post('push-notifications')
  getPushNotificationsByClient(@Body() body: { client_id: string }) {
    return this.clientService.getPushNotificationsByClient(body.client_id);
  }

  // ==================== 模块7.3 AI客户智能答疑增强 ====================

  // 增强咨询接口（C端 POST）
  @Post('ai/consult-enhanced')
  aiConsultEnhanced(@Body() body: {
    client_id: string;
    question: string;
    case_id?: string;
    organization_id?: string;
  }) {
    return this.clientService.aiConsultEnhanced(body);
  }

  // 查询客户咨询记录（C端 POST）
  @Post('consultations')
  getConsultations(@Body() body: { client_id: string }) {
    return this.clientService.getConsultationsByClient(body.client_id);
  }

  // ==================== 模块7.4 线上服务大厅 ====================

  // 线上签约（C端 POST）
  // @deprecated 旧「先实名后签署」流程。现行为免验证签整合模式：发起签约即返回签署链接，
  // 客户在法大大签署页通过互动视频签一并完成实名与意愿确认。前端已无调用方，请勿在新代码中使用。
  @Post('online-sign')
  onlineSign(@Body() body: {
    case_id: string;
    client_id: string;
    lawyer_id: string;
    contract_template_id: string;
    organization_id: string;
    id_card_no?: string;
    // 企业签约：主体类型 person/corp + 企业信息（corp 时）
    subject_type?: string;
    corp_name?: string;
    corp_ident_no?: string;
    legal_rep_name?: string;
  }) {
    return this.clientService.onlineSign(body);
  }

  // 法大大电子签配置（C端 POST，不含密钥）
  @Post('sign/config')
  getSignConfig() {
    return this.clientService.getSignConfig();
  }

  // 获取法大大「个人授权链接API」（法大大文档 6YHMCFJJC4/FIJYQHAS802K7UD9 推荐的两步流程第 ① 步）：
//   让 C 端客户先在个人授权链接做人脸识别 + 实名账号绑定，再调 submit-prefill 拿签署链接。
// 个人客户走个人授权链接，企业客户走企业授权链接（C 端以个人流程为主，企业签约走 B 端后台，本接口可不传企业参数）。
// @deprecated 标记移除：恢复为标准两步流程的对齐接口，前端 SignPrefill 在未实名时调用。
  @Post('sign/verify-url')
  getSignVerifyUrl(@Body() body: {
    signing_id: string;
    client_id: string;
    user_name?: string;
    id_card_no?: string;
    mobile?: string;
    // 企业实名认证信息（签约主体为企业时传入）
    corp_name?: string;
    corp_ident_no?: string;
    legal_rep_name?: string;
    // 认证完成后法大大跳转地址（供 C 端认证后回到原页面）
    redirect_url?: string;
  }) {
    return this.clientService.getSignVerifyUrl(body);
  }

  // 模拟模式：本地完成实名认证（仅 mock 模式可用）
  // @deprecated 仅 mock 模式可用；生产模式按「个人授权链接API」走法大大标准两步流程。
  @Post('sign/mock-verify')
  mockVerifySigning(@Body() body: { signing_id: string; client_id: string }) {
    return this.clientService.mockVerifySigning(body);
  }

  // 创建法大大签署任务并返回客户签署链接
  // @deprecated 旧「先实名后签署」链路专用（强制 verify_status=verified，与现行整合模式矛盾）。
  // 现行流程：发起签约即创建签署任务。前端已无调用方，请勿在新代码中使用。
  @Post('sign/flow')
  createSignFlow(@Body() body: { signing_id: string; client_id: string }) {
    return this.clientService.createSignFlow(body);
  }

  // 模拟模式：本地完成签署（仅 mock 模式可用）
  @Post('sign/mock-finish')
  mockFinishSigning(@Body() body: { signing_id: string; client_id: string }) {
    return this.clientService.mockFinishSigning(body);
  }

  // 查询签约状态（前端轮询用）
  @Post('sign/status')
  getSignStatus(@Body() body: { signing_id: string; client_id: string }) {
    return this.clientService.getSignStatus(body);
  }

  // 获取签署音视频下载链接（互动视频签录制，签署完成后 5 分钟左右可获取）
  @Post('sign/audio-video')
  getSignAudioVideo(@Body() body: { signing_id: string; client_id: string }) {
    return this.clientService.getSignAudioVideo(body);
  }

  // ==================== 模板签约 C 端预填流程 ====================
  // C端查询案件下待签约/待预填的签约记录（进入现有 C 端流程补充信息并签约）
  @Post('cases/:id/signings')
  getActiveSignings(
    @Param('id') id: string,
    @Body() body: { client_id: string },
  ) {
    return this.clientService.getActiveSignings({ client_id: body.client_id, case_id: id });
  }

  // C端查询案件下已签署的签约记录（供案件详情展示签署音视频入口）
  @Post('cases/:id/signed-signings')
  getSignedSignings(
    @Param('id') id: string,
    @Body() body: { client_id: string },
  ) {
    return this.clientService.getSignedSignings({ client_id: body.client_id, case_id: id });
  }

  // C端获取待签约任务中客户需要补充填写的字段（用于复用 C 端页面做预填）
  @Post('sign/prefill')
  getSignPrefillFields(@Body() body: { signing_id: string; client_id: string }) {
    return this.clientService.getSignPrefillFields(body);
  }

  // C端预填字段后获取合同预览链接（不提交任务，预览确认后再签约）
  @Post('sign/preview')
  getSignPreview(@Body() body: {
    signing_id: string;
    client_id: string;
    values: Array<{ field_doc_id?: string; field_id?: string; field_name?: string; field_value: string }>;
  }) {
    return this.clientService.getSignPreview(body);
  }

  // C端提交预填字段并调用法大大签约流程（填充→提交→定稿→返回签署链接）
  @Post('sign/submit-prefill')
  async submitSignPrefillAndSign(@Body() body: {
    signing_id: string;
    client_id: string;
    values: Array<{ field_doc_id?: string; field_id?: string; field_name?: string; field_value: string }>;
  }) {
    try {
      return await this.clientService.submitSignPrefillAndSign(body);
    } catch (e) {
      // 透出法大大业务错误（如必填控件未填写），避免被包装成无意义的 Internal server error
      throw new BadRequestException((e as Error)?.message || '签约失败，请稍后重试');
    }
  }

  // 下载电子发票（C端 POST）
  @Post('payments/:id/invoice')
  downloadInvoice(
    @Param('id') id: string,
    @Body() body: { client_id: string },
  ) {
    return this.clientService.downloadInvoice(id, body.client_id);
  }

  // 上传证据材料（C端 POST）
  @Post('cases/:id/evidence')
  uploadEvidence(
    @Param('id') id: string,
    @Body() body: {
      client_id: string;
      name: string;
      file_path: string;
      file_size?: number;
      mime_type?: string;
      description?: string;
    },
  ) {
    return this.clientService.uploadEvidence(id, body.client_id, body);
  }

  // ==================== 模块7.5 服务评价与口碑沉淀 ====================

  // 客户提交评价（C端 POST）
  @Post('service-ratings')
  createServiceRating(@Body() body: {
    case_id: string;
    client_id: string;
    rating: number;
    content?: string;
    organization_id?: string;
  }) {
    return this.clientService.createServiceRating(body);
  }

  // 客户查询自己的评价（C端 POST）
  @Post('service-ratings/list')
  getServiceRatingsByClient(@Body() body: { client_id: string }) {
    return this.clientService.getServiceRatingsByClient(body.client_id);
  }

  // 管理端查询评价列表（管理端 GET）
  @Get('service-ratings/admin')
  getServiceRatingsByOrg(
    @Query('org_id') orgId: string,
    @Query('status') status?: string,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.clientService.getServiceRatingsByOrg(finalOrgId, { status });
  }

  // 审核评价（管理端 PUT）
  @Put('service-ratings/:id/review')
  reviewServiceRating(
    @Param('id') id: string,
    @Body() body: { status: string; reviewer_id: string },
  ) {
    return this.clientService.reviewServiceRating(id, body.status, body.reviewer_id);
  }

  // 沉淀好评至素材库（管理端 POST）
  @Post('service-ratings/:id/convert')
  convertRatingToMaterial(@Param('id') id: string) {
    return this.clientService.convertRatingToMaterial(id);
  }

  // ==================== 模块7.6 客户云归档管理 ====================

  // 上传归档（C端 POST）
  @Post('archives')
  uploadArchive(@Body() body: {
    client_id: string;
    case_id?: string;
    file_name: string;
    file_type: string;
    file_size?: number;
    file_url?: string;
    description?: string;
    organization_id?: string;
  }) {
    return this.clientService.uploadArchive(body.client_id, body);
  }

  // 获取归档列表（C端 POST）
  @Post('archives/list')
  getClientArchives(@Body() body: { client_id: string; case_id?: string; file_type?: string }) {
    return this.clientService.getClientArchives(body.client_id, {
      case_id: body.case_id,
      file_type: body.file_type,
    });
  }

  // 按案件查询归档（C端 POST）
  @Post('archives/:caseId')
  getArchiveByCase(
    @Param('caseId') caseId: string,
    @Body() body: { client_id: string },
  ) {
    return this.clientService.getArchiveByCase(caseId, body.client_id);
  }

  // 删除归档（C端 DELETE）
  @Delete('archives/:id')
  deleteArchive(
    @Param('id') id: string,
    @Body() body: { client_id: string },
  ) {
    return this.clientService.deleteArchive(id, body.client_id);
  }

  // 管理员 - 获取所有归档列表
  @Post('admin/archives/list')
  listAllArchives(@Body() body: { keyword?: string; file_type?: string; page?: number; page_size?: number }) {
    return this.clientService.listAllArchives(body);
  }

  // 管理员 - 删除任意归档
  @Delete('admin/archives/:id')
  adminDeleteArchive(@Param('id') id: string) {
    return this.clientService.adminDeleteArchive(id);
  }
}
