import { useState, useCallback, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Table,
  Select,
  DatePicker,
  Button,
  Space,
  Statistic,
  message,
  Tabs,
} from 'antd'
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { theme } from '../constants/theme'
import { formatDate } from '../utils/format'
import { getAccountStatement } from '../api/finance-statement'
import type { AccountStatementItem } from '../api/finance-statement'
// V3.2 合并：账户结算（原独立页 AccountSettlement）并入账户台账
import AccountSettlement from './AccountSettlement'

// 金额格式化
const fmtMoney = (v: number) => {
  return `¥${(Number(v || 0)).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// 收支类型选项
const typeOptions = [
  { value: '', label: '全部收支' },
  { value: 'income', label: '收入' },
  { value: 'expense', label: '支出' },
]

// 业务款分类选项
const categoryOptions = [
  { value: '', label: '全部分类' },
  { value: 'lawyer_fee', label: '律师费' },
  { value: 'agency_fee', label: '代理费' },
  { value: 'preservation_fee', label: '保全费' },
  { value: 'appraisal_fee', label: '鉴定费' },
  { value: 'withholding', label: '代扣' },
  { value: 'withholding_offset', label: '代扣冲抵' },
  { value: 'other', label: '其他' },
]

export default function AccountStatistics() {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<AccountStatementItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    startDate: dayjs().startOf('month').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
  })
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, net_amount: 0 })

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAccountStatement({
        start_date: filters.startDate,
        end_date: filters.endDate,
        type: filters.type || undefined,
        category: filters.category || undefined,
        page,
        page_size: pageSize,
      })
      setDataSource(res.data || [])
      setTotal(res.total || 0)
      setSummary(res.summary || { total_income: 0, total_expense: 0, net_amount: 0 })
    } catch (err) {
      message.error('加载账户台账失败')
    } finally {
      setLoading(false)
    }
  }, [filters, page, pageSize])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 重置筛选
  const handleReset = () => {
    setFilters({
      type: '',
      category: '',
      startDate: dayjs().startOf('month').format('YYYY-MM-DD'),
      endDate: dayjs().format('YYYY-MM-DD'),
    })
    setPage(1)
  }

  const columns = [
    {
      title: '收支方向',
      dataIndex: 'direction_label',
      key: 'direction_label',
      width: 90,
      render: (v: string, record: AccountStatementItem) => (
        <span
          style={{
            color: record.type === 'income' ? theme.success : theme.error,
            fontWeight: 500,
          }}
        >
          {record.type === 'income' ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {v}
        </span>
      ),
    },
    {
      title: '业务款分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (v: string) => {
        const cfg = categoryOptions.find((o) => o.value === v)
        return <span>{cfg?.label || v}</span>
      },
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      align: 'right' as const,
      render: (v: number, record: AccountStatementItem) => (
        <span style={{ fontWeight: 600, color: record.type === 'income' ? theme.success : theme.error }}>
          {fmtMoney(v)}
        </span>
      ),
    },
    { title: '付款方', dataIndex: 'payer', key: 'payer', width: 120, render: (v: string) => v || '-' },
    { title: '收款方', dataIndex: 'payee', key: 'payee', width: 120, render: (v: string) => v || '-' },
    {
      title: '付款日期',
      dataIndex: 'payment_date',
      key: 'payment_date',
      width: 120,
      render: (v: string) => formatDate(v),
    },
    { title: '备注', dataIndex: 'remarks', key: 'remarks', ellipsis: true, render: (v?: string) => v || '-' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* V3.2 合并：账户台账 + 账户结算 */}
      <Tabs
        defaultActiveKey="ledger"
        items={[
          {
            key: 'ledger',
            label: '账户台账',
            children: (
              <>
      {/* 页面标题 */}
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: theme.textBase, margin: 0 }}>账户台账结算明细表</h2>
        <p style={{ color: theme.textTertiary, margin: '4px 0 0' }}>
          按时间段汇总业务款收支，生成账户台账结算明细
        </p>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 12, background: theme.gradientStat1 }} styles={{ body: { padding: '20px 24px' } }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>总收入</span>}
              value={summary.total_income}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#fff', fontFamily: "'Noto Serif SC', serif" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 12, background: theme.gradientStat3 }} styles={{ body: { padding: '20px 24px' } }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>总支出</span>}
              value={summary.total_expense}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#fff', fontFamily: "'Noto Serif SC', serif" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 12, background: theme.gradientStat2 }} styles={{ body: { padding: '20px 24px' } }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>结余</span>}
              value={summary.net_amount}
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
            value={[filters.startDate ? dayjs(filters.startDate) : null, filters.endDate ? dayjs(filters.endDate) : null]}
            onChange={(dates) => {
              setFilters({
                ...filters,
                startDate: dates?.[0] ? dates[0].format('YYYY-MM-DD') : '',
                endDate: dates?.[1] ? dates[1].format('YYYY-MM-DD') : '',
              })
            }}
          />
          <Select
            placeholder="收支类型"
            style={{ width: 130 }}
            value={filters.type || undefined}
            onChange={(v) => {
              setFilters({ ...filters, type: v || '' })
              setPage(1)
            }}
            options={typeOptions}
          />
          <Select
            placeholder="业务款分类"
            style={{ width: 140 }}
            value={filters.category || undefined}
            onChange={(v) => {
              setFilters({ ...filters, category: v || '' })
              setPage(1)
            }}
            options={categoryOptions}
          />
          <Button type="primary" icon={<ReloadOutlined />} onClick={() => setPage(1)}>
            查询
          </Button>
          <Button onClick={handleReset}>重置</Button>
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
              </>
            ),
          },
          {
            key: 'settlement',
            label: '账户结算',
            children: <AccountSettlement />,
          },
        ]}
      />
    </div>
  )
}
