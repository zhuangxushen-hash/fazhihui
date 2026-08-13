import { useState, useCallback, useEffect } from 'react'
import { Card, Row, Col, Table, Tag, Button, Badge, message } from 'antd'
import {
  CrownOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RightOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'
import { theme } from '../constants/theme'
import { formatDate } from '../utils/format'
import { getVipSubscriptions, getVipPlans, getOrderStats } from '../api/order'
import type { VipSubscriptionItem, VipPlan } from '../api/order'

// === 状态配置 ===
const vipStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: '生效中', color: theme.success, bg: 'rgba(46, 125, 50, 0.1)' },
  expired: { label: '已过期', color: theme.gray, bg: 'rgba(113, 119, 133, 0.12)' },
  cancelled: { label: '已取消', color: theme.warning, bg: 'rgba(237, 108, 2, 0.1)' },
}

// === 页面样式 ===
const pageStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: '16px 24px',
  background: theme.bgLayout,
  minHeight: '100vh',
}

const cardStyle: React.CSSProperties = {
  borderRadius: 12,
  boxShadow: theme.cardShadow,
}

// === 金额格式化 ===
const fmtMoney = (v: number) =>
  `¥${(Number(v || 0)).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function VIPOrder() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<VipSubscriptionItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [plans, setPlans] = useState<VipPlan[]>([])
  const [stats, setStats] = useState({
    total_count: 0,
    paid_count: 0,
    pending_count: 0,
    total_amount: 0,
    paid_amount: 0,
    vip_count: 0,
  })

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [vipRes, plansRes, statsRes] = await Promise.all([
        getVipSubscriptions({ page, page_size: pageSize }),
        getVipPlans(),
        getOrderStats(),
      ])
      setDataSource(vipRes.data || [])
      setTotal(vipRes.total || 0)
      setPlans(plansRes.plans || [])
      setStats(statsRes || {})
    } catch (err) {
      message.error('加载VIP订单失败')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 计算剩余天数
  const calcDaysLeft = (endDate: string): number => {
    if (!endDate) return 0
    const end = new Date(endDate).getTime()
    const now = new Date().getTime()
    return Math.max(Math.ceil((end - now) / (1000 * 60 * 60 * 24)), 0)
  }

  // === VIP订阅列表列 ===
  const vipColumns: ColumnsType<VipSubscriptionItem> = [
    { title: '用户ID', dataIndex: 'user_id', key: 'user_id', width: 180, ellipsis: true },
    {
      title: '套餐',
      dataIndex: 'plan_type',
      key: 'plan_type',
      width: 120,
      render: (v: string) => {
        const planLabelMap: Record<string, string> = {
          month: '月卡',
          quarter: '季卡',
          half_year: '半年卡',
          year: '年卡',
        }
        return <Tag color="gold">{planLabelMap[v] || v}</Tag>
      },
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      align: 'right',
      render: (v: number) => (
        <span style={{ fontWeight: 600, color: theme.primaryDark, fontFamily: "'Noto Serif SC', serif" }}>
          {fmtMoney(v)}
        </span>
      ),
    },
    { title: '生效日期', dataIndex: 'start_date', key: 'start_date', width: 120 },
    { title: '到期日期', dataIndex: 'end_date', key: 'end_date', width: 120 },
    {
      title: '剩余天数',
      key: 'days_left',
      width: 110,
      align: 'right',
      render: (_: unknown, record: VipSubscriptionItem) => {
        const days = calcDaysLeft(record.end_date)
        if (days === 0) return <span style={{ color: theme.gray }}>已到期</span>
        if (days <= 30) return <span style={{ color: theme.error, fontWeight: 600 }}>{days} 天</span>
        return <span style={{ color: theme.success }}>{days} 天</span>
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (v: string) => {
        const cfg = vipStatusConfig[v]
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 10px',
              borderRadius: 999,
              background: cfg?.bg,
              color: cfg?.color,
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            <Badge color={cfg?.color} style={{ marginRight: 4 }} />
            {cfg?.label || v}
          </span>
        )
      },
    },
    { title: '开通时间', dataIndex: 'created_at', key: 'created_at', width: 150, render: (v: string) => formatDate(v) },
  ]

  return (
    <div style={pageStyle}>
      {/* 统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={8}>
          <Card style={{ ...cardStyle, background: theme.gradientStat2 }} bodyStyle={{ padding: 20, color: theme.brandDark }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, opacity: 0.85 }}>VIP 订阅总数</div>
                <div
                  style={{
                    fontFamily: "'Noto Serif SC', serif",
                    fontSize: 32,
                    fontWeight: 700,
                    marginTop: 8,
                    color: theme.brandDark,
                  }}
                >
                  <CrownOutlined style={{ marginRight: 4, color: theme.brandGold }} />
                  {stats.vip_count}
                </div>
              </div>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  background: 'rgba(26, 35, 50, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  color: theme.brandGold,
                }}
              >
                <CrownOutlined />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card style={{ ...cardStyle, background: theme.gradientStat1 }} bodyStyle={{ padding: 20, color: theme.white }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, opacity: 0.85 }}>VIP 订单金额</div>
                <div
                  style={{
                    fontFamily: "'Noto Serif SC', serif",
                    fontSize: 32,
                    fontWeight: 700,
                    marginTop: 8,
                  }}
                >
                  {fmtMoney(stats.total_amount)}
                </div>
              </div>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                }}
              >
                <ClockCircleOutlined />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card style={{ ...cardStyle, background: theme.gradientStat3 }} bodyStyle={{ padding: 20, color: theme.white }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, opacity: 0.85 }}>总订单</div>
                <div
                  style={{
                    fontFamily: "'Noto Serif SC', serif",
                    fontSize: 32,
                    fontWeight: 700,
                    marginTop: 8,
                  }}
                >
                  {stats.total_count}
                </div>
              </div>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                }}
              >
                <CheckCircleOutlined />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* VIP 套餐展示 */}
      <Card title="VIP 套餐" style={cardStyle} extra={<Button type="link" onClick={() => navigate('/orders/vip/subscribe')}>立即开通 <RightOutlined /></Button>}>
        <Row gutter={[16, 16]}>
          {plans.map((plan) => (
            <Col xs={12} sm={6} key={plan.plan_type}>
              <Card
                hoverable
                style={{
                  borderRadius: 12,
                  border: plan.plan_type === 'year' ? `2px solid ${theme.brandGold}` : `1px solid ${theme.border}`,
                  textAlign: 'center',
                }}
                onClick={() => navigate('/orders/vip/subscribe')}
              >
                {plan.plan_type === 'year' && (
                  <Tag color="gold" style={{ position: 'absolute', top: 8, right: 8 }}>
                    推荐
                  </Tag>
                )}
                <CrownOutlined style={{ fontSize: 28, color: theme.brandGold, marginBottom: 8 }} />
                <div style={{ fontSize: 18, fontWeight: 600 }}>{plan.label}</div>
                <div style={{ margin: '12px 0' }}>
                  <span style={{ fontSize: 26, fontWeight: 700, color: theme.primary, fontFamily: "'Noto Serif SC', serif" }}>
                    {fmtMoney(plan.price)}
                  </span>
                  <span style={{ color: theme.textTertiary, fontSize: 13 }}>/{plan.months}个月</span>
                </div>
                <div style={{ color: theme.textTertiary, fontSize: 13 }}>约 ¥{(plan.price / plan.months).toFixed(1)}/月</div>
              </Card>
            </Col>
          ))}
          {plans.length === 0 && (
            <div style={{ width: '100%', textAlign: 'center', color: theme.textTertiary, padding: 24 }}>
              暂无VIP套餐数据
            </div>
          )}
        </Row>
      </Card>

      {/* VIP 订阅列表 */}
      <Card title="VIP订阅列表" style={cardStyle}>
        <Table
          size="small"
          dataSource={dataSource}
          columns={vipColumns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showTotal: (t) => `共 ${t} 条VIP订阅`,
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
