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
  Tabs,
  Progress,
  Statistic,
  Empty,
} from 'antd'
import {
  ReloadOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  StarOutlined,
  RiseOutlined,
  TrophyOutlined,
  LineChartOutlined,
} from '@ant-design/icons'
import axios from '../api/axios'
import { theme } from '../constants/theme'
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

interface HREfficiencyStats {
  lawyer_count: number
  total_revenue: number
  avg_revenue_per_lawyer: number
  avg_cycle_days: number
  active_lawyer_count: number
  team_utilization_rate: number
  avg_satisfaction: number
}

interface LawyerRanking {
  lawyer_id: string
  lawyer_name: string
  cases_count: number
  closed_cases: number
  total_revenue: number
  avg_cycle_days: number
  satisfaction: number
  efficiency_score: number
}

export default function HRDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<HREfficiencyStats | null>(null)
  const [ranking, setRanking] = useState<LawyerRanking[]>([])
  const [dateRange, setDateRange] = useState<string[]>([])

  const fetchData = async (dates?: string[]) => {
    setLoading(true)
    try {
      const params: any = { org_id: user.organization_id }
      if (dates && dates.length === 2) {
        params.start_date = dates[0]
        params.end_date = dates[1]
      }

      const [statsRes, rankingRes] = await Promise.all([
        axios.get('/dashboard/hr-efficiency', { params }),
        axios.get('/dashboard/hr-ranking', { params }),
      ]) as [Record<string, unknown>, Record<string, unknown>]

      setStats(statsRes.data as HREfficiencyStats | null)
      setRanking((rankingRes.data || []) as LawyerRanking[])
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleDateChange = (dates: any) => {
    if (dates && dates[0] && dates[1]) {
      const formatted = [
        dates[0].format('YYYY-MM-DD'),
        dates[1].format('YYYY-MM-DD'),
      ]
      setDateRange(formatted)
      fetchData(formatted)
    } else {
      setDateRange([])
      fetchData()
    }
  }

  const handleRefresh = () => {
    fetchData(dateRange)
  }

  // 律师排名列定义
  const rankingColumns = [
    {
      title: '排名',
      key: 'index',
      width: 80,
      render: (_: any, __: any, index: number) => {
        if (index === 0) return <TrophyOutlined style={{ color: theme.brandGold, fontSize: 20 }} />
        if (index === 1) return <TrophyOutlined style={{ color: '#9e9e9e', fontSize: 20 }} />
        if (index === 2) return <TrophyOutlined style={{ color: '#cd7f32', fontSize: 20 }} />
        return <span style={{ color: theme.textTertiary, fontWeight: 500 }}>{index + 1}</span>
      },
    },
    {
      title: '律师姓名',
      dataIndex: 'lawyer_name',
      key: 'lawyer_name',
      render: (text: string) => <span style={{ fontWeight: 500, color: theme.textBase }}>{text}</span>,
    },
    {
      title: '办案数',
      dataIndex: 'cases_count',
      key: 'cases_count',
      width: 100,
      render: (val: number) => <Tag className="stitch-tag stitch-tag-info">{val}</Tag>,
    },
    {
      title: '结案数',
      dataIndex: 'closed_cases',
      key: 'closed_cases',
      width: 100,
      render: (val: number) => <Tag className="stitch-tag stitch-tag-success">{val}</Tag>,
    },
    {
      title: '总收入(元)',
      dataIndex: 'total_revenue',
      key: 'total_revenue',
      width: 130,
      render: (val: number) => (
        <span style={{ color: theme.primary, fontWeight: 600 }}>
          {val.toLocaleString()}
        </span>
      ),
    },
    {
      title: '平均周期(天)',
      dataIndex: 'avg_cycle_days',
      key: 'avg_cycle_days',
      width: 130,
      render: (val: number) => (
        <span>
          {val > 0 ? val.toFixed(1) : '-'}
        </span>
      ),
    },
    {
      title: '满意度',
      dataIndex: 'satisfaction',
      key: 'satisfaction',
      width: 120,
      render: (val: number) => (
        val > 0 ? (
          <span>
            <StarOutlined style={{ color: '#ff9f0a' }} /> {val.toFixed(1)}
          </span>
        ) : (
          <span style={{ color: theme.border }}>-</span>
        )
      ),
    },
    {
      title: '人效评分',
      dataIndex: 'efficiency_score',
      key: 'efficiency_score',
      width: 180,
      render: (val: number) => (
        <div>
          <Progress
            percent={Math.min(100, val)}
            size="small"
            strokeColor={val >= 70 ? theme.success : val >= 50 ? theme.warning : theme.error}
            format={() => <span style={{ fontWeight: 600 }}>{val.toFixed(1)}</span>}
          />
        </div>
      ),
    },
  ]

  // 人效评分分布（效率趋势）
  const scoreDistribution = [
    { label: '优秀 (70+)', count: ranking.filter(r => r.efficiency_score >= 70).length, color: theme.success },
    { label: '良好 (50-69)', count: ranking.filter(r => r.efficiency_score >= 50 && r.efficiency_score < 70).length, color: theme.warning },
    { label: '待提升 (<50)', count: ranking.filter(r => r.efficiency_score < 50).length, color: theme.error },
  ]

  return (
    <div style={{ padding: '0 0 24px' }}>
      {/* 页面标题和筛选 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
      }}>
        <h1 style={{
          fontSize: 24,
          fontWeight: 600,
          color: theme.textBase,
          margin: 0,
        }}>
          人效分析
        </h1>
        <Space>
          <RangePicker onChange={handleDateChange} />
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
            刷新
          </Button>
        </Space>
      </div>

      <Spin spinning={loading}>
        <Tabs
          defaultActiveKey="team"
          items={[
            {
              key: 'team',
              label: (
                <span>
                  <TeamOutlined /> 团队人效
                </span>
              ),
              children: (
                <div>
                  {/* 团队人效统计卡片 */}
                  <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={12} lg={6}>
                      <Card style={metricCardStyle} bodyStyle={{ padding: 20 }}>
                        <Statistic
                          title={<span style={{ color: theme.textTertiary, fontSize: 13 }}>律师人均产值</span>}
                          value={stats?.avg_revenue_per_lawyer || 0}
                          precision={2}
                          prefix={<RiseOutlined style={{ color: theme.success }} />}
                          suffix="元"
                          valueStyle={{ color: theme.primary, fontSize: 28, fontWeight: 700 }}
                        />
                        <div style={{ marginTop: 8, color: theme.textTertiary, fontSize: 12 }}>
                          团队共 {stats?.lawyer_count || 0} 位律师 | 总产值 {(stats?.total_revenue || 0).toLocaleString()} 元
                        </div>
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                      <Card style={metricCardStyle} bodyStyle={{ padding: 20 }}>
                        <Statistic
                          title={<span style={{ color: theme.textTertiary, fontSize: 13 }}>平均办案周期</span>}
                          value={stats?.avg_cycle_days || 0}
                          precision={1}
                          prefix={<ClockCircleOutlined style={{ color: theme.warning }} />}
                          suffix="天"
                          valueStyle={{ color: theme.warning, fontSize: 28, fontWeight: 700 }}
                        />
                        <div style={{ marginTop: 8, color: theme.textTertiary, fontSize: 12 }}>
                          已结案案件平均周期
                        </div>
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                      <Card style={metricCardStyle} bodyStyle={{ padding: 20 }}>
                        <Statistic
                          title={<span style={{ color: theme.textTertiary, fontSize: 13 }}>团队利用率</span>}
                          value={stats?.team_utilization_rate || 0}
                          precision={1}
                          prefix={<CheckCircleOutlined style={{ color: theme.success }} />}
                          suffix="%"
                          valueStyle={{ color: theme.success, fontSize: 28, fontWeight: 700 }}
                        />
                        <div style={{ marginTop: 8 }}>
                          <Progress
                            percent={stats?.team_utilization_rate || 0}
                            size="small"
                            strokeColor={stats && stats.team_utilization_rate >= 70 ? theme.success : theme.warning}
                            showInfo={false}
                          />
                          <span style={{ color: theme.textTertiary, fontSize: 12 }}>
                            {stats?.active_lawyer_count || 0} / {stats?.lawyer_count || 0} 律师在办案
                          </span>
                        </div>
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                      <Card style={metricCardStyle} bodyStyle={{ padding: 20 }}>
                        <Statistic
                          title={<span style={{ color: theme.textTertiary, fontSize: 13 }}>客户满意度</span>}
                          value={stats?.avg_satisfaction || 0}
                          precision={2}
                          prefix={<StarOutlined style={{ color: '#ff9f0a' }} />}
                          suffix="/ 5.0"
                          valueStyle={{ color: '#ff9f0a', fontSize: 28, fontWeight: 700 }}
                        />
                        <div style={{ marginTop: 8, color: theme.textTertiary, fontSize: 12 }}>
                          已通过评价的平均评分
                        </div>
                      </Card>
                    </Col>
                  </Row>

                  {/* 律师办案详情表格 */}
                  <Card
                    className="stitch-table"
                    title={
                      <span className="stitch-chart-title" style={{ fontWeight: 600 }}>
                        <TeamOutlined style={{ marginRight: 8, color: theme.primary }} />
                        律师办案概况
                      </span>
                    }
                    style={cardStyle}
                  >
                    <Table
                      columns={[
                        {
                          title: '律师姓名',
                          dataIndex: 'lawyer_name',
                          key: 'lawyer_name',
                          render: (text: string) => (
                            <span style={{ fontWeight: 500 }}>{text}</span>
                          ),
                        },
                        {
                          title: '办案数',
                          dataIndex: 'cases_count',
                          key: 'cases_count',
                          width: 100,
                        },
                        {
                          title: '已结案',
                          dataIndex: 'closed_cases',
                          key: 'closed_cases',
                          width: 100,
                          render: (val: number) => <Tag className="stitch-tag stitch-tag-success">{val}</Tag>,
                        },
                        {
                          title: '结案率',
                          key: 'close_rate',
                          width: 150,
                          render: (_: any, record: LawyerRanking) => {
                            const rate = record.cases_count > 0
                              ? (record.closed_cases / record.cases_count) * 100
                              : 0
                            return (
                              <Progress
                                percent={Math.round(rate)}
                                size="small"
                                strokeColor={rate >= 70 ? theme.success : theme.warning}
                              />
                            )
                          },
                        },
                        {
                          title: '总收入(元)',
                          dataIndex: 'total_revenue',
                          key: 'total_revenue',
                          width: 130,
                          render: (val: number) => (
                            <span style={{ color: theme.primary, fontWeight: 600 }}>
                              {val.toLocaleString()}
                            </span>
                          ),
                        },
                        {
                          title: '人效评分',
                          dataIndex: 'efficiency_score',
                          key: 'efficiency_score',
                          width: 180,
                          render: (val: number) => (
                            <Progress
                              percent={Math.min(100, val)}
                              size="small"
                              strokeColor={val >= 70 ? theme.success : val >= 50 ? theme.warning : theme.error}
                              format={() => <span style={{ fontWeight: 600 }}>{val.toFixed(1)}</span>}
                            />
                          ),
                        },
                      ]}
                      dataSource={ranking}
                      rowKey="lawyer_id"
                      pagination={false}
                      locale={{ emptyText: <Empty description="暂无律师数据" /> }}
                    />
                  </Card>
                </div>
              ),
            },
            {
              key: 'ranking',
              label: (
                <span>
                  <TrophyOutlined /> 律师排名
                </span>
              ),
              children: (
                <Card
                  className="stitch-table"
                  title={
                    <span className="stitch-chart-title" style={{ fontWeight: 600 }}>
                      <TrophyOutlined style={{ marginRight: 8, color: theme.brandGold }} />
                      律师人效排名
                    </span>
                  }
                  style={cardStyle}
                >
                  <Table
                    columns={rankingColumns}
                    dataSource={ranking}
                    rowKey="lawyer_id"
                    pagination={false}
                    locale={{ emptyText: <Empty description="暂无排名数据" /> }}
                  />
                </Card>
              ),
            },
            {
              key: 'trend',
              label: (
                <span>
                  <LineChartOutlined /> 效率趋势
                </span>
              ),
              children: (
                <div>
                  {/* 效率评分分布 */}
                  <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    {scoreDistribution.map((item, idx) => (
                      <Col xs={24} sm={8} key={idx}>
                        <Card style={metricCardStyle} bodyStyle={{ padding: 20 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div
                              style={{
                                width: 48,
                                height: 48,
                                borderRadius: 12,
                                background: item.color + '20',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <CheckCircleOutlined style={{ color: item.color, fontSize: 24 }} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ color: theme.textTertiary, fontSize: 13 }}>{item.label}</div>
                              <div style={{ color: theme.textBase, fontSize: 24, fontWeight: 700 }}>
                                {item.count} 人
                              </div>
                            </div>
                          </div>
                          <Progress
                            percent={ranking.length > 0 ? (item.count / ranking.length) * 100 : 0}
                            strokeColor={item.color}
                            showInfo={false}
                            size="small"
                            style={{ marginTop: 12 }}
                          />
                        </Card>
                      </Col>
                    ))}
                  </Row>

                  {/* 效率指标趋势 */}
                  <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                      <Card
                        className="stitch-chart-card"
                        title={
                          <span className="stitch-chart-title" style={{ fontWeight: 600 }}>
                            <TeamOutlined style={{ marginRight: 8, color: theme.primary }} />
                            律师办案负荷
                          </span>
                        }
                        style={cardStyle}
                      >
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ color: theme.textSecondary }}>团队利用率</span>
                            <span style={{ fontWeight: 600, color: theme.success }}>
                              {stats?.team_utilization_rate?.toFixed(1)}%
                            </span>
                          </div>
                          <Progress
                            percent={stats?.team_utilization_rate || 0}
                            strokeColor={stats && stats.team_utilization_rate >= 70 ? theme.success : theme.warning}
                          />
                        </div>
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ color: theme.textSecondary }}>律师人数</span>
                            <span style={{ fontWeight: 600 }}>{stats?.lawyer_count || 0} 人</span>
                          </div>
                          <Progress
                            percent={100}
                            strokeColor={theme.primary}
                            showInfo={false}
                          />
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ color: theme.textSecondary }}>在办案件律师</span>
                            <span style={{ fontWeight: 600, color: theme.primary }}>
                              {stats?.active_lawyer_count || 0} 人
                            </span>
                          </div>
                          <Progress
                            percent={stats?.lawyer_count ? (stats.active_lawyer_count / stats.lawyer_count) * 100 : 0}
                            strokeColor="#5856d6"
                            showInfo={false}
                          />
                        </div>
                      </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                      <Card
                        className="stitch-chart-card"
                        title={
                          <span className="stitch-chart-title" style={{ fontWeight: 600 }}>
                            <StarOutlined style={{ marginRight: 8, color: '#ff9f0a' }} />
                            质量指标
                          </span>
                        }
                        style={cardStyle}
                      >
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ color: theme.textSecondary }}>客户满意度</span>
                            <span style={{ fontWeight: 600, color: '#ff9f0a' }}>
                              {stats?.avg_satisfaction?.toFixed(2)} / 5.0
                            </span>
                          </div>
                          <Progress
                            percent={(stats?.avg_satisfaction || 0) * 20}
                            strokeColor="#ff9f0a"
                          />
                        </div>
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ color: theme.textSecondary }}>办案周期达标率</span>
                            <span style={{ fontWeight: 600, color: theme.success }}>
                              {stats?.avg_cycle_days && stats.avg_cycle_days <= 90 ? '达标' : '需优化'}
                            </span>
                          </div>
                          <Progress
                            percent={stats?.avg_cycle_days ? Math.max(20, 100 - stats.avg_cycle_days / 2) : 0}
                            strokeColor={stats?.avg_cycle_days && stats.avg_cycle_days <= 90 ? theme.success : theme.error}
                            showInfo={false}
                          />
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ color: theme.textSecondary }}>人均产值(元)</span>
                            <span style={{ fontWeight: 600, color: theme.primary }}>
                              {(stats?.avg_revenue_per_lawyer || 0).toLocaleString()}
                            </span>
                          </div>
                          <Progress
                            percent={stats?.avg_revenue_per_lawyer ? Math.min(100, stats.avg_revenue_per_lawyer / 500) : 0}
                            strokeColor={theme.primary}
                            showInfo={false}
                          />
                        </div>
                      </Card>
                    </Col>
                  </Row>
                </div>
              ),
            },
          ]}
        />
      </Spin>
    </div>
  )
}