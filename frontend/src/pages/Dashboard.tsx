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
      setStats({
        totalLeads: leadRes.total || 0,
        totalCases: caseRes.total || 0,
        complianceRate: complianceRes.rate || 0,
        totalRevenue: revenueRes.total_revenue || 0,
      })
    } catch (error) {
      console.error('Fetch stats error:', error)
    }
  }

  const fetchConversionData = async () => {
    try {
      const res = await axios.get('/dashboard/conversion-funnel', { params: { org_id: user.organization_id } })
      setConversionData([
        { stage: '总线索', value: res.total_leads, rate: '-', color: '#0059b5' },
        { stage: '邀约中', value: res.invited, rate: `${res.rates.invite_rate.toFixed(1)}%`, color: '#0071e3' },
        { stage: '谈判中', value: res.negotiated, rate: `${res.rates.negotiate_rate.toFixed(1)}%`, color: '#c9a961' },
        { stage: '待签约', value: res.signed, rate: `${res.rates.sign_rate.toFixed(1)}%`, color: '#2e7d32' },
      ])
    } catch (error) {
      console.error('Fetch conversion data error:', error)
    }
  }

  const fetchCaseStats = async () => {
    try {
      const res = await axios.get('/dashboard/case-stats', { params: { org_id: user.organization_id } })
      setCaseStats(res)
    } catch (error) {
      console.error('Fetch case stats error:', error)
    }
  }

  const fetchLawyerStats = async () => {
    try {
      const res = await axios.get('/dashboard/lawyer-performance', { params: { org_id: user.organization_id } })
      setLawyerStats(res || [])
    } catch (error) {
      console.error('Fetch lawyer stats error:', error)
    }
  }

  const fetchCaseTypeProfit = async () => {
    try {
      const res = await axios.get('/dashboard/case-type-profit', { params: { org_id: user.organization_id } })
      setCaseTypeProfit(res || [])
    } catch (error) {
      console.error('Fetch case type profit error:', error)
    }
  }

  const fetchRiskStats = async () => {
    try {
      const res = await axios.get('/dashboard/risk-stats', { params: { org_id: user.organization_id } })
      setRiskStats(res || {})
    } catch (error) {
      console.error('Fetch risk stats error:', error)
    }
  }

  const columns = [
    {
      title: '阶段',
      dataIndex: 'stage',
      key: 'stage',
      render: (_: string, record: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: record.color }} />
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
        <span style={{ fontWeight: 600, color: '#2e7d32' }}>{count}</span>
      ),
    },
    {
      title: '结案率',
      dataIndex: 'revenue_rate',
      key: 'revenue_rate',
      render: (rate: number) => (
        <span style={{ fontWeight: 600, color: rate > 70 ? '#2e7d32' : rate > 40 ? '#ed6c02' : '#ba1a1a' }}>
          {rate.toFixed(1)}%
        </span>
      ),
    },
    {
      title: '创收',
      dataIndex: 'total_revenue',
      key: 'total_revenue',
      render: (rev: number) => (
        <span style={{ fontWeight: 600, color: '#0059b5', fontFamily: "'Noto Serif SC', serif" }}>
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
        <span style={{ fontWeight: 600, color: '#0059b5' }}>¥{rev.toFixed(2)}</span>
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
        <span style={{ fontWeight: 600, color: rate > 30 ? '#2e7d32' : rate > 15 ? '#ed6c02' : '#ba1a1a' }}>
          {rate.toFixed(1)}%
        </span>
      ),
    },
  ]

  // === Bento Stat Cards ===
  const statCards = [
    {
      title: '总线索数',
      value: stats.totalLeads,
      icon: <FileSearchOutlined />,
      iconBg: 'rgba(0, 113, 227, 0.1)',
      iconColor: '#0071e3',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: '总案件数',
      value: stats.totalCases,
      icon: <FileTextOutlined />,
      iconBg: 'rgba(201, 169, 97, 0.12)',
      iconColor: '#8c702e',
      trend: '+8%',
      trendUp: true,
    },
    {
      title: '合规率',
      value: `${stats.complianceRate.toFixed(1)}%`,
      icon: <SecurityScanOutlined />,
      iconBg: 'rgba(26, 35, 50, 0.08)',
      iconColor: '#1a2332',
      trend: '+3%',
      trendUp: true,
    },
    {
      title: '总收入',
      value: `¥${stats.totalRevenue.toFixed(2)}`,
      icon: <DollarOutlined />,
      iconBg: 'rgba(46, 125, 50, 0.1)',
      iconColor: '#2e7d32',
      trend: '+15%',
      trendUp: true,
    },
  ]

  // === 案件状态色卡 ===
  const caseStatusCards = [
    {
      label: '待分配',
      count: caseStats.pending_assign || 0,
      total: caseStats.total || 1,
      color: '#ed6c02',
      bgColor: 'rgba(237, 108, 2, 0.08)',
      borderColor: 'rgba(237, 108, 2, 0.2)',
    },
    {
      label: '处理中',
      count: caseStats.processing || 0,
      total: caseStats.total || 1,
      color: '#0071e3',
      bgColor: 'rgba(0, 113, 227, 0.08)',
      borderColor: 'rgba(0, 113, 227, 0.2)',
    },
    {
      label: '已结案',
      count: caseStats.closed || 0,
      total: caseStats.total || 1,
      color: '#2e7d32',
      bgColor: 'rgba(46, 125, 50, 0.08)',
      borderColor: 'rgba(46, 125, 50, 0.2)',
    },
    {
      label: '超期案件',
      count: caseStats.overdue || 0,
      total: caseStats.total || 1,
      color: '#ba1a1a',
      bgColor: 'rgba(186, 26, 26, 0.08)',
      borderColor: 'rgba(186, 26, 26, 0.2)',
    },
  ]

  const cardHeadStyle: React.CSSProperties = {
    borderBottom: '1px solid #c1c6d6',
    padding: '0 20px',
    minHeight: 56,
  }

  const cardTitleStyle: React.CSSProperties = {
    fontFamily: "'Noto Serif SC', serif",
    fontSize: 16,
    fontWeight: 600,
    color: '#1a1c1d',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* === 统计卡片区 (Bento Grid) === */}
      <Row gutter={[16, 16]}>
        {statCards.map((card, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card style={{ height: '100%' }} bodyStyle={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 12,
                      color: '#414753',
                      marginBottom: 12,
                      letterSpacing: '0.02em',
                      fontWeight: 500,
                    }}
                  >
                    {card.title}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Noto Serif SC', serif",
                      fontSize: 30,
                      fontWeight: 700,
                      color: '#1a1c1d',
                      lineHeight: 1.2,
                      letterSpacing: '0.01em',
                    }}
                  >
                    {card.value}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12 }}>
                    {card.trendUp ? (
                      <ArrowUpOutlined style={{ fontSize: 12, color: '#2e7d32' }} />
                    ) : (
                      <ArrowDownOutlined style={{ fontSize: 12, color: '#ba1a1a' }} />
                    )}
                    <span style={{ fontSize: 12, color: '#717785' }}>
                      <span style={{ color: card.trendUp ? '#2e7d32' : '#ba1a1a', fontWeight: 600 }}>
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
                    background: card.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: card.iconColor,
                    fontSize: 22,
                  }}
                >
                  {card.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
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
                      color: '#fff',
                      fontSize: 18,
                      fontWeight: 700,
                      marginBottom: 8,
                      opacity: 1 - index * 0.15,
                      fontFamily: "'Noto Serif SC', serif",
                    }}
                  >
                    {item.value}
                  </div>
                  <div style={{ fontSize: 12, color: '#414753', marginBottom: 4 }}>{item.stage}</div>
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
                color: '#ba1a1a',
                icon: <WarningOutlined />,
              },
              {
                label: '中风险案件',
                count: riskStats.medium_risk || 0,
                color: '#ed6c02',
                icon: <WarningOutlined />,
              },
              {
                label: '低风险案件',
                count: riskStats.low_risk || 0,
                color: '#2e7d32',
                icon: <CheckCircleOutlined />,
              },
            ].map(item => (
              <div key={item.label} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: item.color }}>
                    {item.icon}
                    <span style={{ fontSize: 13, color: '#1a1c1d' }}>{item.label}</span>
                  </span>
                  <Tag
                    color={item.color === '#ba1a1a' ? 'red' : item.color === '#ed6c02' ? 'orange' : 'green'}
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
                { label: '总风险案件', value: riskStats.total || 0, color: '#0059b5' },
                { label: '高风险案件', value: riskStats.high_risk || 0, color: '#ba1a1a' },
                { label: '中风险案件', value: riskStats.medium_risk || 0, color: '#ed6c02' },
                { label: '低风险案件', value: riskStats.low_risk || 0, color: '#2e7d32' },
              ].map(item => (
                <div
                  key={item.label}
                  style={{
                    background: '#f9f9fb',
                    padding: 20,
                    borderRadius: 12,
                    textAlign: 'center',
                    border: '1px solid #e2e2e4',
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
                  <div style={{ fontSize: 12, color: '#414753', marginTop: 6 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
