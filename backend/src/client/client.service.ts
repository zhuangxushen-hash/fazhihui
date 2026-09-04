import { Injectable, Inject, forwardRef, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as fs from 'fs';
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
import { ClientArchive } from './client-archive.entity';
import { ClientProfile } from './client-profile.entity';
// 法大大电子签：客户端签约身份鉴别 + 电子签名
import { FadadaService } from '../fadada/fadada.service';
// Phase4 M3: 客户投诉走合规通道，注入合规服务
import { ComplianceService } from '../compliance/compliance.service';
// 13.8 缺口2: 咨询转线索，复用 LeadService 创建并自动分配线索（forwardRef 防止循环依赖）
import { LeadService } from '../lead/lead.service';
import { LeadSource } from '../types';
// C 端短信提醒：客户签约完成后触发收案立项短信
import { SmsService } from '../sms/sms.service';

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
    @InjectRepository(ClientArchive)
    private clientArchiveRepository: Repository<ClientArchive>,
    @InjectRepository(ClientProfile)
    private clientProfileRepository: Repository<ClientProfile>,
    // 法大大电子签：实名认证 + 签署任务
    private fadadaService: FadadaService,
    // Phase4 M3: 注入合规服务，客户投诉同步走合规通道（forwardRef 防止循环依赖）
    @Inject(forwardRef(() => ComplianceService))
    private complianceService: ComplianceService,
    // 13.8 缺口2: 注入线索服务，AI咨询转人工时自动创建CRM线索
    @Inject(forwardRef(() => LeadService))
    private leadService: LeadService,
    // C 端短信提醒：客户签约完成后触发收案立项短信
    private smsService: SmsService,
  ) {}

  private readonly logger = new Logger(ClientService.name);

  /**
   * 触发 C 端短信（失败不影响签约主流程）
   */
  private async triggerSms(caseId: string, nodeType: string): Promise<void> {
    try {
      await this.smsService.sendCaseSms({ caseId, nodeType });
    } catch (e) {
      // 短信发送失败不影响签约主流程
      this.logger.error(`触发 C 端短信失败 caseId=${caseId} nodeType=${nodeType}`, (e as Error)?.message || e);
    }
  }

  async getClientCases(clientId: string): Promise<any[]> {
    const cases = await this.caseRepository.find({ where: { client_id: clientId }, order: { created_at: 'DESC' } });
    // 批量查询所有相关律师，避免 N+1 查询
    const lawyerIds = [...new Set(cases.map(c => c.assignee_lawyer_id).filter(Boolean))];
    const lawyers = lawyerIds.length > 0
      ? await this.userRepository.find({ where: { id: In(lawyerIds) } })
      : [];
    const lawyerMap = new Map(lawyers.map(l => [l.id, l.real_name]));
    return cases.map(item => ({
      ...item,
      lawyer_name: item.assignee_lawyer_id ? lawyerMap.get(item.assignee_lawyer_id) || null : null,
    }));
  }

  async getCaseDetail(caseId: string, clientId: string): Promise<any> {
    const caseEntity = await this.caseRepository.findOne({ where: { id: caseId } });
    // 保留原有归属校验逻辑：案件不存在或 case.client_id !== 当前 client 时，统一抛出 404（避免泄露案件存在性）
    if (!caseEntity || caseEntity.client_id !== clientId) {
      throw new NotFoundException('案件不存在');
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

  async getCaseDocuments(caseId: string, clientId: string): Promise<any[]> {
    const caseEntity = await this.caseRepository.findOne({ where: { id: caseId } });
    if (!caseEntity || caseEntity.client_id !== clientId) {
      throw new Error('案件不存在或无权访问');
    }
    // documents 表为 C 端与 B 端共用，C 端可见范围：
    // 1) 客户本人上传的文书（uploaded_by_id = clientId）
    // 2) B 端上传时勾选了「展示给客户」的文件（visible_to_client = true）
    const docs = await this.documentRepository.find({
      where: [
        { case_id: caseId, uploaded_by_id: clientId },
        { case_id: caseId, visible_to_client: true },
      ],
      order: { created_at: 'DESC' },
    });
    // 归一化为 C 端展示字段，并标记来源（客户上传 / 律师共享）
    return docs.map((d) => ({
      id: d.id,
      file_name: d.name,
      file_size: d.size,
      file_type: d.doc_type || d.file_type,
      // B端上传走本地存储（file_path 为服务器路径，无 file_url）；C端历史数据可能为外链
      file_url: /^https?:\/\//.test(d.file_path || '') ? d.file_path : undefined,
      from_client: d.uploaded_by_id === clientId,
    }));
  }

  /**
   * C端下载案件文书（B端共享的本地存储文件走此接口流式下载）
   * 仅允许下载：客户本人上传的文书，或 B 端勾选「展示给客户」的文件
   */
  async getCaseDocumentForDownload(
    caseId: string,
    docId: string,
    clientId: string,
  ): Promise<{ path: string; name: string; mime: string }> {
    const caseEntity = await this.caseRepository.findOne({ where: { id: caseId } });
    if (!caseEntity || caseEntity.client_id !== clientId) {
      throw new NotFoundException('案件不存在');
    }
    const doc = await this.documentRepository.findOne({ where: { id: docId, case_id: caseId } });
    if (!doc) {
      throw new NotFoundException('文档不存在');
    }
    if (doc.uploaded_by_id !== clientId && !doc.visible_to_client) {
      // 统一 404，避免泄露文档存在性
      throw new NotFoundException('文档不存在');
    }
    if (!doc.file_path || /^https?:\/\//.test(doc.file_path) || !fs.existsSync(doc.file_path)) {
      throw new NotFoundException('文档文件不存在');
    }
    return { path: doc.file_path, name: doc.name, mime: doc.file_type || 'application/octet-stream' };
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
    const savedComplaint = await this.complaintRepository.save(complaint);

    // Phase4 M3: 客户投诉同步走合规通道，生成投诉工单（异常静默处理，不影响投诉记录创建）
    try {
      await this.complianceService.createComplaintTicket({
        source_channel: TicketSourceChannel.CLIENT_PORTAL,
        complaint_type: complaintData.type,
        severity_level: TicketSeverity.MEDIUM,
        title: `客户投诉-${complaintData.client_name || '匿名客户'}`,
        content: complaintData.content,
        case_id: complaintData.case_id,
        client_id: complaintData.client_id,
        client_name: complaintData.client_name,
        client_phone: complaintData.client_phone,
        organization_id: complaintData.organization_id,
      });
    } catch (err) {
      // 投诉工单同步失败不应阻断投诉主流程，但需记录以便排查数据未进入投诉管理的问题
      console.error('[client] 同步投诉工单到合规通道失败:', err);
    }

    return savedComplaint;
  }

  async getClientComplaints(clientId: string): Promise<ComplaintTicket[]> {
    // 客户投诉已统一收敛到 complaint_tickets（与 B 端投诉管理同源），此处直接读取工单
    return this.complaintTicketRepository.find({
      where: { client_id: clientId },
      order: { updated_at: 'DESC' },
    });
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

      // 13.8 缺口2: 咨询转线索 — 转人工咨询自动创建CRM线索（复用 LeadService.create，内置7天重复手机号去重并触发自动分配）
      await this.createLeadFromConsultation(data.client_id, data.question, data.organization_id);
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
   * 13.8 缺口2: 咨询转线索
   * 转人工时根据C端用户信息自动创建CRM线索，source_keyword 标记来源为"AI咨询转人工"
   * 复用 LeadService.create：7天内同一手机号重复咨询不会重复建线索（去重），并触发分配规则自动分配销售
   */
  private async createLeadFromConsultation(clientId: string, question: string, orgId?: string): Promise<void> {
    try {
      const user = await this.userRepository.findOne({ where: { id: clientId } });
      if (!user?.phone) return;
      await this.leadService.create(
        {
          phone: user.phone,
          contact_name: user.real_name,
          source_channel: LeadSource.OTHER,
          source_keyword: 'AI咨询转人工',
          case_description: question,
          organization_id: user.organization_id || orgId || '',
        },
        user.organization_id || orgId || '',
      );
    } catch (err) {
      // 建线索失败不影响主流程（工单与咨询记录已保存），静默处理
    }
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
   * 线上签约（发起签约意向，两步式）：
   * - 法大大启用（FADADA_ENABLED=true）：创建 pending 签约记录，走「实名认证 → 电子签」流程
   * - 法大大未启用（legacy）：保留原直签行为，直接生成已签署记录
   * @deprecated 旧「先实名后签署」两步流程。现行流程为免验证签整合模式：发起签约即返回签署链接，
   * 客户在法大大签署页通过互动视频签（audio_video）一并完成实名与意愿确认，无需调用本接口。
   * 前端已无调用方，保留仅为兼容，请勿在新代码中使用。
   */
  async onlineSign(body: {
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
  }): Promise<any> {
    // 校验合同模板存在
    const template = await this.contractTemplateRepository.findOne({ where: { id: body.contract_template_id } });
    if (!template) {
      throw new Error('合同模板不存在');
    }
    const profile = await this.clientProfileRepository.findOne({ where: { id: body.client_id } });
    const enabled = this.fadadaService.enabled;
    const isCorp = body.subject_type === 'corp';
    const signing = this.signingComplianceRepository.create({
      case_id: body.case_id,
      client_id: body.client_id,
      lawyer_id: body.lawyer_id,
      contract_template_id: body.contract_template_id,
      status: enabled ? SigningStatus.PENDING : SigningStatus.SIGNED,
      contract_content: template.content,
      signed_time: enabled ? null : new Date(),
      organization_id: body.organization_id,
      // 个人签名主要证件；企业签名使用企业信息
      subject_type: isCorp ? 'corp' : 'person',
      id_card_no: body.id_card_no || profile?.id_card_no || null,
      corp_name: body.corp_name || null,
      corp_ident_no: body.corp_ident_no || null,
      legal_rep_name: body.legal_rep_name || null,
      verify_status: enabled ? 'pending' : 'verified',
    });
    const saved = await this.signingComplianceRepository.save(signing);
    // 客户身份证号回写客户档案（法大大实名认证/证件匹配用）
    if (profile && body.id_card_no && !profile.id_card_no) {
      profile.id_card_no = body.id_card_no;
      await this.clientProfileRepository.save(profile);
    }
    // 法大大未启用（legacy 直签）：签约直接完成，触发收案立项短信（失败不影响签约）
    if (!enabled) {
      this.triggerSms(body.case_id, 'filing');
    }
    return {
      ...saved,
      signing_id: saved.id,
      enabled,
      mode: enabled ? this.fadadaService.mode : 'legacy',
      verify_status: saved.verify_status,
    };
  }

  /** 法大大电子签配置（前端引导流程用，不含密钥） */
  async getSignConfig(): Promise<any> {
    return {
      provider: 'fadada',
      enabled: this.fadadaService.enabled,
      mode: this.fadadaService.enabled ? this.fadadaService.mode : 'legacy',
    };
  }

  /**
   * 获取法大大实名认证链接（身份鉴别第一步，按签约主体类型分流：个人/企业）
   * @deprecated 旧「先刷脸实名、后签署」两步流程。现行流程为互动视频签即实名：客户打开签署链接
   * 后由法大大互动视频签（audio_video，含人脸核身）一并完成实名与意愿确认，无需单独获取实名链接。
   * 前端已无调用方，保留仅为兼容，请勿在新代码中使用。
   */
  async getSignVerifyUrl(body: {
    signing_id: string;
    client_id: string;
    user_name?: string;
    id_card_no?: string;
    mobile?: string;
    // 企业认证信息（签约主体为企业时传入）
    corp_name?: string;
    corp_ident_no?: string;
    legal_rep_name?: string;
    // 认证完成后法大大跳转地址（覆盖全局配置，供 C 端认证后回到原页面）
    redirect_url?: string;
  }): Promise<any> {
    const signing = await this.findSigning(body.signing_id, body.client_id);
    const profile = await this.clientProfileRepository.findOne({ where: { id: body.client_id } });
    if (!profile) {
      throw new Error('客户档案不存在');
    }
    const isCorp = signing.subject_type === 'corp';
    // 个人证件号（个人认证主体，或企业认证时的经办人证件）
    const idCardNo = body.id_card_no || signing.id_card_no || profile.id_card_no || '';
    // 回写企业信息到签署记录（企业实名认证/签署主体匹配用）
    if (isCorp) {
      if (body.corp_name) signing.corp_name = body.corp_name;
      if (body.corp_ident_no) signing.corp_ident_no = body.corp_ident_no;
      if (body.legal_rep_name) signing.legal_rep_name = body.legal_rep_name;
    } else {
      if (idCardNo && !profile.id_card_no) {
        profile.id_card_no = idCardNo;
        await this.clientProfileRepository.save(profile);
      }
      signing.id_card_no = idCardNo || null;
    }
    signing.verify_status = 'pending';
    signing.fadada_verify_transaction_id = signing.id;
    await this.signingComplianceRepository.save(signing);
    // 企业签约 -> 企业实名认证；个人签约 -> 个人实名认证
    if (isCorp) {
      const result = await this.fadadaService.getCorpAuthUrl(
        {
          signingId: signing.id,
          corpName: signing.corp_name || body.corp_name || '',
          corpIdentNo: signing.corp_ident_no || body.corp_ident_no || '',
          legalRepName: body.legal_rep_name || signing.legal_rep_name || undefined,
          agentName: body.user_name || profile.name || profile.contact_name || undefined,
          agentIdCardNo: idCardNo || undefined,
          agentMobile: body.mobile || profile.phone || undefined,
        },
        body.redirect_url,
      );
      return {
        signing_id: signing.id,
        verify_url: result.verifyUrl,
        transaction_id: result.transactionId,
        mode: result.mode,
        subject_type: 'corp',
      };
    }
    const result = await this.fadadaService.getRealNameAuthUrl(
      {
        signingId: signing.id,
        clientUserId: body.client_id,
        userName: body.user_name || profile.name || profile.contact_name || '客户',
        idCardNo,
        mobile: body.mobile || profile.phone || undefined,
      },
      body.redirect_url,
    );
    return {
      signing_id: signing.id,
      verify_url: result.verifyUrl,
      transaction_id: result.transactionId,
      mode: result.mode,
      subject_type: 'person',
    };
  }

  /** 模拟模式：本地完成实名认证（仅 mock 模式可用） */
  async mockVerifySigning(body: { signing_id: string; client_id: string }): Promise<any> {
    if (this.fadadaService.mode !== 'mock') {
      throw new Error('仅模拟模式支持本地实名认证');
    }
    const signing = await this.findSigning(body.signing_id, body.client_id);
    signing.verify_status = 'verified';
    signing.verify_time = new Date();
    await this.signingComplianceRepository.save(signing);
    return { signing_id: signing.id, verify_status: signing.verify_status };
  }

  /**
   * 创建法大大签署任务并返回客户签署链接（身份鉴别通过后调用）
   * @deprecated 旧「先实名后签署」链路专用（且强制要求 verify_status=verified，与现行整合模式矛盾）。
   * 现行流程：发起签约即创建签署任务（免验证签整合模式），无需调用本接口。
   * 前端已无调用方，保留仅为兼容，请勿在新代码中使用。
   */
  async createSignFlow(body: { signing_id: string; client_id: string }): Promise<any> {
    const signing = await this.findSigning(body.signing_id, body.client_id);
    if (this.fadadaService.enabled && signing.verify_status !== 'verified') {
      throw new Error('客户尚未完成法大大实名认证，无法生成签署链接');
    }
    const profile = await this.clientProfileRepository.findOne({ where: { id: body.client_id } });
    const lawyer = signing.lawyer_id
      ? await this.userRepository.findOne({ where: { id: signing.lawyer_id } })
      : null;
    const template = signing.contract_template_id
      ? await this.contractTemplateRepository.findOne({ where: { id: signing.contract_template_id } })
      : null;
    const result = await this.fadadaService.createSignTask({
      signingId: signing.id,
      subject: `法律服务合同签约-${(signing.case_id || '').slice(0, 8)}`,
      docName: `${template?.name || '法律服务合同'}.pdf`,
      docContent: signing.contract_content || template?.content || '',
      subjectType: signing.subject_type === 'corp' ? 'corp' : 'person',
      corp:
        signing.subject_type === 'corp'
          ? {
              corpName: signing.corp_name || '',
              corpIdentNo: signing.corp_ident_no || '',
              legalRepName: signing.legal_rep_name || undefined,
              agentName: profile?.name || profile?.contact_name || undefined,
              agentIdCardNo: signing.id_card_no || profile?.id_card_no || undefined,
              agentMobile: profile?.phone || undefined,
            }
          : undefined,
      client: {
        clientUserId: signing.client_id,
        userName: profile?.name || profile?.contact_name || '客户',
        idCardNo: signing.id_card_no || profile?.id_card_no || undefined,
        mobile: profile?.phone || undefined,
      },
      lawyer: lawyer
        ? {
            lawyerUserId: 'LAWYER_' + lawyer.id,
            name: lawyer.real_name || '承办律师',
            mobile: lawyer.phone || undefined,
          }
        : undefined,
    });
    signing.fadada_sign_task_id = result.signTaskId;
    signing.fadada_actor_id = result.actorId;
    signing.sign_url = result.signUrl;
    signing.status = SigningStatus.REVIEWING;
    await this.signingComplianceRepository.save(signing);
    return {
      signing_id: signing.id,
      sign_url: result.signUrl,
      sign_task_id: result.signTaskId,
      mode: result.mode,
    };
  }

  /** 模拟模式：本地完成签署（仅 mock 模式可用） */
  async mockFinishSigning(body: { signing_id: string; client_id: string }): Promise<any> {
    if (this.fadadaService.mode !== 'mock') {
      throw new Error('仅模拟模式支持本地完成签署');
    }
    const signing = await this.findSigning(body.signing_id, body.client_id);
    signing.status = SigningStatus.SIGNED;
    signing.signed_time = new Date();
    await this.signingComplianceRepository.save(signing);
    // 模拟完成签署：客户签约完成，触发收案立项短信（失败不影响签约）
    this.triggerSms(signing.case_id, 'filing');
    return { signing_id: signing.id, status: signing.status };
  }

  /** 查询签约状态（前端轮询用） */
  async getSignStatus(body: { signing_id: string; client_id: string }): Promise<any> {
    const signing = await this.findSigning(body.signing_id, body.client_id);
    return {
      signing_id: signing.id,
      status: signing.status,
      verify_status: signing.verify_status,
      fadada_sign_task_id: signing.fadada_sign_task_id,
      sign_url: signing.sign_url,
    };
  }

  /**
   * 获取签署音视频下载链接（互动视频签 audio_video 录制，flv 格式，有效期 24 小时）。
   * 签署完成后一般 5 分钟才可下载；法大大仅保存 3 天，需在有效期内及时获取。
   */
  async getSignAudioVideo(body: { signing_id: string; client_id: string }): Promise<any> {
    const signing = await this.findSigning(body.signing_id, body.client_id);
    if (!signing.fadada_sign_task_id) {
      throw new Error('该签约未关联法大大签署任务，无法获取音视频');
    }
    const downloadUrl = await this.fadadaService.getSignAudioVideoUrl(
      signing.fadada_sign_task_id,
      signing.fadada_actor_id || signing.client_id,
    );
    return {
      signing_id: signing.id,
      download_url: downloadUrl,
      mode: this.fadadaService.mode,
    };
  }

  /**
   * C端查询案件下「已签署」的签约记录（供案件详情展示已签署合同与签署音视频入口）。
   * 按创建时间取最新一条，仅返回已签署（signed）记录。
   */
  async getSignedSignings(body: { client_id: string; case_id?: string }): Promise<any[]> {
    const where: any = {
      client_id: body.client_id,
      status: SigningStatus.SIGNED,
    };
    if (body.case_id) where.case_id = body.case_id;
    const list = await this.signingComplianceRepository.find({
      where,
      order: { created_at: 'DESC' },
    });
    return list.slice(0, 1).map((s) => ({
      signing_id: s.id,
      case_id: s.case_id,
      subject: s.contract_content || '法律顾问签约',
      signed_time: s.signed_time || s.updated_at,
      fadada_sign_task_id: s.fadada_sign_task_id,
    }));
  }

  /**
   * C端查询案件下「待签约/待预填」的签约记录（法大大模板签约，供 C 端案件详情展示待签约入口）。
   * pending=等待客户填写提交；reviewing=客户已提交填写、任务已开启，仍在等待完成签署（非终态）。
   * 两种状态都应作为有效入口展示，并按创建时间取最新一条，避免命中历史遗留记录导致跳转旧签署链接。
   */
  async getActiveSignings(body: { client_id: string; case_id?: string }): Promise<any[]> {
    const where: any = {
      client_id: body.client_id,
      status: In([SigningStatus.PENDING, SigningStatus.REVIEWING]),
    };
    if (body.case_id) where.case_id = body.case_id;
    const list = await this.signingComplianceRepository.find({
      where,
      order: { created_at: 'DESC' },
    });
    const active = list.filter((s) => s.fadada_sign_task_id);
    // 同一案件只展示最新一次发起的签约
    return (active.length > 0 ? [active[0]] : []).map((s) => ({
      signing_id: s.id,
      case_id: s.case_id,
      subject: s.contract_content || '法律顾问签约',
      created_at: s.created_at,
    }));
  }

  /** C端获取待签约任务中客户需要补充填写的字段列表（复用现有 C 端页面做预填） */
  async getSignPrefillFields(body: { signing_id: string; client_id: string }): Promise<any> {
    const signing = await this.findSigning(body.signing_id, body.client_id);
    if (!signing.fadada_sign_task_id) {
      throw new Error('该签约尚未完成发起，缺少签署任务ID');
    }
    const fields = await this.fadadaService.getClientPrefillFields(signing.fadada_sign_task_id);
    return {
      signing_id: signing.id,
      sign_task_id: signing.fadada_sign_task_id,
      subject: signing.contract_content || '法律顾问签约',
      fields,
    };
  }

  /** C端预填字段后获取合同预览链接（填充字段但不提交任务，预览确认后再签约） */
  async getSignPreview(body: {
    signing_id: string;
    client_id: string;
    values: Array<{ field_doc_id?: string; field_id?: string; field_name?: string; field_value: string }>;
  }): Promise<any> {
    const signing = await this.findSigning(body.signing_id, body.client_id);
    if (!signing.fadada_sign_task_id) {
      throw new Error('该签约尚未完成发起，缺少签署任务ID');
    }
    // 合并系统预填 + 业务员预填与客户填写的值（客户值覆盖同名预填值）
    const merged = this.mergePrefillValues(signing, body.values || []);
    const result = await this.fadadaService.getClientPreviewUrl({
      signTaskId: signing.fadada_sign_task_id,
      signingId: signing.id,
      values: merged,
    });
    return {
      signing_id: signing.id,
      preview_url: result.previewUrl,
      mode: result.mode,
    };
  }

  /** C端提交填写的字段并调用法大大签约流程：填充→提交→定稿→返回签署链接 */
  async submitSignPrefillAndSign(body: {
    signing_id: string;
    client_id: string;
    values: Array<{ field_doc_id?: string; field_id?: string; field_name?: string; field_value: string }>;
  }): Promise<any> {
    const signing = await this.findSigning(body.signing_id, body.client_id);
    if (!signing.fadada_sign_task_id) {
      throw new Error('该签约尚未完成发起，缺少签署任务ID');
    }
    // 免验证签整合模式：无需提前单独实名认证，客户在法大大签署页完成签署时即同步完成实名，
    // 身份与意愿确认由法大大互动视频签（audio_video，含人脸核身）一并保障，此处不校验 verify_status。
    // 合并系统预填 + 业务员预填与客户填写的值（客户值覆盖同名预填值），一并传给法大大，避免信息丢失
    const values = this.mergePrefillValues(signing, body.values || []);
    // 查出客户手机号，传给法大大确保快捷签 createWithTemplate 与 getActorUrl 的 clientUserId 一致
    let clientMobile: string | undefined;
    try {
      const profile = await this.clientProfileRepository.findOne({ where: { id: signing.client_id } });
      clientMobile = profile?.phone || undefined;
    } catch { /* 查不到就跳过，clientUserId 为空法大大走普通登录流程 */ }
    const result = await this.fadadaService.completeClientPrefillAndSign({
      signTaskId: signing.fadada_sign_task_id,
      actorId: signing.fadada_actor_id || signing.client_id,
      signingId: signing.id,
      clientMobile,
      values,
    });
    // 回填签署链接并更新状态为审核中（待签署）
    signing.sign_url = result.signUrl;
    signing.status = SigningStatus.REVIEWING;
    await this.signingComplianceRepository.save(signing);
    return {
      signing_id: signing.id,
      sign_url: result.signUrl,
      embed_url: result.embedUrl,
      sign_task_id: signing.fadada_sign_task_id,
      mode: result.mode,
    };
  }

  /**
   * 合并字段值：系统预填 + 业务员预填（发起时保存的 prefill_values）与客户在 C 端填写的值，
   * 客户填写值覆盖同名预填值，返回合并后的字段列表。
   */
  private mergePrefillValues(
    signing: SigningCompliance,
    values: Array<{ field_doc_id?: string; field_id?: string; field_name?: string; field_value: string }>,
  ): Array<{ docId?: string | number; fieldId?: string; fieldName?: string; fieldValue: string }> {
    const merged = new Map<string, { docId?: string | number; fieldId?: string; fieldName?: string; fieldValue: string }>();
    try {
      const prefillValues = JSON.parse(signing.prefill_values || '[]') as Array<{
        docId?: string | number;
        fieldId?: string;
        fieldName?: string;
        fieldValue: string;
      }>;
      prefillValues.forEach((v) => {
        if (v?.fieldId) merged.set(v.fieldId, { docId: v.docId, fieldId: v.fieldId, fieldName: v.fieldName, fieldValue: v.fieldValue });
      });
    } catch (e) {
      // 预填值解析失败不影响主流程
    }
    (values || []).forEach((v) => {
      if (v?.field_id) {
        merged.set(v.field_id, {
          docId: v.field_doc_id,
          fieldId: v.field_id,
          fieldName: v.field_name,
          fieldValue: v.field_value,
        });
      }
    });
    return Array.from(merged.values());
  }

  private async findSigning(signingId: string, clientId: string): Promise<SigningCompliance> {
    const signing = await this.signingComplianceRepository.findOne({
      where: { id: signingId, client_id: clientId },
    });
    if (!signing) {
      throw new Error('签约记录不存在或无权访问');
    }
    return signing;
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
    // Phase4 M2: 结案后创建一条待评价记录（ServiceRating status=pending），等待客户提交评分
    const pendingRating = this.serviceRatingRepository.create({
      case_id: caseId,
      client_id: caseEntity.client_id,
      rating: 0, // 待评价占位，客户提交后更新
      content: null,
      status: 'pending',
      organization_id: caseEntity.organization_id,
    });
    await this.serviceRatingRepository.save(pendingRating);
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

  // ==================== 模块7.6 客户云归档管理 ====================

  /**
   * 获取客户归档列表
   */
  async getClientArchives(clientId: string, filters?: { case_id?: string; file_type?: string }): Promise<ClientArchive[]> {
    const where: any = { client_id: clientId };
    if (filters?.case_id) {
      where.case_id = filters.case_id;
    }
    if (filters?.file_type) {
      where.file_type = filters.file_type;
    }
    return this.clientArchiveRepository.find({
      where,
      order: { created_at: 'DESC' },
    });
  }

  /**
   * 上传归档文件
   */
  async uploadArchive(clientId: string, archiveData: {
    case_id?: string;
    file_name: string;
    file_type: string;
    file_size?: number;
    file_url?: string;
    description?: string;
    organization_id?: string;
  }): Promise<ClientArchive> {
    const archive = this.clientArchiveRepository.create({
      ...archiveData,
      client_id: clientId,
      archived_at: new Date(),
      archived_by: clientId,
    });
    return this.clientArchiveRepository.save(archive);
  }

  /**
   * 删除归档
   */
  async deleteArchive(id: string, clientId: string): Promise<{ success: boolean; message: string }> {
    const archive = await this.clientArchiveRepository.findOne({ where: { id } });
    if (!archive) {
      throw new Error('归档记录不存在');
    }
    if (archive.client_id !== clientId) {
      throw new Error('无权删除该归档记录');
    }
    await this.clientArchiveRepository.delete(id);
    return { success: true, message: '归档已删除' };
  }

  /**
   * 按案件查询归档
   */
  async getArchiveByCase(caseId: string, clientId: string): Promise<ClientArchive[]> {
    return this.clientArchiveRepository.find({
      where: { case_id: caseId, client_id: clientId },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * 管理员 - 获取所有归档记录（带分页与筛选）
   */
  async listAllArchives(filters: {
    keyword?: string;
    file_type?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ data: ClientArchive[]; total: number }> {
    const page = filters.page || 1;
    const pageSize = filters.page_size || 10;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.clientArchiveRepository.createQueryBuilder('a');

    if (filters.keyword) {
      queryBuilder.andWhere('a.file_name LIKE :keyword', { keyword: `%${filters.keyword}%` });
    }
    if (filters.file_type) {
      queryBuilder.andWhere('a.file_type = :fileType', { fileType: filters.file_type });
    }

    queryBuilder.orderBy('a.created_at', 'DESC');
    queryBuilder.skip(skip).take(pageSize);

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  /**
   * 管理员 - 删除任意归档
   */
  async adminDeleteArchive(id: string): Promise<{ success: boolean; message: string }> {
    const archive = await this.clientArchiveRepository.findOne({ where: { id } });
    if (!archive) {
      throw new Error('归档记录不存在');
    }
    await this.clientArchiveRepository.delete(id);
    return { success: true, message: '归档已删除' };
  }
}
