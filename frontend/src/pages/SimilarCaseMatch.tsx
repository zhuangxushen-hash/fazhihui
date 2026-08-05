import { useState, useEffect } from 'react'
import { Table, Button, Input, Select, Space, Card, Tag, Statistic, Row, Col, Progress, message } from 'antd'
import { SearchOutlined, FileSearchOutlined, RiseOutlined, FundOutlined } from '@ant-design/icons'
import axios from '../api/axios'
import { theme } from '../constants/theme'
const pageH2Style: React.CSSProperties = {
  fontFamily: "'Noto Serif SC', serif",
  fontSize: 22,
  fontWeight: 600,
  color: theme.textBase,
  margin: 0,
  letterSpacing: '0.01em',
}

const searchBarStyle: React.CSSProperties = {
  background: theme.white,
  padding: 20,
  borderRadius: 12,
  border: `1px solid ${theme.border}`,
  marginBottom: 16,
  display: 'flex',
  gap: 16,
  flexWrap: 'wrap',
  alignItems: 'center',
}

const tableCardStyle: React.CSSProperties = {
  borderRadius: 16,
  overflow: 'hidden',
}

const statCardStyle: React.CSSProperties = {
  borderRadius: 16,
  marginBottom: 16,
}

const caseTypeOptions = [
  { value: 'marriage', label: '婚姻家事' },
  { value: 'traffic', label: '交通事故' },
  { value: 'labor', label: '劳动争议' },
  { value: 'debt', label: '债务逾期' },
  { value: 'criminal', label: '刑事辩护' },
  { value: 'contract', label: '合同纠纷' },
  { value: 'other', label: '其他' },
]

const getCaseTypeLabel = (value: string) => {
  return caseTypeOptions.find(o => o.value === value)?.label || value || '-'
}

const getSimilarityColor = (score: number) => {
  if (score >= 0.8) return theme.success
  if (score >= 0.6) return theme.primary
  if (score >= 0.4) return theme.warning
  return theme.textTertiary
}

const getSimilarityLabel = (score: number) => {
  if (score >= 0.8) return '高度相似'
  if (score >= 0.6) return '较为相似'
  if (score >= 0.4) return '有一定关联'
  return '参考价值较低'
}

export default function SimilarCaseMatch() {
  const [searchParams, setSearchParams] = useState({
    case_type: '',
    amount: '',
    court: '',
    year: '',
  })
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = (await axios.get('/similar-cases/stats', {
        params: { org_id: user.organization_id },
      })) as Record<string, unknown>
      const data = res.data || res
      setStats(data)
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  const handleSearch = async () => {
    if (!searchParams.case_type && !searchParams.amount && !searchParams.court) {
      message.warning('请至少填写一个搜索条件')
      return
    }
    setLoading(true)
    setHasSearched(true)
    try {
      const payload: any = {}
      if (searchParams.case_type) payload.case_type = searchParams.case_type
      if (searchParams.amount) payload.amount = Number(searchParams.amount)
      if (searchParams.court) payload.court = searchParams.court
      if (searchParams.year) payload.year = Number(searchParams.year)

      const res = (await axios.post('/similar-cases/search', payload)) as Record<string, unknown>
      const data = (res.data || res) as Record<string, unknown>
      // 兼容接口返回 { data: [...] } 或直接返回数组
      const list = (data.data || []) as Record<string, unknown>[]
      setResults(list)
      if (list.length === 0) {
        message.info('未找到匹配的相似案件')
      } else {
        message.success(`找到 ${list.length} 条相似案件`)
      }
    } catch (error) {
      message.error('搜索失败')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSearchParams({ case_type: '', amount: '', court: '', year: '' })
    setResults([])
    setHasSearched(false)
  }

  const columns = [
    {
      title: '相似度',
      dataIndex: 'similarity',
      key: 'similarity',
      width: 160,
      sorter: (a: any, b: any) => a.similarity - b.similarity,
      defaultSortOrder: 'descend' as const,
      render: (score: number) => {
        const color = getSimilarityColor(score)
        const percent = Math.round(score * 100)
        return (
          <div>
            <Progress
              percent={percent}
              strokeColor={color}
              size="small"
              showInfo={false}
              style={{ marginBottom: 4 }}
            />
            <Tag className="stitch-tag" style={{ color, borderColor: color, background: 'transparent' }}>
              {getSimilarityLabel(score)} ({percent}%)
            </Tag>
          </div>
        )
      },
    },
    { title: '案件编号', dataIndex: 'case_no', key: 'case_no', width: 140 },
    {
      title: '案由',
      dataIndex: 'case_type',
      key: 'case_type',
      width: 120,
      render: (type: string) => <Tag className="stitch-tag stitch-tag-primary">{getCaseTypeLabel(type)}</Tag>,
    },
    {
      title: '涉案金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      render: (amount: number) => {
        if (!amount) return <span style={{ color: theme.textTertiary }}>-</span>
        return <span style={{ fontWeight: 500 }}>{`¥${Number(amount).toLocaleString()}`}</span>
      },
    },
    { title: '受理法院', dataIndex: 'court', key: 'court', width: 160, render: (v: string) => v || '-' },
    {
      title: '客户姓名',
      dataIndex: 'client_name',
      key: 'client_name',
      width: 120,
      render: (v: string) => v || '-',
    },
    {
      title: '判决日期',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (v: string) => {
        if (!v) return '-'
        return new Date(v).toLocaleDateString('zh-CN')
      },
    },
    {
      title: '案由匹配',
      key: 'match_case_type',
      width: 100,
      render: (_: any, record: any) => {
        const matched = record.case_type === searchParams.case_type
        return <Tag className={matched ? 'stitch-tag stitch-tag-success' : 'stitch-tag stitch-tag-primary'}>{matched ? '是' : '否'}</Tag>
      },
    },
    {
      title: '金额匹配度',
      key: 'match_amount',
      width: 120,
      render: (_: any, record: any) => {
        if (!searchParams.amount || !record.amount) {
          return <span style={{ color: theme.textTertiary }}>-</span>
        }
        const diff = Math.abs(Number(record.amount) - Number(searchParams.amount))
        const base = Math.max(Number(record.amount), Number(searchParams.amount))
        const score = Math.max(0, 1 - diff / base)
        const percent = Math.round(score * 100)
        return (
          <Tag className={score >= 0.8 ? 'stitch-tag stitch-tag-success' : score >= 0.5 ? 'stitch-tag stitch-tag-warning' : 'stitch-tag stitch-tag-error'}>
            {percent}%
          </Tag>
        )
      },
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <h2 style={pageH2Style}>类案精准匹配</h2>
      </div>

      {stats && (
        <Row gutter={16}>
          <Col span={6}>
            <Card style={statCardStyle}>
              <Statistic
                title="历史结案数"
                value={stats.total_cases || 0}
                prefix={<FileSearchOutlined style={{ color: theme.primary }} />}
                valueStyle={{ color: theme.primary }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={statCardStyle}>
              <Statistic
                title="近30天新增"
                value={stats.recent_cases_count || 0}
                prefix={<RiseOutlined style={{ color: theme.success }} />}
                valueStyle={{ color: theme.success }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={statCardStyle}>
              <Statistic
                title="平均涉案金额"
                value={stats.average_amount || 0}
                prefix="¥"
                precision={0}
                valueStyle={{ color: theme.warning }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={statCardStyle}>
              <Statistic
                title="案由种类"
                value={stats.case_type_distribution?.length || 0}
                prefix={<FundOutlined style={{ color: '#722ed1' }} />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <div className="stitch-filter-bar" style={searchBarStyle}>
        <div style={{ width: '100%', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: theme.textSecondary, fontWeight: 500 }}>案由：</span>
            <Select
              placeholder="选择案由"
              style={{ width: 180 }}
              allowClear
              value={searchParams.case_type || undefined}
              onChange={(value) => setSearchParams({ ...searchParams, case_type: value || '' })}
            >
              {caseTypeOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
            </Select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: theme.textSecondary, fontWeight: 500 }}>金额：</span>
            <Input
              placeholder="涉案金额（元）"
              style={{ width: 160 }}
              value={searchParams.amount}
              onChange={(e) => setSearchParams({ ...searchParams, amount: e.target.value })}
              prefix={<span style={{ color: theme.textTertiary }}>¥</span>}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: theme.textSecondary, fontWeight: 500 }}>法院：</span>
            <Input
              placeholder="受理法院关键词"
              style={{ width: 180 }}
              value={searchParams.court}
              onChange={(e) => setSearchParams({ ...searchParams, court: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: theme.textSecondary, fontWeight: 500 }}>年份：</span>
            <Select
              placeholder="选择年份"
              style={{ width: 120 }}
              allowClear
              value={searchParams.year || undefined}
              onChange={(value) => setSearchParams({ ...searchParams, year: value || '' })}
            >
              {Array.from({ length: 10 }, (_, i) => {
                const year = new Date().getFullYear() - i
                return <Select.Option key={year} value={year}>{year}年</Select.Option>
              })}
            </Select>
          </div>
          <div style={{ flex: 1 }} />
          <Space className="stitch-btn-group">
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              开始匹配
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </div>
      </div>

      <Card className="stitch-table" style={tableCardStyle} styles={{ body: { padding: 0 } }}>
        <Table
          dataSource={results}
          columns={columns}
          loading={loading}
          rowKey="id"
          size="small"
          locale={{
            emptyText: hasSearched ? '暂无匹配结果' : '请输入搜索条件开始匹配相似案件',
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共找到 ${total} 条相似案件`,
          }}
        />
      </Card>
    </div>
  )
}