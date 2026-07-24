import { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Select,
  DatePicker,
  Button,
  Space,
  Spin,
  Empty,
} from 'antd'
import {
  FilterOutlined,
  ReloadOutlined,
  EyeOutlined,
  ThunderboltOutlined,
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons'
import axios from '../api/axios'

const { RangePicker } = DatePicker

// 漏斗级别配置
const FUNNEL_STAGES = [
  { key: 'impression', name: '曝光', color: '#0071e3' },
  { key: 'click', name: '点击', color: '#0a84ff' },
  { key: 'lead', name: '线索', color: '#34c759' },
  { key: 'wechat', name: '加微', color: '#5ac8fa' },
  { key: 'invite', name: '邀约', color: '#ff9f0a' },
  { key: 'arrival', name: '到所', color: '#ff375f' },
  { key: 'sign', name: '签约', color: '#5856d6' },
  { key: 'payment', name: '回款', color: '#af52de' },
]

// 苹果风格卡片基础样式
const cardStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.72)',
  backdropFilter: 'saturate(180%) blur(20px)',
  WebkitBackdropFilter: 'saturate(180%) blur(20px)',
  borderRadius: 16,
  border: '1px solid rgba(0, 0, 0, 0.06)',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.04)',
}

// 指标卡片样式
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

export default function ConversionFunnelDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // 筛选条件
  const [filters, setFilters] = useState({
    channel: undefined as string | undefined,
    platform: undefined as string | undefined,
    caseType: undefined as string | undefined,
    dateRange: [] as string[],
  })

  // 数据
  const [funnelData, setFunnelData] = useState<any>({})
  const [metrics, setMetrics] = useState<any>({})
  const [details, setDetails] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filterOptions, setFilterOptions] = useState<any>({
    channels: [],
    platforms: [],
    caseTypes: [],
  })

  useEffect(() => {
    fetchFilterOptions()
  }, [])

  useEffect(() => {
    fetchData()
  }, [filters])

  // 获取筛选项
  const fetchFilterOptions = async () => {
    try {
      const res = await axios.get('/dashboard/funnel-filter-options', {
        params: { org_id: user.organization_id },
      })
      setFilterOptions({
        channels: res.channels || ['抖音', '百度', '快手', '微信'],
        platforms: res.platforms || ['抖音广告', '百度SEM', '快手广告', '朋友圈广告'],
        caseTypes: res.case_types || ['婚姻', '交通事故', '劳动', '债务', '其他'],
      })
    } catch (error) {
      console.error('Fetch filter options error:', error)
    }
  }

  // 获取数据
  const fetchData = async () => {
    setLoading(true)
    try {
      const params: any = {
        org_id: user.organization_id,
        channel: filters.channel,
        platform: filters.platform,
        case_type: filters.caseType,
        start_date: filters.dateRange[0],
        end_date: filters.dateRange[1],
      }
      const res = await axios.get('/dashboard/conversion-funnel-enhanced', { params })
      setFunnelData(res || {})
      setMetrics(res?.metrics || {})
      setDetails(res?.details || [])
    } catch (error) {
      console.error('Fetch funnel data error:', error)
    } finally {
      setLoading(false)
    }
  }

  // 计算每级的转化率
  const computeStages = () => {
    return FUNNEL_STAGES.map((stage, idx) => {
      const value = Number(funnelData[stage.key] || 0)
      const prevValue = idx === 0 ? value : Number(funnelData[FUNNEL_STAGES[idx - 1].key] || 0)
      const rate = prevValue > 0 ? (value / prevValue) * 100 : 0
      return { ...stage, value, rate }
    })
  }

  const stages = computeStages()
  const maxValue = Math.max(...stages.map((s) => s.value), 1)

  // 核心指标卡片
  const metricCards = [
    {
      title: '线索成本',
      value: `¥${Number(metrics.lead_cost || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: <DollarOutlined />,
      gradient: 'linear-gradient(135deg, #0071e3 0%, #00a8ff 100%)',
      trend: metrics.lead_cost_trend,
    },
    {
      title: '加微率',
      value: `${(Number(metrics.wechat_rate || 0)).toFixed(1)}%`,
      icon: <ThunderboltOutlined />,
      gradient: 'linear-gradient(135deg, #34c759 0%, #5ac8fa 100%)',
      trend: metrics.wechat_rate_trend,
    },
    {
      title: '到所率',
      value: `${(Number(metrics.arrival_rate || 0)).toFixed(1)}%`,
      icon: <RiseOutlined />,
      gradient: 'linear-gradient(135deg, #ff9f0a 0%, #ffcc00 100%)',
      trend: metrics.arrival_rate_trend,
    },
    {
      title: '签约率',
      value: `${(Number(metrics.sign_rate || 0)).toFixed(1)}%`,
      icon: <FallOutlined />,
      gradient: 'linear-gradient(135deg, #5856d6 0%, #af52de 100%)',
      trend: metrics.sign_rate_trend,
    },
    {
      title: 'ROI',
      value: `${(Number(metrics.roi || 0)).toFixed(2)}`,
      icon: <DollarOutlined />,
      gradient: 'linear-gradient(135deg, #ff375f 0%, #ff6482 100%)',
      trend: metrics.roi_trend,
    },
  ]

  // 明细表列
  const detailColumns = [
    {
      title: '渠道',
      dataIndex: 'channel',
      key: 'channel',
      render: (v: string) => <span style={{ fontWeight: 500, color: '#1d1d1f' }}>{v || '-'}</span>,
    },
    {
      title: '计划/广告组',
      dataIndex: 'plan_name',
      key: 'plan_name',
      render: (v: string) => <span style={{ color: '#1d1d1f' }}>{v || '-'}</span>,
    },
    {
      title: '曝光',
      dataIndex: 'impression',
      key: 'impression',
      align: 'right' as const,
      render: (v: number) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{(v || 0).toLocaleString()}</span>,
    },
    {
      title: '点击',
      dataIndex: 'click',
      key: 'click',
      align: 'right' as const,
      render: (v: number) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{(v || 0).toLocaleString()}</span>,
    },
    {
      title: '线索',
      dataIndex: 'lead',
      key: 'lead',
      align: 'right' as const,
      render: (v: number) => <span style={{ fontVariantNumeric: 'tabular-nums', color: '#0071e3', fontWeight: 600 }}>{(v || 0).toLocaleString()}</span>,
    },
    {
      title: '加微',
      dataIndex: 'wechat',
      key: 'wechat',
      align: 'right' as const,
      render: (v: number) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{(v || 0).toLocaleString()}</span>,
    },
    {
      title: '到所',
      dataIndex: 'arrival',
      key: 'arrival',
      align: 'right' as const,
      render: (v: number) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{(v || 0).toLocaleString()}</span>,
    },
    {
      title: '签约',
      dataIndex: 'sign',
      key: 'sign',
      align: 'right' as const,
      render: (v: number) => <span style={{ fontVariantNumeric: 'tabular-nums', color: '#34c759', fontWeight: 600 }}>{(v || 0).toLocaleString()}</span>,
    },
    {
      title: '线索成本',
      dataIndex: 'lead_cost',
      key: 'lead_cost',
      align: 'right' as const,
      render: (v: number) => <span style={{ color: '#ff375f' }}>¥{(Number(v || 0)).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>,
    },
    {
      title: 'ROI',
      dataIndex: 'roi',
      key: 'roi',
      align: 'right' as const,
      render: (v: number) => {
        const val = Number(v || 0)
        const color = val >= 1 ? '#34c759' : '#ff375f'
        return <Tag color={val >= 1 ? 'green' : 'red'} style={{ fontWeight: 600, borderRadius: 8, color }}>{val.toFixed(2)}</Tag>
      },
    },
  ]

  return (
    <div style={{ padding: 0, animation: 'fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .funnel-stage-bar {
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>

      {/* 页面标题 */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#1d1d1f', letterSpacing: -0.4 }}>投放转化漏斗看板</div>
        <div style={{ fontSize: 14, color: '#6e6e73', marginTop: 4 }}>八级漏斗全链路追踪，从曝光到回款的转化效率分析</div>
      </div>

      {/* 筛选区 */}
      <Card style={{ ...cardStyle, marginBottom: 16 }} styles={{ body: { padding: 16 } }}>
        <Space wrap size={[12, 12]}>
          <FilterOutlined style={{ color: '#0071e3', fontSize: 16 }} />
          <Select
            placeholder="选择渠道"
            allowClear
            style={{ width: 160 }}
            value={filters.channel}
            onChange={(v) => setFilters({ ...filters, channel: v })}
            options={filterOptions.channels.map((c: string) => ({ label: c, value: c }))}
          />
          <Select
            placeholder="选择平台"
            allowClear
            style={{ width: 160 }}
            value={filters.platform}
            onChange={(v) => setFilters({ ...filters, platform: v })}
            options={filterOptions.platforms.map((p: string) => ({ label: p, value: p }))}
          />
          <Select
            placeholder="选择案由"
            allowClear
            style={{ width: 160 }}
            value={filters.caseType}
            onChange={(v) => setFilters({ ...filters, caseType: v })}
            options={filterOptions.caseTypes.map((c: string) => ({ label: c, value: c }))}
          />
          <RangePicker
            style={{ width: 240 }}
            value={filters.dateRange as any}
            onChange={(_: any, dateStrings: [string, string]) => setFilters({ ...filters, dateRange: dateStrings })}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
            刷新
          </Button>
        </Space>
      </Card>

      {/* 核心指标卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {metricCards.map((card, idx) => (
          <Col xs={24} sm={12} md={8} lg={6} xl={4} key={idx}>
            <div style={metricCardStyle} className="metric-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: '#6e6e73', marginBottom: 8, letterSpacing: 0.2 }}>{card.title}</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: '#1d1d1f', letterSpacing: -0.4, fontVariantNumeric: 'tabular-nums' }}>{card.value}</div>
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

      {/* 漏斗图 */}
      <Card
        style={{ ...cardStyle, marginBottom: 16 }}
        title={
          <Space>
            <EyeOutlined style={{ color: '#0071e3' }} />
            <span style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f' }}>全链路八级转化漏斗</span>
          </Space>
        }
        styles={{ body: { padding: 24 } }}
      >
        <Spin spinning={loading}>
          {stages.every((s) => s.value === 0) ? (
            <Empty description="暂无数据" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {stages.map((stage, idx) => {
                const widthPercent = maxValue > 0 ? (stage.value / maxValue) * 100 : 0
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 60, fontSize: 14, fontWeight: 500, color: '#1d1d1f', textAlign: 'right' }}>
                      {stage.name}
                    </div>
                    <div style={{ flex: 1, position: 'relative', height: 44 }}>
                      <div
                        className="funnel-stage-bar"
                        style={{
                          width: `${widthPercent}%`,
                          minWidth: 60,
                          height: '100%',
                          background: `linear-gradient(90deg, ${stage.color} 0%, ${stage.color}cc 100%)`,
                          borderRadius: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0 16px',
                          color: '#fff',
                          boxShadow: `0 4px 12px ${stage.color}40`,
                        }}
                      >
                        <span style={{ fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                          {stage.value.toLocaleString()}
                        </span>
                        {idx > 0 && (
                          <span style={{ fontSize: 12, opacity: 0.9 }}>
                            转化率 {stage.rate.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ width: 90, textAlign: 'right' }}>
                      <Tag
                        color={stage.rate >= 50 ? 'green' : stage.rate >= 20 ? 'orange' : 'red'}
                        style={{ fontWeight: 600, borderRadius: 8 }}
                      >
                        {idx === 0 ? '起点' : `${stage.rate.toFixed(1)}%`}
                      </Tag>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Spin>
      </Card>

      {/* 明细数据表 */}
      <Card
        style={cardStyle}
        title={
          <Space>
            <FilterOutlined style={{ color: '#0071e3' }} />
            <span style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f' }}>渠道/计划明细</span>
          </Space>
        }
        styles={{ body: { padding: 0 } }}
      >
        <Table
          dataSource={details}
          columns={detailColumns}
          rowKey={(record, idx) => `${record.channel}-${record.plan_name}-${idx}`}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          size="middle"
          loading={loading}
          scroll={{ x: 1100 }}
        />
      </Card>
    </div>
  )
}
