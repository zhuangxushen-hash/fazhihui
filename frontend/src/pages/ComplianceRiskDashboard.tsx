import { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Button,
  Space,
  Spin,
  Empty,
  Tooltip as AntTooltip,
  message,
} from 'antd'
import {
  ReloadOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import axios from '../api/axios'
import { formatDateTime } from '../utils/format'

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

// 环节颜色配置
const SEGMENT_COLORS = ['#0071e3', '#34c759', '#ff9f0a', '#ff375f']

// 风险等级颜色映射
const RISK_LEVEL_CONFIG: Record<string, { color: string; tagColor: string; bg: string; label: string }> = {
  high: { color: '#ff375f', tagColor: 'red', bg: 'rgba(255, 55, 95, 0.08)', label: '高风险' },
  medium: { color: '#ff9f0a', tagColor: 'orange', bg: 'rgba(255, 159, 10, 0.08)', label: '中风险' },
  low: { color: '#ffcc00', tagColor: 'gold', bg: 'rgba(255, 204, 0, 0.08)', label: '低风险' },
}

// 环节名称映射
const SEGMENT_LABELS: Record<string, string> = {
  marketing: '获客环节',
  sales: '谈案环节',
  case: '办案环节',
  finance: '财务环节',
}

// 环节跳转路径
const SEGMENT_ROUTES: Record<string, string> = {
  marketing: '/compliance-center',
  sales: '/compliance-center',
  case: '/compliance-center',
  finance: '/compliance-center',
}

export default function ComplianceRiskDashboard() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<any>({})
  const [segmentDist, setSegmentDist] = useState<any[]>([])
  const [topRisks, setTopRisks] = useState<any[]>([])
  const [riskList, setRiskList] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/dashboard/compliance-risk-dashboard', {
        params: { org_id: user.organization_id },
      })
      setStats(res?.stats || {})
      setSegmentDist(res?.segment_distribution || [])
      setTopRisks(res?.top_risks || [])
      setRiskList(res?.risk_list || [])
    } catch (error) {
      console.error('Fetch compliance risk dashboard error:', error)
    } finally {
      setLoading(false)
    }
  }

  // 指标卡片
  const metricCards = [
    {
      title: '违规预警总数',
      value: Number(stats.violation_count || 0).toLocaleString(),
      icon: <AlertOutlined />,
      gradient: 'linear-gradient(135deg, #ff375f 0%, #ff6482 100%)',
      suffix: '条',
    },
    {
      title: '整改完成率',
      value: `${(Number(stats.rectification_rate || 0)).toFixed(1)}%`,
      icon: <CheckCircleOutlined />,
      gradient: 'linear-gradient(135deg, #34c759 0%, #5ac8fa 100%)',
      suffix: '',
    },
    {
      title: '客诉率',
      value: `${(Number(stats.complaint_rate || 0)).toFixed(2)}%`,
      icon: <WarningOutlined />,
      gradient: 'linear-gradient(135deg, #ff9f0a 0%, #ffcc00 100%)',
      suffix: '',
    },
    {
      title: '超期案件数',
      value: Number(stats.overdue_count || 0).toLocaleString(),
      icon: <ClockCircleOutlined />,
      gradient: 'linear-gradient(135deg, #5856d6 0%, #af52de 100%)',
      suffix: '件',
    },
  ]

  // 风险明细表列
  const riskColumns = [
    {
      title: '风险等级',
      dataIndex: 'risk_level',
      key: 'risk_level',
      width: 100,
      render: (level: string) => {
        const cfg = RISK_LEVEL_CONFIG[level] || RISK_LEVEL_CONFIG.low
        return (
          <Tag color={cfg.tagColor} style={{ borderRadius: 8, fontWeight: 600 }}>
            {cfg.label}
          </Tag>
        )
      },
    },
    {
      title: '所属环节',
      dataIndex: 'segment',
      key: 'segment',
      width: 110,
      render: (seg: string) => <Tag style={{ borderRadius: 8 }}>{SEGMENT_LABELS[seg] || seg}</Tag>,
    },
    {
      title: '风险事项',
      dataIndex: 'risk_item',
      key: 'risk_item',
      render: (v: string) => <span style={{ fontWeight: 500, color: '#1d1d1f' }}>{v || '-'}</span>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (v: string) => <span style={{ color: '#6e6e73' }}>{v || '-'}</span>,
    },
    {
      title: '责任人',
      dataIndex: 'owner_name',
      key: 'owner_name',
      width: 100,
      render: (v: string) => <span style={{ color: '#1d1d1f' }}>{v || '-'}</span>,
    },
    {
      title: '发生时间',
      dataIndex: 'occurred_at',
      key: 'occurred_at',
      width: 160,
      render: (v: string) => <span style={{ color: '#6e6e73', fontVariantNumeric: 'tabular-nums' }}>{formatDateTime(v)}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const map: Record<string, { color: string; text: string }> = {
          pending: { color: 'orange', text: '待处理' },
          processing: { color: 'blue', text: '处理中' },
          resolved: { color: 'green', text: '已整改' },
          overdue: { color: 'red', text: '已超期' },
        }
        const cfg = map[status] || { color: 'default', text: status }
        return <Tag color={cfg.color} style={{ borderRadius: 8 }}>{cfg.text}</Tag>
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: any) => (
        <Button
          type="link"
          size="small"
          onClick={() => handleNavigate(record)}
        >
          去处理 <ArrowRightOutlined />
        </Button>
      ),
    },
  ]

  // 跳转处理
  const handleNavigate = (record: any) => {
    const segment = record?.segment
    const route = SEGMENT_ROUTES[segment] || '/compliance-center'
    message.info(`跳转到${SEGMENT_LABELS[segment] || '合规'}模块处理`)
    navigate(route)
  }

  // 高风险事项置顶列表
  const topRiskColumns = [
    {
      title: '风险事项',
      dataIndex: 'risk_item',
      key: 'risk_item',
      render: (v: string, record: any) => (
        <Space>
          <ExclamationCircleOutlined style={{ color: RISK_LEVEL_CONFIG[record.risk_level]?.color || '#ffcc00' }} />
          <span style={{ fontWeight: 500, color: '#1d1d1f' }}>{v || '-'}</span>
        </Space>
      ),
    },
    {
      title: '环节',
      dataIndex: 'segment',
      key: 'segment',
      width: 100,
      render: (seg: string) => <span style={{ color: '#6e6e73', fontSize: 12 }}>{SEGMENT_LABELS[seg] || seg}</span>,
    },
    {
      title: '等级',
      dataIndex: 'risk_level',
      key: 'risk_level',
      width: 80,
      render: (level: string) => {
        const cfg = RISK_LEVEL_CONFIG[level] || RISK_LEVEL_CONFIG.low
        return (
          <Tag color={cfg.tagColor} style={{ borderRadius: 8, fontWeight: 600 }}>
            {cfg.label}
          </Tag>
        )
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: any) => (
        <Button type="link" size="small" onClick={() => handleNavigate(record)}>
          去处理
        </Button>
      ),
    },
  ]

  return (
    <div style={{ animation: 'fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .risk-card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08), 0 16px 48px rgba(0, 0, 0, 0.04);
        }
      `}</style>

      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#1d1d1f', letterSpacing: -0.4 }}>合规风险监控看板</div>
          <div style={{ fontSize: 14, color: '#6e6e73', marginTop: 4 }}>获客、谈案、办案、财务全环节的风险预警与整改跟踪</div>
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
          刷新
        </Button>
      </div>

      {/* 指标卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {metricCards.map((card, idx) => (
          <Col xs={24} sm={12} md={6} key={idx}>
            <div style={metricCardStyle} className="risk-card-hover">
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
        {/* 环节风险分布饼图 */}
        <Col xs={24} lg={10}>
          <Card
            style={{ ...cardStyle, height: '100%' }}
            title={
              <Space>
                <AlertOutlined style={{ color: '#0071e3' }} />
                <span style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f' }}>环节风险分布</span>
              </Space>
            }
            styles={{ body: { padding: 24 } }}
          >
            <Spin spinning={loading}>
              {segmentDist.length === 0 ? (
                <Empty description="暂无数据" />
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={segmentDist}
                      dataKey="count"
                      nameKey="segment"
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      innerRadius={60}
                      paddingAngle={2}
                      label={(entry: any) => `${SEGMENT_LABELS[entry.segment] || entry.segment}: ${entry.count}`}
                      labelLine={false}
                    >
                      {segmentDist.map((_, idx) => (
                        <Cell key={idx} fill={SEGMENT_COLORS[idx % SEGMENT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: any) => [`${Number(value).toLocaleString()} 条`, SEGMENT_LABELS[name] || name]}
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid rgba(0,0,0,0.06)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      wrapperStyle={{ fontSize: 12, color: '#6e6e73' }}
                      formatter={(value) => SEGMENT_LABELS[value] || value}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Spin>
          </Card>
        </Col>

        {/* 高风险事项置顶列表 */}
        <Col xs={24} lg={14}>
          <Card
            style={{ ...cardStyle, height: '100%' }}
            title={
              <Space>
                <ExclamationCircleOutlined style={{ color: '#ff375f' }} />
                <span style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f' }}>高风险事项 TOP 10</span>
              </Space>
            }
            styles={{ body: { padding: 0 } }}
          >
            <Spin spinning={loading}>
              {topRisks.length === 0 ? (
                <div style={{ padding: 40 }}>
                  <Empty description="暂无高风险事项" />
                </div>
              ) : (
                <Table
                  dataSource={topRisks}
                  columns={topRiskColumns}
                  rowKey={(record, idx) => `${record.id}-${idx}`}
                  pagination={false}
                  size="middle"
                  scroll={{ y: 320 }}
                />
              )}
            </Spin>
          </Card>
        </Col>
      </Row>

      {/* 风险明细表 */}
      <Card
        style={cardStyle}
        title={
          <Space>
            <WarningOutlined style={{ color: '#0071e3' }} />
            <span style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f' }}>风险明细</span>
            <AntTooltip title="点击「去处理」可跳转到对应合规模块">
              <ExclamationCircleOutlined style={{ color: '#6e6e73', fontSize: 13 }} />
            </AntTooltip>
          </Space>
        }
        styles={{ body: { padding: 0 } }}
      >
        <Table
          dataSource={riskList}
          columns={riskColumns}
          rowKey={(record, idx) => `${record.id}-${idx}`}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          size="middle"
          loading={loading}
          scroll={{ x: 1100 }}
          rowClassName={(record) => `risk-row-${record.risk_level}`}
        />
      </Card>
    </div>
  )
}
