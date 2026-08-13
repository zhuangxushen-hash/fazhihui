import { useState, useEffect, useMemo } from 'react'
import { Table, Button, DatePicker, Space, message, Card, Row, Col, Segmented } from 'antd'
import { DownloadOutlined, SearchOutlined, FileTextOutlined, DollarOutlined, RiseOutlined, FallOutlined, FundOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import { theme } from '../constants/theme'

const { RangePicker } = DatePicker

const pageH2Style: React.CSSProperties = {
  fontFamily: "'Noto Serif SC', serif",
  fontSize: 22,
  fontWeight: 600,
  color: theme.textBase,
  margin: 0,
  letterSpacing: '0.01em',
}

const tableCardStyle: React.CSSProperties = { borderRadius: 16, overflow: 'hidden' }
const kpiCardStyle: React.CSSProperties = { borderRadius: 12, overflow: 'hidden' }
const kpiBodyStyle: React.CSSProperties = { padding: '20px 24px' }

const fmtMoney = (v: number) => {
  return `¥${(Number(v || 0)).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Mock 报表数据
const monthlyData: Record<string, unknown>[] = [
  { id: 1, month: '2026-01', income: 568000, expense: 234000, profit: 334000, cases: 12, clients: 8 },
  { id: 2, month: '2026-02', income: 432000, expense: 198000, profit: 234000, cases: 9, clients: 6 },
  { id: 3, month: '2026-03', income: 789000, expense: 312000, profit: 477000, cases: 15, clients: 11 },
  { id: 4, month: '2026-04', income: 625000, expense: 278000, profit: 347000, cases: 11, clients: 9 },
  { id: 5, month: '2026-05', income: 915000, expense: 356000, profit: 559000, cases: 18, clients: 13 },
  { id: 6, month: '2026-06', income: 1024000, expense: 423000, profit: 601000, cases: 22, clients: 15 },
]

const quarterlyData: Record<string, unknown>[] = [
  { id: 1, quarter: '2026-Q1', income: 1789000, expense: 744000, profit: 1045000, cases: 36, clients: 25 },
  { id: 2, quarter: '2026-Q2', income: 2564000, expense: 1057000, profit: 1507000, cases: 51, clients: 37 },
]

const yearlyData: Record<string, unknown>[] = [
  { id: 1, year: '2024', income: 4500000, expense: 1800000, profit: 2700000, cases: 120, clients: 85 },
  { id: 2, year: '2025', income: 6800000, expense: 2720000, profit: 4080000, cases: 165, clients: 120 },
  { id: 3, year: '2026', income: 4353000, expense: 1801000, profit: 2552000, cases: 87, clients: 62 },
]

export default function FinanceReport() {
  const [reportType, setReportType] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly')
  const [dateRange, setDateRange] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [dataList, setDataList] = useState<Record<string, unknown>[]>([])

  // 初始化加载数据
  useEffect(() => {
    fetchData()
  }, [reportType, dateRange])

  // 获取数据
  const fetchData = async () => {
    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 300))
      if (reportType === 'monthly') {
        setDataList(monthlyData)
      } else if (reportType === 'quarterly') {
        setDataList(quarterlyData)
      } else {
        setDataList(yearlyData)
      }
    } catch (error) { /* 错误处理 */ }
    finally { setLoading(false) }
  }

  // 计算汇总统计
  const summary = useMemo(() => {
    const data = dataList
    const totalIncome = data.reduce((sum, item) => sum + (Number(item.income) || 0), 0)
    const totalExpense = data.reduce((sum, item) => sum + (Number(item.expense) || 0), 0)
    const totalProfit = totalIncome - totalExpense
    const totalCases = data.reduce((sum, item) => sum + (Number(item.cases) || 0), 0)
    const totalClients = data.reduce((sum, item) => sum + (Number(item.clients) || 0), 0)
    // 同比计算（与上一期相比）
    const lastItem = data[data.length - 1]
    const prevItem = data[data.length - 2]
    let yoyIncome = 0
    let yoyProfit = 0
    if (lastItem && prevItem) {
      yoyIncome = ((Number(lastItem.income) - Number(prevItem.income)) / Number(prevItem.income)) * 100
      yoyProfit = ((Number(lastItem.profit) - Number(prevItem.profit)) / Number(prevItem.profit)) * 100
    }
    return { totalIncome, totalExpense, totalProfit, totalCases, totalClients, yoyIncome, yoyProfit }
  }, [dataList])

  // 表格列定义
  const columns = useMemo(() => {
    const periodTitle = reportType === 'monthly' ? '月份' : reportType === 'quarterly' ? '季度' : '年度'
    const periodKey = reportType === 'monthly' ? 'month' : reportType === 'quarterly' ? 'quarter' : 'year'
    return [
      {
        title: periodTitle,
        dataIndex: periodKey,
        key: periodKey,
        width: 120,
      },
      {
        title: '收入金额',
        dataIndex: 'income',
        key: 'income',
        width: 150,
        align: 'right' as const,
        render: (val: number) => (
          <span style={{ color: theme.success, fontWeight: 600 }}>{fmtMoney(val)}</span>
        ),
      },
      {
        title: '支出金额',
        dataIndex: 'expense',
        key: 'expense',
        width: 150,
        align: 'right' as const,
        render: (val: number) => (
          <span style={{ color: theme.error, fontWeight: 600 }}>{fmtMoney(val)}</span>
        ),
      },
      {
        title: '净利润',
        dataIndex: 'profit',
        key: 'profit',
        width: 150,
        align: 'right' as const,
        render: (val: number) => (
          <span style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, color: theme.primaryDark }}>
            {fmtMoney(val)}
          </span>
        ),
      },
      {
        title: '案件数',
        dataIndex: 'cases',
        key: 'cases',
        width: 100,
        align: 'right' as const,
      },
      {
        title: '客户数',
        dataIndex: 'clients',
        key: 'clients',
        width: 100,
        align: 'right' as const,
      },
      {
        title: '利润率',
        key: 'margin',
        width: 120,
        align: 'right' as const,
        render: (_: unknown, record: Record<string, unknown>) => {
          const rate = (Number(record.profit) / Number(record.income)) * 100
          return (
            <span style={{ fontWeight: 500 }}>
              {rate.toFixed(1)}%
            </span>
          )
        },
      },
    ]
  }, [reportType])

  // 导出 CSV
  const handleExport = () => {
    if (!dataList.length) {
      message.warning('没有可导出的数据')
      return
    }
    const periodTitle = reportType === 'monthly' ? '月份' : reportType === 'quarterly' ? '季度' : '年度'
    const periodKey = reportType === 'monthly' ? 'month' : reportType === 'quarterly' ? 'quarter' : 'year'
    const headers = [periodTitle, '收入金额', '支出金额', '净利润', '案件数', '客户数', '利润率']
    const rows = dataList.map((item) => {
      const rate = (Number(item.profit) / Number(item.income)) * 100
      return [
        item[periodKey] || '',
        item.income || 0,
        item.expense || 0,
        item.profit || 0,
        item.cases || 0,
        item.clients || 0,
        `${rate.toFixed(1)}%`,
      ]
    })
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `财务报表_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    message.success('导出成功')
  }

  // 图表最大值（用于进度条比例）
  const maxIncome = useMemo(() => {
    return Math.max(...dataList.map((item) => Number(item.income) || 0), 1)
  }, [dataList])

  const maxExpense = useMemo(() => {
    return Math.max(...dataList.map((item) => Number(item.expense) || 0), 1)
  }, [dataList])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <h2 style={pageH2Style}>财务报表</h2>
      </div>

      {/* 报表类型选择 + 筛选条件 */}
      <Card className="stitch-filter-bar" style={{ borderRadius: 12 }} styles={{ body: { padding: 16 } }}>
        <Space wrap size={[16, 16]}>
          <Segmented
            value={reportType}
            onChange={(val) => setReportType(val as 'monthly' | 'quarterly' | 'yearly')}
            options={[
              { label: '月报', value: 'monthly' },
              { label: '季报', value: 'quarterly' },
              { label: '年报', value: 'yearly' },
            ]}
          />
          <RangePicker
            value={dateRange as unknown as [Dayjs, Dayjs] | undefined}
            onChange={(_: any, dateStrings: [string, string]) => setDateRange(dateStrings)}
          />
          <Button icon={<SearchOutlined />} onClick={fetchData} loading={loading}>
            查询
          </Button>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExport}
            style={{ background: theme.gradientPrimary }}
          >
            导出报表
          </Button>
        </Space>
      </Card>

      {/* KPI 统计卡片 */}
      <Row gutter={16}>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ ...kpiCardStyle, background: theme.gradientStat4 }} styles={{ body: kpiBodyStyle }}>
            <div style={{ color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <RiseOutlined style={{ fontSize: 20 }} />
                <span style={{ fontSize: 13, opacity: 0.85 }}>总收入</span>
              </div>
              <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 26, fontWeight: 60, marginTop: 8 }}>
                {fmtMoney(summary.totalIncome)}
              </div>
              {summary.yoyIncome !== 0 && (
                <div style={{ fontSize: 12, marginTop: 6, opacity: 0.85 }}>
                  同比 {summary.yoyIncome >= 0 ? '+' : ''}{summary.yoyIncome.toFixed(1)}%
                </div>
              )}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ ...kpiCardStyle, background: theme.gradientStat3 }} styles={{ body: kpiBodyStyle }}>
            <div style={{ color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FallOutlined style={{ fontSize: 20 }} />
                <span style={{ fontSize: 13, opacity: 0.85 }}>总支出</span>
              </div>
              <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 26, fontWeight: 60, marginTop: 8 }}>
                {fmtMoney(summary.totalExpense)}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ ...kpiCardStyle, background: theme.gradientStat1 }} styles={{ body: kpiBodyStyle }}>
            <div style={{ color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <DollarOutlined style={{ fontSize: 20 }} />
                <span style={{ fontSize: 13, opacity: 0.85 }}>净利润</span>
              </div>
              <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 26, fontWeight: 60, marginTop: 8 }}>
                {fmtMoney(summary.totalProfit)}
              </div>
              {summary.yoyProfit !== 0 && (
                <div style={{ fontSize: 12, marginTop: 6, opacity: 0.85 }}>
                  同比 {summary.yoyProfit >= 0 ? '+' : ''}{summary.yoyProfit.toFixed(1)}%
                </div>
              )}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ ...kpiCardStyle, background: theme.gradientStat2 }} styles={{ body: kpiBodyStyle }}>
            <div style={{ color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FundOutlined style={{ fontSize: 20 }} />
                <span style={{ fontSize: 13, opacity: 0.85 }}>案件/客户</span>
              </div>
              <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 26, fontWeight: 60, marginTop: 8 }}>
                {summary.totalCases} / {summary.totalClients}
              </div>
              <div style={{ fontSize: 12, marginTop: 6, opacity: 0.85 }}>案件数 / 客户数</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 数据可视化 - 简易柱条图 */}
      <Card
        title={
          <Space>
            <FileTextOutlined style={{ color: theme.primary }} />
            <span style={{ fontWeight: 600 }}>收支趋势概览</span>
          </Space>
        }
        style={{ borderRadius: 12 }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '0 8px' }}>
          {dataList.map((item, idx) => {
            const period = reportType === 'monthly' ? String(item.month) : reportType === 'quarterly' ? String(item.quarter) : String(item.year)
            const incomePct = (Number(item.income) / maxIncome) * 100
            const expensePct = (Number(item.expense) / maxExpense) * 100
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 80, fontSize: 13, color: theme.textTertiary, textAlign: 'right', flexShrink: 0 }}>
                  {period}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: theme.success, width: 36 }}>收入</span>
                    <div style={{ flex: 1, background: theme.bgSurfaceLow, borderRadius: 4, height: 20 }}>
                      <div
                        style={{
                          width: `${incomePct}%`,
                          height: '100%',
                          background: theme.gradientStat4,
                          borderRadius: 4,
                          transition: 'width 0.5s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          paddingRight: 8,
                          color: '#fff',
                          fontSize: 11,
                          fontWeight: 500,
                        }}
                      >
                        {fmtMoney(Number(item.income))}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: theme.error, width: 36 }}>支出</span>
                    <div style={{ flex: 1, background: theme.bgSurfaceLow, borderRadius: 4, height: 20 }}>
                      <div
                        style={{
                          width: `${expensePct}%`,
                          height: '100%',
                          background: theme.gradientStat3,
                          borderRadius: 4,
                          transition: 'width 0.5s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          paddingRight: 8,
                          color: '#fff',
                          fontSize: 11,
                          fontWeight: 500,
                        }}
                      >
                        {fmtMoney(Number(item.expense))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* 数据表格 */}
      <Card className="stitch-table" style={tableCardStyle} styles={{ body: { padding: 0 } }}>
        <Table
          dataSource={dataList}
          columns={columns}
          loading={loading}
          rowKey="id"
          size="middle"
          scroll={{ x: 900 }}
          pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
        />
      </Card>
    </div>
  )
}