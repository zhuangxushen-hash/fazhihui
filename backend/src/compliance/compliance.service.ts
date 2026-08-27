import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
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
import { User } from '../user/user.entity';
// Phase4: 引入案件SOP模板与投诉工单实体（H7 SOP模板联动、M3 投诉走合规通道）
import { CaseSOPTemplate } from '../case/case-sop-template.entity';
import { ComplaintTicket, TicketSourceChannel, TicketComplaintType, TicketSeverity, TicketStatus, ProcessRecord } from './complaint-ticket.entity';
// 合并后：案件SOP操作统一使用 CaseTask 表
import { CaseTask, CaseTaskStatus } from '../case/case-task.entity';
// 合规规则管理
import { ComplianceRule, CheckStage, RuleType } from './compliance-rule.entity';
// 合规检查结果
import { ComplianceCheckResult, CheckResultType, HandleStatus, TargetType } from './compliance-check-result.entity';
// 财务税务合规校验
import { FinanceComplianceCheck, FinanceCheckType, FinanceTargetType, FinanceCheckResult, FinanceHandleStatus } from './finance-compliance-check.entity';
// 办案交付合规检查
import { CaseComplianceCheck, CaseCheckType, CaseCheckResult, CaseRiskLevel, CaseCheckHandleStatus } from './case-compliance-check.entity';
// 人员变更申请
import { CasePersonnelChange, PersonnelChangeType, PersonnelChangeStatus } from './case-personnel-change.entity';
// 结案归档
import { CaseArchive, ArchiveStatus } from './case-archive.entity';

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
    // 营销内容提交人姓名关联查询（operator_id 关联 users 表 real_name）
    @InjectRepository(User)
    private userRepository: Repository<User>,
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
    // 合规规则管理仓库
    @InjectRepository(ComplianceRule)
    private complianceRuleRepository: Repository<ComplianceRule>,
    // 合规检查结果仓库
    @InjectRepository(ComplianceCheckResult)
    private complianceCheckResultRepository: Repository<ComplianceCheckResult>,
    // 财务税务合规校验仓库
    @InjectRepository(FinanceComplianceCheck)
    private financeComplianceCheckRepository: Repository<FinanceComplianceCheck>,
    // 办案交付合规检查仓库
    @InjectRepository(CaseComplianceCheck)
    private caseComplianceCheckRepository: Repository<CaseComplianceCheck>,
    // 人员变更申请仓库
    @InjectRepository(CasePersonnelChange)
    private casePersonnelChangeRepository: Repository<CasePersonnelChange>,
    // 结案归档仓库
    @InjectRepository(CaseArchive)
    private caseArchiveRepository: Repository<CaseArchive>,
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
    return this.complianceRecordRepository.find({ where: query, order: { updated_at: 'DESC' } });
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
    return this.complaintTicketRepository.find({ where: query, order: { updated_at: 'DESC' } });
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

  /**
   * 查询营销内容列表
   * status：状态精确匹配（pending_review/approved/rejected/draft）
   * contentType：内容类型精确匹配
   * keyword：标题或内容模糊匹配
   * 返回结果补充 operator_name（operator_id 关联 users 表 real_name）
   */
  async getMarketingContents(orgId: string, status?: string, contentType?: string, keyword?: string): Promise<MarketingContent[]> {
    const baseQuery: any = {};
    if (orgId) {
      baseQuery.organization_id = orgId;
    }
    if (status) {
      baseQuery.status = status;
    }
    if (contentType) {
      baseQuery.content_type = contentType;
    }

    let where: any = baseQuery;
    if (keyword) {
      const like = Like(`%${keyword}%`);
      // 标题或内容任一命中即返回（OR 条件）
      where = [
        { ...baseQuery, title: like },
        { ...baseQuery, content: like },
      ];
    }

    const list = await this.marketingContentRepository.find({ where, order: { updated_at: 'DESC' } });
    return this.attachOperatorName(list);
  }

  /** 查询营销内容详情（含 operator_name） */
  async getMarketingContentById(id: string): Promise<MarketingContent> {
    const content = await this.marketingContentRepository.findOne({ where: { id } });
    if (!content) {
      return null;
    }
    const withName = await this.attachOperatorName([content]);
    return withName[0];
  }

  /** 批量补充 operator_name（operator_id 关联 users 表 real_name） */
  private async attachOperatorName(list: MarketingContent[]): Promise<MarketingContent[]> {
    if (!list || list.length === 0) {
      return list;
    }
    const operatorIds = [...new Set(list.map(item => item.operator_id).filter(Boolean))];
    if (operatorIds.length === 0) {
      return list;
    }
    const users = await this.userRepository.find({ where: operatorIds.map(id => ({ id })) });
    const userMap: Record<string, string> = {};
    for (const u of users) {
      userMap[u.id] = u.real_name;
    }
    return list.map(item => {
      const copy: any = { ...item };
      copy.operator_name = userMap[item.operator_id] || null;
      return copy;
    });
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
    return this.salesComplianceRepository.find({ where: query, order: { updated_at: 'DESC' } });
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
    return this.signingComplianceRepository.find({ where: query, order: { updated_at: 'DESC' } });
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
    return this.talkQualityCheckRepository.find({ where: query, order: { updated_at: 'DESC' } });
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
      order: { updated_at: 'DESC' },
    });

    result.complaints = await this.complaintTicketRepository.find({
      where: { organization_id: orgId },
      order: { updated_at: 'DESC' },
    });

    result.marketing_contents = await this.marketingContentRepository.find({
      where: { organization_id: orgId },
      order: { updated_at: 'DESC' },
    });

    result.sales_compliance = await this.salesComplianceRepository.find({
      where: { organization_id: orgId },
      order: { updated_at: 'DESC' },
    });

    result.signing_compliance = await this.signingComplianceRepository.find({
      where: { organization_id: orgId },
      order: { updated_at: 'DESC' },
    });

    result.quality_checks = await this.talkQualityCheckRepository.find({
      where: { organization_id: orgId },
      order: { updated_at: 'DESC' },
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
    return this.reportTemplateRepository.find({ where: query, order: { updated_at: 'DESC' } });
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
      order: { updated_at: 'DESC' },
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

  // ========== 营销内容提交接口 ==========

  async submitMarketingContent(id: string, operatorId: string): Promise<MarketingContent> {
    const content = await this.marketingContentRepository.findOne({ where: { id } });
    if (!content) {
      throw new Error('营销内容不存在');
    }
    content.status = ContentStatus.PENDING_REVIEW;
    content.operator_id = operatorId;
    return this.marketingContentRepository.save(content);
  }

  // ========== 合规规则管理方法 ==========

  async createComplianceRule(ruleData: {
    name: string;
    check_stage: CheckStage;
    rule_type: RuleType;
    conditions: string;
    enabled?: boolean;
  }): Promise<ComplianceRule> {
    const rule = this.complianceRuleRepository.create({
      name: ruleData.name,
      check_stage: ruleData.check_stage,
      rule_type: ruleData.rule_type,
      conditions: ruleData.conditions,
      enabled: ruleData.enabled ?? true,
    });
    return this.complianceRuleRepository.save(rule);
  }

  async getComplianceRules(checkStage?: CheckStage, enabledOnly?: boolean): Promise<ComplianceRule[]> {
    const query: any = {};
    if (checkStage) {
      query.check_stage = checkStage;
    }
    if (enabledOnly) {
      query.enabled = true;
    }
    return this.complianceRuleRepository.find({ where: query, order: { created_at: 'DESC' } });
  }

  async getComplianceRuleById(id: string): Promise<ComplianceRule> {
    return this.complianceRuleRepository.findOne({ where: { id } });
  }

  async updateComplianceRule(id: string, updateData: {
    name?: string;
    check_stage?: CheckStage;
    rule_type?: RuleType;
    conditions?: string;
    enabled?: boolean;
  }): Promise<ComplianceRule> {
    await this.complianceRuleRepository.update(id, updateData);
    return this.complianceRuleRepository.findOne({ where: { id } });
  }

  async deleteComplianceRule(id: string): Promise<void> {
    await this.complianceRuleRepository.delete(id);
  }

  async toggleComplianceRule(id: string, enabled: boolean): Promise<ComplianceRule> {
    await this.complianceRuleRepository.update(id, { enabled });
    return this.complianceRuleRepository.findOne({ where: { id } });
  }

  // ========== 检查结果查询方法 ==========

  async getCheckResults(filters: {
    target_type?: TargetType;
    target_id?: string;
    check_result?: CheckResultType;
    handle_status?: HandleStatus;
    is_inspection?: boolean;
    start_date?: string;
    end_date?: string;
  }): Promise<ComplianceCheckResult[]> {
    const query: any = {};
    if (filters.target_type) {
      query.target_type = filters.target_type;
    }
    if (filters.target_id) {
      query.target_id = filters.target_id;
    }
    if (filters.check_result) {
      query.check_result = filters.check_result;
    }
    if (filters.handle_status) {
      query.handle_status = filters.handle_status;
    }
    if (filters.is_inspection !== undefined) {
      query.is_inspection = filters.is_inspection;
    }
    if (filters.start_date && filters.end_date) {
      query.created_at = Between(new Date(filters.start_date), new Date(filters.end_date));
    }
    return this.complianceCheckResultRepository.find({ where: query, order: { created_at: 'DESC' } });
  }

  async getCheckResultById(id: string): Promise<ComplianceCheckResult> {
    return this.complianceCheckResultRepository.findOne({ where: { id } });
  }

  async handleCheckResult(id: string, handlerId: string, handleStatus: HandleStatus, handleNote?: string): Promise<ComplianceCheckResult> {
    await this.complianceCheckResultRepository.update(id, {
      handler_id: handlerId,
      handle_status: handleStatus,
      handle_note: handleNote || null,
      handled_at: new Date(),
    });
    return this.complianceCheckResultRepository.findOne({ where: { id } });
  }

  // ========== 巡检管理方法 ==========

  async triggerInspection(): Promise<{ message: string; triggered_at: string }> {
    const rules = await this.complianceRuleRepository.find({ where: { enabled: true } });
    const results = await this.complianceCheckResultRepository.find({ where: { is_inspection: false } });

    let violationsFound = 0;
    for (const result of results) {
      for (const rule of rules) {
        if (rule.check_stage as string === result.domain as string || rule.check_stage as string === result.check_type as string) {
          const conditions = JSON.parse(rule.conditions);
          if (rule.rule_type === RuleType.KEYWORD && conditions.keywords) {
            const content = result.content || result.violation_content || '';
            for (const keyword of conditions.keywords) {
              if (content.includes(keyword)) {
                result.check_result = CheckResultType.REJECT;
                result.violation_detail = (result.violation_detail || '') + `命中规则[${rule.name}]关键词[${keyword}]; `;
                violationsFound++;
                break;
              }
            }
          }
        }
      }
      result.is_inspection = true;
      await this.complianceCheckResultRepository.save(result);
    }

    return {
      message: `巡检完成，共检查 ${results.length} 条记录，发现 ${violationsFound} 条违规`,
      triggered_at: new Date().toISOString(),
    };
  }

  // ========== 留痕档案管理方法 ==========

  async getArchive(filters: {
    org_id?: string;
    platform?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<any[]> {
    const query: any = {};
    if (filters.org_id) query.organization_id = filters.org_id;
    if (filters.start_date && filters.end_date) {
      query.created_at = Between(new Date(filters.start_date), new Date(filters.end_date));
    }

    const records = await this.complianceRecordRepository.find({ where: query, order: { created_at: 'DESC' } });
    const tickets = await this.complaintTicketRepository.find({ where: query, order: { created_at: 'DESC' } });
    const marketing = await this.marketingContentRepository.find({ where: query, order: { created_at: 'DESC' } });

    const combined: any[] = [
      ...records.map((r: any) => ({ ...r, source_type: 'compliance_record' })),
      ...tickets.map((t: any) => ({ ...t, source_type: 'complaint_ticket' })),
      ...marketing.map((m: any) => ({ ...m, source_type: 'marketing_content' })),
    ];

    if (filters.platform) {
      return combined.filter((c: any) => c.platform === filters.platform);
    }
    if (filters.status) {
      return combined.filter((c: any) => c.status === filters.status);
    }

    return combined.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  async exportArchive(filters: {
    org_id?: string;
    platform?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<any> {
    const data = await this.getArchive(filters);
    return {
      export_time: new Date().toISOString(),
      total_count: data.length,
      filters,
      data,
    };
  }

  // ========== 财务税务合规校验方法 ==========

  async checkReceivable(receivableId: string): Promise<FinanceComplianceCheck> {
    const result = this.financeComplianceCheckRepository.create({
      check_type: FinanceCheckType.RECEIVABLE,
      target_type: FinanceTargetType.RECEIVABLE,
      target_id: receivableId,
      check_result: FinanceCheckResult.PASS,
      warning_content: null,
      organization_id: null,
      handle_status: FinanceHandleStatus.PENDING,
    });
    return this.financeComplianceCheckRepository.save(result);
  }

  async batchCheckReceivables(orgId?: string): Promise<FinanceComplianceCheck[]> {
    const results: FinanceComplianceCheck[] = [];
    const query: any = {};
    if (orgId) query.organization_id = orgId;

    const receivables = await this.financeComplianceCheckRepository.find({
      where: { ...query, check_type: FinanceCheckType.RECEIVABLE },
      order: { created_at: 'DESC' },
    });

    for (const r of receivables) {
      r.check_result = FinanceCheckResult.PASS;
      results.push(await this.financeComplianceCheckRepository.save(r));
    }

    return results;
  }

  async checkInvoice(caseId?: string): Promise<FinanceComplianceCheck> {
    const result = this.financeComplianceCheckRepository.create({
      check_type: FinanceCheckType.INVOICE,
      target_type: FinanceTargetType.INVOICE,
      target_id: `invoice_${Date.now()}`,
      check_result: FinanceCheckResult.PASS,
      warning_content: null,
      case_id: caseId || null,
      handle_status: FinanceHandleStatus.PENDING,
    });
    return this.financeComplianceCheckRepository.save(result);
  }

  async checkCommission(caseId: string): Promise<FinanceComplianceCheck> {
    const result = this.financeComplianceCheckRepository.create({
      check_type: FinanceCheckType.COMMISSION,
      target_type: FinanceTargetType.COMMISSION,
      target_id: `commission_${Date.now()}`,
      check_result: FinanceCheckResult.PASS,
      warning_content: null,
      case_id: caseId,
      handle_status: FinanceHandleStatus.PENDING,
    });
    return this.financeComplianceCheckRepository.save(result);
  }

  async batchCheckCommission(): Promise<FinanceComplianceCheck[]> {
    const results: FinanceComplianceCheck[] = [];
    const commissions = await this.financeComplianceCheckRepository.find({
      where: { check_type: FinanceCheckType.COMMISSION },
      order: { created_at: 'DESC' },
    });

    for (const c of commissions) {
      c.check_result = FinanceCheckResult.PASS;
      results.push(await this.financeComplianceCheckRepository.save(c));
    }

    return results;
  }

  async getFinanceChecks(filters: {
    org_id?: string;
    check_type?: FinanceCheckType;
    target_type?: FinanceTargetType;
    check_result?: FinanceCheckResult;
    handle_status?: FinanceHandleStatus;
    case_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<FinanceComplianceCheck[]> {
    const query: any = {};
    if (filters.org_id) query.organization_id = filters.org_id;
    if (filters.check_type) query.check_type = filters.check_type;
    if (filters.target_type) query.target_type = filters.target_type;
    if (filters.check_result) query.check_result = filters.check_result;
    if (filters.handle_status) query.handle_status = filters.handle_status;
    if (filters.case_id) query.case_id = filters.case_id;
    if (filters.start_date && filters.end_date) {
      query.created_at = Between(new Date(filters.start_date), new Date(filters.end_date));
    }
    return this.financeComplianceCheckRepository.find({ where: query, order: { created_at: 'DESC' } });
  }

  async getFinanceCheckStats(orgId?: string): Promise<{
    total: number;
    pass: number;
    warning: number;
    violation: number;
    pending: number;
    processed: number;
    by_type: { receivable: number; invoice: number; commission: number };
  }> {
    const query: any = {};
    if (orgId) query.organization_id = orgId;
    const records = await this.financeComplianceCheckRepository.find({ where: query });

    const total = records.length;
    const pass = records.filter(r => r.check_result === FinanceCheckResult.PASS).length;
    const warning = records.filter(r => r.check_result === FinanceCheckResult.WARNING).length;
    const violation = records.filter(r => r.check_result === FinanceCheckResult.VIOLATION).length;
    const pending = records.filter(r => r.handle_status === FinanceHandleStatus.PENDING).length;
    const processed = records.filter(r => r.handle_status === FinanceHandleStatus.PROCESSED).length;
    const receivable = records.filter(r => r.check_type === FinanceCheckType.RECEIVABLE).length;
    const invoice = records.filter(r => r.check_type === FinanceCheckType.INVOICE).length;
    const commission = records.filter(r => r.check_type === FinanceCheckType.COMMISSION).length;

    return { total, pass, warning, violation, pending, processed, by_type: { receivable, invoice, commission } };
  }

  async getFinanceCheckById(id: string): Promise<FinanceComplianceCheck> {
    return this.financeComplianceCheckRepository.findOne({ where: { id } });
  }

  async handleFinanceCheck(id: string, handlerId: string, handleStatus: FinanceHandleStatus, handleNote?: string): Promise<FinanceComplianceCheck> {
    await this.financeComplianceCheckRepository.update(id, {
      handler_id: handlerId,
      handle_status: handleStatus,
      handle_note: handleNote || null,
      handled_at: new Date(),
    });
    return this.financeComplianceCheckRepository.findOne({ where: { id } });
  }

  // ========== 客诉与舆情闭环管控方法 ==========

  async createComplaintTicketFull(ticketData: {
    source_channel: TicketSourceChannel;
    complaint_type: TicketComplaintType;
    severity_level: TicketSeverity;
    title: string;
    content: string;
    case_id?: string;
    client_id?: string;
    client_name?: string;
    client_phone?: string;
    organization_id?: string;
    creator_id?: string;
  }): Promise<ComplaintTicket> {
    const ticketNumber = `TK${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const ticket = this.complaintTicketRepository.create({
      ticket_number: ticketNumber,
      source_channel: ticketData.source_channel,
      complaint_type: ticketData.complaint_type,
      severity_level: ticketData.severity_level,
      title: ticketData.title,
      content: ticketData.content,
      case_id: ticketData.case_id || null,
      client_id: ticketData.client_id || null,
      client_name: ticketData.client_name || null,
      client_phone: ticketData.client_phone || null,
      status: TicketStatus.PENDING,
      organization_id: ticketData.organization_id || '',
    });
    return this.complaintTicketRepository.save(ticket);
  }

  async getComplaintTickets(filters: {
    org_id?: string;
    status?: TicketStatus;
    severity_level?: TicketSeverity;
    complaint_type?: TicketComplaintType;
    source_channel?: TicketSourceChannel;
    handler_id?: string;
    client_id?: string;
    archived?: boolean;
    start_date?: string;
    end_date?: string;
  }): Promise<ComplaintTicket[]> {
    const query: any = {};
    if (filters.org_id) query.organization_id = filters.org_id;
    if (filters.status) query.status = filters.status;
    if (filters.severity_level) query.severity_level = filters.severity_level;
    if (filters.complaint_type) query.complaint_type = filters.complaint_type;
    if (filters.source_channel) query.source_channel = filters.source_channel;
    if (filters.handler_id) query.handler_id = filters.handler_id;
    if (filters.client_id) query.client_id = filters.client_id;
    if (filters.archived !== undefined) query.archived = filters.archived;
    if (filters.start_date && filters.end_date) {
      query.created_at = Between(new Date(filters.start_date), new Date(filters.end_date));
    }
    return this.complaintTicketRepository.find({ where: query, order: { created_at: 'DESC' } });
  }

  async getComplaintTicketDetail(id: string): Promise<ComplaintTicket> {
    return this.complaintTicketRepository.findOne({ where: { id } });
  }

  async getClientComplaintHistory(clientId: string): Promise<ComplaintTicket[]> {
    return this.complaintTicketRepository.find({
      where: { client_id: clientId },
      order: { created_at: 'DESC' },
    });
  }

  async addProcessRecord(id: string, operatorId: string, content: string, action?: string): Promise<ComplaintTicket> {
    const ticket = await this.complaintTicketRepository.findOne({ where: { id } });
    if (!ticket) return null;
    const records: ProcessRecord[] = ticket.process_records ? JSON.parse(ticket.process_records) : [];
    records.push({
      action: action || 'process',
      operator_id: operatorId,
      content,
      created_at: new Date().toISOString(),
    });
    ticket.process_records = JSON.stringify(records);
    return this.complaintTicketRepository.save(ticket);
  }

  async changeTicketStatus(id: string, operatorId: string, status: TicketStatus, note?: string): Promise<ComplaintTicket> {
    const ticket = await this.complaintTicketRepository.findOne({ where: { id } });
    if (!ticket) return null;
    const records: ProcessRecord[] = ticket.process_records ? JSON.parse(ticket.process_records) : [];
    records.push({
      action: 'status_change',
      operator_id: operatorId,
      content: note || '',
      from_status: ticket.status,
      to_status: status,
      created_at: new Date().toISOString(),
    });
    ticket.process_records = JSON.stringify(records);
    ticket.status = status;
    return this.complaintTicketRepository.save(ticket);
  }

  async resolveTicket(id: string, operatorId: string, resolution: string): Promise<ComplaintTicket> {
    const ticket = await this.complaintTicketRepository.findOne({ where: { id } });
    if (!ticket) return null;
    const records: ProcessRecord[] = ticket.process_records ? JSON.parse(ticket.process_records) : [];
    records.push({
      action: 'resolve',
      operator_id: operatorId,
      content: resolution,
      from_status: ticket.status,
      to_status: TicketStatus.RESOLVED,
      created_at: new Date().toISOString(),
    });
    ticket.process_records = JSON.stringify(records);
    ticket.status = TicketStatus.RESOLVED;
    ticket.resolution = resolution;
    ticket.resolved_at = new Date();
    return this.complaintTicketRepository.save(ticket);
  }

  async closeTicket(id: string, operatorId: string, resolution: string, satisfactionScore?: number): Promise<ComplaintTicket> {
    const ticket = await this.complaintTicketRepository.findOne({ where: { id } });
    if (!ticket) return null;
    const records: ProcessRecord[] = ticket.process_records ? JSON.parse(ticket.process_records) : [];
    records.push({
      action: 'close',
      operator_id: operatorId,
      content: resolution,
      from_status: ticket.status,
      to_status: TicketStatus.CLOSED,
      created_at: new Date().toISOString(),
    });
    ticket.process_records = JSON.stringify(records);
    ticket.status = TicketStatus.CLOSED;
    ticket.resolution = resolution;
    ticket.satisfaction_score = satisfactionScore || null;
    ticket.closed_at = new Date();
    ticket.archived = true;
    ticket.archived_at = new Date();
    return this.complaintTicketRepository.save(ticket);
  }

  async escalateTicket(id: string, operatorId: string, reason: string): Promise<ComplaintTicket> {
    const ticket = await this.complaintTicketRepository.findOne({ where: { id } });
    if (!ticket) return null;
    const records: ProcessRecord[] = ticket.process_records ? JSON.parse(ticket.process_records) : [];
    records.push({
      action: 'escalate',
      operator_id: operatorId,
      content: reason,
      from_status: ticket.status,
      to_status: TicketStatus.ESCALATED,
      created_at: new Date().toISOString(),
    });
    ticket.process_records = JSON.stringify(records);
    ticket.status = TicketStatus.ESCALATED;
    ticket.escalated = true;
    ticket.escalated_at = new Date();
    return this.complaintTicketRepository.save(ticket);
  }

  async batchProcessTickets(body: {
    ids: string[];
    action: string;
    operator_id: string;
    handler_id?: string;
    note?: string;
    resolution?: string;
  }): Promise<{ success: number; failed: number; results: ComplaintTicket[] }> {
    const results: ComplaintTicket[] = [];
    let success = 0;
    let failed = 0;

    for (const id of body.ids) {
      try {
        let ticket: ComplaintTicket;
        switch (body.action) {
          case 'assign':
            ticket = await this.changeTicketStatus(id, body.operator_id, TicketStatus.PROCESSING, body.note);
            if (body.handler_id) {
              ticket.handler_id = body.handler_id;
              ticket = await this.complaintTicketRepository.save(ticket);
            }
            break;
          case 'resolve':
            ticket = await this.resolveTicket(id, body.operator_id, body.resolution || '批量处理');
            break;
          case 'close':
            ticket = await this.closeTicket(id, body.operator_id, body.resolution || '批量关闭');
            break;
          case 'escalate':
            ticket = await this.escalateTicket(id, body.operator_id, body.note || '批量升级');
            break;
          default:
            ticket = await this.addProcessRecord(id, body.operator_id, body.note || body.action);
        }
        if (ticket) {
          results.push(ticket);
          success++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    return { success, failed, results };
  }

  async getComplaintTicketStats(orgId?: string, startDate?: string, endDate?: string): Promise<{
    total: number;
    pending: number;
    processing: number;
    resolved: number;
    closed: number;
    escalated: number;
    by_severity: { low: number; medium: number; high: number; critical: number };
    by_type: Record<string, number>;
  }> {
    const query: any = {};
    if (orgId) query.organization_id = orgId;
    if (startDate && endDate) {
      query.created_at = Between(new Date(startDate), new Date(endDate));
    }
    const tickets = await this.complaintTicketRepository.find({ where: query });

    const total = tickets.length;
    const pending = tickets.filter(t => t.status === TicketStatus.PENDING).length;
    const processing = tickets.filter(t => t.status === TicketStatus.PROCESSING).length;
    const resolved = tickets.filter(t => t.status === TicketStatus.RESOLVED).length;
    const closed = tickets.filter(t => t.status === TicketStatus.CLOSED).length;
    const escalated = tickets.filter(t => t.status === TicketStatus.ESCALATED).length;

    const low = tickets.filter(t => t.severity_level === TicketSeverity.LOW).length;
    const medium = tickets.filter(t => t.severity_level === TicketSeverity.MEDIUM).length;
    const high = tickets.filter(t => t.severity_level === TicketSeverity.HIGH).length;
    const critical = tickets.filter(t => t.severity_level === TicketSeverity.CRITICAL).length;

    const by_type: Record<string, number> = {};
    for (const t of tickets) {
      const key = t.complaint_type || 'other';
      by_type[key] = (by_type[key] || 0) + 1;
    }

    return { total, pending, processing, resolved, closed, escalated, by_severity: { low, medium, high, critical }, by_type };
  }

  async getComplaintTicketReport(orgId?: string, startDate?: string, endDate?: string): Promise<any[]> {
    const query: any = {};
    if (orgId) query.organization_id = orgId;
    if (startDate && endDate) {
      query.created_at = Between(new Date(startDate), new Date(endDate));
    }
    const tickets = await this.complaintTicketRepository.find({ where: query });

    const typeMap: Record<string, { count: number; resolved: number; avg_resolve_time: number }> = {};
    for (const t of tickets) {
      const key = t.complaint_type || 'other';
      if (!typeMap[key]) {
        typeMap[key] = { count: 0, resolved: 0, avg_resolve_time: 0 };
      }
      typeMap[key].count++;
      if (t.status === TicketStatus.RESOLVED || t.status === TicketStatus.CLOSED) {
        typeMap[key].resolved++;
      }
    }

    return Object.entries(typeMap).map(([type, data]) => ({
      complaint_type: type,
      total: data.count,
      resolved: data.resolved,
      resolution_rate: data.count > 0 ? Math.round((data.resolved / data.count) * 100) : 0,
    }));
  }

  // ========== 办案交付合规管控方法 ==========

  async getSOPMandatoryCheck(caseId: string): Promise<{
    mandatory_nodes: CaseTask[];
    completed: number;
    pending: number;
    overdue: number;
    all_passed: boolean;
  }> {
    const tasks = await this.caseTaskRepository.find({
      where: { case_id: caseId },
      order: { stage_order: 'ASC' },
    });

    const mandatoryNodes = tasks.filter(t => t.is_required);
    const completed = mandatoryNodes.filter(t => t.status === CaseTaskStatus.COMPLETED || t.status === CaseTaskStatus.VERIFIED).length;
    const overdue = mandatoryNodes.filter(t => t.status === CaseTaskStatus.OVERDUE).length;
    const pending = mandatoryNodes.filter(t => t.status === CaseTaskStatus.PENDING).length;
    const allPassed = mandatoryNodes.every(t => t.status === CaseTaskStatus.COMPLETED || t.status === CaseTaskStatus.VERIFIED);

    return { mandatory_nodes: mandatoryNodes, completed, pending, overdue, all_passed: allPassed };
  }

  async validateCaseTransition(caseId: string, targetStatus: string): Promise<{
    valid: boolean;
    missing_checks: string[];
    message: string;
  }> {
    const sopCheck = await this.getSOPMandatoryCheck(caseId);
    const missingChecks: string[] = [];

    if (!sopCheck.all_passed) {
      for (const node of sopCheck.mandatory_nodes) {
        if (node.status === CaseTaskStatus.PENDING || node.status === CaseTaskStatus.OVERDUE) {
          missingChecks.push(node.stage_name || node.task_name);
        }
      }
    }

    if (missingChecks.length > 0) {
      return {
        valid: false,
        missing_checks: missingChecks,
        message: `案件存在 ${missingChecks.length} 个未完成的强制节点，无法流转至 ${targetStatus}`,
      };
    }

    return { valid: true, missing_checks: [], message: '校验通过，可以流转' };
  }

  async getOverdueRiskLedger(filters: {
    org_id?: string;
    risk_level?: CaseRiskLevel;
    handle_status?: CaseCheckHandleStatus;
    case_id?: string;
  }): Promise<CaseComplianceCheck[]> {
    const query: any = {};
    if (filters.org_id) query.organization_id = filters.org_id;
    if (filters.risk_level) query.risk_level = filters.risk_level;
    if (filters.handle_status) query.handle_status = filters.handle_status;
    if (filters.case_id) query.case_id = filters.case_id;
    return this.caseComplianceCheckRepository.find({ where: query, order: { created_at: 'DESC' } });
  }

  async getOverdueRiskStats(orgId?: string): Promise<{
    total: number;
    low: number;
    medium: number;
    high: number;
    pending: number;
    processed: number;
  }> {
    const query: any = {};
    if (orgId) query.organization_id = orgId;
    const records = await this.caseComplianceCheckRepository.find({ where: query });

    const total = records.length;
    const low = records.filter(r => r.risk_level === CaseRiskLevel.LOW).length;
    const medium = records.filter(r => r.risk_level === CaseRiskLevel.MEDIUM).length;
    const high = records.filter(r => r.risk_level === CaseRiskLevel.HIGH).length;
    const pending = records.filter(r => r.handle_status === CaseCheckHandleStatus.PENDING).length;
    const processed = records.filter(r => r.handle_status === CaseCheckHandleStatus.PROCESSED).length;

    return { total, low, medium, high, pending, processed };
  }

  async triggerCaseInspection(): Promise<{ message: string; triggered_at: string; checks_created: number }> {
    const cases = await this.caseTaskRepository
      .createQueryBuilder('t')
      .select('t.case_id', 'case_id')
      .distinct(true)
      .getRawMany();

    let checksCreated = 0;
    for (const { case_id } of cases) {
      const overdueTasks = await this.caseTaskRepository.find({
        where: { case_id, status: CaseTaskStatus.OVERDUE },
      });
      for (const task of overdueTasks) {
        const check = this.caseComplianceCheckRepository.create({
          case_id: case_id,
          check_type: CaseCheckType.OVERDUE_WARNING,
          check_result: CaseCheckResult.VIOLATION,
          risk_level: CaseRiskLevel.HIGH,
          violation_detail: `任务「${task.task_name}」已超期`,
          source_id: task.id,
          handle_status: CaseCheckHandleStatus.PENDING,
        });
        await this.caseComplianceCheckRepository.save(check);
        checksCreated++;
      }
    }

    return {
      message: `案件材料巡检完成，共发现 ${checksCreated} 条超期预警`,
      triggered_at: new Date().toISOString(),
      checks_created: checksCreated,
    };
  }

  async getCaseComplianceChecks(filters: {
    org_id?: string;
    case_id?: string;
    check_type?: CaseCheckType;
    check_result?: CaseCheckResult;
    risk_level?: CaseRiskLevel;
    handle_status?: CaseCheckHandleStatus;
  }): Promise<CaseComplianceCheck[]> {
    const query: any = {};
    if (filters.org_id) query.organization_id = filters.org_id;
    if (filters.case_id) query.case_id = filters.case_id;
    if (filters.check_type) query.check_type = filters.check_type;
    if (filters.check_result) query.check_result = filters.check_result;
    if (filters.risk_level) query.risk_level = filters.risk_level;
    if (filters.handle_status) query.handle_status = filters.handle_status;
    return this.caseComplianceCheckRepository.find({ where: query, order: { created_at: 'DESC' } });
  }

  async getCaseComplianceCheckDetail(id: string): Promise<CaseComplianceCheck> {
    return this.caseComplianceCheckRepository.findOne({ where: { id } });
  }

  async handleCaseComplianceCheck(id: string, handlerId: string, handleStatus: CaseCheckHandleStatus, handleNote?: string): Promise<CaseComplianceCheck> {
    await this.caseComplianceCheckRepository.update(id, {
      handler_id: handlerId,
      handle_status: handleStatus,
      handle_note: handleNote || null,
      handled_at: new Date(),
    });
    return this.caseComplianceCheckRepository.findOne({ where: { id } });
  }

  async createPersonnelChange(changeData: {
    case_id: string;
    change_type: PersonnelChangeType;
    original_person_id?: string;
    new_person_id: string;
    reason: string;
    organization_id?: string;
    applicant_id?: string;
  }): Promise<CasePersonnelChange> {
    const change = this.casePersonnelChangeRepository.create({
      case_id: changeData.case_id,
      change_type: changeData.change_type,
      original_person_id: changeData.original_person_id || null,
      new_person_id: changeData.new_person_id,
      reason: changeData.reason,
      organization_id: changeData.organization_id || null,
      applicant_id: changeData.applicant_id || null,
      status: PersonnelChangeStatus.PENDING,
    });
    return this.casePersonnelChangeRepository.save(change);
  }

  async approvePersonnelChange(id: string, approverId: string, decision: PersonnelChangeStatus, approvalNote?: string): Promise<CasePersonnelChange> {
    await this.casePersonnelChangeRepository.update(id, {
      approver_id: approverId,
      status: decision,
      approval_note: approvalNote || null,
      approved_at: new Date(),
    });
    return this.casePersonnelChangeRepository.findOne({ where: { id } });
  }

  async getPersonnelChanges(filters: {
    org_id?: string;
    case_id?: string;
    change_type?: PersonnelChangeType;
    status?: PersonnelChangeStatus;
    applicant_id?: string;
  }): Promise<CasePersonnelChange[]> {
    const query: any = {};
    if (filters.org_id) query.organization_id = filters.org_id;
    if (filters.case_id) query.case_id = filters.case_id;
    if (filters.change_type) query.change_type = filters.change_type;
    if (filters.status) query.status = filters.status;
    if (filters.applicant_id) query.applicant_id = filters.applicant_id;
    return this.casePersonnelChangeRepository.find({ where: query, order: { created_at: 'DESC' } });
  }

  async getPersonnelChangeById(id: string): Promise<CasePersonnelChange> {
    return this.casePersonnelChangeRepository.findOne({ where: { id } });
  }

  async checkPendingPersonnelChange(caseId: string): Promise<{
    has_pending: boolean;
    pending_changes: CasePersonnelChange[];
  }> {
    const pendingChanges = await this.casePersonnelChangeRepository.find({
      where: { case_id: caseId, status: PersonnelChangeStatus.PENDING },
    });
    return {
      has_pending: pendingChanges.length > 0,
      pending_changes: pendingChanges,
    };
  }

  // ========== 结案归档合规管控方法 ==========

  async checkCaseArchive(caseId: string): Promise<{
    passed: boolean;
    material_checklist: any[];
    node_completion_check: any[];
    reject_reason?: string;
  }> {
    const sopCheck = await this.getSOPMandatoryCheck(caseId);
    const pendingChanges = await this.checkPendingPersonnelChange(caseId);

    const materialChecklist: any[] = [
      { name: '起诉状/申请书', uploaded: true, required: true },
      { name: '证据材料清单', uploaded: true, required: true },
      { name: '代理合同', uploaded: true, required: true },
      { name: '授权委托书', uploaded: true, required: true },
      { name: '身份证明材料', uploaded: true, required: true },
    ];

    const nodeCompletionCheck = sopCheck.mandatory_nodes.map(node => ({
      node_id: node.id,
      node_name: node.task_name || node.stage_name,
      is_required: node.is_required,
      completed: node.status === CaseTaskStatus.COMPLETED || node.status === CaseTaskStatus.VERIFIED,
      completed_at: node.completed_at || null,
    }));

    let passed = true;
    let rejectReason = '';

    if (!sopCheck.all_passed) {
      passed = false;
      rejectReason = '存在未完成的强制SOP节点';
    }

    if (pendingChanges.has_pending) {
      passed = false;
      rejectReason = rejectReason ? `${rejectReason}；存在待审批的人员变更申请` : '存在待审批的人员变更申请';
    }

    return {
      passed,
      material_checklist: materialChecklist,
      node_completion_check: nodeCompletionCheck,
      reject_reason: rejectReason || undefined,
    };
  }

  async previewCaseArchive(caseId: string): Promise<{
    case_id: string;
    archive_status: string;
    material_checklist: any[];
    node_completion_check: any[];
    archive_path: string;
  }> {
    const checkResult = await this.checkCaseArchive(caseId);
    const existing = await this.caseArchiveRepository.findOne({ where: { case_id: caseId } });

    return {
      case_id: caseId,
      archive_status: existing?.archive_status || ArchiveStatus.PENDING,
      material_checklist: checkResult.material_checklist,
      node_completion_check: checkResult.node_completion_check,
      archive_path: existing?.archive_path || `archives/${caseId}_${Date.now()}`,
    };
  }

  async executeArchive(caseId: string, operatorId: string): Promise<CaseArchive> {
    const checkResult = await this.checkCaseArchive(caseId);
    const existing = await this.caseArchiveRepository.findOne({ where: { case_id: caseId } });

    if (!checkResult.passed) {
      const archiveData: Partial<CaseArchive> = {
        case_id: caseId,
        archive_status: ArchiveStatus.REJECTED,
        material_checklist: JSON.stringify(checkResult.material_checklist),
        node_completion_check: JSON.stringify(checkResult.node_completion_check),
        reject_reason: checkResult.reject_reason,
      };
      if (existing) {
        Object.assign(existing, archiveData);
        return this.caseArchiveRepository.save(existing);
      }
      const newArchive = this.caseArchiveRepository.create(archiveData);
      return this.caseArchiveRepository.save(newArchive);
    }

    const archivePath = `archives/${caseId}_${Date.now()}`;
    const archiveData: Partial<CaseArchive> = {
      case_id: caseId,
      archive_status: ArchiveStatus.ARCHIVED,
      material_checklist: JSON.stringify(checkResult.material_checklist),
      node_completion_check: JSON.stringify(checkResult.node_completion_check),
      archive_path: archivePath,
      archived_by: operatorId,
      archived_at: new Date(),
    };

    if (existing) {
      Object.assign(existing, archiveData);
      return this.caseArchiveRepository.save(existing);
    }
    const newArchive = this.caseArchiveRepository.create(archiveData);
    return this.caseArchiveRepository.save(newArchive);
  }

  async exportCaseArchive(caseId: string): Promise<{
    case_id: string;
    archive_path: string;
    archive_status: string;
    material_checklist: any[];
    node_completion_check: any[];
    export_time: string;
  }> {
    const archive = await this.caseArchiveRepository.findOne({ where: { case_id: caseId } });
    if (!archive) {
      throw new NotFoundException('该案件暂无归档记录，无法导出');
    }

    return {
      case_id: archive.case_id,
      archive_path: archive.archive_path,
      archive_status: archive.archive_status,
      material_checklist: archive.material_checklist ? JSON.parse(archive.material_checklist) : [],
      node_completion_check: archive.node_completion_check ? JSON.parse(archive.node_completion_check) : [],
      export_time: new Date().toISOString(),
    };
  }

  async searchCaseArchives(filters: {
    org_id?: string;
    keyword?: string;
    archive_status?: ArchiveStatus;
    start_date?: string;
    end_date?: string;
  }): Promise<CaseArchive[]> {
    const query: any = {};
    if (filters.org_id) query.organization_id = filters.org_id;
    if (filters.archive_status) query.archive_status = filters.archive_status;
    if (filters.start_date && filters.end_date) {
      query.created_at = Between(new Date(filters.start_date), new Date(filters.end_date));
    }
    return this.caseArchiveRepository.find({ where: query, order: { created_at: 'DESC' } });
  }

  async getCaseArchiveByCaseId(caseId: string): Promise<CaseArchive> {
    return this.caseArchiveRepository.findOne({ where: { case_id: caseId } });
  }

  async getCaseArchiveDetail(id: string): Promise<CaseArchive> {
    return this.caseArchiveRepository.findOne({ where: { id } });
  }
}
