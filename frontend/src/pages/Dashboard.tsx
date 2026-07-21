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
        { stage: '总线索', value: res.total_leads, rate: '-', color: '#1890ff' },
        { stage: '邀约中', value: res.invited, rate: `${res.rates.invite_rate.toFixed(1)}%`, color: '#4edcca' },
        { stage: '谈判中', value: res.negotiated, rate: `${res.rates.negotiate_rate.toFixed(1)}%`, color: '#faad14' },
        { stage: '待签约', value: res.signed, rate: `${res.rates.sign_rate.toFixed(1)}%`, color: '#52c41a' },
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
      )
    },
    { 
      title: '数量', 
      dataIndex: 'value', 
      key: 'value',
      render: (val: number) => <span style={{ fontWeight: 600, fontSize: 15 }}>{val}</span>
    },
    { 
      title: '转化率', 
      dataIndex: 'rate', 
      key: 'rate',
      render: (rate: string) => (
        <Tag color={rate === '-' ? 'default' : parseFloat(rate) > 50 ? 'blue' : 'orange'}>
          {rate}
        </Tag>
      )
    },
  ]

  const lawyerColumns = [
    { title: '律师姓名', dataIndex: 'lawyer_name', key: 'lawyer_name', render: (name: string) => <span style={{ fontWeight: 500 }}>{name}</span> },
    { title: '案件数', dataIndex: 'cases_count', key: 'cases_count', render: (count: number) => <span style={{ fontWeight: 600 }}>{count}</span> },
    { title: '结案数', dataIndex: 'closed_cases', key: 'closed_cases', render: (count: number) => <span style={{ fontWeight: 600, color: '#52c41a' }}>{count}</span> },
    { 
      title: '结案率', 
      dataIndex: 'revenue_rate', 
      key: 'revenue_rate', 
      render: (rate: number) => (
        <span style={{ fontWeight: 600, color: rate > 70 ? '#52c41a' : rate > 40 ? '#faad14' : '#f5222d' }}>
          {rate.toFixed(1)}%
        </span>
      ) 
    },
    { title: '创收', dataIndex: 'total_revenue', key: 'total_revenue', render: (rev: number) => <span style={{ fontWeight: 600, color: '#1890ff' }}>¥{rev.toFixed(2)}</span> },
  ]

  const caseTypeColumns = [
    { title: '案由', dataIndex: 'case_type_label', key: 'case_type_label', render: (label: string) => <span style={{ fontWeight: 500 }}>{label}</span> },
    { title: '案件数', dataIndex: 'cases_count', key: 'cases_count', render: (count: number) => <span style={{ fontWeight: 600 }}>{count ?? 0}</span> },
    { title: '总收入', dataIndex: 'total_revenue', key: 'total_revenue', render: (rev: number) => <span style={{ fontWeight: 600, color: '#1890ff' }}>¥{rev.toFixed(2)}</span> },
    { title: '平均收入', dataIndex: 'avg_revenue', key: 'avg_revenue', render: (rev: number) => <span style={{ fontWeight: 500 }}>¥{rev.toFixed(2)}</span> },
    { 
      title: '利润率', 
      dataIndex: 'profit_margin', 
      key: 'profit_margin', 
      render: (rate: number) => (
        <span style={{ fontWeight: 600, color: rate > 30 ? '#52c41a' : rate > 15 ? '#faad14' : '#f5222d' }}>
          {rate.toFixed(1)}%
        </span>
      ) 
    },
  ]

  const statCards = [
    {
      title: '总线索数',
      value: stats.totalLeads,
      icon: <FileSearchOutlined />,
      gradient: 'var(--gradient-stat-1)',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: '总案件数',
      value: stats.totalCases,
      icon: <FileTextOutlined />,
      gradient: 'var(--gradient-stat-2)',
      trend: '+8%',
      trendUp: true,
    },
    {
      title: '合规率',
      value: `${stats.complianceRate.toFixed(1)}%`,
      icon: <SecurityScanOutlined />,
      gradient: 'var(--gradient-stat-3)',
      trend: '+3%',
      trendUp: true,
    },
    {
      title: '总收入',
      value: `¥${stats.totalRevenue.toFixed(2)}`,
      icon: <DollarOutlined />,
      gradient: 'var(--gradient-stat-4)',
      trend: '+15%',
      trendUp: true,
    },
  ]

  const tableCardStyle: React.CSSProperties = {
    background: '#fff',
    border: '1px solid var(--border-default)',
    boxShadow: 'var(--shadow-sm)',
    borderRadius: 10,
  }

  return (
    <div>
      <Row gutter={[16, 16]}>
        {statCards.map((card, index) => (
          <Col span={6} key={index}>
            <Card
              style={{
                background: card.gradient,
                border: 'none',
                borderRadius: 10,
                padding: 20,
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>{card.title}</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: '#fff' }}>{card.value}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                    {card.trendUp ? (
                      <ArrowUpOutlined style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }} />
                    ) : (
                      <ArrowDownOutlined style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }} />
                    )}
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{card.trend} 较上月</span>
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 8 }}>
                  {card.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card 
            title={<span style={{ fontSize: 15, fontWeight: 600 }}>线索转化漏斗</span>}
            style={tableCardStyle}
          >
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                {conversionData.map((item, index) => (
                  <div key={index} style={{ flex: 1, textAlign: 'center' }}>
                    <div 
                      style={{ 
                        width: '100%', 
                        padding: '16px 8px', 
                        borderRadius: 8,
                        background: item.color,
                        color: '#fff',
                        fontSize: 18,
                        fontWeight: 700,
                        marginBottom: 8,
                        opacity: 1 - (index * 0.15),
                      }}
                    >
                      {item.value}
                    </div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{item.stage}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: item.color }}>{item.rate}</div>
                  </div>
                ))}
              </div>
            </div>
            <Table 
              dataSource={conversionData} 
              columns={columns} 
              pagination={false}
              rowKey="stage"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card 
            title={<span style={{ fontSize: 15, fontWeight: 600 }}>案件状态分布</span>}
            style={tableCardStyle}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: 'var(--warning-bg)', padding: 16, borderRadius: 8, border: '1px solid var(--warning-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: '#b45309' }}>待分配</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#b45309' }}>{caseStats.pending_assign || 0}</span>
                </div>
                <Progress 
                  percent={((caseStats.pending_assign || 0) / (caseStats.total || 1)) * 100} 
                  strokeColor="#b45309"
                  format={(percent) => `${(percent || 0).toFixed(1)}%`}
                  size="small"
                  trailColor="rgba(180, 83, 9, 0.12)"
                  strokeWidth={4}
                />
              </div>
              <div style={{ background: 'var(--primary-bg)', padding: 16, borderRadius: 8, border: '1px solid var(--primary-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--primary)' }}>处理中</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>{caseStats.processing || 0}</span>
                </div>
                <Progress 
                  percent={((caseStats.processing || 0) / (caseStats.total || 1)) * 100} 
                  strokeColor="var(--primary)"
                  format={(percent) => `${(percent || 0).toFixed(1)}%`}
                  size="small"
                  trailColor="rgba(59, 130, 246, 0.12)"
                  strokeWidth={4}
                />
              </div>
              <div style={{ background: 'var(--success-bg)', padding: 16, borderRadius: 8, border: '1px solid var(--success-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--success)' }}>已结案</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--success)' }}>{caseStats.closed || 0}</span>
                </div>
                <Progress 
                  percent={((caseStats.closed || 0) / (caseStats.total || 1)) * 100} 
                  strokeColor="var(--success)"
                  format={(percent) => `${(percent || 0).toFixed(1)}%`}
                  size="small"
                  trailColor="rgba(16, 185, 129, 0.12)"
                  strokeWidth={4}
                />
              </div>
              <div style={{ background: 'var(--error-bg)', padding: 16, borderRadius: 8, border: '1px solid var(--error-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--error)' }}>超期案件</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--error)' }}>{caseStats.overdue || 0}</span>
                </div>
                <Progress 
                  percent={((caseStats.overdue || 0) / (caseStats.total || 1)) * 100} 
                  strokeColor="var(--error)"
                  format={(percent) => `${(percent || 0).toFixed(1)}%`}
                  size="small"
                  trailColor="rgba(239, 68, 68, 0.12)"
                  strokeWidth={4}
                />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card 
            title={<span style={{ fontSize: 15, fontWeight: 600 }}>律师绩效统计</span>}
            style={tableCardStyle}
          >
            <Table 
              dataSource={lawyerStats} 
              columns={lawyerColumns} 
              pagination={false}
              rowKey="lawyer_name"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card 
            title={<span style={{ fontSize: 15, fontWeight: 600 }}>分案由盈利分析</span>}
            style={tableCardStyle}
          >
            <Table 
              dataSource={caseTypeProfit} 
              columns={caseTypeColumns} 
              pagination={false}
              rowKey="case_type_label"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card 
            title={<span style={{ fontSize: 15, fontWeight: 600 }}>风险预警统计</span>}
            style={tableCardStyle}
          >
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <WarningOutlined style={{ color: 'var(--error)' }} />
                  高风险案件
                </span>
                <Tag color="red" style={{ fontWeight: 600 }}>{riskStats.high_risk || 0}</Tag>
              </div>
              <Progress 
                percent={((riskStats.high_risk || 0) / (riskStats.total || 1)) * 100} 
                strokeColor="var(--error)"
                format={(percent) => `${(percent || 0).toFixed(1)}%`}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <WarningOutlined style={{ color: 'var(--warning)' }} />
                  中风险案件
                </span>
                <Tag color="orange" style={{ fontWeight: 600 }}>{riskStats.medium_risk || 0}</Tag>
              </div>
              <Progress 
                percent={((riskStats.medium_risk || 0) / (riskStats.total || 1)) * 100} 
                strokeColor="var(--warning)"
                format={(percent) => `${(percent || 0).toFixed(1)}%`}
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircleOutlined style={{ color: 'var(--success)' }} />
                  低风险案件
                </span>
                <Tag color="green" style={{ fontWeight: 600 }}>{riskStats.low_risk || 0}</Tag>
              </div>
              <Progress 
                percent={((riskStats.low_risk || 0) / (riskStats.total || 1)) * 100} 
                strokeColor="var(--success)"
                format={(percent) => `${(percent || 0).toFixed(1)}%`}
              />
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card 
            title={<span style={{ fontSize: 15, fontWeight: 600 }}>经营数据概览</span>}
            style={tableCardStyle}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: '#fff', padding: 20, borderRadius: 8, textAlign: 'center', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: 28, fontWeight: 'bold', color: '#1890ff' }}>
                  {riskStats.total || 0}
                </div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>总风险案件</div>
              </div>
              <div style={{ background: '#fff', padding: 20, borderRadius: 8, textAlign: 'center', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: 28, fontWeight: 'bold', color: 'var(--error)' }}>
                  {riskStats.high_risk || 0}
                </div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>高风险案件</div>
              </div>
              <div style={{ background: '#fff', padding: 20, borderRadius: 8, textAlign: 'center', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: 28, fontWeight: 'bold', color: 'var(--warning)' }}>
                  {riskStats.medium_risk || 0}
                </div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>中风险案件</div>
              </div>
              <div style={{ background: '#fff', padding: 20, borderRadius: 8, textAlign: 'center', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: 28, fontWeight: 'bold', color: 'var(--success)' }}>
                  {riskStats.low_risk || 0}
                </div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>低风险案件</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
