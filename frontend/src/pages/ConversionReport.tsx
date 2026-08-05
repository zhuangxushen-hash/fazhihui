import { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Select,
  DatePicker,
  Space,
  Button,
  Tag,
  message,
  Empty,
  Input,
} from 'antd'
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import {
  getRoiStats,
  getConversionEvents,
  refreshMaterialRoi,
  channelOptions,
  dimensionOptions,
  eventTypeLabels,
  channelLabels,
  type RoiDimension,
  type AdChannel,
  type RoiStatsRow,
  type ConversionEvent,
} from '../api/marketing'
import { formatDateTime } from '../utils/format'
import { theme } from '../constants/theme'
const { RangePicker } = DatePicker

export default function ConversionReport() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [loading, setLoading] = useState(false)
  const [eventsLoading, setEventsLoading] = useState(false)
  const [roiData, setRoiData] = useState<RoiStatsRow[]>([])
  // 漏斗功能已合并至 MarketingDashboard，此处不再维护
  const [events, setEvents] = useState<ConversionEvent[]>([])
  const [dimension, setDimension] = useState<RoiDimension>('channel')
  const [channel, setChannel] = useState<AdChannel | undefined>(undefined)
  const [accountId, setAccountId] = useState<string>('')
  const [planId, setPlanId] = useState<string>('')
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null)

  useEffect(() => {
    fetchRoiStats()
    fetchEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const buildParams = () => {
    const params: any = { org_id: user.organization_id, dimension }
    if (channel) params.channel = channel
    if (accountId) params.account_id = accountId
    if (planId) params.plan_id = planId
    if (dateRange && dateRange.length === 2) {
      params.start_date = dateRange[0].format('YYYY-MM-DD')
      params.end_date = dateRange[1].format('YYYY-MM-DD 23:59:59')
    }
    return params
  }

  const fetchRoiStats = async () => {
    setLoading(true)
    try {
      const res = await getRoiStats(buildParams())
      setRoiData(res || [])
    } catch (err) {
      message.error('ROI 数据加载失败')
    } finally {
      setLoading(false)
    }
  }

  // fetchFunnel 已删除：转化漏斗功能已合并至 MarketingDashboard

  const fetchEvents = async () => {
    setEventsLoading(true)
    try {
      const params: any = { org_id: user.organization_id }
      if (channel) params.channel = channel
      if (accountId) params.account_id = accountId
      if (planId) params.plan_id = planId
      if (dateRange && dateRange.length === 2) {
        params.start_date = dateRange[0].format('YYYY-MM-DD')
        params.end_date = dateRange[1].format('YYYY-MM-DD 23:59:59')
      }
      const res = await getConversionEvents(params)
      setEvents(res || [])
    } catch (err) {
      // 错误已由拦截器统一处理
    } finally {
      setEventsLoading(false)
    }
  }

  const handleSearch = () => {
    fetchRoiStats()
    fetchEvents()
  }

  const handleReset = () => {
    setChannel(undefined)
    setAccountId('')
    setPlanId('')
    setDateRange(null)
    setTimeout(() => {
      fetchRoiStats()
      fetchEvents()
    }, 0)
  }

  const handleRefreshRoi = async () => {
    try {
      await refreshMaterialRoi()
      message.success('素材 ROI 已触发刷新')
      fetchRoiStats()
    } catch (err) {
      message.error('刷新失败')
    }
  }

  // 漏斗数据与计算已删除：转化漏斗功能已合并至 MarketingDashboard

  // 维度列展示
  const getDimensionLabel = (row: RoiStatsRow): string => {
    switch (dimension) {
      case 'channel':
        return channelLabels[row.dimension_key as AdChannel] || row.dimension_key
      case 'account':
        return row.dimension_key
      case 'plan':
        return row.dimension_key
      case 'material':
        return row.dimension_key
      case 'keyword':
        return row.dimension_key || '-'
      default:
        return row.dimension_key
    }
  }

  const roiColumns = [
    {
      title: dimensionOptions.find((d) => d.value === dimension)?.label || '维度',
      dataIndex: 'dimension_key',
      key: 'dimension_key',
      render: (_: any, record: RoiStatsRow) => (
        <span style={{ fontWeight: 600, color: '#1d1d1f' }}>{getDimensionLabel(record)}</span>
      ),
    },
    {
      title: '消耗 (¥)',
      dataIndex: 'cost',
      key: 'cost',
      sorter: (a: RoiStatsRow, b: RoiStatsRow) => a.cost - b.cost,
      render: (v: number) => (
        <span style={{ color: '#6e6e73' }}>{v > 0 ? `¥${v.toFixed(2)}` : '-'}</span>
      ),
    },
    {
      title: '线索量',
      dataIndex: 'lead_count',
      key: 'lead_count',
      sorter: (a: RoiStatsRow, b: RoiStatsRow) => a.lead_count - b.lead_count,
      render: (v: number) => <span style={{ color: theme.primary, fontWeight: 600 }}>{v}</span>,
    },
    {
      title: '线索成本',
      dataIndex: 'lead_cost',
      key: 'lead_cost',
      render: (v: number) => (
        <span style={{ color: '#6e6e73' }}>{v > 0 ? `¥${v.toFixed(2)}` : '-'}</span>
      ),
    },
    {
      title: '加微率',
      dataIndex: 'wechat_add_rate',
      key: 'wechat_add_rate',
      render: (v: number) => (
        <span style={{ color: '#5ac8fa' }}>{v > 0 ? `${v.toFixed(1)}%` : '-'}</span>
      ),
    },
    {
      title: '邀约数',
      dataIndex: 'invite_count',
      key: 'invite_count',
      render: (v: number) => <span style={{ color: '#ff9500' }}>{v}</span>,
    },
    {
      title: '签约数',
      dataIndex: 'sign_count',
      key: 'sign_count',
      sorter: (a: RoiStatsRow, b: RoiStatsRow) => a.sign_count - b.sign_count,
      render: (v: number) => <span style={{ color: '#34c759', fontWeight: 600 }}>{v}</span>,
    },
    {
      title: '签约率',
      dataIndex: 'sign_rate',
      key: 'sign_rate',
      render: (v: number) => (
        <span style={{ color: '#34c759' }}>{v > 0 ? `${v.toFixed(1)}%` : '-'}</span>
      ),
    },
    {
      title: '回款 (¥)',
      dataIndex: 'revenue',
      key: 'revenue',
      sorter: (a: RoiStatsRow, b: RoiStatsRow) => a.revenue - b.revenue,
      render: (v: number) => (
        <span style={{ color: '#34c759', fontWeight: 700 }}>{v > 0 ? `¥${v.toFixed(2)}` : '-'}</span>
      ),
    },
    {
      title: 'ROI',
      dataIndex: 'roi',
      key: 'roi',
      sorter: (a: RoiStatsRow, b: RoiStatsRow) => a.roi - b.roi,
      render: (v: number) => {
        const color = v >= 200 ? '#34c759' : v >= 100 ? '#ff9500' : v > 0 ? '#ff3b30' : '#86868b'
        return (
          <Tag style={{ background: `${color}15`, color, borderRadius: 12, padding: '2px 12px', fontWeight: 600 }}>
            {v > 0 ? `${v.toFixed(1)}%` : '-'}
          </Tag>
        )
      },
    },
  ]

  const eventColumns = [
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (v: string) => <span style={{ color: '#86868b', fontSize: 13 }}>{formatDateTime(v)}</span>,
    },
    {
      title: '事件类型',
      dataIndex: 'event_type',
      key: 'event_type',
      width: 110,
      render: (v: string) => {
        const colorMap: Record<string, string> = {
          lead: theme.primary,
          wechat_add: '#5ac8fa',
          invite: '#ff9500',
          sign: '#34c759',
        }
        const color = colorMap[v] || '#86868b'
        return (
          <Tag style={{ background: `${color}15`, color, borderRadius: 12, padding: '2px 10px', fontWeight: 500 }}>
            {eventTypeLabels[v as keyof typeof eventTypeLabels] || v}
          </Tag>
        )
      },
    },
    {
      title: '渠道',
      dataIndex: 'channel',
      key: 'channel',
      width: 100,
      render: (v: string) => (
        <span style={{ color: '#6e6e73' }}>{channelLabels[v as AdChannel] || v || '-'}</span>
      ),
    },
    {
      title: '账户',
      dataIndex: 'account_id',
      key: 'account_id',
      width: 120,
      render: (v: string) => <span style={{ color: '#6e6e73' }}>{v || '-'}</span>,
    },
    {
      title: '计划',
      dataIndex: 'plan_id',
      key: 'plan_id',
      width: 120,
      render: (v: string) => <span style={{ color: '#6e6e73' }}>{v || '-'}</span>,
    },
    {
      title: '素材',
      dataIndex: 'material_id',
      key: 'material_id',
      width: 120,
      render: (v: string) => <span style={{ color: '#6e6e73' }}>{v || '-'}</span>,
    },
    {
      title: '关键词',
      dataIndex: 'keyword',
      key: 'keyword',
      render: (v: string) => <span style={{ color: '#6e6e73' }}>{v || '-'}</span>,
    },
    {
      title: '回款金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (v: number) => (
        <span style={{ color: '#34c759', fontWeight: 600 }}>{v > 0 ? `¥${Number(v).toFixed(2)}` : '-'}</span>
      ),
    },
  ]

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1d1d1f', margin: 0 }}>转化归因报表</h2>
          <p style={{ fontSize: 14, color: '#86868b', marginTop: 4 }}>全链路四级转化漏斗与多维度 ROI 分析</p>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={handleRefreshRoi}
          style={{ borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }}
        >
          刷新素材 ROI
        </Button>
      </div>

      {/* 筛选区 */}
      <Card
        className="stitch-filter-bar"
        style={{
          borderRadius: 16,
          marginBottom: 24,
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
          border: 'none',
        }}
        styles={{ body: { padding: 20 } }}
      >
        <Space wrap size={[12, 12]}>
          <Select
            value={dimension}
            onChange={(v) => setDimension(v)}
            style={{ width: 140 }}
            options={dimensionOptions}
          />
          <Select
            placeholder="渠道筛选"
            allowClear
            style={{ width: 140 }}
            value={channel}
            onChange={(v) => setChannel(v)}
            options={channelOptions}
          />
          <Input
            placeholder="账户ID"
            allowClear
            style={{ width: 180 }}
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          />
          <Input
            placeholder="计划ID"
            allowClear
            style={{ width: 180 }}
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
          />
          <RangePicker
            value={dateRange}
            onChange={(v) => setDateRange(v as [Dayjs, Dayjs] | null)}
            style={{ width: 240 }}
          />
          <Button
            icon={<SearchOutlined />}
            onClick={handleSearch}
            style={{ borderRadius: 10, background: theme.primary, border: 'none', color: '#fff' }}
          >
            查询
          </Button>
          <Button
            onClick={handleReset}
            style={{ borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }}
          >
            重置
          </Button>
        </Space>
      </Card>

      {/* ROI 数据表 */}
      <Card
        className="stitch-table"
        title={<span className="stitch-chart-title" style={{ fontWeight: 700, color: '#1d1d1f' }}>多维度 ROI 统计</span>}
        style={{
          borderRadius: 16,
          marginBottom: 24,
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
          border: 'none',
        }}
        styles={{ body: { padding: 0 } }}
      >
        <Table
          dataSource={roiData}
          columns={roiColumns}
          loading={loading}
          rowKey="dimension_key"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: <Empty description="暂无 ROI 数据" /> }}
        />
      </Card>

      {/* 转化事件明细 */}
      <Card
        className="stitch-table"
        title={<span className="stitch-chart-title" style={{ fontWeight: 700, color: '#1d1d1f' }}>转化事件明细</span>}
        style={{
          borderRadius: 16,
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
          border: 'none',
        }}
        styles={{ body: { padding: 0 } }}
      >
        <Table
          dataSource={events}
          columns={eventColumns}
          loading={eventsLoading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
          locale={{ emptyText: <Empty description="暂无转化事件" /> }}
        />
      </Card>
    </div>
  )
}
