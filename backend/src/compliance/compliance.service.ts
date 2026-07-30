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

  async createComplaint(complaintData: Partial<Complaint>): Promise<Complaint> {
    const complaint = this.complaintRepository.create(complaintData);
    return this.complaintRepository.save(complaint);
  }

  async updateComplaintStatus(id: string, status: ComplaintStatus, assigneeId?: string, processNote?: string): Promise<Complaint> {
    const updateData: Partial<Complaint> = { status };
    if (assigneeId) {
      updateData.assignee_id = assigneeId;
    }
    if (processNote) {
      updateData.process_note = processNote;
    }
    await this.complaintRepository.update(id, updateData);
    return this.complaintRepository.findOne({ where: { id } });
  }

  async closeComplaint(id: string, resolution: string, satisfactionScore?: number): Promise<Complaint> {
    await this.complaintRepository.update(id, {
      status: ComplaintStatus.CLOSED,
      resolution,
      satisfaction_score: satisfactionScore,
    });
    return this.complaintRepository.findOne({ where: { id } });
  }

  async getComplaints(orgId: string, status?: ComplaintStatus): Promise<Complaint[]> {
    const query: any = {};
    if (orgId) {
      query.organization_id = orgId;
    }
    if (status) {
      query.status = status;
    }
    return this.complaintRepository.find({ where: query, order: { created_at: 'DESC' } });
  }

  async getComplaintById(id: string): Promise<Complaint> {
    return this.complaintRepository.findOne({ where: { id } });
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

  async createCaseSOP(caseId: string, caseType: string, orgId: string): Promise<CaseSOP[]> {
    const templates = CASE_SOP_TEMPLATES[caseType] || CASE_SOP_TEMPLATES['other'];
    const today = new Date();
    const sops: CaseSOP[] = [];

    for (let i = 0; i < templates.length; i++) {
      const deadline = new Date(today);
      deadline.setDate(today.getDate() + templates[i].days_to_deadline);

      const sop = this.caseSOPRepository.create({
        case_id: caseId,
        case_type: caseType,
        step_name: templates[i].step_name,
        step_order: i + 1,
        deadline,
        organization_id: orgId,
      });
      sops.push(await this.caseSOPRepository.save(sop));
    }

    return sops;
  }

  async completeCaseSOP(id: string, operatorId: string, notes?: string): Promise<CaseSOP> {
    await this.caseSOPRepository.update(id, {
      status: 'completed',
      completed_time: new Date(),
      operator_id: operatorId,
      notes,
    });
    return this.caseSOPRepository.findOne({ where: { id } });
  }

  async verifyEvidence(id: string, checkResult: string): Promise<CaseSOP> {
    await this.caseSOPRepository.update(id, {
      evidence_verified: true,
      evidence_check_result: checkResult,
    });
    return this.caseSOPRepository.findOne({ where: { id } });
  }

  async getCaseSOP(caseId?: string): Promise<CaseSOP[]> {
    const query: any = {};
    if (caseId) {
      query.case_id = caseId;
    }
    return this.caseSOPRepository.find({ where: query, order: { step_order: 'ASC' } });
  }

  async getCaseSOPStats(orgId: string): Promise<{ pending: number; completed: number; overdue: number }> {
    const query: any = {};
    if (orgId) {
      query.organization_id = orgId;
    }
    const pending = await this.caseSOPRepository.count({ where: { ...query, status: 'pending' } });
    const completed = await this.caseSOPRepository.count({ where: { ...query, status: 'completed' } });
    const overdue = await this.caseSOPRepository.count({
      where: { ...query, status: 'pending' },
    });
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
    return this.talkQualityCheckRepository.findOne({ where: { id } });
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

    result.complaints = await this.complaintRepository.find({
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
