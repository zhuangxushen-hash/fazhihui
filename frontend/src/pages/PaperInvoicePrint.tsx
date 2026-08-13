import { useState, useCallback, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Select,
  DatePicker,
  message,
} from 'antd'
import { PrinterOutlined, ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { theme } from '../constants/theme'
import { formatDate } from '../utils/format'
import { getInvoicePrintData } from '../api/finance-statement'
import type { InvoicePrintItem } from '../api/finance-statement'

// 金额格式化
const fmtMoney = (v: number) => {
  return `¥${(Number(v || 0)).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// 状态映射
const statusMap: Record<string, { label: string; className: string }> = {
  draft: { label: '待开票', className: 'stitch-tag stitch-tag-warning' },
  issued: { label: '已开票', className: 'stitch-tag stitch-tag-success' },
  paid: { label: '已付款', className: 'stitch-tag stitch-tag-info' },
  cancelled: { label: '已作废', className: 'stitch-tag' },
}

export default function PaperInvoicePrint() {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<InvoicePrintItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [status, setStatus] = useState('')
  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().startOf('month').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD'),
  ])

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getInvoicePrintData({
        status: status || undefined,
        start_date: dateRange[0],
        end_date: dateRange[1],
        page,
        page_size: pageSize,
      })
      setDataSource(res.data || [])
      setTotal(res.total || 0)
    } catch (err) {
      message.error('加载发票数据失败')
    } finally {
      setLoading(false)
    }
  }, [status, dateRange, page, pageSize])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 打印当前页
  const handlePrint = () => {
    window.print()
  }

  const columns = [
    {
      title: '发票号码',
      dataIndex: 'invoice_no',
      key: 'invoice_no',
      width: 160,
      render: (v: string) => <span style={{ color: theme.primary, fontWeight: 500 }}>{v || '-'}</span>,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right' as const,
      render: (v: number) => fmtMoney(v),
    },
    {
      title: '税额',
      dataIndex: 'tax_amount',
      key: 'tax_amount',
      width: 120,
      align: 'right' as const,
      render: (v: number) => fmtMoney(v),
    },
    {
      title: '价税合计',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 130,
      align: 'right' as const,
      render: (v: number) => <span style={{ fontWeight: 600 }}>{fmtMoney(v)}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => {
        const cfg = statusMap[v] || { label: v, className: 'stitch-tag' }
        return <span className={cfg.className}>{cfg.label}</span>
      },
    },
    {
      title: '开票时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      render: (v: string) => formatDate(v),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 页面标题 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: theme.textBase, margin: 0 }}>纸质发票打印</h2>
          <p style={{ color: theme.textTertiary, margin: '4px 0 0' }}>
            查询纸质发票明细并打印
          </p>
        </div>
        <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
          打印发票
        </Button>
      </div>

      {/* 筛选栏 */}
      <Card className="stitch-filter-bar print-hide" style={{ borderRadius: 12 }} styles={{ body: { padding: 16 } }}>
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
          <Select
            placeholder="发票状态"
            style={{ width: 140 }}
            value={status || undefined}
            onChange={(v) => {
              setStatus(v || '')
              setPage(1)
            }}
            options={[
              { value: '', label: '全部状态' },
              { value: 'issued', label: '已开票' },
              { value: 'paid', label: '已付款' },
              { value: 'cancelled', label: '已作废' },
            ]}
          />
          <Button type="primary" icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
            查询
          </Button>
        </Space>
      </Card>

      {/* 发票明细表格 */}
      <Card className="stitch-table" style={{ borderRadius: 16, overflow: 'hidden' }} styles={{ body: { padding: 0 } }}>
        <Table
          dataSource={dataSource}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="middle"
          scroll={{ x: 900 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showTotal: (t) => `共 ${t} 张发票`,
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
