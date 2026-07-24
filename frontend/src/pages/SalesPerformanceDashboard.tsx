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
  Tabs,
  Spin,
  Empty,
} from 'antd'
import {
  ReloadOutlined,
  PhoneOutlined,
  UserOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  TeamOutlined,
  DollarOutlined,
} from '@ant-design/icons'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import axios from '../api/axios'

const { RangePicker } = DatePicker

// 苹果风格卡片样式
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

// 排行榜颜色
const RANK_COLORS = ['#0071e3', '#34c759', '#ff9f0a', '#5856d6', '#ff375f']

export default function SalesPerformanceDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const [activeTab, setActiveTab] = useState<'invite' | 'negotiate'>('invite')
  const [dateRange, setDateRange] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const [performance, setPerformance] = useState<any>({})
  const [ranking, setRanking] = useState<any[]>([])
  const [details, setDetails] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [activeTab, dateRange])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = {
        org_id: user.organization_id,
        start_date: dateRange[0],
        end_date: dateRange[1],
        dimension: activeTab === 'invite' ? 'inviter' : 'negotiator',
      }
      const [perfRes, rankRes] = await Promise.all([
        axios.get('/dashboard/sales-performance', {
          params: { org_id: user.organization_id, start_date: dateRange[0], end_date: dateRange[1] },
        }),
        axios.get('/dashboard/sales-ranking', params),
      ])
      setPerformance(perfRes || {})
      const rankList = (rankRes || []).slice(0, 5)
      setRanking(rankList)
      setDetails(rankRes || [])
    } catch (error) {
      console.error('Fetch sales performance error:', error)
    } finally {
      setLoading(false)
    }
  }

  // 邀约岗指标卡片
  const inviteMetrics = [
    {
      title: '接通量',
      value: Number(performance.connect_count || 0).toLocaleString(),
      icon: <PhoneOutlined />,
      gradient: 'linear-gradient(135deg, #0071e3 0%, #00a8ff 100%)',
      suffix: '次',
    },
    {
      title: '邀约量',
      value: Number(performance.invite_count || 0).toLocaleString(),
      icon: <UserOutlined />,
      gradient: 'linear-gradient(135deg, #34c759 0%, #5ac8fa 100%)',
      suffix: '人',
    },
    {
      title: '到所量',
      value: Number(performance.arrival_count || 0).toLocaleString(),
      icon: <CheckCircleOutlined />,
      gradient: 'linear-gradient(135deg, #ff9f0a 0%, #ffcc00 100%)',
      suffix: '人',
    },
    {
      title: '到所率',
      value: `${(Number(performance.arrival_rate || 0)).toFixed(1)}%`,
      icon: <TrophyOutlined />,
      gradient: 'linear-gradient(135deg, #5856d6 0%, #af52de 100%)',
      suffix: '',
    },
    {
      title: '人均产能',
      value: Number(performance.avg_capacity || 0).toFixed(1),
      icon: <TeamOutlined />,
      gradient: 'linear-gradient(135deg, #ff375f 0%, #ff6482 100%)',
      suffix: '人/天',
    },
  ]

  // 谈案岗指标卡片
  const negotiateMetrics = [
    {
      title: '接待量',
      value: Number(performance.receive_count || 0).toLocaleString(),
      icon: <UserOutlined />,
      gradient: 'linear-gradient(135deg, #0071e3 0%, #00a8ff 100%)',
      suffix: '人',
    },
    {
      title: '签约量',
      value: Number(performance.sign_count || 0).toLocaleString(),
      icon: <CheckCircleOutlined />,
      gradient: 'linear-gradient(135deg, #34c759 0%, #5ac8fa 100%)',
      suffix: '单',
    },
    {
      title: '签约率',
      value: `${(Number(performance.sign_rate || 0)).toFixed(1)}%`,
      icon: <TrophyOutlined />,
      gradient: 'linear-gradient(135deg, #ff9f0a 0%, #ffcc00 100%)',
      suffix: '',
    },
    {
      title: '签约金额',
      value: `¥${Number(performance.sign_amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: <DollarOutlined />,
      gradient: 'linear-gradient(135deg, #5856d6 0%, #af52de 100%)',
      suffix: '',
    },
    {
      title: '人均业绩',
      value: `¥${Number(performance.avg_performance || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: <TeamOutlined />,
      gradient: 'linear-gradient(135deg, #ff375f 0%, #ff6482 100%)',
      suffix: '',
    },
  ]

  const currentMetrics = activeTab === 'invite' ? inviteMetrics : negotiateMetrics

  // 排行榜图表数据
  const chartData = ranking.map((item, idx) => ({
    name: item.user_name || item.name || `第${idx + 1}名`,
    value: activeTab === 'invite'
      ? Number(item.arrival_count || 0)
      : Number(item.sign_amount || 0),
    rank: idx + 1,
  }))

  // 明细表列
  const detailColumns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      render: (_: any, _record: any, idx: number) => {
        const rank = idx + 1
        const colors = ['#FFD700', '#C0C0C0', '#CD7F32', '#0071e3', '#6e6e73']
        return (
          <Tag color={colors[idx] || 'default'} style={{ borderRadius: 8, fontWeight: 600 }}>
            第 {rank} 名
          </Tag>
        )
      },
    },
    {
      title: '人员姓名',
      dataIndex: 'user_name',
      key: 'user_name',
      render: (v: string) => <span style={{ fontWeight: 600, color: '#1d1d1f' }}>{v || '-'}</span>,
    },
    ...(activeTab === 'invite'
      ? [
          { title: '接通量', dataIndex: 'connect_count', key: 'connect_count', align: 'right' as const, render: (v: number) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{(v || 0).toLocaleString()}</span> },
          { title: '邀约量', dataIndex: 'invite_count', key: 'invite_count', align: 'right' as const, render: (v: number) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{(v || 0).toLocaleString()}</span> },
          { title: '到所量', dataIndex: 'arrival_count', key: 'arrival_count', align: 'right' as const, render: (v: number) => <span style={{ fontVariantNumeric: 'tabular-nums', color: '#34c759', fontWeight: 600 }}>{(v || 0).toLocaleString()}</span> },
          { title: '到所率', dataIndex: 'arrival_rate', key: 'arrival_rate', align: 'right' as const, render: (v: number) => <Tag color="blue" style={{ borderRadius: 8 }}>{(Number(v || 0)).toFixed(1)}%</Tag> },
        ]
      : [
          { title: '接待量', dataIndex: 'receive_count', key: 'receive_count', align: 'right' as const, render: (v: number) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{(v || 0).toLocaleString()}</span> },
          { title: '签约量', dataIndex: 'sign_count', key: 'sign_count', align: 'right' as const, render: (v: number) => <span style={{ fontVariantNumeric: 'tabular-nums', color: '#34c759', fontWeight: 600 }}>{(v || 0).toLocaleString()}</span> },
          { title: '签约率', dataIndex: 'sign_rate', key: 'sign_rate', align: 'right' as const, render: (v: number) => <Tag color="blue" style={{ borderRadius: 8 }}>{(Number(v || 0)).toFixed(1)}%</Tag> },
          { title: '签约金额', dataIndex: 'sign_amount', key: 'sign_amount', align: 'right' as const, render: (v: number) => <span style={{ color: '#0071e3', fontWeight: 600 }}>¥{(Number(v || 0)).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> },
        ]),
  ]

  return (
    <div style={{ animation: 'fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* 页面标题 */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#1d1d1f', letterSpacing: -0.4 }}>销售团队绩效看板</div>
        <div style={{ fontSize: 14, color: '#6e6e73', marginTop: 4 }}>邀约岗与谈案岗的产能、转化与业绩排名分析</div>
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

      {/* Tab 切换 */}
      <Card style={{ ...cardStyle, marginBottom: 16 }} styles={{ body: { padding: 0 } }}>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as 'invite' | 'negotiate')}
          style={{ padding: '0 16px' }}
          items={[
            {
              key: 'invite',
              label: (
                <span style={{ fontWeight: 500 }}>
                  <PhoneOutlined /> 邀约岗
                </span>
              ),
            },
            {
              key: 'negotiate',
              label: (
                <span style={{ fontWeight: 500 }}>
                  <UserOutlined /> 谈案岗
                </span>
              ),
            },
          ]}
        />
      </Card>

      {/* 指标卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {currentMetrics.map((card, idx) => (
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

      <Row gutter={[16, 16]}>
        {/* 排行榜样 - 横向条形图 */}
        <Col xs={24} lg={12}>
          <Card
            style={{ ...cardStyle, height: '100%' }}
            title={
              <Space>
                <TrophyOutlined style={{ color: '#0071e3' }} />
                <span style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f' }}>
                  TOP 5 排行榜 - {activeTab === 'invite' ? '到所量' : '签约金额'}
                </span>
              </Space>
            }
            styles={{ body: { padding: 24 } }}
          >
            <Spin spinning={loading}>
              {chartData.length === 0 ? (
                <Empty description="暂无数据" />
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: '#6e6e73' }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 13, fill: '#1d1d1f' }}
                      width={70}
                    />
                    <Tooltip
                      formatter={(value: any) => [
                        activeTab === 'invite'
                          ? `${Number(value).toLocaleString()} 人`
                          : `¥${Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                        activeTab === 'invite' ? '到所量' : '签约金额',
                      ]}
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid rgba(0,0,0,0.06)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
                      {chartData.map((_, idx) => (
                        <Cell key={idx} fill={RANK_COLORS[idx % RANK_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Spin>
          </Card>
        </Col>

        {/* 个人明细表 */}
        <Col xs={24} lg={12}>
          <Card
            style={{ ...cardStyle, height: '100%' }}
            title={
              <Space>
                <TeamOutlined style={{ color: '#0071e3' }} />
                <span style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f' }}>个人明细</span>
              </Space>
            }
            styles={{ body: { padding: 0 } }}
          >
            <Table
              dataSource={details}
              columns={detailColumns}
              rowKey={(record, idx) => `${record.user_id}-${idx}`}
              pagination={{ pageSize: 10 }}
              size="middle"
              loading={loading}
              scroll={{ x: 700 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
