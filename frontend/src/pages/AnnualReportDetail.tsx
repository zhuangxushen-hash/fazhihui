import { useState } from 'react'
import {
  Breadcrumb,
  Card,
  Tabs,
  Descriptions,
  Table,
  Alert,
  Row,
  Col,
  Progress,
  Tag,
  Divider,
} from 'antd'
import {
  HomeOutlined,
  FileTextOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons'
import { theme } from '../constants/theme'

// === 类型定义 ===
interface EnterpriseInfo {
  name: string
  creditCode: string
  legalPerson: string
  registeredCapital: string
  establishedDate: string
  region: string
  industry: string
  status: string
}

interface FinancialIndicator {
  key: string
  name: string
  2024: number
  2023: number
  2022: number
  change: number
}

interface Shareholder {
  key: string
  name: string
  ratio: number
  amount: string
  type: string
}

interface Investment {
  key: string
  name: string
  ratio: number
  amount: string
  region: string
}

interface AbnormalItem {
  key: string
  date: string
  reason: string
  authority: string
  status: string
}

// === Mock 数据 ===
const mockEnterprise: EnterpriseInfo = {
  name: '某科技集团股份有限公司',
  creditCode: '91110108MA01XXXXX',
  legalPerson: '王某某',
  registeredCapital: '5,000 万元',
  establishedDate: '2015-06-18',
  region: '北京市海淀区',
  industry: '软件开发和信息技术服务业',
  status: '在营',
}

const mockFinancialData: FinancialIndicator[] = [
  { key: '1', name: '营业收入', 2024: 285600, 2023: 248500, 2022: 215800, change: 14.9 },
  { key: '2', name: '净利润', 2024: 42800, 2023: 38500, 2022: 32600, change: 11.2 },
  { key: '3', name: '总资产', 2024: 520000, 2023: 468000, 2022: 410000, change: 11.1 },
  { key: '4', name: '净资产', 2024: 310000, 2023: 275000, 2022: 242000, change: 12.7 },
  { key: '5', name: '资产负债率', 2024: 40.4, 2023: 41.2, 2022: 41.0, change: -0.8 },
  { key: '6', name: '毛利率', 2024: 28.5, 2023: 27.2, 2022: 26.8, change: 1.3 },
  { key: '7', name: '净利率', 2024: 15.0, 2023: 15.5, 2022: 15.1, change: -0.5 },
  { key: '8', name: '研发投入占比', 2024: 12.3, 2023: 11.8, 2022: 10.5, change: 0.5 },
]

const mockShareholders: Shareholder[] = [
  { key: '1', name: '王某（法定代表人）', ratio: 45.0, amount: '2,250万元', type: '自然人' },
  { key: '2', name: '北京某投资有限公司', ratio: 25.0, amount: '1,250万元', type: '法人' },
  { key: '3', name: '张某', ratio: 15.0, amount: '750万元', type: '自然人' },
  { key: '4', name: '李某', ratio: 10.0, amount: '500万元', type: '自然人' },
  { key: '5', name: '其他股东', ratio: 5.0, amount: '250万元', type: '其他' },
]

const mockInvestments: Investment[] = [
  { key: '1', name: '某人工智能有限公司', ratio: 60.0, amount: '3,000万元', region: '北京' },
  { key: '2', name: '某云计算技术有限公司', ratio: 55.0, amount: '2,750万元', region: '上海' },
  { key: '3', name: '某大数据科技有限公司', ratio: 40.0, amount: '2,000万元', region: '深圳' },
  { key: '4', name: '某智能硬件有限公司', ratio: 35.0, amount: '1,750万元', region: '杭州' },
]

const mockAbnormal: AbnormalItem[] = [
  {
    key: '1',
    date: '2025-03-15',
    reason: '未按规定公示年报',
    authority: '北京市市场监督管理局海淀分局',
    status: '已列入',
  },
  {
    key: '2',
    date: '2024-08-20',
    reason: '经营地址异常',
    authority: '北京市市场监督管理局海淀分局',
    status: '已移出',
  },
]

// === 页面样式 ===
const pageStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: '16px 24px',
  background: theme.bgLayout,
  minHeight: '100vh',
}

const cardStyle: React.CSSProperties = {
  borderRadius: 12,
  boxShadow: theme.cardShadow,
}

const pageTitleStyle: React.CSSProperties = {
  fontFamily: "'Noto Serif SC', serif",
  fontSize: 22,
  fontWeight: 600,
  color: theme.textBase,
  margin: '8px 0 0 0',
}

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: "'Noto Serif SC', serif",
  fontSize: 16,
  fontWeight: 600,
  color: theme.textBase,
  marginBottom: 16,
}

// === 状态标签映射 ===
const abnormalStatusConfig: Record<string, { color: string; label: string }> = {
  已列入: { color: theme.error, label: '已列入经营异常' },
  已移出: { color: theme.success, label: '已移出' },
}

// === 百分比格式化 ===
const fmtPercent = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`

// === 年度概要 Tab 内容 ===
const overviewContent = (
  <div>
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
      <Col xs={12} sm={6}>
        <Card
          style={{ ...cardStyle, background: theme.gradientStat1 }}
          bodyStyle={{ padding: 16, textAlign: 'center' }}
        >
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>营业收入(万元)</div>
          <div
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: 28,
              fontWeight: 700,
              color: theme.white,
              margin: '8px 0',
            }}
          >
            285,600
          </div>
          <Tag color="green" style={{ borderRadius: 999 }}>
            <ArrowUpOutlined /> +14.9%
          </Tag>
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card
          style={{ ...cardStyle, background: theme.gradientStat2 }}
          bodyStyle={{ padding: 16, textAlign: 'center' }}
        >
          <div style={{ color: theme.brandDark, fontSize: 13 }}>净利润(万元)</div>
          <div
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: 28,
              fontWeight: 700,
              color: theme.brandDark,
              margin: '8px 0',
            }}
          >
            42,800
          </div>
          <Tag color="green" style={{ borderRadius: 999 }}>
            <ArrowUpOutlined /> +11.2%
          </Tag>
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card
          style={{ ...cardStyle, background: theme.gradientStat3 }}
          bodyStyle={{ padding: 16, textAlign: 'center' }}
        >
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>总资产(万元)</div>
          <div
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: 28,
              fontWeight: 700,
              color: theme.white,
              margin: '8px 0',
            }}
          >
            520,000
          </div>
          <Tag color="green" style={{ borderRadius: 999 }}>
            <ArrowUpOutlined /> +11.1%
          </Tag>
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card
          style={{ ...cardStyle, background: theme.gradientStat4 }}
          bodyStyle={{ padding: 16, textAlign: 'center' }}
        >
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>净资产(万元)</div>
          <div
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: 28,
              fontWeight: 700,
              color: theme.white,
              margin: '8px 0',
            }}
          >
            310,000
          </div>
          <Tag color="green" style={{ borderRadius: 999 }}>
            <ArrowUpOutlined /> +12.7%
          </Tag>
        </Card>
      </Col>
    </Row>
    <Descriptions column={2} bordered size="small" style={{ background: theme.white }}>
      <Descriptions.Item label="年度">2024年度</Descriptions.Item>
      <Descriptions.Item label="审计意见">标准无保留意见</Descriptions.Item>
      <Descriptions.Item label="董事会报告">已披露</Descriptions.Item>
      <Descriptions.Item label="监事会报告">已披露</Descriptions.Item>
      <Descriptions.Item label="年度报告披露日期">2025-04-28</Descriptions.Item>
      <Descriptions.Item label="注册会计师">某会计师事务所</Descriptions.Item>
    </Descriptions>
  </div>
)

// === 财务指标 Tab 内容 ===
const financialContent = (
  <div>
    <Table
      size="small"
      pagination={false}
      dataSource={mockFinancialData}
      rowKey="key"
      columns={[
        { title: '指标名称', dataIndex: 'name', key: 'name', width: 140 },
        {
          title: '2024年',
          dataIndex: '2024',
          key: '2024',
          align: 'right',
          render: (v: number) =>
            <span style={{ fontWeight: 600, color: theme.primary }}>
              {v >= 10000 ? `${(v / 10000).toFixed(2)}亿` : `${v.toFixed(1)}%`}
            </span>,
        },
        {
          title: '2023年',
          dataIndex: '2023',
          key: '2023',
          align: 'right',
          render: (v: number) => (v >= 10000 ? `${(v / 10000).toFixed(2)}亿` : `${v.toFixed(1)}%`),
        },
        {
          title: '2022年',
          dataIndex: '2022',
          key: '2022',
          align: 'right',
          render: (v: number) => (v >= 10000 ? `${(v / 10000).toFixed(2)}亿` : `${v.toFixed(1)}%`),
        },
        {
          title: '同比变动',
          dataIndex: 'change',
          key: 'change',
          align: 'right',
          render: (v: number) => (
            <Tag color={v > 0 ? 'green' : v < 0 ? 'red' : 'default'}>
              {v > 0 ? <ArrowUpOutlined /> : v < 0 ? <ArrowDownOutlined /> : null} {fmtPercent(v)}
            </Tag>
          ),
        },
      ]}
    />
    <Divider />
    <div style={sectionTitleStyle}>关键比率趋势</div>
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={8}>
        <div style={{ background: theme.bgSurfaceLow, padding: 16, borderRadius: 8 }}>
          <div style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 8 }}>盈利能力</div>
          <Progress percent={28.5} strokeColor={theme.primary} format={(p) => `毛利率 ${p}%`} />
          <div style={{ marginTop: 8 }}>
            <Progress percent={15.0} strokeColor={theme.brandGold} format={(p) => `净利率 ${p}%`} />
          </div>
        </div>
      </Col>
      <Col xs={24} sm={8}>
        <div style={{ background: theme.bgSurfaceLow, padding: 16, borderRadius: 8 }}>
          <div style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 8 }}>偿债能力</div>
          <Progress percent={40.4} strokeColor={theme.warning} format={(p) => `资产负债率 ${p}%`} />
          <div style={{ marginTop: 8 }}>
            <Progress percent={60.0} strokeColor={theme.success} format={(p) => `流动比率 ${p}%`} />
          </div>
        </div>
      </Col>
      <Col xs={24} sm={8}>
        <div style={{ background: theme.bgSurfaceLow, padding: 16, borderRadius: 8 }}>
          <div style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 8 }}>成长能力</div>
          <Progress percent={14.9} strokeColor={theme.info} format={(p) => `营收增长 ${p}%`} />
          <div style={{ marginTop: 8 }}>
            <Progress percent={11.2} strokeColor={theme.primaryDark} format={(p) => `净利增长 ${p}%`} />
          </div>
        </div>
      </Col>
    </Row>
  </div>
)

// === 股东信息 Tab 内容 ===
const shareholderContent = (
  <div>
    <div style={sectionTitleStyle}>股东构成</div>
    <Table
      size="small"
      pagination={false}
      dataSource={mockShareholders}
      rowKey="key"
      columns={[
        { title: '股东名称', dataIndex: 'name', key: 'name' },
        {
          title: '股东类型',
          dataIndex: 'type',
          key: 'type',
          width: 100,
          render: (v: string) => (
            <Tag color={v === '自然人' ? 'blue' : v === '法人' ? 'purple' : 'default'}>{v}</Tag>
          ),
        },
        {
          title: '持股比例',
          dataIndex: 'ratio',
          key: 'ratio',
          width: 140,
          render: (v: number) => (
            <div>
              <Progress percent={v} strokeColor={theme.primary} />
            </div>
          ),
        },
        { title: '出资额', dataIndex: 'amount', key: 'amount', width: 120, align: 'right' },
      ]}
    />
  </div>
)

// === 对外投资 Tab 内容 ===
const investmentContent = (
  <div>
    <div style={sectionTitleStyle}>对外投资企业</div>
    <Table
      size="small"
      pagination={false}
      dataSource={mockInvestments}
      rowKey="key"
      columns={[
        { title: '被投资企业', dataIndex: 'name', key: 'name' },
        { title: '所在地区', dataIndex: 'region', key: 'region', width: 100 },
        {
          title: '持股比例',
          dataIndex: 'ratio',
          key: 'ratio',
          width: 140,
          render: (v: number) => (
            <Progress percent={v} strokeColor={theme.brandGold} />
          ),
        },
        { title: '投资金额', dataIndex: 'amount', key: 'amount', width: 120, align: 'right' },
      ]}
    />
  </div>
)

// === 经营异常 Tab 内容 ===
const abnormalContent = (
  <div>
    <div style={sectionTitleStyle}>经营异常信息</div>
    <Alert
      message="历史异常记录"
      description="以下为该企业近年来的经营异常记录，供决策参考。"
      type="info"
      showIcon
      style={{ marginBottom: 16 }}
    />
    <Table
      size="small"
      pagination={false}
      dataSource={mockAbnormal}
      rowKey="key"
      columns={[
        { title: '日期', dataIndex: 'date', key: 'date', width: 120 },
        { title: '异常原因', dataIndex: 'reason', key: 'reason' },
        { title: '作出机关', dataIndex: 'authority', key: 'authority' },
        {
          title: '状态',
          dataIndex: 'status',
          key: 'status',
          width: 120,
          render: (v: string) => {
            const cfg = abnormalStatusConfig[v]
            return <Tag color={cfg?.color === theme.error ? 'red' : 'green'}>{cfg?.label || v}</Tag>
          },
        },
      ]}
    />
  </div>
)

export default function AnnualReportDetail() {
  const [activeTab, setActiveTab] = useState('overview')

  const tabItems = [
    { key: 'overview', label: '年报概要', children: overviewContent },
    { key: 'financial', label: '财务指标', children: financialContent },
    { key: 'shareholder', label: '股东信息', children: shareholderContent },
    { key: 'investment', label: '对外投资', children: investmentContent },
    { key: 'abnormal', label: '经营异常', children: abnormalContent },
  ]

  return (
    <div style={pageStyle}>
      {/* 面包屑 + 页面标题 */}
      <Card style={cardStyle} bodyStyle={{ padding: '16px 24px' }}>
        <Breadcrumb
          items={[
            { title: <><HomeOutlined /> 首页</> },
            { title: <><FileTextOutlined /> 企业信息查询</> },
            { title: '年报详情' },
          ]}
        />
        <div style={{ marginTop: 8 }}>
          <h2 style={pageTitleStyle}>{mockEnterprise.name}</h2>
        </div>
      </Card>

      {/* 企业基本信息 Descriptions */}
      <Card title="企业基本信息" style={cardStyle}>
        <Descriptions column={3} bordered size="small">
          <Descriptions.Item label="企业名称">{mockEnterprise.name}</Descriptions.Item>
          <Descriptions.Item label="统一社会信用代码">{mockEnterprise.creditCode}</Descriptions.Item>
          <Descriptions.Item label="法定代表人">{mockEnterprise.legalPerson}</Descriptions.Item>
          <Descriptions.Item label="注册资本">{mockEnterprise.registeredCapital}</Descriptions.Item>
          <Descriptions.Item label="成立日期">{mockEnterprise.establishedDate}</Descriptions.Item>
          <Descriptions.Item label="企业状态">
            <Tag color="green">{mockEnterprise.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="注册地区">{mockEnterprise.region}</Descriptions.Item>
          <Descriptions.Item label="所属行业" span={2}>{mockEnterprise.industry}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Tab 切换 */}
      <Card style={cardStyle}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      {/* 风险预警 Alert */}
      <Alert
        showIcon
        icon={<WarningOutlined />}
        type="warning"
        message="风险预警"
        description={
          <div style={{ lineHeight: 1.8 }}>
            <div>
              <CheckCircleOutlined style={{ color: theme.success, marginRight: 6 }} />
              2024年度财务报告经审计，出具标准无保留意见，财务信息可信度较高。
            </div>
            <div>
              <WarningOutlined style={{ color: theme.warning, marginRight: 6 }} />
              2025年3月曾因"未按规定公示年报"被列入经营异常名录，虽已移出，但需关注其合规意识。
            </div>
            <div>
              <WarningOutlined style={{ color: theme.warning, marginRight: 6 }} />
              资产负债率为40.4%，处于行业中等水平，偿债能力良好，但需关注现金流变化。
            </div>
          </div>
        }
        style={{ borderRadius: 12 }}
      />
    </div>
  )
}