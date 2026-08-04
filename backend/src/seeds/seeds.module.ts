import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { Organization } from '../user/organization.entity';
import { Role } from '../user/role.entity';
import { Menu } from '../user/menu.entity';
import { Notification } from '../user/notification.entity';
import { Permission } from '../user/permission.entity';
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

// Phase 5 新增实体
import { DigitalHumanLive, DigitalHumanLiveStatus } from '../marketing/digital-human-live.entity';
import { LegalDocument } from '../case/legal-document.entity';
import { ClientArchive } from '../client/client-archive.entity';
import { Reconciliation, ReconciliationStatus } from '../finance/reconciliation.entity';
import { DeploymentConfig } from '../system/deployment-config.entity';
import { BrandConfig } from '../system/brand-config.entity';
import { Integration } from '../system/integration.entity';

// kinglex 模块实体
import { Seal } from '../seal/seal.entity';
import { SealApplication } from '../seal/seal-application.entity';
import { SealRecord } from '../seal/seal-record.entity';
import { Contract } from '../contract/contract.entity';
import { ApprovalRequest } from '../approval/approval-request.entity';
import { ApprovalStep } from '../approval/approval-step.entity';
import { Worklog } from '../worklog/worklog.entity';
import { Schedule } from '../schedule/schedule.entity';
import { MeetingRoom } from '../schedule/meeting-room.entity';
import { MeetingRoomBooking } from '../schedule/meeting-room-booking.entity';
import { Task } from '../task/task.entity';
import { KnowledgeArticle } from '../knowledge/knowledge-article.entity';
import { LawRegulation } from '../knowledge/law-regulation.entity';
import { CasePrecedent } from '../knowledge/case-precedent.entity';
import { Bid } from '../bid/bid.entity';
import { BidRecord } from '../bid/bid-record.entity';
import { DueDiligence } from '../due-diligence/due-diligence.entity';
import { Diagram } from '../diagram/diagram.entity';
import { PaymentReminder } from '../finance/payment-reminder.entity';
import { BusinessFund } from '../finance/business-fund.entity';
import { ConflictCheck } from '../case/conflict-check.entity';
import { ClientProfile } from '../client/client-profile.entity';

// HR模块实体
import { HrLeave, LeaveStatus } from '../hr/leave.entity';
import { Attendance, AttendanceStatus } from '../hr/attendance.entity';
import { MaterialRequisition, MaterialStatus, MaterialType } from '../hr/material-requisition.entity';
import { HrActivity, ActivityStatus, ActivityType } from '../hr/activity.entity';
import { ActivityRegistration } from '../hr/activity-registration.entity';

// 同事圆社交模块实体
import { SocialPost, PostType } from '../social/social-post.entity';
import { SocialComment } from '../social/social-comment.entity';
import { SocialLike } from '../social/social-like.entity';

// 邮件模块实体
import { Mail, MailType } from '../mail/mail.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    User,
    Organization,
    Role,
    Menu,
    Notification,
    Permission,
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
    // Phase 5 新增
    DigitalHumanLive,
    LegalDocument,
    ClientArchive,
    Reconciliation,
    DeploymentConfig,
    BrandConfig,
    Integration,
    // kinglex 模块实体
    Seal,
    SealApplication,
    SealRecord,
    Contract,
    ApprovalRequest,
    ApprovalStep,
    Worklog,
    Schedule,
    MeetingRoom,
    MeetingRoomBooking,
    Task,
    KnowledgeArticle,
    LawRegulation,
    CasePrecedent,
    Bid,
    BidRecord,
    DueDiligence,
    Diagram,
    PaymentReminder,
    BusinessFund,
    ConflictCheck,
    ClientProfile,
    // HR模块实体
    HrLeave,
    Attendance,
    MaterialRequisition,
    HrActivity,
    ActivityRegistration,
    // 同事圆社交模块
    SocialPost,
    SocialComment,
    SocialLike,
    // 邮件模块
    Mail,
  ])],
})
export class SeedsModule implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Organization)
    private readonly orgRepository: Repository<Organization>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
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
    // Phase 5 新增
    @InjectRepository(DigitalHumanLive)
    private readonly digitalHumanLiveRepository: Repository<DigitalHumanLive>,
    @InjectRepository(LegalDocument)
    private readonly legalDocumentRepository: Repository<LegalDocument>,
    @InjectRepository(ClientArchive)
    private readonly clientArchiveRepository: Repository<ClientArchive>,
    @InjectRepository(Reconciliation)
    private readonly reconciliationRepository: Repository<Reconciliation>,
    @InjectRepository(DeploymentConfig)
    private readonly deploymentConfigRepository: Repository<DeploymentConfig>,
    @InjectRepository(BrandConfig)
    private readonly brandConfigRepository: Repository<BrandConfig>,
    @InjectRepository(Integration)
    private readonly integrationRepository: Repository<Integration>,
    // kinglex 模块实体
    @InjectRepository(Seal)
    private readonly sealRepository: Repository<Seal>,
    @InjectRepository(SealApplication)
    private readonly sealApplicationRepository: Repository<SealApplication>,
    @InjectRepository(SealRecord)
    private readonly sealRecordRepository: Repository<SealRecord>,
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
    @InjectRepository(ApprovalRequest)
    private readonly approvalRequestRepository: Repository<ApprovalRequest>,
    @InjectRepository(ApprovalStep)
    private readonly approvalStepRepository: Repository<ApprovalStep>,
    @InjectRepository(Worklog)
    private readonly worklogRepository: Repository<Worklog>,
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(MeetingRoom)
    private readonly meetingRoomRepository: Repository<MeetingRoom>,
    @InjectRepository(MeetingRoomBooking)
    private readonly meetingRoomBookingRepository: Repository<MeetingRoomBooking>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(KnowledgeArticle)
    private readonly knowledgeArticleRepository: Repository<KnowledgeArticle>,
    @InjectRepository(LawRegulation)
    private readonly lawRegulationRepository: Repository<LawRegulation>,
    @InjectRepository(CasePrecedent)
    private readonly casePrecedentRepository: Repository<CasePrecedent>,
    @InjectRepository(Bid)
    private readonly bidRepository: Repository<Bid>,
    @InjectRepository(BidRecord)
    private readonly bidRecordRepository: Repository<BidRecord>,
    @InjectRepository(DueDiligence)
    private readonly dueDiligenceRepository: Repository<DueDiligence>,
    @InjectRepository(Diagram)
    private readonly diagramRepository: Repository<Diagram>,
    @InjectRepository(PaymentReminder)
    private readonly paymentReminderRepository: Repository<PaymentReminder>,
    @InjectRepository(BusinessFund)
    private readonly businessFundRepository: Repository<BusinessFund>,
    @InjectRepository(ConflictCheck)
    private readonly conflictCheckRepository: Repository<ConflictCheck>,
    @InjectRepository(ClientProfile)
    private readonly clientProfileRepository: Repository<ClientProfile>,
    // HR模块Repository注入
    @InjectRepository(HrLeave)
    private readonly hrLeaveRepository: Repository<HrLeave>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(MaterialRequisition)
    private readonly materialRepository: Repository<MaterialRequisition>,
    @InjectRepository(HrActivity)
    private readonly hrActivityRepository: Repository<HrActivity>,
    @InjectRepository(ActivityRegistration)
    private readonly activityRegistrationRepository: Repository<ActivityRegistration>,
    // 同事圆社交模块
    @InjectRepository(SocialPost)
    private readonly socialPostRepository: Repository<SocialPost>,
    @InjectRepository(SocialComment)
    private readonly socialCommentRepository: Repository<SocialComment>,
    @InjectRepository(SocialLike)
    private readonly socialLikeRepository: Repository<SocialLike>,
    // 邮件模块
    @InjectRepository(Mail)
    private readonly mailRepository: Repository<Mail>,
  ) {}

  async onModuleInit() {
    await this.seedData();
  }

  private async seedData() {
    // 生产环境只初始化超管+基础配置，不创建测试业务数据
    if (process.env.NODE_ENV === 'production') {
      await this.seedProductionData();
      return;
    }

    // 安全保护：如果数据库已有生产组织，则不执行测试seed（防止测试数据污染生产库）
    const prodOrg = await this.orgRepository.findOne({ where: { name: '法智汇律所' } });
    if (prodOrg) {
      // 已有生产数据，仅补充基础配置（权限/角色/菜单），不创建测试业务数据
      await this.seedPermissions();
      await this.seedRoles(prodOrg.id);
      await this.seedMenus();
      return;
    }

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

    // 系统管理模块数据
    await this.seedPermissions();
    await this.seedRoles(orgId);
    await this.seedMenus();
    await this.seedNotifications(userMap);

    // Phase 5 新增数据
    // 数字人直播数据
    await this.seedDigitalHumanLives(orgId, userMap);
    // AI文书模板数据
    await this.seedLegalDocuments(orgId, userMap);
    // 云归档数据
    await this.seedClientArchives(orgId, userMap);
    // 智能对账数据
    await this.seedReconciliations(orgId, userMap);
    // 系统部署配置
    await this.seedDeploymentConfigs(orgId);
    // 品牌定制配置
    await this.seedBrandConfigs(orgId);
    // 第三方对接配置
    await this.seedIntegrations(orgId);

    // kinglex 模块种子数据
    // 用印管理数据
    await this.seedSeals(orgId, userMap);
    // 合同数据
    await this.seedContracts(orgId, userMap);
    // 审批数据
    await this.seedApprovals(orgId, userMap);
    // 工作日志数据
    await this.seedWorkLogs(orgId, userMap);
    // 日程数据
    await this.seedSchedules(orgId, userMap);
    // 任务数据
    await this.seedTasks(orgId, userMap);
    // 知识库数据
    await this.seedKnowledge(orgId, userMap);
    // 投标数据
    await this.seedBids(orgId, userMap);
    // 尽调数据
    await this.seedDueDiligence(orgId, userMap);
    // 绘图数据
    await this.seedDiagrams(orgId, userMap);
    // 催款数据
    await this.seedPaymentReminders(orgId, userMap);
    // 发票数据
    await this.seedInvoices(orgId, userMap);
    // 业务款数据
    await this.seedBusinessFunds(orgId, userMap);
    // 利冲检索数据
    await this.seedConflictChecks(orgId, userMap);
    // 客户档案数据
    await this.seedClientProfiles(orgId, userMap);
    // HR模块数据
    await this.seedHrLeaves(orgId, userMap);
    await this.seedAttendances(orgId, userMap);
    await this.seedMaterials(orgId, userMap);
    await this.seedHrActivities(orgId, userMap);
    // 同事圆社交数据
    await this.seedSocialPosts(orgId, userMap);
    // 邮件数据
    await this.seedMails(orgId, userMap);
  }

  /**
   * 生产环境初始化：仅创建超管+基础配置，不创建测试业务数据
   * 包含：默认组织、超级管理员(15820275356/zxs123456)、权限、角色、菜单、系统配置
   */
  private async seedProductionData(): Promise<void> {
    // 创建默认组织
    let orgId: string;
    const existingOrg = await this.orgRepository.findOne({ where: { name: '法智汇律所' } });
    if (!existingOrg) {
      const org = this.orgRepository.create({
        name: '法智汇律所',
        address: '',
        license_no: '',
      });
      const savedOrg = await this.orgRepository.save(org);
      orgId = savedOrg.id;
    } else {
      orgId = existingOrg.id;
    }

    // 创建超级管理员（仅不存在时创建，密码更新由管理员自行操作）
    const adminPhone = '15820275356';
    const adminPassword = 'zxs123456';
    const existingAdmin = await this.userRepository.findOne({ where: { phone: adminPhone } });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await this.userRepository.save({
        phone: adminPhone,
        real_name: '超级管理员',
        role: UserRole.SUPER_ADMIN,
        password: hashedPassword,
        organization_id: orgId,
      });
    }

    // 基础配置：权限、角色、菜单
    await this.seedPermissions();
    await this.seedRoles(orgId);
    await this.seedMenus();

    // 系统配置：部署、品牌
    await this.seedDeploymentConfigs(orgId);
    await this.seedBrandConfigs(orgId);
    // 生产环境不预填第三方对接demo数据，由用户自行配置
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

    for (let i = 0; i < leadData.length; i++) {
      const data = leadData[i];
      const existing = await this.leadRepository.findOne({ where: { phone: data.phone } });
      if (!existing) {
        // === 新增字段生成 ===
        // 是否公共线索池（约30%为true）
        const isPublic = i % 3 === 0;
        // 转化状态（根据线索状态映射）
        const conversionStatusMap: Record<string, string> = {
          [LeadStatus.PENDING_SIGN]: 'converted',
          [LeadStatus.FOLLOWING]: 'converting',
          [LeadStatus.INVITING]: 'converting',
          [LeadStatus.NEGOTIATING]: 'converting',
          [LeadStatus.NEW]: 'not_converted',
          [LeadStatus.LOST]: 'not_converted',
        };
        const conversionStatus = conversionStatusMap[data.status] || 'not_converted';

        const lead = await this.leadRepository.save({
          ...data,
          is_public: isPublic,
          conversion_status: conversionStatus,
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

    for (let i = 0; i < caseData.length; i++) {
      const data = caseData[i];
      const existing = await this.caseRepository.findOne({ where: { case_no: data.case_no } });
      if (!existing) {
        // === 新增字段：根据案件类型和状态生成 ===
        // 案件类型到名称和大类的映射
        const caseTypeMap: Record<string, { name: string; category: string }> = {
          [CaseType.MARRIAGE]: { name: '离婚纠纷', category: 'civil' },
          [CaseType.TRAFFIC]: { name: '交通事故赔偿', category: 'civil' },
          [CaseType.LABOR]: { name: '劳动争议', category: 'civil' },
          [CaseType.DEBT]: { name: '债务追讨', category: 'civil' },
          [CaseType.OTHER]: { name: '民事纠纷', category: 'civil' },
        };
        const typeInfo = caseTypeMap[data.case_type] || { name: '民事纠纷', category: 'civil' };
        // 刑事案件判断（描述中包含刑事相关关键词）
        const isCriminal = data.description && (data.description.includes('刑事') || data.description.includes('故意伤害'));
        const caseCategory = isCriminal ? 'criminal' : typeInfo.category;
        // 对方当事人
        const opposingParties = ['李某', '王某', '某保险公司', '某科技公司', '赵某', '某房地产公司', '某医院', '某建设公司'];
        const opposingParty = opposingParties[i % opposingParties.length];
        // 案件名称
        const caseName = `${data.client_name}诉${opposingParty}${typeInfo.name}案`;
        // 客户类型（客户名包含"公司"为企业，否则为个人）
        const clientType = data.client_name.includes('公司') ? 'enterprise' : 'individual';
        // 对方代理人（部分案件有）
        const opposingAgents = ['王某律师', '张某律师', '李某律师', null, '赵某律师', null, '钱某律师', null];
        const opposingAgent = opposingAgents[i % opposingAgents.length];
        // 审判庭地点
        const courtRoom = data.court ? `${data.court}第三审判庭` : null;
        // 协助律师ID数组（JSON序列化）
        const assistantLawyerIds = JSON.stringify([lawyerUser2?.id, lawyerUser?.id].filter(Boolean));
        // 律师团队
        const teamList = ['团队A', '团队B', '团队C'];
        const teamId = teamList[i % teamList.length];
        // 案件来源
        const caseSources = ['线上咨询', '老客户介绍', '律所推广', '朋友推荐', '线上咨询'];
        const caseSource = caseSources[i % caseSources.length];
        // 质保金（1000-5000）
        const qualityDeposit = 1000 + (i * 350) % 4001;
        // 涉密标记（刑事案件或少数案件为true）
        const isConfidential = isCriminal || i % 7 === 0;
        // 案件阶段映射
        const stageMap: Record<string, string> = {
          [CaseStatus.PENDING_ASSIGN]: 'intake',
          [CaseStatus.FILING]: 'intake',
          [CaseStatus.EVIDENCE]: 'processing',
          [CaseStatus.PROCESSING]: 'processing',
          [CaseStatus.HEARING]: 'closing',
          [CaseStatus.CLOSED]: 'closed',
        };
        const stage = stageMap[data.status] || 'intake';

        const caseEntity = await this.caseRepository.save({
          ...data,
          case_name: caseName,
          case_category: caseCategory,
          client_type: clientType,
          opposing_party: opposingParty,
          opposing_agent: opposingAgent,
          court_room: courtRoom,
          assistant_lawyer_ids: assistantLawyerIds,
          team_id: teamId,
          case_source: caseSource,
          quality_deposit: qualityDeposit,
          contract_id: null,
          is_confidential: isConfidential,
          stage,
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

  private async seedPermissions() {
    const count = await this.permissionRepository.count();
    if (count > 0) return;

    const permissions = [
      // 系统管理
      { name: '查看用户列表', code: 'user:read', module: 'user', type: 'read', description: '查看用户管理页面和用户列表', sort_order: 1 },
      { name: '新增用户', code: 'user:create', module: 'user', type: 'create', description: '创建新用户', sort_order: 2 },
      { name: '编辑用户', code: 'user:update', module: 'user', type: 'update', description: '编辑用户信息', sort_order: 3 },
      { name: '删除用户', code: 'user:delete', module: 'user', type: 'delete', description: '删除用户', sort_order: 4 },
      { name: '查看角色列表', code: 'role:read', module: 'role', type: 'read', description: '查看角色管理页面和角色列表', sort_order: 5 },
      { name: '新增角色', code: 'role:create', module: 'role', type: 'create', description: '创建新角色', sort_order: 6 },
      { name: '编辑角色', code: 'role:update', module: 'role', type: 'update', description: '编辑角色信息和权限', sort_order: 7 },
      { name: '删除角色', code: 'role:delete', module: 'role', type: 'delete', description: '删除角色', sort_order: 8 },
      { name: '查看权限列表', code: 'permission:read', module: 'system', type: 'read', description: '查看权限管理页面和权限列表', sort_order: 9 },
      { name: '查看菜单列表', code: 'menu:read', module: 'menu', type: 'read', description: '查看菜单管理页面和菜单列表', sort_order: 10 },
      { name: '编辑菜单', code: 'menu:update', module: 'menu', type: 'update', description: '编辑菜单配置', sort_order: 11 },
      // 线索CRM
      { name: '查看线索列表', code: 'crm:lead:read', module: 'crm', type: 'read', description: '查看线索管理页面和线索列表', sort_order: 20 },
      { name: '新增线索', code: 'crm:lead:create', module: 'crm', type: 'create', description: '创建新线索', sort_order: 21 },
      { name: '编辑线索', code: 'crm:lead:update', module: 'crm', type: 'update', description: '编辑线索信息', sort_order: 22 },
      { name: '删除线索', code: 'crm:lead:delete', module: 'crm', type: 'delete', description: '删除线索', sort_order: 23 },
      { name: '分配线索', code: 'crm:lead:assign', module: 'crm', type: 'approve', description: '分配线索给销售人员', sort_order: 24 },
      { name: '查看邀约工作台', code: 'crm:invite:read', module: 'crm', type: 'read', description: '查看邀约工作台', sort_order: 25 },
      { name: '查看谈案工作台', code: 'crm:talk:read', module: 'crm', type: 'read', description: '查看谈案工作台', sort_order: 26 },
      // 案件办案
      { name: '查看案件列表', code: 'case:read', module: 'case', type: 'read', description: '查看案件管理页面和案件列表', sort_order: 30 },
      { name: '新增案件', code: 'case:create', module: 'case', type: 'create', description: '创建新案件', sort_order: 31 },
      { name: '编辑案件', code: 'case:update', module: 'case', type: 'update', description: '编辑案件信息', sort_order: 32 },
      { name: '删除案件', code: 'case:delete', module: 'case', type: 'delete', description: '删除案件', sort_order: 33 },
      { name: '查看案件预警', code: 'case:warning:read', module: 'case', type: 'read', description: '查看案件预警中心', sort_order: 34 },
      { name: '处理案件预警', code: 'case:warning:handle', module: 'case', type: 'update', description: '处理案件预警', sort_order: 35 },
      // 合规风控
      { name: '查看合规记录', code: 'compliance:read', module: 'compliance', type: 'read', description: '查看合规管理页面', sort_order: 40 },
      { name: '发起合规检查', code: 'compliance:check', module: 'compliance', type: 'create', description: '发起合规检查', sort_order: 41 },
      { name: '处理合规问题', code: 'compliance:handle', module: 'compliance', type: 'update', description: '处理合规问题', sort_order: 42 },
      // 财务分润
      { name: '查看财务数据', code: 'finance:read', module: 'finance', type: 'read', description: '查看财务管理页面和财务数据', sort_order: 50 },
      { name: '新增财务记录', code: 'finance:create', module: 'finance', type: 'create', description: '创建财务记录', sort_order: 51 },
      { name: '审核财务记录', code: 'finance:approve', module: 'finance', type: 'approve', description: '审核财务记录', sort_order: 52 },
      { name: '导出财务报表', code: 'finance:export', module: 'finance', type: 'export', description: '导出财务报表', sort_order: 53 },
      // 投放营销
      { name: '查看投放数据', code: 'marketing:read', module: 'marketing', type: 'read', description: '查看投放营销数据', sort_order: 60 },
      { name: '管理广告账户', code: 'marketing:account:manage', module: 'marketing', type: 'update', description: '管理广告账户', sort_order: 61 },
      { name: '创建投放计划', code: 'marketing:plan:create', module: 'marketing', type: 'create', description: '创建投放计划', sort_order: 62 },
      { name: '管理素材', code: 'marketing:material:manage', module: 'marketing', type: 'update', description: '管理营销素材', sort_order: 63 },
      // SCRM私域
      { name: '查看客户标签', code: 'scrm:tag:read', module: 'scrm', type: 'read', description: '查看客户标签', sort_order: 70 },
      { name: '管理客户标签', code: 'scrm:tag:manage', module: 'scrm', type: 'update', description: '管理客户标签', sort_order: 71 },
      { name: '发起私域触达', code: 'scrm:reach:create', module: 'scrm', type: 'create', description: '发起私域触达任务', sort_order: 72 },
      { name: '查看聊天存档', code: 'scrm:chat:read', module: 'scrm', type: 'read', description: '查看聊天存档', sort_order: 73 },
      // 数据看板
      { name: '查看经营总览', code: 'dashboard:overview', module: 'dashboard', type: 'read', description: '查看经营总览仪表盘', sort_order: 80 },
      { name: '查看销售绩效', code: 'dashboard:sales', module: 'dashboard', type: 'read', description: '查看销售绩效看板', sort_order: 81 },
      { name: '查看办案效能', code: 'dashboard:case', module: 'dashboard', type: 'read', description: '查看办案效能看板', sort_order: 82 },
      { name: '查看财务经营', code: 'dashboard:finance', module: 'dashboard', type: 'read', description: '查看财务经营看板', sort_order: 83 },
      { name: '查看合规风险', code: 'dashboard:compliance', module: 'dashboard', type: 'read', description: '查看合规风险看板', sort_order: 84 },
      { name: '导出报表', code: 'dashboard:export', module: 'dashboard', type: 'export', description: '导出数据报表', sort_order: 85 },
      // C端服务
      { name: '查看我的案件', code: 'client:case:read', module: 'client', type: 'read', description: '客户查看自己的案件', sort_order: 90 },
      { name: '发起投诉', code: 'client:complaint:create', module: 'client', type: 'create', description: '客户发起投诉', sort_order: 91 },
      { name: '提交服务评价', code: 'client:rating:create', module: 'client', type: 'create', description: '客户提交服务评价', sort_order: 92 },
      // 消息通知
      { name: '查看消息通知', code: 'notification:read', module: 'system', type: 'read', description: '查看消息通知', sort_order: 100 },
      { name: '发送系统通知', code: 'notification:send', module: 'system', type: 'create', description: '发送系统通知', sort_order: 101 },
    ];

    for (const perm of permissions) {
      const existing = await this.permissionRepository.findOne({ where: { code: perm.code } });
      if (!existing) {
        await this.permissionRepository.save(perm);
      }
    }
  }

  private async seedRoles(orgId: string) {
    const count = await this.roleRepository.count({ where: { organization_id: orgId } });
    if (count > 0) return;

    const allPermissions = await this.permissionRepository.find();
    const allPermCodes = allPermissions.map(p => p.code);

    const roles = [
      {
        name: '超级管理员',
        code: 'super_admin',
        description: '拥有系统所有功能的最高权限',
        permissions: allPermCodes,
        status: true,
      },
      {
        name: '律所管理员',
        code: 'org_admin',
        description: '管理律所内部用户、角色和配置',
        permissions: allPermCodes.filter(c => !c.startsWith('client:')),
        status: true,
      },
      {
        name: '投放专员',
        code: 'marketing',
        description: '负责广告投放和营销素材管理',
        permissions: [
          'marketing:read',
          'marketing:account:manage',
          'marketing:plan:create',
          'marketing:material:manage',
          'crm:lead:read',
          'crm:lead:create',
          'dashboard:overview',
          'notification:read',
        ],
        status: true,
      },
      {
        name: '谈案销售',
        code: 'sales',
        description: '负责线索跟进、邀约和谈案签约',
        permissions: [
          'crm:lead:read',
          'crm:lead:create',
          'crm:lead:update',
          'crm:invite:read',
          'crm:talk:read',
          'case:read',
          'case:create',
          'dashboard:sales',
          'notification:read',
        ],
        status: true,
      },
      {
        name: '办案律师',
        code: 'lawyer',
        description: '负责案件办理和出庭诉讼',
        permissions: [
          'case:read',
          'case:update',
          'case:warning:read',
          'case:warning:handle',
          'compliance:read',
          'dashboard:case',
          'notification:read',
        ],
        status: true,
      },
      {
        name: '律师助理',
        code: 'assistant',
        description: '协助律师处理案件相关事务',
        permissions: [
          'case:read',
          'case:warning:read',
          'compliance:read',
          'notification:read',
        ],
        status: true,
      },
      {
        name: '财务人员',
        code: 'finance',
        description: '负责财务核算、分润和报表',
        permissions: [
          'finance:read',
          'finance:create',
          'finance:approve',
          'finance:export',
          'case:read',
          'dashboard:finance',
          'notification:read',
        ],
        status: true,
      },
      {
        name: '客户',
        code: 'client',
        description: 'C端客户角色，仅限查看自己的案件和服务',
        permissions: [
          'client:case:read',
          'client:complaint:create',
          'client:rating:create',
          'notification:read',
        ],
        status: true,
      },
    ];

    for (const role of roles) {
      const existing = await this.roleRepository.findOne({
        where: { code: role.code, organization_id: orgId },
      });
      if (!existing) {
        await this.roleRepository.save({
          ...role,
          organization_id: orgId,
        });
      }
    }
  }

  private async seedMenus() {
    const count = await this.menuRepository.count();
    if (count > 0) return;

    const menus = [
      // 一级菜单
      { name: '数据看板', path: '/dashboard', icon: 'DashboardOutlined', sort_order: 1, is_visible: true, component: 'Dashboard' },
      { name: '线索CRM', path: '/crm', icon: 'TeamOutlined', sort_order: 2, is_visible: true, component: 'LeadManagement' },
      { name: '案件办案', path: '/case', icon: 'FileTextOutlined', sort_order: 3, is_visible: true, component: 'CaseManagement' },
      { name: '合规风控', path: '/compliance', icon: 'SecurityScanOutlined', sort_order: 4, is_visible: true, component: 'ComplianceManagement' },
      { name: '财务分润', path: '/finance', icon: 'DollarOutlined', sort_order: 5, is_visible: true, component: 'FinanceManagement' },
      { name: '投放营销', path: '/marketing', icon: 'NotificationOutlined', sort_order: 6, is_visible: true, component: 'AdAccountManagement' },
      { name: 'SCRM私域', path: '/scrm', icon: 'MessageOutlined', sort_order: 7, is_visible: true, component: 'LiveCodeManagement' },
      { name: '系统管理', path: '/system', icon: 'SettingOutlined', sort_order: 8, is_visible: true, component: 'UserManagement' },
    ];

    const savedMenus: Record<string, string> = {};
    for (const menu of menus) {
      const existing = await this.menuRepository.findOne({ where: { path: menu.path } });
      if (!existing) {
        const saved = await this.menuRepository.save(menu);
        savedMenus[menu.path] = saved.id;
      } else {
        savedMenus[menu.path] = existing.id;
      }
    }

    // 二级菜单
    const subMenus = [
      // 数据看板
      { name: '经营总览', path: '/', parent_path: '/dashboard', sort_order: 1, is_visible: true, component: 'Dashboard' },
      { name: '投放转化漏斗', path: '/dashboard/conversion-funnel', parent_path: '/dashboard', sort_order: 2, is_visible: true, component: 'ConversionFunnelDashboard' },
      { name: '销售团队绩效', path: '/dashboard/sales-performance', parent_path: '/dashboard', sort_order: 3, is_visible: true, component: 'SalesPerformanceDashboard' },
      { name: '办案效能分析', path: '/dashboard/case-efficiency', parent_path: '/dashboard', sort_order: 4, is_visible: true, component: 'CaseEfficiencyDashboard' },
      { name: '财务经营', path: '/dashboard/finance', parent_path: '/dashboard', sort_order: 5, is_visible: true, component: 'FinanceDashboard' },
      { name: '合规风险监控', path: '/dashboard/compliance-risk', parent_path: '/dashboard', sort_order: 6, is_visible: true, component: 'ComplianceRiskDashboard' },
      { name: '自定义报表', path: '/dashboard/custom-report', parent_path: '/dashboard', sort_order: 7, is_visible: true, component: 'CustomReport' },
      // 线索CRM
      { name: '线索管理', path: '/leads', parent_path: '/crm', sort_order: 1, is_visible: true, component: 'LeadManagement' },
      { name: '公海池', path: '/lead-pool', parent_path: '/crm', sort_order: 2, is_visible: true, component: 'LeadPool' },
      { name: '邀约工作台', path: '/invite-workbench', parent_path: '/crm', sort_order: 3, is_visible: true, component: 'InviteWorkbench' },
      { name: '谈案工作台', path: '/talk-workbench', parent_path: '/crm', sort_order: 4, is_visible: true, component: 'TalkWorkbench' },
      { name: '谈案SOP', path: '/talk-sop', parent_path: '/crm', sort_order: 5, is_visible: true, component: 'TalkSOPConfig' },
      // 案件办案
      { name: '案件管理', path: '/cases', parent_path: '/case', sort_order: 1, is_visible: true, component: 'CaseManagement' },
      { name: '办案SOP', path: '/case-sop', parent_path: '/case', sort_order: 2, is_visible: true, component: 'CaseSOPConfig' },
      { name: '案件预警', path: '/case-warning', parent_path: '/case', sort_order: 3, is_visible: true, component: 'CaseWarningCenter' },
      // 合规风控
      { name: '合规管理', path: '/compliance', parent_path: '/compliance', sort_order: 1, is_visible: true, component: 'ComplianceManagement' },
      { name: '合规风控中心', path: '/compliance-center', parent_path: '/compliance', sort_order: 2, is_visible: true, component: 'ComplianceCenter' },
      // 财务分润
      { name: '财务管理', path: '/finance', parent_path: '/finance', sort_order: 1, is_visible: true, component: 'FinanceManagement' },
      { name: '分润配置', path: '/commission-config', parent_path: '/finance', sort_order: 2, is_visible: true, component: 'CommissionConfig' },
      { name: '评价管理', path: '/service-ratings', parent_path: '/finance', sort_order: 3, is_visible: true, component: 'ServiceRatingManagement' },
      // 投放营销
      { name: '广告账户', path: '/marketing/ad-accounts', parent_path: '/marketing', sort_order: 1, is_visible: true, component: 'AdAccountManagement' },
      { name: '投放计划', path: '/marketing/ad-plans', parent_path: '/marketing', sort_order: 2, is_visible: true, component: 'AdPlanManagement' },
      { name: '转化归因', path: '/marketing/conversion', parent_path: '/marketing', sort_order: 3, is_visible: true, component: 'ConversionReport' },
      { name: '素材管理', path: '/marketing/materials', parent_path: '/marketing', sort_order: 4, is_visible: true, component: 'MaterialManagement' },
      { name: 'AI内容生成', path: '/marketing/ai-content', parent_path: '/marketing', sort_order: 5, is_visible: true, component: 'AIContentGenerator' },
      { name: '公域账号', path: '/marketing/social-accounts', parent_path: '/marketing', sort_order: 6, is_visible: true, component: 'SocialAccountMatrix' },
      // SCRM私域
      { name: '活码管理', path: '/scrm/live-codes', parent_path: '/scrm', sort_order: 1, is_visible: true, component: 'LiveCodeManagement' },
      { name: '渠道追踪', path: '/scrm/channels', parent_path: '/scrm', sort_order: 2, is_visible: true, component: 'ChannelTracking' },
      { name: '客户标签', path: '/scrm/tags', parent_path: '/scrm', sort_order: 3, is_visible: true, component: 'ClientTagManagement' },
      { name: '企微侧边栏', path: '/scrm/sidebar', parent_path: '/scrm', sort_order: 4, is_visible: true, component: 'ScrmSidebar' },
      { name: '私域触达', path: '/scrm/reach', parent_path: '/scrm', sort_order: 5, is_visible: true, component: 'ReachTool' },
      { name: '聊天存档', path: '/scrm/chat-archives', parent_path: '/scrm', sort_order: 6, is_visible: true, component: 'ChatArchiveManagement' },
      // 系统管理
      { name: '用户管理', path: '/users', parent_path: '/system', sort_order: 1, is_visible: true, component: 'UserManagement' },
      { name: '角色管理', path: '/roles', parent_path: '/system', sort_order: 2, is_visible: true, component: 'RoleManagement' },
      { name: '权限管理', path: '/permissions', parent_path: '/system', sort_order: 3, is_visible: true, component: 'PermissionManagement' },
      { name: '菜单管理', path: '/menus', parent_path: '/system', sort_order: 4, is_visible: true, component: 'MenuManagement' },
      { name: '消息通知', path: '/notifications', parent_path: '/system', sort_order: 5, is_visible: true, component: 'NotificationList' },
      { name: 'AI工具', path: '/ai-tools', parent_path: '/system', sort_order: 6, is_visible: true, component: 'AITools' },
    ];

    for (const sub of subMenus) {
      const existing = await this.menuRepository.findOne({ where: { path: sub.path } });
      if (!existing) {
        const parentId = savedMenus[sub.parent_path];
        await this.menuRepository.save({
          name: sub.name,
          path: sub.path,
          parent_id: parentId,
          sort_order: sub.sort_order,
          is_visible: sub.is_visible,
          component: sub.component,
        });
      }
    }
  }

  private async seedNotifications(userMap: Record<string, User>) {
    const adminUser = userMap['13800138001'];
    const salesUser = userMap['13800138003'];
    const lawyerUser = userMap['13800138004'];
    const marketingUser = userMap['13800138002'];

    if (!adminUser) return;

    const count = await this.notificationRepository.count({ where: { receiver_id: adminUser.id } });
    if (count > 0) return;

    const notifications = [
      // 管理员通知
      {
        title: '系统部署完成',
        content: '法智汇系统已成功部署，请登录并开始使用。',
        type: 'system',
        level: 'high',
        receiver_id: adminUser.id,
        is_read: true,
        related_type: 'system',
      },
      {
        title: '新用户注册提醒',
        content: '有 3 个新用户注册等待审核。',
        type: 'system',
        level: 'normal',
        receiver_id: adminUser.id,
        is_read: false,
        related_type: 'user',
      },
      {
        title: '月度经营报表已生成',
        content: '2026年6月经营报表已生成，点击查看详情。',
        type: 'system',
        level: 'high',
        receiver_id: adminUser.id,
        is_read: false,
        related_type: 'report',
      },
      {
        title: '广告账户余额不足',
        content: '抖音广告账户余额已不足1000元，请及时充值。',
        type: 'warning',
        level: 'urgent',
        receiver_id: adminUser.id,
        is_read: false,
        related_type: 'ad_account',
      },
      {
        title: '新案件待分配',
        content: '有 2 个新创建的案件待分配律师。',
        type: 'case',
        level: 'high',
        receiver_id: adminUser.id,
        is_read: true,
        related_type: 'case',
      },
      {
        title: '合规检查发现问题',
        content: '营销内容合规检查发现 5 条待整改内容。',
        type: 'warning',
        level: 'high',
        receiver_id: adminUser.id,
        is_read: false,
        related_type: 'compliance',
      },
      {
        title: '系统维护通知',
        content: '系统将于本周六凌晨2点-4点进行例行维护，期间服务可能短暂中断。',
        type: 'system',
        level: 'normal',
        receiver_id: adminUser.id,
        is_read: true,
        related_type: 'system',
      },
      {
        title: '财务审批待处理',
        content: '有 3 笔费用报销待您审批。',
        type: 'approval',
        level: 'high',
        receiver_id: adminUser.id,
        is_read: false,
        related_type: 'finance',
      },
      // 销售通知
      {
        title: '新线索分配',
        content: '您有 5 条新线索待跟进，请及时处理。',
        type: 'system',
        level: 'high',
        receiver_id: salesUser?.id,
        is_read: false,
        related_type: 'lead',
      },
      {
        title: '邀约任务提醒',
        content: '今日有 3 个邀约需要确认到所情况。',
        type: 'task',
        level: 'normal',
        receiver_id: salesUser?.id,
        is_read: false,
        related_type: 'invite',
      },
      {
        title: '客户投诉提醒',
        content: '您负责的客户提交了一条投诉，请关注处理。',
        type: 'warning',
        level: 'urgent',
        receiver_id: salesUser?.id,
        is_read: false,
        related_type: 'complaint',
      },
      {
        title: '签约成功通知',
        content: '恭喜！您的客户张女士已完成签约。',
        type: 'system',
        level: 'high',
        receiver_id: salesUser?.id,
        is_read: true,
        related_type: 'contract',
      },
      // 律师通知
      {
        title: '新案件分配',
        content: '您有 2 个新分配的案件，请查看案件详情。',
        type: 'case',
        level: 'high',
        receiver_id: lawyerUser?.id,
        is_read: false,
        related_type: 'case',
      },
      {
        title: '案件预警提醒',
        content: '您负责的案件中有 3 条预警待处理。',
        type: 'warning',
        level: 'urgent',
        receiver_id: lawyerUser?.id,
        is_read: false,
        related_type: 'case_warning',
      },
      {
        title: '开庭提醒',
        content: '明天上午10点有交通事故案开庭，请做好准备。',
        type: 'task',
        level: 'urgent',
        receiver_id: lawyerUser?.id,
        is_read: false,
        related_type: 'hearing',
      },
      {
        title: '客户提交新证据',
        content: '您的客户提交了新的证据材料，请查收。',
        type: 'case',
        level: 'normal',
        receiver_id: lawyerUser?.id,
        is_read: true,
        related_type: 'evidence',
      },
      {
        title: '合规检查通过',
        content: '您提交的案件文书合规检查已通过。',
        type: 'system',
        level: 'normal',
        receiver_id: lawyerUser?.id,
        is_read: true,
        related_type: 'compliance',
      },
      // 投放专员通知
      {
        title: '投放计划已启动',
        content: '您创建的"离婚律师推广"计划已开始投放。',
        type: 'system',
        level: 'normal',
        receiver_id: marketingUser?.id,
        is_read: true,
        related_type: 'ad_plan',
      },
      {
        title: '素材审核通过',
        content: '您上传的 5 条素材已通过合规审核。',
        type: 'system',
        level: 'normal',
        receiver_id: marketingUser?.id,
        is_read: true,
        related_type: 'material',
      },
      {
        title: '消耗超标提醒',
        content: '抖音投放账户今日消耗已超过日预算的80%。',
        type: 'warning',
        level: 'high',
        receiver_id: marketingUser?.id,
        is_read: false,
        related_type: 'budget',
      },
    ];

    for (const notif of notifications) {
      if (!notif.receiver_id) continue;
      await this.notificationRepository.save(notif);
    }
  }

  // ============ Phase 5 种子数据 ============

  // 数字人直播种子数据
  private async seedDigitalHumanLives(orgId: string, userMap: Record<string, User>) {
    const marketingUser = userMap['13800138002'];

    const liveData = [
      {
        title: '婚姻家事法律专场直播',
        anchor_name: 'AI律师小法',
        status: DigitalHumanLiveStatus.DRAFT,
        scheduled_start: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        duration: 90,
        viewer_count: 0,
        like_count: 0,
        organization_id: orgId,
        created_by: marketingUser?.id,
        script_content: '',
        cover_url: '',
        live_url: '',
        case_type: '',
      },
      {
        title: '交通事故赔偿实战直播',
        anchor_name: 'AI律师小律',
        status: DigitalHumanLiveStatus.LIVE,
        scheduled_start: new Date(Date.now() - 1 * 60 * 60 * 1000),
        actual_start: new Date(Date.now() - 30 * 60 * 1000),
        duration: 120,
        viewer_count: 356,
        like_count: 128,
        organization_id: orgId,
        created_by: marketingUser?.id,
        script_content: '',
        cover_url: '',
        live_url: '',
        case_type: '',
      },
      {
        title: '劳动仲裁维权直播回放',
        anchor_name: 'AI律师小师',
        status: DigitalHumanLiveStatus.ENDED,
        scheduled_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        actual_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        actual_end: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
        duration: 90,
        viewer_count: 520,
        like_count: 230,
        organization_id: orgId,
        created_by: marketingUser?.id,
        script_content: '',
        cover_url: '',
        live_url: '',
        case_type: '',
      },
    ];

    for (const data of liveData) {
      const existing = await this.digitalHumanLiveRepository.findOne({ where: { title: data.title, organization_id: orgId } });
      if (!existing) {
        await this.digitalHumanLiveRepository.save(data as any);
      }
    }
  }

  // AI文书模板种子数据
  private async seedLegalDocuments(orgId: string, userMap: Record<string, User>) {
    const lawyerUser = userMap['13800138004'];

    const docData = [
      {
        template_name: '离婚起诉状',
        case_type: '婚姻',
        document_type: 'complaint',
        content_template: '原告：____，男/女，____年__月__日出生，民族____，身份证号码____，住址____，联系电话____。\n被告：____，男/女，____年__月__日出生，民族____，身份证号码____，住址____，联系电话____。\n\n诉讼请求：\n1. 请求判令原被告离婚；\n2. 请求判令婚生子/女____由原告抚养，被告每月支付抚养费____元；\n3. 请求判令依法分割夫妻共同财产；\n4. 请求判令被告承担本案诉讼费用。\n\n事实与理由：\n____年__月__日，原被告登记结婚，婚后生育一子/女____。婚后初期夫妻感情尚可，后因____导致夫妻感情破裂，已无和好可能。为维护原告合法权益，特向贵院提起诉讼，恳请依法判决。\n\n此致\n____人民法院\n\n具状人：____\n____年__月__日',
        variables: JSON.stringify(['原告信息', '被告信息', '婚生子女信息', '财产信息', '离婚原因']),
        is_system: true,
        status: 'active',
        organization_id: orgId,
        created_by: lawyerUser?.id,
      },
      {
        template_name: '交通事故赔偿起诉状',
        case_type: '交通',
        document_type: 'complaint',
        content_template: '原告：____，男/女，____年__月__日出生，民族____，身份证号码____，住址____，联系电话____。\n被告：____，男/女，____年__月__日出生，民族____，身份证号码____，住址____，联系电话____。\n第三人：____保险公司\n\n诉讼请求：\n1. 请求判令被告赔偿原告医疗费____元、误工费____元、护理费____元、交通费____元、住院伙食补助费____元、营养费____元、残疾赔偿金____元、精神损害抚慰金____元，共计____元；\n2. 请求判令第三人在保险责任范围内承担连带赔偿责任；\n3. 请求判令被告承担本案诉讼费用。\n\n事实与理由：\n____年__月__日，原告在____路段发生交通事故，造成原告受伤。经交警认定，被告负事故全部责任。原告受伤后被送往____医院救治，经诊断为____。____司法鉴定所鉴定原告伤残等级为____级。就赔偿事宜协商未果，特向贵院提起诉讼。\n\n此致\n____人民法院\n\n具状人：____\n____年__月__日',
        variables: JSON.stringify(['原告信息', '被告信息', '事故信息', '伤情信息', '赔偿金额']),
        is_system: true,
        status: 'active',
        organization_id: orgId,
        created_by: lawyerUser?.id,
      },
      {
        template_name: '劳动仲裁申请书',
        case_type: '劳动',
        document_type: 'application',
        content_template: '申请人：____，男/女，____年__月__日出生，民族____，身份证号码____，住址____，联系电话____。\n被申请人：____公司，住所地____，法定代表人____，联系电话____。\n\n仲裁请求：\n1. 请求裁令被申请人支付申请人____年__月__日至____年__月__日期间拖欠的工资____元；\n2. 请求裁令被申请人支付申请人违法解除劳动合同赔偿金____元；\n3. 请求裁令被申请人支付申请人未签订书面劳动合同双倍工资差额____元；\n4. 请求裁令被申请人为申请人补缴____年__月至____年__月期间的社会保险；\n\n事实与理由：\n申请人于____年__月__日入职被申请人处，担任____岗位，月工资____元。工作期间，被申请人存在____违法行为，侵害了申请人的合法权益。为维护申请人合法权益，特向贵委申请仲裁。\n\n此致\n____劳动人事争议仲裁委员会\n\n申请人：____\n____年__月__日',
        variables: JSON.stringify(['申请人信息', '被申请人信息', '工资信息', '在职时间', '违法事实']),
        is_system: true,
        status: 'active',
        organization_id: orgId,
        created_by: lawyerUser?.id,
      },
      {
        template_name: '借款合同纠纷起诉状',
        case_type: '债务',
        document_type: 'complaint',
        content_template: '原告：____，男/女，____年__月__日出生，民族____，身份证号码____，住址____，联系电话____。\n被告：____，男/女，____年__月__日出生，民族____，身份证号码____，住址____，联系电话____。\n\n诉讼请求：\n1. 请求判令被告偿还原告借款本金____元及利息____元（利息暂计算至____年__月__日，此后按____标准计算至实际清偿之日止）；\n2. 请求判令被告承担本案诉讼费用。\n\n事实与理由：\n____年__月__日，被告因____需要向原告借款____元，约定借款期限为____，利息为____。原告通过____方式向被告交付了借款。借款到期后，经原告多次催讨，被告至今未归还。为维护原告合法权益，特向贵院提起诉讼。\n\n此致\n____人民法院\n\n具状人：____\n____年__月__日',
        variables: JSON.stringify(['原告信息', '被告信息', '借款金额', '借款时间', '利息约定']),
        is_system: true,
        status: 'active',
        organization_id: orgId,
        created_by: lawyerUser?.id,
      },
      {
        template_name: '刑事辩护委托书',
        case_type: '刑事',
        document_type: 'power_of_attorney',
        content_template: '委托人：____，男/女，____年__月__日出生，民族____，身份证号码____，住址____。\n受托人：____律师，执业证号____，执业机构____律师事务所。\n\n委托事项：\n委托人因涉嫌____罪，现委托受托人作为委托人在____阶段的辩护律师。\n\n代理权限：\n1. 会见犯罪嫌疑人/被告人；\n2. 查阅、摘抄、复制本案材料；\n3. 收集、调取有关证据；\n4. 出庭辩护；\n5. 代为提出上诉；\n6. 代为申请取保候审；\n7. 其他与本案辩护相关的事项。\n\n委托期限：自本委托书签署之日起至本案____阶段终结止。\n\n委托人：____\n受托人：____\n____年__月__日',
        variables: JSON.stringify(['委托人信息', '受托人信息', '涉嫌罪名', '案件阶段', '代理权限']),
        is_system: true,
        status: 'active',
        organization_id: orgId,
        created_by: lawyerUser?.id,
      },
      {
        template_name: '民事委托代理合同',
        case_type: '合同',
        document_type: 'contract',
        content_template: '甲方（委托人）：____，身份证号码____，住址____，联系电话____。\n乙方（受托人）：____律师事务所，地址____，联系电话____。\n\n根据《中华人民共和国民法典》及相关法律法规的规定，甲乙双方经平等协商，就甲方委托乙方代理民事案件事宜达成如下协议：\n\n一、委托事项\n甲方委托乙方作为甲方与____之间____纠纷一案的代理人。\n\n二、代理权限\n1. 代为承认、变更、放弃诉讼请求；\n2. 代为进行和解、调解；\n3. 代为提起上诉；\n4. 代为签收法律文书；\n5. 代为申请执行；\n6. 其他特别授权事项。\n\n三、律师费\n1. 甲方同意向乙方支付律师费人民币____元；\n2. 上述费用不包括办理本案所需的差旅费、诉讼费、鉴定费等实际支出的费用；\n3. 付款方式：____。\n\n四、双方权利义务\n1. 甲方应如实向乙方陈述案件事实，提供必要的证据材料；\n2. 甲方应按约定及时支付律师费；\n3. 乙方应勤勉尽责地代理甲方处理委托事项；\n4. 乙方应及时向甲方通报案件进展。\n\n五、违约责任\n1. 因甲方原因导致委托事项无法完成的，乙方已收取的律师费不予退还；\n2. 因乙方过错给甲方造成损失的，乙方应承担相应赔偿责任。\n\n六、其他约定\n本合同一式两份，甲乙双方各执一份，自双方签字盖章之日起生效。\n\n甲方（签字）：____\n乙方（盖章）：____\n____年__月__日',
        variables: JSON.stringify(['甲方信息', '乙方信息', '案件信息', '律师费', '代理权限']),
        is_system: true,
        status: 'active',
        organization_id: orgId,
        created_by: lawyerUser?.id,
      },
      {
        template_name: '房屋买卖合同纠纷起诉状',
        case_type: '房产',
        document_type: 'complaint',
        content_template: '原告：____，男/女，____年__月__日出生，民族____，身份证号码____，住址____，联系电话____。\n被告：____，男/女，____年__月__日出生，民族____，身份证号码____，住址____，联系电话____。\n\n诉讼请求：\n1. 请求判令被告继续履行房屋买卖合同，配合原告办理房屋过户手续；\n2. 请求判令被告支付违约金____元；\n3. 请求判令被告承担本案诉讼费用。\n\n事实与理由：\n____年__月__日，原被告签订房屋买卖合同，约定被告将位于____的房屋出售给原告，总价____元。原告已按约定支付了____房款，但被告至今未配合办理过户手续。经原告多次催告，被告仍不履行合同义务。为维护原告合法权益，特向贵院提起诉讼。\n\n此致\n____人民法院\n\n具状人：____\n____年__月__日',
        variables: JSON.stringify(['原告信息', '被告信息', '房屋信息', '合同信息', '违约情况']),
        is_system: true,
        status: 'active',
        organization_id: orgId,
        created_by: lawyerUser?.id,
      },
      {
        template_name: '知识产权侵权起诉状',
        case_type: '知识产权',
        document_type: 'complaint',
        content_template: '原告：____，住所地____，法定代表人____，联系电话____。\n被告：____，住所地____，法定代表人____，联系电话____。\n\n诉讼请求：\n1. 请求判令被告立即停止侵犯原告____（商标/专利/著作权）的行为；\n2. 请求判令被告赔偿原告经济损失____元及合理维权费用____元；\n3. 请求判令被告在____媒体上刊登声明消除影响；\n4. 请求判令被告承担本案诉讼费用。\n\n事实与理由：\n原告系____（知识产权类型）的权利人，依法享有____权。____年__月__日，原告发现被告未经原告许可，擅自使用原告的____，侵犯了原告的合法权益。原告已通过公证方式固定了被告的侵权行为证据。为维护原告合法权益，特向贵院提起诉讼。\n\n此致\n____人民法院\n\n具状人：____\n____年__月__日',
        variables: JSON.stringify(['原告信息', '被告信息', '知识产权信息', '侵权行为', '赔偿金额']),
        is_system: true,
        status: 'active',
        organization_id: orgId,
        created_by: lawyerUser?.id,
      },
    ];

    for (const data of docData) {
      const existing = await this.legalDocumentRepository.findOne({ where: { template_name: data.template_name, organization_id: orgId } });
      if (!existing) {
        await this.legalDocumentRepository.save(data as any);
      }
    }
  }

  // 云归档种子数据
  private async seedClientArchives(orgId: string, userMap: Record<string, User>) {
    const lawyerUser = userMap['13800138004'];
    const assistantUser = userMap['13800138005'];
    const cases = await this.caseRepository.find({ where: { organization_id: orgId }, take: 10 });
    if (cases.length === 0) return;

    const archiveConfigs = [
      {
        file_name: '离婚协议草稿.pdf',
        file_type: 'contract',
        file_url: '/archives/divorce-agreement-draft.pdf',
        file_size: 256000,
        description: '离婚协议初稿，待客户确认',
      },
      {
        file_name: '结婚证扫描件.pdf',
        file_type: 'evidence',
        file_url: '/archives/marriage-cert-scan.pdf',
        file_size: 128000,
        description: '客户提交的结婚证扫描件',
      },
      {
        file_name: '收款发票.pdf',
        file_type: 'invoice',
        file_url: '/archives/payment-invoice.pdf',
        file_size: 64000,
        description: '律师费收款发票',
      },
      {
        file_name: '律师函.pdf',
        file_type: 'correspondence',
        file_url: '/archives/lawyer-letter.pdf',
        file_size: 35840,
        description: '向对方发送的律师催款函',
      },
      {
        file_name: '交通事故认定书.pdf',
        file_type: 'evidence',
        file_url: '/archives/traffic-accident-report.pdf',
        file_size: 153600,
        description: '交警出具的事故责任认定书',
      },
      {
        file_name: '伤残鉴定报告.pdf',
        file_type: 'evidence',
        file_url: '/archives/disability-report.pdf',
        file_size: 512000,
        description: '司法鉴定机构出具的伤残鉴定报告',
      },
      {
        file_name: '劳动合同.pdf',
        file_type: 'contract',
        file_url: '/archives/labor-contract.pdf',
        file_size: 204800,
        description: '客户与公司签订的劳动合同',
      },
      {
        file_name: '工资流水.pdf',
        file_type: 'evidence',
        file_url: '/archives/salary-records.pdf',
        file_size: 307200,
        description: '近12个月银行工资流水',
      },
      {
        file_name: '借条扫描件.pdf',
        file_type: 'evidence',
        file_url: '/archives/iou-scan.pdf',
        file_size: 102400,
        description: '借款50万元的借条原件扫描',
      },
      {
        file_name: '还款计划函.pdf',
        file_type: 'correspondence',
        file_url: '/archives/repayment-plan-letter.pdf',
        file_size: 51200,
        description: '向债务人发送的还款计划函',
      },
    ];

    for (let i = 0; i < archiveConfigs.length; i++) {
      const config = archiveConfigs[i];
      const caseEntity = cases[i % cases.length];
      const uploader = i % 2 === 0 ? lawyerUser : assistantUser;
      const existing = await this.clientArchiveRepository.findOne({
        where: { case_id: caseEntity.id, file_name: config.file_name },
      });
      if (!existing) {
        await this.clientArchiveRepository.save({
          ...config,
          case_id: caseEntity.id,
          client_id: caseEntity.client_id || caseEntity.client_name || uploader?.id || orgId,
          archived_by: uploader?.id,
          archived_at: new Date(),
          organization_id: orgId,
        } as any);
      }
    }
  }

  // 智能对账种子数据
  private async seedReconciliations(orgId: string, userMap: Record<string, User>) {
    const financeUser = userMap['13800138006'];

    const reconciliationData = [
      {
        reconciliation_no: 'REC-2026-001',
        period_start: new Date('2026-06-01'),
        period_end: new Date('2026-06-30'),
        total_receivable: 50000,
        total_received: 50000,
        total_overdue: 0,
        status: ReconciliationStatus.CONFIRMED,
        organization_id: orgId,
        created_by: financeUser?.id,
        match_count: 1,
        mismatch_count: 0,
      },
      {
        reconciliation_no: 'REC-2026-002',
        period_start: new Date('2026-07-01'),
        period_end: new Date('2026-07-31'),
        total_receivable: 30000,
        total_received: 15000,
        total_overdue: 15000,
        status: ReconciliationStatus.DRAFT,
        organization_id: orgId,
        created_by: financeUser?.id,
        match_count: 0,
        mismatch_count: 1,
      },
    ];

    for (const data of reconciliationData) {
      const existing = await this.reconciliationRepository.findOne({
        where: { reconciliation_no: data.reconciliation_no },
      });
      if (!existing) {
        await this.reconciliationRepository.save(data as any);
      }
    }
  }

  // 系统部署配置种子数据
  private async seedDeploymentConfigs(orgId: string) {
    const configData = [
      {
        config_name: '生产环境部署',
        server_type: 'cluster' as const,
        server_host: '10.0.0.1',
        server_port: 8080,
        db_type: 'mysql',
        db_host: '10.0.0.10',
        db_name: 'fazhihui_prod',
        db_user: 'fazhihui',
        cache_type: 'redis',
        cache_host: '10.0.0.11:6379',
        config_status: 'active' as const,
        organization_id: orgId,
      },
      {
        config_name: '测试环境部署',
        server_type: 'single' as const,
        server_host: 'test.fazhihui.com',
        server_port: 8080,
        db_type: 'mysql',
        db_host: 'test-db.fazhihui.com',
        db_name: 'fazhihui_test',
        db_user: 'fazhihui_test',
        cache_type: 'redis',
        cache_host: 'test-redis.fazhihui.com:6379',
        config_status: 'inactive' as const,
        organization_id: orgId,
      },
    ];

    for (const data of configData) {
      const existing = await this.deploymentConfigRepository.findOne({
        where: { config_name: data.config_name, organization_id: data.organization_id },
      });
      if (!existing) {
        await this.deploymentConfigRepository.save(data as any);
      }
    }
  }

  // 品牌定制配置种子数据
  private async seedBrandConfigs(orgId: string) {
    const brandData = [
      {
        brand_name: '法智汇',
        logo_url: '/brands/default-logo.png',
        favicon_url: '/brands/default-favicon.ico',
        primary_color: '#1890FF',
        secondary_color: '#52C41A',
        theme_type: 'light' as const,
        copyright_text: 'Copyright 2026 法智汇. All Rights Reserved.',
        icp_number: '京ICP备2026000000号',
        status: 'active' as const,
        organization_id: orgId,
      },
    ];

    for (const data of brandData) {
      const existing = await this.brandConfigRepository.findOne({
        where: { organization_id: data.organization_id },
      });
      if (!existing) {
        await this.brandConfigRepository.save(data as any);
      }
    }
  }

  // 第三方对接配置种子数据
  private async seedIntegrations(orgId: string) {
    const integrationData = [
      {
        integration_name: '微信公众号',
        integration_type: 'wechat' as const,
        app_id: 'wx_demo_app_id',
        app_secret: 'wx_demo_app_secret',
        api_url: 'https://api.weixin.qq.com',
        webhook_url: 'https://api.fazhihui.com/wechat/callback',
        config: JSON.stringify({
          token: 'wx_demo_token',
          encoding_aes_key: 'wx_demo_encoding_aes_key',
        }),
        status: 'active' as const,
        organization_id: orgId,
      },
      {
        integration_name: '企业微信',
        integration_type: 'wework' as const,
        app_id: 'ww_demo_corp_id',
        app_secret: 'ww_demo_secret',
        api_url: 'https://work.weixin.qq.com',
        webhook_url: 'https://api.fazhihui.com/wework/callback',
        config: JSON.stringify({
          agent_id: 'ww_demo_agent_id',
          token: 'ww_demo_token',
        }),
        status: 'active' as const,
        organization_id: orgId,
      },
      {
        integration_name: '支付宝',
        integration_type: 'alipay' as const,
        app_id: '2026000000000001',
        app_secret: 'alipay_demo_private_key',
        api_url: 'https://openapi.alipaydev.com',
        webhook_url: 'https://api.fazhihui.com/alipay/notify',
        config: JSON.stringify({
          public_key: 'alipay_demo_public_key',
          gateway_url: 'https://openapi.alipaydev.com/gateway.do',
        }),
        status: 'active' as const,
        organization_id: orgId,
      },
    ];

    for (const data of integrationData) {
      const existing = await this.integrationRepository.findOne({
        where: { integration_type: data.integration_type, organization_id: data.organization_id } as any,
      });
      if (!existing) {
        await this.integrationRepository.save(data as any);
      }
    }
  }

  // ============== kinglex 模块种子数据 ==============

  // 用印管理种子数据
  private async seedSeals(orgId: string, userMap: Record<string, User>) {
    // 检查印章表是否已有数据
    const existingSealCount = await this.sealRepository.count({ where: { organization_id: orgId } });
    if (existingSealCount > 0) return;

    const orgAdmin = userMap['13800138001'];
    const lawyerUser = userMap['13800138004'];
    const lawyerUser2 = userMap['13800138008'];
    const salesUser = userMap['13800138003'];
    const assistantUser = userMap['13800138005'];
    const cases = await this.caseRepository.find({ where: { organization_id: orgId }, take: 10 });

    // 5个印章：公章、财务章、合同章、法人章、发票章
    const sealConfigs = [
      { name: '律所公章', type: 'official', status: 'active', manager_id: orgAdmin?.id, is_electronic: true, support_watermark: true, support_paging_seal: true },
      { name: '财务专用章', type: 'financial', status: 'active', manager_id: orgAdmin?.id, is_electronic: false, support_watermark: false, support_paging_seal: false },
      { name: '合同专用章', type: 'contract', status: 'active', manager_id: orgAdmin?.id, is_electronic: true, support_watermark: true, support_paging_seal: true },
      { name: '法人章', type: 'personal', status: 'active', manager_id: orgAdmin?.id, is_electronic: false, support_watermark: false, support_paging_seal: false },
      { name: '发票专用章', type: 'invoice', status: 'active', manager_id: orgAdmin?.id, is_electronic: true, support_watermark: false, support_paging_seal: false },
    ];

    const savedSeals: Seal[] = [];
    for (const config of sealConfigs) {
      const seal = await this.sealRepository.save({
        ...config,
        organization_id: orgId,
      });
      savedSeals.push(seal);
    }

    // 10条用印申请（不同状态：pending/approved/rejected/used）
    const applicantUsers = [lawyerUser, lawyerUser2, salesUser, assistantUser, orgAdmin];
    const applicationConfigs = [
      { document_name: '授权委托书', purpose: '案件立案授权委托书盖章', usage_count: 1, status: 'pending', apply_offset: -1, approve_offset: null, approver_index: null, approve_comment: null },
      { document_name: '律师函', purpose: '发送律师函催告对方当事人', usage_count: 2, status: 'approved', apply_offset: -3, approve_offset: -2, approver_index: 0, approve_comment: '同意用印' },
      { document_name: '起诉状', purpose: '民事起诉状盖章提交法院', usage_count: 1, status: 'used', apply_offset: -7, approve_offset: -6, approver_index: 0, approve_comment: '同意用印' },
      { document_name: '代理合同', purpose: '委托代理合同盖章', usage_count: 1, status: 'used', apply_offset: -10, approve_offset: -9, approver_index: 0, approve_comment: '同意用印' },
      { document_name: '调查函', purpose: '律师调查取证函件', usage_count: 1, status: 'approved', apply_offset: -2, approve_offset: -1, approver_index: 0, approve_comment: '同意用印' },
      { document_name: '收入证明', purpose: '客户收入证明盖章', usage_count: 1, status: 'rejected', apply_offset: -4, approve_offset: -3, approver_index: 0, approve_comment: '材料不全，请补充后重新申请' },
      { document_name: '和解协议', purpose: '案件和解协议盖章', usage_count: 3, status: 'used', apply_offset: -15, approve_offset: -14, approver_index: 0, approve_comment: '同意用印' },
      { document_name: '证据目录', purpose: '证据材料目录盖章', usage_count: 1, status: 'pending', apply_offset: -1, approve_offset: null, approver_index: null, approve_comment: null },
      { document_name: '撤诉申请', purpose: '撤回起诉申请书盖章', usage_count: 1, status: 'approved', apply_offset: -5, approve_offset: -4, approver_index: 0, approve_comment: '同意用印' },
      { document_name: '执行申请', purpose: '强制执行申请书盖章', usage_count: 1, status: 'used', apply_offset: -20, approve_offset: -19, approver_index: 0, approve_comment: '同意用印' },
    ];

    const savedApplications: SealApplication[] = [];
    for (let i = 0; i < applicationConfigs.length; i++) {
      const config = applicationConfigs[i];
      const applicant = applicantUsers[i % applicantUsers.length];
      const seal = savedSeals[i % savedSeals.length];
      const caseEntity = cases.length > 0 ? cases[i % cases.length] : null;
      const approver = config.approver_index !== null ? applicantUsers[config.approver_index] : null;

      const application = await this.sealApplicationRepository.save({
        applicant_id: applicant?.id,
        case_id: caseEntity?.id,
        seal_id: seal.id,
        document_name: config.document_name,
        purpose: config.purpose,
        usage_count: config.usage_count,
        status: config.status,
        apply_time: new Date(Date.now() + config.apply_offset * 24 * 60 * 60 * 1000),
        approve_time: config.approve_offset !== null ? new Date(Date.now() + config.approve_offset * 24 * 60 * 60 * 1000) : null,
        approver_id: approver?.id,
        approve_comment: config.approve_comment,
        is_confidential: i % 5 === 0,
        seal_type: ['normal', 'watermark', 'paging'][i % 3],
        organization_id: orgId,
      });
      savedApplications.push(application);
    }

    // 为 approved 和 used 状态的申请创建盖章记录
    for (const app of savedApplications) {
      if (app.status === 'approved' || app.status === 'used') {
        await this.sealRecordRepository.save({
          application_id: app.id,
          seal_id: app.seal_id,
          operator_id: app.approver_id || orgAdmin?.id,
          document_name: app.document_name,
          usage_count: app.usage_count,
          seal_time: app.status === 'used' ? new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) : new Date(),
          organization_id: orgId,
        });
      }
    }
  }

  // 合同种子数据
  private async seedContracts(orgId: string, userMap: Record<string, User>) {
    // 检查合同表是否已有数据
    const existingContractCount = await this.contractRepository.count({ where: { organization_id: orgId } });
    if (existingContractCount > 0) return;

    const cases = await this.caseRepository.find({ where: { organization_id: orgId }, take: 15 });
    if (cases.length === 0) return;

    const orgAdmin = userMap['13800138001'];
    // 合同阶段：drafting起草 / reviewing审查 / signed已签 / performing履行 / completed完成 / terminated解约 / voided作废
    const contractConfigs = [
      { title: '婚姻纠纷委托代理合同', type: 'entrust', client_name: '张女士', client_phone: '13900139001', amount: 50000, stage: 'performing', sign_offset: -30, start_offset: -30, end_offset: 60, remarks: '财产分割与子女抚养权' },
      { title: '交通事故赔偿代理合同', type: 'entrust', client_name: '李先生', client_phone: '13900139002', amount: 30000, stage: 'completed', sign_offset: -90, start_offset: -90, end_offset: -10, remarks: '已完成理赔' },
      { title: '劳动仲裁委托合同', type: 'entrust', client_name: '王先生', client_phone: '13900139003', amount: 15000, stage: 'signed', sign_offset: -7, start_offset: -7, end_offset: 90, remarks: '仲裁程序进行中' },
      { title: '债务纠纷代理合同', type: 'entrust', client_name: '赵先生', client_phone: '13900139004', amount: 80000, stage: 'performing', sign_offset: -45, start_offset: -45, end_offset: 45, remarks: '诉讼阶段' },
      { title: '企业常年法律顾问合同', type: 'consultant', client_name: '某科技有限公司', client_phone: '010-88880001', amount: 120000, stage: 'performing', sign_offset: -60, start_offset: -60, end_offset: 305, remarks: '年度顾问服务' },
      { title: '合同审查服务协议', type: 'consultant', client_name: '某贸易公司', client_phone: '010-88880002', amount: 20000, stage: 'reviewing', sign_offset: null, start_offset: null, end_offset: null, remarks: '审查中' },
      { title: '医疗纠纷委托合同', type: 'entrust', client_name: '孙女士', client_phone: '13900139005', amount: 55000, stage: 'drafting', sign_offset: null, start_offset: null, end_offset: null, remarks: '合同起草中' },
      { title: '房产纠纷代理合同', type: 'entrust', client_name: '周先生', client_phone: '13900139006', amount: 65000, stage: 'terminated', sign_offset: -120, start_offset: -120, end_offset: -30, remarks: '客户解约' },
      { title: '知识产权维权合同', type: 'entrust', client_name: '某科技公司', client_phone: '010-88880003', amount: 90000, stage: 'performing', sign_offset: -20, start_offset: -20, end_offset: 100, remarks: '专利侵权诉讼' },
      { title: '股权转让顾问合同', type: 'consultant', client_name: '某投资公司', client_phone: '010-88880004', amount: 150000, stage: 'signed', sign_offset: -5, start_offset: -5, end_offset: 180, remarks: '股权交易全程顾问' },
      { title: '刑事辩护委托合同', type: 'entrust', client_name: '吴先生', client_phone: '13900139007', amount: 70000, stage: 'performing', sign_offset: -15, start_offset: -15, end_offset: 60, remarks: '审查起诉阶段' },
      { title: '建筑工程合同纠纷', type: 'entrust', client_name: '某建设公司', client_phone: '010-88880005', amount: 200000, stage: 'completed', sign_offset: -200, start_offset: -200, end_offset: -50, remarks: '调解结案' },
      { title: '拆迁补偿代理合同', type: 'entrust', client_name: '郑先生', client_phone: '13900139008', amount: 45000, stage: 'voided', sign_offset: -80, start_offset: -80, end_offset: null, remarks: '合同作废，重新签订' },
      { title: '商事仲裁委托合同', type: 'entrust', client_name: '某商贸公司', client_phone: '010-88880006', amount: 110000, stage: 'reviewing', sign_offset: null, start_offset: null, end_offset: null, remarks: '合同审查阶段' },
      { title: '私人法律顾问合同', type: 'consultant', client_name: '陈先生', client_phone: '13900139009', amount: 36000, stage: 'performing', sign_offset: -100, start_offset: -100, end_offset: 265, remarks: '年度私人顾问' },
    ];

    for (let i = 0; i < contractConfigs.length; i++) {
      const config = contractConfigs[i];
      const caseEntity = cases[i % cases.length];
      const contractNo = `HT${new Date().getFullYear()}${String(i + 1).padStart(4, '0')}`;
      const existing = await this.contractRepository.findOne({ where: { contract_no: contractNo } });
      if (!existing) {
        // === 新增字段生成 ===
        // 对方当事人
        const opposingParties = ['李某', '某保险公司', '某科技公司', '赵某', '某商贸公司', '某医院', '周某', '某房地产公司'];
        const opposingParty = opposingParties[i % opposingParties.length];
        // 分配比例（JSON序列化）
        const allocationRatio = JSON.stringify([{ role: '主办律师', ratio: 0.7 }, { role: '协办律师', ratio: 0.3 }]);
        // 原件回收状态
        const originalStatuses = ['not_received', 'received', 'na'];
        const originalStatus = originalStatuses[i % originalStatuses.length];
        // 质保金（2000-8000）
        const qualityDeposit = 2000 + (i * 400) % 6001;
        // 合同模板ID
        const templateIds = ['standard', 'simple'];
        const templateId = templateIds[i % templateIds.length];
        // 已审查的合同阶段（reviewing之后的阶段视为已审查）
        const reviewedStages = ['signed', 'performing', 'completed', 'terminated'];
        const isReviewed = reviewedStages.includes(config.stage);
        // 审查意见
        const reviewComment = isReviewed ? '审查通过，条款完备' : null;
        // 审查人ID
        const reviewerId = isReviewed ? orgAdmin?.id : null;
        // 审查时间（签订日期后3天）
        const reviewTime = isReviewed && config.sign_offset !== null
          ? new Date(Date.now() + config.sign_offset * 24 * 60 * 60 * 1000 + 3 * 24 * 60 * 60 * 1000)
          : null;

        await this.contractRepository.save({
          contract_no: contractNo,
          title: config.title,
          type: config.type,
          case_id: caseEntity.id,
          client_name: config.client_name,
          client_phone: config.client_phone,
          amount: config.amount,
          sign_date: config.sign_offset !== null ? new Date(Date.now() + config.sign_offset * 24 * 60 * 60 * 1000) : null,
          start_date: config.start_offset !== null ? new Date(Date.now() + config.start_offset * 24 * 60 * 60 * 1000) : null,
          end_date: config.end_offset !== null ? new Date(Date.now() + config.end_offset * 24 * 60 * 60 * 1000) : null,
          stage: config.stage,
          status: 'active',
          remarks: config.remarks,
          opposing_party: opposingParty,
          allocation_ratio: allocationRatio,
          original_status: originalStatus,
          quality_deposit: qualityDeposit,
          template_id: templateId,
          review_comment: reviewComment,
          reviewer_id: reviewerId,
          review_time: reviewTime,
          organization_id: orgId,
        });
      }
    }
  }

  // 审批种子数据
  private async seedApprovals(orgId: string, userMap: Record<string, User>) {
    // 检查审批申请表是否已有数据
    const existingApprovalCount = await this.approvalRequestRepository.count({ where: { organization_id: orgId } });
    if (existingApprovalCount > 0) return;

    const orgAdmin = userMap['13800138001'];
    const lawyerUser = userMap['13800138004'];
    const lawyerUser2 = userMap['13800138008'];
    const salesUser = userMap['13800138003'];
    const financeUser = userMap['13800138006'];
    const assistantUser = userMap['13800138005'];
    const cases = await this.caseRepository.find({ where: { organization_id: orgId }, take: 10 });

    const applicantPool = [lawyerUser, lawyerUser2, salesUser, financeUser, assistantUser];
    const approverPool = [orgAdmin];

    // 审批类型：seal用印 / case立案 / contract合同 / finance财务 / other其他
    // 状态：pending待审批 / approved已通过 / rejected已驳回 / cancelled已撤销
    const approvalConfigs = [
      { title: '用印申请-授权委托书', type: 'seal', status: 'pending', applicant_index: 0, content: { document_name: '授权委托书', usage_count: 1 }, target_type: 'seal_application', apply_offset: -1 },
      { title: '立案审批-婚姻纠纷案件', type: 'case', status: 'approved', applicant_index: 2, content: { case_name: '婚姻纠纷', fee_amount: 50000 }, target_type: 'case', apply_offset: -5 },
      { title: '合同审批-企业顾问合同', type: 'contract', status: 'approved', applicant_index: 1, content: { contract_title: '企业常年法律顾问合同', amount: 120000 }, target_type: 'contract', apply_offset: -8 },
      { title: '财务审批-退款申请', type: 'finance', status: 'pending', applicant_index: 3, content: { refund_amount: 5000, reason: '客户申请部分退款' }, target_type: 'refund', apply_offset: -2 },
      { title: '用印申请-律师函', type: 'seal', status: 'approved', applicant_index: 0, content: { document_name: '律师函', usage_count: 2 }, target_type: 'seal_application', apply_offset: -3 },
      { title: '立案审批-交通事故案件', type: 'case', status: 'approved', applicant_index: 2, content: { case_name: '交通事故赔偿', fee_amount: 30000 }, target_type: 'case', apply_offset: -10 },
      { title: '合同审批-债务纠纷合同', type: 'contract', status: 'rejected', applicant_index: 1, content: { contract_title: '债务纠纷代理合同', amount: 80000 }, target_type: 'contract', apply_offset: -7 },
      { title: '财务审批-费用报销', type: 'finance', status: 'approved', applicant_index: 4, content: { expense_amount: 3200, category: '诉讼费' }, target_type: 'expense', apply_offset: -4 },
      { title: '用印申请-起诉状', type: 'seal', status: 'approved', applicant_index: 0, content: { document_name: '起诉状', usage_count: 1 }, target_type: 'seal_application', apply_offset: -6 },
      { title: '其他审批-外出调查申请', type: 'other', status: 'approved', applicant_index: 1, content: { destination: '某市不动产登记中心', purpose: '调查房产信息' }, target_type: null, apply_offset: -12 },
      { title: '立案审批-劳动仲裁案件', type: 'case', status: 'pending', applicant_index: 2, content: { case_name: '劳动仲裁', fee_amount: 15000 }, target_type: 'case', apply_offset: -1 },
      { title: '合同审批-知识产权合同', type: 'contract', status: 'approved', applicant_index: 1, content: { contract_title: '知识产权维权合同', amount: 90000 }, target_type: 'contract', apply_offset: -15 },
      { title: '财务审批-大额支出', type: 'finance', status: 'rejected', applicant_index: 3, content: { expense_amount: 50000, category: '鉴定费' }, target_type: 'expense', apply_offset: -9 },
      { title: '用印申请-和解协议', type: 'seal', status: 'cancelled', applicant_index: 0, content: { document_name: '和解协议', usage_count: 3 }, target_type: 'seal_application', apply_offset: -20 },
      { title: '立案审批-医疗纠纷案件', type: 'case', status: 'approved', applicant_index: 2, content: { case_name: '医疗纠纷', fee_amount: 55000 }, target_type: 'case', apply_offset: -18 },
      { title: '合同审批-股权转让合同', type: 'contract', status: 'pending', applicant_index: 1, content: { contract_title: '股权转让顾问合同', amount: 150000 }, target_type: 'contract', apply_offset: -2 },
      { title: '财务审批-提成发放', type: 'finance', status: 'approved', applicant_index: 3, content: { total_amount: 28000, month: '本月提成' }, target_type: 'commission', apply_offset: -25 },
      { title: '其他审批-休假申请', type: 'other', status: 'approved', applicant_index: 4, content: { leave_type: '年假', days: 3 }, target_type: null, apply_offset: -14 },
      { title: '用印申请-调查函', type: 'seal', status: 'approved', applicant_index: 0, content: { document_name: '调查函', usage_count: 1 }, target_type: 'seal_application', apply_offset: -11 },
      { title: '立案审批-刑事辩护案件', type: 'case', status: 'approved', applicant_index: 2, content: { case_name: '刑事辩护', fee_amount: 70000 }, target_type: 'case', apply_offset: -16 },
    ];

    for (let i = 0; i < approvalConfigs.length; i++) {
      const config = approvalConfigs[i];
      const applicant = applicantPool[config.applicant_index];
      const caseEntity = cases.length > 0 ? cases[i % cases.length] : null;

      // 根据状态确定当前步骤
      let currentStep = 0;
      if (config.status === 'pending') {
        currentStep = 1;
      } else if (config.status === 'approved' || config.status === 'rejected') {
        currentStep = 1;
      } else if (config.status === 'cancelled') {
        currentStep = 0;
      }

      const request = await this.approvalRequestRepository.save({
        title: config.title,
        type: config.type,
        applicant_id: applicant?.id,
        target_type: config.target_type,
        target_id: caseEntity?.id,
        content: config.content,
        status: config.status,
        current_step: currentStep,
        organization_id: orgId,
      });

      // 创建审批步骤记录
      const approver = approverPool[0];
      let stepResult = 'pending';
      if (config.status === 'approved') {
        stepResult = 'approved';
      } else if (config.status === 'rejected') {
        stepResult = 'rejected';
      } else if (config.status === 'cancelled') {
        stepResult = 'pending';
      }

      await this.approvalStepRepository.save({
        request_id: request.id,
        step_order: 1,
        approver_id: approver?.id,
        result: stepResult,
        comment: stepResult === 'approved' ? '同意' : stepResult === 'rejected' ? '不同意' : null,
        approve_time: stepResult !== 'pending' ? new Date(Date.now() + config.apply_offset * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000) : null,
      });
    }
  }

  // 工作日志种子数据
  private async seedWorkLogs(orgId: string, userMap: Record<string, User>) {
    // 检查工作日志表是否已有数据
    const existingWorklogCount = await this.worklogRepository.count({ where: { organization_id: orgId } });
    if (existingWorklogCount > 0) return;

    const lawyerUser = userMap['13800138004'];
    const lawyerUser2 = userMap['13800138008'];
    const assistantUser = userMap['13800138005'];
    const orgAdmin = userMap['13800138001'];
    const cases = await this.caseRepository.find({ where: { organization_id: orgId }, take: 10 });
    if (cases.length === 0) return;

    const lawyerPool = [lawyerUser, lawyerUser2, assistantUser, orgAdmin];
    const workContents = [
      '与客户面谈，了解案件详情，梳理案件事实',
      '整理证据材料，制作证据目录',
      '起草民事起诉状，准备立案材料',
      '前往法院提交立案材料，缴纳诉讼费',
      '参加庭审，进行法庭辩论',
      '与对方律师进行证据交换',
      '撰写代理词，提交法院',
      '与客户沟通案件进展，确认后续方案',
      '调查取证，前往相关单位调取证据',
      '整理案卷材料，归档备查',
      '参加案件讨论会，分析案件难点',
      '撰写法律意见书，为客户提供法律分析',
      '与法官沟通案件审理进度',
      '准备庭审质证提纲',
      '起草和解协议，与对方协商',
      '前往不动产登记中心查询房产信息',
      '制作案件时间轴，梳理关键时间节点',
      '整理同类案件裁判文书，分析裁判规则',
      '撰写上诉状，准备上诉材料',
      '参加调解会议，促成双方和解',
      '整理办案笔记，总结办案经验',
      '检索相关法律法规，完善法律论证',
      '准备证人出庭材料',
      '计算赔偿金额，制作赔偿清单',
      '与鉴定机构沟通鉴定事宜',
      '起草财产保全申请书',
      '审查对方提交的证据材料',
      '准备法庭询问提纲',
      '撰写案件结案报告',
      '整理客户档案，更新案件管理系统',
    ];

    // 状态分布：draft草稿 / submitted已提交 / approved已通过 / rejected已驳回
    const statusCycle = ['approved', 'approved', 'submitted', 'approved', 'draft', 'approved', 'rejected', 'submitted', 'approved', 'draft'];

    for (let i = 0; i < 30; i++) {
      const lawyer = lawyerPool[i % lawyerPool.length];
      const caseEntity = cases[i % cases.length];
      const status = statusCycle[i % statusCycle.length];
      // 工作日期在最近3个月内
      const workDate = new Date(Date.now() - (i * 3 + 1) * 24 * 60 * 60 * 1000);
      const workHours = [6, 7, 8, 4, 5, 8, 6, 7, 8, 5][i % 10];

      const existing = await this.worklogRepository.findOne({
        where: { user_id: lawyer?.id, work_date: workDate.toISOString().slice(0, 10) } as any,
      });
      if (!existing) {
        // === 新增字段：日志类型和关联账单 ===
        // 日志类型（大部分为办案工作，少数为非办案工作）
        const logType = i % 6 === 0 ? 'non_case_work' : 'case_work';
        // 关联账单ID（部分日志关联账单）
        const billId = i % 4 === 0 ? `BILL${new Date().getFullYear()}${String(i + 1).padStart(4, '0')}` : null;

        await this.worklogRepository.save({
          user_id: lawyer?.id,
          case_id: caseEntity.id,
          work_date: workDate.toISOString().slice(0, 10),
          content: workContents[i],
          work_hours: workHours,
          billable: i % 5 !== 0, // 80%计费
          status: status,
          approver_id: status === 'approved' || status === 'rejected' ? orgAdmin?.id : null,
          approve_comment: status === 'approved' ? '审核通过' : status === 'rejected' ? '工时填写不准确，请核实' : null,
          approve_time: status === 'approved' || status === 'rejected' ? new Date(Date.now() - (i * 3) * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000) : null,
          log_type: logType,
          bill_id: billId,
          organization_id: orgId,
        });
      }
    }
  }

  // 日程种子数据
  private async seedSchedules(orgId: string, userMap: Record<string, User>) {
    // 检查日程表是否已有数据
    const existingScheduleCount = await this.scheduleRepository.count({ where: { organization_id: orgId } });
    if (existingScheduleCount > 0) return;

    const lawyerUser = userMap['13800138004'];
    const lawyerUser2 = userMap['13800138008'];
    const salesUser = userMap['13800138003'];
    const orgAdmin = userMap['13800138001'];
    const assistantUser = userMap['13800138005'];
    const cases = await this.caseRepository.find({ where: { organization_id: orgId }, take: 10 });

    const creatorPool = [lawyerUser, lawyerUser2, salesUser, orgAdmin, assistantUser];

    // 3个会议室
    const roomConfigs = [
      { name: '第一会议室', location: '3楼301室', capacity: 12 },
      { name: '第二会议室', location: '3楼302室', capacity: 6 },
      { name: '小型洽谈室', location: '2楼205室', capacity: 4 },
    ];

    const savedRooms: MeetingRoom[] = [];
    for (const config of roomConfigs) {
      const existingRoom = await this.meetingRoomRepository.findOne({ where: { name: config.name, organization_id: orgId } });
      if (!existingRoom) {
        const room = await this.meetingRoomRepository.save({
          ...config,
          status: 'available',
          organization_id: orgId,
        });
        savedRooms.push(room);
      } else {
        savedRooms.push(existingRoom);
      }
    }

    // 20条日程（未来2周内）
    const scheduleConfigs = [
      { title: '客户面谈-婚姻纠纷', location: '律所接待室', all_day: false, duration_hours: 2, reminder: 'before15min', related_case: true, status: 'active' },
      { title: '团队周会', location: '第一会议室', all_day: false, duration_hours: 1, reminder: 'before5min', related_case: false, status: 'active' },
      { title: '法院开庭', location: '朝阳区人民法院', all_day: false, duration_hours: 4, reminder: 'before1day', related_case: true, status: 'active' },
      { title: '客户签约', location: '律所接待室', all_day: false, duration_hours: 1, reminder: 'before30min', related_case: false, status: 'active' },
      { title: '案件讨论会', location: '第一会议室', all_day: false, duration_hours: 2, reminder: 'before15min', related_case: true, status: 'active' },
      { title: '外出调查', location: '不动产登记中心', all_day: true, duration_hours: 8, reminder: 'before1day', related_case: true, status: 'active' },
      { title: '电话会议', location: null, all_day: false, duration_hours: 1, reminder: 'before5min', related_case: false, status: 'active' },
      { title: '调解会议', location: '法院调解室', all_day: false, duration_hours: 3, reminder: 'before1hour', related_case: true, status: 'active' },
      { title: '法律培训', location: '第二会议室', all_day: false, duration_hours: 2, reminder: 'before15min', related_case: false, status: 'active' },
      { title: '客户回访', location: '客户公司', all_day: false, duration_hours: 2, reminder: 'before1hour', related_case: false, status: 'active' },
      { title: '证据交换', location: '朝阳区人民法院', all_day: false, duration_hours: 2, reminder: 'before1day', related_case: true, status: 'active' },
      { title: '律所月度总结会', location: '第一会议室', all_day: false, duration_hours: 2, reminder: 'before15min', related_case: false, status: 'active' },
      { title: '商标注册咨询', location: '律所接待室', all_day: false, duration_hours: 1, reminder: 'before15min', related_case: false, status: 'active' },
      { title: '合同审查会议', location: '第二会议室', all_day: false, duration_hours: 2, reminder: 'before5min', related_case: false, status: 'active' },
      { title: '法庭质证', location: '海淀区人民法院', all_day: false, duration_hours: 3, reminder: 'before1day', related_case: true, status: 'done' },
      { title: '团队建设活动', location: '外部场地', all_day: true, duration_hours: 8, reminder: 'before1day', related_case: false, status: 'active' },
      { title: '专家论证会', location: '第一会议室', all_day: false, duration_hours: 3, reminder: 'before1hour', related_case: true, status: 'active' },
      { title: '财务报销审批', location: '财务室', all_day: false, duration_hours: 1, reminder: 'none', related_case: false, status: 'active' },
      { title: '新员工入职培训', location: '小型洽谈室', all_day: false, duration_hours: 2, reminder: 'before15min', related_case: false, status: 'cancelled' },
      { title: '仲裁庭审', location: '仲裁委员会', all_day: false, duration_hours: 4, reminder: 'before1day', related_case: true, status: 'active' },
    ];

    const savedSchedules: Schedule[] = [];
    for (let i = 0; i < scheduleConfigs.length; i++) {
      const config = scheduleConfigs[i];
      const creator = creatorPool[i % creatorPool.length];
      const caseEntity = config.related_case && cases.length > 0 ? cases[i % cases.length] : null;
      // 未来2周内（14天），按天分布
      const dayOffset = Math.floor(i / 2) + 1; // 第1天到第10天
      const startHour = 9 + (i % 8); // 9点到16点开始
      const startTime = new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1000);
      startTime.setHours(startHour, 0, 0, 0);
      const endTime = new Date(startTime.getTime() + config.duration_hours * 60 * 60 * 1000);

      // 计算提醒时间
      let reminderTime: Date | null = null;
      if (config.reminder === 'before5min') reminderTime = new Date(startTime.getTime() - 5 * 60 * 1000);
      else if (config.reminder === 'before15min') reminderTime = new Date(startTime.getTime() - 15 * 60 * 1000);
      else if (config.reminder === 'before1hour') reminderTime = new Date(startTime.getTime() - 60 * 60 * 1000);
      else if (config.reminder === 'before1day') reminderTime = new Date(startTime.getTime() - 24 * 60 * 60 * 1000);

      const schedule = await this.scheduleRepository.save({
        title: config.title,
        description: `${config.title} - 律所日常工作安排`,
        start_time: startTime,
        end_time: endTime,
        all_day: config.all_day,
        location: config.location,
        creator_id: creator?.id,
        related_case_id: caseEntity?.id,
        reminder_type: config.reminder,
        reminder_time: reminderTime,
        status: config.status,
        // 附件（部分日程填写，JSON序列化）
        attachments: i % 3 === 0 ? JSON.stringify(['会议资料.pdf', '客户名单.xlsx']) : null,
        // 共享团队（部分日程填写）
        shared_team_id: i % 4 === 0 ? '团队A' : null,
        // 主题（根据标题关键词推断）
        theme: config.title.includes('客户') ? '客户会议'
          : config.title.includes('案件') || config.title.includes('讨论') ? '案件讨论'
          : config.title.includes('法院') || config.title.includes('庭审') || config.title.includes('仲裁') ? '庭审准备'
          : '日常工作',
        organization_id: orgId,
      });
      savedSchedules.push(schedule);
    }

    // 5条会议室预约记录
    const bookingStatuses = ['approved', 'approved', 'pending', 'approved', 'rejected'];
    for (let i = 0; i < 5 && i < savedSchedules.length; i++) {
      const schedule = savedSchedules[i];
      const room = savedRooms[i % savedRooms.length];
      const booker = creatorPool[i % creatorPool.length];
      const bookingDate = new Date(schedule.start_time);
      bookingDate.setHours(0, 0, 0, 0);

      await this.meetingRoomBookingRepository.save({
        room_id: room.id,
        schedule_id: schedule.id,
        booking_date: bookingDate.toISOString().slice(0, 10),
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        booker_id: booker?.id,
        status: bookingStatuses[i],
        organization_id: orgId,
      });
    }
  }

  // 任务种子数据
  private async seedTasks(orgId: string, userMap: Record<string, User>) {
    // 检查任务表是否已有数据
    const existingTaskCount = await this.taskRepository.count({ where: { organization_id: orgId } });
    if (existingTaskCount > 0) return;

    const lawyerUser = userMap['13800138004'];
    const lawyerUser2 = userMap['13800138008'];
    const salesUser = userMap['13800138003'];
    const orgAdmin = userMap['13800138001'];
    const assistantUser = userMap['13800138005'];
    const marketingUser = userMap['13800138002'];
    const cases = await this.caseRepository.find({ where: { organization_id: orgId }, take: 10 });
    const leads = await this.leadRepository.find({ where: { organization_id: orgId }, take: 10 });
    if (cases.length === 0 && leads.length === 0) return;

    const assigneePool = [lawyerUser, lawyerUser2, salesUser, assistantUser, marketingUser];
    const creatorPool = [orgAdmin, salesUser, lawyerUser];

    // 25条任务（不同优先级和状态）
    const taskConfigs = [
      { title: '起草婚姻纠纷起诉状', priority: 'high', status: 'completed', due_offset: -5, related_type: 'case', desc: '根据客户提供的材料起草民事起诉状' },
      { title: '整理交通事故证据材料', priority: 'normal', status: 'processing', due_offset: 3, related_type: 'case', desc: '整理医疗费发票、交警责任认定书等证据' },
      { title: '联系劳动仲裁委确认开庭时间', priority: 'urgent', status: 'processing', due_offset: 1, related_type: 'case', desc: '电话联系仲裁委员会确认开庭日期' },
      { title: '跟进债务纠纷案件执行进度', priority: 'high', status: 'processing', due_offset: 7, related_type: 'case', desc: '与执行法官沟通执行进度' },
      { title: '撰写法律意见书', priority: 'normal', status: 'pending', due_offset: 5, related_type: 'case', desc: '为企业客户撰写合同审查法律意见书' },
      { title: '回访潜在客户张女士', priority: 'high', status: 'pending', due_offset: 2, related_type: 'lead', desc: '电话回访，了解客户意向' },
      { title: '准备庭审质证提纲', priority: 'urgent', status: 'completed', due_offset: -2, related_type: 'case', desc: '准备对方证据的质证意见' },
      { title: '整理案卷归档', priority: 'low', status: 'pending', due_offset: 14, related_type: 'case', desc: '将已结案案件材料整理归档' },
      { title: '制作案件时间轴', priority: 'normal', status: 'completed', due_offset: -3, related_type: 'case', desc: '梳理案件关键时间节点' },
      { title: '联系鉴定机构安排鉴定', priority: 'high', status: 'processing', due_offset: 4, related_type: 'case', desc: '安排伤残鉴定事宜' },
      { title: '审查合同条款', priority: 'normal', status: 'processing', due_offset: 3, related_type: 'case', desc: '审查客户提交的商业合同条款' },
      { title: '准备调解方案', priority: 'high', status: 'pending', due_offset: 2, related_type: 'case', desc: '根据案件情况准备调解方案' },
      { title: '跟进线索转化情况', priority: 'normal', status: 'completed', due_offset: -1, related_type: 'lead', desc: '跟进本周新线索的转化情况' },
      { title: '撰写代理词', priority: 'high', status: 'processing', due_offset: 5, related_type: 'case', desc: '撰写庭审代理词' },
      { title: '准备上诉材料', priority: 'urgent', status: 'pending', due_offset: 3, related_type: 'case', desc: '准备上诉状及相关证据材料' },
      { title: '更新案件管理系统', priority: 'low', status: 'pending', due_offset: 7, related_type: 'case', desc: '更新案件进展和办案记录' },
      { title: '安排客户面谈', priority: 'normal', status: 'completed', due_offset: -4, related_type: 'lead', desc: '预约客户到所面谈时间' },
      { title: '检索类案裁判文书', priority: 'normal', status: 'processing', due_offset: 6, related_type: 'case', desc: '检索同类案件裁判规则' },
      { title: '起草和解协议', priority: 'high', status: 'pending', due_offset: 2, related_type: 'case', desc: '根据调解结果起草和解协议' },
      { title: '准备证人出庭材料', priority: 'normal', status: 'processing', due_offset: 4, related_type: 'case', desc: '准备证人出庭作证相关材料' },
      { title: '计算赔偿金额', priority: 'normal', status: 'completed', due_offset: -5, related_type: 'case', desc: '计算人身损害赔偿各项金额' },
      { title: '跟进新线索分配', priority: 'urgent', status: 'processing', due_offset: 1, related_type: 'lead', desc: '确保新线索及时分配给销售' },
      { title: '撰写案件结案报告', priority: 'low', status: 'cancelled', due_offset: 10, related_type: 'case', desc: '撰写已结案案件的结案报告' },
      { title: '准备财产保全申请', priority: 'high', status: 'pending', due_offset: 3, related_type: 'case', desc: '准备财产保全申请书及担保材料' },
      { title: '整理办案笔记', priority: 'low', status: 'pending', due_offset: 14, related_type: 'case', desc: '总结本月办案经验和教训' },
    ];

    for (let i = 0; i < taskConfigs.length; i++) {
      const config = taskConfigs[i];
      const assignee = assigneePool[i % assigneePool.length];
      const creator = creatorPool[i % creatorPool.length];
      let relatedCaseId: string | null = null;
      let relatedLeadId: string | null = null;

      if (config.related_type === 'case' && cases.length > 0) {
        relatedCaseId = cases[i % cases.length].id;
      } else if (config.related_type === 'lead' && leads.length > 0) {
        relatedLeadId = leads[i % leads.length].id;
      }

      const dueDate = new Date(Date.now() + config.due_offset * 24 * 60 * 60 * 1000);
      // 多负责人ID数组（JSON序列化，取主负责人和次负责人）
      const secondaryAssignee = assigneePool[(i + 1) % assigneePool.length];
      const assigneeIds = JSON.stringify([assignee?.id, secondaryAssignee?.id].filter(Boolean));
      // 任务进度（根据状态映射）
      const progressMap: Record<string, number> = {
        pending: 0,
        processing: 20 + (i * 15) % 61,
        completed: 100,
        cancelled: 0,
      };
      const progress = progressMap[config.status] !== undefined ? progressMap[config.status] : 0;

      await this.taskRepository.save({
        title: config.title,
        description: config.desc,
        assignee_id: assignee?.id,
        creator_id: creator?.id,
        priority: config.priority,
        status: config.status,
        due_date: dueDate.toISOString().slice(0, 10),
        related_case_id: relatedCaseId,
        related_lead_id: relatedLeadId,
        parent_task_id: null,
        completed_at: config.status === 'completed' ? new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) : null,
        assignee_ids: assigneeIds,
        progress,
        organization_id: orgId,
      });
    }
  }

  // 知识库种子数据
  private async seedKnowledge(orgId: string, userMap: Record<string, User>) {
    const lawyerUser = userMap['13800138004'];
    const lawyerUser2 = userMap['13800138008'];
    const orgAdmin = userMap['13800138001'];

    // ===== 20篇知识文章（不同分类）=====
    const existingArticleCount = await this.knowledgeArticleRepository.count({ where: { organization_id: orgId } });
    if (existingArticleCount === 0) {
      const authorPool = [lawyerUser, lawyerUser2, orgAdmin];
      // 分类：experience实务经验 / research法律研究 / skill办案技巧 / template模板范本
      const articleConfigs = [
        { title: '婚姻案件中财产分割的实务要点', category: 'experience', content: '本文总结婚姻案件中财产分割的常见问题与处理思路，包括婚前财产认定、婚后共同财产分割、隐匿财产查处等内容。', tags: ['婚姻', '财产分割', '实务经验'], views: 156 },
        { title: '交通事故伤残鉴定流程详解', category: 'experience', content: '详细介绍交通事故案件中的伤残鉴定流程，包括鉴定机构选择、鉴定时机、鉴定材料准备等实务要点。', tags: ['交通事故', '伤残鉴定', '实务经验'], views: 203 },
        { title: '劳动仲裁时效问题研究', category: 'research', content: '对劳动仲裁时效制度进行系统研究，分析时效起算点、时效中断与中止等法律问题。', tags: ['劳动仲裁', '时效', '法律研究'], views: 89 },
        { title: '民事诉讼证据规则新解', category: 'research', content: '结合最新司法解释，对民事诉讼证据规则进行解读，分析举证责任分配、证据采信标准等问题。', tags: ['民事诉讼', '证据规则', '法律研究'], views: 178 },
        { title: '庭审质证技巧与策略', category: 'skill', content: '分享庭审质证的实用技巧，包括如何有效质疑对方证据、如何组织己方证据链等策略。', tags: ['庭审', '质证', '办案技巧'], views: 245 },
        { title: '合同审查的关键风险点排查', category: 'skill', content: '总结合同审查中的常见风险点，提供系统化的排查方法和审查清单。', tags: ['合同审查', '风险防控', '办案技巧'], views: 312 },
        { title: '民事起诉状范本及撰写要点', category: 'template', content: '提供民事起诉状的标准范本，详细说明各部分的撰写要点和注意事项。', tags: ['起诉状', '文书模板', '范本'], views: 456 },
        { title: '律师函标准模板', category: 'template', content: '提供律师函的标准模板，涵盖催告函、警告函等不同类型的撰写要点。', tags: ['律师函', '文书模板', '范本'], views: 389 },
        { title: '执行异议之诉的实务处理', category: 'experience', content: '分析执行异议之诉的实务操作要点，包括提起条件、举证要点、审理思路等。', tags: ['执行异议', '实务经验'], views: 67 },
        { title: '知识产权侵权赔偿计算方法', category: 'research', content: '研究知识产权侵权案件的赔偿金额计算方法，分析法定赔偿与酌定赔偿的适用。', tags: ['知识产权', '赔偿计算', '法律研究'], views: 134 },
        { title: '刑事辩护中非法证据排除申请技巧', category: 'skill', content: '分享刑事辩护中申请非法证据排除的实务技巧和注意事项。', tags: ['刑事辩护', '非法证据排除', '办案技巧'], views: 198 },
        { title: '调解谈判的心理学技巧', category: 'skill', content: '从心理学角度分析调解谈判中的沟通技巧，帮助律师更好地促成调解。', tags: ['调解', '谈判技巧', '办案技巧'], views: 276 },
        { title: '授权委托书标准模板', category: 'template', content: '提供民事诉讼授权委托书的标准模板，说明授权范围的填写要点。', tags: ['授权委托书', '文书模板', '范本'], views: 423 },
        { title: '财产保全申请书范本', category: 'template', content: '提供财产保全申请书的标准范本，包括担保材料的准备要点。', tags: ['财产保全', '文书模板', '范本'], views: 287 },
        { title: '建工合同纠纷实务问题研究', category: 'research', content: '研究建设工程施工合同纠纷中的常见法律问题，包括工程款结算、工期顺延、质量争议等。', tags: ['建设工程', '合同纠纷', '法律研究'], views: 112 },
        { title: '医疗纠纷案件鉴定要点', category: 'experience', content: '总结医疗损害责任纠纷案件中的司法鉴定要点，包括鉴定申请、鉴定材料准备等。', tags: ['医疗纠纷', '司法鉴定', '实务经验'], views: 145 },
        { title: '企业合规审查操作指南', category: 'skill', content: '提供企业合规审查的操作指南，帮助律师系统化开展企业合规法律服务。', tags: ['企业合规', '法律顾问', '办案技巧'], views: 167 },
        { title: '股权转让合同审查要点', category: 'experience', content: '总结股权转让合同审查的关键要点，包括交易结构设计、风险条款排查等。', tags: ['股权转让', '合同审查', '实务经验'], views: 234 },
        { title: '和解协议书标准模板', category: 'template', content: '提供民事和解协议书的标准模板，涵盖常见和解条款的撰写要点。', tags: ['和解协议', '文书模板', '范本'], views: 345 },
        { title: '行政诉讼举证规则研究', category: 'research', content: '研究行政诉讼中的举证责任分配规则，分析被告举证与原告举证的范围。', tags: ['行政诉讼', '举证规则', '法律研究'], views: 98 },
      ];

      for (let i = 0; i < articleConfigs.length; i++) {
        const config = articleConfigs[i];
        const author = authorPool[i % authorPool.length];
        const existing = await this.knowledgeArticleRepository.findOne({ where: { title: config.title } });
        if (!existing) {
          await this.knowledgeArticleRepository.save({
            title: config.title,
            category: config.category,
            content: config.content,
            author_id: author?.id,
            tags: config.tags,
            view_count: config.views,
            status: 'published',
            organization_id: orgId,
          });
        }
      }
    }

    // ===== 30条法律法规（不同分类）=====
    const existingLawCount = await this.lawRegulationRepository.count();
    if (existingLawCount === 0) {
      // 分类：constitution宪法 / law法律 / regulation行政法规 / interpretation司法解释 / department部门规章
      const lawConfigs = [
        { title: '中华人民共和国民法典', category: 'law', authority: '全国人民代表大会', effective_offset: -180, content: '民法典是新中国第一部以法典命名的法律，涵盖物权、合同、人格权、婚姻家庭、继承、侵权责任等内容。' },
        { title: '中华人民共和国民事诉讼法', category: 'law', authority: '全国人民代表大会常务委员会', effective_offset: -365, content: '规范民事诉讼程序的基本法律，规定管辖、证据、审判程序、执行等内容。' },
        { title: '中华人民共和国刑法', category: 'law', authority: '全国人民代表大会', effective_offset: -730, content: '规定犯罪与刑罚的基本法律，涵盖各类刑事犯罪的构成要件与刑罚标准。' },
        { title: '中华人民共和国劳动合同法', category: 'law', authority: '全国人民代表大会常务委员会', effective_offset: -540, content: '规范劳动合同的订立、履行、变更、解除与终止，保护劳动者合法权益。' },
        { title: '中华人民共和国公司法', category: 'law', authority: '全国人民代表大会常务委员会', effective_offset: -200, content: '规范公司的设立、组织机构、股权转让、清算等内容，最新修订于2024年实施。' },
        { title: '中华人民共和国行政诉讼法', category: 'law', authority: '全国人民代表大会常务委员会', effective_offset: -400, content: '规范行政诉讼程序，保障公民、法人对行政行为的司法救济权利。' },
        { title: '中华人民共和国知识产权法', category: 'law', authority: '全国人民代表大会常务委员会', effective_offset: -300, content: '保护专利权、商标权、著作权等知识产权，规范知识产权的取得、行使与保护。' },
        { title: '最高人民法院关于适用《中华人民共和国民法典》婚姻家庭编的解释（一）', category: 'interpretation', authority: '最高人民法院', effective_offset: -180, content: '对民法典婚姻家庭编的适用问题进行司法解释，细化相关规定。' },
        { title: '最高人民法院关于适用《中华人民共和国民法典》合同编通则若干问题的解释', category: 'interpretation', authority: '最高人民法院', effective_offset: -180, content: '对民法典合同编通则的适用问题进行司法解释，明确合同效力、履行等规则。' },
        { title: '最高人民法院关于审理人身损害赔偿案件适用法律若干问题的解释', category: 'interpretation', authority: '最高人民法院', effective_offset: -365, content: '规范人身损害赔偿案件的审理，明确赔偿范围、计算标准等问题。' },
        { title: '最高人民法院关于审理劳动争议案件适用法律若干问题的解释', category: 'interpretation', authority: '最高人民法院', effective_offset: -400, content: '规范劳动争议案件的审理，明确仲裁与诉讼的衔接等问题。' },
        { title: '最高人民法院关于适用《中华人民共和国民事诉讼法》的解释', category: 'interpretation', authority: '最高人民法院', effective_offset: -365, content: '对民事诉讼法的适用问题进行全面司法解释，细化程序规定。' },
        { title: '最高人民法院关于审理建设工程施工合同纠纷案件适用法律问题的解释', category: 'interpretation', authority: '最高人民法院', effective_offset: -500, content: '规范建设工程施工合同纠纷案件的审理，明确工程款结算等问题。' },
        { title: '诉讼费用交纳办法', category: 'regulation', authority: '国务院', effective_offset: -600, content: '规范诉讼费用的交纳标准与办法，明确各类案件的收费标准。' },
        { title: '中华人民共和国律师法实施条例', category: 'regulation', authority: '国务院', effective_offset: -700, content: '对律师法的实施进行细化规定，规范律师执业行为。' },
        { title: '法律援助条例', category: 'regulation', authority: '国务院', effective_offset: -800, content: '规范法律援助的范围、申请程序与实施办法。' },
        { title: '人民法院在线诉讼规则', category: 'regulation', authority: '最高人民法院', effective_offset: -150, content: '规范人民法院在线诉讼程序，明确电子诉讼的适用范围与操作规则。' },
        { title: '律师执业管理办法', category: 'department', authority: '司法部', effective_offset: -900, content: '规范律师执业准入、执业行为和执业监管。' },
        { title: '律师事务所管理办法', category: 'department', authority: '司法部', effective_offset: -900, content: '规范律师事务所的设立、变更、终止及监督管理。' },
        { title: '律师服务收费管理办法', category: 'department', authority: '国家发展改革委 司法部', effective_offset: -850, content: '规范律师服务收费行为，明确收费方式与标准。' },
        { title: '中华人民共和国宪法', category: 'constitution', authority: '全国人民代表大会', effective_offset: -2000, content: '国家根本大法，规定国家的根本制度和根本任务，公民的基本权利和义务。' },
        { title: '最高人民法院关于审理民间借贷案件适用法律若干问题的规定', category: 'interpretation', authority: '最高人民法院', effective_offset: -450, content: '规范民间借贷案件的审理，明确利率上限、证据认定等问题。' },
        { title: '最高人民法院关于审理商品房买卖合同纠纷案件适用法律若干问题的解释', category: 'interpretation', authority: '最高人民法院', effective_offset: -550, content: '规范商品房买卖合同纠纷案件的审理，明确违约责任等问题。' },
        { title: '工伤保险条例', category: 'regulation', authority: '国务院', effective_offset: -650, content: '规范工伤保险的适用范围、认定标准、待遇支付等内容。' },
        { title: '中华人民共和国仲裁法', category: 'law', authority: '全国人民代表大会常务委员会', effective_offset: -1000, content: '规范仲裁程序，明确仲裁协议、仲裁程序、裁决执行等问题。' },
        { title: '医疗事故处理条例', category: 'regulation', authority: '国务院', effective_offset: -750, content: '规范医疗事故的处理程序，明确医疗事故的认定与赔偿。' },
        { title: '最高人民法院关于民事诉讼证据的若干规定', category: 'interpretation', authority: '最高人民法院', effective_offset: -480, content: '规范民事诉讼证据的举证、质证、认证规则。' },
        { title: '公证程序规则', category: 'department', authority: '司法部', effective_offset: -880, content: '规范公证程序的适用，明确公证事项的办理流程。' },
        { title: '中华人民共和国消费者权益保护法', category: 'law', authority: '全国人民代表大会常务委员会', effective_offset: -620, content: '保护消费者合法权益，规范经营者的义务与责任。' },
        { title: '最高人民法院关于执行程序中计算迟延履行期间的债务利息适用法律若干问题的解释', category: 'interpretation', authority: '最高人民法院', effective_offset: -420, content: '规范执行程序中迟延履行期间债务利息的计算方法。' },
      ];

      for (const config of lawConfigs) {
        const existing = await this.lawRegulationRepository.findOne({ where: { title: config.title } });
        if (!existing) {
          await this.lawRegulationRepository.save({
            title: config.title,
            category: config.category,
            promulgating_authority: config.authority,
            effective_date: new Date(Date.now() + config.effective_offset * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            content: config.content,
            source: '国家法律法规数据库',
          });
        }
      }
    }

    // ===== 20条裁判文书（不同类型）=====
    const existingPrecedentCount = await this.casePrecedentRepository.count();
    if (existingPrecedentCount === 0) {
      // 类型：judgment判决 / ruling裁定 / mediation调解
      const precedentConfigs = [
        { case_name: '张某与李某离婚纠纷案', case_no: '(2025)京0105民初1234号', court: '北京市朝阳区人民法院', case_type: '婚姻家庭', judgment_type: 'judgment', parties: '张某、李某', judgment_offset: -30, summary: '法院判决准予离婚，婚后共同房产按贡献比例分割，子女抚养权归女方。' },
        { case_name: '王某诉赵某交通事故责任纠纷案', case_no: '(2025)京0105民初2345号', court: '北京市朝阳区人民法院', case_type: '交通事故', judgment_type: 'judgment', parties: '王某、赵某、某保险公司', judgment_offset: -45, summary: '法院判决保险公司与肇事方连带赔偿医疗费、误工费等共计12万元。' },
        { case_name: '某科技公司与孙某劳动争议仲裁案', case_no: '(2025)京0105民初3456号', court: '北京市朝阳区人民法院', case_type: '劳动争议', judgment_type: 'judgment', parties: '某科技公司、孙某', judgment_offset: -60, summary: '法院判决公司支付违法解除劳动合同赔偿金8万元。' },
        { case_name: '周某与吴某民间借贷纠纷调解案', case_no: '(2025)京0105民初4567号', court: '北京市朝阳区人民法院', case_type: '民间借贷', judgment_type: 'mediation', parties: '周某、吴某', judgment_offset: -20, summary: '经法院主持调解，双方达成还款协议，被告分期偿还原告借款。' },
        { case_name: '某建设公司与某房产公司建工合同纠纷案', case_no: '(2024)京01民终5678号', court: '北京市第一中级人民法院', case_type: '建设工程', judgment_type: 'judgment', parties: '某建设公司、某房产公司', judgment_offset: -90, summary: '法院判决发包方支付拖欠工程款及违约金共计350万元。' },
        { case_name: '郑某诉某医院医疗损害责任纠纷案', case_no: '(2025)京0105民初6789号', court: '北京市朝阳区人民法院', case_type: '医疗纠纷', judgment_type: 'judgment', parties: '郑某、某医院', judgment_offset: -50, summary: '经鉴定医院存在过错，法院判决医院赔偿各项损失25万元。' },
        { case_name: '某公司与陈某股权转让合同纠纷案', case_no: '(2024)京01民终7890号', court: '北京市第一中级人民法院', case_type: '股权转让', judgment_type: 'judgment', parties: '某公司、陈某', judgment_offset: -120, summary: '法院判决股权转让合同有效，被告配合办理股权变更登记。' },
        { case_name: '林某与某贸易公司买卖合同纠纷管辖异议案', case_no: '(2025)京0105民初8901号', court: '北京市朝阳区人民法院', case_type: '合同纠纷', judgment_type: 'ruling', parties: '林某、某贸易公司', judgment_offset: -15, summary: '法院裁定驳回被告管辖异议申请。' },
        { case_name: '黄某诉某保险公司理赔纠纷案', case_no: '(2025)京0105民初9012号', court: '北京市朝阳区人民法院', case_type: '保险理赔', judgment_type: 'judgment', parties: '黄某、某保险公司', judgment_offset: -40, summary: '法院判决保险公司按照保险合同约定支付理赔款18万元。' },
        { case_name: '某科技公司与某商贸公司商标侵权纠纷案', case_no: '(2024)京73民初0123号', court: '北京知识产权法院', case_type: '知识产权', judgment_type: 'judgment', parties: '某科技公司、某商贸公司', judgment_offset: -100, summary: '法院认定被告构成商标侵权，判决停止侵权并赔偿损失50万元。' },
        { case_name: '高某与某物业公司物业服务合同纠纷调解案', case_no: '(2025)京0105民初1233号', court: '北京市朝阳区人民法院', case_type: '物业服务', judgment_type: 'mediation', parties: '高某、某物业公司', judgment_offset: -25, summary: '经调解，物业公司同意减免部分物业费，业主补缴欠费。' },
        { case_name: '曾某诉某单位工伤保险待遇纠纷案', case_no: '(2025)京0105民初2344号', court: '北京市朝阳区人民法院', case_type: '工伤保险', judgment_type: 'judgment', parties: '曾某、某单位', judgment_offset: -55, summary: '法院判决单位支付工伤保险待遇差额15万元。' },
        { case_name: '马某与何某房屋买卖合同纠纷案', case_no: '(2024)京01民终3455号', court: '北京市第一中级人民法院', case_type: '房屋买卖', judgment_type: 'judgment', parties: '马某、何某', judgment_offset: -80, summary: '法院判决解除房屋买卖合同，卖方双倍返还定金。' },
        { case_name: '某投资公司与某集团合同纠纷财产保全案', case_no: '(2025)京0105财保012号', court: '北京市朝阳区人民法院', case_type: '财产保全', judgment_type: 'ruling', parties: '某投资公司、某集团', judgment_offset: -10, summary: '法院裁定准许财产保全申请，冻结被申请人银行账户。' },
        { case_name: '罗某诉某教育培训机构退费纠纷案', case_no: '(2025)京0105民初4566号', court: '北京市朝阳区人民法院', case_type: '教育培训', judgment_type: 'judgment', parties: '罗某、某教育培训机构', judgment_offset: -35, summary: '法院判决培训机构退还培训费用并支付利息。' },
        { case_name: '杨某与梁某继承纠纷调解案', case_no: '(2025)京0105民初5677号', court: '北京市朝阳区人民法院', case_type: '继承纠纷', judgment_type: 'mediation', parties: '杨某、梁某', judgment_offset: -28, summary: '经调解，双方就遗产分割达成一致意见。' },
        { case_name: '某广告公司与某传媒公司服务合同纠纷案', case_no: '(2024)京01民终6788号', court: '北京市第一中级人民法院', case_type: '合同纠纷', judgment_type: 'judgment', parties: '某广告公司、某传媒公司', judgment_offset: -110, summary: '法院判决被告支付服务费及违约金共计42万元。' },
        { case_name: '许某诉某保险公司保险合同纠纷撤诉案', case_no: '(2025)京0105民初7899号', court: '北京市朝阳区人民法院', case_type: '保险合同', judgment_type: 'ruling', parties: '许某、某保险公司', judgment_offset: -12, summary: '法院裁定准许原告撤回起诉。' },
        { case_name: '田某与某公司竞业限制纠纷案', case_no: '(2025)京0105民初8900号', court: '北京市朝阳区人民法院', case_type: '劳动争议', judgment_type: 'judgment', parties: '田某、某公司', judgment_offset: -42, summary: '法院判决劳动者违反竞业限制约定，支付违约金20万元。' },
        { case_name: '韩某诉某开发商商品房买卖合同纠纷案', case_no: '(2024)京01民初9011号', court: '北京市第一中级人民法院', case_type: '商品房买卖', judgment_type: 'judgment', parties: '韩某、某开发商', judgment_offset: -130, summary: '法院判决开发商逾期交房承担违约责任，赔偿业主损失。' },
      ];

      for (const config of precedentConfigs) {
        const existing = await this.casePrecedentRepository.findOne({ where: { case_name: config.case_name } });
        if (!existing) {
          await this.casePrecedentRepository.save({
            case_name: config.case_name,
            case_no: config.case_no,
            court: config.court,
            case_type: config.case_type,
            judgment_date: new Date(Date.now() + config.judgment_offset * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            judgment_type: config.judgment_type,
            parties: config.parties,
            summary: config.summary,
            full_text: `${config.case_name}：${config.summary}本案经${config.court}审理，案号为${config.case_no}。当事人：${config.parties}。裁判要旨：${config.summary}`,
            source: '中国裁判文书网',
          });
        }
      }
    }
  }

  // 投标种子数据
  private async seedBids(orgId: string, userMap: Record<string, User>) {
    const orgAdmin = userMap['13800138001'];
    const lawyerUser = userMap['13800138004'];
    const lawyerUser2 = userMap['13800138008'];
    const salesUser = userMap['13800138003'];

    const managerPool = [orgAdmin, lawyerUser, lawyerUser2, salesUser];

    // ===== 10条投标记录（不同状态）=====
    const existingBidCount = await this.bidRepository.count({ where: { organization_id: orgId } });
    if (existingBidCount === 0) {
      // 投标状态：preparing准备中 / submitted已投标 / won中标 / lost未中标
      const bidConfigs = [
        { project_name: '某集团常年法律顾问服务招标', tenderer: '某集团股份有限公司', bid_amount: 150000, deadline_offset: 7, bid_offset: null, status: 'preparing', result_offset: null, manager_index: 0, remarks: '准备投标文件中' },
        { project_name: '某国企法律服务体系采购', tenderer: '某国有企业', bid_amount: 280000, deadline_offset: -3, bid_offset: -5, status: 'submitted', result_offset: null, manager_index: 1, remarks: '已提交投标文件，等待开标' },
        { project_name: '某科技公司知识产权专项服务', tenderer: '某科技有限公司', bid_amount: 120000, deadline_offset: -10, bid_offset: -12, status: 'won', result_offset: -2, manager_index: 2, remarks: '成功中标，已签订服务合同' },
        { project_name: '某央企合规体系建设服务', tenderer: '某央企集团', bid_amount: 500000, deadline_offset: -15, bid_offset: -18, status: 'lost', result_offset: -5, manager_index: 0, remarks: '竞争对手报价更低，未中标' },
        { project_name: '某银行不良资产处置法律服务', tenderer: '某商业银行', bid_amount: 350000, deadline_offset: 14, bid_offset: null, status: 'preparing', result_offset: null, manager_index: 1, remarks: '组建项目团队，准备方案' },
        { project_name: '某上市公司证券诉讼代理', tenderer: '某上市公司', bid_amount: 200000, deadline_offset: -7, bid_offset: -10, status: 'won', result_offset: -1, manager_index: 3, remarks: '中标，正在准备诉讼材料' },
        { project_name: '某地产公司建设工程纠纷代理', tenderer: '某房地产开发公司', bid_amount: 300000, deadline_offset: -20, bid_offset: -25, status: 'lost', result_offset: -8, manager_index: 2, remarks: '案源竞争激烈，未能中标' },
        { project_name: '某保险公司年度法律服务招标', tenderer: '某保险股份有限公司', bid_amount: 180000, deadline_offset: 3, bid_offset: null, status: 'preparing', result_offset: null, manager_index: 0, remarks: '准备投标方案' },
        { project_name: '某政府部门法律顾问服务', tenderer: '某市人民政府', bid_amount: 260000, deadline_offset: -5, bid_offset: -8, status: 'submitted', result_offset: null, manager_index: 1, remarks: '已投标，等待评标结果' },
        { project_name: '某互联网企业劳动合规专项', tenderer: '某互联网科技有限公司', bid_amount: 90000, deadline_offset: -30, bid_offset: -35, status: 'won', result_offset: -10, manager_index: 3, remarks: '中标，项目已启动' },
      ];

      for (let i = 0; i < bidConfigs.length; i++) {
        const config = bidConfigs[i];
        const manager = managerPool[config.manager_index];
        const existing = await this.bidRepository.findOne({ where: { project_name: config.project_name, organization_id: orgId } });
        if (!existing) {
          await this.bidRepository.save({
            project_name: config.project_name,
            tenderer: config.tenderer,
            bid_amount: config.bid_amount,
            deadline: new Date(Date.now() + config.deadline_offset * 24 * 60 * 60 * 1000),
            bid_date: config.bid_offset !== null ? new Date(Date.now() + config.bid_offset * 24 * 60 * 60 * 1000) : null,
            status: config.status,
            result_date: config.result_offset !== null ? new Date(Date.now() + config.result_offset * 24 * 60 * 60 * 1000) : null,
            manager_id: manager?.id,
            remarks: config.remarks,
            organization_id: orgId,
          });
        }
      }
    }

    // ===== 15条业绩记录 =====
    const existingBidRecordCount = await this.bidRecordRepository.count({ where: { organization_id: orgId } });
    if (existingBidRecordCount === 0) {
      // 业绩分类：litigation诉讼 / non_litigation非诉 / consultant顾问
      const bidRecordConfigs = [
        { project_name: '某集团合同纠纷诉讼代理', client: '某集团股份有限公司', amount: 850000, start_offset: -400, end_offset: -100, category: 'litigation', description: '代理集团处理重大合同纠纷诉讼，胜诉' },
        { project_name: '某科技公司IPO法律服务', client: '某科技有限公司', amount: 1200000, start_offset: -300, end_offset: -50, category: 'non_litigation', description: '提供IPO全程法律服务，协助企业成功上市' },
        { project_name: '某央企常年法律顾问', client: '某央企集团', amount: 360000, start_offset: -365, end_offset: null, category: 'consultant', description: '年度法律顾问服务，涵盖合规咨询、合同审查等' },
        { project_name: '某地产公司建工纠纷代理', client: '某房地产开发公司', amount: 420000, start_offset: -250, end_offset: -80, category: 'litigation', description: '代理建设工程施工合同纠纷，调解结案' },
        { project_name: '某银行不良资产处置专项', client: '某商业银行', amount: 680000, start_offset: -200, end_offset: -30, category: 'non_litigation', description: '协助银行处置不良资产包，回收率高' },
        { project_name: '某上市公司证券合规顾问', client: '某上市公司', amount: 280000, start_offset: -365, end_offset: null, category: 'consultant', description: '提供证券合规咨询及信息披露指导' },
        { project_name: '某贸易公司债权追收诉讼', client: '某贸易公司', amount: 150000, start_offset: -180, end_offset: -60, category: 'litigation', description: '代理债权追收诉讼，全额回款' },
        { project_name: '某互联网企业股权激励设计', client: '某互联网科技有限公司', amount: 200000, start_offset: -120, end_offset: -20, category: 'non_litigation', description: '设计股权激励方案并协助实施' },
        { project_name: '某保险公司法律顾问服务', client: '某保险股份有限公司', amount: 240000, start_offset: -365, end_offset: null, category: 'consultant', description: '年度法律顾问，处理保险理赔纠纷等' },
        { project_name: '某建设集团工程款仲裁案', client: '某建设集团', amount: 520000, start_offset: -300, end_offset: -90, category: 'litigation', description: '代理工程款仲裁，获得有利裁决' },
        { project_name: '某投资公司并购专项法律服务', client: '某投资公司', amount: 800000, start_offset: -150, end_offset: -40, category: 'non_litigation', description: '提供并购全程法律服务，完成交易交割' },
        { project_name: '某政府部门法律顾问', client: '某市人民政府', amount: 180000, start_offset: -365, end_offset: null, category: 'consultant', description: '为政府部门提供行政法律顾问服务' },
        { project_name: '某物流公司劳动纠纷诉讼', client: '某物流有限公司', amount: 95000, start_offset: -100, end_offset: -30, category: 'litigation', description: '代理劳动争议系列案件，维护企业权益' },
        { project_name: '某科技公司知识产权维权', client: '某科技有限公司', amount: 350000, start_offset: -220, end_offset: -70, category: 'litigation', description: '代理专利侵权诉讼，获得高额赔偿' },
        { project_name: '某医疗机构合规审查专项', client: '某医疗集团', amount: 160000, start_offset: -90, end_offset: -15, category: 'non_litigation', description: '开展全面合规审查并出具整改方案' },
      ];

      for (const config of bidRecordConfigs) {
        const existing = await this.bidRecordRepository.findOne({ where: { project_name: config.project_name, organization_id: orgId } });
        if (!existing) {
          await this.bidRecordRepository.save({
            project_name: config.project_name,
            client: config.client,
            amount: config.amount,
            start_date: new Date(Date.now() + config.start_offset * 24 * 60 * 60 * 1000),
            end_date: config.end_offset !== null ? new Date(Date.now() + config.end_offset * 24 * 60 * 60 * 1000) : null,
            category: config.category,
            description: config.description,
            organization_id: orgId,
          });
        }
      }
    }
  }

  // 尽调种子数据
  private async seedDueDiligence(orgId: string, userMap: Record<string, User>) {
    // 检查尽调表是否已有数据
    const existingDDCount = await this.dueDiligenceRepository.count({ where: { organization_id: orgId } });
    if (existingDDCount > 0) return;

    const lawyerUser = userMap['13800138004'];
    const lawyerUser2 = userMap['13800138008'];
    const orgAdmin = userMap['13800138001'];
    const operatorPool = [lawyerUser, lawyerUser2, orgAdmin];

    // 查询类型：basic基本信息 / shareholder股东信息 / legal法人信息 / financial财务信息 / risk风险信息
    const ddConfigs = [
      {
        company_name: '某科技有限公司',
        query_type: 'basic',
        status: 'completed',
        operator_index: 0,
        report: '企业名称：某科技有限公司；统一社会信用代码：91110000XXXXXXX；注册资本：5000万元；成立日期：2015年6月；企业类型：有限责任公司；经营范围：技术开发、技术咨询、技术服务等。',
      },
      {
        company_name: '某投资集团股份有限公司',
        query_type: 'shareholder',
        status: 'completed',
        operator_index: 1,
        report: '股东信息：第一大股东某国资公司持股45%，第二大股东某基金持股20%，其余为自然人股东。股东结构稳定，无近期股权变动。',
      },
      {
        company_name: '某建设工程有限公司',
        query_type: 'legal',
        status: 'completed',
        operator_index: 2,
        report: '法人信息：法定代表人张某，任职时间2018年至今；同时担任2家企业法定代表人；无失信记录；无法限高记录。',
      },
      {
        company_name: '某商贸有限公司',
        query_type: 'financial',
        status: 'completed',
        operator_index: 0,
        report: '财务概况：2024年度营业收入1.2亿元，净利润800万元；资产总额8500万元，负债总额4200万元；资产负债率49%；经营状况良好。',
      },
      {
        company_name: '某文化传媒有限公司',
        query_type: 'risk',
        status: 'pending',
        operator_index: 1,
        report: '风险信息查询进行中：已发现3条司法案件记录，2条被执行人记录正在核实，1条行政处罚记录待确认详情。',
      },
    ];

    for (let i = 0; i < ddConfigs.length; i++) {
      const config = ddConfigs[i];
      const operator = operatorPool[config.operator_index];
      const existing = await this.dueDiligenceRepository.findOne({ where: { company_name: config.company_name, query_type: config.query_type, organization_id: orgId } });
      if (!existing) {
        // === 新增字段生成 ===
        // 股东信息（JSON序列化）
        const shareholderInfo = JSON.stringify([
          { name: '张三', ratio: '60%', amount: '600万' },
          { name: '李四', ratio: '40%', amount: '400万' },
        ]);
        // 法人信息（JSON序列化）
        const legalRepInfo = JSON.stringify({
          name: '王五',
          position: '法定代表人',
          id_card: '110*****1234',
          phone: '138****5678',
        });
        // 财务信息（JSON序列化）
        const financialInfo = JSON.stringify({
          registered_capital: '1000万',
          paid_capital: '1000万',
          revenue: '5000万',
          profit: '500万',
        });
        // 风险信息（JSON序列化）
        const riskInfo = JSON.stringify({
          litigation_count: 3,
          admin_penalty: 1,
          dishonest_count: 0,
          abnormal_operation: false,
        });
        // 模板ID
        const templateIds = ['standard', 'simple', 'deep'];
        const templateId = templateIds[i % templateIds.length];

        await this.dueDiligenceRepository.save({
          company_name: config.company_name,
          query_type: config.query_type,
          report_content: config.report,
          shareholder_info: shareholderInfo,
          legal_rep_info: legalRepInfo,
          financial_info: financialInfo,
          risk_info: riskInfo,
          template_id: templateId,
          status: config.status,
          operator_id: operator?.id,
          organization_id: orgId,
        });
      }
    }
  }

  // 绘图种子数据
  private async seedDiagrams(orgId: string, userMap: Record<string, User>) {
    // 检查图表表是否已有数据
    const existingDiagramCount = await this.diagramRepository.count({ where: { organization_id: orgId } });
    if (existingDiagramCount > 0) return;

    const lawyerUser = userMap['13800138004'];
    const lawyerUser2 = userMap['13800138008'];
    const orgAdmin = userMap['13800138001'];
    const creatorPool = [lawyerUser, lawyerUser2, orgAdmin];
    const cases = await this.caseRepository.find({ where: { organization_id: orgId }, take: 8 });

    // 图表类型: mindmap思维导图 / flowchart流程图 / relation法律关系图 / organization组织架构
    const diagramConfigs = [
      {
        title: '婚姻纠纷案件思路导图',
        type: 'mindmap',
        case_index: 0,
        creator_index: 0,
        content: { nodes: [
          { id: 'n1', x: 300, y: 50, text: '婚姻纠纷', color: '#5B8FF9' },
          { id: 'n2', x: 150, y: 150, text: '财产分割', color: '#5AD8A6' },
          { id: 'n3', x: 450, y: 150, text: '子女抚养', color: '#5AD8A6' },
          { id: 'n4', x: 80, y: 250, text: '婚前财产', color: '#F6BD16' },
          { id: 'n5', x: 220, y: 250, text: '婚后共同财产', color: '#F6BD16' },
          { id: 'n6', x: 380, y: 250, text: '抚养权', color: '#F6BD16' },
          { id: 'n7', x: 520, y: 250, text: '抚养费', color: '#F6BD16' },
        ], edges: [
          { from: 'n1', to: 'n2', label: '' },
          { from: 'n1', to: 'n3', label: '' },
          { from: 'n2', to: 'n4', label: '' },
          { from: 'n2', to: 'n5', label: '' },
          { from: 'n3', to: 'n6', label: '' },
          { from: 'n3', to: 'n7', label: '' },
        ] },
      },
      {
        title: '民事诉讼流程图',
        type: 'flowchart',
        case_index: 1,
        creator_index: 1,
        content: { nodes: [
          { id: 'n1', x: 300, y: 50, text: '立案', color: '#5B8FF9' },
          { id: 'n2', x: 300, y: 150, text: '受理', color: '#5B8FF9' },
          { id: 'n3', x: 300, y: 250, text: '庭前准备', color: '#5AD8A6' },
          { id: 'n4', x: 300, y: 350, text: '开庭审理', color: '#5AD8A6' },
          { id: 'n5', x: 300, y: 450, text: '判决', color: '#F6BD16' },
          { id: 'n6', x: 500, y: 350, text: '调解', color: '#F6BD16' },
        ], edges: [
          { from: 'n1', to: 'n2', label: '提交材料' },
          { from: 'n2', to: 'n3', label: '7日内' },
          { from: 'n3', to: 'n4', label: '排期' },
          { from: 'n4', to: 'n5', label: '判决' },
          { from: 'n4', to: 'n6', label: '调解' },
        ] },
      },
      {
        title: '交通事故法律关系图',
        type: 'relation',
        case_index: 2,
        creator_index: 0,
        content: { nodes: [
          { id: 'n1', x: 300, y: 50, text: '受害人', color: '#5B8FF9' },
          { id: 'n2', x: 150, y: 150, text: '肇事方', color: '#F6BD16' },
          { id: 'n3', x: 450, y: 150, text: '保险公司', color: '#5AD8A6' },
          { id: 'n4', x: 150, y: 250, text: '车主', color: '#F6BD16' },
          { id: 'n5', x: 450, y: 250, text: '鉴定机构', color: '#5AD8A6' },
        ], edges: [
          { from: 'n1', to: 'n2', label: '侵权' },
          { from: 'n1', to: 'n3', label: '理赔' },
          { from: 'n2', to: 'n4', label: '雇佣' },
          { from: 'n1', to: 'n5', label: '鉴定' },
          { from: 'n3', to: 'n2', label: '代位求偿' },
        ] },
      },
      {
        title: '律所组织架构图',
        type: 'organization',
        case_index: null,
        creator_index: 2,
        content: { nodes: [
          { id: 'n1', x: 300, y: 50, text: '主任', color: '#5B8FF9' },
          { id: 'n2', x: 150, y: 150, text: '管委会', color: '#5B8FF9' },
          { id: 'n3', x: 450, y: 150, text: '监事会', color: '#5B8FF9' },
          { id: 'n4', x: 80, y: 250, text: '诉讼部', color: '#5AD8A6' },
          { id: 'n5', x: 220, y: 250, text: '非诉部', color: '#5AD8A6' },
          { id: 'n6', x: 380, y: 250, text: '行政部', color: '#5AD8A6' },
          { id: 'n7', x: 520, y: 250, text: '财务部', color: '#5AD8A6' },
        ], edges: [
          { from: 'n1', to: 'n2', label: '' },
          { from: 'n1', to: 'n3', label: '' },
          { from: 'n2', to: 'n4', label: '' },
          { from: 'n2', to: 'n5', label: '' },
          { from: 'n2', to: 'n6', label: '' },
          { from: 'n2', to: 'n7', label: '' },
        ] },
      },
      {
        title: '劳动仲裁案件思路导图',
        type: 'mindmap',
        case_index: 3,
        creator_index: 1,
        content: { nodes: [
          { id: 'n1', x: 300, y: 50, text: '劳动仲裁', color: '#5B8FF9' },
          { id: 'n2', x: 150, y: 150, text: '仲裁时效', color: '#5AD8A6' },
          { id: 'n3', x: 450, y: 150, text: '仲裁请求', color: '#5AD8A6' },
          { id: 'n4', x: 80, y: 250, text: '一年时效', color: '#F6BD16' },
          { id: 'n5', x: 380, y: 250, text: '经济补偿', color: '#F6BD16' },
          { id: 'n6', x: 520, y: 250, text: '工资差额', color: '#F6BD16' },
        ], edges: [
          { from: 'n1', to: 'n2', label: '' },
          { from: 'n1', to: 'n3', label: '' },
          { from: 'n2', to: 'n4', label: '' },
          { from: 'n3', to: 'n5', label: '' },
          { from: 'n3', to: 'n6', label: '' },
        ] },
      },
      {
        title: '合同纠纷诉讼流程图',
        type: 'flowchart',
        case_index: 4,
        creator_index: 0,
        content: { nodes: [
          { id: 'n1', x: 300, y: 50, text: '发送律师函', color: '#5B8FF9' },
          { id: 'n2', x: 300, y: 150, text: '协商解决', color: '#5AD8A6' },
          { id: 'n3', x: 200, y: 250, text: '提起诉讼', color: '#F6BD16' },
          { id: 'n4', x: 400, y: 250, text: '达成和解', color: '#5AD8A6' },
          { id: 'n5', x: 200, y: 350, text: '申请执行', color: '#F6BD16' },
        ], edges: [
          { from: 'n1', to: 'n2', label: '' },
          { from: 'n2', to: 'n3', label: '协商不成' },
          { from: 'n2', to: 'n4', label: '协商成功' },
          { from: 'n3', to: 'n5', label: '判决后' },
        ] },
      },
      {
        title: '公司股权结构图',
        type: 'relation',
        case_index: 5,
        creator_index: 2,
        content: { nodes: [
          { id: 'n1', x: 300, y: 50, text: '目标公司', color: '#5B8FF9' },
          { id: 'n2', x: 150, y: 150, text: '大股东A', color: '#5AD8A6' },
          { id: 'n3', x: 300, y: 150, text: '二股东B', color: '#5AD8A6' },
          { id: 'n4', x: 450, y: 150, text: '小股东C', color: '#5AD8A6' },
          { id: 'n5', x: 150, y: 250, text: '子公司D', color: '#F6BD16' },
        ], edges: [
          { from: 'n2', to: 'n1', label: '持股51%' },
          { from: 'n3', to: 'n1', label: '持股30%' },
          { from: 'n4', to: 'n1', label: '持股19%' },
          { from: 'n1', to: 'n5', label: '全资控股' },
        ] },
      },
      {
        title: '案件办理流程图',
        type: 'flowchart',
        case_index: 6,
        creator_index: 1,
        content: { nodes: [
          { id: 'n1', x: 300, y: 50, text: '接收案件', color: '#5B8FF9' },
          { id: 'n2', x: 300, y: 150, text: '案件评估', color: '#5B8FF9' },
          { id: 'n3', x: 300, y: 250, text: '签订合同', color: '#5AD8A6' },
          { id: 'n4', x: 200, y: 350, text: '调查取证', color: '#5AD8A6' },
          { id: 'n5', x: 400, y: 350, text: '法律研究', color: '#5AD8A6' },
          { id: 'n6', x: 300, y: 450, text: '庭审代理', color: '#F6BD16' },
          { id: 'n7', x: 300, y: 550, text: '案件归档', color: '#F6BD16' },
        ], edges: [
          { from: 'n1', to: 'n2', label: '' },
          { from: 'n2', to: 'n3', label: '' },
          { from: 'n3', to: 'n4', label: '' },
          { from: 'n3', to: 'n5', label: '' },
          { from: 'n4', to: 'n6', label: '' },
          { from: 'n5', to: 'n6', label: '' },
          { from: 'n6', to: 'n7', label: '' },
        ] },
      },
    ];

    for (let i = 0; i < diagramConfigs.length; i++) {
      const config = diagramConfigs[i];
      const creator = creatorPool[config.creator_index];
      const caseEntity = config.case_index !== null && cases.length > 0 ? cases[config.case_index % cases.length] : null;
      const existing = await this.diagramRepository.findOne({ where: { title: config.title, organization_id: orgId } });
      if (!existing) {
        await this.diagramRepository.save({
          title: config.title,
          type: config.type,
          content: JSON.stringify(config.content),
          case_id: caseEntity?.id,
          creator_id: creator?.id,
          organization_id: orgId,
        });
      }
    }
  }

  // 催款种子数据
  private async seedPaymentReminders(orgId: string, userMap: Record<string, User>) {
    // 检查催款表是否已有数据
    const existingReminderCount = await this.paymentReminderRepository.count({ where: { organization_id: orgId } });
    if (existingReminderCount > 0) return;

    const cases = await this.caseRepository.find({ where: { organization_id: orgId }, take: 10 });

    // 催款状态：pending待催款 / reminding催款中 / paid已回款 / given_up已放弃
    const reminderConfigs = [
      { client_name: '张女士', client_phone: '13900139001', receivable_amount: 50000, received_amount: 25000, overdue_amount: 25000, reminder_count: 1, last_offset: -7, next_offset: 3, status: 'reminding', case_index: 0, remarks: '二期款项逾期，已电话催收' },
      { client_name: '李先生', client_phone: '13900139002', receivable_amount: 30000, received_amount: 30000, overdue_amount: 0, reminder_count: 2, last_offset: -15, next_offset: null, status: 'paid', case_index: 1, remarks: '已全额回款' },
      { client_name: '某科技有限公司', client_phone: '010-88880001', receivable_amount: 120000, received_amount: 60000, overdue_amount: 60000, reminder_count: 3, last_offset: -3, next_offset: 1, status: 'reminding', case_index: 2, remarks: '顾问费尾款逾期，多次催收' },
      { client_name: '王先生', client_phone: '13900139003', receivable_amount: 15000, received_amount: 0, overdue_amount: 15000, reminder_count: 0, last_offset: null, next_offset: 7, status: 'pending', case_index: 3, remarks: '待开始催收' },
      { client_name: '某建设公司', client_phone: '010-88880005', receivable_amount: 200000, received_amount: 100000, overdue_amount: 100000, reminder_count: 5, last_offset: -30, next_offset: null, status: 'given_up', case_index: 4, remarks: '多次催收无果，暂时搁置' },
      { client_name: '赵先生', client_phone: '13900139004', receivable_amount: 80000, received_amount: 80000, overdue_amount: 0, reminder_count: 1, last_offset: -10, next_offset: null, status: 'paid', case_index: 5, remarks: '已全额回款' },
      { client_name: '某贸易公司', client_phone: '010-88880002', receivable_amount: 45000, received_amount: 20000, overdue_amount: 25000, reminder_count: 2, last_offset: -5, next_offset: 5, status: 'reminding', case_index: 6, remarks: '部分付款，继续催收尾款' },
      { client_name: '孙女士', client_phone: '13900139005', receivable_amount: 55000, received_amount: 0, overdue_amount: 55000, reminder_count: 0, last_offset: null, next_offset: 10, status: 'pending', case_index: 7, remarks: '待开始催收' },
      { client_name: '某投资公司', client_phone: '010-88880004', receivable_amount: 150000, received_amount: 100000, overdue_amount: 50000, reminder_count: 4, last_offset: -2, next_offset: 2, status: 'reminding', case_index: 8, remarks: '尾款催收中' },
      { client_name: '周先生', client_phone: '13900139006', receivable_amount: 65000, received_amount: 65000, overdue_amount: 0, reminder_count: 1, last_offset: -20, next_offset: null, status: 'paid', case_index: 9, remarks: '已全额回款' },
    ];

    for (let i = 0; i < reminderConfigs.length; i++) {
      const config = reminderConfigs[i];
      const caseEntity = cases.length > 0 ? cases[config.case_index % cases.length] : null;
      const existing = await this.paymentReminderRepository.findOne({ where: { client_name: config.client_name, receivable_amount: config.receivable_amount, organization_id: orgId } });
      if (!existing) {
        await this.paymentReminderRepository.save({
          case_id: caseEntity?.id,
          client_name: config.client_name,
          client_phone: config.client_phone,
          receivable_amount: config.receivable_amount,
          received_amount: config.received_amount,
          overdue_amount: config.overdue_amount,
          reminder_count: config.reminder_count,
          last_reminder_date: config.last_offset !== null ? new Date(Date.now() + config.last_offset * 24 * 60 * 60 * 1000) : null,
          next_reminder_date: config.next_offset !== null ? new Date(Date.now() + config.next_offset * 24 * 60 * 60 * 1000) : null,
          status: config.status,
          remarks: config.remarks,
          organization_id: orgId,
        });
      }
    }
  }

  // 发票种子数据
  private async seedInvoices(orgId: string, userMap: Record<string, User>) {
    // 检查发票表是否已有数据
    const existingInvoiceCount = await this.invoiceRepository.count({ where: { organization_id: orgId } });
    if (existingInvoiceCount > 0) return;

    const cases = await this.caseRepository.find({ where: { organization_id: orgId }, take: 15 });
    if (cases.length === 0) return;

    const orgAdmin = userMap['13800138001'];
    // 发票状态：pending待开票 / issued已开票 / paid已付款 / cancelled已作废
    // 发票类型：company企业 / personal个人
    const invoiceConfigs = [
      { amount: 50000, invoice_type: 'company', status: InvoiceStatus.PAID, payer_name: '某科技有限公司', payer_tax_id: '91110000XXXXXXX1', issue_offset: -30, due_offset: -10, buyer: '某科技有限公司', buyer_tax: '91110000XXXXXXX1', seller: '测试律所', tax_rate: 0.06 },
      { amount: 30000, invoice_type: 'company', status: InvoiceStatus.PAID, payer_name: '某商贸有限公司', payer_tax_id: '91110000XXXXXXX2', issue_offset: -25, due_offset: -5, buyer: '某商贸有限公司', buyer_tax: '91110000XXXXXXX2', seller: '测试律所', tax_rate: 0.06 },
      { amount: 15000, invoice_type: 'personal', status: InvoiceStatus.ISSUED, payer_name: '王先生', payer_tax_id: null, issue_offset: -10, due_offset: 10, buyer: '王先生', buyer_tax: null, seller: '测试律所', tax_rate: 0.06 },
      { amount: 80000, invoice_type: 'company', status: InvoiceStatus.ISSUED, payer_name: '某建设集团', payer_tax_id: '91110000XXXXXXX3', issue_offset: -7, due_offset: 23, buyer: '某建设集团', buyer_tax: '91110000XXXXXXX3', seller: '测试律所', tax_rate: 0.06 },
      { amount: 120000, invoice_type: 'company', status: InvoiceStatus.PAID, payer_name: '某投资股份有限公司', payer_tax_id: '91110000XXXXXXX4', issue_offset: -45, due_offset: -15, buyer: '某投资股份有限公司', buyer_tax: '91110000XXXXXXX4', seller: '测试律所', tax_rate: 0.06 },
      { amount: 20000, invoice_type: 'company', status: InvoiceStatus.PENDING, payer_name: '某贸易公司', payer_tax_id: '91110000XXXXXXX5', issue_offset: null, due_offset: null, buyer: '某贸易公司', buyer_tax: '91110000XXXXXXX5', seller: '测试律所', tax_rate: 0.06 },
      { amount: 55000, invoice_type: 'personal', status: InvoiceStatus.ISSUED, payer_name: '孙女士', payer_tax_id: null, issue_offset: -5, due_offset: 25, buyer: '孙女士', buyer_tax: null, seller: '测试律所', tax_rate: 0.06 },
      { amount: 90000, invoice_type: 'company', status: InvoiceStatus.PAID, payer_name: '某科技股份有限公司', payer_tax_id: '91110000XXXXXXX6', issue_offset: -60, due_offset: -30, buyer: '某科技股份有限公司', buyer_tax: '91110000XXXXXXX6', seller: '测试律所', tax_rate: 0.06 },
      { amount: 65000, invoice_type: 'company', status: InvoiceStatus.CANCELLED, payer_name: '某房地产开发公司', payer_tax_id: '91110000XXXXXXX7', issue_offset: -20, due_offset: null, buyer: '某房地产开发公司', buyer_tax: '91110000XXXXXXX7', seller: '测试律所', tax_rate: 0.06, void_reason: '合同作废，发票作废重开', void_offset: -10 },
      { amount: 70000, invoice_type: 'company', status: InvoiceStatus.ISSUED, payer_name: '某金融服务公司', payer_tax_id: '91110000XXXXXXX8', issue_offset: -3, due_offset: 27, buyer: '某金融服务公司', buyer_tax: '91110000XXXXXXX8', seller: '测试律所', tax_rate: 0.06 },
      { amount: 110000, invoice_type: 'company', status: InvoiceStatus.PENDING, payer_name: '某商贸集团', payer_tax_id: '91110000XXXXXXX9', issue_offset: null, due_offset: null, buyer: '某商贸集团', buyer_tax: '91110000XXXXXXX9', seller: '测试律所', tax_rate: 0.06 },
      { amount: 36000, invoice_type: 'personal', status: InvoiceStatus.PAID, payer_name: '陈先生', payer_tax_id: null, issue_offset: -90, due_offset: -60, buyer: '陈先生', buyer_tax: null, seller: '测试律所', tax_rate: 0.06 },
      { amount: 45000, invoice_type: 'company', status: InvoiceStatus.ISSUED, payer_name: '某物流有限公司', payer_tax_id: '91110000XXXX10', issue_offset: -15, due_offset: 15, buyer: '某物流有限公司', buyer_tax: '91110000XXXX10', seller: '测试律所', tax_rate: 0.06 },
      { amount: 180000, invoice_type: 'company', status: InvoiceStatus.PAID, payer_name: '某保险股份有限公司', payer_tax_id: '91110000XXXX11', issue_offset: -75, due_offset: -45, buyer: '某保险股份有限公司', buyer_tax: '91110000XXXX11', seller: '测试律所', tax_rate: 0.06 },
      { amount: 95000, invoice_type: 'company', status: InvoiceStatus.PENDING, payer_name: '某文化传媒公司', payer_tax_id: '91110000XXXX12', issue_offset: null, due_offset: null, buyer: '某文化传媒公司', buyer_tax: '91110000XXXX12', seller: '测试律所', tax_rate: 0.06 },
    ];

    for (let i = 0; i < invoiceConfigs.length; i++) {
      const config = invoiceConfigs[i];
      const caseEntity = cases[i % cases.length];
      const invoiceNo = config.status === InvoiceStatus.PENDING ? null : `FP${new Date().getFullYear()}${String(i + 1).padStart(5, '0')}`;
      const taxAmount = config.amount * config.tax_rate;
      const totalAmount = config.amount + taxAmount;
      const existing = await this.invoiceRepository.findOne({ where: { case_id: caseEntity.id, amount: config.amount, invoice_type: config.invoice_type } });
      if (!existing) {
        // === 新增字段生成 ===
        // 冲红原因和日期（作废发票填冲红信息）
        const isCancelled = config.status === InvoiceStatus.CANCELLED;
        const redFlushReason = isCancelled ? '开票信息错误' : null;
        const redFlushDate = isCancelled && config.void_offset
          ? new Date(Date.now() + config.void_offset * 24 * 60 * 60 * 1000)
          : null;
        // 退款金额和日期（少数发票有退款）
        const hasRefund = i % 5 === 0 && config.status !== InvoiceStatus.PENDING;
        const refundAmount = hasRefund ? Math.round(config.amount * 0.1) : 0;
        const refundDate = hasRefund && config.issue_offset !== null
          ? new Date(Date.now() + config.issue_offset * 24 * 60 * 60 * 1000 + 5 * 24 * 60 * 60 * 1000)
          : null;
        // 税盘编号
        const taxDiskNos = ['税盘001', '税盘002'];
        const taxDiskNo = taxDiskNos[i % taxDiskNos.length];
        // 调账记录（部分发票有调账）
        const hasAdjustment = i % 3 === 0 && config.status !== InvoiceStatus.PENDING;
        const adjustmentRecords = hasAdjustment
          ? JSON.stringify([{ time: new Date(Date.now() + (config.issue_offset || 0) * 24 * 60 * 60 * 1000 + 7 * 24 * 60 * 60 * 1000).toISOString(), reason: '科目调整', amount: taxAmount, operator_id: orgAdmin?.id }])
          : null;

        await this.invoiceRepository.save({
          case_id: caseEntity.id,
          amount: config.amount,
          invoice_no: invoiceNo,
          status: config.status,
          invoice_type: config.invoice_type,
          payer_name: config.payer_name,
          payer_tax_id: config.payer_tax_id,
          payer_address: null,
          payer_bank: null,
          payer_account: null,
          issue_date: config.issue_offset !== null ? new Date(Date.now() + config.issue_offset * 24 * 60 * 60 * 1000) : null,
          due_date: config.due_offset !== null ? new Date(Date.now() + config.due_offset * 24 * 60 * 60 * 1000) : null,
          notes: '种子数据发票',
          buyer_name: config.buyer,
          buyer_tax_no: config.buyer_tax,
          buyer_address: null,
          buyer_phone: null,
          buyer_bank: null,
          buyer_account: null,
          seller_name: config.seller,
          seller_tax_no: '91110000XXXXXX00',
          tax_rate: config.tax_rate,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          void_reason: config.void_reason || null,
          void_date: config.void_offset ? new Date(Date.now() + config.void_offset * 24 * 60 * 60 * 1000) : null,
          red_flush_reason: redFlushReason,
          red_flush_date: redFlushDate,
          refund_amount: refundAmount,
          refund_date: refundDate,
          tax_disk_no: taxDiskNo,
          adjustment_records: adjustmentRecords,
          organization_id: orgId,
        });
      }
    }
  }

  // 业务款种子数据
  private async seedBusinessFunds(orgId: string, userMap: Record<string, User>) {
    // 检查业务款表是否已有数据
    const existingFundCount = await this.businessFundRepository.count({ where: { organization_id: orgId } });
    if (existingFundCount > 0) return;

    const cases = await this.caseRepository.find({ where: { organization_id: orgId }, take: 10 });
    if (cases.length === 0) return;

    // 类型：income收入 / expense支出
    // 分类：lawyer_fee律师费 / agency_fee代理费 / preservation_fee保全费 / appraisal_fee鉴定费 / other其他
    const fundConfigs = [
      { type: 'income', category: 'lawyer_fee', amount: 50000, payer: '张女士', payee: '测试律所', payment_offset: -30, method: 'bank_transfer', case_index: 0, remarks: '婚姻案件律师费' },
      { type: 'income', category: 'lawyer_fee', amount: 30000, payer: '李先生', payee: '测试律所', payment_offset: -25, method: 'alipay', case_index: 1, remarks: '交通事故案件律师费' },
      { type: 'income', category: 'agency_fee', amount: 15000, payer: '王先生', payee: '测试律所', payment_offset: -20, method: 'wechat', case_index: 2, remarks: '劳动仲裁代理费' },
      { type: 'income', category: 'lawyer_fee', amount: 80000, payer: '赵先生', payee: '测试律所', payment_offset: -45, method: 'bank_transfer', case_index: 3, remarks: '债务纠纷律师费' },
      { type: 'income', category: 'lawyer_fee', amount: 120000, payer: '某科技有限公司', payee: '测试律所', payment_offset: -60, method: 'bank_transfer', case_index: 4, remarks: '企业顾问年度费用' },
      { type: 'income', category: 'lawyer_fee', amount: 55000, payer: '孙女士', payee: '测试律所', payment_offset: -15, method: 'bank_transfer', case_index: 5, remarks: '医疗纠纷律师费' },
      { type: 'income', category: 'lawyer_fee', amount: 90000, payer: '某科技公司', payee: '测试律所', payment_offset: -10, method: 'bank_transfer', case_index: 6, remarks: '知识产权案件律师费' },
      { type: 'income', category: 'lawyer_fee', amount: 70000, payer: '吴先生', payee: '测试律所', payment_offset: -5, method: 'alipay', case_index: 7, remarks: '刑事辩护律师费' },
      { type: 'income', category: 'agency_fee', amount: 200000, payer: '某建设公司', payee: '测试律所', payment_offset: -90, method: 'bank_transfer', case_index: 8, remarks: '建工纠纷代理费' },
      { type: 'income', category: 'lawyer_fee', amount: 36000, payer: '陈先生', payee: '测试律所', payment_offset: -100, method: 'wechat', case_index: 9, remarks: '私人顾问年度费用' },
      { type: 'expense', category: 'preservation_fee', amount: 2300, payer: '测试律所', payee: '法院', payment_offset: -28, method: 'bank_transfer', case_index: 0, remarks: '婚姻案件保全费' },
      { type: 'expense', category: 'appraisal_fee', amount: 3500, payer: '测试律所', payee: '某鉴定机构', payment_offset: -22, method: 'bank_transfer', case_index: 1, remarks: '交通事故伤残鉴定费' },
      { type: 'expense', category: 'preservation_fee', amount: 1800, payer: '测试律所', payee: '仲裁委', payment_offset: -18, method: 'bank_transfer', case_index: 2, remarks: '劳动仲裁受理费' },
      { type: 'expense', category: 'other', amount: 5000, payer: '测试律所', payee: '某公证处', payment_offset: -40, method: 'bank_transfer', case_index: 3, remarks: '债务公证费用' },
      { type: 'expense', category: 'other', amount: 8000, payer: '测试律所', payee: '某评估公司', payment_offset: -55, method: 'bank_transfer', case_index: 4, remarks: '企业资产评估费' },
      { type: 'expense', category: 'appraisal_fee', amount: 12000, payer: '测试律所', payee: '某司法鉴定中心', payment_offset: -12, method: 'bank_transfer', case_index: 5, remarks: '医疗过错鉴定费' },
      { type: 'expense', category: 'preservation_fee', amount: 4500, payer: '测试律所', payee: '法院', payment_offset: -8, method: 'bank_transfer', case_index: 6, remarks: '知识产权保全费' },
      { type: 'expense', category: 'other', amount: 2000, payer: '测试律所', payee: '某翻译公司', payment_offset: -3, method: 'alipay', case_index: 7, remarks: '案件材料翻译费' },
      { type: 'expense', category: 'appraisal_fee', amount: 15000, payer: '测试律所', payee: '某工程造价公司', payment_offset: -85, method: 'bank_transfer', case_index: 8, remarks: '工程造价鉴定费' },
      { type: 'expense', category: 'other', amount: 1500, payer: '测试律所', payee: '某档案馆', payment_offset: -95, method: 'wechat', case_index: 9, remarks: '档案查询费' },
    ];

    for (let i = 0; i < fundConfigs.length; i++) {
      const config = fundConfigs[i];
      const caseEntity = cases[config.case_index % cases.length];
      const existing = await this.businessFundRepository.findOne({ where: { type: config.type, category: config.category, amount: config.amount, organization_id: orgId } });
      if (!existing) {
        // === 新增字段生成 ===
        // 入账状态（收入类轮换，支出类默认已入账）
        const accountStatus = config.type === 'income'
          ? (i % 3 === 0 ? 'pending' : 'accounted')
          : 'accounted';
        // 入账时间（已入账的状态填）
        const accountTime = accountStatus === 'accounted'
          ? new Date(Date.now() + config.payment_offset * 24 * 60 * 60 * 1000 + 1 * 24 * 60 * 60 * 1000)
          : null;
        // 分账记录（仅收入类填写）
        const allocationRecords = config.type === 'income'
          ? JSON.stringify([
              { role: '主办律师', amount: Math.round(config.amount * 0.7) },
              { role: '律所', amount: Math.round(config.amount * 0.3) },
            ])
          : null;
        // 税费分摊（收入类按6%计算）
        const taxShare = config.type === 'income' ? Math.round(config.amount * 0.06) : 0;
        // 质保金（收入类1000-3000）
        const qualityDeposit = config.type === 'income' ? 1000 + (i * 200) % 2001 : 0;

        await this.businessFundRepository.save({
          case_id: caseEntity.id,
          type: config.type,
          category: config.category,
          amount: config.amount,
          payer: config.payer,
          payee: config.payee,
          payment_date: new Date(Date.now() + config.payment_offset * 24 * 60 * 60 * 1000),
          payment_method: config.method,
          remarks: config.remarks,
          account_status: accountStatus,
          account_time: accountTime,
          allocation_records: allocationRecords,
          tax_share: taxShare,
          quality_deposit: qualityDeposit,
          organization_id: orgId,
        });
      }
    }
  }

  // 利冲检索种子数据
  private async seedConflictChecks(orgId: string, userMap: Record<string, User>) {
    // 检查利冲检索表是否已有数据
    const existingCheckCount = await this.conflictCheckRepository.count({ where: { organization_id: orgId } });
    if (existingCheckCount > 0) return;

    const lawyerUser = userMap['13800138004'];
    const lawyerUser2 = userMap['13800138008'];
    const salesUser = userMap['13800138003'];
    const orgAdmin = userMap['13800138001'];
    const checkerPool = [lawyerUser, lawyerUser2, salesUser];
    const cases = await this.caseRepository.find({ where: { organization_id: orgId }, take: 5 });

    // 检索结果：clear无冲突 / warning有风险 / conflict有冲突
    const checkConfigs = [
      { party_name: '张女士', opposing_party: '李某', party_phone: '13900139001', check_result: 'clear', conflict_detail: null, case_index: 0, checker_index: 0 },
      { party_name: '某科技有限公司', opposing_party: '某商贸有限公司', party_phone: '010-88880001', check_result: 'warning', conflict_detail: '检索到对方当事人曾与本所客户存在关联交易记录，建议进一步核实。', case_index: 1, checker_index: 1 },
      { party_name: '王先生', opposing_party: '赵某', party_phone: '13900139003', check_result: 'clear', conflict_detail: null, case_index: 2, checker_index: 0 },
      { party_name: '某建设集团', opposing_party: '某房地产开发公司', party_phone: '010-88880005', check_result: 'conflict', conflict_detail: '检索到对方当事人某房地产开发公司为本所现有客户，存在利益冲突，不得代理。', case_index: 3, checker_index: 2 },
      { party_name: '孙女士', opposing_party: '某医院', party_phone: '13900139005', check_result: 'clear', conflict_detail: null, case_index: 4, checker_index: 1 },
    ];

    for (let i = 0; i < checkConfigs.length; i++) {
      const config = checkConfigs[i];
      const checker = checkerPool[config.checker_index];
      const caseEntity = cases.length > 0 ? cases[config.case_index % cases.length] : null;
      const existing = await this.conflictCheckRepository.findOne({ where: { party_name: config.party_name, opposing_party: config.opposing_party, organization_id: orgId } });
      if (!existing) {
        // === 新增字段生成 ===
        // 本案角色
        const partyRoles = ['client', 'opposing'];
        const partyRole = partyRoles[i % partyRoles.length];
        // 冲突项目名称（仅冲突/风险记录填写）
        const conflictCaseName = config.check_result !== 'clear' ? `${config.opposing_party}合同纠纷案` : null;
        // 审批状态（clear->approved, warning->pending, conflict->rejected）
        const approvalStatusMap: Record<string, string> = {
          clear: 'approved',
          warning: 'pending',
          conflict: 'rejected',
        };
        const approvalStatus = approvalStatusMap[config.check_result] || 'pending';
        // 业务主管ID
        const supervisorId = orgAdmin?.id;
        // 所属团队
        const teamList = ['团队A', '团队B', '团队C'];
        const teamId = teamList[i % teamList.length];

        await this.conflictCheckRepository.save({
          case_id: caseEntity?.id,
          party_name: config.party_name,
          opposing_party: config.opposing_party,
          party_phone: config.party_phone,
          check_result: config.check_result,
          conflict_detail: config.conflict_detail,
          party_role: partyRole,
          conflict_case_name: conflictCaseName,
          approval_status: approvalStatus,
          supervisor_id: supervisorId,
          team_id: teamId,
          checker_id: checker?.id,
          organization_id: orgId,
        });
      }
    }
  }

  // 客户档案种子数据
  private async seedClientProfiles(orgId: string, userMap: Record<string, User>) {
    // 检查客户档案表是否已有数据
    const existingCount = await this.clientProfileRepository.count({ where: { organization_id: orgId } });
    if (existingCount > 0) return;

    // 从已创建的案件中提取不重复的客户信息
    const cases = await this.caseRepository.find({ where: { organization_id: orgId }, take: 20 });
    if (cases.length === 0) return;

    // 提取不重复的 client_name 和 client_phone
    const clientMap = new Map<string, { name: string; phone: string }>();
    for (const c of cases) {
      if (c.client_name && c.client_phone && !clientMap.has(c.client_name)) {
        clientMap.set(c.client_name, { name: c.client_name, phone: c.client_phone });
      }
    }

    const sources = ['线上咨询', '老客户介绍', '律所推广', '朋友推荐'];
    const valueLevels = ['high', 'medium', 'low'];
    const addresses = [
      '北京市朝阳区建国路88号',
      '北京市海淀区中关村大街1号',
      '北京市西城区西直门外大街18号',
      '北京市东城区东直门内大街5号',
      '北京市丰台区南三环西路6号',
    ];
    const enterpriseContacts = ['张总', '李经理', '王主任', '赵总监', '陈主管'];

    let count = 0;
    for (const [, client] of clientMap) {
      if (count >= 15) break;
      // 检查是否已存在
      const existing = await this.clientProfileRepository.findOne({ where: { name: client.name, organization_id: orgId } });
      if (!existing) {
        // 客户类型（包含"公司"为企业，否则为个人）
        const isEnterprise = client.name.includes('公司');
        const type = isEnterprise ? 'enterprise' : 'individual';
        // 联系人（个人类型用客户名，企业类型生成联系人名）
        const contactName = isEnterprise ? enterpriseContacts[count % enterpriseContacts.length] : client.name;
        // 邮箱（部分生成，使用客户编号避免中文邮箱）
        const email = count % 2 === 0 ? `client${count + 1}@example.com` : null;
        // 地址
        const address = addresses[count % addresses.length];
        // 客户来源
        const source = sources[count % sources.length];
        // 价值等级
        const valueLevel = valueLevels[count % valueLevels.length];
        // 满意度3-5
        const satisfaction = 3 + (count % 3);
        // 备注（部分填写）
        const remarks = count % 3 === 0 ? 'VIP客户' : count % 4 === 0 ? '长期合作' : null;

        await this.clientProfileRepository.save({
          name: client.name,
          type,
          contact_name: contactName,
          phone: client.phone,
          email,
          address,
          source,
          value_level: valueLevel,
          satisfaction,
          remarks,
          organization_id: orgId,
        });
        count++;
      }
    }
  }

  // ==================== HR模块种子数据 ====================

  // 请假数据：10条不同类型和状态的请假记录
  private async seedHrLeaves(orgId: string, userMap: Record<string, User>) {
    const existingCount = await this.hrLeaveRepository.count({ where: { organization_id: orgId } });
    if (existingCount > 0) return;

    const users = Object.values(userMap);
    if (users.length === 0) return;

    const leaveConfigs = [
      { leave_type: 'personal', days: 1, reason: '处理家庭事务', status: 'approved' },
      { leave_type: 'sick', days: 2, reason: '感冒发烧需要休息', status: 'approved' },
      { leave_type: 'annual', days: 5, reason: '年度休假', status: 'pending' },
      { leave_type: 'personal', days: 1, reason: '办理证件', status: 'pending' },
      { leave_type: 'sick', days: 3, reason: '医院检查', status: 'rejected' },
      { leave_type: 'annual', days: 7, reason: '旅游度假', status: 'approved' },
      { leave_type: 'personal', days: 0.5, reason: '处理私人事务', status: 'cancelled' },
      { leave_type: 'maternity', days: 30, reason: '产假', status: 'approved' },
      { leave_type: 'sick', days: 1, reason: '牙痛就医', status: 'pending' },
      { leave_type: 'other', days: 2, reason: '其他事由', status: 'approved' },
    ];

    let count = 0;
    for (const config of leaveConfigs) {
      const user = users[count % users.length];
      const startDate = new Date(Date.now() - (count - 5) * 24 * 60 * 60 * 1000);
      const endDate = new Date(startDate.getTime() + config.days * 24 * 60 * 60 * 1000);
      const startStr = startDate.toISOString().slice(0, 10);
      const endStr = endDate.toISOString().slice(0, 10);

      const leaveData: Partial<HrLeave> = {
        user_id: user.id,
        leave_type: config.leave_type,
        start_date: startStr,
        end_date: endStr,
        days: config.days,
        reason: config.reason,
        status: config.status,
        organization_id: orgId,
      };

      // 已审批的记录添加审批信息
      if (config.status === 'approved' || config.status === 'rejected') {
        const approver = users[(count + 1) % users.length];
        leaveData.approver_id = approver.id;
        leaveData.approve_comment = config.status === 'approved' ? '同意请假' : '事由不充分';
        leaveData.approve_time = new Date(Date.now() - count * 60 * 60 * 1000);
      }

      await this.hrLeaveRepository.save(leaveData);
      count++;
    }
  }

  // 考勤数据：最近30天的考勤记录
  private async seedAttendances(orgId: string, userMap: Record<string, User>) {
    const existingCount = await this.attendanceRepository.count({ where: { organization_id: orgId } });
    if (existingCount > 0) return;

    const users = Object.values(userMap).filter(u => u.role !== 'client');
    if (users.length === 0) return;

    // 为每个用户生成最近30天的考勤记录
    for (const user of users) {
      for (let i = 0; i < 30; i++) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dayOfWeek = date.getDay();
        // 周末不生成考勤
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;

        const dateStr = date.toISOString().slice(0, 10);
        // 随机生成打卡时间和状态
        const isLate = i % 7 === 0;
        const isEarlyLeave = i % 11 === 0;
        const clockInHour = isLate ? 9 : 8;
        const clockInMinute = isLate ? 30 : 50 + Math.floor(Math.random() * 10);
        const clockOutHour = isEarlyLeave ? 17 : 18;
        const clockOutMinute = isEarlyLeave ? 30 : Math.floor(Math.random() * 30);

        const clockInTime = new Date(date);
        clockInTime.setHours(clockInHour, clockInMinute, 0, 0);
        const clockOutTime = new Date(date);
        clockOutTime.setHours(clockOutHour, clockOutMinute, 0, 0);

        const diffMs = clockOutTime.getTime() - clockInTime.getTime();
        const workHours = Math.round((diffMs / (60 * 60 * 1000)) * 10) / 10;

        let status: string = AttendanceStatus.NORMAL;
        if (isLate) status = AttendanceStatus.LATE;
        else if (isEarlyLeave) status = AttendanceStatus.EARLY_LEAVE;

        await this.attendanceRepository.save({
          user_id: user.id,
          attendance_date: dateStr,
          clock_in_time: clockInTime,
          clock_out_time: clockOutTime,
          status,
          work_hours: workHours,
          remarks: '',
          organization_id: orgId,
        });
      }
    }
  }

  // 物品申购数据：8条不同类型和状态的记录
  private async seedMaterials(orgId: string, userMap: Record<string, User>) {
    const existingCount = await this.materialRepository.count({ where: { organization_id: orgId } });
    if (existingCount > 0) return;

    const users = Object.values(userMap);
    if (users.length === 0) return;

    const materialConfigs = [
      { material_name: '签字笔', quantity: 50, unit: '支', type: 'purchase', purpose: '办公用笔', status: 'fulfilled' },
      { material_name: 'A4打印纸', quantity: 20, unit: '箱', type: 'purchase', purpose: '打印文件', status: 'approved' },
      { material_name: '文件夹', quantity: 30, unit: '个', type: 'receive', purpose: '案件归档', status: 'fulfilled' },
      { material_name: '订书机', quantity: 5, unit: '个', type: 'purchase', purpose: '装订文件', status: 'pending' },
      { material_name: '计算器', quantity: 3, unit: '个', type: 'purchase', purpose: '财务计算', status: 'pending' },
      { material_name: '便利贴', quantity: 100, unit: '本', type: 'receive', purpose: '办公记录', status: 'rejected' },
      { material_name: '白板笔', quantity: 20, unit: '支', type: 'purchase', purpose: '会议室白板用', status: 'approved' },
      { material_name: '文件柜', quantity: 2, unit: '个', type: 'purchase', purpose: '存放案件资料', status: 'fulfilled' },
    ];

    let count = 0;
    for (const config of materialConfigs) {
      const user = users[count % users.length];
      const materialData: Partial<MaterialRequisition> = {
        user_id: user.id,
        material_name: config.material_name,
        quantity: config.quantity,
        unit: config.unit,
        type: config.type,
        purpose: config.purpose,
        status: config.status,
        organization_id: orgId,
      };

      // 已审批的记录添加审批信息
      if (config.status === 'approved' || config.status === 'rejected' || config.status === 'fulfilled') {
        const approver = users[(count + 1) % users.length];
        materialData.approver_id = approver.id;
        materialData.approve_comment = config.status === 'rejected' ? '库存充足暂不需要' : '同意';
        materialData.approve_time = new Date(Date.now() - count * 60 * 60 * 1000);
      }

      await this.materialRepository.save(materialData);
      count++;
    }
  }

  // 活动数据：5条活动记录
  private async seedHrActivities(orgId: string, userMap: Record<string, User>) {
    const existingCount = await this.hrActivityRepository.count({ where: { organization_id: orgId } });
    if (existingCount > 0) return;

    const users = Object.values(userMap);
    if (users.length === 0) return;
    const organizer = users[0];

    const activityConfigs = [
      {
        title: '法律实务培训',
        description: '邀请资深律师分享最新法律实务经验',
        activity_type: 'training',
        location: '会议室A',
        max_participants: 30,
        offsetDays: -5,
        duration: 2,
        status: 'completed',
        registered: 15,
      },
      {
        title: '团队建设活动',
        description: '户外拓展训练，增强团队凝聚力',
        activity_type: 'team_building',
        location: '户外拓展基地',
        max_participants: 50,
        offsetDays: 7,
        duration: 8,
        status: 'upcoming',
        registered: 20,
      },
      {
        title: '月度总结会议',
        description: '本月工作总结及下月计划',
        activity_type: 'meeting',
        location: '大会议室',
        max_participants: 0,
        offsetDays: 3,
        duration: 2,
        status: 'upcoming',
        registered: 8,
      },
      {
        title: '合同法专题培训',
        description: '合同法最新修订内容解读',
        activity_type: 'training',
        location: '会议室B',
        max_participants: 20,
        offsetDays: -2,
        duration: 3,
        status: 'completed',
        registered: 18,
      },
      {
        title: '年度团建聚餐',
        description: '年度团队聚餐活动',
        activity_type: 'team_building',
        location: '海底捞火锅',
        max_participants: 40,
        offsetDays: 14,
        duration: 3,
        status: 'upcoming',
        registered: 25,
      },
    ];

    let count = 0;
    for (const config of activityConfigs) {
      const startTime = new Date(Date.now() + config.offsetDays * 24 * 60 * 60 * 1000);
      startTime.setHours(14, 0, 0, 0);
      const endTime = new Date(startTime.getTime() + config.duration * 60 * 60 * 1000);

      const activity = await this.hrActivityRepository.save({
        title: config.title,
        description: config.description,
        activity_type: config.activity_type,
        start_time: startTime,
        end_time: endTime,
        location: config.location,
        organizer_id: organizer.id,
        max_participants: config.max_participants,
        registered_count: config.registered,
        status: config.status,
        organization_id: orgId,
      });

      // 为已报名的活动创建报名记录
      for (let i = 0; i < config.registered && i < users.length; i++) {
        await this.activityRegistrationRepository.save({
          activity_id: activity.id,
          user_id: users[i].id,
        });
      }
      count++;
    }
  }

  // 同事圆动态种子数据
  private async seedSocialPosts(orgId: string, userMap: Record<string, User>) {
    const existingCount = await this.socialPostRepository.count({ where: { organization_id: orgId } });
    if (existingCount > 0) return;

    const users = Object.values(userMap);
    if (users.length === 0) return;

    // 15条动态配置（覆盖4种类型）
    const postConfigs = [
      { content: '今天处理了一起合同纠纷案件，客户对结果很满意。', post_type: PostType.CASE_SHARE, offsetHours: -2 },
      { content: '分享一个办案小技巧：证据整理时按时间线排序会更清晰。', post_type: PostType.EXPERIENCE, offsetHours: -5 },
      { content: '新的一年，继续努力为客户提供优质法律服务。', post_type: PostType.NORMAL, offsetHours: -8 },
      { content: '关于民法典婚姻家庭编的几点实务理解，与大家交流。', post_type: PostType.KNOWLEDGE, offsetHours: -12 },
      { content: '今天成功调解了一起劳动争议，双方都满意。', post_type: PostType.CASE_SHARE, offsetHours: -24 },
      { content: '建议大家关注最新司法解释的变化。', post_type: PostType.KNOWLEDGE, offsetHours: -30 },
      { content: '办案过程中与客户的沟通技巧很重要。', post_type: PostType.EXPERIENCE, offsetHours: -36 },
      { content: '今天参加了一场法律实务培训，收获颇丰。', post_type: PostType.NORMAL, offsetHours: -48 },
      { content: '一起民间借贷案件的代理思路分享。', post_type: PostType.CASE_SHARE, offsetHours: -60 },
      { content: '合同审查中常见的风险点总结。', post_type: PostType.KNOWLEDGE, offsetHours: -72 },
      { content: '如何提高庭审中的临场应变能力。', post_type: PostType.EXPERIENCE, offsetHours: -84 },
      { content: '本周工作顺利结束，周末愉快。', post_type: PostType.NORMAL, offsetHours: -96 },
      { content: '知识产权案件的取证要点。', post_type: PostType.KNOWLEDGE, offsetHours: -108 },
      { content: '一起交通事故案件的赔偿计算分享。', post_type: PostType.CASE_SHARE, offsetHours: -120 },
      { content: '时间管理对律师的重要性。', post_type: PostType.EXPERIENCE, offsetHours: -132 },
    ];

    // 评论内容模板
    const commentTemplates = [
      '说得好，学习了',
      '感谢分享',
      '很有启发',
      '这个观点很独特',
      '收藏了',
      '期待更多分享',
      '深有同感',
      '受益匪浅',
    ];

    for (let i = 0; i < postConfigs.length; i++) {
      const config = postConfigs[i];
      const author = users[i % users.length];
      const createdAt = new Date(Date.now() + config.offsetHours * 60 * 60 * 1000);

      const post = await this.socialPostRepository.save({
        user_id: author.id,
        content: config.content,
        post_type: config.post_type,
        view_count: Math.floor(Math.random() * 50) + 5,
        like_count: 0,
        comment_count: 0,
        organization_id: orgId,
        created_at: createdAt,
        updated_at: createdAt,
      });

      // 为每条动态生成0-5条评论
      const commentCount = Math.floor(Math.random() * 6);
      for (let j = 0; j < commentCount; j++) {
        const commenter = users[(i + j + 1) % users.length];
        const commentTime = new Date(createdAt.getTime() + (j + 1) * 30 * 60 * 1000);
        await this.socialCommentRepository.save({
          post_id: post.id,
          user_id: commenter.id,
          content: commentTemplates[j % commentTemplates.length],
          organization_id: orgId,
          created_at: commentTime,
        });
      }
      // 更新评论数
      if (commentCount > 0) {
        await this.socialPostRepository.update(post.id, { comment_count: commentCount });
      }

      // 为每条动态生成0-10个点赞
      const likeCount = Math.floor(Math.random() * 11);
      for (let j = 0; j < likeCount && j < users.length; j++) {
        const liker = users[(i + j + 2) % users.length];
        try {
          await this.socialLikeRepository.save({
            post_id: post.id,
            user_id: liker.id,
            organization_id: orgId,
            created_at: new Date(createdAt.getTime() + j * 60 * 1000),
          });
        } catch {
          // 跳过重复点赞（唯一约束）
        }
      }
      // 更新点赞数
      if (likeCount > 0) {
        await this.socialPostRepository.update(post.id, { like_count: likeCount });
      }
    }
  }

  // 邮件种子数据
  private async seedMails(orgId: string, userMap: Record<string, User>) {
    const existingCount = await this.mailRepository.count({ where: { organization_id: orgId } });
    if (existingCount > 0) return;

    const users = Object.values(userMap);
    if (users.length < 2) return;

    // 20条邮件配置（inbox/sent/draft/trash混合）
    const mailConfigs = [
      { subject: '关于合同纠纷案件的进展通知', content: '您好，您委托的合同纠纷案件已进入证据交换阶段，请关注后续通知。', type: MailType.INBOX, is_read: true, is_starred: false, offsetDays: -1 },
      { subject: '本月工作汇报', content: '附件为本月工作总结，请查阅。本月共处理案件15件，新增客户8位。', type: MailType.SENT, is_read: true, is_starred: false, offsetDays: -2 },
      { subject: '案件材料补充通知', content: '请补充提供身份证复印件和银行卡流水记录。', type: MailType.INBOX, is_read: false, is_starred: true, offsetDays: -3 },
      { subject: '关于团队培训的通知', content: '本周五下午2点在会议室A举行法律实务培训，请准时参加。', type: MailType.INBOX, is_read: true, is_starred: false, offsetDays: -5 },
      { subject: '法律意见书初稿', content: '这是关于股权转让的法律意见书初稿，请审阅。', type: MailType.DRAFT, is_read: false, is_starred: false, offsetDays: -6 },
      { subject: '客户咨询回复', content: '关于您咨询的离婚财产分割问题，以下是我的专业建议...', type: MailType.SENT, is_read: true, is_starred: false, offsetDays: -7 },
      { subject: '案件归档提醒', content: '您有3个已结案案件待归档，请及时处理。', type: MailType.INBOX, is_read: false, is_starred: false, offsetDays: -8 },
      { subject: '本月账单', content: '本月律所账单已生成，请查看附件。', type: MailType.INBOX, is_read: true, is_starred: true, offsetDays: -10 },
      { subject: '合同审查意见', content: '关于合同的审查意见详见正文...', type: MailType.DRAFT, is_read: false, is_starred: false, offsetDays: -12 },
      { subject: '案件跟进提醒', content: '张三诉李四合同纠纷案将于下周三开庭，请做好准备。', type: MailType.INBOX, is_read: true, is_starred: false, offsetDays: -14 },
      { subject: '工作日志提交通知', content: '请于每周五下班前提交本周工作日志。', type: MailType.INBOX, is_read: true, is_starred: false, offsetDays: -15 },
      { subject: '关于调整提成比例的通知', content: '经律所研究决定，自下月起调整案件提成比例...', type: MailType.INBOX, is_read: false, is_starred: true, offsetDays: -18 },
      { subject: '客户回访记录', content: '今日回访了5位老客户，均表示满意。', type: MailType.SENT, is_read: true, is_starred: false, offsetDays: -20 },
      { subject: '法律检索报告', content: '关于XX问题的法律检索报告，请查收。', type: MailType.SENT, is_read: true, is_starred: false, offsetDays: -22 },
      { subject: '旧邮件已清理', content: '这封邮件已被移到已删除。', type: MailType.TRASH, is_read: true, is_starred: false, offsetDays: -25 },
      { subject: '会议纪要', content: '本周律所例会纪要，请各位同事查阅。', type: MailType.INBOX, is_read: true, is_starred: false, offsetDays: -26 },
      { subject: '草稿：答辩状', content: '（草稿未完成）答辩意见如下...', type: MailType.DRAFT, is_read: false, is_starred: false, offsetDays: -28 },
      { subject: '案件费用报销', content: '本月案件差旅费报销清单，请审批。', type: MailType.SENT, is_read: true, is_starred: false, offsetDays: -30 },
      { subject: '过期通知', content: '这封邮件已过期，已移到已删除。', type: MailType.TRASH, is_read: true, is_starred: false, offsetDays: -35 },
      { subject: '新年贺词', content: '祝各位同事新年快乐，工作顺利！', type: MailType.INBOX, is_read: true, is_starred: false, offsetDays: -40 },
    ];

    for (let i = 0; i < mailConfigs.length; i++) {
      const config = mailConfigs[i];
      const sender = users[i % users.length];
      const recipient = users[(i + 1) % users.length];
      const sentTime = new Date(Date.now() + config.offsetDays * 24 * 60 * 60 * 1000);

      const mailData: Partial<Mail> = {
        sender_id: sender.id,
        recipient_ids: JSON.stringify([recipient.id]),
        cc_ids: null,
        subject: config.subject,
        content: config.content,
        attachments: null,
        is_read: config.is_read,
        is_starred: config.is_starred,
        mail_type: config.type,
        sent_time: config.type === MailType.DRAFT ? null : sentTime,
        organization_id: orgId,
      };

      await this.mailRepository.save(mailData);
    }
  }


}
