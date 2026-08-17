import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { Button, message } from 'antd'
import { ReloadOutlined, FileTextOutlined, PlusCircleOutlined, CheckCircleOutlined, AccountBookOutlined } from '@ant-design/icons'
import { getScreenData } from '../api/dashboard'
import dayjs from 'dayjs'

// 数字动画组件：从0平滑增长到目标值
const AnimatedNumber = ({ value, duration = 1200, prefix = '', decimals = 0 }: { value: number; duration?: number; prefix?: string; decimals?: number }) => {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let raf = 0
    const startTime = Date.now()
    const startVal = 0
    const tick = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      // 缓动函数：easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = startVal + (value - startVal) * eased
      setDisplay(current)
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])
  const formatted = display.toLocaleString('zh-CN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  return <>{prefix}{formatted}</>
}

// 深色主题色常量
const COLOR = {
  bg: '#0a1929',
  card: 'rgba(16, 42, 80, 0.55)',
  cardBorder: 'rgba(0, 229, 255, 0.15)',
  title: '#00e5ff',
  text: '#b8c5d6',
  textDim: '#7a8fa6',
  gold: '#ffd700',
  cyan: '#00e5ff',
  blue: '#1890ff',
  green: '#52c41a',
  orange: '#fa8c16',
}

// 卡片容器
const Panel = ({ title, children, height }: { title: string; children: React.ReactNode; height?: number | string }) => (
  <div style={{
    background: COLOR.card,
    border: `1px solid ${COLOR.cardBorder}`,
    borderRadius: 8,
    padding: '12px 14px',
    marginBottom: 12,
    height,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'inset 0 0 30px rgba(0,229,255,0.04)',
  }}>
    <div style={{
      fontSize: 14,
      fontWeight: 600,
      color: COLOR.title,
      marginBottom: 10,
      paddingLeft: 10,
      borderLeft: `3px solid ${COLOR.cyan}`,
      display: 'flex',
      alignItems: 'center',
    }}>{title}</div>
    <div style={{ flex: 1, overflow: 'hidden' }}>{children}</div>
  </div>
)

// 双柱状图：年度收结案统计（新收 vs 已结）
const BarChart = ({ data }: { data: { month: string; received: number; closed: number }[] }) => {
  const max = Math.max(...data.flatMap(d => [d.received, d.closed]), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', gap: 3 }}>
      {data.map((d, i) => {
        const mm = d.month.split('-')[1]
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
            <div style={{ flex: 1, display: 'flex', gap: 2, alignItems: 'flex-end', width: '100%', justifyContent: 'center' }}>
              <div title={`新收: ${d.received}`} style={{
                width: 7,
                height: `${(d.received / max) * 100}%`,
                background: 'linear-gradient(180deg, #00e5ff, #1890ff)',
                minHeight: d.received > 0 ? 2 : 0,
                borderRadius: '2px 2px 0 0',
              }} />
              <div title={`已结: ${d.closed}`} style={{
                width: 7,
                height: `${(d.closed / max) * 100}%`,
                background: 'linear-gradient(180deg, #ffd700, #fa8c16)',
                minHeight: d.closed > 0 ? 2 : 0,
                borderRadius: '2px 2px 0 0',
              }} />
            </div>
            <span style={{ color: COLOR.textDim, fontSize: 9, marginTop: 2 }}>{mm}</span>
          </div>
        )
      })}
    </div>
  )
}

// 折线图：款项创收趋势（SVG）
const LineChart = ({ data }: { data: { month: string; revenue: number }[] }) => {
  const w = 320, h = 150, padX = 24, padY = 16
  const max = Math.max(...data.map(d => d.revenue), 1)
  const points = data.map((d, i) => {
    const x = padX + (i / Math.max(data.length - 1, 1)) * (w - padX * 2)
    const y = h - padY - (d.revenue / max) * (h - padY * 2)
    return [x, y] as [number, number]
  })
  const pathStr = points.map(p => `${p[0]},${p[1]}`).join(' ')
  const areaStr = points.length > 0
    ? `${points[0][0]},${h - padY} ${pathStr} ${points[points.length - 1][0]},${h - padY}`
    : ''
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(0,229,255,0.4)" />
          <stop offset="100%" stopColor="rgba(0,229,255,0)" />
        </linearGradient>
      </defs>
      {areaStr && <polygon points={areaStr} fill="url(#lineGrad)" />}
      <polyline points={pathStr} fill="none" stroke={COLOR.cyan} strokeWidth={2} />
      {points.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={2.5} fill={COLOR.gold} />
      ))}
      {data.map((d, i) => {
        if (i % 2 !== 0) return null
        const x = padX + (i / Math.max(data.length - 1, 1)) * (w - padX * 2)
        return <text key={i} x={x} y={h - 4} fill={COLOR.textDim} fontSize={8} textAnchor="middle">{d.month.split('-')[1]}</text>
      })}
    </svg>
  )
}

// 横向柱状图：客户价值分析 Top5
const HBarChart = ({ data }: { data: { client_name: string; total: number }[] }) => {
  if (!data || data.length === 0) {
    return <div style={{ color: COLOR.textDim, textAlign: 'center', paddingTop: 30 }}>暂无数据</div>
  }
  const max = Math.max(...data.map(d => d.total), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 4 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 16, color: COLOR.gold, fontSize: 12, fontWeight: 600 }}>{i + 1}</span>
          <span style={{ width: 70, color: COLOR.text, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.client_name}>{d.client_name}</span>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', height: 12, borderRadius: 6, overflow: 'hidden' }}>
            <div style={{
              width: `${(d.total / max) * 100}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #00e5ff, #1890ff)',
              borderRadius: 6,
              transition: 'width 0.8s ease',
            }} />
          </div>
          <span style={{ width: 70, color: COLOR.gold, fontSize: 12, textAlign: 'right' }}>¥{d.total.toFixed(0)}</span>
        </div>
      ))}
    </div>
  )
}

// 大屏主体内容
const DataScreenContent = () => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [now, setNow] = useState(new Date())
  const [scrollIdx, setScrollIdx] = useState(0)

  // 加载大屏数据
  const loadData = async () => {
    setLoading(true)
    try {
      const res: any = await getScreenData()
      setData(res)
      setScrollIdx(0)
    } catch {
      message.error('大屏数据加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // 每30秒自动刷新
    const refreshTimer = setInterval(loadData, 30000)
    // 每秒更新时间
    const timeTimer = setInterval(() => setNow(new Date()), 1000)
    return () => {
      clearInterval(refreshTimer)
      clearInterval(timeTimer)
    }
  }, [])

  // 实时业务动态自动滚动
  const activities = data?.recent_activities || []
  useEffect(() => {
    if (activities.length <= 4) return
    const t = setInterval(() => {
      setScrollIdx(i => (i + 1) % activities.length)
    }, 3000)
    return () => clearInterval(t)
  }, [activities.length])

  const coreMetrics = data?.core_metrics || { processing_cases: 0, month_new_cases: 0, month_closed_cases: 0, total_revenue: 0 }
  const clientValue = data?.client_value || []
  const teamRanking = data?.team_ranking || []
  const monthlyStats = data?.monthly_case_stats || []
  const revenueTrend = data?.revenue_trend || []

  // 核心指标卡片配置
  const metricCards = [
    { title: '在办案件', value: coreMetrics.processing_cases, icon: <FileTextOutlined />, color: COLOR.cyan, decimals: 0 },
    { title: '本月新增', value: coreMetrics.month_new_cases, icon: <PlusCircleOutlined />, color: COLOR.green, decimals: 0 },
    { title: '本月结案', value: coreMetrics.month_closed_cases, icon: <CheckCircleOutlined />, color: COLOR.orange, decimals: 0 },
    { title: '累计创收', value: coreMetrics.total_revenue, icon: <AccountBookOutlined />, color: COLOR.gold, decimals: 0, prefix: '¥' },
  ]

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: COLOR.bg,
      color: '#fff',
      overflow: 'hidden',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      backgroundImage: 'radial-gradient(ellipse at top, rgba(0,229,255,0.08), transparent 60%)',
    }}>
      {/* 顶部栏 */}
      <div style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        background: 'linear-gradient(180deg, rgba(0,229,255,0.08), transparent)',
        borderBottom: `1px solid ${COLOR.cardBorder}`,
      }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: COLOR.cyan, letterSpacing: 2 }}>
          法智汇律所数据大屏
        </div>
        <div style={{ fontSize: 16, color: COLOR.text, letterSpacing: 1 }}>
          {dayjs(now).format('YYYY年MM月DD日 HH:mm:ss')}
        </div>
        <Button
          type="primary"
          ghost
          icon={<ReloadOutlined />}
          onClick={loadData}
          loading={loading}
        >
          刷新
        </Button>
      </div>

      {/* 主体三列布局 */}
      <div style={{ flex: 1, display: 'flex', gap: 12, padding: 12, overflow: 'hidden' }}>
        {/* 左列 25% */}
        <div style={{ width: '25%', display: 'flex', flexDirection: 'column' }}>
          <Panel title="年度收结案统计" height="42%">
            <div style={{ height: '100%' }}>
              <BarChart data={monthlyStats} />
            </div>
          </Panel>
          <Panel title="款项创收趋势（万元）" height="58%">
            <LineChart data={revenueTrend} />
          </Panel>
        </div>

        {/* 中列 50% */}
        <div style={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
          {/* 核心指标卡片 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
            {metricCards.map((m, i) => (
              <div key={i} style={{
                background: COLOR.card,
                border: `1px solid ${COLOR.cardBorder}`,
                borderRadius: 8,
                padding: '16px 12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'inset 0 0 30px rgba(0,229,255,0.05)',
              }}>
                <div style={{ fontSize: 28, color: m.color, marginBottom: 8 }}>{m.icon}</div>
                <div style={{ fontSize: 30, fontWeight: 700, color: m.color, fontFamily: "'DIN', 'Helvetica Neue', sans-serif" }}>
                  <AnimatedNumber value={m.value} prefix={m.prefix || ''} decimals={m.decimals} />
                </div>
                <div style={{ fontSize: 13, color: COLOR.text, marginTop: 6 }}>{m.title}</div>
              </div>
            ))}
          </div>
          {/* 实时业务动态 */}
          <Panel title="实时业务动态" height="calc(100% - 110px)">
            <div style={{ height: '100%', overflow: 'hidden', position: 'relative' }}>
              {activities.length === 0 ? (
                <div style={{ color: COLOR.textDim, textAlign: 'center', paddingTop: 30 }}>暂无动态</div>
              ) : (
                <div style={{
                  transition: 'transform 0.5s ease',
                  transform: `translateY(-${scrollIdx * 56}px)`,
                }}>
                  {activities.map((a: any, i: number) => (
                    <div key={i} style={{
                      height: 56,
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 8px',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      gap: 12,
                    }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: a.type === 'case' ? COLOR.cyan : COLOR.gold,
                        flexShrink: 0,
                        boxShadow: `0 0 8px ${a.type === 'case' ? COLOR.cyan : COLOR.gold}`,
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: COLOR.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.title}
                        </div>
                        <div style={{ fontSize: 11, color: COLOR.textDim, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.content}
                        </div>
                      </div>
                      <span style={{ color: COLOR.textDim, fontSize: 11, flexShrink: 0 }}>
                        {a.time ? dayjs(a.time).format('MM-DD HH:mm') : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Panel>
        </div>

        {/* 右列 25% */}
        <div style={{ width: '25%', display: 'flex', flexDirection: 'column' }}>
          <Panel title="客户价值分析 Top5" height="42%">
            <HBarChart data={clientValue} />
          </Panel>
          <Panel title="团队绩效排行" height="58%">
            <div style={{ height: '100%', overflow: 'auto' }}>
              {teamRanking.length === 0 ? (
                <div style={{ color: COLOR.textDim, textAlign: 'center', paddingTop: 30 }}>暂无数据</div>
              ) : (
                teamRanking.map((r: any, i: number) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 4px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    gap: 10,
                  }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700,
                      background: i < 3 ? COLOR.gold : 'rgba(255,255,255,0.1)',
                      color: i < 3 ? COLOR.bg : COLOR.text,
                      flexShrink: 0,
                    }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: COLOR.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.lawyer_name}</div>
                      <div style={{ fontSize: 11, color: COLOR.textDim, marginTop: 2 }}>办案 {r.cases_count} 件</div>
                    </div>
                    <span style={{ color: COLOR.gold, fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                      ¥{Number(r.total_revenue || 0).toFixed(0)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}

// 大屏入口：检查 token，未登录跳转登录页
interface DataScreenProps {
  hideTabs?: boolean
}

const DataScreen = ({ hideTabs = false }: DataScreenProps) => {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" />
  // hideTabs 参数用于控制是否在聚合页面中显示，此处全屏展示不使用
  void hideTabs
  return <DataScreenContent />
}

export default DataScreen
