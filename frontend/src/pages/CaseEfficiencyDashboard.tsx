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
} from 'antd'
import {
  ReloadOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  PieChartOutlined,
  LineChartOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import axios from '../api/axios'

const { RangePicker } = DatePicker

// 案件类型中英文映射
const CASE_TYPE_LABELS: Record<string, string> = {
  marriage: '婚姻家事',
  traffic: '交通事故',
  labor: '劳动争议',
  debt: '债务逾期',
  civil: '民事',
  criminal: '刑事',
  administrative: '行政',
  contract: '合同纠纷',
  other: '其他',
}

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

// 案件类型分布饼图颜色
const PIE_COLORS = ['#0071e3', '#34c759', '#ff9f0a', '#5856d6', '#ff375f', '#5ac8fa', '#af52de']

export default function CaseEfficiencyDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const [dateRange, setDateRange] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<any>({})
  const [caseTypeDist, setCaseTypeDist] = useState<any[]>([])
  const [closeTrend, setCloseTrend] = useState<any[]>([])
  const [lawyerStats, setLawyerStats] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [dateRange])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = {
        org_id: user.organization_id,
        start_date: dateRange[0],
        end_date: dateRange[1],
      }
      const res = await axios.get('/dashboard/case-efficiency', { params })
      setStats(res?.stats || {})
      setCaseTypeDist(res?.case_type_distribution || [])
      setCloseTrend(res?.close_trend || [])
      setLawyerStats(res?.lawyer_stats || [])
    } catch (error) {
      console.error('Fetch case efficiency error:', error)
    } finally {
      setLoading(false)
    }
  }

  // 指标卡片
  const metricCards = [
    {
      title: '案件总量',
      value: Number(stats.total_cases || 0).toLocaleString(),
      icon: <FileTextOutlined />,
      gradient: 'linear-gradient(135deg, #0071e3 0%, #00a8ff 100%)',
      suffix: '件',
    },
    {
      title: '在办案件数',
      value: Number(stats.processing_cases || 0).toLocaleString(),
      icon: <ClockCircleOutlined />,
      gradient: 'linear-gradient(135deg, #ff9f0a 0%, #ffcc00 100%)',
      suffix: '件',
    },
    {
      title: '结案数',
      value: Number(stats.closed_cases || 0).toLocaleString(),
      icon: <CheckCircleOutlined />,
      gradient: 'linear-gradient(135deg, #34c759 0%, #5ac8fa 100%)',
      suffix: '件',
    },
    {
      title: '平均办案周期',
      value: `${Number(stats.avg_cycle_days || 0).toFixed(1)}`,
      icon: <ClockCircleOutlined />,
      gradient: 'linear-gradient(135deg, #5856d6 0%, #af52de 100%)',
      suffix: '天',
    },
    {
      title: '节点超时率',
      value: `${(Number(stats.timeout_rate || 0)).toFixed(1)}%`,
      icon: <WarningOutlined />,
      gradient: 'linear-gradient(135deg, #ff375f 0%, #ff6482 100%)',
      suffix: '',
    },
  ]

  // 律师效能明细表
  const lawyerColumns = [
    {
      title: '律师姓名',
      dataIndex: 'lawyer_name',
      key: 'lawyer_name',
      render: (v: string) => <span style={{ fontWeight: 600, color: '#1d1d1f' }}>{v || '-'}</span>,
    },
    {
      title: '在办数',
      dataIndex: 'processing_count',
      key: 'processing_count',
      align: 'right' as const,
      render: (v: number) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{(v || 0).toLocaleString()}</span>,
    },
    {
      title: '结案数',
      dataIndex: 'closed_count',
      key: 'closed_count',
      align: 'right' as const,
      render: (v: number) => <span style={{ fontVariantNumeric: 'tabular-nums', color: '#34c759', fontWeight: 600 }}>{(v || 0).toLocaleString()}</span>,
    },
    {
      title: '人均结案',
      dataIndex: 'avg_closed',
      key: 'avg_closed',
      align: 'right' as const,
      render: (v: number) => <span style={{ fontVariantNumeric: 'tabular-nums', color: '#0071e3', fontWeight: 600 }}>{(Number(v || 0)).toFixed(1)}</span>,
    },
    {
      title: '平均周期(天)',
      dataIndex: 'avg_cycle_days',
      key: 'avg_cycle_days',
      align: 'right' as const,
      render: (v: number) => {
        const val = Number(v || 0)
        const color = val <= 30 ? '#34c759' : val <= 60 ? '#ff9f0a' : '#ff375f'
        return <span style={{ fontVariantNumeric: 'tabular-nums', color, fontWeight: 500 }}>{val.toFixed(1)}</span>
      },
    },
    {
      title: '结案率',
      dataIndex: 'close_rate',
      key: 'close_rate',
      align: 'right' as const,
      render: (v: number) => {
        const rate = Number(v || 0)
        const color = rate >= 70 ? 'green' : rate >= 40 ? 'orange' : 'red'
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
        <div style={{ fontSize: 28, fontWeight: 700, color: '#1d1d1f', letterSpacing: -0.4 }}>办案效能分析看板</div>
        <div style={{ fontSize: 14, color: '#6e6e73', marginTop: 4 }}>案件类型分布、结案趋势与律师效能多维分析</div>
      </div>

      {/* 筛选区 */}
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
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 26, fontWeight: 700, color: '#1d1d1f', letterSpacing: -0.4, fontVariantNumeric: 'tabular-nums' }}>{card.value}</span>
                    {card.suffix && <span style={{ fontSize: 12, color: '#6e6e73' }}>{card.suffix}</span>}
                  </div>
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
        {/* 案件类型分布饼图 */}
        <Col xs={24} lg={12}>
          <Card
            style={{ ...cardStyle, height: '100%' }}
            title={
              <Space>
                <PieChartOutlined style={{ color: '#0071e3' }} />
                <span style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f' }}>案件类型分布</span>
              </Space>
            }
            styles={{ body: { padding: 24 } }}
          >
            <Spin spinning={loading}>
              {caseTypeDist.length === 0 ? (
                <Empty description="暂无数据" />
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={caseTypeDist}
                      dataKey="count"
                      nameKey="case_type"
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      innerRadius={60}
                      paddingAngle={2}
                      label={(entry: any) => `${CASE_TYPE_LABELS[entry.case_type] || entry.case_type}: ${entry.count}`}
                      labelLine={false}
                    >
                      {caseTypeDist.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: any, props: any) => [`${Number(value).toLocaleString()} 件`, CASE_TYPE_LABELS[props.payload.case_type] || name]}
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid rgba(0,0,0,0.06)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                      }}
                    />
                    <Legend
                      formatter={(value: string) => CASE_TYPE_LABELS[value] || value}
                      verticalAlign="bottom"
                      iconType="circle"
                      wrapperStyle={{ fontSize: 12, color: '#6e6e73' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Spin>
          </Card>
        </Col>

        {/* 结案趋势折线图 */}
        <Col xs={24} lg={12}>
          <Card
            style={{ ...cardStyle, height: '100%' }}
            title={
              <Space>
                <LineChartOutlined style={{ color: '#0071e3' }} />
                <span style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f' }}>结案趋势</span>
              </Space>
            }
            styles={{ body: { padding: 24 } }}
          >
            <Spin spinning={loading}>
              {closeTrend.length === 0 ? (
                <Empty description="暂无数据" />
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={closeTrend} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: '#6e6e73' }}
                    />
                    <YAxis tick={{ fontSize: 12, fill: '#6e6e73' }} />
                    <Tooltip
                      formatter={(value: any) => [`${Number(value).toLocaleString()} 件`, '结案数']}
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid rgba(0,0,0,0.06)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="closed_count"
                      stroke="#0071e3"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#0071e3', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 7 }}
                      name="结案数"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Spin>
          </Card>
        </Col>
      </Row>

      {/* 律师效能明细表 */}
      <Card
        style={cardStyle}
        title={
          <Space>
            <TeamOutlined style={{ color: '#0071e3' }} />
            <span style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f' }}>律师效能明细</span>
          </Space>
        }
        styles={{ body: { padding: 0 } }}
      >
        <Table
          dataSource={lawyerStats}
          columns={lawyerColumns}
          rowKey={(record, idx) => `${record.lawyer_id}-${idx}`}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          size="middle"
          loading={loading}
        />
      </Card>
    </div>
  )
}
