import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ClientService } from './client.service';
import { ComplaintType } from '../types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaymentStatus, PaymentMethod } from '../finance/payment-record.entity';

@Controller('client')
@UseGuards(JwtAuthGuard)
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
  @Post('online-sign')
  onlineSign(@Body() body: {
    case_id: string;
    client_id: string;
    lawyer_id: string;
    contract_template_id: string;
    organization_id: string;
  }) {
    return this.clientService.onlineSign(body);
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
}
