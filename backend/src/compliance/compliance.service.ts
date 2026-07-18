import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComplianceRecord } from './compliance-record.entity';
import { Complaint } from './complaint.entity';
import { MarketingContent, ContentStatus } from './marketing-content.entity';
import { SalesCompliance, SalesCheckResult } from './sales-compliance.entity';
import { SigningCompliance, SigningStatus } from './signing-compliance.entity';
import { CaseSOP } from './case-sop.entity';
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
    const query = { organization_id: orgId } as any;
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
    const query = { organization_id: orgId } as any;
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
    const query = { organization_id: orgId } as any;
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
    const query = { organization_id: orgId } as any;
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
    const query = { organization_id: orgId } as any;
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

  async getCaseSOP(caseId: string): Promise<CaseSOP[]> {
    return this.caseSOPRepository.find({ where: { case_id: caseId }, order: { step_order: 'ASC' } });
  }

  async getCaseSOPStats(orgId: string): Promise<{ pending: number; completed: number; overdue: number }> {
    const pending = await this.caseSOPRepository.count({ where: { organization_id: orgId, status: 'pending' } });
    const completed = await this.caseSOPRepository.count({ where: { organization_id: orgId, status: 'completed' } });
    const overdue = await this.caseSOPRepository.count({
      where: { organization_id: orgId, status: 'pending' },
    });
    return { pending, completed, overdue };
  }
}
