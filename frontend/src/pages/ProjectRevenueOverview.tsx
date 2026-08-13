import { useState, useCallback, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Table,
  Input,
  Button,
  Space,
  Statistic,
  message,
} from 'antd'
import {
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { theme } from '../constants/theme'
import { getProjectRevenueOverview } from '../api/finance-statement'
import type { ProjectRevenueItem } from '../api/finance-statement'

// 金额格式化
const fmtMoney = (v: number) => {
  return `¥${(Number(v || 0)).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function ProjectRevenueOverview() {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<ProjectRevenueItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getProjectRevenueOverview({ keyword: keyword || undefined, page, page_size: pageSize })
      setDataSource(res.data || [])
      setTotal(res.total || 0)
    } catch (err) {
      message.error('加载项目收入失败')
    } finally {
      setLoading(false)
    }
  }, [keyword, page, pageSize])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 统计汇总
  const summary = {
    totalIncome: dataSource.reduce((sum, r) => sum + Number(r.total_income || 0), 0),
    totalExpense: dataSource.reduce((sum, r) => sum + Number(r.total_expense || 0), 0),
    totalReceived: dataSource.reduce((sum, r) => sum + Number(r.received_amount || 0), 0),
    netProfit: dataSource.reduce((sum, r) => sum + Number(r.net_profit || 0), 0),
  }

  const columns = [
    {
      title: '案件编号',
      dataIndex: 'case_no',
      key: 'case_no',
      width: 140,
      render: (v: string) => <span style={{ color: theme.primary, fontWeight: 500 }}>{v}</span>,
    },
    { title: '案件名称', dataIndex: 'case_name', key: 'case_name', ellipsis: true },
    {
      title: '合同金额',
      dataIndex: 'contract_amount',
      key: 'contract_amount',
      width: 130,
      align: 'right' as const,
      render: (v: number) => fmtMoney(v),
    },
    {
      title: '到账金额',
      dataIndex: 'received_amount',
      key: 'received_amount',
      width: 130,
      align: 'right' as const,
      render: (v: number) => <span style={{ color: theme.primary }}>{fmtMoney(v)}</span>,
    },
    {
      title: '收入合计',
      dataIndex: 'total_income',
      key: 'total_income',
      width: 130,
      align: 'right' as const,
      render: (v: number) => <span style={{ fontWeight: 600, color: theme.success }}>{fmtMoney(v)}</span>,
    },
    {
      title: '支出合计',
      dataIndex: 'total_expense',
      key: 'total_expense',
      width: 130,
      align: 'right' as const,
      render: (v: number) => <span style={{ fontWeight: 600, color: theme.error }}>{fmtMoney(v)}</span>,
    },
    {
      title: '净收益',
      dataIndex: 'net_profit',
      key: 'net_profit',
      width: 130,
      align: 'right' as const,
      render: (v: number) => (
        <span style={{ fontWeight: 700, color: v >= 0 ? theme.success : theme.error }}>
          {fmtMoney(v)}
        </span>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 页面标题 */}
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: theme.textBase, margin: 0 }}>项目收入一览表</h2>
        <p style={{ color: theme.textTertiary, margin: '4px 0 0' }}>
          按案件维度汇总收入、支出与到账情况
        </p>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16}>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 12, background: theme.gradientStat1 }} styles={{ body: { padding: '20px 24px' } }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>本页收入</span>}
              value={summary.totalIncome}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#fff', fontFamily: "'Noto Serif SC', serif" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 12, background: theme.gradientStat3 }} styles={{ body: { padding: '20px 24px' } }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>本页支出</span>}
              value={summary.totalExpense}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#fff', fontFamily: "'Noto Serif SC', serif" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 12, background: theme.gradientStat2 }} styles={{ body: { padding: '20px 24px' } }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>本页到账</span>}
              value={summary.totalReceived}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#fff', fontFamily: "'Noto Serif SC', serif" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 12, background: theme.gradientStat4 }} styles={{ body: { padding: '20px 24px' } }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>本页净收益</span>}
              value={summary.netProfit}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#fff', fontFamily: "'Noto Serif SC', serif" }}
            />
          </Card>
        </Col>
      </Row>

      {/* 筛选栏 */}
      <Card className="stitch-filter-bar" style={{ borderRadius: 12 }} styles={{ body: { padding: 16 } }}>
        <Space wrap size={[12, 12]}>
          <Input
            placeholder="案件编号/名称搜索"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={() => setPage(1)}
            style={{ width: 240 }}
            allowClear
          />
          <Button type="primary" icon={<ReloadOutlined />} onClick={() => setPage(1)}>
            查询
          </Button>
          <Button
            onClick={() => {
              setKeyword('')
              setPage(1)
            }}
          >
            重置
          </Button>
        </Space>
      </Card>

      {/* 表格 */}
      <Card className="stitch-table" style={{ borderRadius: 16, overflow: 'hidden' }} styles={{ body: { padding: 0 } }}>
        <Table
          dataSource={dataSource}
          columns={columns}
          rowKey="case_id"
          loading={loading}
          size="middle"
          scroll={{ x: 1100 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showTotal: (t) => `共 ${t} 个项目`,
            onChange: (p, ps) => {
              setPage(p)
              setPageSize(ps)
            },
          }}
        />
      </Card>
    </div>
  )
}
