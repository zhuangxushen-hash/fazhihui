import { useState, useEffect } from 'react'
import { Card, Row, Col, Progress, Table, Tag } from 'antd'
import {
  FileSearchOutlined,
  FileTextOutlined,
  SecurityScanOutlined,
  DollarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import axios from '../api/axios'
import { theme } from '../constants/theme'
/**
 * 经营总览 - Material Design 3 风格
 * Bento Grid 布局 + 深藏青表格头 + 暗金强调
 */
export default function Dashboard() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalCases: 0,
    complianceRate: 0,
    totalRevenue: 0,
  })

  const [conversionData, setConversionData] = useState<any[]>([])
  const [caseStats, setCaseStats] = useState<any>({})
  const [lawyerStats, setLawyerStats] = useState<any[]>([])
  const [caseTypeProfit, setCaseTypeProfit] = useState<any[]>([])
  const [riskStats, setRiskStats] = useState<any>({})

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchStats()
    fetchConversionData()
    fetchCaseStats()
    fetchLawyerStats()
    fetchCaseTypeProfit()
    fetchRiskStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [leadRes, caseRes, complianceRes, revenueRes] = await Promise.all([
        axios.get('/leads', { params: { org_id: user.organization_id, page: 1, limit: 1 } }),
        axios.get('/cases', { params: { org_id: user.organization_id, page: 1, limit: 1 } }),
        axios.get('/dashboard/compliance-stats', { params: { org_id: user.organization_id } }),
        axios.get('/dashboard/revenue-stats', { params: { org_id: user.organization_id } }),
      ])
      const lead = leadRes as Record<string, unknown>
      const caseR = caseRes as Record<string, unknown>
      const comp = complianceRes as Record<string, unknown>
      const rev = revenueRes as Record<string, unknown>
      setStats({
        totalLeads: (lead?.total as number) || 0,
        totalCases: (caseR?.total as number) || 0,
        complianceRate: (comp?.rate as number) || 0,
        totalRevenue: (rev?.total_revenue as number) || 0,
      })
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  const fetchConversionData = async () => {
    try {
      const res = (await axios.get('/dashboard/conversion-funnel', { params: { org_id: user.organization_id } })) as Record<string, unknown>
      const rates = (res?.rates || {}) as Record<string, number>
      setConversionData([
        { stage: '总线索', value: res.total_leads as number, rate: '-', color: theme.primaryDark },
        { stage: '邀约中', value: res.invited as number, rate: `${(rates.invite_rate || 0).toFixed(1)}%`, color: theme.primary },
        { stage: '谈判中', value: res.negotiated as number, rate: `${(rates.negotiate_rate || 0).toFixed(1)}%`, color: theme.brandGold },
        { stage: '待签约', value: res.signed as number, rate: `${(rates.sign_rate || 0).toFixed(1)}%`, color: theme.success },
      ])
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  const fetchCaseStats = async () => {
    try {
      const res = await axios.get('/dashboard/case-stats', { params: { org_id: user.organization_id } })
      setCaseStats(res as Record<string, unknown>)
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  const fetchLawyerStats = async () => {
    try {
      const res = await axios.get('/dashboard/lawyer-performance', { params: { org_id: user.organization_id } })
      setLawyerStats((res as Record<string, unknown>[]) || [])
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  const fetchCaseTypeProfit = async () => {
    try {
      const res = await axios.get('/dashboard/case-type-profit', { params: { org_id: user.organization_id } })
      setCaseTypeProfit((res as Record<string, unknown>[]) || [])
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  const fetchRiskStats = async () => {
    try {
      const res = await axios.get('/dashboard/risk-stats', { params: { org_id: user.organization_id } })
      setRiskStats((res as Record<string, unknown>) || {})
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  const columns = [
    {
      title: '阶段',
      dataIndex: 'stage',
      key: 'stage',
      render: (_: string, record: Record<string, unknown>) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: record.color as string }} />
          <span>{_}</span>
        </div>
      ),
    },
    {
      title: '数量',
      dataIndex: 'value',
      key: 'value',
      render: (val: number) => (
        <span style={{ fontWeight: 600, fontSize: 15, fontFamily: "'Noto Serif SC', serif" }}>{val}</span>
      ),
    },
    {
      title: '转化率',
      dataIndex: 'rate',
      key: 'rate',
      render: (rate: string) => (
        <Tag
          color={rate === '-' ? 'default' : parseFloat(rate) > 50 ? 'blue' : 'orange'}
          style={{ borderRadius: 999 }}
        >
          {rate}
        </Tag>
      ),
    },
  ]

  const lawyerColumns = [
    {
      title: '律师姓名',
      dataIndex: 'lawyer_name',
      key: 'lawyer_name',
      render: (name: string) => <span style={{ fontWeight: 500 }}>{name}</span>,
    },
    {
      title: '案件数',
      dataIndex: 'cases_count',
      key: 'cases_count',
      render: (count: number) => (
        <span style={{ fontWeight: 600, fontFamily: "'Noto Serif SC', serif" }}>{count}</span>
      ),
    },
    {
      title: '结案数',
      dataIndex: 'closed_cases',
      key: 'closed_cases',
      render: (count: number) => (
        <span style={{ fontWeight: 600, color: theme.success }}>{count}</span>
      ),
    },
    {
      title: '结案率',
      dataIndex: 'revenue_rate',
      key: 'revenue_rate',
      render: (rate: number) => (
        <span style={{ fontWeight: 600, color: rate > 70 ? theme.success : rate > 40 ? theme.warning : theme.error }}>
          {rate.toFixed(1)}%
        </span>
      ),
    },
    {
      title: '创收',
      dataIndex: 'total_revenue',
      key: 'total_revenue',
      render: (rev: number) => (
        <span style={{ fontWeight: 600, color: theme.primaryDark, fontFamily: "'Noto Serif SC', serif" }}>
          ¥{rev.toFixed(2)}
        </span>
      ),
    },
  ]

  const caseTypeColumns = [
    {
      title: '案由',
      dataIndex: 'case_type_label',
      key: 'case_type_label',
      render: (label: string) => <span style={{ fontWeight: 500 }}>{label}</span>,
    },
    {
      title: '案件数',
      dataIndex: 'cases_count',
      key: 'cases_count',
      render: (count: number) => (
        <span style={{ fontWeight: 600, fontFamily: "'Noto Serif SC', serif" }}>{count ?? 0}</span>
      ),
    },
    {
      title: '总收入',
      dataIndex: 'total_revenue',
      key: 'total_revenue',
      render: (rev: number) => (
        <span style={{ fontWeight: 600, color: theme.primaryDark }}>¥{rev.toFixed(2)}</span>
      ),
    },
    {
      title: '平均收入',
      dataIndex: 'avg_revenue',
      key: 'avg_revenue',
      render: (rev: number) => <span style={{ fontWeight: 500 }}>¥{rev.toFixed(2)}</span>,
    },
    {
      title: '利润率',
      dataIndex: 'profit_margin',
      key: 'profit_margin',
      render: (rate: number) => (
        <span style={{ fontWeight: 600, color: rate > 30 ? theme.success : rate > 15 ? theme.warning : theme.error }}>
          {rate.toFixed(1)}%
        </span>
      ),
    },
  ]

  // === Bento Stat Cards（Stitch 设计规范：渐变背景 KPI 卡片） ===
  // cardClass：通过 index.css 的 .kpi-card-* 类实现渐变背景（带 !important 覆盖 Antd Card 白底）
  // textMode: 'light' 深色背景卡片用纯白文字（深蓝/藏青/绿），'dark' 浅色背景卡片用深藏青文字（暗金）
  const statCards = [
    {
      title: '总线索数',
      value: stats.totalLeads,
      icon: <FileSearchOutlined />,
      trend: '+12%',
      trendUp: true,
      cardClass: 'kpi-card-blue',
      textMode: 'light',
    },
    {
      title: '总案件数',
      value: stats.totalCases,
      icon: <FileTextOutlined />,
      trend: '+8%',
      trendUp: true,
      cardClass: 'kpi-card-gold',
      textMode: 'dark',
    },
    {
      title: '合规率',
      value: `${stats.complianceRate.toFixed(1)}%`,
      icon: <SecurityScanOutlined />,
      trend: '+3%',
      trendUp: true,
      cardClass: 'kpi-card-navy',
      textMode: 'light',
    },
    {
      title: '总收入',
      value: `¥${stats.totalRevenue.toFixed(2)}`,
      icon: <DollarOutlined />,
      trend: '+15%',
      trendUp: true,
      cardClass: 'kpi-card-green',
      textMode: 'light',
    },
  ]

  // === 案件状态色卡 ===
  const caseStatusCards = [
    {
      label: '待分配',
      count: caseStats.pending_assign || 0,
      total: caseStats.total || 1,
      color: theme.warning,
      bgColor: 'rgba(237, 108, 2, 0.08)',
      borderColor: 'rgba(237, 108, 2, 0.2)',
    },
    {
      label: '处理中',
      count: caseStats.processing || 0,
      total: caseStats.total || 1,
      color: theme.primary,
      bgColor: 'rgba(0, 113, 227, 0.08)',
      borderColor: 'rgba(0, 113, 227, 0.2)',
    },
    {
      label: '已结案',
      count: caseStats.closed || 0,
      total: caseStats.total || 1,
      color: theme.success,
      bgColor: 'rgba(46, 125, 50, 0.08)',
      borderColor: 'rgba(46, 125, 50, 0.2)',
    },
    {
      label: '超期案件',
      count: caseStats.overdue || 0,
      total: caseStats.total || 1,
      color: theme.error,
      bgColor: 'rgba(186, 26, 26, 0.08)',
      borderColor: 'rgba(186, 26, 26, 0.2)',
    },
  ]

  const cardHeadStyle: React.CSSProperties = {
    borderBottom: `1px solid ${theme.border}`,
    padding: '0 20px',
    minHeight: 56,
  }

  const cardTitleStyle: React.CSSProperties = {
    fontFamily: "'Noto Serif SC', serif",
    fontSize: 16,
    fontWeight: 600,
    color: theme.textBase,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* === 统计卡片区 (Bento Grid) - Stitch 渐变 KPI 卡片 ===
         渐变背景通过 .kpi-card-* 类（index.css，带 !important）覆盖 Antd Card 白底样式 */}
      <Row gutter={[16, 16]}>
        {statCards.map((card, index) => {
          // 根据背景亮度选择文字颜色，确保可读性：
          // light：深色背景用纯白100%不透明（深蓝/藏青/绿渐变）
          // dark：浅色背景用深藏青100%不透明（暗金渐变，原白字对比度不够）
          const isLight = card.textMode === 'light'
          const titleColor = isLight ? theme.white : theme.brandDark
          const valueColor = isLight ? theme.white : theme.brandDark
          const trendIconColor = isLight ? theme.white : theme.brandDark
          // 辅助文字也用不透明色，避免半透明导致看不清
          const trendTextColor = isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(26, 35, 50, 0.9)'
          const trendValueColor = isLight ? theme.white : theme.brandDark
          const iconBgColor = isLight ? 'rgba(255, 255, 255, 0.22)' : 'rgba(26, 35, 50, 0.15)'
          const iconColor = isLight ? theme.white : theme.brandDark
          const haloBg = isLight
            ? 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(26,35,50,0.10) 0%, transparent 70%)'
          return (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card
                className={`${card.cardClass} stitch-kpi-card`}
                // styles.body 替代已废弃的 bodyStyle，符合 Antd 6.x 规范
                styles={{
                  body: {
                    padding: 20,
                    position: 'relative',
                    zIndex: 1,
                    background: 'transparent',
                  },
                }}
                style={{
                  height: '100%',
                  position: 'relative',
                }}
              >
                {/* 装饰性光晕：右上角高光（按背景亮度调整） */}
                <div style={{
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  background: haloBg,
                  pointerEvents: 'none',
                }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 14,
                        color: titleColor,
                        marginBottom: 12,
                        letterSpacing: '0.02em',
                        fontWeight: 600,
                      }}
                    >
                      {card.title}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Noto Serif SC', serif",
                        fontSize: 32,
                        fontWeight: 700,
                        color: valueColor,
                        lineHeight: 1.2,
                        letterSpacing: '0.01em',
                        // 深色背景加深文字阴影，让白字更清晰
                        textShadow: isLight ? '0 2px 10px rgba(0, 0, 0, 0.25)' : 'none',
                      }}
                    >
                      {card.value}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12 }}>
                      {card.trendUp ? (
                        <ArrowUpOutlined style={{ fontSize: 12, color: trendIconColor }} />
                      ) : (
                        <ArrowDownOutlined style={{ fontSize: 12, color: trendIconColor }} />
                      )}
                      <span style={{ fontSize: 12, color: trendTextColor }}>
                        <span style={{ color: trendValueColor, fontWeight: 700 }}>
                          {card.trend}
                        </span>{' '}
                        较上月
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: iconBgColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: iconColor,
                      fontSize: 22,
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    {card.icon}
                  </div>
                </div>
              </Card>
            </Col>
          )
        })}
      </Row>

      {/* === 转化漏斗 + 案件状态 === */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={<span style={cardTitleStyle}>线索转化漏斗</span>}
            headStyle={cardHeadStyle}
            style={{ height: '100%' }}
          >
            {/* 漏斗可视化 */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {conversionData.map((item, index) => (
                <div key={index} style={{ flex: 1, textAlign: 'center' }}>
                  <div
                    style={{
                      width: '100%',
                      padding: '14px 8px',
                      borderRadius: 10,
                      background: item.color,
                      color: theme.white,
                      fontSize: 18,
                      fontWeight: 700,
                      marginBottom: 8,
                      opacity: 1 - index * 0.15,
                      fontFamily: "'Noto Serif SC', serif",
                      boxShadow: `0 4px 12px ${item.color}40`,
                    }}
                  >
                    {item.value}
                  </div>
                  <div style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4 }}>{item.stage}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: item.color }}>{item.rate}</div>
                </div>
              ))}
            </div>
            <Table dataSource={conversionData} columns={columns} pagination={false} rowKey="stage" size="small" />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={<span style={cardTitleStyle}>案件状态分布</span>}
            headStyle={cardHeadStyle}
            style={{ height: '100%' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {caseStatusCards.map(item => (
                <div
                  key={item.label}
                  style={{
                    background: item.bgColor,
                    padding: 16,
                    borderRadius: 12,
                    border: `1px solid ${item.borderColor}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: item.color, fontWeight: 500 }}>{item.label}</span>
                    <span
                      style={{
                        fontSize: 22,
                        fontWeight: 700,
                        color: item.color,
                        fontFamily: "'Noto Serif SC', serif",
                      }}
                    >
                      {item.count}
                    </span>
                  </div>
                  <Progress
                    percent={(item.count / item.total) * 100}
                    strokeColor={item.color}
                    format={percent => `${(percent || 0).toFixed(1)}%`}
                    size="small"
                    trailColor="rgba(255, 255, 255, 0.6)"
                    strokeWidth={4}
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* === 律师绩效 + 案由盈利 === */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={<span style={cardTitleStyle}>律师绩效统计</span>}
            headStyle={cardHeadStyle}
            style={{ height: '100%' }}
          >
            <Table dataSource={lawyerStats} columns={lawyerColumns} pagination={false} rowKey="lawyer_name" size="small" />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={<span style={cardTitleStyle}>分案由盈利分析</span>}
            headStyle={cardHeadStyle}
            style={{ height: '100%' }}
          >
            <Table
              dataSource={caseTypeProfit}
              columns={caseTypeColumns}
              pagination={false}
              rowKey="case_type_label"
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* === 风险预警 + 经营概览 === */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={<span style={cardTitleStyle}>风险预警统计</span>}
            headStyle={cardHeadStyle}
            style={{ height: '100%' }}
          >
            {[
              {
                label: '高风险案件',
                count: riskStats.high_risk || 0,
                color: theme.error,
                icon: <WarningOutlined />,
              },
              {
                label: '中风险案件',
                count: riskStats.medium_risk || 0,
                color: theme.warning,
                icon: <WarningOutlined />,
              },
              {
                label: '低风险案件',
                count: riskStats.low_risk || 0,
                color: theme.success,
                icon: <CheckCircleOutlined />,
              },
            ].map(item => (
              <div key={item.label} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: item.color }}>
                    {item.icon}
                    <span style={{ fontSize: 13, color: theme.textBase }}>{item.label}</span>
                  </span>
                  <Tag
                    color={item.color === theme.error ? 'red' : item.color === theme.warning ? 'orange' : 'green'}
                    style={{ fontWeight: 600, borderRadius: 999 }}
                  >
                    {item.count}
                  </Tag>
                </div>
                <Progress
                  percent={(item.count / (riskStats.total || 1)) * 100}
                  strokeColor={item.color}
                  format={percent => `${(percent || 0).toFixed(1)}%`}
                  strokeWidth={6}
                />
              </div>
            ))}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={<span style={cardTitleStyle}>经营数据概览</span>}
            headStyle={cardHeadStyle}
            style={{ height: '100%' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: '总风险案件', value: riskStats.total || 0, color: theme.primaryDark },
                { label: '高风险案件', value: riskStats.high_risk || 0, color: theme.error },
                { label: '中风险案件', value: riskStats.medium_risk || 0, color: theme.warning },
                { label: '低风险案件', value: riskStats.low_risk || 0, color: theme.success },
              ].map(item => (
                <div
                  key={item.label}
                  style={{
                    background: theme.bgLayout,
                    padding: 20,
                    borderRadius: 12,
                    textAlign: 'center',
                    border: `1px solid ${theme.bgSurfaceHighest}`,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Noto Serif SC', serif",
                      fontSize: 28,
                      fontWeight: 700,
                      color: item.color,
                      lineHeight: 1.2,
                    }}
                  >
                    {item.value}
                  </div>
                  <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 6 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
