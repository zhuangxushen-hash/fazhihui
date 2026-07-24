import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { Organization } from '../user/organization.entity';
import { Lead } from '../lead/lead.entity';
import { FollowUp } from '../lead/follow-up.entity';
import { Case } from '../case/case.entity';
import { Document } from '../case/document.entity';
import { ComplianceRecord } from '../compliance/compliance-record.entity';
import { Complaint } from '../compliance/complaint.entity';
import { MarketingContent } from '../compliance/marketing-content.entity';
import { SalesCompliance } from '../compliance/sales-compliance.entity';
import { SigningCompliance } from '../compliance/signing-compliance.entity';
import { CaseSOP } from '../compliance/case-sop.entity';
import { Fee } from '../finance/fee.entity';
import { ProfitShare } from '../finance/profit-share.entity';
import { Refund, RefundStatus } from '../finance/refund.entity';
import { Invoice, InvoiceStatus } from '../finance/invoice.entity';
import { PaymentRecord, PaymentStatus, PaymentMethod } from '../finance/payment-record.entity';
import { MarketingMaterial } from '../marketing/marketing-material.entity';
import * as bcrypt from 'bcryptjs';
import {
  UserRole, LeadSource, LeadStatus, CaseType, CaseStatus, ComplianceType, ComplianceResult,
  ComplaintType, ComplaintStatus, FeeRole,
  AdChannel, ConversionEventType, AdPlatform, AdAccountStatus, AdPlanStatus,
  AdMaterialType, AdMaterialStatus, MaterialComplianceStatus,
  SocialPlatform, SocialAuthStatus,
  InviteMethod, InviteTaskStatus, InviteResult,
  OpportunityStage, OpportunityStatus,
  WarningType, WarningLevel, WarningStatus,
  EvidenceType, EvidenceCategory,
  AssignmentRuleType, RecycleReason, LeadPoolStatus,
} from '../types';
import { ContentStatus, PlatformType } from '../compliance/marketing-content.entity';
import { SalesChannel, SalesCheckResult } from '../compliance/sales-compliance.entity';
import { SigningStatus } from '../compliance/signing-compliance.entity';

// Phase 3 营销模块实体
import { ConversionEvent } from '../marketing/conversion-event.entity';
import { AdAccount } from '../marketing/ad-account.entity';
import { AdPlan } from '../marketing/ad-plan.entity';
import { AdMaterial } from '../marketing/ad-material.entity';
import { SocialAccount } from '../marketing/social-account.entity';

// SCRM 模块实体
import { LiveCode } from '../scrm/live-code.entity';
import { ClientTag } from '../scrm/client-tag.entity';

// Phase 1 线索 CRM 实体
import { InviteTask } from '../lead/invite-task.entity';
import { Opportunity } from '../lead/opportunity.entity';
import { LeadAssignment } from '../lead/lead-assignment.entity';
import { LeadPool } from '../lead/lead-pool.entity';

// Phase 1 案件办案实体
import { CaseTask, CaseTaskStatus, TaskPriority } from '../case/case-task.entity';
import { CaseWarning } from '../case/case-warning.entity';
import { Evidence } from '../case/evidence.entity';

// Phase 1 财务实体
import { Receivable, ReceivableStatus } from '../finance/receivable.entity';
import { CommissionRule, CommissionType, CommissionRoleType } from '../finance/commission-rule.entity';
import { CommissionRecord, CommissionStatus } from '../finance/commission-record.entity';
import { CaseCost, CostType } from '../finance/case-cost.entity';

// Phase 2 合规实体
import { ComplianceRule, CheckStage, RuleType } from '../compliance/compliance-rule.entity';
import { ComplianceCheckResult, CheckResultType, HandleStatus } from '../compliance/compliance-check-result.entity';
import { TalkQualityCheck, TalkCheckType, TalkViolationType, TalkCheckResult, TalkHandleStatus } from '../compliance/talk-quality-check.entity';
import { ContractTemplate } from '../compliance/contract-template.entity';
import { ComplaintTicket, TicketSourceChannel, TicketComplaintType, TicketSeverity, TicketStatus } from '../compliance/complaint-ticket.entity';

// Phase 4 新增实体
import { CasePushNotification } from '../client/case-push-notification.entity';
import { ClientConsultation } from '../client/client-consultation.entity';
import { ServiceRating } from '../client/service-rating.entity';
import { ReportTemplate } from '../dashboard/report-template.entity';
import { ReportExportLog } from '../dashboard/report-export-log.entity';

// 谈案SOP实体
import { TalkSOP, OpportunitySOPProgress, SOPNodeStatus } from '../lead/talk-sop.entity';

// 办案SOP模板实体
import { CaseSOPTemplate } from '../case/case-sop-template.entity';

// SCRM模块实体
import { ChannelTracking } from '../scrm/channel-tracking.entity';
import { ReachTask } from '../scrm/reach-task.entity';
import { ChatArchive } from '../scrm/chat-archive.entity';
import { ScriptLibrary } from '../scrm/script-library.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    User,
    Organization,
    Lead,
    FollowUp,
    Case,
    Document,
    ComplianceRecord,
    Complaint,
    MarketingContent,
    SalesCompliance,
    SigningCompliance,
    CaseSOP,
    Fee,
    ProfitShare,
    Refund,
    Invoice,
    PaymentRecord,
    MarketingMaterial,
    // Phase 3 营销模块
    ConversionEvent,
    AdAccount,
    AdPlan,
    AdMaterial,
    SocialAccount,
    // SCRM 模块
    LiveCode,
    ClientTag,
    // Phase 1 线索 CRM
    InviteTask,
    Opportunity,
    LeadAssignment,
    LeadPool,
    // Phase 1 案件办案
    CaseTask,
    CaseWarning,
    Evidence,
    // Phase 1 财务
    Receivable,
    CommissionRule,
    CommissionRecord,
    CaseCost,
    // Phase 2 合规
    ComplianceRule,
    ComplianceCheckResult,
    TalkQualityCheck,
    ContractTemplate,
    ComplaintTicket,
    // Phase 4 新增
    CasePushNotification,
    ClientConsultation,
    ServiceRating,
    ReportTemplate,
    ReportExportLog,
    // 谈案SOP
    TalkSOP,
    OpportunitySOPProgress,
    // 办案SOP模板
    CaseSOPTemplate,
    // SCRM模块
    ChannelTracking,
    ReachTask,
    ChatArchive,
    ScriptLibrary,
  ])],
})
export class SeedsModule implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Organization)
    private readonly orgRepository: Repository<Organization>,
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    @InjectRepository(FollowUp)
    private readonly followUpRepository: Repository<FollowUp>,
    @InjectRepository(Case)
    private readonly caseRepository: Repository<Case>,
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(ComplianceRecord)
    private readonly complianceRecordRepository: Repository<ComplianceRecord>,
    @InjectRepository(Complaint)
    private readonly complaintRepository: Repository<Complaint>,
    @InjectRepository(MarketingContent)
    private readonly marketingContentRepository: Repository<MarketingContent>,
    @InjectRepository(SalesCompliance)
    private readonly salesComplianceRepository: Repository<SalesCompliance>,
    @InjectRepository(SigningCompliance)
    private readonly signingComplianceRepository: Repository<SigningCompliance>,
    @InjectRepository(CaseSOP)
    private readonly caseSOPRepository: Repository<CaseSOP>,
    @InjectRepository(Fee)
    private readonly feeRepository: Repository<Fee>,
    @InjectRepository(ProfitShare)
    private readonly profitShareRepository: Repository<ProfitShare>,
    @InjectRepository(Refund)
    private readonly refundRepository: Repository<Refund>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(MarketingMaterial)
    private readonly marketingMaterialRepository: Repository<MarketingMaterial>,
    @InjectRepository(PaymentRecord)
    private readonly paymentRecordRepository: Repository<PaymentRecord>,
    // Phase 3 营销模块
    @InjectRepository(ConversionEvent)
    private readonly conversionEventRepository: Repository<ConversionEvent>,
    @InjectRepository(AdAccount)
    private readonly adAccountRepository: Repository<AdAccount>,
    @InjectRepository(AdPlan)
    private readonly adPlanRepository: Repository<AdPlan>,
    @InjectRepository(AdMaterial)
    private readonly adMaterialRepository: Repository<AdMaterial>,
    @InjectRepository(SocialAccount)
    private readonly socialAccountRepository: Repository<SocialAccount>,
    // SCRM 模块
    @InjectRepository(LiveCode)
    private readonly liveCodeRepository: Repository<LiveCode>,
    @InjectRepository(ClientTag)
    private readonly clientTagRepository: Repository<ClientTag>,
    // Phase 1 线索 CRM
    @InjectRepository(InviteTask)
    private readonly inviteTaskRepository: Repository<InviteTask>,
    @InjectRepository(Opportunity)
    private readonly opportunityRepository: Repository<Opportunity>,
    @InjectRepository(LeadAssignment)
    private readonly leadAssignmentRepository: Repository<LeadAssignment>,
    @InjectRepository(LeadPool)
    private readonly leadPoolRepository: Repository<LeadPool>,
    // Phase 1 案件办案
    @InjectRepository(CaseTask)
    private readonly caseTaskRepository: Repository<CaseTask>,
    @InjectRepository(CaseWarning)
    private readonly caseWarningRepository: Repository<CaseWarning>,
    @InjectRepository(Evidence)
    private readonly evidenceRepository: Repository<Evidence>,
    // Phase 1 财务
    @InjectRepository(Receivable)
    private readonly receivableRepository: Repository<Receivable>,
    @InjectRepository(CommissionRule)
    private readonly commissionRuleRepository: Repository<CommissionRule>,
    @InjectRepository(CommissionRecord)
    private readonly commissionRecordRepository: Repository<CommissionRecord>,
    @InjectRepository(CaseCost)
    private readonly caseCostRepository: Repository<CaseCost>,
    // Phase 2 合规
    @InjectRepository(ComplianceRule)
    private readonly complianceRuleRepository: Repository<ComplianceRule>,
    @InjectRepository(ComplianceCheckResult)
    private readonly complianceCheckResultRepository: Repository<ComplianceCheckResult>,
    @InjectRepository(TalkQualityCheck)
    private readonly talkQualityCheckRepository: Repository<TalkQualityCheck>,
    @InjectRepository(ContractTemplate)
    private readonly contractTemplateRepository: Repository<ContractTemplate>,
    @InjectRepository(ComplaintTicket)
    private readonly complaintTicketRepository: Repository<ComplaintTicket>,
    // Phase 4 新增
    @InjectRepository(CasePushNotification)
    private readonly casePushNotificationRepository: Repository<CasePushNotification>,
    @InjectRepository(ClientConsultation)
    private readonly clientConsultationRepository: Repository<ClientConsultation>,
    @InjectRepository(ServiceRating)
    private readonly serviceRatingRepository: Repository<ServiceRating>,
    @InjectRepository(ReportTemplate)
    private readonly reportTemplateRepository: Repository<ReportTemplate>,
    @InjectRepository(ReportExportLog)
    private readonly reportExportLogRepository: Repository<ReportExportLog>,
    // 谈案SOP
    @InjectRepository(TalkSOP)
    private readonly talkSOPRepository: Repository<TalkSOP>,
    @InjectRepository(OpportunitySOPProgress)
    private readonly opportunitySOPProgressRepository: Repository<OpportunitySOPProgress>,
    // 办案SOP模板
    @InjectRepository(CaseSOPTemplate)
    private readonly caseSOPTemplateRepository: Repository<CaseSOPTemplate>,
    // SCRM模块
    @InjectRepository(ChannelTracking)
    private readonly channelTrackingRepository: Repository<ChannelTracking>,
    @InjectRepository(ReachTask)
    private readonly reachTaskRepository: Repository<ReachTask>,
    @InjectRepository(ChatArchive)
    private readonly chatArchiveRepository: Repository<ChatArchive>,
    @InjectRepository(ScriptLibrary)
    private readonly scriptLibraryRepository: Repository<ScriptLibrary>,
  ) {}

  async onModuleInit() {
    await this.seedData();
  }

  private async seedData() {
    const existingOrg = await this.orgRepository.findOne({ where: { name: '测试律所' } });
    let orgId: string;

    if (!existingOrg) {
      const org = this.orgRepository.create({
        name: '测试律所',
        address: '北京市朝阳区测试大厦',
        license_no: 'LS2026001',
      });
      const savedOrg = await this.orgRepository.save(org);
      orgId = savedOrg.id;
    } else {
      orgId = existingOrg.id;
    }

    const users: { phone: string; real_name: string; role: UserRole; credentials_no?: string }[] = [
      { phone: '13800138000', real_name: '超级管理员', role: UserRole.SUPER_ADMIN },
      { phone: '13800138001', real_name: '律所管理者', role: UserRole.ORG_ADMIN },
      { phone: '13800138002', real_name: '投放专员张三', role: UserRole.MARKETING },
      { phone: '13800138003', real_name: '谈案销售李四', role: UserRole.SALES },
      { phone: '13800138004', real_name: '办案律师王五', role: UserRole.LAWYER, credentials_no: '11000000001' },
      { phone: '13800138005', real_name: '律师助理赵六', role: UserRole.ASSISTANT },
      { phone: '13800138006', real_name: '财务人员钱七', role: UserRole.FINANCE },
      { phone: '13800138007', real_name: '测试客户孙八', role: UserRole.CLIENT },
      { phone: '13800138008', real_name: '资深律师周九', role: UserRole.LAWYER, credentials_no: '11000000002' },
      { phone: '13800138009', real_name: '高级销售吴十', role: UserRole.SALES },
      { phone: '13800138010', real_name: '合规专员郑十一', role: UserRole.ORG_ADMIN },
      { phone: '13800138011', real_name: '客户刘十二', role: UserRole.CLIENT },
    ];

    const userMap: Record<string, User> = {};
    for (const userData of users) {
      const existing = await this.userRepository.findOne({ where: { phone: userData.phone } });
      if (!existing) {
        const hashedPassword = await bcrypt.hash('123456', 10);
        const user = await this.userRepository.save({
          ...userData,
          password: hashedPassword,
          organization_id: orgId,
        });
        userMap[userData.phone] = user;
      } else {
        userMap[userData.phone] = existing;
      }
    }

    await this.seedLeads(orgId, userMap);
    await this.seedCases(orgId, userMap);
    await this.seedComplianceRecords(orgId, userMap);
    await this.seedComplaints(orgId, userMap);
    await this.seedFinanceData(orgId, userMap);
    await this.seedPaymentRecords(orgId, userMap);
    await this.seedMarketingMaterials(orgId, userMap);
    await this.seedMarketingContents(orgId, userMap);
    await this.seedSalesCompliance(orgId, userMap);
    await this.seedSigningCompliance(orgId, userMap);
    await this.seedCaseSOP(orgId, userMap);

    // Phase 3 营销模块数据（供数据中台使用）
    await this.seedAdAccounts(orgId, userMap);
    await this.seedAdPlans(orgId, userMap);
    await this.seedAdMaterials(orgId, userMap);
    await this.seedSocialAccounts(orgId, userMap);
    await this.seedConversionEvents(orgId, userMap);
    await this.seedLiveCodes(orgId, userMap);
    await this.seedClientTags(orgId, userMap);

    // Phase 1 线索 CRM 数据
    await this.seedInviteTasks(orgId, userMap);
    await this.seedOpportunities(orgId, userMap);
    await this.seedLeadAssignments(orgId, userMap);
    await this.seedLeadPool(orgId, userMap);

    // Phase 1 案件办案数据
    await this.seedCaseTasks(orgId, userMap);
    await this.seedCaseWarnings(orgId, userMap);
    await this.seedEvidences(orgId, userMap);

    // Phase 1 财务数据
    await this.seedReceivables(orgId, userMap);
    await this.seedCommissionRules(orgId, userMap);
    await this.seedCommissionRecords(orgId, userMap);
    await this.seedCaseCosts(orgId, userMap);

    // Phase 2 合规数据
    await this.seedComplianceRules(orgId, userMap);
    await this.seedComplianceCheckResults(orgId, userMap);
    await this.seedTalkQualityChecks(orgId, userMap);
    await this.seedContractTemplates(orgId, userMap);
    await this.seedComplaintTickets(orgId, userMap);

    // Phase 4 新增数据
    await this.seedCasePushNotifications(orgId, userMap);
    await this.seedClientConsultations(orgId, userMap);
    await this.seedServiceRatings(orgId, userMap);
    await this.seedReportTemplates(orgId, userMap);
    await this.seedReportExportLogs(orgId, userMap);

    // 谈案SOP数据
    await this.seedTalkSOPs(orgId, userMap);
    await this.seedOpportunitySOPProgress(orgId, userMap);

    // 办案SOP模板数据
    await this.seedCaseSOPTemplates(orgId, userMap);

    // SCRM模块数据
    await this.seedChannelTrackings(orgId, userMap);
    await this.seedReachTasks(orgId, userMap);
    await this.seedChatArchives(orgId, userMap);
    await this.seedScriptLibraries(orgId, userMap);
  }

  private async seedLeads(orgId: string, userMap: Record<string, User>) {
    const salesUser = userMap['13800138003'];
    const salesUser2 = userMap['13800138009'];
    
    const leadData = [
      {
        source_channel: LeadSource.DOUYIN,
        source_keyword: '婚姻律师',
        case_type: CaseType.MARRIAGE,
        status: LeadStatus.NEW,
        phone: '13900139001',
        contact_name: '张女士',
        case_description: '因感情破裂，想咨询离婚事宜，涉及财产分割和子女抚养权',
        landing_page: 'https://www.example.com/landing/marriage',
      },
      {
        source_channel: LeadSource.BAIDU,
        source_keyword: '交通事故赔偿',
        case_type: CaseType.TRAFFIC,
        status: LeadStatus.FOLLOWING,
        assign_sales_id: salesUser?.id,
        phone: '13900139002',
        contact_name: '李先生',
        case_description: '发生交通事故，对方全责，需要进行伤残鉴定和赔偿协商',
        landing_page: 'https://www.example.com/landing/traffic',
      },
      {
        source_channel: LeadSource.KUAISHOU,
        source_keyword: '劳动仲裁',
        case_type: CaseType.LABOR,
        status: LeadStatus.INVITING,
        assign_sales_id: salesUser?.id,
        phone: '13900139003',
        contact_name: '王女士',
        case_description: '公司拖欠工资三个月，想要申请劳动仲裁',
      },
      {
        source_channel: LeadSource.WECHAT,
        source_keyword: '债务追讨',
        case_type: CaseType.DEBT,
        status: LeadStatus.NEGOTIATING,
        assign_sales_id: salesUser2?.id,
        phone: '13900139004',
        contact_name: '赵先生',
        case_description: '朋友借款50万元到期未还，需要通过法律途径追讨',
      },
      {
        source_channel: LeadSource.DOUYIN,
        case_type: CaseType.OTHER,
        status: LeadStatus.PENDING_SIGN,
        assign_sales_id: salesUser2?.id,
        phone: '13900139005',
        contact_name: '孙女士',
        case_description: '咨询知识产权相关问题',
      },
      {
        source_channel: LeadSource.BAIDU,
        case_type: CaseType.MARRIAGE,
        status: LeadStatus.LOST,
        assign_sales_id: salesUser?.id,
        phone: '13900139006',
        contact_name: '周先生',
        case_description: '客户已选择其他律所',
      },
      {
        source_channel: LeadSource.WECHAT,
        source_keyword: '房产纠纷',
        case_type: CaseType.OTHER,
        status: LeadStatus.FOLLOWING,
        assign_sales_id: salesUser?.id,
        phone: '13900139007',
        contact_name: '吴女士',
        case_description: '房产继承纠纷，兄弟姐妹对遗产分配有争议',
      },
      {
        source_channel: LeadSource.KUAISHOU,
        source_keyword: '合同纠纷',
        case_type: CaseType.OTHER,
        status: LeadStatus.INVITING,
        assign_sales_id: salesUser2?.id,
        phone: '13900139008',
        contact_name: '郑先生',
        case_description: '签订合同后对方违约，要求赔偿损失',
      },
      {
        source_channel: LeadSource.DOUYIN,
        source_keyword: '工伤赔偿',
        case_type: CaseType.LABOR,
        status: LeadStatus.NEGOTIATING,
        assign_sales_id: salesUser?.id,
        phone: '13900139009',
        contact_name: '冯女士',
        case_description: '工作期间受伤，公司未按规定支付工伤赔偿',
      },
      {
        source_channel: LeadSource.BAIDU,
        source_keyword: '刑事辩护',
        case_type: CaseType.OTHER,
        status: LeadStatus.PENDING_SIGN,
        assign_sales_id: salesUser2?.id,
        phone: '13900139010',
        contact_name: '陈先生',
        case_description: '涉嫌故意伤害，需要刑事辩护律师',
      },
      {
        source_channel: LeadSource.WECHAT,
        source_keyword: '医疗纠纷',
        case_type: CaseType.OTHER,
        status: LeadStatus.NEW,
        phone: '13900139011',
        contact_name: '杨女士',
        case_description: '医疗事故导致身体损害，要求医院赔偿',
      },
      {
        source_channel: LeadSource.KUAISHOU,
        source_keyword: '拆迁补偿',
        case_type: CaseType.OTHER,
        status: LeadStatus.FOLLOWING,
        assign_sales_id: salesUser?.id,
        phone: '13900139012',
        contact_name: '许先生',
        case_description: '房屋拆迁补偿不合理，希望通过法律途径维权',
      },
    ];

    for (const data of leadData) {
      const existing = await this.leadRepository.findOne({ where: { phone: data.phone } });
      if (!existing) {
        const lead = await this.leadRepository.save({
          ...data,
          organization_id: orgId,
        });

        if (data.status !== LeadStatus.NEW && data.status !== LeadStatus.LOST) {
          await this.followUpRepository.save({
            content: `已联系客户，客户表示有合作意向，约定下周面谈`,
            next_action: '预约面谈',
            lead_id: lead.id,
            operator_id: data.assign_sales_id || salesUser?.id,
          });
        }
      }
    }
  }

  private async seedCases(orgId: string, userMap: Record<string, User>) {
    const lawyerUser = userMap['13800138004'];
    const lawyerUser2 = userMap['13800138008'];
    const clientUser = userMap['13800138007'];
    const clientUser2 = userMap['13800138011'];

    const caseData = [
      {
        case_no: '2026京0105民初0001号',
        case_type: CaseType.MARRIAGE,
        status: CaseStatus.PENDING_ASSIGN,
        client_id: clientUser?.id,
        client_name: '张女士',
        client_phone: '13900139001',
        fee_amount: 50000,
        amount: 500000,
        description: '张女士离婚案，涉及房产分割和子女抚养权',
        court: '北京市朝阳区人民法院',
        filing_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        case_no: '2026京0108民初0002号',
        case_type: CaseType.TRAFFIC,
        status: CaseStatus.PROCESSING,
        client_id: clientUser?.id,
        client_name: '李先生',
        client_phone: '13900139002',
        assignee_lawyer_id: lawyerUser?.id,
        fee_amount: 30000,
        amount: 200000,
        description: '李先生交通事故赔偿案，对方全责，伤残等级十级',
        court: '北京市海淀区人民法院',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        filing_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        expected_close_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
      {
        case_no: '京朝劳人仲字[2026]第0003号',
        case_type: CaseType.LABOR,
        status: CaseStatus.FILING,
        client_id: clientUser?.id,
        client_name: '王女士',
        client_phone: '13900139003',
        assignee_lawyer_id: lawyerUser?.id,
        fee_amount: 15000,
        amount: 120000,
        description: '王女士劳动仲裁案，公司拖欠工资三个月',
        court: '北京市朝阳区劳动仲裁委员会',
        filing_date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
      },
      {
        case_no: '2026京0101民初0004号',
        case_type: CaseType.DEBT,
        status: CaseStatus.EVIDENCE,
        client_id: clientUser2?.id,
        client_name: '赵先生',
        client_phone: '13900139004',
        assignee_lawyer_id: lawyerUser2?.id,
        fee_amount: 80000,
        amount: 500000,
        description: '赵先生债务追讨案，借款50万元，有借条和转账记录',
        court: '北京市东城区人民法院',
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        filing_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        case_no: '2026京0102民初0005号',
        case_type: CaseType.MARRIAGE,
        status: CaseStatus.HEARING,
        client_id: clientUser2?.id,
        client_name: '孙女士',
        client_phone: '13900139005',
        assignee_lawyer_id: lawyerUser?.id,
        fee_amount: 60000,
        amount: 800000,
        description: '孙女士离婚案，涉及公司股权分割',
        court: '北京市西城区人民法院',
        filing_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        expected_close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        case_no: '2025京0106民初0006号',
        case_type: CaseType.TRAFFIC,
        status: CaseStatus.CLOSED,
        client_id: clientUser?.id,
        client_name: '周先生',
        client_phone: '13900139006',
        assignee_lawyer_id: lawyerUser2?.id,
        fee_amount: 25000,
        amount: 180000,
        description: '周先生交通事故案，已结案，获得赔偿20万元',
        court: '北京市丰台区人民法院',
        filing_date: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
        expected_close_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        case_no: '2026京0105民初0007号',
        case_type: CaseType.OTHER,
        status: CaseStatus.PROCESSING,
        client_id: clientUser?.id,
        client_name: '吴女士',
        client_phone: '13900139007',
        assignee_lawyer_id: lawyerUser?.id,
        fee_amount: 40000,
        amount: 300000,
        description: '吴女士房产继承纠纷案，涉及三套房产分配',
        court: '北京市朝阳区人民法院',
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        filing_date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
      },
      {
        case_no: '2026京0108民初0008号',
        case_type: CaseType.OTHER,
        status: CaseStatus.FILING,
        client_id: clientUser2?.id,
        client_name: '郑先生',
        client_phone: '13900139008',
        assignee_lawyer_id: lawyerUser2?.id,
        fee_amount: 35000,
        amount: 250000,
        description: '郑先生合同纠纷案，对方违约造成损失',
        court: '北京市海淀区人民法院',
        filing_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        case_no: '京朝劳人仲字[2026]第0009号',
        case_type: CaseType.LABOR,
        status: CaseStatus.HEARING,
        client_id: clientUser?.id,
        client_name: '冯女士',
        client_phone: '13900139009',
        assignee_lawyer_id: lawyerUser?.id,
        fee_amount: 20000,
        amount: 80000,
        description: '冯女士工伤赔偿案，公司拒绝支付合理赔偿',
        court: '北京市朝阳区劳动仲裁委员会',
        filing_date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
        expected_close_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      },
      {
        case_no: '2026京0101刑初0010号',
        case_type: CaseType.OTHER,
        status: CaseStatus.PENDING_ASSIGN,
        client_id: clientUser2?.id,
        client_name: '陈先生',
        client_phone: '13900139010',
        fee_amount: 100000,
        amount: 0,
        description: '陈先生故意伤害案，需要刑事辩护',
        court: '北京市东城区人民法院',
        filing_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        case_no: '2026京0102民初0011号',
        case_type: CaseType.OTHER,
        status: CaseStatus.EVIDENCE,
        client_id: clientUser?.id,
        client_name: '杨女士',
        client_phone: '13900139011',
        assignee_lawyer_id: lawyerUser2?.id,
        fee_amount: 55000,
        amount: 450000,
        description: '杨女士医疗纠纷案，手术失误导致后遗症',
        court: '北京市西城区人民法院',
        deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        filing_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      },
      {
        case_no: '2026京0106民初0012号',
        case_type: CaseType.OTHER,
        status: CaseStatus.PROCESSING,
        client_id: clientUser2?.id,
        client_name: '许先生',
        client_phone: '13900139012',
        assignee_lawyer_id: lawyerUser?.id,
        fee_amount: 45000,
        amount: 600000,
        description: '许先生拆迁补偿案，补偿标准不合理',
        court: '北京市丰台区人民法院',
        deadline: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000),
        filing_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      },
    ];

    for (const data of caseData) {
      const existing = await this.caseRepository.findOne({ where: { case_no: data.case_no } });
      if (!existing) {
        const caseEntity = await this.caseRepository.save({
          ...data,
          organization_id: orgId,
        });

        if (data.status !== CaseStatus.PENDING_ASSIGN) {
          await this.documentRepository.save([
            {
              name: '案件受理通知书',
              file_path: `/documents/${caseEntity.id}/acceptance.pdf`,
              file_type: 'pdf',
              size: 102400,
              description: '法院案件受理通知书',
              case_id: caseEntity.id,
              uploaded_by_id: data.assignee_lawyer_id,
            },
            {
              name: '授权委托书',
              file_path: `/documents/${caseEntity.id}/authorization.pdf`,
              file_type: 'pdf',
              size: 51200,
              description: '客户授权委托书',
              case_id: caseEntity.id,
              uploaded_by_id: data.assignee_lawyer_id,
            },
          ]);
        }
      }
    }
  }

  private async seedComplianceRecords(orgId: string, userMap: Record<string, User>) {
    const adminUser = userMap['13800138001'];
    const marketingUser = userMap['13800138002'];
    const complianceUser = userMap['13800138010'];

    const complianceData = [
      {
        type: ComplianceType.MARKETING,
        content: '抖音广告内容：专业婚姻律师，快速离婚，成功率99%',
        result: ComplianceResult.WARNING,
        violation_type: '虚假宣传',
        violation_detail: '使用"成功率99%"等绝对化用语，违反广告法',
        suggestion: '修改为"专业婚姻律师，经验丰富"',
        operator_id: complianceUser?.id,
      },
      {
        type: ComplianceType.SALES,
        content: '销售话术：我们律所和法官有关系，可以保证胜诉',
        result: ComplianceResult.REJECT,
        violation_type: '违规承诺',
        violation_detail: '承诺与法官有关系，属于不正当竞争',
        suggestion: '禁止使用此类话术，加强培训',
        operator_id: adminUser?.id,
      },
      {
        type: ComplianceType.CASE,
        content: '案件代理协议审查通过，费用合理，条款规范',
        result: ComplianceResult.PASS,
        operator_id: complianceUser?.id,
      },
      {
        type: ComplianceType.FINANCE,
        content: '费用收取符合标准，已开具正规发票',
        result: ComplianceResult.PASS,
        operator_id: adminUser?.id,
      },
      {
        type: ComplianceType.MARKETING,
        content: '百度广告内容：交通事故专业律师，免费咨询',
        result: ComplianceResult.PASS,
        operator_id: marketingUser?.id,
      },
      {
        type: ComplianceType.SALES,
        content: '销售话术：我们是北京最好的律所，没有之一',
        result: ComplianceResult.WARNING,
        violation_type: '虚假宣传',
        violation_detail: '使用"最好"等绝对化用语',
        suggestion: '修改为"我们是专业的律所"',
        operator_id: complianceUser?.id,
      },
      {
        type: ComplianceType.CASE,
        content: '案件代理协议存在风险，部分条款对客户不利',
        result: ComplianceResult.WARNING,
        violation_type: '合同风险',
        violation_detail: '违约金条款过高，可能被法院调整',
        suggestion: '降低违约金比例至合理范围',
        operator_id: complianceUser?.id,
      },
      {
        type: ComplianceType.FINANCE,
        content: '费用收取未签订书面协议，存在合规风险',
        result: ComplianceResult.WARNING,
        violation_type: '手续不全',
        violation_detail: '未签订风险代理协议',
        suggestion: '补签风险代理协议',
        operator_id: adminUser?.id,
      },
      {
        type: ComplianceType.MARKETING,
        content: '快手广告内容：债务追讨专家，不成功不收费',
        result: ComplianceResult.PASS,
        operator_id: marketingUser?.id,
      },
      {
        type: ComplianceType.SALES,
        content: '销售话术：这个案子很简单，肯定能赢',
        result: ComplianceResult.REJECT,
        violation_type: '违规承诺',
        violation_detail: '承诺案件结果，违反律师执业规范',
        suggestion: '禁止承诺案件结果',
        operator_id: complianceUser?.id,
      },
      {
        type: ComplianceType.CASE,
        content: '案件证据材料齐全，代理方案合理',
        result: ComplianceResult.PASS,
        operator_id: complianceUser?.id,
      },
      {
        type: ComplianceType.FINANCE,
        content: '分润计算符合约定，已完成税务申报',
        result: ComplianceResult.PASS,
        operator_id: adminUser?.id,
      },
    ];

    for (const data of complianceData) {
      const existing = await this.complianceRecordRepository.findOne({ where: { content: data.content } });
      if (!existing) {
        await this.complianceRecordRepository.save({
          ...data,
          organization_id: orgId,
        });
      }
    }
  }

  private async seedComplaints(orgId: string, userMap: Record<string, User>) {
    const clientUser = userMap['13800138007'];
    const clientUser2 = userMap['13800138011'];
    const adminUser = userMap['13800138001'];
    const complianceUser = userMap['13800138010'];

    const complaintData = [
      {
        type: ComplaintType.SERVICE_QUALITY,
        content: '律师回复不及时，多次联系都没有回应，严重影响案件进度',
        status: ComplaintStatus.NEW,
        client_id: clientUser?.id,
        client_name: '孙八',
        client_phone: '13800138007',
        case_no: '2026京0108民初0002号',
      },
      {
        type: ComplaintType.FEE_ISSUE,
        content: '收费不合理，咨询了一次就收取了5000元，感觉被坑了',
        status: ComplaintStatus.PROCESSING,
        client_id: clientUser?.id,
        client_name: '孙八',
        client_phone: '13800138007',
        assignee_id: adminUser?.id,
        process_note: '已联系客户了解情况，正在核实收费标准',
        case_no: '2026京0105民初0001号',
      },
      {
        type: ComplaintType.SERVICE_QUALITY,
        content: '律师助理态度不好，询问案件进展时很不耐烦',
        status: ComplaintStatus.CLOSED,
        client_id: clientUser2?.id,
        client_name: '刘十二',
        client_phone: '13800138011',
        assignee_id: complianceUser?.id,
        process_note: '已对助理进行批评教育，向客户道歉',
        resolution: '问题已解决，客户表示满意',
        satisfaction_score: 4,
        case_no: '2026京0101民初0004号',
      },
      {
        type: ComplaintType.PROGRESS,
        content: '案件已经三个月了，一点进展都没有，律师总是说在处理',
        status: ComplaintStatus.NEW,
        client_id: clientUser?.id,
        client_name: '孙八',
        client_phone: '13800138007',
        case_no: '2026京0102民初0005号',
      },
      {
        type: ComplaintType.RESULT,
        content: '判决结果不满意，律师没有尽力争取权益',
        status: ComplaintStatus.PROCESSING,
        client_id: clientUser2?.id,
        client_name: '刘十二',
        client_phone: '13800138011',
        assignee_id: adminUser?.id,
        process_note: '正在分析判决书，评估是否有上诉可能',
        case_no: '2025京0106民初0006号',
      },
      {
        type: ComplaintType.FEE_ISSUE,
        content: '合同约定的费用是3万元，现在又要额外收取2万元',
        status: ComplaintStatus.CLOSED,
        client_id: clientUser?.id,
        client_name: '孙八',
        client_phone: '13800138007',
        assignee_id: complianceUser?.id,
        process_note: '核实后发现是误解，已向客户解释清楚',
        resolution: '客户理解，问题解决',
        satisfaction_score: 3,
        case_no: '京朝劳人仲字[2026]第0003号',
      },
      {
        type: ComplaintType.SERVICE_QUALITY,
        content: '律师开庭迟到，影响了案件审理',
        status: ComplaintStatus.NEW,
        client_id: clientUser2?.id,
        client_name: '刘十二',
        client_phone: '13800138011',
        case_no: '2026京0105民初0007号',
      },
      {
        type: ComplaintType.PROGRESS,
        content: '交了材料后就没有消息了，不知道案件到哪个阶段了',
        status: ComplaintStatus.PROCESSING,
        client_id: clientUser?.id,
        client_name: '孙八',
        client_phone: '13800138007',
        assignee_id: adminUser?.id,
        process_note: '已要求律师及时反馈案件进展',
        case_no: '2026京0108民初0008号',
      },
      {
        type: ComplaintType.SERVICE_QUALITY,
        content: '律师在法庭上表现不佳，没有充分举证',
        status: ComplaintStatus.CLOSED,
        client_id: clientUser2?.id,
        client_name: '刘十二',
        client_phone: '13800138011',
        assignee_id: complianceUser?.id,
        process_note: '已与律师沟通，要求改进',
        resolution: '律师已改进，客户接受',
        satisfaction_score: 3,
        case_no: '京朝劳人仲字[2026]第0009号',
      },
      {
        type: ComplaintType.OTHER,
        content: '律所地址变更没有通知，导致白跑一趟',
        status: ComplaintStatus.NEW,
        client_id: clientUser?.id,
        client_name: '孙八',
        client_phone: '13800138007',
      },
      {
        type: ComplaintType.FEE_ISSUE,
        content: '发票迟迟不开，财务报销有问题',
        status: ComplaintStatus.PROCESSING,
        client_id: clientUser2?.id,
        client_name: '刘十二',
        client_phone: '13800138011',
        assignee_id: adminUser?.id,
        process_note: '已催促财务尽快开具发票',
        case_no: '2026京0101刑初0010号',
      },
      {
        type: ComplaintType.SERVICE_QUALITY,
        content: '律师更换没有提前通知，对新律师不了解',
        status: ComplaintStatus.CLOSED,
        client_id: clientUser?.id,
        client_name: '孙八',
        client_phone: '13800138007',
        assignee_id: complianceUser?.id,
        process_note: '已向客户解释更换原因，介绍新律师背景',
        resolution: '客户接受新律师，问题解决',
        satisfaction_score: 4,
        case_no: '2026京0102民初0011号',
      },
    ];

    for (const data of complaintData) {
      const existing = await this.complaintRepository.findOne({ where: { content: data.content } });
      if (!existing) {
        await this.complaintRepository.save({
          ...data,
          organization_id: orgId,
        });
      }
    }
  }

  private async seedFinanceData(orgId: string, userMap: Record<string, User>) {
    const lawyerUser = userMap['13800138004'];
    const lawyerUser2 = userMap['13800138008'];
    const salesUser = userMap['13800138003'];
    const salesUser2 = userMap['13800138009'];
    const financeUser = userMap['13800138006'];

    const cases = await this.caseRepository.find({ where: { organization_id: orgId } });

    for (const caseEntity of cases) {
      const existingFee = await this.feeRepository.findOne({ where: { case_id: caseEntity.id } });
      if (!existingFee) {
        const fee = await this.feeRepository.save({
          amount: caseEntity.fee_amount || 30000,
          case_id: caseEntity.id,
          description: '案件代理费',
          paid: caseEntity.status === CaseStatus.CLOSED,
          paid_at: caseEntity.status === CaseStatus.CLOSED ? new Date() : null,
          payment_method: caseEntity.status === CaseStatus.CLOSED ? 'bank_transfer' : null,
          organization_id: orgId,
        });

        await this.profitShareRepository.save([
          {
            case_id: caseEntity.id,
            role: FeeRole.LAWYER,
            user_id: caseEntity.assignee_lawyer_id || lawyerUser?.id,
            percentage: 50,
            amount: (caseEntity.fee_amount || 30000) * 0.5,
            paid: caseEntity.status === CaseStatus.CLOSED,
            organization_id: orgId,
          },
          {
            case_id: caseEntity.id,
            role: FeeRole.SALES,
            user_id: salesUser?.id,
            percentage: 20,
            amount: (caseEntity.fee_amount || 30000) * 0.2,
            paid: caseEntity.status === CaseStatus.CLOSED,
            organization_id: orgId,
          },
          {
            case_id: caseEntity.id,
            role: FeeRole.ORG,
            percentage: 30,
            amount: (caseEntity.fee_amount || 30000) * 0.3,
            paid: caseEntity.status === CaseStatus.CLOSED,
            organization_id: orgId,
          },
        ]);

        if (caseEntity.status === CaseStatus.PROCESSING) {
          await this.refundRepository.save({
            case_id: caseEntity.id,
            fee_id: fee.id,
            amount: Math.floor((caseEntity.fee_amount || 30000) * 0.1),
            reason: '客户申请部分退款，因服务不满意',
            status: RefundStatus.PENDING,
            organization_id: orgId,
          });
        }

        const invoiceStatus = caseEntity.status === CaseStatus.CLOSED 
          ? InvoiceStatus.PAID 
          : caseEntity.status === CaseStatus.PROCESSING
            ? InvoiceStatus.ISSUED
            : InvoiceStatus.PENDING;

        await this.invoiceRepository.save({
          case_id: caseEntity.id,
          fee_id: fee.id,
          amount: caseEntity.fee_amount || 30000,
          invoice_no: `FP${Date.now()}${caseEntity.id.slice(-4)}`,
          invoice_type: 'company',
          status: invoiceStatus,
          organization_id: orgId,
        });
      }
    }
  }

  private async seedPaymentRecords(orgId: string, userMap: Record<string, User>) {
    const clientUser = userMap['13800138007'];
    const clientUser2 = userMap['13800138011'];
    const cases = await this.caseRepository.find({ where: { organization_id: orgId }, take: 8 });

    const paymentData: {
      case_id: string;
      client_id: string;
      amount: number;
      status: PaymentStatus;
      method: PaymentMethod;
    }[] = [
      {
        case_id: cases[0]?.id || '',
        client_id: clientUser?.id || '',
        amount: 50000,
        status: PaymentStatus.PAID,
        method: PaymentMethod.ALIPAY,
      },
      {
        case_id: cases[1]?.id || '',
        client_id: clientUser?.id || '',
        amount: 30000,
        status: PaymentStatus.PAID,
        method: PaymentMethod.WECHAT,
      },
      {
        case_id: cases[2]?.id || '',
        client_id: clientUser?.id || '',
        amount: 15000,
        status: PaymentStatus.PENDING,
        method: PaymentMethod.BANK,
      },
      {
        case_id: cases[3]?.id || '',
        client_id: clientUser2?.id || '',
        amount: 80000,
        status: PaymentStatus.PAID,
        method: PaymentMethod.ALIPAY,
      },
      {
        case_id: cases[4]?.id || '',
        client_id: clientUser2?.id || '',
        amount: 60000,
        status: PaymentStatus.FAILED,
        method: PaymentMethod.WECHAT,
      },
      {
        case_id: cases[5]?.id || '',
        client_id: clientUser?.id || '',
        amount: 25000,
        status: PaymentStatus.PAID,
        method: PaymentMethod.BANK,
      },
      {
        case_id: cases[6]?.id || '',
        client_id: clientUser?.id || '',
        amount: 40000,
        status: PaymentStatus.PENDING,
        method: PaymentMethod.ALIPAY,
      },
      {
        case_id: cases[7]?.id || '',
        client_id: clientUser2?.id || '',
        amount: 35000,
        status: PaymentStatus.PAID,
        method: PaymentMethod.WECHAT,
      },
    ];

    for (const data of paymentData) {
      const existing = await this.paymentRecordRepository.findOne({ where: { case_id: data.case_id } });
      if (!existing && data.case_id) {
        await this.paymentRecordRepository.save(data);
      }
    }
  }

  private async seedMarketingMaterials(orgId: string, userMap: Record<string, User>) {
    const marketingUser = userMap['13800138002'];

    const materialData = [
      {
        name: '婚姻律师服务介绍.pdf',
        file_path: '/materials/marriage-intro.pdf',
        file_type: 'pdf',
        size: 512000,
        tags: '婚姻,离婚,律师',
        platform: 'douyin',
        is_ai_generated: false,
        compliance_checked: false,
      },
      {
        name: '交通事故赔偿指南.pdf',
        file_path: '/materials/traffic-guide.pdf',
        file_type: 'pdf',
        size: 768000,
        tags: '交通,事故,赔偿',
        platform: 'baidu',
        is_ai_generated: true,
        compliance_checked: true,
        compliance_result: 'pass',
      },
      {
        name: '劳动仲裁维权攻略.docx',
        file_path: '/materials/labor-guide.docx',
        file_type: 'docx',
        size: 256000,
        tags: '劳动,仲裁,维权',
        platform: 'wechat',
        is_ai_generated: false,
        compliance_checked: true,
        compliance_result: 'pass',
      },
      {
        name: '债务追讨法律途径.pdf',
        file_path: '/materials/debt-guide.pdf',
        file_type: 'pdf',
        size: 450000,
        tags: '债务,追讨,法律',
        platform: 'kuaishou',
        is_ai_generated: true,
        compliance_checked: true,
        compliance_result: 'reject',
      },
      {
        name: '房产纠纷处理指南.pdf',
        file_path: '/materials/property-guide.pdf',
        file_type: 'pdf',
        size: 620000,
        tags: '房产,纠纷,处理',
        platform: 'douyin',
        is_ai_generated: true,
        compliance_checked: true,
        compliance_result: 'pass',
      },
      {
        name: '合同纠纷解决方案.docx',
        file_path: '/materials/contract-guide.docx',
        file_type: 'docx',
        size: 380000,
        tags: '合同,纠纷,解决',
        platform: 'baidu',
        is_ai_generated: false,
        compliance_checked: false,
      },
      {
        name: '工伤赔偿流程详解.pdf',
        file_path: '/materials/work-injury-guide.pdf',
        file_type: 'pdf',
        size: 480000,
        tags: '工伤,赔偿,流程',
        platform: 'wechat',
        is_ai_generated: true,
        compliance_checked: true,
        compliance_result: 'pass',
      },
      {
        name: '刑事辩护律师服务.pdf',
        file_path: '/materials/criminal-defense.pdf',
        file_type: 'pdf',
        size: 580000,
        tags: '刑事,辩护,律师',
        platform: 'kuaishou',
        is_ai_generated: false,
        compliance_checked: true,
        compliance_result: 'warning',
      },
      {
        name: '医疗纠纷维权手册.pdf',
        file_path: '/materials/medical-dispute.pdf',
        file_type: 'pdf',
        size: 680000,
        tags: '医疗,纠纷,维权',
        platform: 'douyin',
        is_ai_generated: true,
        compliance_checked: false,
      },
      {
        name: '拆迁补偿法律指南.pdf',
        file_path: '/materials/demolition-guide.pdf',
        file_type: 'pdf',
        size: 720000,
        tags: '拆迁,补偿,法律',
        platform: 'baidu',
        is_ai_generated: true,
        compliance_checked: true,
        compliance_result: 'pass',
      },
      {
        name: '知识产权保护指南.docx',
        file_path: '/materials/ip-guide.docx',
        file_type: 'docx',
        size: 420000,
        tags: '知识产权,保护,指南',
        platform: 'wechat',
        is_ai_generated: false,
        compliance_checked: true,
        compliance_result: 'pass',
      },
      {
        name: '公司法务常见问题解答.pdf',
        file_path: '/materials/corporate-law.pdf',
        file_type: 'pdf',
        size: 550000,
        tags: '公司,法务,解答',
        platform: 'kuaishou',
        is_ai_generated: true,
        compliance_checked: true,
        compliance_result: 'warning',
      },
    ];

    for (const data of materialData) {
      const existing = await this.marketingMaterialRepository.findOne({ where: { name: data.name } });
      if (!existing) {
        await this.marketingMaterialRepository.save({
          ...data,
          organization_id: orgId,
          uploaded_by_id: marketingUser?.id,
        });
      }
    }
  }

  private async seedMarketingContents(orgId: string, userMap: Record<string, User>) {
    const marketingUser = userMap['13800138002'];
    const complianceUser = userMap['13800138010'];

    const contentData: {
      title: string;
      content: string;
      content_type: string;
      platform: PlatformType;
      status: ContentStatus;
      compliance_issues?: string;
      compliance_suggestions?: string;
      review_time?: Date;
      reviewer_id?: string;
    }[] = [
      {
        title: '婚姻律师服务宣传文案',
        content: '专业婚姻律师团队，十年办案经验，帮您解决婚姻难题，快速离婚，财产分割，子女抚养权，一站式法律服务',
        content_type: 'ad_copy',
        platform: PlatformType.DOUYIN,
        status: ContentStatus.APPROVED,
        compliance_issues: '',
        compliance_suggestions: '',
        review_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        reviewer_id: complianceUser?.id,
      },
      {
        title: '交通事故赔偿广告',
        content: '交通事故专业律师，免费咨询，不成功不收费，最高赔偿可达百万，快速处理，当天立案',
        content_type: 'ad_copy',
        platform: PlatformType.BAIDU,
        status: ContentStatus.REJECTED,
        compliance_issues: '使用"最高赔偿可达百万"等诱导性表述，"不成功不收费"可能违反律师收费规定',
        compliance_suggestions: '修改为"专业交通事故律师，免费咨询，依法维权"',
        review_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        reviewer_id: complianceUser?.id,
      },
      {
        title: '劳动仲裁维权指南',
        content: '劳动仲裁专家，帮您讨回公道，拖欠工资，违法解除劳动合同，双倍赔偿，免费法律咨询',
        content_type: 'article',
        platform: PlatformType.WECHAT,
        status: ContentStatus.APPROVED,
        compliance_issues: '',
        compliance_suggestions: '',
        review_time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        reviewer_id: complianceUser?.id,
      },
      {
        title: '债务追讨专业服务',
        content: '债务追讨专家，成功率99%，快速回款，合法合规，全国案件均可代理，不成功不收费',
        content_type: 'ad_copy',
        platform: PlatformType.KUAISHOU,
        status: ContentStatus.APPROVED,
        compliance_issues: '使用"成功率99%"等绝对化用语，违反广告法',
        compliance_suggestions: '修改为"债务追讨专业律师，经验丰富，合法维权"',
        review_time: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        reviewer_id: complianceUser?.id,
      },
      {
        title: '房产纠纷解决方案',
        content: '房产纠纷专业律师，处理各类房产案件，继承、买卖、租赁、拆迁，胜诉率高，服务周到',
        content_type: 'article',
        platform: PlatformType.DOUYIN,
        status: ContentStatus.APPROVED,
        compliance_issues: '',
        compliance_suggestions: '',
        review_time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        reviewer_id: complianceUser?.id,
      },
      {
        title: '合同纠纷法律帮助',
        content: '合同纠纷律师，专业处理各类合同案件，起草审核合同，违约赔偿，诉讼代理，高效专业',
        content_type: 'ad_copy',
        platform: PlatformType.BAIDU,
        status: ContentStatus.PENDING_REVIEW,
        compliance_issues: '',
        compliance_suggestions: '',
      },
      {
        title: '工伤赔偿维权攻略',
        content: '工伤赔偿专业律师，帮您争取最大利益，认定工伤，伤残鉴定，赔偿协商，全程代理',
        content_type: 'article',
        platform: PlatformType.WECHAT,
        status: ContentStatus.APPROVED,
        compliance_issues: '',
        compliance_suggestions: '',
        review_time: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        reviewer_id: complianceUser?.id,
      },
      {
        title: '刑事辩护律师团队',
        content: '资深刑事辩护律师，成功办理多起重大刑事案件，取保候审，缓刑辩护，无罪辩护，专业可靠',
        content_type: 'ad_copy',
        platform: PlatformType.KUAISHOU,
        status: ContentStatus.APPROVED,
        compliance_issues: '',
        compliance_suggestions: '',
        review_time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        reviewer_id: complianceUser?.id,
      },
      {
        title: '医疗纠纷维权指南',
        content: '医疗纠纷专业律师，处理各类医疗事故案件，误诊误治，手术失误，药品伤害，帮您讨回公道',
        content_type: 'article',
        platform: PlatformType.DOUYIN,
        status: ContentStatus.PENDING_REVIEW,
        compliance_issues: '',
        compliance_suggestions: '',
      },
      {
        title: '拆迁补偿法律帮助',
        content: '拆迁补偿专业律师，帮您争取合理补偿，评估异议，行政复议，诉讼维权，经验丰富',
        content_type: 'ad_copy',
        platform: PlatformType.BAIDU,
        status: ContentStatus.APPROVED,
        compliance_issues: '',
        compliance_suggestions: '',
        review_time: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        reviewer_id: complianceUser?.id,
      },
      {
        title: '知识产权保护服务',
        content: '知识产权律师，专利、商标、著作权保护，侵权诉讼，商业秘密保护，专业法律服务',
        content_type: 'article',
        platform: PlatformType.WECHAT,
        status: ContentStatus.APPROVED,
        compliance_issues: '内容过于笼统，建议明确服务范围和资质',
        compliance_suggestions: '补充具体服务内容和律师资质信息',
        review_time: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
        reviewer_id: complianceUser?.id,
      },
      {
        title: '公司法务咨询服务',
        content: '公司法律顾问，合同审查，股权设计，劳动人事，知识产权，全方位法律服务，助您企业发展',
        content_type: 'ad_copy',
        platform: PlatformType.KUAISHOU,
        status: ContentStatus.APPROVED,
        compliance_issues: '',
        compliance_suggestions: '',
        review_time: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        reviewer_id: complianceUser?.id,
      },
    ];

    for (const data of contentData) {
      const existing = await this.marketingContentRepository.findOne({ where: { title: data.title } });
      if (!existing) {
        await this.marketingContentRepository.save({
          ...data,
          organization_id: orgId,
          operator_id: marketingUser?.id,
        });
      }
    }
  }

  private async seedSalesCompliance(orgId: string, userMap: Record<string, User>) {
    const salesUser = userMap['13800138003'];
    const salesUser2 = userMap['13800138009'];
    const leads = await this.leadRepository.find({ where: { organization_id: orgId }, take: 12 });

    const complianceData: {
      channel: SalesChannel;
      content: string;
      check_result: SalesCheckResult;
      violation_details: string;
      risk_disclosure_accepted: boolean;
      risk_disclosure_time?: Date;
      risk_disclosure_content?: string;
    }[] = [
      {
        channel: SalesChannel.PHONE,
        content: '您好，我是XX律所的张律师，看到您在抖音上咨询婚姻问题，我们可以免费为您解答',
        check_result: SalesCheckResult.PASS,
        violation_details: '',
        risk_disclosure_accepted: true,
        risk_disclosure_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        risk_disclosure_content: '已向客户说明案件风险和收费标准',
      },
      {
        channel: SalesChannel.WECHAT,
        content: '这个案子很简单，肯定能赢，您放心交给我们',
        check_result: SalesCheckResult.VIOLATION,
        violation_details: '承诺案件结果，违反律师执业规范',
        risk_disclosure_accepted: true,
        risk_disclosure_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        risk_disclosure_content: '',
      },
      {
        channel: SalesChannel.PHONE,
        content: '我们律所和法院有关系，可以帮您优先处理案件',
        check_result: SalesCheckResult.VIOLATION,
        violation_details: '暗示与司法机关有关系，属于不正当竞争',
        risk_disclosure_accepted: false,
        risk_disclosure_content: '',
      },
      {
        channel: SalesChannel.WECHAT,
        content: '您的情况符合劳动仲裁条件，我们可以帮您申请双倍赔偿，费用方面可以商量',
        check_result: SalesCheckResult.PASS,
        violation_details: '',
        risk_disclosure_accepted: true,
        risk_disclosure_time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        risk_disclosure_content: '已说明仲裁风险和收费标准',
      },
      {
        channel: SalesChannel.PHONE,
        content: '债务追讨这个案子我们很有经验，之前类似的案件都胜诉了',
        check_result: SalesCheckResult.WARNING,
        violation_details: '暗示案件结果，建议避免提及既往胜诉案例',
        risk_disclosure_accepted: true,
        risk_disclosure_time: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        risk_disclosure_content: '',
      },
      {
        channel: SalesChannel.QQ,
        content: '您好，请问您方便电话沟通吗？我可以详细为您分析案件情况',
        check_result: SalesCheckResult.PASS,
        violation_details: '',
        risk_disclosure_accepted: false,
        risk_disclosure_content: '',
      },
      {
        channel: SalesChannel.WECHAT,
        content: '婚姻案件涉及财产分割，我们可以帮您争取最大利益，收费合理',
        check_result: SalesCheckResult.PASS,
        violation_details: '',
        risk_disclosure_accepted: true,
        risk_disclosure_time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        risk_disclosure_content: '已说明财产分割风险和收费标准',
      },
      {
        channel: SalesChannel.PHONE,
        content: '交通事故赔偿我们可以帮您多要一些，只要您配合',
        check_result: SalesCheckResult.WARNING,
        violation_details: '暗示可以帮助客户获取不当利益，建议规范表述',
        risk_disclosure_accepted: true,
        risk_disclosure_time: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        risk_disclosure_content: '',
      },
      {
        channel: SalesChannel.WECHAT,
        content: '合同纠纷这个案子证据很充分，胜诉概率很高',
        check_result: SalesCheckResult.WARNING,
        violation_details: '评估胜诉概率，违反律师执业规范',
        risk_disclosure_accepted: false,
        risk_disclosure_content: '',
      },
      {
        channel: SalesChannel.PHONE,
        content: '工伤赔偿流程比较复杂，建议您委托专业律师处理，我们可以全程代理',
        check_result: SalesCheckResult.PASS,
        violation_details: '',
        risk_disclosure_accepted: true,
        risk_disclosure_time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        risk_disclosure_content: '已说明工伤认定流程和风险',
      },
      {
        channel: SalesChannel.QQ,
        content: '刑事辩护我们很专业，之前办过很多类似案件，都取得了好结果',
        check_result: SalesCheckResult.WARNING,
        violation_details: '提及既往案例暗示结果，建议避免',
        risk_disclosure_accepted: true,
        risk_disclosure_time: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        risk_disclosure_content: '',
      },
      {
        channel: SalesChannel.WECHAT,
        content: '医疗纠纷案件我们有专门的医疗专家团队，可以帮您分析病历',
        check_result: SalesCheckResult.PASS,
        violation_details: '',
        risk_disclosure_accepted: false,
        risk_disclosure_content: '',
      },
    ];

    for (let i = 0; i < complianceData.length && i < leads.length; i++) {
      const data = complianceData[i];
      const lead = leads[i];
      const existing = await this.salesComplianceRepository.findOne({ where: { lead_id: lead.id } });
      if (!existing) {
        await this.salesComplianceRepository.save({
          ...data,
          lead_id: lead.id,
          sales_id: i % 2 === 0 ? salesUser?.id : salesUser2?.id,
          organization_id: orgId,
        });
      }
    }
  }

  private async seedSigningCompliance(orgId: string, userMap: Record<string, User>) {
    const lawyerUser = userMap['13800138004'];
    const lawyerUser2 = userMap['13800138008'];
    const clientUser = userMap['13800138007'];
    const clientUser2 = userMap['13800138011'];
    const cases = await this.caseRepository.find({ where: { organization_id: orgId }, take: 12 });

    const complianceData: {
      status: SigningStatus;
      lawyer_qualification_verified: boolean;
      risk_disclosure_signed: boolean;
      contract_compliance_passed: boolean;
      contract_compliance_issues: string;
      contract_content?: string;
      signed_time?: Date;
      risk_disclosure_time?: Date;
    }[] = [
      {
        status: SigningStatus.SIGNED,
        lawyer_qualification_verified: true,
        risk_disclosure_signed: true,
        contract_compliance_passed: true,
        contract_compliance_issues: '',
        contract_content: '案件代理协议，双方权利义务明确，费用标准合理',
        signed_time: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        risk_disclosure_time: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
      },
      {
        status: SigningStatus.SIGNED,
        lawyer_qualification_verified: true,
        risk_disclosure_signed: true,
        contract_compliance_passed: true,
        contract_compliance_issues: '',
        contract_content: '交通事故案件代理协议，风险代理条款符合规定',
        signed_time: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        risk_disclosure_time: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
      },
      {
        status: SigningStatus.REVIEWING,
        lawyer_qualification_verified: true,
        risk_disclosure_signed: false,
        contract_compliance_passed: false,
        contract_compliance_issues: '违约金条款过高，可能被法院调整',
        contract_content: '劳动仲裁案件代理协议草案',
      },
      {
        status: SigningStatus.SIGNED,
        lawyer_qualification_verified: true,
        risk_disclosure_signed: true,
        contract_compliance_passed: true,
        contract_compliance_issues: '',
        contract_content: '债务追讨案件代理协议，明确代理权限和费用',
        signed_time: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        risk_disclosure_time: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000),
      },
      {
        status: SigningStatus.PENDING,
        lawyer_qualification_verified: false,
        risk_disclosure_signed: false,
        contract_compliance_passed: false,
        contract_compliance_issues: '',
      },
      {
        status: SigningStatus.REJECTED,
        lawyer_qualification_verified: true,
        risk_disclosure_signed: false,
        contract_compliance_passed: false,
        contract_compliance_issues: '合同内容存在对客户不利的霸王条款',
        contract_content: '离婚案件代理协议草案，被客户拒绝',
      },
      {
        status: SigningStatus.SIGNED,
        lawyer_qualification_verified: true,
        risk_disclosure_signed: true,
        contract_compliance_passed: true,
        contract_compliance_issues: '',
        contract_content: '房产继承案件代理协议，费用分期支付',
        signed_time: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        risk_disclosure_time: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000),
      },
      {
        status: SigningStatus.REVIEWING,
        lawyer_qualification_verified: true,
        risk_disclosure_signed: true,
        contract_compliance_passed: false,
        contract_compliance_issues: '部分条款表述模糊，需要进一步明确',
        contract_content: '合同纠纷案件代理协议草案',
      },
      {
        status: SigningStatus.SIGNED,
        lawyer_qualification_verified: true,
        risk_disclosure_signed: true,
        contract_compliance_passed: true,
        contract_compliance_issues: '',
        contract_content: '工伤赔偿案件代理协议，风险代理',
        signed_time: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
        risk_disclosure_time: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000),
      },
      {
        status: SigningStatus.PENDING,
        lawyer_qualification_verified: false,
        risk_disclosure_signed: false,
        contract_compliance_passed: false,
        contract_compliance_issues: '',
      },
      {
        status: SigningStatus.SIGNED,
        lawyer_qualification_verified: true,
        risk_disclosure_signed: true,
        contract_compliance_passed: true,
        contract_compliance_issues: '',
        contract_content: '医疗纠纷案件代理协议，明确证据收集责任',
        signed_time: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        risk_disclosure_time: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
      },
      {
        status: SigningStatus.REVIEWING,
        lawyer_qualification_verified: true,
        risk_disclosure_signed: false,
        contract_compliance_passed: true,
        contract_compliance_issues: '',
        contract_content: '拆迁补偿案件代理协议草案',
      },
    ];

    for (let i = 0; i < complianceData.length && i < cases.length; i++) {
      const data = complianceData[i];
      const caseEntity = cases[i];
      const existing = await this.signingComplianceRepository.findOne({ where: { case_id: caseEntity.id } });
      if (!existing) {
        await this.signingComplianceRepository.save({
          ...data,
          case_id: caseEntity.id,
          client_id: caseEntity.client_id || (i % 2 === 0 ? clientUser?.id : clientUser2?.id),
          lawyer_id: caseEntity.assignee_lawyer_id || (i % 2 === 0 ? lawyerUser?.id : lawyerUser2?.id),
          organization_id: orgId,
        });
      }
    }
  }

  private async seedCaseSOP(orgId: string, userMap: Record<string, User>) {
    const lawyerUser = userMap['13800138004'];
    const lawyerUser2 = userMap['13800138008'];
    const cases = await this.caseRepository.find({ where: { organization_id: orgId }, take: 12 });

    const sopTemplates: Record<string, { step_name: string; step_order: number }[]> = {
      marriage: [
        { step_name: '案件受理', step_order: 1 },
        { step_name: '证据收集', step_order: 2 },
        { step_name: '调解协商', step_order: 3 },
        { step_name: '诉讼立案', step_order: 4 },
        { step_name: '开庭审理', step_order: 5 },
        { step_name: '判决执行', step_order: 6 },
      ],
      traffic: [
        { step_name: '案件受理', step_order: 1 },
        { step_name: '事故认定', step_order: 2 },
        { step_name: '伤残鉴定', step_order: 3 },
        { step_name: '赔偿协商', step_order: 4 },
        { step_name: '诉讼立案', step_order: 5 },
        { step_name: '判决执行', step_order: 6 },
      ],
      labor: [
        { step_name: '案件受理', step_order: 1 },
        { step_name: '证据收集', step_order: 2 },
        { step_name: '仲裁申请', step_order: 3 },
        { step_name: '开庭审理', step_order: 4 },
        { step_name: '裁决执行', step_order: 5 },
        { step_name: '诉讼上诉', step_order: 6 },
      ],
      debt: [
        { step_name: '案件受理', step_order: 1 },
        { step_name: '证据审核', step_order: 2 },
        { step_name: '还款协商', step_order: 3 },
        { step_name: '诉讼立案', step_order: 4 },
        { step_name: '财产保全', step_order: 5 },
        { step_name: '判决执行', step_order: 6 },
      ],
      other: [
        { step_name: '案件受理', step_order: 1 },
        { step_name: '案情分析', step_order: 2 },
        { step_name: '证据收集', step_order: 3 },
        { step_name: '法律研究', step_order: 4 },
        { step_name: '诉讼/仲裁', step_order: 5 },
        { step_name: '结案归档', step_order: 6 },
      ],
    };

    for (const caseEntity of cases) {
      const templates = sopTemplates[caseEntity.case_type] || sopTemplates.other;
      
      for (const template of templates) {
        const existing = await this.caseSOPRepository.findOne({ 
          where: { case_id: caseEntity.id, step_name: template.step_name } 
        });
        if (!existing) {
          const deadline = new Date(Date.now() + template.step_order * 10 * 24 * 60 * 60 * 1000);
          const isCompleted = caseEntity.status === CaseStatus.CLOSED || 
            (caseEntity.status === CaseStatus.HEARING && template.step_order <= 4) ||
            (caseEntity.status === CaseStatus.PROCESSING && template.step_order <= 2);
          
          await this.caseSOPRepository.save({
            case_id: caseEntity.id,
            case_type: caseEntity.case_type,
            step_name: template.step_name,
            step_order: template.step_order,
            status: isCompleted ? 'completed' : (deadline < new Date() ? 'overdue' : 'pending'),
            deadline: deadline,
            completed_time: isCompleted ? new Date(Date.now() - (6 - template.step_order) * 5 * 24 * 60 * 60 * 1000) : null,
            operator_id: caseEntity.assignee_lawyer_id || (Math.random() > 0.5 ? lawyerUser?.id : lawyerUser2?.id),
            notes: isCompleted ? `${template.step_name}已完成` : null,
            evidence_check_result: template.step_order === 2 || template.step_order === 3 ? '证据齐全' : null,
            evidence_verified: template.step_order === 2 || template.step_order === 3,
            organization_id: orgId,
          });
        }
      }
    }
  }

  // ============ Phase 3 营销模块种子数据 ============

  // 广告账户种子数据
  private async seedAdAccounts(orgId: string, userMap: Record<string, User>) {
    const marketingUser = userMap['13800138002'];

    const accountData = [
      { platform: AdPlatform.DOUYIN, account_name: '抖音主账户-婚姻业务', account_id: 'dy_acc_001', group_name: '婚姻组', balance: 50000, threshold: 5000, status: AdAccountStatus.ACTIVE },
      { platform: AdPlatform.DOUYIN, account_name: '抖音副账户-交通业务', account_id: 'dy_acc_002', group_name: '交通组', balance: 30000, threshold: 3000, status: AdAccountStatus.ACTIVE },
      { platform: AdPlatform.BAIDU, account_name: '百度主账户-劳动业务', account_id: 'bd_acc_001', group_name: '劳动组', balance: 80000, threshold: 8000, status: AdAccountStatus.ACTIVE },
      { platform: AdPlatform.BAIDU, account_name: '百度副账户-债务业务', account_id: 'bd_acc_002', group_name: '债务组', balance: 20000, threshold: 2000, status: AdAccountStatus.DISABLED },
      { platform: AdPlatform.TENCENT, account_name: '腾讯账户-综合业务', account_id: 'tx_acc_001', group_name: '综合组', balance: 60000, threshold: 6000, status: AdAccountStatus.ACTIVE },
      { platform: AdPlatform.TENCENT, account_name: '腾讯账户-其他业务', account_id: 'tx_acc_002', group_name: '其他组', balance: 15000, threshold: 1500, status: AdAccountStatus.UNAUTHORIZED },
      { platform: AdPlatform.KUAISHOU, account_name: '快手账户-婚姻业务', account_id: 'ks_acc_001', group_name: '婚姻组', balance: 40000, threshold: 4000, status: AdAccountStatus.ACTIVE },
      { platform: AdPlatform.KUAISHOU, account_name: '快手账户-劳动业务', account_id: 'ks_acc_002', group_name: '劳动组', balance: 25000, threshold: 2500, status: AdAccountStatus.ACTIVE },
      { platform: AdPlatform.DOUYIN, account_name: '抖音账户-房产继承', account_id: 'dy_acc_003', group_name: '其他组', balance: 35000, threshold: 3500, status: AdAccountStatus.ACTIVE },
      { platform: AdPlatform.BAIDU, account_name: '百度账户-刑事辩护', account_id: 'bd_acc_003', group_name: '其他组', balance: 10000, threshold: 1000, status: AdAccountStatus.UNAUTHORIZED },
    ];

    for (const data of accountData) {
      const existing = await this.adAccountRepository.findOne({ where: { account_id: data.account_id } });
      if (!existing) {
        await this.adAccountRepository.save({
          ...data,
          auth_token: JSON.stringify({ access_token: `token_${data.account_id}`, refresh_token: `refresh_${data.account_id}`, expires_in: 7200 }),
          authorized_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          organization_id: orgId,
          creator_id: marketingUser?.id,
        });
      }
    }
  }

  // 投放计划种子数据
  private async seedAdPlans(orgId: string, userMap: Record<string, User>) {
    const marketingUser = userMap['13800138002'];
    const accounts = await this.adAccountRepository.find({ where: { organization_id: orgId }, take: 10 });
    if (accounts.length === 0) return;

    const planConfigs = [
      { plan_name: '婚姻律师-抖音投放', case_type: 'marriage', budget: 2000, bid: 50, status: AdPlanStatus.RUNNING },
      { plan_name: '交通事故-抖音投放', case_type: 'traffic', budget: 1500, bid: 40, status: AdPlanStatus.RUNNING },
      { plan_name: '劳动仲裁-百度投放', case_type: 'labor', budget: 1800, bid: 45, status: AdPlanStatus.RUNNING },
      { plan_name: '债务追讨-百度投放', case_type: 'debt', budget: 1200, bid: 35, status: AdPlanStatus.PAUSED },
      { plan_name: '综合法律-腾讯投放', case_type: 'other', budget: 2500, bid: 60, status: AdPlanStatus.RUNNING },
      { plan_name: '房产纠纷-腾讯投放', case_type: 'other', budget: 1000, bid: 30, status: AdPlanStatus.PAUSED },
      { plan_name: '婚姻家事-快手投放', case_type: 'marriage', budget: 1600, bid: 42, status: AdPlanStatus.RUNNING },
      { plan_name: '工伤维权-快手投放', case_type: 'labor', budget: 1400, bid: 38, status: AdPlanStatus.RUNNING },
      { plan_name: '刑事辩护-抖音投放', case_type: 'other', budget: 2000, bid: 55, status: AdPlanStatus.ENDED },
      { plan_name: '合同纠纷-百度投放', case_type: 'other', budget: 1300, bid: 36, status: AdPlanStatus.RUNNING },
    ];

    for (let i = 0; i < planConfigs.length; i++) {
      const config = planConfigs[i];
      const account = accounts[i % accounts.length];
      const platformPlanId = `plat_plan_${account.account_id}_${i + 1}`;
      const existing = await this.adPlanRepository.findOne({ where: { platform_plan_id: platformPlanId } });
      if (!existing) {
        await this.adPlanRepository.save({
          account_id: account.id,
          plan_name: config.plan_name,
          case_type: config.case_type,
          budget: config.budget,
          bid: config.bid,
          status: config.status,
          platform_plan_id: platformPlanId,
          start_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          end_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
          organization_id: orgId,
          creator_id: marketingUser?.id,
        });
      }
    }
  }

  // 投放素材种子数据
  private async seedAdMaterials(orgId: string, userMap: Record<string, User>) {
    const marketingUser = userMap['13800138002'];
    const accounts = await this.adAccountRepository.find({ where: { organization_id: orgId }, take: 10 });
    const plans = await this.adPlanRepository.find({ where: { organization_id: orgId }, take: 10 });
    if (accounts.length === 0) return;

    const materialData = [
      { name: '婚姻律师-视频素材01', type: AdMaterialType.VIDEO, tags: ['离婚', '财产分割', '高转化'], file_path: '/ad-materials/marriage-video-01.mp4', channel: 'douyin', impressions: 50000, clicks: 2500, conversions: 120, cost: 8000, roi: 3.5, status: AdMaterialStatus.ACTIVE, compliance_status: MaterialComplianceStatus.PASSED, content_text: '专业婚姻律师，解决离婚财产分割难题', case_type: 'marriage' },
      { name: '交通事故-图文素材01', type: AdMaterialType.IMAGE, tags: ['交通事故', '赔偿', '伤残'], file_path: '/ad-materials/traffic-image-01.jpg', channel: 'baidu', impressions: 35000, clicks: 1800, conversions: 85, cost: 5400, roi: 2.8, status: AdMaterialStatus.ACTIVE, compliance_status: MaterialComplianceStatus.PASSED, content_text: '交通事故伤残鉴定，专业律师帮您维权', case_type: 'traffic' },
      { name: '劳动仲裁-文章素材01', type: AdMaterialType.ARTICLE, tags: ['劳动仲裁', '拖欠工资', '维权'], file_path: '/ad-materials/labor-article-01.html', channel: 'wechat', impressions: 28000, clicks: 1400, conversions: 65, cost: 4200, roi: 2.2, status: AdMaterialStatus.ACTIVE, compliance_status: MaterialComplianceStatus.PASSED, content_text: '公司拖欠工资怎么办？劳动仲裁全流程解析', case_type: 'labor' },
      { name: '债务追讨-视频素材02', type: AdMaterialType.VIDEO, tags: ['债务', '借条', '起诉'], file_path: '/ad-materials/debt-video-02.mp4', channel: 'kuaishou', impressions: 42000, clicks: 2100, conversions: 95, cost: 6300, roi: 3.0, status: AdMaterialStatus.PAUSED, compliance_status: MaterialComplianceStatus.NEED_MODIFICATION, content_text: '欠钱不还？教你如何通过法律途径追讨', case_type: 'debt' },
      { name: '房产继承-脚本素材01', type: AdMaterialType.SCRIPT, tags: ['房产', '继承', '遗产'], file_path: '/ad-materials/property-script-01.txt', channel: 'douyin', impressions: 18000, clicks: 900, conversions: 40, cost: 2700, roi: 1.8, status: AdMaterialStatus.DRAFT, compliance_status: MaterialComplianceStatus.PENDING, content_text: '房产继承纠纷如何处理？律师详细解读', case_type: 'other' },
      { name: '刑事辩护-视频素材03', type: AdMaterialType.VIDEO, tags: ['刑事', '辩护', '故意伤害'], file_path: '/ad-materials/criminal-video-03.mp4', channel: 'baidu', impressions: 60000, clicks: 3000, conversions: 150, cost: 9000, roi: 4.0, status: AdMaterialStatus.ACTIVE, compliance_status: MaterialComplianceStatus.PASSED, content_text: '涉嫌刑事犯罪？专业刑辩律师为您辩护', case_type: 'other' },
      { name: '医疗纠纷-图文素材02', type: AdMaterialType.IMAGE, tags: ['医疗', '事故', '赔偿'], file_path: '/ad-materials/medical-image-02.jpg', channel: 'tencent', impressions: 32000, clicks: 1600, conversions: 70, cost: 4800, roi: 2.5, status: AdMaterialStatus.ACTIVE, compliance_status: MaterialComplianceStatus.PASSED, content_text: '医疗事故维权，专业律师团队支持', case_type: 'other' },
      { name: '拆迁补偿-视频素材04', type: AdMaterialType.VIDEO, tags: ['拆迁', '补偿', '维权'], file_path: '/ad-materials/demolition-video-04.mp4', channel: 'kuaishou', impressions: 45000, clicks: 2250, conversions: 110, cost: 6750, roi: 3.2, status: AdMaterialStatus.ACTIVE, compliance_status: MaterialComplianceStatus.FORBIDDEN, content_text: '拆迁补偿不合理？律师教你如何争取合理补偿', case_type: 'other' },
      { name: '合同纠纷-文章素材02', type: AdMaterialType.ARTICLE, tags: ['合同', '违约', '赔偿'], file_path: '/ad-materials/contract-article-02.html', channel: 'wechat', impressions: 22000, clicks: 1100, conversions: 50, cost: 3300, roi: 2.0, status: AdMaterialStatus.ARCHIVED, compliance_status: MaterialComplianceStatus.PASSED, content_text: '合同违约如何索赔？法律实务指南', case_type: 'other' },
      { name: '工伤赔偿-图文素材03', type: AdMaterialType.IMAGE, tags: ['工伤', '赔偿', '认定'], file_path: '/ad-materials/workinjury-image-03.jpg', channel: 'douyin', impressions: 38000, clicks: 1900, conversions: 90, cost: 5700, roi: 2.7, status: AdMaterialStatus.ACTIVE, compliance_status: MaterialComplianceStatus.PASSED, content_text: '工伤认定流程复杂？律师帮您快速理赔', case_type: 'labor' },
    ];

    for (let i = 0; i < materialData.length; i++) {
      const data = materialData[i];
      const existing = await this.adMaterialRepository.findOne({ where: { name: data.name } });
      if (!existing) {
        const account = accounts[i % accounts.length];
        const plan = plans[i % plans.length];
        await this.adMaterialRepository.save({
          ...data,
          account_id: account?.id,
          plan_id: plan?.id,
          compliance_detail: data.compliance_status === MaterialComplianceStatus.PASSED ? '内容合规，通过审核' : (data.compliance_status === MaterialComplianceStatus.NEED_MODIFICATION ? '存在夸大宣传，需修改' : (data.compliance_status === MaterialComplianceStatus.FORBIDDEN ? '违规内容，禁止投放' : null)),
          compliance_checked_at: data.compliance_status !== MaterialComplianceStatus.PENDING ? new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) : null,
          organization_id: orgId,
          uploaded_by_id: marketingUser?.id,
        });
      }
    }
  }

  // 公域账号种子数据
  private async seedSocialAccounts(orgId: string, userMap: Record<string, User>) {
    const marketingUser = userMap['13800138002'];

    const accountData = [
      { platform: SocialPlatform.DOUYIN, account_name: '法律咨询达人号', account_id: 'dy_user_001', group_name: '抖音矩阵', followers: 500000, likes: 1500000, consultations: 3200, auth_status: SocialAuthStatus.AUTHORIZED },
      { platform: SocialPlatform.DOUYIN, account_name: '婚姻律师专业号', account_id: 'dy_user_002', group_name: '抖音矩阵', followers: 280000, likes: 890000, consultations: 2100, auth_status: SocialAuthStatus.AUTHORIZED },
      { platform: SocialPlatform.KUAISHOU, account_name: '法律援助直播间', account_id: 'ks_user_001', group_name: '快手矩阵', followers: 320000, likes: 980000, consultations: 1800, auth_status: SocialAuthStatus.AUTHORIZED },
      { platform: SocialPlatform.KUAISHOU, account_name: '交通事故咨询号', account_id: 'ks_user_002', group_name: '快手矩阵', followers: 180000, likes: 540000, consultations: 1200, auth_status: SocialAuthStatus.EXPIRED },
      { platform: SocialPlatform.WECHAT_VIDEO, account_name: '法律科普视频号', account_id: 'wx_video_001', group_name: '微信矩阵', followers: 150000, likes: 450000, consultations: 950, auth_status: SocialAuthStatus.AUTHORIZED },
      { platform: SocialPlatform.WECHAT_VIDEO, account_name: '劳动法专家号', account_id: 'wx_video_002', group_name: '微信矩阵', followers: 95000, likes: 285000, consultations: 680, auth_status: SocialAuthStatus.UNAUTHORIZED },
      { platform: SocialPlatform.WECHAT_OFFICIAL, account_name: '法律咨询公众号', account_id: 'wx_official_001', group_name: '微信矩阵', followers: 220000, likes: 660000, consultations: 1500, auth_status: SocialAuthStatus.AUTHORIZED },
      { platform: SocialPlatform.WECHAT_OFFICIAL, account_name: '债务处理公众号', account_id: 'wx_official_002', group_name: '微信矩阵', followers: 130000, likes: 390000, consultations: 820, auth_status: SocialAuthStatus.AUTHORIZED },
      { platform: SocialPlatform.DOUYIN, account_name: '刑事律师说法号', account_id: 'dy_user_003', group_name: '抖音矩阵', followers: 410000, likes: 1230000, consultations: 2500, auth_status: SocialAuthStatus.AUTHORIZED },
      { platform: SocialPlatform.KUAISHOU, account_name: '房产纠纷咨询号', account_id: 'ks_user_003', group_name: '快手矩阵', followers: 75000, likes: 225000, consultations: 480, auth_status: SocialAuthStatus.UNAUTHORIZED },
    ];

    for (const data of accountData) {
      const existing = await this.socialAccountRepository.findOne({ where: { account_id: data.account_id } });
      if (!existing) {
        await this.socialAccountRepository.save({
          ...data,
          authorized_at: data.auth_status === SocialAuthStatus.AUTHORIZED ? new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) : null,
          auth_token: data.auth_status === SocialAuthStatus.AUTHORIZED ? JSON.stringify({ access_token: `social_token_${data.account_id}`, expires_in: 2592000 }) : null,
          avatar_url: `https://cdn.example.com/avatars/${data.account_id}.jpg`,
          bio: '专注法律服务，维护您的合法权益',
          organization_id: orgId,
          creator_id: marketingUser?.id,
        });
      }
    }
  }

  // 转化事件种子数据
  private async seedConversionEvents(orgId: string, userMap: Record<string, User>) {
    const clientUser = userMap['13800138007'];
    const clientUser2 = userMap['13800138011'];
    const leads = await this.leadRepository.find({ where: { organization_id: orgId }, take: 10 });
    const cases = await this.caseRepository.find({ where: { organization_id: orgId }, take: 10 });
    const accounts = await this.adAccountRepository.find({ where: { organization_id: orgId }, take: 10 });
    const materials = await this.adMaterialRepository.find({ where: { organization_id: orgId }, take: 10 });
    const plans = await this.adPlanRepository.find({ where: { organization_id: orgId }, take: 10 });
    if (leads.length === 0) return;

    const eventConfigs = [
      { event_type: ConversionEventType.LEAD, channel: AdChannel.DOUYIN, keyword: '婚姻律师', amount: 0 },
      { event_type: ConversionEventType.WECHAT_ADD, channel: AdChannel.DOUYIN, keyword: '婚姻律师', amount: 0 },
      { event_type: ConversionEventType.INVITE, channel: AdChannel.DOUYIN, keyword: '婚姻律师', amount: 0 },
      { event_type: ConversionEventType.SIGN, channel: AdChannel.DOUYIN, keyword: '婚姻律师', amount: 50000 },
      { event_type: ConversionEventType.LEAD, channel: AdChannel.BAIDU, keyword: '交通事故赔偿', amount: 0 },
      { event_type: ConversionEventType.WECHAT_ADD, channel: AdChannel.BAIDU, keyword: '交通事故赔偿', amount: 0 },
      { event_type: ConversionEventType.SIGN, channel: AdChannel.BAIDU, keyword: '交通事故赔偿', amount: 30000 },
      { event_type: ConversionEventType.LEAD, channel: AdChannel.KUAISHOU, keyword: '劳动仲裁', amount: 0 },
      { event_type: ConversionEventType.INVITE, channel: AdChannel.KUAISHOU, keyword: '劳动仲裁', amount: 0 },
      { event_type: ConversionEventType.SIGN, channel: AdChannel.WECHAT, keyword: '债务追讨', amount: 80000 },
    ];

    for (let i = 0; i < eventConfigs.length; i++) {
      const config = eventConfigs[i];
      const lead = leads[i % leads.length];
      const caseEntity = cases[i % cases.length];
      const account = accounts[i % accounts.length];
      const material = materials[i % materials.length];
      const plan = plans[i % plans.length];
      // 通过 keyword + event_type + lead_id 做幂等校验
      const existing = await this.conversionEventRepository.findOne({
        where: { event_type: config.event_type, lead_id: lead.id, keyword: config.keyword },
      });
      if (!existing) {
        await this.conversionEventRepository.save({
          channel: config.channel,
          account_id: account?.id,
          plan_id: plan?.id,
          material_id: material?.id,
          event_type: config.event_type,
          amount: config.amount,
          keyword: config.keyword,
          client_id: config.event_type === ConversionEventType.SIGN ? (i % 2 === 0 ? clientUser?.id : clientUser2?.id) : null,
          lead_id: lead.id,
          case_id: config.event_type === ConversionEventType.SIGN ? caseEntity?.id : null,
          organization_id: orgId,
        });
      }
    }
  }

  // 活码种子数据
  private async seedLiveCodes(orgId: string, userMap: Record<string, User>) {
    const salesUser = userMap['13800138003'];
    const salesUser2 = userMap['13800138009'];
    const lawyerUser = userMap['13800138004'];
    const lawyerUser2 = userMap['13800138008'];

    const liveCodeData = [
      { code_type: 'wework', name: '婚姻业务企微活码', dispatch_rule: 'poll', bound_users: JSON.stringify([salesUser?.id, salesUser2?.id]) },
      { code_type: 'wework', name: '交通业务企微活码', dispatch_rule: 'load', bound_users: JSON.stringify([salesUser?.id, salesUser2?.id]) },
      { code_type: 'wework', name: '劳动业务企微活码', dispatch_rule: 'region', dispatch_config: JSON.stringify({ regions: ['北京', '上海', '广州'] }), bound_users: JSON.stringify([salesUser?.id]) },
      { code_type: 'wework', name: '债务业务企微活码', dispatch_rule: 'case_type', dispatch_config: JSON.stringify({ case_types: ['debt'] }), bound_users: JSON.stringify([salesUser2?.id]) },
      { code_type: 'personal', name: '婚姻律师个微活码', dispatch_rule: 'poll', bound_users: JSON.stringify([lawyerUser?.id]) },
      { code_type: 'personal', name: '交通律师个微活码', dispatch_rule: 'poll', bound_users: JSON.stringify([lawyerUser2?.id]) },
      { code_type: 'group', name: '婚姻咨询群活码', dispatch_rule: 'load', bound_users: JSON.stringify([salesUser?.id, lawyerUser?.id]) },
      { code_type: 'group', name: '劳动维权群活码', dispatch_rule: 'load', bound_users: JSON.stringify([salesUser2?.id, lawyerUser2?.id]) },
      { code_type: 'wework', name: '综合法律咨询活码', dispatch_rule: 'poll', bound_users: JSON.stringify([salesUser?.id, salesUser2?.id, lawyerUser?.id]) },
      { code_type: 'personal', name: '刑事辩护律师活码', dispatch_rule: 'poll', bound_users: JSON.stringify([lawyerUser2?.id]) },
    ];

    for (const data of liveCodeData) {
      const existing = await this.liveCodeRepository.findOne({ where: { name: data.name } });
      if (!existing) {
        await this.liveCodeRepository.save({
          ...data,
          dispatch_config: data.dispatch_config || JSON.stringify({ weights: { default: 1 } }),
          channel_id: `channel_${data.name.slice(0, 4)}`,
          qr_code_path: `/qr-codes/${encodeURIComponent(data.name)}.png`,
          status: 'active',
          organization_id: orgId,
        });
      }
    }
  }

  // 客户标签种子数据
  private async seedClientTags(orgId: string, userMap: Record<string, User>) {
    const tagData = [
      { tag_name: '抖音来源', tag_type: 'auto', category: 'source', rule_config: JSON.stringify({ trigger: 'source_channel', value: 'douyin' }) },
      { tag_name: '百度来源', tag_type: 'auto', category: 'source', rule_config: JSON.stringify({ trigger: 'source_channel', value: 'baidu' }) },
      { tag_name: '快手来源', tag_type: 'auto', category: 'source', rule_config: JSON.stringify({ trigger: 'source_channel', value: 'kuaishou' }) },
      { tag_name: '微信来源', tag_type: 'auto', category: 'source', rule_config: JSON.stringify({ trigger: 'source_channel', value: 'wechat' }) },
      { tag_name: '婚姻案由', tag_type: 'auto', category: 'case_type', rule_config: JSON.stringify({ trigger: 'case_type', value: 'marriage' }) },
      { tag_name: '交通案由', tag_type: 'auto', category: 'case_type', rule_config: JSON.stringify({ trigger: 'case_type', value: 'traffic' }) },
      { tag_name: '劳动案由', tag_type: 'auto', category: 'case_type', rule_config: JSON.stringify({ trigger: 'case_type', value: 'labor' }) },
      { tag_name: '高意向', tag_type: 'auto', category: 'intention', rule_config: JSON.stringify({ trigger: 'status', value: 'pending_sign' }) },
      { tag_name: 'VIP客户', tag_type: 'manual', category: 'custom', rule_config: null },
      { tag_name: '复购客户', tag_type: 'manual', category: 'custom', rule_config: null },
    ];

    for (const data of tagData) {
      const existing = await this.clientTagRepository.findOne({ where: { tag_name: data.tag_name, category: data.category } });
      if (!existing) {
        await this.clientTagRepository.save({
          ...data,
          organization_id: orgId,
        });
      }
    }
  }

  // ============ Phase 1 线索 CRM 种子数据 ============

  // 邀约任务种子数据
  private async seedInviteTasks(orgId: string, userMap: Record<string, User>) {
    const salesUser = userMap['13800138003'];
    const salesUser2 = userMap['13800138009'];
    const leads = await this.leadRepository.find({ where: { organization_id: orgId }, take: 10 });
    if (leads.length === 0) return;

    const taskConfigs = [
      { invite_method: InviteMethod.PHONE, status: InviteTaskStatus.ARRIVED, result: InviteResult.SUCCESS, result_note: '客户按时到访，已安排面谈', call_duration: 320 },
      { invite_method: InviteMethod.WECHAT, status: InviteTaskStatus.INVITED, result: null, result_note: '已通过微信邀约，待确认到访时间', call_duration: null },
      { invite_method: InviteMethod.PHONE, status: InviteTaskStatus.NOT_ARRIVED, result: InviteResult.INVALID, result_note: '客户承诺到访但未出现，电话无法接通', call_duration: 180 },
      { invite_method: InviteMethod.PHONE, status: InviteTaskStatus.ARRIVED, result: InviteResult.SUCCESS, result_note: '客户到访并已完成签约', call_duration: 450 },
      { invite_method: InviteMethod.WECHAT, status: InviteTaskStatus.INVITED, result: null, result_note: '微信沟通中，客户表示下周到访', call_duration: null },
      { invite_method: InviteMethod.PHONE, status: InviteTaskStatus.PENDING, result: null, result_note: null, call_duration: null },
      { invite_method: InviteMethod.PHONE, status: InviteTaskStatus.ARRIVED, result: InviteResult.SUCCESS, result_note: '客户到访，案件需求明确', call_duration: 280 },
      { invite_method: InviteMethod.WECHAT, status: InviteTaskStatus.NOT_ARRIVED, result: InviteResult.INVALID, result_note: '客户改约其他律所', call_duration: null },
      { invite_method: InviteMethod.PHONE, status: InviteTaskStatus.INVITED, result: null, result_note: '已电话邀约，约定后天到访', call_duration: 200 },
      { invite_method: InviteMethod.PHONE, status: InviteTaskStatus.ARRIVED, result: InviteResult.SUCCESS, result_note: '客户到访并完成咨询', call_duration: 350 },
    ];

    for (let i = 0; i < taskConfigs.length; i++) {
      const config = taskConfigs[i];
      const lead = leads[i % leads.length];
      const inviter = i % 2 === 0 ? salesUser : salesUser2;
      const existing = await this.inviteTaskRepository.findOne({
        where: { lead_id: lead.id, invite_method: config.invite_method },
      });
      if (!existing) {
        await this.inviteTaskRepository.save({
          lead_id: lead.id,
          inviter_id: inviter?.id,
          invite_method: config.invite_method,
          scheduled_time: new Date(Date.now() + (i - 3) * 24 * 60 * 60 * 1000),
          status: config.status,
          result: config.result,
          result_note: config.result_note,
          recording_url: config.invite_method === InviteMethod.PHONE ? `/recordings/invite_${lead.id}_${i + 1}.mp3` : null,
          call_duration: config.call_duration,
        });
      }
    }
  }

  // 商机种子数据
  private async seedOpportunities(orgId: string, userMap: Record<string, User>) {
    const salesUser = userMap['13800138003'];
    const salesUser2 = userMap['13800138009'];
    const leads = await this.leadRepository.find({ where: { organization_id: orgId }, take: 10 });
    if (leads.length === 0) return;

    const opportunityConfigs = [
      { stage: OpportunityStage.FIRST_CONTACT, quote_amount: 50000, actual_amount: null, status: OpportunityStatus.ACTIVE, requirement_note: '客户需求离婚财产分割，涉及一套房产', plan_note: '需准备财产清单和婚姻证明材料' },
      { stage: OpportunityStage.SIGNED, quote_amount: 30000, actual_amount: 30000, status: OpportunityStatus.COMPLETED, requirement_note: '交通事故伤残鉴定及赔偿协商', plan_note: '已完成签约，安排伤残鉴定' },
      { stage: OpportunityStage.FIRST_CONTACT, quote_amount: 15000, actual_amount: null, status: OpportunityStatus.ACTIVE, requirement_note: '劳动仲裁维权，拖欠工资3个月', plan_note: '准备劳动合同和工资流水' },
      { stage: OpportunityStage.SIGNED, quote_amount: 80000, actual_amount: 80000, status: OpportunityStatus.COMPLETED, requirement_note: '债务追讨50万元，有借条', plan_note: '已签约，准备起诉材料' },
      { stage: OpportunityStage.LOST, quote_amount: 60000, actual_amount: null, status: OpportunityStatus.COMPLETED, requirement_note: '客户咨询后选择其他律所', plan_note: '客户已流失，报价过高' },
      { stage: OpportunityStage.FIRST_CONTACT, quote_amount: 40000, actual_amount: null, status: OpportunityStatus.ACTIVE, requirement_note: '房产继承纠纷，涉及三套房产', plan_note: '需梳理继承关系和产权证明' },
      { stage: OpportunityStage.SIGNED, quote_amount: 35000, actual_amount: 35000, status: OpportunityStatus.COMPLETED, requirement_note: '合同违约纠纷，要求赔偿损失', plan_note: '已签约，整理合同和违约证据' },
      { stage: OpportunityStage.FIRST_CONTACT, quote_amount: 20000, actual_amount: null, status: OpportunityStatus.ACTIVE, requirement_note: '工伤赔偿，公司拒绝支付', plan_note: '准备工伤认定材料' },
      { stage: OpportunityStage.LOST, quote_amount: 100000, actual_amount: null, status: OpportunityStatus.COMPLETED, requirement_note: '刑事辩护需求，客户预算不足', plan_note: '客户无法接受报价' },
      { stage: OpportunityStage.SIGNED, quote_amount: 55000, actual_amount: 55000, status: OpportunityStatus.COMPLETED, requirement_note: '医疗纠纷，手术失误导致后遗症', plan_note: '已签约，准备医疗事故鉴定' },
    ];

    for (let i = 0; i < opportunityConfigs.length; i++) {
      const config = opportunityConfigs[i];
      const lead = leads[i % leads.length];
      const negotiator = i % 2 === 0 ? salesUser : salesUser2;
      const existing = await this.opportunityRepository.findOne({ where: { lead_id: lead.id } });
      if (!existing) {
        await this.opportunityRepository.save({
          lead_id: lead.id,
          negotiator_id: negotiator?.id,
          stage: config.stage,
          quote_amount: config.quote_amount,
          actual_amount: config.actual_amount,
          status: config.status,
          requirement_note: config.requirement_note,
          plan_note: config.plan_note,
        });
      }
    }
  }

  // 线索分配规则种子数据
  private async seedLeadAssignments(orgId: string, userMap: Record<string, User>) {
    const salesUser = userMap['13800138003'];
    const salesUser2 = userMap['13800138009'];

    const assignmentData = [
      { rule_name: '北京地区分配规则', rule_type: AssignmentRuleType.REGION, conditions: JSON.stringify({ region: '北京' }), target_user_id: salesUser?.id, priority: 10, enabled: true },
      { rule_name: '上海地区分配规则', rule_type: AssignmentRuleType.REGION, conditions: JSON.stringify({ region: '上海' }), target_user_id: salesUser2?.id, priority: 9, enabled: true },
      { rule_name: '婚姻案由分配规则', rule_type: AssignmentRuleType.CASE_TYPE, conditions: JSON.stringify({ case_type: 'marriage' }), target_user_id: salesUser?.id, priority: 8, enabled: true },
      { rule_name: '交通案由分配规则', rule_type: AssignmentRuleType.CASE_TYPE, conditions: JSON.stringify({ case_type: 'traffic' }), target_user_id: salesUser2?.id, priority: 8, enabled: true },
      { rule_name: '劳动案由分配规则', rule_type: AssignmentRuleType.CASE_TYPE, conditions: JSON.stringify({ case_type: 'labor' }), target_user_id: salesUser?.id, priority: 7, enabled: true },
      { rule_name: '债务案由分配规则', rule_type: AssignmentRuleType.CASE_TYPE, conditions: JSON.stringify({ case_type: 'debt' }), target_user_id: salesUser2?.id, priority: 7, enabled: true },
      { rule_name: '负载均衡分配规则A', rule_type: AssignmentRuleType.LOAD_BALANCE, conditions: JSON.stringify({ strategy: 'round_robin' }), target_user_id: salesUser?.id, priority: 5, enabled: true },
      { rule_name: '负载均衡分配规则B', rule_type: AssignmentRuleType.LOAD_BALANCE, conditions: JSON.stringify({ strategy: 'round_robin' }), target_user_id: salesUser2?.id, priority: 5, enabled: true },
      { rule_name: '其他案由分配规则', rule_type: AssignmentRuleType.CASE_TYPE, conditions: JSON.stringify({ case_type: 'other' }), target_user_id: salesUser?.id, priority: 3, enabled: true },
      { rule_name: '备用地区规则', rule_type: AssignmentRuleType.REGION, conditions: JSON.stringify({ region: '广州' }), target_user_id: salesUser2?.id, priority: 2, enabled: false },
    ];

    for (const data of assignmentData) {
      const existing = await this.leadAssignmentRepository.findOne({ where: { rule_name: data.rule_name } });
      if (!existing) {
        await this.leadAssignmentRepository.save({
          ...data,
          organization_id: orgId,
        });
      }
    }
  }

  // 线索公海池种子数据
  private async seedLeadPool(orgId: string, userMap: Record<string, User>) {
    const salesUser = userMap['13800138003'];
    const salesUser2 = userMap['13800138009'];
    const leads = await this.leadRepository.find({ where: { organization_id: orgId }, take: 10 });
    if (leads.length === 0) return;

    const poolConfigs = [
      { recycle_reason: RecycleReason.TIMEOUT, recycle_note: '跟进超时，30天未联系', status: LeadPoolStatus.AVAILABLE, taken_by: null, take_count: 0 },
      { recycle_reason: RecycleReason.MANUAL, recycle_note: '销售手动退回公海', status: LeadPoolStatus.TAKEN, taken_by: salesUser2, take_count: 1 },
      { recycle_reason: RecycleReason.TIMEOUT, recycle_note: '邀约未到访超时', status: LeadPoolStatus.AVAILABLE, taken_by: null, take_count: 2 },
      { recycle_reason: RecycleReason.MANUAL, recycle_note: '客户暂无意向，退回公海', status: LeadPoolStatus.DISCARDED, taken_by: null, take_count: 1 },
      { recycle_reason: RecycleReason.TIMEOUT, recycle_note: '跟进超时，60天未联系', status: LeadPoolStatus.AVAILABLE, taken_by: null, take_count: 0 },
      { recycle_reason: RecycleReason.MANUAL, recycle_note: '案件类型不匹配，退回公海', status: LeadPoolStatus.TAKEN, taken_by: salesUser, take_count: 1 },
      { recycle_reason: RecycleReason.TIMEOUT, recycle_note: '多次联系未果', status: LeadPoolStatus.AVAILABLE, taken_by: null, take_count: 3 },
      { recycle_reason: RecycleReason.MANUAL, recycle_note: '销售离职，线索回收到公海', status: LeadPoolStatus.TAKEN, taken_by: salesUser2, take_count: 2 },
      { recycle_reason: RecycleReason.TIMEOUT, recycle_note: '跟进超时，45天未联系', status: LeadPoolStatus.AVAILABLE, taken_by: null, take_count: 0 },
      { recycle_reason: RecycleReason.MANUAL, recycle_note: '客户预算不足，暂缓跟进', status: LeadPoolStatus.AVAILABLE, taken_by: null, take_count: 1 },
    ];

    for (let i = 0; i < poolConfigs.length; i++) {
      const config = poolConfigs[i];
      const lead = leads[i % leads.length];
      const existing = await this.leadPoolRepository.findOne({ where: { lead_id: lead.id } });
      if (!existing) {
        await this.leadPoolRepository.save({
          lead_id: lead.id,
          original_owner_id: (i % 2 === 0 ? salesUser : salesUser2)?.id,
          recycle_reason: config.recycle_reason,
          recycle_note: config.recycle_note,
          recycle_time: new Date(Date.now() - (i + 1) * 3 * 24 * 60 * 60 * 1000),
          status: config.status,
          taken_by_id: config.taken_by?.id,
          taken_at: config.status === LeadPoolStatus.TAKEN ? new Date(Date.now() - i * 24 * 60 * 60 * 1000) : null,
          take_count: config.take_count,
        });
      }
    }
  }

  // ============ Phase 1 案件办案种子数据 ============

  // 案件任务种子数据
  private async seedCaseTasks(orgId: string, userMap: Record<string, User>) {
    const lawyerUser = userMap['13800138004'];
    const lawyerUser2 = userMap['13800138008'];
    const assistantUser = userMap['13800138005'];
    const cases = await this.caseRepository.find({ where: { organization_id: orgId }, take: 10 });
    if (cases.length === 0) return;

    const taskConfigs = [
      { stage_name: '案件受理', stage_order: 1, task_name: '签订委托协议', status: CaseTaskStatus.COMPLETED, responsible_role: 'sales', priority: TaskPriority.HIGH, deadline_days: 3, is_required: true, description: '与客户签订委托代理协议', result: '已完成签约，协议存档' },
      { stage_name: '证据收集', stage_order: 2, task_name: '收集客户证据材料', status: CaseTaskStatus.COMPLETED, responsible_role: 'assistant', priority: TaskPriority.HIGH, deadline_days: 7, is_required: true, description: '收集案件相关证据材料', result: '证据材料已齐全' },
      { stage_name: '调解协商', stage_order: 3, task_name: '组织双方调解', status: CaseTaskStatus.IN_PROGRESS, responsible_role: 'lawyer', priority: TaskPriority.MEDIUM, deadline_days: 15, is_required: false, description: '尝试庭前调解', result: null },
      { stage_name: '诉讼立案', stage_order: 4, task_name: '准备立案材料', status: CaseTaskStatus.PENDING, responsible_role: 'lawyer', priority: TaskPriority.HIGH, deadline_days: 10, is_required: true, description: '准备起诉状和证据清单', result: null },
      { stage_name: '开庭审理', stage_order: 5, task_name: '出庭辩护', status: CaseTaskStatus.PENDING, responsible_role: 'lawyer', priority: TaskPriority.URGENT, deadline_days: 30, is_required: true, description: '开庭审理并辩护', result: null },
      { stage_name: '判决执行', stage_order: 6, task_name: '协助执行判决', status: CaseTaskStatus.PENDING, responsible_role: 'lawyer', priority: TaskPriority.MEDIUM, deadline_days: 60, is_required: false, description: '判决生效后协助执行', result: null },
      { stage_name: '案件受理', stage_order: 1, task_name: '案件信息录入', status: CaseTaskStatus.VERIFIED, responsible_role: 'assistant', priority: TaskPriority.MEDIUM, deadline_days: 2, is_required: true, description: '将案件信息录入系统', result: '案件信息已录入并核验' },
      { stage_name: '证据收集', stage_order: 2, task_name: '证据合法性审查', status: CaseTaskStatus.OVERDUE, responsible_role: 'lawyer', priority: TaskPriority.HIGH, deadline_days: 5, is_required: true, description: '审查证据合法性', result: null },
      { stage_name: '法律研究', stage_order: 4, task_name: '检索类似判例', status: CaseTaskStatus.IN_PROGRESS, responsible_role: 'assistant', priority: TaskPriority.LOW, deadline_days: 7, is_required: false, description: '检索类似案例和法律条文', result: null },
      { stage_name: '结案归档', stage_order: 6, task_name: '案件材料归档', status: CaseTaskStatus.CANCELLED, responsible_role: 'assistant', priority: TaskPriority.LOW, deadline_days: 5, is_required: true, description: '结案后材料归档', result: '案件未结案，任务取消' },
    ];

    for (let i = 0; i < taskConfigs.length; i++) {
      const config = taskConfigs[i];
      const caseEntity = cases[i % cases.length];
      const taskId = `task_${caseEntity.id}_${config.stage_order}_${i + 1}`;
      const existing = await this.caseTaskRepository.findOne({
        where: { case_id: caseEntity.id, task_id: taskId },
      });
      if (!existing) {
        const assignee = config.responsible_role === 'lawyer' ? (i % 2 === 0 ? lawyerUser : lawyerUser2) : (config.responsible_role === 'assistant' ? assistantUser : lawyerUser);
        const isCompleted = config.status === CaseTaskStatus.COMPLETED || config.status === CaseTaskStatus.VERIFIED;
        await this.caseTaskRepository.save({
          case_id: caseEntity.id,
          sop_template_id: `tpl_${config.stage_order}`,
          stage_id: `stage_${config.stage_order}`,
          stage_name: config.stage_name,
          stage_order: config.stage_order,
          task_id: taskId,
          task_name: config.task_name,
          status: config.status,
          responsible_role: config.responsible_role,
          assignee_id: assignee?.id,
          deadline: new Date(Date.now() + config.deadline_days * 24 * 60 * 60 * 1000),
          completed_at: isCompleted ? new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) : null,
          is_required: config.is_required,
          deadline_days: config.deadline_days,
          description: config.description,
          result: config.result,
          priority: config.priority,
          progress: config.status === CaseTaskStatus.COMPLETED || config.status === CaseTaskStatus.VERIFIED ? 100 : (config.status === CaseTaskStatus.IN_PROGRESS ? 50 : (config.status === CaseTaskStatus.PENDING ? 0 : 0)),
        });
      }
    }
  }

  // 案件预警种子数据
  private async seedCaseWarnings(orgId: string, userMap: Record<string, User>) {
    const lawyerUser = userMap['13800138004'];
    const lawyerUser2 = userMap['13800138008'];
    const cases = await this.caseRepository.find({ where: { organization_id: orgId }, take: 10 });
    if (cases.length === 0) return;

    // 预警配置：确保每个 warning_level 的 pending 状态都有 10 条以上
    const warningConfigs = [
      // urgent pending
      { warning_type: WarningType.HEARING_DATE, warning_level: WarningLevel.URGENT, target_offset: 7, status: WarningStatus.PENDING, advance_days: 3, description: '开庭日期临近，请准备庭审材料' },
      { warning_type: WarningType.EVIDENCE_PERIOD, warning_level: WarningLevel.URGENT, target_offset: 2, status: WarningStatus.PENDING, advance_days: 2, description: '举证期限紧急，需立即提交' },
      { warning_type: WarningType.PAYMENT_DEADLINE, warning_level: WarningLevel.URGENT, target_offset: 1, status: WarningStatus.PENDING, advance_days: 1, description: '诉讼费缴纳期限临近' },
      { warning_type: WarningType.APPEAL_PERIOD, warning_level: WarningLevel.URGENT, target_offset: 4, status: WarningStatus.PENDING, advance_days: 3, description: '上诉期限即将届满' },
      { warning_type: WarningType.STATUTE_EXPIRE, warning_level: WarningLevel.URGENT, target_offset: 7, status: WarningStatus.PENDING, advance_days: 5, description: '诉讼时效即将届满，请尽快立案' },
      { warning_type: WarningType.PRESERVATION_EXPIRE, warning_level: WarningLevel.URGENT, target_offset: 5, status: WarningStatus.PENDING, advance_days: 3, description: '财产保全期限即将到期' },
      { warning_type: WarningType.HEARING_DATE, warning_level: WarningLevel.URGENT, target_offset: 2, status: WarningStatus.PENDING, advance_days: 1, description: '其他紧急事项待处理' },
      { warning_type: WarningType.HEARING_DATE, warning_level: WarningLevel.URGENT, target_offset: 3, status: WarningStatus.PENDING, advance_days: 2, description: '庭前会议紧急准备' },
      { warning_type: WarningType.EVIDENCE_PERIOD, warning_level: WarningLevel.URGENT, target_offset: 1, status: WarningStatus.PENDING, advance_days: 1, description: '补充证据期限已非常紧迫' },
      { warning_type: WarningType.PAYMENT_DEADLINE, warning_level: WarningLevel.URGENT, target_offset: 2, status: WarningStatus.PENDING, advance_days: 1, description: '律师费缴纳期限临近' },
      { warning_type: WarningType.APPEAL_PERIOD, warning_level: WarningLevel.URGENT, target_offset: 3, status: WarningStatus.PENDING, advance_days: 2, description: '上诉材料提交期限临近' },
      // warning pending
      { warning_type: WarningType.EVIDENCE_PERIOD, warning_level: WarningLevel.WARNING, target_offset: 10, status: WarningStatus.PENDING, advance_days: 5, description: '举证期限即将届满，请及时提交证据' },
      { warning_type: WarningType.STATUTE_EXPIRE, warning_level: WarningLevel.WARNING, target_offset: 21, status: WarningStatus.PENDING, advance_days: 7, description: '诉讼时效预警，请关注' },
      { warning_type: WarningType.PAYMENT_DEADLINE, warning_level: WarningLevel.WARNING, target_offset: 5, status: WarningStatus.PENDING, advance_days: 3, description: '诉讼费缴纳期限临近' },
      { warning_type: WarningType.PRESERVATION_EXPIRE, warning_level: WarningLevel.WARNING, target_offset: 14, status: WarningStatus.PENDING, advance_days: 5, description: '财产保全期限即将到期' },
      { warning_type: WarningType.HEARING_DATE, warning_level: WarningLevel.WARNING, target_offset: 12, status: WarningStatus.PENDING, advance_days: 7, description: '开庭日期预警' },
      { warning_type: WarningType.APPEAL_PERIOD, warning_level: WarningLevel.WARNING, target_offset: 8, status: WarningStatus.PENDING, advance_days: 3, description: '上诉期限预警' },
      { warning_type: WarningType.STATUTE_EXPIRE, warning_level: WarningLevel.WARNING, target_offset: 6, status: WarningStatus.PENDING, advance_days: 2, description: '其他警告事项' },
      { warning_type: WarningType.EVIDENCE_PERIOD, warning_level: WarningLevel.WARNING, target_offset: 15, status: WarningStatus.PENDING, advance_days: 5, description: '补充证据材料期限提醒' },
      { warning_type: WarningType.STATUTE_EXPIRE, warning_level: WarningLevel.WARNING, target_offset: 30, status: WarningStatus.PENDING, advance_days: 7, description: '诉讼时效中断期限预警' },
      { warning_type: WarningType.PAYMENT_DEADLINE, warning_level: WarningLevel.WARNING, target_offset: 7, status: WarningStatus.PENDING, advance_days: 3, description: '保全费用缴纳期限临近' },
      { warning_type: WarningType.HEARING_DATE, warning_level: WarningLevel.WARNING, target_offset: 18, status: WarningStatus.PENDING, advance_days: 7, description: '远程开庭测试安排' },
      // reminder pending
      { warning_type: WarningType.HEARING_DATE, warning_level: WarningLevel.REMINDER, target_offset: 20, status: WarningStatus.PENDING, advance_days: 7, description: '开庭日期提醒' },
      { warning_type: WarningType.EVIDENCE_PERIOD, warning_level: WarningLevel.REMINDER, target_offset: 25, status: WarningStatus.PENDING, advance_days: 14, description: '举证期限提醒' },
      { warning_type: WarningType.STATUTE_EXPIRE, warning_level: WarningLevel.REMINDER, target_offset: 60, status: WarningStatus.PENDING, advance_days: 14, description: '诉讼时效提醒' },
      { warning_type: WarningType.PAYMENT_DEADLINE, warning_level: WarningLevel.REMINDER, target_offset: 30, status: WarningStatus.PENDING, advance_days: 7, description: '缴费期限提醒' },
      { warning_type: WarningType.PRESERVATION_EXPIRE, warning_level: WarningLevel.REMINDER, target_offset: 45, status: WarningStatus.PENDING, advance_days: 14, description: '保全到期提醒' },
      { warning_type: WarningType.APPEAL_PERIOD, warning_level: WarningLevel.REMINDER, target_offset: 18, status: WarningStatus.PENDING, advance_days: 7, description: '上诉期限提醒' },
      { warning_type: WarningType.PAYMENT_DEADLINE, warning_level: WarningLevel.REMINDER, target_offset: 10, status: WarningStatus.PENDING, advance_days: 3, description: '其他事项提醒' },
      { warning_type: WarningType.HEARING_DATE, warning_level: WarningLevel.REMINDER, target_offset: 14, status: WarningStatus.PENDING, advance_days: 7, description: '庭前会议提醒' },
      { warning_type: WarningType.EVIDENCE_PERIOD, warning_level: WarningLevel.REMINDER, target_offset: 22, status: WarningStatus.PENDING, advance_days: 7, description: '证据交换提醒' },
      { warning_type: WarningType.STATUTE_EXPIRE, warning_level: WarningLevel.REMINDER, target_offset: 90, status: WarningStatus.PENDING, advance_days: 30, description: '时效中断提醒' },
      { warning_type: WarningType.PAYMENT_DEADLINE, warning_level: WarningLevel.REMINDER, target_offset: 21, status: WarningStatus.PENDING, advance_days: 7, description: '第二期律师费缴纳提醒' },
      { warning_type: WarningType.PRESERVATION_EXPIRE, warning_level: WarningLevel.REMINDER, target_offset: 35, status: WarningStatus.PENDING, advance_days: 14, description: '续保期限提醒' },
      // processed / overdue 样本
      { warning_type: WarningType.APPEAL_PERIOD, warning_level: WarningLevel.URGENT, target_offset: 5, status: WarningStatus.PROCESSED, advance_days: 3, description: '上诉期限即将届满', handle_note: '已提醒律师准备上诉材料' },
      { warning_type: WarningType.HEARING_DATE, warning_level: WarningLevel.WARNING, target_offset: 14, status: WarningStatus.PROCESSED, advance_days: 7, description: '开庭日期预警', handle_note: '已通知律师安排出庭时间' },
      { warning_type: WarningType.PRESERVATION_EXPIRE, warning_level: WarningLevel.REMINDER, target_offset: 20, status: WarningStatus.OVERDUE, advance_days: 5, description: '财产保全期限已到期' },
      { warning_type: WarningType.PAYMENT_DEADLINE, warning_level: WarningLevel.URGENT, target_offset: 2, status: WarningStatus.OVERDUE, advance_days: 1, description: '诉讼费缴纳已逾期' },
    ];

    for (let i = 0; i < warningConfigs.length; i++) {
      const config = warningConfigs[i];
      const caseEntity = cases[i % cases.length];
      const existing = await this.caseWarningRepository.findOne({
        where: { case_id: caseEntity.id, warning_type: config.warning_type },
      });
      if (!existing) {
        const handler = i % 2 === 0 ? lawyerUser : lawyerUser2;
        await this.caseWarningRepository.save({
          case_id: caseEntity.id,
          warning_type: config.warning_type,
          warning_level: config.warning_level,
          warning_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          target_date: new Date(Date.now() + config.target_offset * 24 * 60 * 60 * 1000),
          status: config.status,
          handler_id: config.status === WarningStatus.PROCESSED ? handler?.id : null,
          handle_note: config.handle_note || null,
          description: config.description,
          advance_days: config.advance_days,
          handled_at: config.status === WarningStatus.PROCESSED ? new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) : null,
        });
      }
    }
  }

  // 证据种子数据
  private async seedEvidences(orgId: string, userMap: Record<string, User>) {
    const lawyerUser = userMap['13800138004'];
    const lawyerUser2 = userMap['13800138008'];
    const assistantUser = userMap['13800138005'];
    const cases = await this.caseRepository.find({ where: { organization_id: orgId }, take: 10 });
    if (cases.length === 0) return;

    const evidenceConfigs = [
      { name: '结婚证扫描件', type: EvidenceType.DOCUMENT, category: EvidenceCategory.PLAINTIFF, file_path: '/evidences/marriage-cert.pdf', file_size: 524288, mime_type: 'application/pdf', description: '当事人结婚证扫描件', is_archived: false },
      { name: '房产证复印件', type: EvidenceType.DOCUMENT, category: EvidenceCategory.PLAINTIFF, file_path: '/evidences/property-cert.pdf', file_size: 786432, mime_type: 'application/pdf', description: '涉案房产证复印件', is_archived: false },
      { name: '交通事故认定书', type: EvidenceType.EVIDENCE, category: EvidenceCategory.COURT, file_path: '/evidences/traffic-report.pdf', file_size: 307200, mime_type: 'application/pdf', description: '交警出具的事故责任认定书', is_archived: false },
      { name: '伤残鉴定报告', type: EvidenceType.EVIDENCE, category: EvidenceCategory.COURT, file_path: '/evidences/injury-report.pdf', file_size: 614400, mime_type: 'application/pdf', description: '司法鉴定机构出具的伤残鉴定报告', is_archived: false },
      { name: '劳动合同', type: EvidenceType.CONTRACT, category: EvidenceCategory.PLAINTIFF, file_path: '/evidences/labor-contract.pdf', file_size: 419840, mime_type: 'application/pdf', description: '劳动者与公司签订的劳动合同', is_archived: false },
      { name: '工资流水记录', type: EvidenceType.EVIDENCE, category: EvidenceCategory.PLAINTIFF, file_path: '/evidences/salary-record.xlsx', file_size: 256000, mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', description: '近12个月工资银行流水', is_archived: false },
      { name: '借条原件扫描', type: EvidenceType.EVIDENCE, category: EvidenceCategory.PLAINTIFF, file_path: '/evidences/iou.jpg', file_size: 2048000, mime_type: 'image/jpeg', description: '借款50万元的借条原件扫描件', is_archived: false },
      { name: '银行转账凭证', type: EvidenceType.EVIDENCE, category: EvidenceCategory.PLAINTIFF, file_path: '/evidences/transfer-proof.pdf', file_size: 358400, mime_type: 'application/pdf', description: '借款转账的银行凭证', is_archived: false },
      { name: '委托代理合同', type: EvidenceType.CONTRACT, category: EvidenceCategory.OTHER, file_path: '/evidences/agency-contract.pdf', file_size: 307200, mime_type: 'application/pdf', description: '本所与客户签订的委托代理合同', is_archived: true },
      { name: '医疗病历资料', type: EvidenceType.DOCUMENT, category: EvidenceCategory.PLAINTIFF, file_path: '/evidences/medical-record.pdf', file_size: 1048576, mime_type: 'application/pdf', description: '医院就诊病历及检查报告', is_archived: false },
    ];

    for (let i = 0; i < evidenceConfigs.length; i++) {
      const config = evidenceConfigs[i];
      const caseEntity = cases[i % cases.length];
      const existing = await this.evidenceRepository.findOne({
        where: { case_id: caseEntity.id, name: config.name },
      });
      if (!existing) {
        const uploader = i % 3 === 0 ? lawyerUser : (i % 3 === 1 ? lawyerUser2 : assistantUser);
        await this.evidenceRepository.save({
          ...config,
          version: 1,
          case_id: caseEntity.id,
          upload_by_id: uploader?.id,
        });
      }
    }
  }

  // ============ Phase 1 财务种子数据 ============

  // 应收款种子数据
  private async seedReceivables(orgId: string, userMap: Record<string, User>) {
    const cases = await this.caseRepository.find({ where: { organization_id: orgId }, take: 10 });
    if (cases.length === 0) return;

    const receivableConfigs = [
      { contract_amount: 50000, received_amount: 50000, pending_amount: 0, status: ReceivableStatus.COMPLETED, remarks: '全额收款' },
      { contract_amount: 30000, received_amount: 15000, pending_amount: 15000, status: ReceivableStatus.PARTIAL, remarks: '分期付款，已收首期' },
      { contract_amount: 15000, received_amount: 0, pending_amount: 15000, status: ReceivableStatus.PENDING, remarks: '待收款' },
      { contract_amount: 80000, received_amount: 80000, pending_amount: 0, status: ReceivableStatus.COMPLETED, remarks: '全额收款' },
      { contract_amount: 60000, received_amount: 30000, pending_amount: 30000, status: ReceivableStatus.OVERDUE, remarks: '二期款项已逾期' },
      { contract_amount: 40000, received_amount: 20000, pending_amount: 20000, status: ReceivableStatus.PARTIAL, remarks: '分期付款中' },
      { contract_amount: 35000, received_amount: 35000, pending_amount: 0, status: ReceivableStatus.COMPLETED, remarks: '全额收款' },
      { contract_amount: 20000, received_amount: 10000, pending_amount: 10000, status: ReceivableStatus.PARTIAL, remarks: '分期付款中' },
      { contract_amount: 100000, received_amount: 0, pending_amount: 100000, status: ReceivableStatus.PENDING, remarks: '待收款' },
      { contract_amount: 55000, received_amount: 55000, pending_amount: 0, status: ReceivableStatus.COMPLETED, remarks: '全额收款' },
    ];

    for (let i = 0; i < receivableConfigs.length; i++) {
      const config = receivableConfigs[i];
      const caseEntity = cases[i % cases.length];
      const existing = await this.receivableRepository.findOne({ where: { case_id: caseEntity.id } });
      if (!existing) {
        const installmentPlan: { installment_id: string; amount: number; due_date: string; status: 'pending' | 'paid' | 'overdue'; paid_date?: string; paid_amount?: number }[] = config.status === ReceivableStatus.PARTIAL || config.status === ReceivableStatus.OVERDUE
          ? [
              { installment_id: 'inst_1', amount: config.contract_amount * 0.5, due_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), status: 'paid' as const, paid_date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), paid_amount: config.contract_amount * 0.5 },
              { installment_id: 'inst_2', amount: config.contract_amount * 0.5, due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), status: config.status === ReceivableStatus.OVERDUE ? 'overdue' as const : 'pending' as const },
            ]
          : config.status === ReceivableStatus.COMPLETED
            ? [{ installment_id: 'inst_1', amount: config.contract_amount, due_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), status: 'paid' as const, paid_date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), paid_amount: config.contract_amount }]
            : [{ installment_id: 'inst_1', amount: config.contract_amount, due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), status: 'pending' as const }];
        await this.receivableRepository.save({
          case_id: caseEntity.id,
          contract_amount: config.contract_amount,
          received_amount: config.received_amount,
          pending_amount: config.pending_amount,
          installment_plan: installmentPlan,
          status: config.status,
          remarks: config.remarks,
          organization_id: orgId,
        });
      }
    }
  }

  // 提成规则种子数据
  private async seedCommissionRules(orgId: string, userMap: Record<string, User>) {
    const ruleData = [
      { name: '投放岗固定提成', role_type: CommissionRoleType.MARKETING, commission_type: CommissionType.FIXED, commission_value: 200, case_type: null, description: '投放岗每条有效线索奖励200元' },
      { name: '邀约岗固定提成', role_type: CommissionRoleType.INVITE, commission_type: CommissionType.FIXED, commission_value: 500, case_type: null, description: '邀约岗每到访客户奖励500元' },
      { name: '谈案岗比例提成-婚姻', role_type: CommissionRoleType.SALES, commission_type: CommissionType.PERCENTAGE, commission_value: 10, case_type: 'marriage', description: '婚姻案件谈案岗提成10%' },
      { name: '谈案岗比例提成-交通', role_type: CommissionRoleType.SALES, commission_type: CommissionType.PERCENTAGE, commission_value: 12, case_type: 'traffic', description: '交通案件谈案岗提成12%' },
      { name: '谈案岗比例提成-劳动', role_type: CommissionRoleType.SALES, commission_type: CommissionType.PERCENTAGE, commission_value: 15, case_type: 'labor', description: '劳动案件谈案岗提成15%' },
      { name: '主办律师比例提成', role_type: CommissionRoleType.MAIN_LAWYER, commission_type: CommissionType.PERCENTAGE, commission_value: 40, case_type: null, description: '主办律师提成40%（阶梯）', tier_rules: JSON.stringify([{ min_amount: 0, max_amount: 50000, commission_value: 35 }, { min_amount: 50000, max_amount: 100000, commission_value: 40 }, { min_amount: 100000, max_amount: 999999, commission_value: 45 }]) },
      { name: '协办律师比例提成', role_type: CommissionRoleType.ASSIST_LAWYER, commission_type: CommissionType.PERCENTAGE, commission_value: 15, case_type: null, description: '协办律师提成15%' },
      { name: '助理固定提成', role_type: CommissionRoleType.ASSISTANT, commission_type: CommissionType.FIXED, commission_value: 1000, case_type: null, description: '助理每案件奖励1000元' },
      { name: '谈案岗阶梯提成-债务', role_type: CommissionRoleType.SALES, commission_type: CommissionType.PERCENTAGE, commission_value: 10, case_type: 'debt', description: '债务案件谈案岗阶梯提成', tier_rules: JSON.stringify([{ min_amount: 0, max_amount: 30000, commission_value: 8 }, { min_amount: 30000, max_amount: 80000, commission_value: 10 }, { min_amount: 80000, max_amount: 999999, commission_value: 12 }]) },
      { name: '主办律师固定提成-其他', role_type: CommissionRoleType.MAIN_LAWYER, commission_type: CommissionType.FIXED, commission_value: 8000, case_type: 'other', description: '其他案件主办律师固定提成8000元', enabled: false },
    ];

    for (const data of ruleData) {
      const existing = await this.commissionRuleRepository.findOne({ where: { name: data.name } });
      if (!existing) {
        await this.commissionRuleRepository.save({
          ...data,
          enabled: data.enabled !== undefined ? data.enabled : true,
          tier_rules: data.tier_rules || null,
          organization_id: orgId,
        });
      }
    }
  }

  // 提成记录种子数据
  private async seedCommissionRecords(orgId: string, userMap: Record<string, User>) {
    const salesUser = userMap['13800138003'];
    const salesUser2 = userMap['13800138009'];
    const lawyerUser = userMap['13800138004'];
    const lawyerUser2 = userMap['13800138008'];
    const assistantUser = userMap['13800138005'];
    const marketingUser = userMap['13800138002'];
    const cases = await this.caseRepository.find({ where: { organization_id: orgId }, take: 10 });
    const rules = await this.commissionRuleRepository.find({ where: { organization_id: orgId } });
    if (cases.length === 0 || rules.length === 0) return;

    const recordConfigs = [
      { role_type: CommissionRoleType.SALES, user: salesUser, base_amount: 50000, commission_amount: 5000, status: CommissionStatus.PAID, remarks: '婚姻案件谈案提成' },
      { role_type: CommissionRoleType.MAIN_LAWYER, user: lawyerUser, base_amount: 50000, commission_amount: 20000, status: CommissionStatus.PAID, remarks: '婚姻案件主办律师提成' },
      { role_type: CommissionRoleType.SALES, user: salesUser2, base_amount: 30000, commission_amount: 3600, status: CommissionStatus.PENDING, remarks: '交通案件谈案提成' },
      { role_type: CommissionRoleType.MAIN_LAWYER, user: lawyerUser, base_amount: 30000, commission_amount: 12000, status: CommissionStatus.PENDING, remarks: '交通案件主办律师提成' },
      { role_type: CommissionRoleType.ASSIST_LAWYER, user: lawyerUser2, base_amount: 30000, commission_amount: 4500, status: CommissionStatus.PENDING, remarks: '交通案件协办律师提成' },
      { role_type: CommissionRoleType.SALES, user: salesUser, base_amount: 15000, commission_amount: 2250, status: CommissionStatus.PAID, remarks: '劳动案件谈案提成' },
      { role_type: CommissionRoleType.MAIN_LAWYER, user: lawyerUser2, base_amount: 80000, commission_amount: 32000, status: CommissionStatus.PAID, remarks: '债务案件主办律师提成' },
      { role_type: CommissionRoleType.ASSISTANT, user: assistantUser, base_amount: 80000, commission_amount: 1000, status: CommissionStatus.PAID, remarks: '债务案件助理奖金' },
      { role_type: CommissionRoleType.MARKETING, user: marketingUser, base_amount: 0, commission_amount: 600, status: CommissionStatus.PAID, remarks: '3条有效线索奖励' },
      { role_type: CommissionRoleType.SALES, user: salesUser2, base_amount: 55000, commission_amount: 6600, status: CommissionStatus.PENDING, remarks: '医疗纠纷案件谈案提成' },
    ];

    for (let i = 0; i < recordConfigs.length; i++) {
      const config = recordConfigs[i];
      const caseEntity = cases[i % cases.length];
      const rule = rules.find(r => r.role_type === config.role_type) || rules[0];
      const existing = await this.commissionRecordRepository.findOne({
        where: { case_id: caseEntity.id, user_id: config.user?.id, role_type: config.role_type },
      });
      if (!existing) {
        await this.commissionRecordRepository.save({
          case_id: caseEntity.id,
          user_id: config.user?.id,
          role_type: config.role_type,
          rule_id: rule.id,
          base_amount: config.base_amount,
          commission_amount: config.commission_amount,
          status: config.status,
          paid_at: config.status === CommissionStatus.PAID ? new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) : null,
          remarks: config.remarks,
          organization_id: orgId,
        });
      }
    }
  }

  // 案件成本种子数据
  private async seedCaseCosts(orgId: string, userMap: Record<string, User>) {
    const cases = await this.caseRepository.find({ where: { organization_id: orgId }, take: 10 });
    if (cases.length === 0) return;

    const costConfigs = [
      { cost_type: CostType.MARKETING, amount: 8000, description: '抖音投放获客成本', incurred_offset: -45 },
      { cost_type: CostType.LABOR, amount: 15000, description: '律师办案人工成本', incurred_offset: -30 },
      { cost_type: CostType.CASE_HANDLING, amount: 2300, description: '诉讼费及保全费', incurred_offset: -20 },
      { cost_type: CostType.OTHER, amount: 1500, description: '差旅及取证费用', incurred_offset: -15 },
      { cost_type: CostType.MARKETING, amount: 5400, description: '百度投放获客成本', incurred_offset: -40 },
      { cost_type: CostType.CASE_HANDLING, amount: 1800, description: '鉴定费', incurred_offset: -25 },
      { cost_type: CostType.LABOR, amount: 12000, description: '协办律师人工成本', incurred_offset: -20 },
      { cost_type: CostType.OTHER, amount: 2000, description: '专家咨询费', incurred_offset: -10 },
      { cost_type: CostType.MARKETING, amount: 6300, description: '快手投放获客成本', incurred_offset: -35 },
      { cost_type: CostType.CASE_HANDLING, amount: 3500, description: '仲裁费及公告费', incurred_offset: -18 },
    ];

    for (let i = 0; i < costConfigs.length; i++) {
      const config = costConfigs[i];
      const caseEntity = cases[i % cases.length];
      const existing = await this.caseCostRepository.findOne({
        where: { case_id: caseEntity.id, cost_type: config.cost_type, description: config.description },
      });
      if (!existing) {
        await this.caseCostRepository.save({
          case_id: caseEntity.id,
          cost_type: config.cost_type,
          amount: config.amount,
          description: config.description,
          incurred_date: new Date(Date.now() + config.incurred_offset * 24 * 60 * 60 * 1000),
          organization_id: orgId,
        });
      }
    }
  }

  // ============ Phase 2 合规种子数据 ============

  // 合规规则种子数据
  private async seedComplianceRules(orgId: string, userMap: Record<string, User>) {
    const ruleData = [
      { name: '虚假承诺关键词检测', check_stage: CheckStage.ACQUISITION, rule_type: RuleType.KEYWORD, conditions: JSON.stringify({ keywords: ['包赢', '百分百胜诉', '保证胜诉', '一定胜诉'] }) },
      { name: '夸大宣传关键词检测', check_stage: CheckStage.ACQUISITION, rule_type: RuleType.KEYWORD, conditions: JSON.stringify({ keywords: ['最强律师', '第一', '顶级', '无敌'] }) },
      { name: '违规收费关键词检测', check_stage: CheckStage.NEGOTIATION, rule_type: RuleType.KEYWORD, conditions: JSON.stringify({ keywords: ['风险代理', '不成功不收费', '事后收费'] }) },
      { name: '合同条款正则检测', check_stage: CheckStage.SIGNING, rule_type: RuleType.REGEX, conditions: JSON.stringify({ pattern: '保证.{0,5}胜诉|包.{0,3}赔偿' }) },
      { name: '营销内容人工复核', check_stage: CheckStage.ACQUISITION, rule_type: RuleType.MANUAL, conditions: JSON.stringify({ description: '营销内容发布前需人工复核' }) },
      { name: '谈案话术合规检测', check_stage: CheckStage.NEGOTIATION, rule_type: RuleType.KEYWORD, conditions: JSON.stringify({ keywords: ['关系户', '走后门', '行贿', '请客送礼'] }) },
      { name: '签约材料完整性检测', check_stage: CheckStage.SIGNING, rule_type: RuleType.MANUAL, conditions: JSON.stringify({ description: '检查签约材料是否完整合规' }) },
      { name: '办案进度合规检测', check_stage: CheckStage.CASE_HANDLING, rule_type: RuleType.KEYWORD, conditions: JSON.stringify({ keywords: ['拖延', '不予处理', '不回复'] }) },
      { name: '结案材料合规检测', check_stage: CheckStage.CLOSING, rule_type: RuleType.MANUAL, conditions: JSON.stringify({ description: '结案材料审核及归档检查' }) },
      { name: '财务收费合规检测', check_stage: CheckStage.FINANCE, rule_type: RuleType.REGEX, conditions: JSON.stringify({ pattern: '现金.{0,5}收费|私下.{0,5}转账' }) },
    ];

    for (const data of ruleData) {
      const existing = await this.complianceRuleRepository.findOne({ where: { name: data.name } });
      if (!existing) {
        await this.complianceRuleRepository.save({
          ...data,
          enabled: true,
        });
      }
    }
  }

  // 合规检查结果种子数据
  private async seedComplianceCheckResults(orgId: string, userMap: Record<string, User>) {
    const complianceUser = userMap['13800138010'];
    const adminUser = userMap['13800138001'];
    const rules = await this.complianceRuleRepository.find({ take: 10 });
    const marketingContents = await this.marketingContentRepository.find({ take: 10 });
    const salesCompliances = await this.salesComplianceRepository.find({ take: 10 });
    const signingCompliances = await this.signingComplianceRepository.find({ take: 10 });
    if (rules.length === 0) return;

    const resultConfigs = [
      { target_type: 'marketing_content' as const, check_result: CheckResultType.REVIEW, violation_content: '内容包含"最强律师"涉嫌夸大宣传', handle_status: HandleStatus.PROCESSED, handle_note: '已修改为"资深律师"', is_inspection: false },
      { target_type: 'marketing_content' as const, check_result: CheckResultType.PASS, violation_content: null, handle_status: HandleStatus.PROCESSED, handle_note: '内容合规', is_inspection: false },
      { target_type: 'marketing_content' as const, check_result: CheckResultType.REJECT, violation_content: '包含"包赢"虚假承诺', handle_status: HandleStatus.PROCESSED, handle_note: '已驳回，要求重写', is_inspection: true },
      { target_type: 'sales_compliance' as const, check_result: CheckResultType.REVIEW, violation_content: '话术中存在暗示关系户的表述', handle_status: HandleStatus.PENDING, handle_note: null, is_inspection: false },
      { target_type: 'sales_compliance' as const, check_result: CheckResultType.PASS, violation_content: null, handle_status: HandleStatus.PROCESSED, handle_note: '话术合规', is_inspection: false },
      { target_type: 'sales_compliance' as const, check_result: CheckResultType.REJECT, violation_content: '存在违规收费表述', handle_status: HandleStatus.IGNORED, handle_note: '误报，已忽略', is_inspection: true },
      { target_type: 'signing_compliance' as const, check_result: CheckResultType.PASS, violation_content: null, handle_status: HandleStatus.PROCESSED, handle_note: '签约材料完整合规', is_inspection: false },
      { target_type: 'signing_compliance' as const, check_result: CheckResultType.REVIEW, violation_content: '合同条款中存在模糊表述', handle_status: HandleStatus.PROCESSED, handle_note: '已补充明确条款', is_inspection: false },
      { target_type: 'marketing_content' as const, check_result: CheckResultType.REVIEW, violation_content: '视频素材需人工复核', handle_status: HandleStatus.PENDING, handle_note: null, is_inspection: true },
      { target_type: 'signing_compliance' as const, check_result: CheckResultType.PASS, violation_content: null, handle_status: HandleStatus.PROCESSED, handle_note: '签约材料合规', is_inspection: false },
    ];

    for (let i = 0; i < resultConfigs.length; i++) {
      const config = resultConfigs[i];
      const rule = rules[i % rules.length];
      let targetId: string | null = null;
      if (config.target_type === 'marketing_content' && marketingContents.length > 0) {
        targetId = marketingContents[i % marketingContents.length].id;
      } else if (config.target_type === 'sales_compliance' && salesCompliances.length > 0) {
        targetId = salesCompliances[i % salesCompliances.length].id;
      } else if (config.target_type === 'signing_compliance' && signingCompliances.length > 0) {
        targetId = signingCompliances[i % signingCompliances.length].id;
      }
      if (!targetId) continue;
      const existing = await this.complianceCheckResultRepository.findOne({
        where: { rule_id: rule.id, target_id: targetId },
      });
      if (!existing) {
        const handler = config.handle_status === HandleStatus.PROCESSED ? (i % 2 === 0 ? complianceUser : adminUser) : null;
        await this.complianceCheckResultRepository.save({
          rule_id: rule.id,
          target_type: config.target_type,
          target_id: targetId,
          check_result: config.check_result,
          violation_content: config.violation_content,
          handler_id: handler?.id,
          handle_status: config.handle_status,
          handle_note: config.handle_note,
          is_inspection: config.is_inspection,
          handled_at: config.handle_status === HandleStatus.PROCESSED ? new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) : null,
        });
      }
    }
  }

  // 通话质检种子数据
  private async seedTalkQualityChecks(orgId: string, userMap: Record<string, User>) {
    const complianceUser = userMap['13800138010'];
    const adminUser = userMap['13800138001'];
    const inviteTasks = await this.inviteTaskRepository.find({ take: 10 });
    if (inviteTasks.length === 0) return;

    const checkConfigs = [
      { check_type: TalkCheckType.CALL, violation_type: TalkViolationType.FALSE_PROMISE, violation_content: '通话中存在"包赢"的虚假承诺', violation_keyword: '包赢', check_result: TalkCheckResult.VIOLATION, handle_status: TalkHandleStatus.PROCESSED, handle_note: '已对销售进行培训，纠正话术', notified: true, notification_summary: '通话质检发现违规承诺，请立即整改' },
      { check_type: TalkCheckType.CALL, violation_type: null, violation_content: null, violation_keyword: null, check_result: TalkCheckResult.PASS, handle_status: TalkHandleStatus.PROCESSED, handle_note: '通话合规', notified: false, notification_summary: null },
      { check_type: TalkCheckType.CALL, violation_type: TalkViolationType.EXAGGERATE, violation_content: '夸大案件胜诉率', violation_keyword: '胜诉率99%', check_result: TalkCheckResult.WARNING, handle_status: TalkHandleStatus.PROCESSED, handle_note: '已提醒销售注意话术', notified: true, notification_summary: '通话中存在夸大宣传，请规范话术' },
      { check_type: TalkCheckType.CHAT, violation_type: null, violation_content: null, violation_keyword: null, check_result: TalkCheckResult.PASS, handle_status: TalkHandleStatus.PROCESSED, handle_note: '聊天记录合规', notified: false, notification_summary: null },
      { check_type: TalkCheckType.CALL, violation_type: TalkViolationType.ILLEGAL_FEE, violation_content: '暗示客户可私下支付费用', violation_keyword: '私下转账', check_result: TalkCheckResult.VIOLATION, handle_status: TalkHandleStatus.PENDING, handle_note: null, notified: true, notification_summary: '发现违规收费暗示，待处理' },
      { check_type: TalkCheckType.CALL, violation_type: null, violation_content: null, violation_keyword: null, check_result: TalkCheckResult.PASS, handle_status: TalkHandleStatus.PROCESSED, handle_note: '通话合规', notified: false, notification_summary: null },
      { check_type: TalkCheckType.CHAT, violation_type: TalkViolationType.OTHER, violation_content: '聊天中存在不当承诺', violation_keyword: '保证满意', check_result: TalkCheckResult.WARNING, handle_status: TalkHandleStatus.PROCESSED, handle_note: '已提醒规范用语', notified: true, notification_summary: '聊天记录中发现不当承诺' },
      { check_type: TalkCheckType.CALL, violation_type: TalkViolationType.FALSE_PROMISE, violation_content: '承诺一定胜诉', violation_keyword: '一定胜诉', check_result: TalkCheckResult.VIOLATION, handle_status: TalkHandleStatus.PROCESSED, handle_note: '已严肃处理并扣罚', notified: true, notification_summary: '严重违规，已处理' },
      { check_type: TalkCheckType.CALL, violation_type: null, violation_content: null, violation_keyword: null, check_result: TalkCheckResult.PASS, handle_status: TalkHandleStatus.PROCESSED, handle_note: '通话合规', notified: false, notification_summary: null },
      { check_type: TalkCheckType.CHAT, violation_type: null, violation_content: null, violation_keyword: null, check_result: TalkCheckResult.PASS, handle_status: TalkHandleStatus.PENDING, handle_note: null, notified: false, notification_summary: null },
    ];

    for (let i = 0; i < checkConfigs.length; i++) {
      const config = checkConfigs[i];
      const inviteTask = inviteTasks[i % inviteTasks.length];
      const existing = await this.talkQualityCheckRepository.findOne({
        where: { invite_task_id: inviteTask.id, check_type: config.check_type },
      });
      if (!existing) {
        const handler = config.handle_status === TalkHandleStatus.PROCESSED ? (i % 2 === 0 ? complianceUser : adminUser) : null;
        await this.talkQualityCheckRepository.save({
          invite_task_id: inviteTask.id,
          check_type: config.check_type,
          violation_type: config.violation_type,
          violation_content: config.violation_content,
          violation_keyword: config.violation_keyword,
          check_result: config.check_result,
          handle_status: config.handle_status,
          handler_id: handler?.id,
          handle_note: config.handle_note,
          organization_id: orgId,
          inviter_id: inviteTask.inviter_id,
          notified: config.notified,
          notified_at: config.notified ? new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) : null,
          notification_summary: config.notification_summary,
          handled_at: config.handle_status === TalkHandleStatus.PROCESSED ? new Date(Date.now() - 12 * 60 * 60 * 1000) : null,
        });
      }
    }
  }

  // 合同模板种子数据
  private async seedContractTemplates(orgId: string, userMap: Record<string, User>) {
    const adminUser = userMap['13800138001'];

    const templateData = [
      { name: '婚姻案件委托代理合同', case_type: 'marriage', content: '甲方委托乙方就离婚纠纷一案提供法律服务，代理权限包括：起草法律文书、参加庭审、代为调解等。代理费金额为人民币____元。', version: 1, is_approved: true },
      { name: '交通事故案件委托代理合同', case_type: 'traffic', content: '甲方委托乙方就交通事故赔偿纠纷一案提供法律服务，代理权限包括：伤残鉴定申请、赔偿协商、诉讼代理等。代理费金额为人民币____元。', version: 1, is_approved: true },
      { name: '劳动争议案件委托代理合同', case_type: 'labor', content: '甲方委托乙方就劳动争议一案提供法律服务，代理权限包括：仲裁申请、庭审代理、执行申请等。代理费金额为人民币____元。', version: 1, is_approved: true },
      { name: '债务追讨案件委托代理合同', case_type: 'debt', content: '甲方委托乙方就债务追讨一案提供法律服务，代理权限包括：起诉、财产保全、执行申请等。代理费金额为人民币____元。', version: 1, is_approved: true },
      { name: '综合法律事务委托代理合同', case_type: 'other', content: '甲方委托乙方就____纠纷一案提供法律服务，代理权限包括：法律咨询、文书起草、诉讼代理等。代理费金额为人民币____元。', version: 1, is_approved: true },
      { name: '婚姻案件委托代理合同v2', case_type: 'marriage', content: '甲方委托乙方就离婚纠纷一案提供法律服务，代理权限包括：起草法律文书、参加庭审、代为调解、财产分割协商等。代理费金额为人民币____元，分期支付方式如下：____。', version: 2, is_approved: true },
      { name: '交通事故案件委托代理合同v2', case_type: 'traffic', content: '甲方委托乙方就交通事故赔偿纠纷一案提供法律服务，代理权限包括：伤残鉴定、赔偿协商、诉讼代理、执行代理等。代理费金额为人民币____元。', version: 2, is_approved: true },
      { name: '风险代理合同模板', case_type: 'other', content: '甲方委托乙方就____纠纷一案提供法律服务，采用风险代理方式，基础费用____元，胜诉后按回款金额的____%支付提成。', version: 1, is_approved: false },
      { name: '法律咨询服务合同', case_type: 'other', content: '甲方委托乙方提供法律咨询服务，服务内容包括：法律意见书出具、合同审查、法律风险评估等。服务费金额为人民币____元。', version: 1, is_approved: true },
      { name: '劳动争议案件委托代理合同v2', case_type: 'labor', content: '甲方委托乙方就劳动争议一案提供法律服务，代理权限包括：仲裁、诉讼、执行全流程代理。代理费金额为人民币____元。', version: 2, is_approved: false },
    ];

    for (const data of templateData) {
      const existing = await this.contractTemplateRepository.findOne({
        where: { name: data.name, version: data.version },
      });
      if (!existing) {
        await this.contractTemplateRepository.save({
          ...data,
          created_by: adminUser?.id,
          organization_id: orgId,
        });
      }
    }
  }

  // 投诉工单种子数据
  private async seedComplaintTickets(orgId: string, userMap: Record<string, User>) {
    const clientUser = userMap['13800138007'];
    const clientUser2 = userMap['13800138011'];
    const adminUser = userMap['13800138001'];
    const complianceUser = userMap['13800138010'];
    const cases = await this.caseRepository.find({ where: { organization_id: orgId }, take: 10 });
    if (cases.length === 0) return;

    const ticketConfigs = [
      { ticket_number: 'TS20260001', source_channel: TicketSourceChannel.CLIENT_PORTAL, complaint_type: TicketComplaintType.SERVICE_ATTITUDE, severity_level: TicketSeverity.MEDIUM, title: '律师回复不及时', content: '多次联系律师都没有回应，严重影响案件进度', status: TicketStatus.RESOLVED, resolution: '已安排专人跟进，律师已联系客户', satisfaction_score: 4 },
      { ticket_number: 'TS20260002', source_channel: TicketSourceChannel.PHONE, complaint_type: TicketComplaintType.FEE_ISSUE, severity_level: TicketSeverity.HIGH, title: '收费不合理', content: '咨询一次就收取5000元，感觉被坑', status: TicketStatus.PROCESSING, resolution: null, satisfaction_score: null },
      { ticket_number: 'TS20260003', source_channel: TicketSourceChannel.WECHAT, complaint_type: TicketComplaintType.CASE_PROGRESS, severity_level: TicketSeverity.MEDIUM, title: '案件进展缓慢', content: '案件已经三个月了，没有任何进展', status: TicketStatus.CLOSED, resolution: '已加急处理，向客户通报进展', satisfaction_score: 3 },
      { ticket_number: 'TS20260004', source_channel: TicketSourceChannel.ENTERPRISE_WECHAT, complaint_type: TicketComplaintType.LAWYER_PROFESSIONAL, severity_level: TicketSeverity.HIGH, title: '律师专业能力不足', content: '律师在法庭上表现不佳，没有充分举证', status: TicketStatus.ESCALATED, resolution: null, satisfaction_score: null },
      { ticket_number: 'TS20260005', source_channel: TicketSourceChannel.CLIENT_PORTAL, complaint_type: TicketComplaintType.FEE_ISSUE, severity_level: TicketSeverity.LOW, title: '发票迟迟未开', content: '交费后一个月了还没收到发票', status: TicketStatus.RESOLVED, resolution: '已加急开具发票并邮寄', satisfaction_score: 5 },
      { ticket_number: 'TS20260006', source_channel: TicketSourceChannel.PHONE, complaint_type: TicketComplaintType.SERVICE_ATTITUDE, severity_level: TicketSeverity.LOW, title: '助理态度不好', content: '询问案件进展时律师助理很不耐烦', status: TicketStatus.CLOSED, resolution: '已对助理进行批评教育', satisfaction_score: 4 },
      { ticket_number: 'TS20260007', source_channel: TicketSourceChannel.WECHAT, complaint_type: TicketComplaintType.CASE_PROGRESS, severity_level: TicketSeverity.CRITICAL, title: '案件严重拖延', content: '交了材料后两个月没有任何消息', status: TicketStatus.PROCESSING, resolution: null, satisfaction_score: null },
      { ticket_number: 'TS20260008', source_channel: TicketSourceChannel.CLIENT_PORTAL, complaint_type: TicketComplaintType.OTHER, severity_level: TicketSeverity.LOW, title: '律所地址变更未通知', content: '白跑一趟，律所搬迁没有提前通知', status: TicketStatus.RESOLVED, resolution: '已道歉并补偿交通费', satisfaction_score: 4 },
      { ticket_number: 'TS20260009', source_channel: TicketSourceChannel.ENTERPRISE_WECHAT, complaint_type: TicketComplaintType.FEE_ISSUE, severity_level: TicketSeverity.HIGH, title: '额外收费未告知', content: '合同约定3万元，现在又要额外收取2万元', status: TicketStatus.ESCALATED, resolution: null, satisfaction_score: null },
      { ticket_number: 'TS20260010', source_channel: TicketSourceChannel.PHONE, complaint_type: TicketComplaintType.LAWYER_PROFESSIONAL, severity_level: TicketSeverity.MEDIUM, title: '律师开庭迟到', content: '律师开庭迟到30分钟，影响了案件审理', status: TicketStatus.CLOSED, resolution: '已对律师进行处分，向客户道歉', satisfaction_score: 3 },
    ];

    for (let i = 0; i < ticketConfigs.length; i++) {
      const config = ticketConfigs[i];
      const caseEntity = cases[i % cases.length];
      const client = i % 2 === 0 ? clientUser : clientUser2;
      const handler = config.status === TicketStatus.PENDING ? null : (i % 2 === 0 ? adminUser : complianceUser);
      const existing = await this.complaintTicketRepository.findOne({ where: { ticket_number: config.ticket_number } });
      if (!existing) {
        const isResolved = config.status === TicketStatus.RESOLVED || config.status === TicketStatus.CLOSED;
        const isClosed = config.status === TicketStatus.CLOSED;
        const isEscalated = config.status === TicketStatus.ESCALATED;
        const processRecords = [
          { action: 'create', operator_id: client?.id, operator_name: client?.real_name, content: '客户提交投诉工单', created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
          { action: 'assign', operator_id: adminUser?.id, operator_name: adminUser?.real_name, content: '工单已分配处理人', created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
        ];
        if (isResolved) {
          processRecords.push({ action: 'resolve', operator_id: handler?.id, operator_name: handler?.real_name, content: config.resolution, created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() });
        }
        if (isClosed) {
          processRecords.push({ action: 'close', operator_id: handler?.id, operator_name: handler?.real_name, content: '工单已关闭', created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() });
        }
        if (isEscalated) {
          processRecords.push({ action: 'escalate', operator_id: adminUser?.id, operator_name: adminUser?.real_name, content: '工单已升级处理', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() });
        }
        await this.complaintTicketRepository.save({
          ticket_number: config.ticket_number,
          source_channel: config.source_channel,
          complaint_type: config.complaint_type,
          severity_level: config.severity_level,
          title: config.title,
          content: config.content,
          case_id: caseEntity.id,
          client_id: client?.id,
          client_name: client?.real_name,
          client_phone: client?.phone,
          handler_id: handler?.id,
          status: config.status,
          process_records: JSON.stringify(processRecords),
          resolved_at: isResolved ? new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) : null,
          closed_at: isClosed ? new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) : null,
          archived: isClosed,
          escalated: isEscalated,
          resolution: config.resolution,
          satisfaction_score: config.satisfaction_score,
          organization_id: orgId,
        });
      }
    }
  }

  // ============ Phase 4 客户端种子数据 ============

  // 案件进度推送种子数据
  private async seedCasePushNotifications(orgId: string, userMap: Record<string, User>) {
    const clientUser = userMap['13800138007'];
    const clientUser2 = userMap['13800138011'];
    const cases = await this.caseRepository.find({ where: { organization_id: orgId }, take: 10 });
    if (cases.length === 0) return;

    const notificationConfigs = [
      { node_type: 'filing', push_content: '您的案件已成功立案，案号：2026京0105民初0001号，承办法官已分配。', push_channel: 'wechat', status: 'sent' },
      { node_type: 'court', push_content: '您的案件已排期开庭，开庭时间：2026年8月15日上午9:30，地点：北京市朝阳区人民法院第三法庭。', push_channel: 'sms', status: 'sent' },
      { node_type: 'judgment', push_content: '您的案件已收到一审判决书，律师将为您详细解读判决内容。', push_channel: 'in_app', status: 'sent' },
      { node_type: 'closed', push_content: '您的案件已结案归档，如有疑问请联系您的承办律师。', push_channel: 'wechat', status: 'sent' },
      { node_type: 'filing', push_content: '您的案件已成功立案，案号：2026京0108民初0002号。', push_channel: 'in_app', status: 'sent' },
      { node_type: 'court', push_content: '您的案件开庭时间已确定，请关注后续通知。', push_channel: 'wechat', status: 'pending' },
      { node_type: 'filing', push_content: '您的劳动仲裁申请已受理，案号：京朝劳人仲字[2026]第0003号。', push_channel: 'sms', status: 'sent' },
      { node_type: 'court', push_content: '您的案件即将开庭，请准时出席。', push_channel: 'in_app', status: 'sent' },
      { node_type: 'judgment', push_content: '您的案件已收到判决书，请联系律师了解详情。', push_channel: 'wechat', status: 'sent' },
      { node_type: 'filing', push_content: '您的案件已立案，承办法官已分配。', push_channel: 'in_app', status: 'pending' },
    ];

    for (let i = 0; i < notificationConfigs.length; i++) {
      const config = notificationConfigs[i];
      const caseEntity = cases[i % cases.length];
      const client = i % 2 === 0 ? clientUser : clientUser2;
      const existing = await this.casePushNotificationRepository.findOne({
        where: { case_id: caseEntity.id, node_type: config.node_type },
      });
      if (!existing) {
        const isSent = config.status === 'sent';
        await this.casePushNotificationRepository.save({
          case_id: caseEntity.id,
          client_id: client?.id,
          node_type: config.node_type,
          push_content: config.push_content,
          push_channel: config.push_channel,
          push_time: new Date(Date.now() - (i + 1) * 12 * 60 * 60 * 1000),
          status: config.status,
          organization_id: orgId,
          sent_at: isSent ? new Date(Date.now() - (i + 1) * 12 * 60 * 60 * 1000) : null,
        });
      }
    }
  }

  // 客户AI咨询种子数据
  private async seedClientConsultations(orgId: string, userMap: Record<string, User>) {
    const clientUser = userMap['13800138007'];
    const clientUser2 = userMap['13800138011'];
    const cases = await this.caseRepository.find({ where: { organization_id: orgId }, take: 10 });
    if (cases.length === 0) return;

    const consultationConfigs = [
      { question: '离婚后孩子的抚养权一般怎么判？', ai_answer: '根据《民法典》规定，离婚后不满两周岁的子女以由母亲直接抚养为原则。已满两周岁的子女，父母双方对抚养问题协议不成的，由人民法院根据双方的具体情况，按照最有利于未成年子女的原则判决。子女已满八周岁的，应当尊重其真实意愿。', is_transferred_to_human: false },
      { question: '交通事故伤残鉴定什么时候做？', ai_answer: '交通事故伤残鉴定一般应在治疗终结后进行，通常为受伤后3-6个月。鉴定时需要提供病历、影像资料、交通事故认定书等材料。建议在鉴定前咨询专业律师，以确保鉴定结果的准确性。', is_transferred_to_human: false },
      { question: '公司拖欠工资可以直接起诉吗？', ai_answer: '劳动争议一般需要先经过劳动仲裁程序，对仲裁裁决不服的才可以向法院起诉。建议您先向当地劳动争议仲裁委员会申请仲裁。申请仲裁的时效为一年，从当事人知道或者应当知道其权利被侵害之日起计算。', is_transferred_to_human: true },
      { question: '朋友借钱不还有借条能起诉吗？', ai_answer: '有借条可以作为重要证据向法院起诉。建议您同时准备好转账凭证等辅助证据。起诉前需要注意诉讼时效问题，一般借款纠纷的诉讼时效为三年，从约定的还款期限届满之日起计算。', is_transferred_to_human: false },
      { question: '房产继承需要哪些材料？', ai_answer: '房产继承一般需要以下材料：1.被继承人死亡证明；2.继承人与被继承人关系证明；3.房产证；4.遗嘱（如有）；5.继承人的身份证明。建议咨询专业律师协助办理继承手续。', is_transferred_to_human: false },
      { question: '合同违约可以要求赔偿哪些损失？', ai_answer: '合同违约可以主张的损失包括：1.直接损失；2.可得利益损失；3.违约金（合同有约定时）；4.其他因违约造成的合理损失。具体赔偿范围需要根据合同约定和实际情况确定，建议咨询律师详细评估。', is_transferred_to_human: true },
      { question: '工伤认定需要什么材料？', ai_answer: '工伤认定需要提交：1.工伤认定申请表；2.与用人单位存在劳动关系的证明材料；3.医疗诊断证明或者职业病诊断证明书。用人单位应在事故发生后30日内提出申请，用人单位未提出的，劳动者或其近亲属可以在1年内直接提出申请。', is_transferred_to_human: false },
      { question: '刑事案件家属可以会见当事人吗？', ai_answer: '在刑事拘留期间，家属一般不能直接会见当事人，只有律师可以会见。建议家属尽快委托专业刑事辩护律师，律师可以会见当事人了解案情，为其提供法律帮助。', is_transferred_to_human: true },
      { question: '医疗纠纷怎么维权？', ai_answer: '医疗纠纷维权途径包括：1.与医院协商解决；2.向卫生行政部门投诉；3.申请医疗事故鉴定；4.向法院提起诉讼。建议先保存好相关病历资料，咨询专业律师评估维权方案。', is_transferred_to_human: false },
      { question: '拆迁补偿不合理怎么办？', ai_answer: '如果认为拆迁补偿不合理，可以：1.申请行政复议；2.提起行政诉讼；3.申请裁决。建议及时咨询专业律师，在法定期限内行使救济权利，避免错过维权时机。', is_transferred_to_human: false },
    ];

    for (let i = 0; i < consultationConfigs.length; i++) {
      const config = consultationConfigs[i];
      const caseEntity = cases[i % cases.length];
      const client = i % 2 === 0 ? clientUser : clientUser2;
      const existing = await this.clientConsultationRepository.findOne({
        where: { client_id: client?.id, question: config.question },
      });
      if (!existing) {
        await this.clientConsultationRepository.save({
          client_id: client?.id,
          case_id: caseEntity.id,
          question: config.question,
          ai_answer: config.ai_answer,
          is_transferred_to_human: config.is_transferred_to_human,
          ticket_id: config.is_transferred_to_human ? `ticket_${caseEntity.id}_${i + 1}` : null,
          organization_id: orgId,
        });
      }
    }
  }

  // 服务评价种子数据
  private async seedServiceRatings(orgId: string, userMap: Record<string, User>) {
    const clientUser = userMap['13800138007'];
    const clientUser2 = userMap['13800138011'];
    const adminUser = userMap['13800138001'];
    const cases = await this.caseRepository.find({ where: { organization_id: orgId }, take: 10 });
    if (cases.length === 0) return;

    const ratingConfigs = [
      { rating: 5, content: '律师非常专业，案件处理得很满意，沟通也很及时', status: 'approved', is_converted_to_material: true },
      { rating: 4, content: '服务整体不错，就是有些细节可以改进', status: 'approved', is_converted_to_material: false },
      { rating: 5, content: '非常感谢律师的专业帮助，成功拿到了赔偿', status: 'converted_to_material', is_converted_to_material: true },
      { rating: 3, content: '案件进展有点慢，但最终结果还可以', status: 'approved', is_converted_to_material: false },
      { rating: 5, content: '律师认真负责，专业能力强，强烈推荐', status: 'approved', is_converted_to_material: true },
      { rating: 2, content: '回复不够及时，沟通体验一般', status: 'rejected', is_converted_to_material: false },
      { rating: 5, content: '非常专业的团队，案件处理高效', status: 'approved', is_converted_to_material: false },
      { rating: 4, content: '律师专业，但费用偏高', status: 'pending', is_converted_to_material: false },
      { rating: 5, content: '感谢律师的耐心解答和细致服务', status: 'approved', is_converted_to_material: true },
      { rating: 3, content: '服务中规中矩，没有特别惊喜', status: 'pending', is_converted_to_material: false },
    ];

    for (let i = 0; i < ratingConfigs.length; i++) {
      const config = ratingConfigs[i];
      const caseEntity = cases[i % cases.length];
      const client = i % 2 === 0 ? clientUser : clientUser2;
      const existing = await this.serviceRatingRepository.findOne({
        where: { case_id: caseEntity.id, client_id: client?.id },
      });
      if (!existing) {
        const isReviewed = config.status !== 'pending';
        await this.serviceRatingRepository.save({
          case_id: caseEntity.id,
          client_id: client?.id,
          rating: config.rating,
          content: config.content,
          status: config.status,
          is_converted_to_material: config.is_converted_to_material,
          material_id: config.is_converted_to_material ? `material_${caseEntity.id}` : null,
          organization_id: orgId,
          reviewed_at: isReviewed ? new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) : null,
          reviewer_id: isReviewed ? adminUser?.id : null,
        });
      }
    }
  }

  // ============ Phase 4 数据中台种子数据 ============

  // 报表模板种子数据
  private async seedReportTemplates(orgId: string, userMap: Record<string, User>) {
    const adminUser = userMap['13800138001'];
    const financeUser = userMap['13800138006'];
    const marketingUser = userMap['13800138002'];

    const templateData = [
      { name: '营收月报', description: '按月统计律所营收情况', dimensions: JSON.stringify(['month', 'case_type']), metrics: JSON.stringify(['revenue', 'cost', 'profit']), time_range: '30d', subscription_frequency: 'monthly', subscriber_ids: JSON.stringify([adminUser?.id, financeUser?.id]) },
      { name: '投放效果周报', description: '按渠道统计投放效果及ROI', dimensions: JSON.stringify(['channel', 'platform', 'material']), metrics: JSON.stringify(['impressions', 'clicks', 'conversions', 'cost', 'roi']), time_range: '7d', subscription_frequency: 'weekly', subscriber_ids: JSON.stringify([marketingUser?.id, adminUser?.id]) },
      { name: '案件进展月报', description: '统计案件各阶段分布及进展', dimensions: JSON.stringify(['case_type', 'stage', 'lawyer']), metrics: JSON.stringify(['case_count', 'completed_count', 'avg_duration']), time_range: '30d', subscription_frequency: 'monthly', subscriber_ids: JSON.stringify([adminUser?.id]) },
      { name: '律师业绩排行', description: '律师案件量及业绩排行', dimensions: JSON.stringify(['lawyer', 'case_type']), metrics: JSON.stringify(['case_count', 'revenue', 'commission']), time_range: '90d', subscription_frequency: 'monthly', subscriber_ids: JSON.stringify([adminUser?.id, financeUser?.id]) },
      { name: '线索转化漏斗', description: '线索到签约的全链路转化分析', dimensions: JSON.stringify(['channel', 'case_type']), metrics: JSON.stringify(['lead_count', 'invite_count', 'sign_count', 'conversion_rate']), time_range: '30d', subscription_frequency: 'weekly', subscriber_ids: JSON.stringify([marketingUser?.id, adminUser?.id]) },
      { name: '财务收支明细', description: '财务收支详细报表', dimensions: JSON.stringify(['month', 'case_type', 'cost_type']), metrics: JSON.stringify(['revenue', 'cost', 'profit', 'receivable', 'received']), time_range: '30d', subscription_frequency: 'monthly', subscriber_ids: JSON.stringify([financeUser?.id]) },
      { name: '合规巡检报告', description: '合规检查结果统计', dimensions: JSON.stringify(['check_stage', 'rule_type', 'check_result']), metrics: JSON.stringify(['check_count', 'violation_count', 'pass_rate']), time_range: '30d', subscription_frequency: 'weekly', subscriber_ids: JSON.stringify([adminUser?.id]) },
      { name: '客户满意度报告', description: '客户评价及满意度统计', dimensions: JSON.stringify(['lawyer', 'case_type']), metrics: JSON.stringify(['rating_avg', 'rating_count', 'satisfaction_rate']), time_range: '90d', subscription_frequency: 'monthly', subscriber_ids: JSON.stringify([adminUser?.id]) },
      { name: '季度运营总览', description: '季度运营全貌数据', dimensions: JSON.stringify(['month', 'channel', 'case_type']), metrics: JSON.stringify(['revenue', 'cost', 'profit', 'lead_count', 'case_count', 'conversion_rate']), time_range: '90d', subscription_frequency: 'monthly', subscriber_ids: JSON.stringify([adminUser?.id, financeUser?.id, marketingUser?.id]) },
      { name: '自定义期间分析', description: '自定义时间范围的综合分析', dimensions: JSON.stringify(['channel', 'platform', 'case_type', 'lawyer', 'month']), metrics: JSON.stringify(['revenue', 'cost', 'profit', 'lead_count', 'sign_count', 'case_count']), time_range: 'custom', custom_start_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), custom_end_date: new Date(), subscription_frequency: null, subscriber_ids: null },
    ];

    for (const data of templateData) {
      const existing = await this.reportTemplateRepository.findOne({ where: { name: data.name } });
      if (!existing) {
        await this.reportTemplateRepository.save({
          ...data,
          created_by: adminUser?.id,
          organization_id: orgId,
        });
      }
    }
  }

  // 报表导出日志种子数据
  private async seedReportExportLogs(orgId: string, userMap: Record<string, User>) {
    const adminUser = userMap['13800138001'];
    const financeUser = userMap['13800138006'];
    const marketingUser = userMap['13800138002'];
    const templates = await this.reportTemplateRepository.find({ where: { organization_id: orgId }, take: 10 });
    if (templates.length === 0) return;

    const exporterConfigs = [
      { export_format: 'excel', file_size: 256000, filters: JSON.stringify({ time_range: '30d', case_type: 'marriage' }) },
      { export_format: 'pdf', file_size: 512000, filters: JSON.stringify({ time_range: '7d', channel: 'douyin' }) },
      { export_format: 'excel', file_size: 384000, filters: JSON.stringify({ time_range: '30d' }) },
      { export_format: 'excel', file_size: 448000, filters: JSON.stringify({ time_range: '90d', case_type: 'all' }) },
      { export_format: 'pdf', file_size: 320000, filters: JSON.stringify({ time_range: '30d', channel: 'baidu' }) },
      { export_format: 'excel', file_size: 288000, filters: JSON.stringify({ time_range: '30d', cost_type: 'all' }) },
      { export_format: 'pdf', file_size: 416000, filters: JSON.stringify({ time_range: '30d', check_stage: 'acquisition' }) },
      { export_format: 'excel', file_size: 352000, filters: JSON.stringify({ time_range: '90d' }) },
      { export_format: 'excel', file_size: 640000, filters: JSON.stringify({ time_range: '90d', case_type: 'all', channel: 'all' }) },
      { export_format: 'pdf', file_size: 480000, filters: JSON.stringify({ time_range: 'custom', start_date: '2026-05-01', end_date: '2026-07-23' }) },
    ];

    for (let i = 0; i < exporterConfigs.length; i++) {
      const config = exporterConfigs[i];
      const template = templates[i % templates.length];
      const exporter = i % 3 === 0 ? adminUser : (i % 3 === 1 ? financeUser : marketingUser);
      const fileName = `report_${template.name}_${Date.now()}_${i + 1}.${config.export_format}`;
      // 通过文件路径做幂等校验
      const existing = await this.reportExportLogRepository.findOne({ where: { file_path: `/exports/${fileName}` } });
      if (!existing) {
        await this.reportExportLogRepository.save({
          template_id: template.id,
          exporter_id: exporter?.id,
          export_format: config.export_format,
          file_path: `/exports/${fileName}`,
          file_size: config.file_size,
          filters: config.filters,
          organization_id: orgId,
        });
      }
    }
  }

  // ============ 谈案SOP种子数据 ============

  private async seedTalkSOPs(orgId: string, userMap: Record<string, User>) {
    const sopData = [
      {
        name: '婚姻案件谈案标准SOP',
        case_type: 'marriage',
        is_default: true,
        enabled: true,
        nodes: [
          { node_id: 'n1', node_name: '客户信息录入', node_type: 'info_input', is_required: true, order: 1, description: '记录客户基本信息和案件概况' },
          { node_id: 'n2', node_name: '案件材料收集', node_type: 'material_upload', is_required: true, order: 2, description: '收集结婚证、财产证明等材料' },
          { node_id: 'n3', node_name: '合规风险告知', node_type: 'compliance_check', is_required: true, order: 3, description: '向客户说明案件风险和收费标准' },
          { node_id: 'n4', node_name: '委托协议签署', node_type: 'signature_confirm', is_required: true, order: 4, description: '签署委托代理协议和授权委托书' },
        ],
      },
      {
        name: '交通事故谈案标准SOP',
        case_type: 'traffic',
        is_default: true,
        enabled: true,
        nodes: [
          { node_id: 'n1', node_name: '事故信息登记', node_type: 'info_input', is_required: true, order: 1, description: '记录事故时间、地点、责任划分' },
          { node_id: 'n2', node_name: '证据材料上传', node_type: 'material_upload', is_required: true, order: 2, description: '上传事故认定书、医疗记录等' },
          { node_id: 'n3', node_name: '风险与费用告知', node_type: 'compliance_check', is_required: true, order: 3, description: '说明赔偿风险和风险代理收费' },
          { node_id: 'n4', node_name: '委托合同签署', node_type: 'signature_confirm', is_required: true, order: 4, description: '签署风险代理协议' },
        ],
      },
      {
        name: '劳动仲裁谈案标准SOP',
        case_type: 'labor',
        is_default: true,
        enabled: true,
        nodes: [
          { node_id: 'n1', node_name: '劳动关系确认', node_type: 'info_input', is_required: true, order: 1, description: '确认入职时间、工资标准、岗位' },
          { node_id: 'n2', node_name: '证据材料收集', node_type: 'material_upload', is_required: true, order: 2, description: '收集劳动合同、工资流水、考勤记录' },
          { node_id: 'n3', node_name: '仲裁风险告知', node_type: 'compliance_check', is_required: true, order: 3, description: '说明仲裁时效和举证责任' },
          { node_id: 'n4', node_name: '委托手续办理', node_type: 'signature_confirm', is_required: true, order: 4, description: '签署委托书和仲裁代理协议' },
        ],
      },
      {
        name: '债务追讨谈案SOP',
        case_type: 'debt',
        is_default: true,
        enabled: true,
        nodes: [
          { node_id: 'n1', node_name: '债务情况登记', node_type: 'info_input', is_required: true, order: 1, description: '登记借款金额、期限、利息约定' },
          { node_id: 'n2', node_name: '债权凭证上传', node_type: 'material_upload', is_required: true, order: 2, description: '上传借条、转账记录、催款记录' },
          { node_id: 'n3', node_name: '诉讼风险告知', node_type: 'compliance_check', is_required: true, order: 3, description: '说明诉讼时效和执行风险' },
          { node_id: 'n4', node_name: '委托协议签署', node_type: 'signature_confirm', is_required: true, order: 4, description: '签署委托代理协议' },
        ],
      },
      {
        name: '综合案件谈案SOP',
        case_type: 'other',
        is_default: true,
        enabled: true,
        nodes: [
          { node_id: 'n1', node_name: '案情初步了解', node_type: 'info_input', is_required: true, order: 1, description: '了解客户诉求和基本案情' },
          { node_id: 'n2', node_name: '相关材料收集', node_type: 'material_upload', is_required: false, order: 2, description: '收集与案件相关的证据材料' },
          { node_id: 'n3', node_name: '法律风险评估', node_type: 'compliance_check', is_required: true, order: 3, description: '进行案件分析和风险告知' },
          { node_id: 'n4', node_name: '委托手续办理', node_type: 'signature_confirm', is_required: true, order: 4, description: '签署委托代理合同' },
        ],
      },
      {
        name: '刑事辩护谈案SOP',
        case_type: 'other',
        is_default: false,
        enabled: true,
        nodes: [
          { node_id: 'n1', node_name: '涉嫌罪名了解', node_type: 'info_input', is_required: true, order: 1, description: '了解涉嫌罪名和案件阶段' },
          { node_id: 'n2', node_name: '委托材料准备', node_type: 'material_upload', is_required: true, order: 2, description: '准备身份证、拘留通知书等' },
          { node_id: 'n3', node_name: '辩护风险告知', node_type: 'compliance_check', is_required: true, order: 3, description: '说明辩护风险和收费标准' },
          { node_id: 'n4', node_name: '辩护委托签署', node_type: 'signature_confirm', is_required: true, order: 4, description: '签署刑事辩护委托协议' },
        ],
      },
      {
        name: '合同纠纷谈案SOP',
        case_type: 'other',
        is_default: false,
        enabled: true,
        nodes: [
          { node_id: 'n1', node_name: '合同情况登记', node_type: 'info_input', is_required: true, order: 1, description: '登记合同主体、签订时间、履行情况' },
          { node_id: 'n2', node_name: '合同材料上传', node_type: 'material_upload', is_required: true, order: 2, description: '上传合同原件、补充协议、往来函件' },
          { node_id: 'n3', node_name: '违约风险告知', node_type: 'compliance_check', is_required: true, order: 3, description: '说明违约责任认定和诉讼风险' },
          { node_id: 'n4', node_name: '委托协议签署', node_type: 'signature_confirm', is_required: true, order: 4, description: '签署委托代理协议' },
        ],
      },
      {
        name: '房产纠纷谈案SOP',
        case_type: 'other',
        is_default: false,
        enabled: true,
        nodes: [
          { node_id: 'n1', node_name: '房产信息登记', node_type: 'info_input', is_required: true, order: 1, description: '登记房产位置、权属状况、争议焦点' },
          { node_id: 'n2', node_name: '权属材料收集', node_type: 'material_upload', is_required: true, order: 2, description: '收集房产证、购房合同、付款凭证' },
          { node_id: 'n3', node_name: '诉讼风险告知', node_type: 'compliance_check', is_required: true, order: 3, description: '说明权属确认和过户风险' },
          { node_id: 'n4', node_name: '委托手续办理', node_type: 'signature_confirm', is_required: true, order: 4, description: '签署房产纠纷委托协议' },
        ],
      },
      {
        name: '知识产权纠纷谈案SOP',
        case_type: 'other',
        is_default: false,
        enabled: true,
        nodes: [
          { node_id: 'n1', node_name: '权利情况登记', node_type: 'info_input', is_required: true, order: 1, description: '登记商标、专利、著作权等权利信息' },
          { node_id: 'n2', node_name: '侵权证据上传', node_type: 'material_upload', is_required: true, order: 2, description: '上传权属证书、侵权对比材料、公证文书' },
          { node_id: 'n3', node_name: '维权风险告知', node_type: 'compliance_check', is_required: true, order: 3, description: '说明侵权认定和赔偿举证风险' },
          { node_id: 'n4', node_name: '委托协议签署', node_type: 'signature_confirm', is_required: true, order: 4, description: '签署知识产权维权委托协议' },
        ],
      },
      {
        name: '股权纠纷谈案SOP',
        case_type: 'other',
        is_default: false,
        enabled: true,
        nodes: [
          { node_id: 'n1', node_name: '公司情况登记', node_type: 'info_input', is_required: true, order: 1, description: '登记公司基本信息、股权结构和争议类型' },
          { node_id: 'n2', node_name: '股权材料收集', node_type: 'material_upload', is_required: true, order: 2, description: '收集章程、股东名册、出资证明、决议文件' },
          { node_id: 'n3', node_name: '诉讼风险告知', node_type: 'compliance_check', is_required: true, order: 3, description: '说明公司内外部效力及举证责任' },
          { node_id: 'n4', node_name: '委托协议签署', node_type: 'signature_confirm', is_required: true, order: 4, description: '签署股权纠纷委托代理协议' },
        ],
      },
      {
        name: '行政纠纷谈案SOP',
        case_type: 'other',
        is_default: false,
        enabled: true,
        nodes: [
          { node_id: 'n1', node_name: '行政行为了解', node_type: 'info_input', is_required: true, order: 1, description: '了解具体行政行为内容、作出机关和时间' },
          { node_id: 'n2', node_name: '证据材料上传', node_type: 'material_upload', is_required: true, order: 2, description: '上传行政决定书、复议决定书、相关证据' },
          { node_id: 'n3', node_name: '起诉风险告知', node_type: 'compliance_check', is_required: true, order: 3, description: '说明起诉期限、举证规则和败诉风险' },
          { node_id: 'n4', node_name: '委托协议签署', node_type: 'signature_confirm', is_required: true, order: 4, description: '签署行政诉讼委托代理协议' },
        ],
      },
    ];

    for (const data of sopData) {
      const existing = await this.talkSOPRepository.findOne({ where: { name: data.name } });
      if (!existing) {
        await this.talkSOPRepository.save({
          ...data,
          nodes: JSON.stringify(data.nodes),
        });
      }
    }
  }

  private async seedOpportunitySOPProgress(orgId: string, userMap: Record<string, User>) {
    const salesUser = userMap['13800138003'];
    const salesUser2 = userMap['13800138009'];
    const opportunities = await this.opportunityRepository.find({ take: 10 });
    if (opportunities.length === 0) return;

    const defaultSOP = await this.talkSOPRepository.findOne({ where: { is_default: true } });
    if (!defaultSOP) return;

    const nodes = JSON.parse(defaultSOP.nodes as string);

    for (let i = 0; i < opportunities.length; i++) {
      const opp = opportunities[i];
      const completedCount = i % 5;
      
      for (let j = 0; j < nodes.length; j++) {
        const node = nodes[j];
        const isCompleted = j < completedCount;
        const existing = await this.opportunitySOPProgressRepository.findOne({
          where: { opportunity_id: opp.id, node_id: node.node_id },
        });
        if (!existing) {
          await this.opportunitySOPProgressRepository.save({
            opportunity_id: opp.id,
            node_id: node.node_id,
            status: isCompleted ? SOPNodeStatus.COMPLETED : SOPNodeStatus.PENDING,
            completed_at: isCompleted ? new Date(Date.now() - (nodes.length - j) * 24 * 60 * 60 * 1000) : null,
            completed_by: isCompleted ? (i % 2 === 0 ? salesUser?.id : salesUser2?.id) : null,
          });
        }
      }
    }
  }


  // ============ 办案SOP模板种子数据 ============

  private async seedCaseSOPTemplates(orgId: string, userMap: Record<string, User>) {
    const templates = [
      {
        name: '民事诉讼标准办案流程',
        case_type: 'other' as any,
        is_default: true,
        enabled: true,
        description: '适用于各类民事案件的标准化办案流程',
        stages: [
          {
            stage_id: 's1',
            stage_name: '立案准备阶段',
            order: 1,
            tasks: [
              { task_id: 't1', task_name: '案件材料审核', responsible_role: 'lawyer', deadline_days: 2, is_required: true, description: '审核起诉材料和证据清单' },
              { task_id: 't2', task_name: '起诉状起草', responsible_role: 'lawyer', deadline_days: 3, is_required: true, description: '起草起诉状和证据目录' },
              { task_id: 't3', task_name: '客户确认签字', responsible_role: 'assistant', deadline_days: 1, is_required: true, description: '客户确认并签署起诉状' },
            ],
          },
          {
            stage_id: 's2',
            stage_name: '法院立案阶段',
            order: 2,
            tasks: [
              { task_id: 't4', task_name: '网上立案提交', responsible_role: 'assistant', deadline_days: 2, is_required: true, description: '在法院电子诉讼平台提交立案' },
              { task_id: 't5', task_name: '缴纳诉讼费用', responsible_role: 'assistant', deadline_days: 1, is_required: true, description: '按时缴纳诉讼费并保存凭证' },
            ],
          },
          {
            stage_id: 's3',
            stage_name: '庭前准备阶段',
            order: 3,
            tasks: [
              { task_id: 't6', task_name: '证据整理质证', responsible_role: 'lawyer', deadline_days: 7, is_required: true, description: '整理证据材料，准备质证意见' },
              { task_id: 't7', task_name: '答辩状起草', responsible_role: 'lawyer', deadline_days: 5, is_required: false, description: '根据对方诉求起草答辩状' },
              { task_id: 't8', task_name: '开庭预案准备', responsible_role: 'lawyer', deadline_days: 3, is_required: true, description: '准备庭审提纲和应对预案' },
            ],
          },
          {
            stage_id: 's4',
            stage_name: '开庭审理阶段',
            order: 4,
            tasks: [
              { task_id: 't9', task_name: '参加庭审', responsible_role: 'lawyer', deadline_days: 1, is_required: true, description: '出席法庭审理，进行举证质证和辩论' },
              { task_id: 't10', task_name: '庭审笔录确认', responsible_role: 'lawyer', deadline_days: 1, is_required: true, description: '核对庭审笔录并签字确认' },
            ],
          },
          {
            stage_id: 's5',
            stage_name: '判决执行阶段',
            order: 5,
            tasks: [
              { task_id: 't11', task_name: '判决书送达', responsible_role: 'assistant', deadline_days: 2, is_required: true, description: '领取判决书并送达客户' },
              { task_id: 't12', task_name: '判后答疑', responsible_role: 'lawyer', deadline_days: 3, is_required: true, description: '向客户解释判决结果和上诉权利' },
              { task_id: 't13', task_name: '执行申请', responsible_role: 'assistant', deadline_days: 7, is_required: false, description: '如需执行，准备强制执行申请材料' },
            ],
          },
          {
            stage_id: 's6',
            stage_name: '结案归档阶段',
            order: 6,
            tasks: [
              { task_id: 't14', task_name: '案件总结', responsible_role: 'lawyer', deadline_days: 3, is_required: true, description: '撰写办案总结和经验复盘' },
              { task_id: 't15', task_name: '材料归档', responsible_role: 'assistant', deadline_days: 2, is_required: true, description: '整理案件材料并归档' },
            ],
          },
        ],
      },
      {
        name: '婚姻家事案件办案SOP',
        case_type: 'marriage' as any,
        is_default: true,
        enabled: true,
        description: '婚姻家庭案件专项办案流程',
        stages: [
          {
            stage_id: 's1',
            stage_name: '收案评估阶段',
            order: 1,
            tasks: [
              { task_id: 't1', task_name: '婚姻状况评估', responsible_role: 'lawyer', deadline_days: 1, is_required: true, description: '评估婚姻状况和离婚可能性' },
              { task_id: 't2', task_name: '财产初步梳理', responsible_role: 'assistant', deadline_days: 2, is_required: true, description: '梳理夫妻共同财产和债务' },
            ],
          },
          {
            stage_id: 's2',
            stage_name: '调解协商阶段',
            order: 2,
            tasks: [
              { task_id: 't3', task_name: '调解方案制定', responsible_role: 'lawyer', deadline_days: 3, is_required: true, description: '制定财产分割和抚养权方案' },
              { task_id: 't4', task_name: '参与调解谈判', responsible_role: 'lawyer', deadline_days: 5, is_required: false, description: '代表客户参与调解谈判' },
            ],
          },
          {
            stage_id: 's3',
            stage_name: '诉讼立案阶段',
            order: 3,
            tasks: [
              { task_id: 't5', task_name: '起诉材料准备', responsible_role: 'lawyer', deadline_days: 3, is_required: true, description: '准备起诉状和证据材料' },
              { task_id: 't6', task_name: '法院立案', responsible_role: 'assistant', deadline_days: 2, is_required: true, description: '向法院提交立案材料' },
            ],
          },
          {
            stage_id: 's4',
            stage_name: '审理判决阶段',
            order: 4,
            tasks: [
              { task_id: 't7', task_name: '证据收集质证', responsible_role: 'lawyer', deadline_days: 10, is_required: true, description: '收集财产证据，准备质证意见' },
              { task_id: 't8', task_name: '开庭审理', responsible_role: 'lawyer', deadline_days: 1, is_required: true, description: '参加庭审，陈述代理意见' },
            ],
          },
          {
            stage_id: 's5',
            stage_name: '执行结案阶段',
            order: 5,
            tasks: [
              { task_id: 't9', task_name: '判决解读', responsible_role: 'lawyer', deadline_days: 2, is_required: true, description: '向客户解读判决结果' },
              { task_id: 't10', task_name: '财产执行', responsible_role: 'assistant', deadline_days: 15, is_required: false, description: '如需执行，申请强制执行' },
            ],
          },
        ],
      },
      {
        name: '交通事故案件办案SOP',
        case_type: 'traffic' as any,
        is_default: true,
        enabled: true,
        description: '交通事故人身损害赔偿案件办案流程',
        stages: [
          {
            stage_id: 's1',
            stage_name: '事故处理阶段',
            order: 1,
            tasks: [
              { task_id: 't1', task_name: '事故认定书获取', responsible_role: 'assistant', deadline_days: 3, is_required: true, description: '获取交通事故责任认定书' },
              { task_id: 't2', task_name: '证据材料收集', responsible_role: 'assistant', deadline_days: 5, is_required: true, description: '收集医疗记录、误工证明等' },
            ],
          },
          {
            stage_id: 's2',
            stage_name: '伤残鉴定阶段',
            order: 2,
            tasks: [
              { task_id: 't3', task_name: '鉴定机构选择', responsible_role: 'lawyer', deadline_days: 2, is_required: true, description: '选择合适的司法鉴定机构' },
              { task_id: 't4', task_name: '伤残等级鉴定', responsible_role: 'assistant', deadline_days: 15, is_required: true, description: '陪同客户进行伤残鉴定' },
            ],
          },
          {
            stage_id: 's3',
            stage_name: '赔偿协商阶段',
            order: 3,
            tasks: [
              { task_id: 't5', task_name: '赔偿金额计算', responsible_role: 'lawyer', deadline_days: 2, is_required: true, description: '计算各项赔偿项目和金额' },
              { task_id: 't6', task_name: '保险理赔协商', responsible_role: 'lawyer', deadline_days: 10, is_required: false, description: '与保险公司协商理赔' },
            ],
          },
          {
            stage_id: 's4',
            stage_name: '诉讼执行阶段',
            order: 4,
            tasks: [
              { task_id: 't7', task_name: '起诉材料准备', responsible_role: 'lawyer', deadline_days: 3, is_required: true, description: '准备起诉状和证据清单' },
              { task_id: 't8', task_name: '法院诉讼', responsible_role: 'lawyer', deadline_days: 30, is_required: true, description: '进行诉讼程序，参加庭审' },
              { task_id: 't9', task_name: '赔偿执行', responsible_role: 'assistant', deadline_days: 15, is_required: false, description: '申请强制执行赔偿款' },
            ],
          },
        ],
      },
      {
        name: '劳动仲裁案件办案SOP',
        case_type: 'labor' as any,
        is_default: true,
        enabled: true,
        description: '劳动争议仲裁案件办案流程',
        stages: [
          {
            stage_id: 's1',
            stage_name: '证据收集阶段',
            order: 1,
            tasks: [
              { task_id: 't1', task_name: '劳动关系证据收集', responsible_role: 'assistant', deadline_days: 3, is_required: true, description: '收集劳动合同、工资流水、社保记录' },
              { task_id: 't2', task_name: '诉求金额计算', responsible_role: 'lawyer', deadline_days: 2, is_required: true, description: '计算各项赔偿金额' },
            ],
          },
          {
            stage_id: 's2',
            stage_name: '仲裁申请阶段',
            order: 2,
            tasks: [
              { task_id: 't3', task_name: '仲裁申请书起草', responsible_role: 'lawyer', deadline_days: 2, is_required: true, description: '起草劳动仲裁申请书' },
              { task_id: 't4', task_name: '仲裁委立案', responsible_role: 'assistant', deadline_days: 2, is_required: true, description: '提交仲裁申请材料' },
            ],
          },
          {
            stage_id: 's3',
            stage_name: '开庭审理阶段',
            order: 3,
            tasks: [
              { task_id: 't5', task_name: '证据交换质证', responsible_role: 'lawyer', deadline_days: 5, is_required: true, description: '进行证据交换和质证准备' },
              { task_id: 't6', task_name: '仲裁庭开庭', responsible_role: 'lawyer', deadline_days: 1, is_required: true, description: '参加仲裁庭审' },
            ],
          },
          {
            stage_id: 's4',
            stage_name: '裁决执行阶段',
            order: 4,
            tasks: [
              { task_id: 't7', task_name: '裁决书解读', responsible_role: 'lawyer', deadline_days: 2, is_required: true, description: '向客户解释仲裁裁决' },
              { task_id: 't8', task_name: '裁决执行', responsible_role: 'assistant', deadline_days: 10, is_required: false, description: '如对方不履行，申请法院执行' },
            ],
          },
        ],
      },
      {
        name: '债务纠纷案件办案SOP',
        case_type: 'debt' as any,
        is_default: true,
        enabled: true,
        description: '债务追讨纠纷案件办案流程',
        stages: [
          {
            stage_id: 's1',
            stage_name: '债权确认阶段',
            order: 1,
            tasks: [
              { task_id: 't1', task_name: '债权证据审核', responsible_role: 'lawyer', deadline_days: 2, is_required: true, description: '审核借条、转账记录等债权凭证' },
              { task_id: 't2', task_name: '债务财产调查', responsible_role: 'assistant', deadline_days: 5, is_required: false, description: '调查债务人财产状况' },
            ],
          },
          {
            stage_id: 's2',
            stage_name: '催收协商阶段',
            order: 2,
            tasks: [
              { task_id: 't3', task_name: '律师函催告', responsible_role: 'lawyer', deadline_days: 2, is_required: false, description: '发送律师函进行催告' },
              { task_id: 't4', task_name: '还款协商谈判', responsible_role: 'lawyer', deadline_days: 7, is_required: false, description: '与债务人协商还款方案' },
            ],
          },
          {
            stage_id: 's3',
            stage_name: '诉讼保全阶段',
            order: 3,
            tasks: [
              { task_id: 't5', task_name: '财产保全申请', responsible_role: 'lawyer', deadline_days: 3, is_required: false, description: '申请诉前或诉中财产保全' },
              { task_id: 't6', task_name: '起诉材料准备', responsible_role: 'lawyer', deadline_days: 3, is_required: true, description: '准备起诉状和证据材料' },
            ],
          },
          {
            stage_id: 's4',
            stage_name: '执行回款阶段',
            order: 4,
            tasks: [
              { task_id: 't7', task_name: '判决生效', responsible_role: 'assistant', deadline_days: 5, is_required: true, description: '等待判决生效' },
              { task_id: 't8', task_name: '强制执行申请', responsible_role: 'assistant', deadline_days: 3, is_required: true, description: '申请强制执行' },
              { task_id: 't9', task_name: '执行回款跟踪', responsible_role: 'assistant', deadline_days: 30, is_required: true, description: '跟踪执行进度和回款情况' },
            ],
          },
        ],
      },
      {
        name: '刑事辩护案件办案SOP',
        case_type: 'other' as any,
        is_default: false,
        enabled: true,
        description: '刑事辩护案件各阶段标准化办案流程',
        stages: [
          {
            stage_id: 's1',
            stage_name: '侦查阶段',
            order: 1,
            tasks: [
              { task_id: 't1', task_name: '会见嫌疑人', responsible_role: 'lawyer', deadline_days: 3, is_required: true, description: '前往看守所会见嫌疑人了解案情' },
              { task_id: 't2', task_name: '法律手续办理', responsible_role: 'assistant', deadline_days: 2, is_required: true, description: '办理委托辩护手续并提交办案机关' },
            ],
          },
          {
            stage_id: 's2',
            stage_name: '审查起诉阶段',
            order: 2,
            tasks: [
              { task_id: 't3', task_name: '阅卷', responsible_role: 'lawyer', deadline_days: 7, is_required: true, description: '到检察院查阅、摘抄、复制案卷材料' },
              { task_id: 't4', task_name: '法律意见书起草', responsible_role: 'lawyer', deadline_days: 5, is_required: true, description: '起草辩护意见并提交检察院' },
            ],
          },
          {
            stage_id: 's3',
            stage_name: '审判阶段',
            order: 3,
            tasks: [
              { task_id: 't5', task_name: '庭审准备', responsible_role: 'lawyer', deadline_days: 7, is_required: true, description: '准备质证提纲、辩护词和举证材料' },
              { task_id: 't6', task_name: '出席庭审', responsible_role: 'lawyer', deadline_days: 1, is_required: true, description: '参加法庭审理并发表辩护意见' },
            ],
          },
          {
            stage_id: 's4',
            stage_name: '结案阶段',
            order: 4,
            tasks: [
              { task_id: 't7', task_name: '判决解读', responsible_role: 'lawyer', deadline_days: 2, is_required: true, description: '向当事人解读判决结果和上诉权利' },
              { task_id: 't8', task_name: '材料归档', responsible_role: 'assistant', deadline_days: 3, is_required: true, description: '整理卷宗材料并归档' },
            ],
          },
        ],
      },
      {
        name: '合同纠纷案件办案SOP',
        case_type: 'other' as any,
        is_default: false,
        enabled: true,
        description: '合同纠纷案件办案流程',
        stages: [
          {
            stage_id: 's1',
            stage_name: '合同审查阶段',
            order: 1,
            tasks: [
              { task_id: 't1', task_name: '合同条款审查', responsible_role: 'lawyer', deadline_days: 3, is_required: true, description: '审查合同条款效力和违约责任' },
              { task_id: 't2', task_name: '履行情况梳理', responsible_role: 'assistant', deadline_days: 3, is_required: true, description: '梳理合同履行过程和违约事实' },
            ],
          },
          {
            stage_id: 's2',
            stage_name: '证据固定阶段',
            order: 2,
            tasks: [
              { task_id: 't3', task_name: '往来函件整理', responsible_role: 'assistant', deadline_days: 3, is_required: true, description: '整理往来函件、邮件和聊天记录' },
              { task_id: 't4', task_name: '损失证据收集', responsible_role: 'lawyer', deadline_days: 5, is_required: true, description: '收集损失金额和相关凭证' },
            ],
          },
          {
            stage_id: 's3',
            stage_name: '诉讼仲裁阶段',
            order: 3,
            tasks: [
              { task_id: 't5', task_name: '起诉材料起草', responsible_role: 'lawyer', deadline_days: 3, is_required: true, description: '起草起诉状或仲裁申请书' },
              { task_id: 't6', task_name: '立案受理', responsible_role: 'assistant', deadline_days: 2, is_required: true, description: '提交材料办理立案手续' },
              { task_id: 't7', task_name: '庭审应对', responsible_role: 'lawyer', deadline_days: 1, is_required: true, description: '参加庭审并发表代理意见' },
            ],
          },
          {
            stage_id: 's4',
            stage_name: '执行结案阶段',
            order: 4,
            tasks: [
              { task_id: 't8', task_name: '判决生效跟踪', responsible_role: 'assistant', deadline_days: 5, is_required: true, description: '跟踪判决生效情况' },
              { task_id: 't9', task_name: '强制执行', responsible_role: 'assistant', deadline_days: 30, is_required: false, description: '申请强制执行并跟踪回款' },
            ],
          },
        ],
      },
      {
        name: '知识产权纠纷案件办案SOP',
        case_type: 'other' as any,
        is_default: false,
        enabled: true,
        description: '知识产权侵权纠纷案件办案流程',
        stages: [
          {
            stage_id: 's1',
            stage_name: '权属核查阶段',
            order: 1,
            tasks: [
              { task_id: 't1', task_name: '权属证据审核', responsible_role: 'lawyer', deadline_days: 2, is_required: true, description: '审核商标、专利、著作权权属证书' },
              { task_id: 't2', task_name: '权利稳定性评估', responsible_role: 'lawyer', deadline_days: 3, is_required: true, description: '评估权利稳定性和无效风险' },
            ],
          },
          {
            stage_id: 's2',
            stage_name: '侵权取证阶段',
            order: 2,
            tasks: [
              { task_id: 't3', task_name: '侵权证据公证', responsible_role: 'assistant', deadline_days: 5, is_required: true, description: '对侵权行为进行公证保全' },
              { task_id: 't4', task_name: '侵权对比分析', responsible_role: 'lawyer', deadline_days: 5, is_required: true, description: '制作侵权对比表和分析意见' },
            ],
          },
          {
            stage_id: 's3',
            stage_name: '诉讼维权阶段',
            order: 3,
            tasks: [
              { task_id: 't5', task_name: '起诉材料准备', responsible_role: 'lawyer', deadline_days: 3, is_required: true, description: '起草起诉状和赔偿计算依据' },
              { task_id: 't6', task_name: '法院立案', responsible_role: 'assistant', deadline_days: 2, is_required: true, description: '向有管辖权的法院提交立案材料' },
              { task_id: 't7', task_name: '庭审应对', responsible_role: 'lawyer', deadline_days: 1, is_required: true, description: '参加庭审并发表代理意见' },
            ],
          },
          {
            stage_id: 's4',
            stage_name: '执行结案阶段',
            order: 4,
            tasks: [
              { task_id: 't8', task_name: '判决送达', responsible_role: 'assistant', deadline_days: 2, is_required: true, description: '领取判决书并送达客户' },
              { task_id: 't9', task_name: '执行申请', responsible_role: 'assistant', deadline_days: 15, is_required: false, description: '申请强制执行赔偿款' },
            ],
          },
        ],
      },
      {
        name: '房产纠纷案件办案SOP',
        case_type: 'other' as any,
        is_default: false,
        enabled: true,
        description: '房产纠纷案件办案流程',
        stages: [
          {
            stage_id: 's1',
            stage_name: '权属调查阶段',
            order: 1,
            tasks: [
              { task_id: 't1', task_name: '房产权属核查', responsible_role: 'lawyer', deadline_days: 3, is_required: true, description: '核查房产登记信息和权属状况' },
              { task_id: 't2', task_name: '交易背景调查', responsible_role: 'assistant', deadline_days: 5, is_required: true, description: '调查交易背景和付款情况' },
            ],
          },
          {
            stage_id: 's2',
            stage_name: '协商调解阶段',
            order: 2,
            tasks: [
              { task_id: 't3', task_name: '调解方案制定', responsible_role: 'lawyer', deadline_days: 3, is_required: false, description: '制定调解方案并与对方沟通' },
              { task_id: 't4', task_name: '调解谈判', responsible_role: 'lawyer', deadline_days: 7, is_required: false, description: '代表客户参与调解谈判' },
            ],
          },
          {
            stage_id: 's3',
            stage_name: '诉讼阶段',
            order: 3,
            tasks: [
              { task_id: 't5', task_name: '起诉材料准备', responsible_role: 'lawyer', deadline_days: 3, is_required: true, description: '准备起诉状和证据清单' },
              { task_id: 't6', task_name: '财产保全', responsible_role: 'lawyer', deadline_days: 2, is_required: false, description: '申请查封涉案房产' },
              { task_id: 't7', task_name: '庭审应对', responsible_role: 'lawyer', deadline_days: 1, is_required: true, description: '参加庭审并发表代理意见' },
            ],
          },
          {
            stage_id: 's4',
            stage_name: '执行结案阶段',
            order: 4,
            tasks: [
              { task_id: 't8', task_name: '判决生效', responsible_role: 'assistant', deadline_days: 5, is_required: true, description: '跟踪判决生效情况' },
              { task_id: 't9', task_name: '协助过户', responsible_role: 'assistant', deadline_days: 15, is_required: false, description: '协助办理房产过户手续' },
            ],
          },
        ],
      },
      {
        name: '股权纠纷案件办案SOP',
        case_type: 'other' as any,
        is_default: false,
        enabled: true,
        description: '公司股权纠纷案件办案流程',
        stages: [
          {
            stage_id: 's1',
            stage_name: '公司情况调查阶段',
            order: 1,
            tasks: [
              { task_id: 't1', task_name: '工商档案调取', responsible_role: 'assistant', deadline_days: 3, is_required: true, description: '调取公司工商登记档案和章程' },
              { task_id: 't2', task_name: '股权结构分析', responsible_role: 'lawyer', deadline_days: 3, is_required: true, description: '分析股权结构和争议焦点' },
            ],
          },
          {
            stage_id: 's2',
            stage_name: '证据收集阶段',
            order: 2,
            tasks: [
              { task_id: 't3', task_name: '股东会决议核查', responsible_role: 'lawyer', deadline_days: 5, is_required: true, description: '核查股东会、董事会决议合法性' },
              { task_id: 't4', task_name: '出资情况核实', responsible_role: 'assistant', deadline_days: 5, is_required: true, description: '核实出资情况和财务记录' },
            ],
          },
          {
            stage_id: 's3',
            stage_name: '诉讼阶段',
            order: 3,
            tasks: [
              { task_id: 't5', task_name: '起诉材料起草', responsible_role: 'lawyer', deadline_days: 3, is_required: true, description: '起草起诉状和诉讼请求' },
              { task_id: 't6', task_name: '立案受理', responsible_role: 'assistant', deadline_days: 2, is_required: true, description: '提交材料办理立案' },
              { task_id: 't7', task_name: '庭审应对', responsible_role: 'lawyer', deadline_days: 1, is_required: true, description: '参加庭审并发表代理意见' },
            ],
          },
          {
            stage_id: 's4',
            stage_name: '执行结案阶段',
            order: 4,
            tasks: [
              { task_id: 't8', task_name: '判决解读', responsible_role: 'lawyer', deadline_days: 2, is_required: true, description: '向客户解读判决结果' },
              { task_id: 't9', task_name: '工商变更协助', responsible_role: 'assistant', deadline_days: 15, is_required: false, description: '协助办理工商变更登记' },
            ],
          },
        ],
      },
      {
        name: '行政纠纷案件办案SOP',
        case_type: 'other' as any,
        is_default: false,
        enabled: true,
        description: '行政诉讼案件办案流程',
        stages: [
          {
            stage_id: 's1',
            stage_name: '行政行为审查阶段',
            order: 1,
            tasks: [
              { task_id: 't1', task_name: '行政行为合法性审查', responsible_role: 'lawyer', deadline_days: 3, is_required: true, description: '审查行政行为合法性和合理性' },
              { task_id: 't2', task_name: '起诉期限核查', responsible_role: 'assistant', deadline_days: 1, is_required: true, description: '核查起诉期限是否届满' },
            ],
          },
          {
            stage_id: 's2',
            stage_name: '复议选择阶段',
            order: 2,
            tasks: [
              { task_id: 't3', task_name: '复议可行性评估', responsible_role: 'lawyer', deadline_days: 2, is_required: false, description: '评估是否先行行政复议' },
              { task_id: 't4', task_name: '复议材料准备', responsible_role: 'lawyer', deadline_days: 3, is_required: false, description: '起草行政复议申请书' },
            ],
          },
          {
            stage_id: 's3',
            stage_name: '诉讼阶段',
            order: 3,
            tasks: [
              { task_id: 't5', task_name: '起诉状起草', responsible_role: 'lawyer', deadline_days: 3, is_required: true, description: '起草行政诉讼起诉状' },
              { task_id: 't6', task_name: '立案受理', responsible_role: 'assistant', deadline_days: 5, is_required: true, description: '向法院提交立案材料' },
              { task_id: 't7', task_name: '庭审应对', responsible_role: 'lawyer', deadline_days: 1, is_required: true, description: '参加庭审并发表代理意见' },
            ],
          },
          {
            stage_id: 's4',
            stage_name: '结案阶段',
            order: 4,
            tasks: [
              { task_id: 't8', task_name: '判决解读', responsible_role: 'lawyer', deadline_days: 2, is_required: true, description: '向客户解读判决结果' },
              { task_id: 't9', task_name: '材料归档', responsible_role: 'assistant', deadline_days: 3, is_required: true, description: '整理卷宗材料并归档' },
            ],
          },
        ],
      },
    ];

    for (const tpl of templates) {
      const existing = await this.caseSOPTemplateRepository.findOne({ where: { name: tpl.name } });
      if (!existing) {
        await this.caseSOPTemplateRepository.save({
          ...tpl,
          organization_id: orgId,
        });
      }
    }
  }


  // ============ SCRM模块种子数据 ============

  private async seedChannelTrackings(orgId: string, userMap: Record<string, User>) {
    const liveCodes = await this.liveCodeRepository.find({ where: { organization_id: orgId }, take: 5 });

    const channelData = [
      { channel_name: '抖音-婚姻律师投放', channel_group: '抖音投放', scan_count: 1280, add_count: 856, invite_count: 320, sign_count: 86 },
      { channel_name: '抖音-交通事故投放', channel_group: '抖音投放', scan_count: 950, add_count: 620, invite_count: 240, sign_count: 65 },
      { channel_name: '百度-劳动仲裁投放', channel_group: '百度投放', scan_count: 1100, add_count: 735, invite_count: 280, sign_count: 72 },
      { channel_name: '百度-债务追讨投放', channel_group: '百度投放', scan_count: 820, add_count: 540, invite_count: 190, sign_count: 48 },
      { channel_name: '快手-婚姻家事投放', channel_group: '快手投放', scan_count: 760, add_count: 510, invite_count: 180, sign_count: 42 },
      { channel_name: '快手-工伤维权投放', channel_group: '快手投放', scan_count: 680, add_count: 450, invite_count: 160, sign_count: 38 },
      { channel_name: '视频号-法律科普', channel_group: '微信生态', scan_count: 520, add_count: 380, invite_count: 120, sign_count: 30 },
      { channel_name: '公众号-法律咨询', channel_group: '微信生态', scan_count: 650, add_count: 480, invite_count: 150, sign_count: 38 },
      { channel_name: '老客户转介绍', channel_group: '自然流量', scan_count: 280, add_count: 260, invite_count: 200, sign_count: 95 },
      { channel_name: '线下活动', channel_group: '自然流量', scan_count: 150, add_count: 120, invite_count: 80, sign_count: 35 },
    ];

    for (let i = 0; i < channelData.length; i++) {
      const data = channelData[i];
      const liveCode = liveCodes[i % liveCodes.length];
      const existing = await this.channelTrackingRepository.findOne({ where: { channel_name: data.channel_name } });
      if (!existing) {
        await this.channelTrackingRepository.save({
          ...data,
          live_code_id: liveCode?.id,
          organization_id: orgId,
        });
      }
    }
  }

  private async seedReachTasks(orgId: string, userMap: Record<string, User>) {
    const marketingUser = userMap['13800138002'];
    const salesUser = userMap['13800138003'];

    const taskData = [
      {
        task_type: '1v1',
        content: '您好，我是XX律所的法律顾问，之前您咨询过婚姻相关的法律问题，请问现在情况怎么样了？我们可以为您提供免费的法律咨询服务。',
        target_tags: JSON.stringify(['婚姻案由', '抖音来源']),
        schedule_time: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        status: 'pending',
        target_count: 50,
        sent_count: 0,
        created_by: salesUser?.id,
      },
      {
        task_type: 'moments',
        content: '【法律知识】交通事故赔偿标准详解：医疗费、误工费、护理费、营养费、残疾赔偿金...发生交通事故不知道怎么赔？私信我，免费为您计算赔偿金额。',
        target_tags: null,
        media_paths: JSON.stringify(['/materials/traffic-cover.jpg', '/materials/traffic-infographic.jpg']),
        publish_accounts: JSON.stringify(['企业微信主号', '销售1号', '销售2号']),
        schedule_time: new Date(Date.now() + 0.5 * 24 * 60 * 60 * 1000),
        status: 'scheduled',
        target_count: 3,
        sent_count: 0,
        created_by: marketingUser?.id,
      },
      {
        task_type: 'group_sop',
        content: '【群SOP-第1天】欢迎加入法律咨询交流群！本群为大家提供免费的法律问题解答。群公告：1. 禁止发广告 2. 提问请@群主 3. 定期分享法律知识。今天话题：劳动合同纠纷那些事。',
        target_tags: JSON.stringify(['劳动案由']),
        schedule_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        status: 'draft',
        target_count: 200,
        sent_count: 0,
        created_by: salesUser?.id,
      },
      {
        task_type: '1v1',
        content: '王先生您好，上周您咨询的债务追讨问题，我们已经研究了您的案件材料，建议尽快采取保全措施防止对方转移财产。请问明天方便来所里面谈吗？',
        target_tags: JSON.stringify(['债务案由', '高意向']),
        schedule_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        status: 'sent',
        target_count: 15,
        sent_count: 15,
        created_by: salesUser?.id,
      },
      {
        task_type: 'moments',
        content: '【胜诉案例】客户因工受伤，公司拒绝赔偿。我们代理后，成功认定工伤并鉴定为十级伤残，最终获赔18万元。#工伤赔偿 #劳动仲裁 #法律维权',
        target_tags: null,
        media_paths: JSON.stringify(['/materials/case-victory.jpg']),
        publish_accounts: JSON.stringify(['企业微信主号']),
        schedule_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: 'sent',
        target_count: 1,
        sent_count: 1,
        created_by: marketingUser?.id,
      },
      {
        task_type: '1v1',
        content: '李女士您好，您咨询的离婚财产分割问题，根据我们的分析，房产属于夫妻共同财产，您有权分得一半。建议您尽快收集相关证据。',
        target_tags: JSON.stringify(['婚姻案由', '百度来源']),
        schedule_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        status: 'pending',
        target_count: 30,
        sent_count: 0,
        created_by: salesUser?.id,
      },
      {
        task_type: 'group_sop',
        content: '【群SOP-第3天】今日法律知识分享：借条怎么写才有法律效力？1. 写明借款金额和用途 2. 约定还款时间和利息 3. 借款人签字按手印 4. 保留转账凭证。需要借条模板的可以私信我。',
        target_tags: JSON.stringify(['债务案由']),
        schedule_time: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        status: 'draft',
        target_count: 150,
        sent_count: 0,
        created_by: salesUser?.id,
      },
      {
        task_type: 'moments',
        content: '【法律提醒】劳动仲裁时效只有一年！如果公司拖欠工资、违法辞退，一定要在一年内申请仲裁，否则可能丧失胜诉权。有劳动纠纷问题欢迎私信咨询。',
        target_tags: null,
        media_paths: JSON.stringify(['/materials/labor-law-tip.jpg']),
        publish_accounts: JSON.stringify(['企业微信主号', '销售1号', '销售2号', '助理号']),
        schedule_time: new Date(Date.now() + 1.5 * 24 * 60 * 60 * 1000),
        status: 'scheduled',
        target_count: 4,
        sent_count: 0,
        created_by: marketingUser?.id,
      },
      {
        task_type: '1v1',
        content: '张先生您好，您的交通事故案件伤残鉴定结果已经出来了，十级伤残。根据您的情况，预计赔偿金额在20-25万左右。请问方便来所里详细沟通一下赔偿方案吗？',
        target_tags: JSON.stringify(['交通案由', '高意向']),
        schedule_time: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000),
        status: 'sent',
        target_count: 8,
        sent_count: 8,
        created_by: salesUser?.id,
      },
      {
        task_type: 'moments',
        content: '【年末普法】年底了，欠钱不还的要注意了！诉讼时效是3年，过了时效再起诉可能败诉。有债务问题的朋友，抓紧时间维权！私信我，帮你制定追讨方案。',
        target_tags: null,
        media_paths: JSON.stringify(['/materials/debt-collection.jpg']),
        publish_accounts: JSON.stringify(['企业微信主号', '销售1号']),
        schedule_time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        status: 'sent',
        target_count: 2,
        sent_count: 2,
        created_by: marketingUser?.id,
      },
    ];

    for (const data of taskData) {
      const existing = await this.reachTaskRepository.findOne({ where: { content: data.content.slice(0, 20) } });
      if (!existing) {
        await this.reachTaskRepository.save({
          ...data,
          organization_id: orgId,
        });
      }
    }
  }

  private async seedChatArchives(orgId: string, userMap: Record<string, User>) {
    const salesUser = userMap['13800138003'];
    const salesUser2 = userMap['13800138009'];
    const clientUser = userMap['13800138007'];
    const clientUser2 = userMap['13800138011'];

    const chatData = [
      { client_id: clientUser?.id, employee_id: salesUser?.id, message_type: 'text', content: '您好，我是XX律所的张律师，看到您在抖音上咨询了婚姻问题', sent_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), compliance_synced: true, compliance_result: 'pass' },
      { client_id: clientUser?.id, employee_id: salesUser?.id, message_type: 'text', content: '是的，我想咨询一下离婚的事，我老公出轨了，我想离婚', sent_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 60000), compliance_synced: true, compliance_result: 'pass' },
      { client_id: clientUser?.id, employee_id: salesUser?.id, message_type: 'text', content: '您有对方出轨的证据吗？你们有孩子和共同财产吗？', sent_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 120000), compliance_synced: true, compliance_result: 'pass' },
      { client_id: clientUser2?.id, employee_id: salesUser2?.id, message_type: 'text', content: '你好，我被公司辞退了，可以申请劳动仲裁吗', sent_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), compliance_synced: true, compliance_result: 'pass' },
      { client_id: clientUser2?.id, employee_id: salesUser2?.id, message_type: 'text', content: '公司说我能力不行，给我调岗降薪，我不同意就把我开了', sent_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 120000), compliance_synced: true, compliance_result: 'pass' },
      { client_id: clientUser2?.id, employee_id: salesUser2?.id, message_type: 'text', content: '这个案子很简单，肯定能赢，你放心交给我们', sent_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 300000), compliance_synced: true, compliance_result: 'warning' },
      { client_id: clientUser?.id, employee_id: salesUser?.id, message_type: 'image', content: '结婚证照片', file_path: '/chat-images/marriage-cert.jpg', sent_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), compliance_synced: true, compliance_result: 'pass' },
      { client_id: clientUser?.id, employee_id: salesUser?.id, message_type: 'text', content: '那这个案子你们收费多少啊？', sent_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 600000), compliance_synced: true, compliance_result: 'pass' },
      { client_id: clientUser2?.id, employee_id: salesUser2?.id, message_type: 'voice', content: '语音沟通', file_path: '/chat-voices/consultation-1.mp3', sent_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), compliance_synced: false, compliance_result: null },
      { client_id: clientUser2?.id, employee_id: salesUser2?.id, message_type: 'text', content: '我们和法院有关系，可以帮你多要一些赔偿', sent_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 180000), compliance_synced: true, compliance_result: 'reject' },
      { client_id: clientUser?.id, employee_id: salesUser?.id, message_type: 'text', content: '好的，那我明天过来签合同，地址发我一下', sent_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), compliance_synced: true, compliance_result: 'pass' },
      { client_id: clientUser2?.id, employee_id: salesUser2?.id, message_type: 'file', content: '劳动合同.pdf', file_path: '/chat-files/labor-contract.pdf', sent_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), compliance_synced: false, compliance_result: null },
    ];

    for (const data of chatData) {
      const existing = await this.chatArchiveRepository.findOne({
        where: { content: data.content, sent_at: data.sent_at },
      });
      if (!existing) {
        await this.chatArchiveRepository.save({
          ...data,
          organization_id: orgId,
        });
      }
    }
  }

  private async seedScriptLibraries(orgId: string, userMap: Record<string, User>) {
    const salesUser = userMap['13800138003'];

    const scripts = [
      {
        category: 'greeting',
        title: '首次添加好友开场白',
        content: '您好，我是XX律所的张律师。您是通过抖音/百度/快手添加我的，之前咨询过法律相关问题。请问您现在方便沟通吗？我可以为您提供免费的法律咨询服务。',
        material_ids: JSON.stringify(['lawyer-card.jpg']),
      },
      {
        category: 'greeting',
        title: '老客户回访开场白',
        content: 'X先生/女士您好，我是XX律所的张律师，之前为您提供过法律服务。最近工作生活都还好吧？我们律所有免费的年度法律咨询服务，有任何法律问题都可以随时找我。',
        material_ids: null,
      },
      {
        category: 'case_consult',
        title: '婚姻案件咨询话术',
        content: '关于离婚案件，我先了解一下您的情况：1. 结婚多长时间了？2. 有没有孩子？3. 有哪些夫妻共同财产？4. 对方是什么态度？了解这些情况后我才能给您更准确的建议。',
        material_ids: JSON.stringify(['divorce-checklist.pdf']),
      },
      {
        category: 'case_consult',
        title: '交通事故案件咨询话术',
        content: '交通事故赔偿主要包括：医疗费、误工费、护理费、营养费、住院伙食补助费、交通费、残疾赔偿金、精神损害抚慰金等。具体金额需要根据您的伤情、收入、责任划分等情况来计算。',
        material_ids: JSON.stringify(['traffic-compensation-table.jpg']),
      },
      {
        category: 'case_consult',
        title: '劳动仲裁咨询话术',
        content: '劳动仲裁可以主张的请求包括：拖欠工资、加班费、经济补偿金、赔偿金、未签劳动合同双倍工资差额、年休假工资等。您具体是哪方面的问题呢？我帮您分析一下可以主张哪些权益。',
        material_ids: JSON.stringify(['labor-arbitration-guide.pdf']),
      },
      {
        category: 'objection',
        title: '费用太贵异议处理',
        content: '我理解您对费用的顾虑。我们律所的收费是严格按照律师服务收费指导标准来的，而且我们是团队办案，会有主办律师+助理共同负责您的案件，确保案件质量。另外，我们还可以根据案件情况采用风险代理的方式，您拿到赔偿后再付律师费。',
        material_ids: null,
      },
      {
        category: 'objection',
        title: '考虑考虑异议处理',
        content: '没问题，您可以先考虑一下。不过我想提醒您，法律案件都有时效性，比如劳动仲裁时效是一年，交通事故诉讼时效是三年。而且证据越早收集越好，时间长了可能证据就灭失了。您有任何问题随时问我，我帮您解答。',
        material_ids: null,
      },
      {
        category: 'objection',
        title: '找朋友律师异议处理',
        content: '我理解您的想法，找熟人律师可能感觉更放心。不过律师也有专业分工，比如有的律师擅长刑事，有的擅长婚姻家庭。我们律所是专门做这类案件的，办理过很多类似的案件，经验更丰富。而且我们有严格的办案流程和质量管控，能更好地保障您的权益。',
        material_ids: null,
      },
      {
        category: 'closing',
        title: '邀约到所促单话术',
        content: '您的情况我已经有了基本了解，但是很多细节还需要当面沟通，而且我可以给您看看我们办理过的类似案例。您看明天还是后天方便？来我们所里详细聊一下，咨询是免费的，您也可以实地了解一下我们律所的情况。',
        material_ids: JSON.stringify(['office-intro.pptx']),
      },
      {
        category: 'closing',
        title: '签约促单话术',
        content: '您的案件我们已经分析过了，胜诉的可能性还是很大的，而且对方有财产可供执行，回款也有保障。如果您决定委托的话，我们今天就可以签合同，明天就开始准备材料。越早启动，对您的案件越有利。',
        material_ids: null,
      },
      {
        category: 'follow_up',
        title: '首次跟进话术（3天后）',
        content: 'X先生/女士您好，我是XX律所的张律师。前几天您咨询了XX案件，不知道您考虑得怎么样了？有什么疑问或者顾虑都可以跟我说，我帮您分析解答。',
        material_ids: null,
      },
      {
        category: 'follow_up',
        title: '二次跟进话术（7天后）',
        content: 'X先生/女士您好，我是XX律所的张律师。跟您说个事，我们律所最近有个公益法律咨询活动，免费为市民提供法律问题解答和案件分析。您的案件我还记得，方便的话可以过来再详细聊聊，活动期间咨询完全免费。',
        material_ids: JSON.stringify(['activity-poster.jpg']),
      },
    ];

    for (const script of scripts) {
      const existing = await this.scriptLibraryRepository.findOne({ where: { title: script.title } });
      if (!existing) {
        await this.scriptLibraryRepository.save({
          ...script,
          organization_id: orgId,
          created_by: salesUser?.id,
        });
      }
    }
  }


}