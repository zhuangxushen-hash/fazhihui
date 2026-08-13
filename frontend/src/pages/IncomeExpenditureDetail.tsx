import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Row,
  Col,
  Table,
  DatePicker,
  Button,
  Space,
  Statistic,
  Tag,
  message,
} from 'antd'
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { theme } from '../constants/theme'
import { formatDate } from '../utils/format'
import { getIncomeExpenditureDetail } from '../api/finance-statement'
import type { IncomeExpenditureItem } from '../api/finance-statement'

// 金额格式化
const fmtMoney = (v: number) => {
  return `¥${(Number(v || 0)).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// 详情类型配置
const detailTypeConfig: Record<string, { label: string; color: string; isIncome: boolean }> = {
  project_revenue: { label: '项目收入', color: theme.success, isIncome: true },
  repayment: { label: '还款收入', color: theme.success, isIncome: true },
  deposit: { label: '存款收入', color: theme.success, isIncome: true },
  other_income: { label: '其他收入', color: theme.success, isIncome: true },
  reimburse: { label: '报销支出', color: theme.error, isIncome: false },
  account_withdrawal: { label: '台账提款', color: theme.error, isIncome: false },
  borrowing: { label: '借款支出', color: theme.error, isIncome: false },
  other_expense: { label: '其他支出', color: theme.error, isIncome: false },
}

export default function IncomeExpenditureDetail() {
  const { type } = useParams<{ type: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<IncomeExpenditureItem[]>([])
  const [total, setTotal] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().startOf('month').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD'),
  ])

  const config = detailTypeConfig[type || ''] || { label: type || '收支详情', color: theme.primary, isIncome: true }

  // 加载数据
  const loadData = useCallback(async () => {
    if (!type) return
    setLoading(true)
    try {
      const res = await getIncomeExpenditureDetail(type, {
        start_date: dateRange[0],
        end_date: dateRange[1],
        page,
        page_size: pageSize,
      })
      setDataSource(res.data || [])
      setTotal(res.total || 0)
      setTotalAmount(res.total_amount || 0)
    } catch (err) {
      message.error('加载收支详情失败')
    } finally {
      setLoading(false)
    }
  }, [type, dateRange, page, pageSize])

  useEffect(() => {
    loadData()
  }, [loadData])

  const columns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (v: string) => (
        <Tag color={v === 'income' ? 'green' : 'red'}>{v === 'income' ? '收入' : '支出'}</Tag>
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      align: 'right' as const,
      render: (v: number) => (
        <span style={{ fontWeight: 600, color: config.isIncome ? theme.success : theme.error }}>
          {fmtMoney(v)}
        </span>
      ),
    },
    { title: '付款方', dataIndex: 'payer', key: 'payer', width: 140, render: (v: string) => v || '-' },
    { title: '收款方', dataIndex: 'payee', key: 'payee', width: 140, render: (v: string) => v || '-' },
    {
      title: '付款日期',
      dataIndex: 'payment_date',
      key: 'payment_date',
      width: 120,
      render: (v: string) => formatDate(v),
    },
    {
      title: '付款方式',
      dataIndex: 'payment_method',
      key: 'payment_method',
      width: 120,
      render: (v?: string) => v || '-',
    },
    { title: '备注', dataIndex: 'remarks', key: 'remarks', ellipsis: true, render: (v?: string) => v || '-' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 页面标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/finance/income-expenditure')}>
          返回
        </Button>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: theme.textBase, margin: 0 }}>
          {config.label}一览表
        </h2>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 12, background: theme.gradientStat1 }} styles={{ body: { padding: '20px 24px' } }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>期间金额</span>}
              value={totalAmount}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#fff', fontFamily: "'Noto Serif SC', serif" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 12, background: theme.gradientStat2 }} styles={{ body: { padding: '20px 24px' } }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>记录数</span>}
              value={total}
              suffix="条"
              valueStyle={{ color: '#fff', fontFamily: "'Noto Serif SC', serif" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 12, background: theme.gradientStat3 }} styles={{ body: { padding: '20px 24px' } }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>平均单笔</span>}
              value={total > 0 ? totalAmount / total : 0}
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
          <DatePicker.RangePicker
            value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
            onChange={(dates) => {
              setDateRange([
                dates?.[0] ? dates[0].format('YYYY-MM-DD') : '',
                dates?.[1] ? dates[1].format('YYYY-MM-DD') : '',
              ])
              setPage(1)
            }}
          />
          <Button type="primary" icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
            查询
          </Button>
        </Space>
      </Card>

      {/* 表格 */}
      <Card className="stitch-table" style={{ borderRadius: 16, overflow: 'hidden' }} styles={{ body: { padding: 0 } }}>
        <Table
          dataSource={dataSource}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="middle"
          scroll={{ x: 1000 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showTotal: (t) => `共 ${t} 条`,
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
