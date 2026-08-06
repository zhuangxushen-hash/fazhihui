import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { DueDiligence, DD_STATUS, DD_QUERY_TYPE } from './due-diligence.entity';

@Injectable()
export class DueDiligenceService {
  constructor(
    @InjectRepository(DueDiligence)
    private ddRepository: Repository<DueDiligence>,
  ) {}

  // 发起尽调查询，生成模拟报告
  async create(data: {
    company_name: string;
    query_type: string;
    operator_id?: string;
    organization_id: string;
    template_id?: string;
  }): Promise<DueDiligence> {
    const reportContent = this.generateMockReport(
      data.company_name,
      data.query_type,
    );
    const record = this.ddRepository.create({
      company_name: data.company_name,
      query_type: data.query_type,
      report_content: reportContent,
      status: DD_STATUS.COMPLETED,
      operator_id: data.operator_id,
      organization_id: data.organization_id,
      // 结构化字段（根据 query_type 选择性填充）
      shareholder_info: this.buildShareholderInfo(data.query_type),
      legal_rep_info: this.buildLegalRepInfo(data.query_type),
      financial_info: this.buildFinancialInfo(data.query_type),
      risk_info: this.buildRiskInfo(data.query_type),
      // 模板ID（如有）
      template_id: data.template_id || null,
    });
    return this.ddRepository.save(record);
  }

  // 生成股东信息JSON：query_type 为 shareholder 或 all 时返回，否则返回 null
  private buildShareholderInfo(queryType: string): string | null {
    if (
      queryType !== DD_QUERY_TYPE.SHAREHOLDER &&
      queryType !== DD_QUERY_TYPE.ALL
    ) {
      return null;
    }
    const shareholders = [
      { name: '股东A', ratio: '60%', amount: '600万' },
      { name: '股东B', ratio: '40%', amount: '400万' },
    ];
    return JSON.stringify(shareholders);
  }

  // 生成法人信息JSON：query_type 为 legal 或 all 时返回，否则返回 null
  private buildLegalRepInfo(queryType: string): string | null {
    if (
      queryType !== DD_QUERY_TYPE.LEGAL &&
      queryType !== DD_QUERY_TYPE.ALL
    ) {
      return null;
    }
    const legalRep = {
      name: '张三',
      position: '法定代表人',
      id_card: '110*****1234',
      phone: '138****5678',
    };
    return JSON.stringify(legalRep);
  }

  // 生成财务信息JSON：query_type 为 financial 或 all 时返回，否则返回 null
  private buildFinancialInfo(queryType: string): string | null {
    if (
      queryType !== DD_QUERY_TYPE.FINANCIAL &&
      queryType !== DD_QUERY_TYPE.ALL
    ) {
      return null;
    }
    const financial = {
      registered_capital: '1000万',
      paid_capital: '1000万',
      revenue_2023: '5000万',
      profit_2023: '500万',
    };
    return JSON.stringify(financial);
  }

  // 生成风险信息JSON：query_type 为 risk 或 all 时返回，否则返回 null
  private buildRiskInfo(queryType: string): string | null {
    if (
      queryType !== DD_QUERY_TYPE.RISK &&
      queryType !== DD_QUERY_TYPE.ALL
    ) {
      return null;
    }
    const risk = {
      litigation_count: 3,
      admin_penalty: 1,
      dishonest_count: 0,
      abnormal_operation: false,
    };
    return JSON.stringify(risk);
  }

  // 查询尽调记录列表，支持 keyword 筛选
  async findAll(orgId: string, keyword?: string): Promise<DueDiligence[]> {
    const where: any = {};
    if (orgId) {
      where.organization_id = orgId;
    }
    if (keyword) {
      where.company_name = Like(`%${keyword}%`);
    }
    return this.ddRepository.find({
      where,
      order: { updated_at: 'DESC' },
    });
  }

  // 查询单条详情
  async findOne(id: string): Promise<DueDiligence> {
    return this.ddRepository.findOne({ where: { id } });
  }

  // 生成模拟企业尽调报告
  private generateMockReport(companyName: string, queryType: string): string {
    const now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
    const typeLabelMap: Record<string, string> = {
      [DD_QUERY_TYPE.BASIC]: '基本信息',
      [DD_QUERY_TYPE.SHAREHOLDER]: '股东信息',
      [DD_QUERY_TYPE.LEGAL]: '法人信息',
      [DD_QUERY_TYPE.FINANCIAL]: '财务信息',
      [DD_QUERY_TYPE.RISK]: '风险信息',
      [DD_QUERY_TYPE.ALL]: '全部信息',
    };
    const typeLabel = typeLabelMap[queryType] || '综合信息';

    const lines: string[] = [];
    lines.push(`================ 企业尽调报告 ================`);
    lines.push(`报告生成时间：${now}`);
    lines.push(`查询企业：${companyName}`);
    lines.push(`查询类型：${typeLabel}`);
    lines.push(`数据来源：尽调宝模拟数据（演示用途）`);
    lines.push(``);
    lines.push(`【一、企业基本信息】`);
    lines.push(`企业名称：${companyName}`);
    lines.push(`统一社会信用代码：91100000MOCK${Math.floor(Math.random() * 9000 + 1000)}X`);
    lines.push(`企业类型：有限责任公司`);
    lines.push(`成立日期：2018-06-15`);
    lines.push(`注册资本：人民币5000万元`);
    lines.push(`实缴资本：人民币3000万元`);
    lines.push(`经营状态：存续（在营）`);
    lines.push(`所属行业：商务服务业`);
    lines.push(`登记机关：市场监督管理局`);
    lines.push(`注册地址：北京市朝阳区某街道${Math.floor(Math.random() * 900 + 100)}号`);
    lines.push(``);

    if (
      queryType === DD_QUERY_TYPE.SHAREHOLDER ||
      queryType === DD_QUERY_TYPE.ALL
    ) {
      lines.push(`【二、股东信息】`);
      lines.push(`1. 股东A（自然人） - 认缴出资 2550万元（持股 51%）`);
      lines.push(`2. 股东B（企业法人） - 认缴出资 1450万元（持股 29%）`);
      lines.push(`3. 股东C（自然人） - 认缴出资 1000万元（持股 20%）`);
      lines.push(``);
    }

    if (
      queryType === DD_QUERY_TYPE.LEGAL ||
      queryType === DD_QUERY_TYPE.ALL
    ) {
      lines.push(`【三、法定代表人信息】`);
      lines.push(`法定代表人：张某某`);
      lines.push(`职务：董事长兼总经理`);
      lines.push(`任职时间：2018-06-15 至今`);
      lines.push(``);
    }

    if (
      queryType === DD_QUERY_TYPE.FINANCIAL ||
      queryType === DD_QUERY_TYPE.ALL
    ) {
      lines.push(`【四、财务信息】`);
      lines.push(`最近一年营业收入：人民币 1.2 亿元`);
      lines.push(`最近一年净利润：人民币 850 万元`);
      lines.push(`资产总额：人民币 9800 万元`);
      lines.push(`负债总额：人民币 4200 万元`);
      lines.push(``);
    }

    if (
      queryType === DD_QUERY_TYPE.RISK ||
      queryType === DD_QUERY_TYPE.ALL
    ) {
      lines.push(`【五、风险信息】`);
      lines.push(`司法案件：2 条（均为合同纠纷，已结案）`);
      lines.push(`行政处罚：0 条`);
      lines.push(`失信记录：0 条`);
      lines.push(`限制高消费：0 条`);
      lines.push(`经营异常：0 条`);
      lines.push(``);
    }

    lines.push(`【风险提示】`);
    lines.push(`本报告为模拟生成的尽调报告，仅用于系统功能演示。`);
    lines.push(`实际尽调请以官方渠道数据为准。`);
    lines.push(`============================================`);

    return lines.join('\n');
  }
}
