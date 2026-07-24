import { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  DatePicker,
  Button,
  Space,
  Spin,
  Empty,
  Segmented,
} from 'antd'
import {
  ReloadOutlined,
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  WalletOutlined,
  AccountBookOutlined,
  LineChartOutlined,
  BarChartOutlined,
  TableOutlined,
} from '@ant-design/icons'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import axios from '../api/axios'

const { RangePicker } = DatePicker

const cardStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.72)',
  backdropFilter: 'saturate(180%) blur(20px)',
  WebkitBackdropFilter: 'saturate(180%) blur(20px)',
  borderRadius: 16,
  border: '1px solid rgba(0, 0, 0, 0.06)',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.04)',
}

const metricCardStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.72)',
  backdropFilter: 'saturate(180%) blur(20px)',
  WebkitBackdropFilter: 'saturate(180%) blur(20px)',
  borderRadius: 16,
  border: '1px solid rgba(0, 0, 0, 0.06)',
  padding: 20,
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
}

const BAR_COLORS = ['#0071e3', '#34c759', '#ff9f0a', '#5856d6', '#ff375f', '#5ac8fa']

// 千分位金额格式化
const fmtMoney = (v: number, withSymbol = true) => {
  const formatted = (Number(v || 0)).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return withSymbol ? `¥${formatted}` : formatted
}

export default function FinanceDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const [dateRange, setDateRange] = useState<string[]>([])
  const [dim, setDim] = useState<'case_type' | 'team' | 'month'>('case_type')
  const [loading, setLoading] = useState(false)

  const [stats, setStats] = useState<any>({})
  const [revenueTrend, setRevenueTrend] = useState<any[]>([])
  const [profitStruct, setProfitStruct] = useState<any[]>([])
  const [dimStats, setDimStats] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [dateRange, dim])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = {
        org_id: user.organization_id,
        start_date: dateRange[0],
        end_date: dateRange[1],
      }
      const res = await axios.get('/dashboard/finance-dashboard', { params })
      setStats(res?.stats || {})
      setRevenueTrend(res?.revenue_trend || [])
      setProfitStruct(res?.profit_structure || [])
      setDimStats(res?.dim_stats || [])
    } catch (error) {
      console.error('Fetch finance dashboard error:', error)
    } finally {
      setLoading(false)
    }
  }

  // 指标卡片
  const metricCards = [
    {
      title: '总营收',
      value: fmtMoney(stats.total_revenue),
      icon: <DollarOutlined />,
      gradient: 'linear-gradient(135deg, #0071e3 0%, #00a8ff 100%)',
      trend: stats.revenue_trend,
    },
    {
      title: '回款金额',
      value: fmtMoney(stats.paid_amount),
      icon: <RiseOutlined />,
      gradient: 'linear-gradient(135deg, #34c759 0%, #5ac8fa 100%)',
      trend: stats.paid_trend,
    },
    {
      title: '应收账款',
      value: fmtMoney(stats.receivable),
      icon: <WalletOutlined />,
      gradient: 'linear-gradient(135deg, #ff9f0a 0%, #ffcc00 100%)',
      trend: stats.receivable_trend,
    },
    {
      title: '总成本',
      value: fmtMoney(stats.total_cost),
      icon: <FallOutlined />,
      gradient: 'linear-gradient(135deg, #ff375f 0%, #ff6482 100%)',
      trend: stats.cost_trend,
    },
    {
      title: '净利润',
      value: fmtMoney(stats.net_profit),
      icon: <AccountBookOutlined />,
      gradient: 'linear-gradient(135deg, #5856d6 0%, #af52de 100%)',
      trend: stats.profit_trend,
    },
  ]

  // 维度统计表列
  const dimColumns = [
    {
      title: dim === 'case_type' ? '案由' : dim === 'team' ? '团队' : '月份',
      dataIndex: 'dim_name',
      key: 'dim_name',
      render: (v: string) => <span style={{ fontWeight: 500, color: '#1d1d1f' }}>{v || '-'}</span>,
    },
    {
      title: '营收',
      dataIndex: 'revenue',
      key: 'revenue',
      align: 'right' as const,
      render: (v: number) => <span style={{ color: '#0071e3', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(v)}</span>,
    },
    {
      title: '成本',
      dataIndex: 'cost',
      key: 'cost',
      align: 'right' as const,
      render: (v: number) => <span style={{ color: '#ff375f', fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(v)}</span>,
    },
    {
      title: '利润',
      dataIndex: 'profit',
      key: 'profit',
      align: 'right' as const,
      render: (v: number) => <span style={{ color: '#34c759', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(v)}</span>,
    },
    {
      title: '利润率',
      dataIndex: 'profit_margin',
      key: 'profit_margin',
      align: 'right' as const,
      render: (v: number) => {
        const rate = Number(v || 0)
        const color = rate >= 30 ? 'green' : rate >= 15 ? 'orange' : 'red'
        return <Tag color={color} style={{ borderRadius: 8, fontWeight: 600 }}>{rate.toFixed(1)}%</Tag>
      },
    },
  ]

  return (
    <div style={{ animation: 'fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#1d1d1f', letterSpacing: -0.4 }}>财务经营数据看板</div>
        <div style={{ fontSize: 14, color: '#6e6e73', marginTop: 4 }}>营收、回款、成本、利润的多维度财务分析</div>
      </div>

      <Card style={{ ...cardStyle, marginBottom: 16 }} styles={{ body: { padding: 16 } }}>
        <Space wrap size={[12, 12]}>
          <RangePicker
            style={{ width: 240 }}
            value={dateRange as any}
            onChange={(_: any, dateStrings: [string, string]) => setDateRange(dateStrings)}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
            刷新
          </Button>
        </Space>
      </Card>

      {/* 指标卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {metricCards.map((card, idx) => (
          <Col xs={24} sm={12} md={8} lg={6} xl={4} key={idx}>
            <div style={metricCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: '#6e6e73', marginBottom: 8, letterSpacing: 0.2 }}>{card.title}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#1d1d1f', letterSpacing: -0.4, fontVariantNumeric: 'tabular-nums' }}>{card.value}</div>
                  {card.trend != null && (
                    <div style={{ fontSize: 12, marginTop: 8, color: Number(card.trend) >= 0 ? '#34c759' : '#ff375f', fontWeight: 500 }}>
                      {Number(card.trend) >= 0 ? '↑' : '↓'} {Math.abs(Number(card.trend)).toFixed(1)}% 较上期
                    </div>
                  )}
                </div>
                <div style={{
                  background: card.gradient,
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 18,
                }}>
                  {card.icon}
                </div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {/* 营收趋势折线图 */}
        <Col xs={24} lg={12}>
          <Card
            style={{ ...cardStyle, height: '100%' }}
            title={
              <Space>
                <LineChartOutlined style={{ color: '#0071e3' }} />
                <span style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f' }}>营收趋势</span>
              </Space>
            }
            styles={{ body: { padding: 24 } }}
          >
            <Spin spinning={loading}>
              {revenueTrend.length === 0 ? (
                <Empty description="暂无数据" />
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={revenueTrend} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6e6e73' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#6e6e73' }} tickFormatter={(v) => `¥${(Number(v) / 10000).toFixed(0)}万`} />
                    <Tooltip
                      formatter={(value: any) => [fmtMoney(Number(value)), '营收']}
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid rgba(0,0,0,0.06)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, color: '#6e6e73' }} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#0071e3"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#0071e3', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 7 }}
                      name="营收"
                    />
                    <Line
                      type="monotone"
                      dataKey="paid"
                      stroke="#34c759"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#34c759', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 7 }}
                      name="回款"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Spin>
          </Card>
        </Col>

        {/* 盈利结构柱状图 */}
        <Col xs={24} lg={12}>
          <Card
            style={{ ...cardStyle, height: '100%' }}
            title={
              <Space>
                <BarChartOutlined style={{ color: '#0071e3' }} />
                <span style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f' }}>盈利结构分析（按案由）</span>
              </Space>
            }
            styles={{ body: { padding: 24 } }}
          >
            <Spin spinning={loading}>
              {profitStruct.length === 0 ? (
                <Empty description="暂无数据" />
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={profitStruct} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                    <XAxis dataKey="case_type" tick={{ fontSize: 12, fill: '#6e6e73' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#6e6e73' }} tickFormatter={(v) => `${(Number(v) / 10000).toFixed(0)}万`} />
                    <Tooltip
                      formatter={(value: any) => fmtMoney(Number(value))}
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid rgba(0,0,0,0.06)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, color: '#6e6e73' }} />
                    <Bar dataKey="revenue" name="营收" fill="#0071e3" radius={[8, 8, 0, 0]} barSize={20}>
                      {profitStruct.map((_, idx) => (
                        <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                    <Bar dataKey="cost" name="成本" fill="#ff375f" radius={[8, 8, 0, 0]} barSize={20} />
                    <Bar dataKey="profit" name="利润" fill="#34c759" radius={[8, 8, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Spin>
          </Card>
        </Col>
      </Row>

      {/* 分维度统计表 */}
      <Card
        style={cardStyle}
        title={
          <Space direction="vertical" size={8}>
            <Space>
              <TableOutlined style={{ color: '#0071e3' }} />
              <span style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f' }}>分维度统计</span>
            </Space>
            <Segmented
              size="small"
              value={dim}
              onChange={(v) => setDim(v as 'case_type' | 'team' | 'month')}
              options={[
                { label: '按案由', value: 'case_type' },
                { label: '按团队', value: 'team' },
                { label: '按月份', value: 'month' },
              ]}
            />
          </Space>
        }
        styles={{ body: { padding: 0 } }}
      >
        <Table
          dataSource={dimStats}
          columns={dimColumns}
          rowKey={(record, idx) => `${record.dim_name}-${idx}`}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          size="middle"
          loading={loading}
        />
      </Card>
    </div>
  )
}
