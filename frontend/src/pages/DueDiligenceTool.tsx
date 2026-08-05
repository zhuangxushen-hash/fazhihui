import { useState, useEffect } from 'react'
import { Table, Button, Modal, Input, Select, Card, message, Space, Tag, Descriptions, Empty } from 'antd'
import { SearchOutlined, EyeOutlined } from '@ant-design/icons'
import {
  checkDueDiligence,
  getDueDiligences,
  getDueDiligenceById,
} from '../api/dueDiligence'
import { formatDateTime } from '../utils/format'
import { theme } from '../constants/theme'
// === Material Design 3 Style Tokens ===
const pageH2Style: React.CSSProperties = {
  fontFamily: "'Noto Serif SC', serif",
  fontSize: 22,
  fontWeight: 600,
  color: theme.textBase,
  margin: 0,
  letterSpacing: '0.01em',
}

const searchCardStyle: React.CSSProperties = {
  background: theme.bgContainer,
  padding: 20,
  borderRadius: 16,
  border: `1px solid ${theme.border}`,
  marginBottom: 16,
}

const tableCardStyle: React.CSSProperties = {
  borderRadius: 16,
  overflow: 'hidden',
}

// === MD3 Status Pill ===
type PillKind = 'neutral' | 'blue' | 'gold' | 'green' | 'red' | 'orange' | 'purple'

const pillColorMap: Record<PillKind, { bg: string; color: string }> = {
  neutral: { bg: 'rgba(113, 119, 133, 0.12)', color: '#5f6672' },
  blue: { bg: 'rgba(0, 113, 227, 0.1)', color: theme.primary },
  gold: { bg: 'rgba(201, 169, 97, 0.15)', color: '#8c702e' },
  green: { bg: 'rgba(46, 125, 50, 0.1)', color: theme.success },
  red: { bg: 'rgba(186, 26, 26, 0.1)', color: theme.error },
  orange: { bg: 'rgba(237, 108, 2, 0.1)', color: theme.warning },
  purple: { bg: 'rgba(114, 46, 209, 0.1)', color: '#722ed1' },
}

const StatusPill = ({ text, kind }: { text: string; kind: PillKind }) => {
  const c = pillColorMap[kind] || pillColorMap.neutral
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 999,
        background: c.bg,
        color: c.color,
        fontSize: 12,
        fontWeight: 500,
        lineHeight: '20px',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </span>
  )
}

// 查询类型映射
const queryTypeLabelMap: Record<string, string> = {
  basic: '基本信息',
  shareholder: '股东信息',
  legal: '法人信息',
  financial: '财务信息',
  risk: '风险信息',
  all: '全部',
}

// 状态映射
const statusKindMap: Record<string, PillKind> = {
  pending: 'orange',
  completed: 'green',
  failed: 'red',
}

const statusLabelMap: Record<string, string> = {
  pending: '进行中',
  completed: '已完成',
  failed: '失败',
}

// 模板选项
const templateOptions = [
  { value: 'standard', label: '标准尽调报告' },
  { value: 'simple', label: '简版尽调报告' },
  { value: 'deep', label: '深度尽调报告' },
]

// 模板ID到名称映射
const templateLabelMap: Record<string, string> = {
  standard: '标准尽调报告',
  simple: '简版尽调报告',
  deep: '深度尽调报告',
}

// 尽调记录类型
interface DueDiligenceRecord {
  id?: string
  company_name?: string
  query_type?: string
  report_content?: string
  shareholder_info?: string
  legal_rep_info?: string
  financial_info?: string
  risk_info?: string
  template_id?: string
  status?: string
  created_at?: string
}

// 股东信息项
interface ShareholderItem {
  name?: string
  ratio?: string
  amount?: string
}

// 法人信息
interface LegalRepInfo {
  name?: string
  position?: string
  id_card?: string
  phone?: string
}

// 财务信息
interface FinancialInfo {
  registered_capital?: string
  paid_capital?: string
  revenue_2023?: string
  profit_2023?: string
}

// 风险信息
interface RiskInfo {
  litigation_count?: number
  admin_penalty?: number
  dishonest_count?: number
  abnormal_operation?: boolean
}

// 安全解析JSON字符串，失败返回null
function safeParseJSON<T>(raw?: string): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

// 分区卡片标题样式
const sectionTitleStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: theme.textBase,
  marginBottom: 8,
  paddingLeft: 8,
  borderLeft: `3px solid ${theme.primary}`,
}

// 分区卡片容器样式
const sectionCardStyle: React.CSSProperties = {
  background: theme.bgContainer,
  border: `1px solid ${theme.borderSecondary}`,
  borderRadius: 8,
  padding: 12,
}

// 报告分区展示组件：基本信息 + 股东 + 法人 + 财务 + 风险 + 原始报告
function ReportSections({ record }: { record: DueDiligenceRecord | null }) {
  if (!record) return null

  const shareholders = safeParseJSON<ShareholderItem[]>(record.shareholder_info)
  const legalRep = safeParseJSON<LegalRepInfo>(record.legal_rep_info)
  const financial = safeParseJSON<FinancialInfo>(record.financial_info)
  const risk = safeParseJSON<RiskInfo>(record.risk_info)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* 基本信息 */}
      <div style={sectionCardStyle}>
        <div style={sectionTitleStyle}>基本信息</div>
        <Descriptions size="small" column={2} colon labelStyle={{ width: 90, color: '#5f6672' }}>
          <Descriptions.Item label="企业名称">{record.company_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="查询类型">{queryTypeLabelMap[record.query_type || ''] || record.query_type || '-'}</Descriptions.Item>
          <Descriptions.Item label="查询时间">{record.created_at ? formatDateTime(record.created_at) : '-'}</Descriptions.Item>
          <Descriptions.Item label="报告模板">{templateLabelMap[record.template_id || ''] || '-'}</Descriptions.Item>
        </Descriptions>
      </div>

      {/* 股东信息 */}
      <div style={sectionCardStyle}>
        <div style={sectionTitleStyle}>股东信息</div>
        {shareholders && shareholders.length > 0 ? (
          <div className="stitch-table">
            <Table
              size="small"
              rowKey={(_, idx) => String(idx)}
              dataSource={shareholders}
              pagination={false}
              columns={[
                { title: '股东姓名', dataIndex: 'name', key: 'name' },
                { title: '持股比例', dataIndex: 'ratio', key: 'ratio' },
                { title: '出资额', dataIndex: 'amount', key: 'amount' },
              ]}
            />
          </div>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无股东信息" />
        )}
      </div>

      {/* 法人信息 */}
      <div style={sectionCardStyle}>
        <div style={sectionTitleStyle}>法人信息</div>
        {legalRep ? (
          <Descriptions size="small" column={2} colon labelStyle={{ width: 90, color: '#5f6672' }}>
            <Descriptions.Item label="姓名">{legalRep.name || '-'}</Descriptions.Item>
            <Descriptions.Item label="职务">{legalRep.position || '-'}</Descriptions.Item>
            <Descriptions.Item label="身份证">{legalRep.id_card || '-'}</Descriptions.Item>
            <Descriptions.Item label="电话">{legalRep.phone || '-'}</Descriptions.Item>
          </Descriptions>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无法人信息" />
        )}
      </div>

      {/* 财务信息 */}
      <div style={sectionCardStyle}>
        <div style={sectionTitleStyle}>财务信息</div>
        {financial ? (
          <Descriptions size="small" column={2} colon labelStyle={{ width: 90, color: '#5f6672' }}>
            <Descriptions.Item label="注册资本">{financial.registered_capital || '-'}</Descriptions.Item>
            <Descriptions.Item label="实缴资本">{financial.paid_capital || '-'}</Descriptions.Item>
            <Descriptions.Item label="2023营收">{financial.revenue_2023 || '-'}</Descriptions.Item>
            <Descriptions.Item label="2023利润">{financial.profit_2023 || '-'}</Descriptions.Item>
          </Descriptions>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无财务信息" />
        )}
      </div>

      {/* 风险信息 */}
      <div style={sectionCardStyle}>
        <div style={sectionTitleStyle}>风险信息</div>
        {risk ? (
          <Descriptions size="small" column={2} colon labelStyle={{ width: 90, color: '#5f6672' }}>
            <Descriptions.Item label="诉讼数">
              <Tag className={`stitch-tag stitch-tag-${risk.litigation_count ? 'warning' : 'success'}`}>{risk.litigation_count ?? 0}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="行政处罚">
              <Tag className={`stitch-tag stitch-tag-${risk.admin_penalty ? 'error' : 'success'}`}>{risk.admin_penalty ?? 0}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="失信记录">
              <Tag className={`stitch-tag stitch-tag-${risk.dishonest_count ? 'error' : 'success'}`}>{risk.dishonest_count ?? 0}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="经营异常">
              <Tag className={`stitch-tag stitch-tag-${risk.abnormal_operation ? 'error' : 'success'}`}>{risk.abnormal_operation ? '是' : '否'}</Tag>
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无风险信息" />
        )}
      </div>

      {/* 原始报告文本 */}
      {record.report_content ? (
        <div style={sectionCardStyle}>
          <div style={sectionTitleStyle}>原始报告</div>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: "'Noto Sans SC', sans-serif",
              fontSize: 13,
              lineHeight: 1.8,
              color: theme.textBase,
              margin: 0,
            }}
          >
            {record.report_content}
          </pre>
        </div>
      ) : null}
    </div>
  )
}

export default function DueDiligenceTool() {
  const [companyName, setCompanyName] = useState('')
  const [queryType, setQueryType] = useState('all')
  const [templateId, setTemplateId] = useState<string | undefined>(undefined)
  const [searching, setSearching] = useState(false)
  const [reportContent, setReportContent] = useState('')
  const [reportCompany, setReportCompany] = useState('')
  // 当前查询结果完整记录（用于分区展示）
  const [currentRecord, setCurrentRecord] = useState<DueDiligenceRecord | null>(null)
  // 历史记录
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  // 详情Modal
  const [detailVisible, setDetailVisible] = useState(false)
  const [detailCompany, setDetailCompany] = useState('')
  // 详情完整记录（用于分区展示）
  const [detailRecord, setDetailRecord] = useState<DueDiligenceRecord | null>(null)

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const fetchList = async () => {
    setLoading(true)
    try {
      const res = await getDueDiligences({ org_id: user.organization_id }) as Record<string, unknown>[]
      setList(res || [])
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList()
  }, [])

  const handleSearch = async () => {
    if (!companyName.trim()) {
      message.warning('请输入企业名称')
      return
    }
    setSearching(true)
    try {
      const res = await checkDueDiligence({
        company_name: companyName,
        query_type: queryType,
        organization_id: user.organization_id,
        template_id: templateId,
      }) as Record<string, unknown> | null
      setReportContent((res?.report_content as string) || '暂无报告内容')
      setReportCompany(companyName)
      // 保存完整记录用于分区展示
      setCurrentRecord(res ? (res as DueDiligenceRecord) : null)
      message.success('尽调查询完成')
      fetchList()
    } catch (error) {
      message.error('查询失败')
    } finally {
      setSearching(false)
    }
  }

  const handleViewDetail = async (record: any) => {
    try {
      const res = await getDueDiligenceById(record.id) as Record<string, unknown>
      setDetailCompany(res?.company_name || record.company_name)
      // 保存完整记录用于分区展示
      setDetailRecord(res ? (res as DueDiligenceRecord) : null)
      setDetailVisible(true)
    } catch (error) {
      message.error('获取详情失败')
    }
  }

  const columns = [
    { title: '企业名称', dataIndex: 'company_name', key: 'company_name' },
    {
      title: '查询类型',
      dataIndex: 'query_type',
      key: 'query_type',
      render: (v: string) => queryTypeLabelMap[v] || v,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <StatusPill text={statusLabelMap[status] || status} kind={statusKindMap[status] || 'neutral'} />
      ),
    },
    { title: '查询时间', dataIndex: 'created_at', key: 'created_at', render: (v: string) => formatDateTime(v) },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: any) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
          查看详情
        </Button>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <h2 style={pageH2Style}>尽调宝</h2>
      </div>

      {/* 顶部搜索区 */}
      <Card className="stitch-filter-bar" style={searchCardStyle}>
        <Space className="stitch-btn-group" style={{ width: '100%' }} size={12} wrap>
          <Input
            placeholder="请输入企业名称"
            prefix={<SearchOutlined />}
            style={{ width: 320 }}
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            onPressEnter={handleSearch}
          />
          <Select
            style={{ width: 160 }}
            value={queryType}
            onChange={setQueryType}
            options={[
              { value: 'basic', label: '基本信息' },
              { value: 'shareholder', label: '股东信息' },
              { value: 'legal', label: '法人信息' },
              { value: 'financial', label: '财务信息' },
              { value: 'risk', label: '风险信息' },
              { value: 'all', label: '全部' },
            ]}
          />
          <Select
            style={{ width: 180 }}
            allowClear
            placeholder="选择报告模板"
            value={templateId}
            onChange={(v) => setTemplateId(v)}
            options={templateOptions}
          />
          <Button type="primary" loading={searching} onClick={handleSearch}>查询</Button>
        </Space>
      </Card>

      {/* 查询结果展示区 */}
      {reportContent && (
        <Card
          title={`查询结果 - ${reportCompany}`}
          style={{ borderRadius: 16 }}
          extra={<Button type="link" onClick={() => { setReportContent(''); setReportCompany(''); setCurrentRecord(null) }}>关闭</Button>}
        >
          <ReportSections record={currentRecord} />
        </Card>
      )}

      {/* 历史查询记录列表 */}
      <div style={{ fontWeight: 600, color: theme.textBase, fontSize: 16, fontFamily: "'Noto Serif SC', serif" }}>
        历史查询记录
      </div>
      <Card className="stitch-table" style={tableCardStyle} styles={{ body: { padding: 0 } }}>
        <Table dataSource={list} columns={columns} loading={loading} rowKey="id" size="small" pagination={{ pageSize: 10 }} />
      </Card>

      {/* 详情Modal */}
      <Modal
        title={`尽调报告 - ${detailCompany}`}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={780}
      >
        <div style={{ maxHeight: '70vh', overflow: 'auto', paddingRight: 4 }}>
          <ReportSections record={detailRecord} />
        </div>
      </Modal>
    </div>
  )
}
