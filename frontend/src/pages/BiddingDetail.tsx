import { useState } from 'react'
import {
  Breadcrumb,
  Button,
  Card,
  Tabs,
  Descriptions,
  Tag,
  Alert,
  Table,
  Space,
  Divider,
} from 'antd'
import {
  HomeOutlined,
  FileSearchOutlined,
  DownloadOutlined,
  PrinterOutlined,
  ShareAltOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { theme } from '../constants/theme'

// === 类型定义 ===
interface BiddingInfo {
  id: string
  projectName: string
  tenderer: string
  agency: string
  biddingType: string
  amount: number
  deadline: string
  publishDate: string
  status: string
  location: string
  duration: string
}

interface RelatedCase {
  id: string
  caseName: string
  caseType: string
  status: string
  handler: string
  amount: number
}

// === 状态标签类型 ===
type StatusKind = 'blue' | 'green' | 'orange' | 'red' | 'neutral'

const statusConfig: Record<string, { kind: StatusKind; label: string }> = {
  ongoing: { kind: 'blue', label: '进行中' },
  completed: { kind: 'green', label: '已完成' },
  expired: { kind: 'orange', label: '已截止' },
  cancelled: { kind: 'red', label: '已取消' },
}

// === Mock 数据 ===
const mockBidding: BiddingInfo = {
  id: 'ZTB-2026-0018',
  projectName: '某市政府办公大楼信息化系统建设项目',
  tenderer: '某市人民政府办公厅',
  agency: '某招标代理有限公司',
  biddingType: '公开招标',
  amount: 3800000,
  deadline: '2026-09-15',
  publishDate: '2026-08-01',
  status: 'ongoing',
  location: '北京市海淀区',
  duration: '12个月',
}

const mockRelatedCases: RelatedCase[] = [
  {
    id: 'AJ-2026-0032',
    caseName: '政府采购合同纠纷',
    caseType: '民事',
    status: '审理中',
    handler: '张律师',
    amount: 1200000,
  },
  {
    id: 'AJ-2026-0045',
    caseName: '招投标异议答复案',
    caseType: '行政',
    status: '已结案',
    handler: '李律师',
    amount: 500000,
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

const pageHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 12,
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

// === 状态标签组件 ===
const StatusTag = ({ text, kind }: { text: string; kind: StatusKind }) => {
  const colorMap: Record<StatusKind, string> = {
    blue: theme.primary,
    green: theme.success,
    orange: theme.warning,
    red: theme.error,
    neutral: theme.gray,
  }
  const bgMap: Record<StatusKind, string> = {
    blue: 'rgba(0, 113, 227, 0.1)',
    green: 'rgba(46, 125, 50, 0.1)',
    orange: 'rgba(237, 108, 2, 0.1)',
    red: 'rgba(186, 26, 26, 0.1)',
    neutral: 'rgba(113, 119, 133, 0.12)',
  }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 999,
        background: bgMap[kind],
        color: colorMap[kind],
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      {text}
    </span>
  )
}

// === 金额格式化 ===
const fmtMoney = (v: number) =>
  `¥${(Number(v || 0)).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function BiddingDetail() {
  const [activeTab, setActiveTab] = useState('notice')
  const statusInfo = statusConfig[mockBidding.status] || statusConfig.neutral

  // === 公告 Tab 内容 ===
  const noticeContent = (
    <div>
      <div style={sectionTitleStyle}>招标公告</div>
      <Descriptions column={2} bordered size="small" style={{ background: theme.white }}>
        <Descriptions.Item label="招标编号">{mockBidding.id}</Descriptions.Item>
        <Descriptions.Item label="项目名称">{mockBidding.projectName}</Descriptions.Item>
        <Descriptions.Item label="招标方式">{mockBidding.biddingType}</Descriptions.Item>
        <Descriptions.Item label="预算金额">
          <span style={{ color: theme.primaryDark, fontWeight: 600 }}>{fmtMoney(mockBidding.amount)}</span>
        </Descriptions.Item>
        <Descriptions.Item label="发布时间">{mockBidding.publishDate}</Descriptions.Item>
        <Descriptions.Item label="截止时间">
          <span style={{ color: theme.error, fontWeight: 600 }}>{mockBidding.deadline}</span>
        </Descriptions.Item>
      </Descriptions>
      <Divider />
      <div style={{ ...sectionTitleStyle, fontSize: 14 }}>投标人资格要求</div>
      <ul style={{ color: theme.textSecondary, lineHeight: 2, paddingLeft: 20 }}>
        <li>具有独立法人资格，且注册资金不低于500万元人民币</li>
        <li>近三年无重大违法违规记录，未被列入失信被执行人名单</li>
        <li>具备良好的商业信誉和健全的财务会计制度</li>
        <li>具有履行合同所必需的设备和专业技术能力</li>
      </ul>
    </div>
  )

  // === 中标公示 Tab 内容 ===
  const winningContent = (
    <div>
      <Alert
        message="中标公示信息"
        description="本项目已于 2026-08-10 完成评标，现将中标候选人公示如下，公示期为三个工作日。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      <Table
        size="small"
        pagination={false}
        dataSource={[
          { key: '1', rank: 1, name: '某科技有限公司', bid: 3680000, score: 96.5 },
          { key: '2', rank: 2, name: '某信息系统股份有限公司', bid: 3750000, score: 93.2 },
          { key: '3', rank: 3, name: '某网络技术有限公司', bid: 3800000, score: 91.8 },
        ]}
        columns={[
          { title: '排名', dataIndex: 'rank', key: 'rank', width: 80, render: (v: number) => <Tag color={v === 1 ? 'gold' : 'default'}>{v}</Tag> },
          { title: '投标人', dataIndex: 'name', key: 'name' },
          { title: '投标报价', dataIndex: 'bid', key: 'bid', align: 'right', render: (v: number) => fmtMoney(v) },
          { title: '综合得分', dataIndex: 'score', key: 'score', align: 'right', render: (v: number) => <span style={{ fontWeight: 600, color: theme.primary }}>{v}</span> },
        ]}
      />
    </div>
  )

  // === 结果公告 Tab 内容 ===
  const resultContent = (
    <div>
      <Descriptions column={2} bordered size="small" style={{ background: theme.white }}>
        <Descriptions.Item label="中标人">某科技有限公司</Descriptions.Item>
        <Descriptions.Item label="中标金额">
          <span style={{ color: theme.success, fontWeight: 600 }}>{fmtMoney(3680000)}</span>
        </Descriptions.Item>
        <Descriptions.Item label="中标日期">2026-08-12</Descriptions.Item>
        <Descriptions.Item label="工期">{mockBidding.duration}</Descriptions.Item>
        <Descriptions.Item label="项目地点">{mockBidding.location}</Descriptions.Item>
        <Descriptions.Item label="质量标准">达到国家及行业验收标准</Descriptions.Item>
      </Descriptions>
      <Divider />
      <Alert
        message="结果公告说明"
        description="中标结果将在指定媒体发布，同时以书面形式通知所有投标人。如对中标结果有异议，可在公告发布之日起三个工作日内以书面形式向招标人提出。"
        type="warning"
        showIcon
      />
    </div>
  )

  // === 合同条款 Tab 内容 ===
  const contractContent = (
    <div>
      <div style={{ ...sectionTitleStyle, fontSize: 14 }}>主要合同条款</div>
      <Descriptions column={1} bordered size="small" style={{ background: theme.white }}>
        <Descriptions.Item label="合同金额">{fmtMoney(3680000)}</Descriptions.Item>
        <Descriptions.Item label="付款方式">分期付款，首期30%，验收合格后60%，质保期后10%</Descriptions.Item>
        <Descriptions.Item label="履约保证金">合同金额的10%，即368,000元</Descriptions.Item>
        <Descriptions.Item label="质保期限">验收合格之日起12个月</Descriptions.Item>
        <Descriptions.Item label="违约责任">违约方应按合同金额的0.05%/日支付违约金</Descriptions.Item>
        <Descriptions.Item label="争议解决">协商不成的，向项目所在地人民法院提起诉讼</Descriptions.Item>
      </Descriptions>
    </div>
  )

  // === 关联案件列表 ===
  const relatedCaseColumns = [
    { title: '案件编号', dataIndex: 'id', key: 'id', width: 120 },
    { title: '案件名称', dataIndex: 'caseName', key: 'caseName' },
    { title: '案件类型', dataIndex: 'caseType', key: 'caseType', width: 100 },
    { title: '承办人', dataIndex: 'handler', key: 'handler', width: 100 },
    {
      title: '标的金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      align: 'right' as const,
      render: (v: number) => fmtMoney(v),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => (
        <StatusTag text={v} kind={v === '已结案' ? 'green' : 'blue'} />
      ),
    },
  ]

  const tabItems = [
    { key: 'notice', label: '招标公告', children: noticeContent },
    { key: 'winning', label: '中标公示', children: winningContent },
    { key: 'result', label: '结果公告', children: resultContent },
    { key: 'contract', label: '合同条款', children: contractContent },
  ]

  return (
    <div style={pageStyle}>
      {/* 面包屑 + 页面标题 + 操作按钮 */}
      <Card style={cardStyle} bodyStyle={{ padding: '16px 24px' }}>
        <Breadcrumb
          items={[
            { title: <><HomeOutlined /> 首页</> },
            { title: <><FileSearchOutlined /> 招投标查询</> },
            { title: '招标详情' },
          ]}
        />
        <div style={pageHeaderStyle}>
          <div>
            <h2 style={pageTitleStyle}>{mockBidding.projectName}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <StatusTag text={statusInfo.label} kind={statusInfo.kind} />
              <span style={{ color: theme.textTertiary, fontSize: 13 }}>
                招标编号：{mockBidding.id}
              </span>
            </div>
          </div>
          <Space>
            <Button icon={<DownloadOutlined />}>下载文件</Button>
            <Button icon={<PrinterOutlined />}>打印</Button>
            <Button type="primary" icon={<ShareAltOutlined />}>分享</Button>
          </Space>
        </div>
      </Card>

      {/* 基本信息卡片 */}
      <Card title="基本信息" style={cardStyle}>
        <Descriptions column={3} bordered size="small">
          <Descriptions.Item label="项目编号">{mockBidding.id}</Descriptions.Item>
          <Descriptions.Item label="项目名称">{mockBidding.projectName}</Descriptions.Item>
          <Descriptions.Item label="招标方式">{mockBidding.biddingType}</Descriptions.Item>
          <Descriptions.Item label="招标人">{mockBidding.tenderer}</Descriptions.Item>
          <Descriptions.Item label="招标代理">{mockBidding.agency}</Descriptions.Item>
          <Descriptions.Item label="项目地点">{mockBidding.location}</Descriptions.Item>
          <Descriptions.Item label="预算金额">
            <span style={{ color: theme.primaryDark, fontWeight: 600 }}>{fmtMoney(mockBidding.amount)}</span>
          </Descriptions.Item>
          <Descriptions.Item label="发布时间">{mockBidding.publishDate}</Descriptions.Item>
          <Descriptions.Item label="截止时间">
            <span style={{ color: theme.error, fontWeight: 600 }}>{mockBidding.deadline}</span>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Tab 切换 */}
      <Card style={cardStyle}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      {/* 关联案件区 */}
      <Card title="关联案件" style={cardStyle}>
        <Table
          size="small"
          dataSource={mockRelatedCases}
          columns={relatedCaseColumns}
          rowKey="id"
          pagination={false}
        />
      </Card>

      {/* 风险提示 Alert */}
      <Alert
        showIcon
        icon={<WarningOutlined />}
        type="warning"
        message="风险提示"
        description={
          <div style={{ lineHeight: 1.8 }}>
            <div>1. 本招标项目截止时间临近，请相关投标人尽快完成投标文件编制工作。</div>
            <div>2. 投标过程中请注意甄别招标文件中的潜在陷阱条款，如付款条件、验收标准等。</div>
            <div>3. 建议在投标前对招标人的资质和项目背景进行充分的尽职调查。</div>
          </div>
        }
        style={{ borderRadius: 12 }}
      />
    </div>
  )
}