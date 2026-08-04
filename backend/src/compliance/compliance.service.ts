import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComplianceRecord } from './compliance-record.entity';
import { Complaint } from './complaint.entity';
import { MarketingContent, ContentStatus } from './marketing-content.entity';
import { SalesCompliance, SalesCheckResult, SalesReviewStatus, SalesRiskLevel } from './sales-compliance.entity';
import { SigningCompliance, SigningStatus } from './signing-compliance.entity';
import { CaseSOP } from './case-sop.entity';
import { TalkQualityCheck, TalkCheckType, TalkCheckResult, TalkHandleStatus, TalkViolationType } from './talk-quality-check.entity';
import { ReportTemplate } from '../dashboard/report-template.entity';
import { ReportExportLog } from '../dashboard/report-export-log.entity';
import { ComplianceType, ComplianceResult, ComplaintType, ComplaintStatus } from '../types';
import { NotificationService } from '../user/notification.service';
// Phase4: 引入案件SOP模板与投诉工单实体（H7 SOP模板联动、M3 投诉走合规通道）
import { CaseSOPTemplate } from '../case/case-sop-template.entity';
import { ComplaintTicket, TicketSourceChannel, TicketComplaintType, TicketSeverity, TicketStatus } from './complaint-ticket.entity';
// 合并后：案件SOP操作统一使用 CaseTask 表
import { CaseTask, CaseTaskStatus } from '../case/case-task.entity';

const VIOLATION_KEYWORDS = {
  absolute: ['最', '第一', '唯一', '顶级', '首选', '独家'],
  promise: ['包赢', '必赢', '一定赢', '保证胜诉', '确保胜诉'],
  exaggerate: ['秒批', '神速', '当天解决', '立刻', '马上'],
};

const CASE_SOP_TEMPLATES: Record<string, { step_name: string; days_to_deadline: number }[]> = {
  marriage: [
    { step_name: '案件受理', days_to_deadline: 3 },
    { step_name: '证据收集', days_to_deadline: 15 },
    { step_name: '立案申请', days_to_deadline: 30 },
    { step_name: '开庭准备', days_to_deadline: 45 },
    { step_name: '庭审', days_to_deadline: 60 },
    { step_name: '判决', days_to_deadline: 90 },
  ],
  traffic: [
    { step_name: '案件受理', days_to_deadline: 3 },
    { step_name: '伤情鉴定', days_to_deadline: 20 },
    { step_name: '赔偿核算', days_to_deadline: 30 },
    { step_name: '调解协商', days_to_deadline: 45 },
    { step_name: '立案起诉', days_to_deadline: 60 },
    { step_name: '判决执行', days_to_deadline: 90 },
  ],
  labor: [
    { step_name: '案件受理', days_to_deadline: 3 },
    { step_name: '证据收集', days_to_deadline: 15 },
    { step_name: '仲裁申请', days_to_deadline: 30 },
    { step_name: '庭审', days_to_deadline: 60 },
    { step_name: '裁决', days_to_deadline: 90 },
    { step_name: '强制执行', days_to_deadline: 120 },
  ],
  debt: [
    { step_name: '案件受理', days_to_deadline: 3 },
    { step_name: '证据收集', days_to_deadline: 15 },
    { step_name: '立案起诉', days_to_deadline: 30 },
    { step_name: '庭审', days_to_deadline: 60 },
    { step_name: '判决', days_to_deadline: 90 },
    { step_name: '强制执行', days_to_deadline: 150 },
  ],
};

@Injectable()
export class ComplianceService {
  constructor(
    @InjectRepository(ComplianceRecord)
    private complianceRecordRepository: Repository<ComplianceRecord>,
    @InjectRepository(Complaint)
    private complaintRepository: Repository<Complaint>,
    @InjectRepository(MarketingContent)
    private marketingContentRepository: Repository<MarketingContent>,
    @InjectRepository(SalesCompliance)
    private salesComplianceRepository: Repository<SalesCompliance>,
    @InjectRepository(SigningCompliance)
    private signingComplianceRepository: Repository<SigningCompliance>,
    @InjectRepository(CaseSOP)
    private caseSOPRepository: Repository<CaseSOP>,
    @InjectRepository(TalkQualityCheck)
    private talkQualityCheckRepository: Repository<TalkQualityCheck>,
    @InjectRepository(ReportTemplate)
    private reportTemplateRepository: Repository<ReportTemplate>,
    @InjectRepository(ReportExportLog)
    private reportExportLogRepository: Repository<ReportExportLog>,
    // Phase4 H7: 注入案件SOP模板仓库，createCaseSOP 改为读取模板表
    @InjectRepository(CaseSOPTemplate)
    private caseSOPTemplateRepository: Repository<CaseSOPTemplate>,
    // Phase4 M3: 注入投诉工单仓库，客户投诉走合规通道时创建工单
    @InjectRepository(ComplaintTicket)
    private complaintTicketRepository: Repository<ComplaintTicket>,
    // 合并后：案件SOP操作统一使用 CaseTask 仓库
    @InjectRepository(CaseTask)
    private caseTaskRepository: Repository<CaseTask>,
    private notificationService: NotificationService,
  ) {}

  async checkCompliance(content: string, type: ComplianceType, orgId: string, operatorId: string, sourceId?: string): Promise<ComplianceRecord> {
    let result = ComplianceResult.PASS;
    let violationType = '';
    let violationDetail = '';
    let suggestion = '';

    for (const [key, keywords] of Object.entries(VIOLATION_KEYWORDS)) {
      for (const keyword of keywords) {
        if (content.includes(keyword)) {
          result = ComplianceResult.REJECT;
          violationType = key;
          violationDetail += `${keyword} `;
          suggestion += `请修改"${keyword}"表述，避免${key === 'absolute' ? '绝对化用语' : key === 'promise' ? '违规承诺' : '夸大宣传'}\n`;
        }
      }
    }

    const record = this.complianceRecordRepository.create({
      type,
      content,
      result,
      violation_type: violationType,
      violation_detail: violationDetail,
      suggestion,
      source_id: sourceId,
      organization_id: orgId,
      operator_id: operatorId,
    });

    return this.complianceRecordRepository.save(record);
  }

  async getComplianceRecords(orgId: string, type?: ComplianceType, result?: ComplianceResult): Promise<ComplianceRecord[]> {
    const query: any = {};
    if (orgId) {
      query.organization_id = orgId;
    }
    if (type) {
      query.type = type;
    }
    if (result) {
      query.result = result;
    }
    return this.complianceRecordRepository.find({ where: query, order: { created_at: 'DESC' } });
  }

  // 合并后：投诉统一写入 ComplaintTicket 表（旧 Complaint 表逻辑保留声明，不再写入）
  // ComplaintType → TicketComplaintType 映射
  private complaintTypeToTicketTypeMap: Record<string, string> = {
    [ComplaintType.SERVICE_QUALITY]: TicketComplaintType.SERVICE_ATTITUDE,
    [ComplaintType.FEE_ISSUE]: TicketComplaintType.FEE_ISSUE,
    [ComplaintType.PROGRESS]: TicketComplaintType.CASE_PROGRESS,
    [ComplaintType.RESULT]: TicketComplaintType.OTHER,
    [ComplaintType.OTHER]: TicketComplaintType.OTHER,
  };

  // ComplaintStatus → TicketStatus 映射
  private complaintStatusToTicketStatusMap: Record<string, TicketStatus> = {
    [ComplaintStatus.NEW]: TicketStatus.PENDING,
    [ComplaintStatus.ACCEPTED]: TicketStatus.PROCESSING,
    [ComplaintStatus.PROCESSING]: TicketStatus.PROCESSING,
    [ComplaintStatus.REVIEWING]: TicketStatus.PROCESSING,
    [ComplaintStatus.CLOSED]: TicketStatus.CLOSED,
  };

  async createComplaint(complaintData: Partial<Complaint>): Promise<ComplaintTicket> {
    const ticketNumber = `TK${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const ticket = this.complaintTicketRepository.create({
      ticket_number: ticketNumber,
      source_channel: TicketSourceChannel.CLIENT_PORTAL,
      complaint_type: (this.complaintTypeToTicketTypeMap[complaintData.type as string] || TicketComplaintType.OTHER) as any,
      severity_level: TicketSeverity.MEDIUM,
      title: (complaintData.content || '').slice(0, 30) || '客户投诉',
      content: complaintData.content || '',
      case_id: complaintData.case_id || null,
      client_id: complaintData.client_id || null,
      client_name: complaintData.client_name || null,
      client_phone: complaintData.client_phone || null,
      status: TicketStatus.PENDING,
      organization_id: complaintData.organization_id || '',
    });
    return this.complaintTicketRepository.save(ticket);
  }

  async updateComplaintStatus(id: string, status: ComplaintStatus, assigneeId?: string, processNote?: string): Promise<ComplaintTicket> {
    const ticket = await this.complaintTicketRepository.findOne({ where: { id } });
    if (!ticket) return null;
    const updateData: Partial<ComplaintTicket> = {
      status: this.complaintStatusToTicketStatusMap[status] || TicketStatus.PROCESSING,
    };
    if (assigneeId) {
      updateData.handler_id = assigneeId;
    }
    // 处理记录追加到 process_records（JSON 数组）
    if (processNote) {
      const records = ticket.process_records ? JSON.parse(ticket.process_records) : [];
      records.push({
        action: 'status_change',
        operator_id: assigneeId || '',
        content: processNote,
        from_status: ticket.status,
        to_status: updateData.status,
        created_at: new Date().toISOString(),
      });
      updateData.process_records = JSON.stringify(records);
    }
    Object.assign(ticket, updateData);
    return this.complaintTicketRepository.save(ticket);
  }

  async closeComplaint(id: string, resolution: string, satisfactionScore?: number): Promise<ComplaintTicket> {
    const ticket = await this.complaintTicketRepository.findOne({ where: { id } });
    if (!ticket) return null;
    ticket.status = TicketStatus.CLOSED;
    ticket.resolution = resolution;
    ticket.satisfaction_score = satisfactionScore;
    ticket.closed_at = new Date();
    // 追加结案处理记录
    const records = ticket.process_records ? JSON.parse(ticket.process_records) : [];
    records.push({
      action: 'close',
      operator_id: '',
      content: resolution,
      from_status: ticket.status,
      to_status: TicketStatus.CLOSED,
      created_at: new Date().toISOString(),
    });
    ticket.process_records = JSON.stringify(records);
    return this.complaintTicketRepository.save(ticket);
  }

  async getComplaints(orgId: string, status?: ComplaintStatus): Promise<ComplaintTicket[]> {
    const query: any = {};
    if (orgId) {
      query.organization_id = orgId;
    }
    if (status) {
      query.status = this.complaintStatusToTicketStatusMap[status] || TicketStatus.PROCESSING;
    }
    return this.complaintTicketRepository.find({ where: query, order: { created_at: 'DESC' } });
  }

  async getComplaintById(id: string): Promise<ComplaintTicket> {
    return this.complaintTicketRepository.findOne({ where: { id } });
  }

  async createMarketingContent(contentData: Partial<MarketingContent>): Promise<MarketingContent> {
    const content = this.marketingContentRepository.create(contentData);
    const issues: string[] = [];
    const suggestions: string[] = [];

    for (const [key, keywords] of Object.entries(VIOLATION_KEYWORDS)) {
      for (const keyword of keywords) {
        if (content.content.includes(keyword)) {
          issues.push(`包含${key === 'absolute' ? '绝对化用语' : key === 'promise' ? '违规承诺' : '夸大宣传'}: ${keyword}`);
          suggestions.push(`请修改"${keyword}"表述`);
        }
      }
    }

    content.compliance_issues = issues.length > 0 ? issues.join('; ') : null;
    content.compliance_suggestions = suggestions.length > 0 ? suggestions.join('; ') : null;
    content.status = issues.length > 0 ? ContentStatus.PENDING_REVIEW : ContentStatus.APPROVED;

    return this.marketingContentRepository.save(content);
  }

  async reviewMarketingContent(id: string, reviewerId: string, status: ContentStatus, issues?: string): Promise<MarketingContent> {
    await this.marketingContentRepository.update(id, {
      status,
      reviewer_id: reviewerId,
      review_time: new Date(),
      compliance_issues: issues || null,
    });
    return this.marketingContentRepository.findOne({ where: { id } });
  }

  async getMarketingContents(orgId: string, status?: string): Promise<MarketingContent[]> {
    const query: any = {};
    if (orgId) {
      query.organization_id = orgId;
    }
    if (status) {
      query.status = status;
    }
    return this.marketingContentRepository.find({ where: query, order: { created_at: 'DESC' } });
  }

  async createSalesCompliance(salesData: Partial<SalesCompliance>): Promise<SalesCompliance> {
    const sales = this.salesComplianceRepository.create(salesData);

    if (sales.content) {
      const issues: string[] = [];
      for (const [key, keywords] of Object.entries(VIOLATION_KEYWORDS)) {
        for (const keyword of keywords) {
          if (sales.content.includes(keyword)) {
            issues.push(`包含${key === 'absolute' ? '绝对化用语' : key === 'promise' ? '违规承诺' : '夸大宣传'}: ${keyword}`);
          }
        }
      }
      sales.violation_details = issues.length > 0 ? issues.join('; ') : null;
      sales.check_result = issues.length > 0 ? SalesCheckResult.VIOLATION : SalesCheckResult.PASS;
    }

    return this.salesComplianceRepository.save(sales);
  }

  async recordRiskDisclosure(leadId: string, content: string): Promise<SalesCompliance> {
    const record = await this.salesComplianceRepository.findOne({ where: { lead_id: leadId } });
    if (record) {
      record.risk_disclosure_accepted = true;
      record.risk_disclosure_time = new Date();
      record.risk_disclosure_content = content;
      return this.salesComplianceRepository.save(record);
    }
    return null;
  }

  async getSalesComplianceRecords(orgId: string, leadId?: string): Promise<SalesCompliance[]> {
    const query: any = {};
    if (orgId) {
      query.organization_id = orgId;
    }
    if (leadId) {
      query.lead_id = leadId;
    }
    return this.salesComplianceRepository.find({ where: query, order: { created_at: 'DESC' } });
  }

  async createSigningCompliance(signingData: Partial<SigningCompliance>): Promise<SigningCompliance> {
    const signing = this.signingComplianceRepository.create(signingData);
    
    const issues: string[] = [];
    if (signing.contract_content) {
      for (const [key, keywords] of Object.entries(VIOLATION_KEYWORDS)) {
        for (const keyword of keywords) {
          if (signing.contract_content.includes(keyword)) {
            issues.push(`合同内容包含${key === 'absolute' ? '绝对化用语' : key === 'promise' ? '违规承诺' : '夸大宣传'}: ${keyword}`);
          }
        }
      }
    }

    signing.contract_compliance_issues = issues.length > 0 ? issues.join('; ') : null;
    signing.contract_compliance_passed = issues.length === 0;
    signing.lawyer_qualification_verified = true;

    return this.signingComplianceRepository.save(signing);
  }

  async signRiskDisclosure(id: string): Promise<SigningCompliance> {
    await this.signingComplianceRepository.update(id, {
      risk_disclosure_signed: true,
      risk_disclosure_time: new Date(),
    });
    return this.signingComplianceRepository.findOne({ where: { id } });
  }

  async completeSigning(id: string): Promise<SigningCompliance> {
    const record = await this.signingComplianceRepository.findOne({ where: { id } });
    if (record && record.risk_disclosure_signed && record.lawyer_qualification_verified && record.contract_compliance_passed) {
      record.status = SigningStatus.SIGNED;
      record.signed_time = new Date();
      return this.signingComplianceRepository.save(record);
    }
    return record;
  }

  async getSigningCompliance(orgId: string, caseId?: string): Promise<SigningCompliance[]> {
    const query: any = {};
    if (orgId) {
      query.organization_id = orgId;
    }
    if (caseId) {
      query.case_id = caseId;
    }
    return this.signingComplianceRepository.find({ where: query, order: { created_at: 'DESC' } });
  }

  async createCaseSOP(caseId: string, caseType: string, orgId: string): Promise<CaseTask[]> {
    const today = new Date();
    const tasks: CaseTask[] = [];

    // Phase4 H7: 优先从案件SOP模板表读取默认模板，按阶段/任务展开为CaseTask节点
    const template = await this.caseSOPTemplateRepository.findOne({
      where: { case_type: caseType as any, is_default: true, enabled: true },
      order: { created_at: 'DESC' },
    });

    if (template && Array.isArray(template.stages) && template.stages.length > 0) {
      // 将模板的阶段/任务扁平化为有序的CaseTask记录
      for (const stage of template.stages) {
        const tasksInStage = Array.isArray(stage.tasks) ? stage.tasks : [];
        for (const task of tasksInStage) {
          const deadline = new Date(today);
          deadline.setDate(today.getDate() + (task.deadline_days || 0));

          const caseTask = this.caseTaskRepository.create({
            case_id: caseId,
            sop_template_id: template.id,
            stage_id: stage.stage_id || `stage_${stage.order}`,
            stage_name: stage.stage_name || '',
            stage_order: stage.order || 0,
            task_id: task.task_id || `task_${Date.now()}`,
            task_name: task.task_name,
            status: CaseTaskStatus.PENDING,
            deadline,
            is_required: true,
            deadline_days: task.deadline_days || 0,
            description: `案件类型: ${caseType}`,
          });
          tasks.push(await this.caseTaskRepository.save(caseTask));
        }
      }
      if (tasks.length > 0) {
        return tasks;
      }
    }

    // 模板表中未找到匹配模板时，保留原有硬编码模板逻辑兜底
    const templates = CASE_SOP_TEMPLATES[caseType] || CASE_SOP_TEMPLATES['other'];

    for (let i = 0; i < templates.length; i++) {
      const deadline = new Date(today);
      deadline.setDate(today.getDate() + templates[i].days_to_deadline);

      const caseTask = this.caseTaskRepository.create({
        case_id: caseId,
        sop_template_id: null,
        stage_id: `stage_${i + 1}`,
        stage_name: templates[i].step_name,
        stage_order: i + 1,
        task_id: `task_${i + 1}`,
        task_name: templates[i].step_name,
        status: CaseTaskStatus.PENDING,
        deadline,
        is_required: true,
        deadline_days: templates[i].days_to_deadline,
        description: `案件类型: ${caseType}`,
      });
      tasks.push(await this.caseTaskRepository.save(caseTask));
    }

    return tasks;
  }

  /**
   * Phase4 M3: 创建投诉工单（客户投诉走合规通道）
   * 将客户投诉同步生成一条 ComplaintTicket，由合规通道跟进处理
   */
  async createComplaintTicket(ticketData: {
    source_channel?: TicketSourceChannel;
    complaint_type?: string;
    severity_level?: TicketSeverity;
    title: string;
    content: string;
    case_id?: string;
    client_id?: string;
    client_name?: string;
    client_phone?: string;
    organization_id: string;
  }): Promise<ComplaintTicket> {
    const ticketNumber = `TK${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const ticket = this.complaintTicketRepository.create({
      ticket_number: ticketNumber,
      source_channel: ticketData.source_channel ?? TicketSourceChannel.CLIENT_PORTAL,
      complaint_type: (ticketData.complaint_type || 'other') as any,
      severity_level: ticketData.severity_level ?? TicketSeverity.MEDIUM,
      title: ticketData.title,
      content: ticketData.content,
      case_id: ticketData.case_id || null,
      client_id: ticketData.client_id || null,
      client_name: ticketData.client_name || null,
      client_phone: ticketData.client_phone || null,
      status: TicketStatus.PENDING,
      organization_id: ticketData.organization_id,
    });
    return this.complaintTicketRepository.save(ticket);
  }

  async completeCaseSOP(id: string, operatorId: string, notes?: string): Promise<CaseTask> {
    const task = await this.caseTaskRepository.findOne({ where: { id } });
    if (!task) return null;
    task.status = CaseTaskStatus.COMPLETED;
    task.completed_at = new Date();
    task.assignee_id = operatorId;
    task.result = notes || task.result;
    return this.caseTaskRepository.save(task);
  }

  async verifyEvidence(id: string, checkResult: string): Promise<CaseTask> {
    const task = await this.caseTaskRepository.findOne({ where: { id } });
    if (!task) return null;
    task.status = CaseTaskStatus.VERIFIED;
    task.result = checkResult;
    return this.caseTaskRepository.save(task);
  }

  async getCaseSOP(caseId?: string): Promise<CaseTask[]> {
    const query: any = {};
    if (caseId) {
      query.case_id = caseId;
    }
    return this.caseTaskRepository.find({ where: query, order: { stage_order: 'ASC' } });
  }

  async getCaseSOPStats(orgId: string): Promise<{ pending: number; completed: number; overdue: number }> {
    // CaseTask 无 organization_id 字段，通过 case_id join cases 表按组织过滤
    // 注意：Case 实体表名为 cases（复数），不是 case
    const qb = this.caseTaskRepository
      .createQueryBuilder('t')
      .innerJoin('cases', 'c', 'c.id = t.case_id')
      .where('c.organization_id = :orgId', { orgId });

    const pending = await qb.clone().andWhere('t.status = :status', { status: CaseTaskStatus.PENDING }).getCount();
    const completed = await qb.clone().andWhere('t.status = :status', { status: CaseTaskStatus.COMPLETED }).getCount();
    const overdue = await qb.clone().andWhere('t.status = :status', { status: CaseTaskStatus.OVERDUE }).getCount();
    return { pending, completed, overdue };
  }

  // ========== 谈案AI质检方法 ==========

  async runTalkQualityCheck(inviteTaskId: string, checkType: string, content: string, orgId: string, inviterId: string): Promise<TalkQualityCheck> {
    let checkResult = TalkCheckResult.PASS;
    let violationType: TalkViolationType | null = null;
    let violationContent = '';
    let violationKeyword = '';

    // 使用已有的 VIOLATION_KEYWORDS 进行关键词检测
    for (const [key, keywords] of Object.entries(VIOLATION_KEYWORDS)) {
      for (const keyword of keywords) {
        if (content.includes(keyword)) {
          violationContent += `${keyword} `;
          violationKeyword += `${keyword} `;

          // 根据违规类型映射
          if (key === 'absolute') {
            violationType = TalkViolationType.OTHER;
          } else if (key === 'promise') {
            violationType = TalkViolationType.FALSE_PROMISE;
          } else if (key === 'exaggerate') {
            violationType = TalkViolationType.EXAGGERATE;
          }

          // 首次命中设置为 WARNING，后续违规升级为 VIOLATION
          if (checkResult === TalkCheckResult.PASS) {
            checkResult = TalkCheckResult.WARNING;
          } else if (checkResult === TalkCheckResult.WARNING) {
            checkResult = TalkCheckResult.VIOLATION;
          }
        }
      }
    }

    // 如果有违规内容但未明确分类，标记为 OTHER
    if (violationContent && !violationType) {
      violationType = TalkViolationType.OTHER;
    }

    const record = this.talkQualityCheckRepository.create({
      invite_task_id: inviteTaskId,
      check_type: checkType as TalkCheckType,
      violation_type: violationType,
      violation_content: violationContent || null,
      violation_keyword: violationKeyword || null,
      check_result: checkResult,
      handle_status: TalkHandleStatus.PENDING,
      organization_id: orgId,
      inviter_id: inviterId,
      notified: false,
    });

    return this.talkQualityCheckRepository.save(record);
  }

  async getTalkQualityChecks(orgId: string, handleStatus?: string): Promise<TalkQualityCheck[]> {
    const query: any = { organization_id: orgId };
    if (handleStatus) {
      query.handle_status = handleStatus;
    }
    return this.talkQualityCheckRepository.find({ where: query, order: { created_at: 'DESC' } });
  }

  async handleQualityCheck(id: string, handlerId: string, handleNote: string): Promise<TalkQualityCheck> {
    await this.talkQualityCheckRepository.update(id, {
      handler_id: handlerId,
      handle_note: handleNote,
      handle_status: TalkHandleStatus.PROCESSED,
      handled_at: new Date(),
    });
    const result = await this.talkQualityCheckRepository.findOne({ where: { id } });
    await this.notificationService.notify({
      receiver_id: '',
      title: '质检结果通知',
      content: `质检结果：${result.check_result || 'unknown'}`,
      type: 'compliance',
      level: (result.check_result as string) === 'reject' ? 'high' : 'normal',
      related_type: 'ComplianceRecord',
      related_id: result.id || '',
    });
    return result;
  }

  async getQualityCheckStats(orgId: string): Promise<{ total: number; pass: number; violation: number; warning: number; pending: number; processed: number }> {
    const query: any = { organization_id: orgId };
    const all = await this.talkQualityCheckRepository.find({ where: query });

    const total = all.length;
    const pass = all.filter(r => r.check_result === TalkCheckResult.PASS).length;
    const violation = all.filter(r => r.check_result === TalkCheckResult.VIOLATION).length;
    const warning = all.filter(r => r.check_result === TalkCheckResult.WARNING).length;
    const pending = all.filter(r => r.handle_status === TalkHandleStatus.PENDING).length;
    const processed = all.filter(r => r.handle_status === TalkHandleStatus.PROCESSED).length;

    return { total, pass, violation, warning, pending, processed };
  }

  // ========== 合规档案导出方法 ==========

  async exportComplianceArchive(orgId: string, filters?: {
    type?: ComplianceType;
    start_date?: string;
    end_date?: string;
  }): Promise<any> {
    const result: any = {
      export_time: new Date().toISOString(),
      org_id: orgId,
      filters: filters || {},
      compliance_records: [],
      complaints: [],
      marketing_contents: [],
      sales_compliance: [],
      signing_compliance: [],
      quality_checks: [],
      summary: {},
    };

    const recordQuery: any = { organization_id: orgId };
    if (filters?.type) recordQuery.type = filters.type;
    if (filters?.start_date) recordQuery.created_at = { ...recordQuery.created_at, $gte: filters.start_date } as any;
    if (filters?.end_date) recordQuery.created_at = { ...recordQuery.created_at, $lte: filters.end_date } as any;

    result.compliance_records = await this.complianceRecordRepository.find({
      where: recordQuery,
      order: { created_at: 'DESC' },
    });

    result.complaints = await this.complaintTicketRepository.find({
      where: { organization_id: orgId },
      order: { created_at: 'DESC' },
    });

    result.marketing_contents = await this.marketingContentRepository.find({
      where: { organization_id: orgId },
      order: { created_at: 'DESC' },
    });

    result.sales_compliance = await this.salesComplianceRepository.find({
      where: { organization_id: orgId },
      order: { created_at: 'DESC' },
    });

    result.signing_compliance = await this.signingComplianceRepository.find({
      where: { organization_id: orgId },
      order: { created_at: 'DESC' },
    });

    result.quality_checks = await this.talkQualityCheckRepository.find({
      where: { organization_id: orgId },
      order: { created_at: 'DESC' },
    });

    const totalRecords = result.compliance_records.length;
    const passCount = result.compliance_records.filter((r: ComplianceRecord) => r.result === ComplianceResult.PASS).length;
    const rejectCount = result.compliance_records.filter((r: ComplianceRecord) => r.result === ComplianceResult.REJECT).length;

    result.summary = {
      total_compliance_records: totalRecords,
      pass_count: passCount,
      reject_count: rejectCount,
      total_complaints: result.complaints.length,
      total_marketing_contents: result.marketing_contents.length,
      total_sales_compliance: result.sales_compliance.length,
      total_signing_compliance: result.signing_compliance.length,
      total_quality_checks: result.quality_checks.length,
    };

    return result;
  }

  async getExportTemplates(orgId: string): Promise<ReportTemplate[]> {
    const query: any = {};
    if (orgId) {
      query.organization_id = orgId;
    }
    return this.reportTemplateRepository.find({ where: query, order: { created_at: 'DESC' } });
  }

  async createExport(body: {
    template_id?: string;
    organization_id: string;
    exporter_id: string;
    export_format?: string;
    filters?: any;
  }): Promise<ReportExportLog> {
    const exportLog = this.reportExportLogRepository.create({
      template_id: body.template_id || null,
      exporter_id: body.exporter_id,
      export_format: body.export_format || 'excel',
      file_path: `exports/${Date.now()}_${body.exporter_id}.${body.export_format || 'xlsx'}`,
      file_size: 0,
      filters: body.filters ? JSON.stringify(body.filters) : null,
      organization_id: body.organization_id,
    });
    return this.reportExportLogRepository.save(exportLog);
  }

  async getExportHistory(orgId: string): Promise<ReportExportLog[]> {
    return this.reportExportLogRepository.find({
      where: { organization_id: orgId },
      order: { created_at: 'DESC' },
    });
  }

  // ========== 销售合规审查方法 ==========

  async getSalesComplianceReviews(orgId: string, status?: string): Promise<SalesCompliance[]> {
    const query: any = { organization_id: orgId };
    if (status) {
      query.review_status = status;
    }
    return this.salesComplianceRepository.find({
      where: query,
      order: { created_at: 'DESC' },
    });
  }

  async reviewSalesCompliance(id: string, reviewerId: string, result: string, note?: string, riskLevel?: string): Promise<SalesCompliance> {
    const updateData: Partial<SalesCompliance> = {
      review_status: result as SalesReviewStatus,
      reviewer_id: reviewerId,
      review_time: new Date(),
      review_note: note || null,
    };
    if (riskLevel) {
      updateData.risk_level = riskLevel as SalesRiskLevel;
    }
    await this.salesComplianceRepository.update(id, updateData);
    return this.salesComplianceRepository.findOne({ where: { id } });
  }

  async getSalesReviewStats(orgId: string): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    pass: number;
    warning: number;
    violation: number;
    risk_distribution: { low: number; medium: number; high: number };
  }> {
    const records = await this.salesComplianceRepository.find({
      where: { organization_id: orgId },
    });

    const total = records.length;
    const pending = records.filter(r => r.review_status === SalesReviewStatus.PENDING).length;
    const approved = records.filter(r => r.review_status === SalesReviewStatus.APPROVED).length;
    const rejected = records.filter(r => r.review_status === SalesReviewStatus.REJECTED).length;
    const pass = records.filter(r => r.check_result === SalesCheckResult.PASS).length;
    const warning = records.filter(r => r.check_result === SalesCheckResult.WARNING).length;
    const violation = records.filter(r => r.check_result === SalesCheckResult.VIOLATION).length;
    const low = records.filter(r => r.risk_level === SalesRiskLevel.LOW).length;
    const medium = records.filter(r => r.risk_level === SalesRiskLevel.MEDIUM).length;
    const high = records.filter(r => r.risk_level === SalesRiskLevel.HIGH).length;

    return { total, pending, approved, rejected, pass, warning, violation, risk_distribution: { low, medium, high } };
  }
}
