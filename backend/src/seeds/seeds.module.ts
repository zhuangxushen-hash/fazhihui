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
import { MarketingMaterial } from '../marketing/marketing-material.entity';
import * as bcrypt from 'bcryptjs';
import { UserRole, LeadSource, LeadStatus, CaseType, CaseStatus, ComplianceType, ComplianceResult, ComplaintType, ComplaintStatus, FeeRole } from '../types';
import { ContentStatus, PlatformType } from '../compliance/marketing-content.entity';
import { SalesChannel, SalesCheckResult } from '../compliance/sales-compliance.entity';
import { SigningStatus } from '../compliance/signing-compliance.entity';

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
    MarketingMaterial,
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
    await this.seedMarketingMaterials(orgId, userMap);
    await this.seedMarketingContents(orgId, userMap);
    await this.seedSalesCompliance(orgId, userMap);
    await this.seedSigningCompliance(orgId, userMap);
    await this.seedCaseSOP(orgId, userMap);
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
}
