import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Case } from '../case/case.entity';
import { Document } from '../case/document.entity';
import { Evidence } from '../case/evidence.entity';
import { Complaint } from '../compliance/complaint.entity';
import { ComplaintTicket, TicketSourceChannel, TicketSeverity, TicketStatus } from '../compliance/complaint-ticket.entity';
import { ContractTemplate } from '../compliance/contract-template.entity';
import { SigningCompliance, SigningStatus } from '../compliance/signing-compliance.entity';
import { PaymentRecord } from '../finance/payment-record.entity';
import { Lead } from '../lead/lead.entity';
import { AdMaterial } from '../marketing/ad-material.entity';
import { User } from '../user/user.entity';
import { ComplaintType, ComplaintStatus, AdMaterialType, AdMaterialStatus, MaterialComplianceStatus, EvidenceType, EvidenceCategory } from '../types';
import { CasePushNotification } from './case-push-notification.entity';
import { ClientConsultation } from './client-consultation.entity';
import { ServiceRating } from './service-rating.entity';

// 触发转人工的复杂问题关键词
const TRANSFER_KEYWORDS = ['投诉', '转人工', '人工', '律师', '无法解决'];

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    @InjectRepository(Complaint)
    private complaintRepository: Repository<Complaint>,
    @InjectRepository(PaymentRecord)
    private paymentRecordRepository: Repository<PaymentRecord>,
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(CasePushNotification)
    private pushNotificationRepository: Repository<CasePushNotification>,
    @InjectRepository(ClientConsultation)
    private consultationRepository: Repository<ClientConsultation>,
    @InjectRepository(ServiceRating)
    private serviceRatingRepository: Repository<ServiceRating>,
    @InjectRepository(ComplaintTicket)
    private complaintTicketRepository: Repository<ComplaintTicket>,
    @InjectRepository(ContractTemplate)
    private contractTemplateRepository: Repository<ContractTemplate>,
    @InjectRepository(SigningCompliance)
    private signingComplianceRepository: Repository<SigningCompliance>,
    @InjectRepository(Evidence)
    private evidenceRepository: Repository<Evidence>,
    @InjectRepository(AdMaterial)
    private adMaterialRepository: Repository<AdMaterial>,
  ) {}

  async getClientCases(clientId: string): Promise<any[]> {
    const cases = await this.caseRepository.find({ where: { client_id: clientId }, order: { created_at: 'DESC' } });
    return Promise.all(cases.map(async (item) => {
      let lawyer_name: string | undefined;
      if (item.assignee_lawyer_id) {
        const lawyer = await this.userRepository.findOne({ where: { id: item.assignee_lawyer_id } });
        lawyer_name = lawyer?.real_name;
      }
      return { ...item, lawyer_name };
    }));
  }

  async getCaseDetail(caseId: string, clientId: string): Promise<any> {
    const caseEntity = await this.caseRepository.findOne({ where: { id: caseId } });
    if (!caseEntity || caseEntity.client_id !== clientId) {
      throw new Error('案件不存在或无权访问');
    }
    let lawyer_name: string | undefined;
    if (caseEntity.assignee_lawyer_id) {
      const lawyer = await this.userRepository.findOne({ where: { id: caseEntity.assignee_lawyer_id } });
      lawyer_name = lawyer?.real_name;
    }
    return { ...caseEntity, lawyer_name };
  }

  async uploadDocument(caseId: string, clientId: string, documentData: Partial<Document>): Promise<Document> {
    const caseEntity = await this.caseRepository.findOne({ where: { id: caseId } });
    if (!caseEntity || caseEntity.client_id !== clientId) {
      throw new Error('案件不存在或无权访问');
    }
    const document = this.documentRepository.create({ ...documentData, case_id: caseId, uploaded_by_id: clientId });
    return this.documentRepository.save(document);
  }

  async getCaseDocuments(caseId: string, clientId: string): Promise<Document[]> {
    const caseEntity = await this.caseRepository.findOne({ where: { id: caseId } });
    if (!caseEntity || caseEntity.client_id !== clientId) {
      throw new Error('案件不存在或无权访问');
    }
    return this.documentRepository.find({ where: { case_id: caseId }, order: { created_at: 'DESC' } });
  }

  async aiConsult(question: string): Promise<{ answer: string; related_laws: string[] }> {
    return {
      answer: `针对您的问题"${question}"，我们为您提供以下法律建议：\n\n1. 请先明确您遇到的具体法律问题类型\n2. 收集相关证据材料\n3. 建议咨询专业律师获取一对一服务\n\n如需进一步帮助，请联系我们的客服团队。`,
      related_laws: ['中华人民共和国民法典', '中华人民共和国民事诉讼法', '中华人民共和国律师法'],
    };
  }

  async createComplaint(complaintData: {
    type: ComplaintType;
    content: string;
    client_id: string;
    client_name: string;
    client_phone: string;
    case_id?: string;
    evidence_files?: string;
    organization_id: string;
  }): Promise<Complaint> {
    const complaint = this.complaintRepository.create({
      ...complaintData,
      status: ComplaintStatus.NEW,
    });
    return this.complaintRepository.save(complaint);
  }

  async getClientComplaints(clientId: string): Promise<Complaint[]> {
    return this.complaintRepository.find({ where: { client_id: clientId }, order: { created_at: 'DESC' } });
  }

  async getClientPayments(clientId: string): Promise<PaymentRecord[]> {
    return this.paymentRecordRepository.find({ where: { client_id: clientId }, order: { created_at: 'DESC' } });
  }

  async getClientServiceFee(clientId: string): Promise<{ service_fee: number }> {
    // 通过 clientId 查询用户获取 phone，再用 phone 查询 Lead 表获取 service_fee
    const user = await this.userRepository.findOne({ where: { id: clientId } });
    if (!user) {
      return { service_fee: 0 };
    }
    const lead = await this.leadRepository.findOne({ where: { phone: user.phone } });
    return { service_fee: lead?.service_fee ? Number(lead.service_fee) : 0 };
  }

  // ==================== 模块7.2 案件进度主动推送 ====================

  /**
   * 创建推送记录
   */
  async createPushNotification(data: Partial<CasePushNotification>): Promise<CasePushNotification> {
    const record = this.pushNotificationRepository.create({
      ...data,
      push_time: data.push_time || new Date(),
      status: data.status || 'pending',
    });
    return this.pushNotificationRepository.save(record);
  }

  /**
   * 按案件查询推送记录
   */
  async getPushNotificationsByCase(caseId: string, clientId: string): Promise<CasePushNotification[]> {
    return this.pushNotificationRepository.find({
      where: { case_id: caseId, client_id: clientId },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * 按客户查询全部推送记录
   */
  async getPushNotificationsByClient(clientId: string): Promise<CasePushNotification[]> {
    return this.pushNotificationRepository.find({
      where: { client_id: clientId },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * 案件节点变更时自动触发推送（标准化模板屏蔽敏感信息）
   */
  async triggerPushOnNodeChange(caseId: string, nodeType: string): Promise<CasePushNotification> {
    const caseEntity = await this.caseRepository.findOne({ where: { id: caseId } });
    if (!caseEntity) {
      throw new Error('案件不存在');
    }
    // 标准化模板，屏蔽对方当事人、案号等敏感信息
    const pushContent = this.buildPushContent(nodeType, caseEntity);
    const record = this.pushNotificationRepository.create({
      case_id: caseId,
      client_id: caseEntity.client_id,
      node_type: nodeType,
      push_content: pushContent,
      push_channel: 'in_app',
      push_time: new Date(),
      status: 'sent',
      organization_id: caseEntity.organization_id,
      sent_at: new Date(),
    });
    return this.pushNotificationRepository.save(record);
  }

  /**
   * 根据节点类型构建标准化推送内容（屏蔽敏感信息）
   */
  private buildPushContent(nodeType: string, caseEntity: Case): string {
    switch (nodeType) {
      case 'filing':
        return '您的案件已正式立案，案件编号：XXX，后续将有专人为您跟进，请保持通讯畅通。';
      case 'court':
        return `您的案件将于 XXX 在 ${caseEntity.court || 'XXX'} 开庭，请提前做好准备并按时到庭。`;
      case 'judgment':
        return '您的案件已出具判决结果，请登录平台查看详细内容，如有疑问请联系您的承办律师。';
      case 'closed':
        return '您的案件已结案，感谢您对我们的信任与支持，欢迎对本次服务进行评价。';
      default:
        return '您的案件进度有新更新，请登录平台查看详情。';
    }
  }

  // ==================== 模块7.3 AI客户智能答疑增强 ====================

  /**
   * 增强咨询接口：保存咨询记录，识别复杂问题自动转人工
   */
  async aiConsultEnhanced(data: {
    client_id: string;
    question: string;
    case_id?: string;
    organization_id?: string;
  }): Promise<{ consultation: ClientConsultation; answer: string; related_laws: string[]; transferred: boolean }> {
    // 调用现有 aiConsult 生成回答
    const { answer, related_laws } = await this.aiConsult(data.question);

    // 识别复杂问题关键词，判断是否需转人工
    const needTransfer = TRANSFER_KEYWORDS.some((kw) => data.question.includes(kw));

    let ticketId: string | undefined;
    if (needTransfer) {
      // 自动转人工生成工单（复用 Complaint 实体，type='consultation_transfer'）
      const ticket = await this.complaintRepository.save(
        this.complaintRepository.create({
          type: 'consultation_transfer' as ComplaintType,
          content: `客户AI咨询转人工：${data.question}`,
          client_id: data.client_id,
          client_name: '',
          client_phone: '',
          case_id: data.case_id,
          status: ComplaintStatus.NEW,
          organization_id: data.organization_id || '',
        }),
      );
      ticketId = ticket.id;
    }

    // 保存咨询记录
    const consultation = this.consultationRepository.create({
      client_id: data.client_id,
      case_id: data.case_id || null,
      question: data.question,
      ai_answer: answer,
      is_transferred_to_human: needTransfer,
      ticket_id: ticketId,
      organization_id: data.organization_id || null,
    });
    const saved = await this.consultationRepository.save(consultation);

    return {
      consultation: saved,
      answer,
      related_laws,
      transferred: needTransfer,
    };
  }

  /**
   * 查询客户咨询记录
   */
  async getConsultationsByClient(clientId: string): Promise<ClientConsultation[]> {
    return this.consultationRepository.find({
      where: { client_id: clientId },
      order: { created_at: 'DESC' },
    });
  }

  // ==================== 模块7.4 线上服务大厅 ====================

  /**
   * 线上签约：复用 ContractTemplate 生成签约记录到 SigningCompliance
   */
  async onlineSign(body: {
    case_id: string;
    client_id: string;
    lawyer_id: string;
    contract_template_id: string;
    organization_id: string;
  }): Promise<SigningCompliance> {
    // 校验合同模板存在
    const template = await this.contractTemplateRepository.findOne({ where: { id: body.contract_template_id } });
    if (!template) {
      throw new Error('合同模板不存在');
    }
    const signing = this.signingComplianceRepository.create({
      case_id: body.case_id,
      client_id: body.client_id,
      lawyer_id: body.lawyer_id,
      contract_template_id: body.contract_template_id,
      status: SigningStatus.SIGNED,
      contract_content: template.content,
      signed_time: new Date(),
      organization_id: body.organization_id,
    });
    return this.signingComplianceRepository.save(signing);
  }

  /**
   * 电子发票下载：按收款记录生成发票信息
   */
  async downloadInvoice(paymentId: string, clientId: string): Promise<any> {
    const payment = await this.paymentRecordRepository.findOne({ where: { id: paymentId, client_id: clientId } });
    if (!payment) {
      throw new Error('付款记录不存在或无权访问');
    }
    // 生成发票信息（仅返回发票数据，实际开票需对接税控系统）
    const invoiceNo = `INV${Date.now()}${Math.floor(Math.random() * 1000)}`;
    return {
      invoice_no: invoiceNo,
      payment_id: payment.id,
      case_id: payment.case_id,
      amount: Number(payment.amount),
      method: payment.method,
      payee: '法智汇律师事务所',
      invoice_type: '电子普通发票',
      issue_date: new Date().toISOString(),
      status: 'issued',
      download_url: `/api/client/invoices/${invoiceNo}/download`,
    };
  }

  /**
   * 证据材料上传：自动同步至案件 Evidence 实体
   */
  async uploadEvidence(caseId: string, clientId: string, data: {
    name: string;
    file_path: string;
    file_size?: number;
    mime_type?: string;
    description?: string;
  }): Promise<Evidence> {
    const caseEntity = await this.caseRepository.findOne({ where: { id: caseId } });
    if (!caseEntity || caseEntity.client_id !== clientId) {
      throw new Error('案件不存在或无权访问');
    }
    const evidence = this.evidenceRepository.create({
      name: data.name,
      file_path: data.file_path,
      file_size: data.file_size,
      mime_type: data.mime_type,
      description: data.description,
      type: EvidenceType.EVIDENCE,
      category: EvidenceCategory.PLAINTIFF,
      case_id: caseId,
      upload_by_id: clientId,
    });
    return this.evidenceRepository.save(evidence);
  }

  // ==================== 模块7.5 服务评价与口碑沉淀 ====================

  /**
   * 客户提交评价
   */
  async createServiceRating(data: {
    case_id: string;
    client_id: string;
    rating: number;
    content?: string;
    organization_id?: string;
  }): Promise<ServiceRating> {
    // 校验评分范围
    if (data.rating < 1 || data.rating > 5) {
      throw new Error('评分需在1-5之间');
    }
    const caseEntity = await this.caseRepository.findOne({ where: { id: data.case_id } });
    if (!caseEntity) {
      throw new Error('案件不存在');
    }
    const rating = this.serviceRatingRepository.create({
      case_id: data.case_id,
      client_id: data.client_id,
      rating: data.rating,
      content: data.content || null,
      status: 'pending',
      organization_id: data.organization_id || caseEntity.organization_id,
    });
    const saved = await this.serviceRatingRepository.save(rating);

    // 评分≤2 自动生成客诉预警
    if (data.rating <= 2) {
      await this.createLowScoreWarning(saved);
    }
    return saved;
  }

  /**
   * 客户查询自己的评价
   */
  async getServiceRatingsByClient(clientId: string): Promise<ServiceRating[]> {
    return this.serviceRatingRepository.find({
      where: { client_id: clientId },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * 管理端查询评价列表
   */
  async getServiceRatingsByOrg(orgId: string, filters?: { status?: string }): Promise<ServiceRating[]> {
    const where: any = { organization_id: orgId };
    if (filters?.status) {
      where.status = filters.status;
    }
    return this.serviceRatingRepository.find({
      where,
      order: { created_at: 'DESC' },
    });
  }

  /**
   * 审核评价（approved/rejected/converted_to_material）
   */
  async reviewServiceRating(id: string, status: string, reviewerId: string): Promise<ServiceRating> {
    const rating = await this.serviceRatingRepository.findOne({ where: { id } });
    if (!rating) {
      throw new Error('评价不存在');
    }
    rating.status = status;
    rating.reviewed_at = new Date();
    rating.reviewer_id = reviewerId;
    return this.serviceRatingRepository.save(rating);
  }

  /**
   * 好评沉淀至素材库（评分≥4可沉淀，调用 marketing 模块 AdMaterial 创建素材记录）
   */
  async convertRatingToMaterial(ratingId: string): Promise<{ rating: ServiceRating; material: AdMaterial }> {
    const rating = await this.serviceRatingRepository.findOne({ where: { id: ratingId } });
    if (!rating) {
      throw new Error('评价不存在');
    }
    if (rating.rating < 4) {
      throw new Error('仅评分≥4的好评可沉淀至素材库');
    }
    if (rating.is_converted_to_material) {
      throw new Error('该评价已沉淀为素材');
    }
    // 创建素材记录
    const material = this.adMaterialRepository.create({
      name: `客户好评-${rating.id.slice(0, 8)}`,
      type: AdMaterialType.ARTICLE,
      tags: ['客户好评', '口碑素材'],
      content_text: rating.content || `客户评分：${rating.rating}星`,
      channel: 'word_of_mouth',
      status: AdMaterialStatus.DRAFT,
      compliance_status: MaterialComplianceStatus.PENDING,
      organization_id: rating.organization_id,
      uploaded_by_id: rating.client_id,
    });
    const savedMaterial = await this.adMaterialRepository.save(material);

    // 更新评价状态
    rating.is_converted_to_material = true;
    rating.material_id = savedMaterial.id;
    rating.status = 'converted_to_material';
    const savedRating = await this.serviceRatingRepository.save(rating);

    return { rating: savedRating, material: savedMaterial };
  }

  /**
   * 结案后自动触发评价推送（监听案件状态变更）
   */
  async triggerRatingOnCaseClose(caseId: string): Promise<{ triggered: boolean; message: string }> {
    const caseEntity = await this.caseRepository.findOne({ where: { id: caseId } });
    if (!caseEntity) {
      throw new Error('案件不存在');
    }
    // 检查是否已存在该案件的评价，避免重复触发
    const existing = await this.serviceRatingRepository.findOne({ where: { case_id: caseId } });
    if (existing) {
      return { triggered: false, message: '该案件已存在评价，无需重复触发' };
    }
    // 创建待评价推送记录（复用推送通知渠道）
    await this.createPushNotification({
      case_id: caseId,
      client_id: caseEntity.client_id,
      node_type: 'closed',
      push_content: '您的案件已结案，感谢您对我们的信任与支持，请对本次服务进行评价。',
      push_channel: 'in_app',
      push_time: new Date(),
      status: 'sent',
      organization_id: caseEntity.organization_id,
      sent_at: new Date(),
    });
    return { triggered: true, message: '评价推送已触发' };
  }

  /**
   * 评分≤2 自动生成客诉预警（创建 ComplaintTicket，type='low_score_rating'）
   */
  async createLowScoreWarning(rating: ServiceRating): Promise<ComplaintTicket> {
    const ticketNumber = `LSR${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const ticket = this.complaintTicketRepository.create({
      ticket_number: ticketNumber,
      source_channel: TicketSourceChannel.CLIENT_PORTAL,
      complaint_type: 'low_score_rating' as any,
      severity_level: TicketSeverity.HIGH,
      title: `低分评价客诉预警-评分${rating.rating}星`,
      content: `客户提交了低分评价（${rating.rating}星），评价内容：${rating.content || '无'}，请及时跟进处理。`,
      case_id: rating.case_id,
      client_id: rating.client_id,
      status: TicketStatus.PENDING,
      organization_id: rating.organization_id,
    });
    return this.complaintTicketRepository.save(ticket);
  }
}
