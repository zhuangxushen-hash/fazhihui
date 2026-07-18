import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Progress, Table, Tag } from 'antd'
import {
  FileSearchOutlined,
  FileTextOutlined,
  SecurityScanOutlined,
  DollarOutlined,
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
        { stage: '总线索', value: res.total_leads, rate: '-' },
        { stage: '邀约中', value: res.invited, rate: `${res.rates.invite_rate.toFixed(1)}%` },
        { stage: '谈判中', value: res.negotiated, rate: `${res.rates.negotiate_rate.toFixed(1)}%` },
        { stage: '待签约', value: res.signed, rate: `${res.rates.sign_rate.toFixed(1)}%` },
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
    { title: '阶段', dataIndex: 'stage', key: 'stage' },
    { title: '数量', dataIndex: 'value', key: 'value' },
    { title: '转化率', dataIndex: 'rate', key: 'rate' },
  ]

  const lawyerColumns = [
    { title: '律师姓名', dataIndex: 'lawyer_name', key: 'lawyer_name' },
    { title: '案件数', dataIndex: 'cases_count', key: 'cases_count' },
    { title: '结案数', dataIndex: 'closed_cases', key: 'closed_cases' },
    { title: '结案率', dataIndex: 'revenue_rate', key: 'revenue_rate', render: (rate: number) => `${rate.toFixed(1)}%` },
    { title: '创收', dataIndex: 'total_revenue', key: 'total_revenue', render: (rev: number) => `¥${rev.toFixed(2)}` },
  ]

  const caseTypeColumns = [
    { title: '案由', dataIndex: 'case_type_label', key: 'case_type_label' },
    { title: '案件数', dataIndex: 'case_count', key: 'case_count' },
    { title: '总收入', dataIndex: 'total_revenue', key: 'total_revenue', render: (rev: number) => `¥${rev.toFixed(2)}` },
    { title: '平均收入', dataIndex: 'avg_revenue', key: 'avg_revenue', render: (rev: number) => `¥${rev.toFixed(2)}` },
    { title: '利润率', dataIndex: 'profit_margin', key: 'profit_margin', render: (rate: number) => `${rate.toFixed(1)}%` },
  ]

  return (
    <div>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic title="总线索数" value={stats.totalLeads} prefix={<FileSearchOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="总案件数" value={stats.totalCases} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="合规率" value={stats.complianceRate.toFixed(1)} suffix="%" prefix={<SecurityScanOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="总收入" value={stats.totalRevenue.toFixed(2)} prefix={<DollarOutlined />} suffix="元" />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={12}>
          <Card title="线索转化漏斗">
            <Table dataSource={conversionData} columns={columns} pagination={false} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="案件状态分布">
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>待分配</span>
                <Tag color="orange">{caseStats.pending_assign || 0}</Tag>
              </div>
              <Progress percent={((caseStats.pending_assign || 0) / (caseStats.total || 1)) * 100} strokeColor="#fa8c16" format={(percent) => `${(percent || 0).toFixed(2)}%`} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>处理中</span>
                <Tag color="blue">{caseStats.processing || 0}</Tag>
              </div>
              <Progress percent={((caseStats.processing || 0) / (caseStats.total || 1)) * 100} strokeColor="#1890ff" format={(percent) => `${(percent || 0).toFixed(2)}%`} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>已结案</span>
                <Tag color="green">{caseStats.closed || 0}</Tag>
              </div>
              <Progress percent={((caseStats.closed || 0) / (caseStats.total || 1)) * 100} strokeColor="#52c41a" format={(percent) => `${(percent || 0).toFixed(2)}%`} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>超期案件</span>
                <Tag color="red">{caseStats.overdue || 0}</Tag>
              </div>
              <Progress percent={((caseStats.overdue || 0) / (caseStats.total || 1)) * 100} strokeColor="#f5222d" format={(percent) => `${(percent || 0).toFixed(2)}%`} />
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={12}>
          <Card title="律师绩效统计">
            <Table dataSource={lawyerStats} columns={lawyerColumns} pagination={false} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="分案由盈利分析">
            <Table dataSource={caseTypeProfit} columns={caseTypeColumns} pagination={false} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={12}>
          <Card title="风险预警统计">
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>高风险案件</span>
                <Tag color="red">{riskStats.high_risk || 0}</Tag>
              </div>
              <Progress percent={((riskStats.high_risk || 0) / (riskStats.total || 1)) * 100} strokeColor="#f5222d" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>中风险案件</span>
                <Tag color="orange">{riskStats.medium_risk || 0}</Tag>
              </div>
              <Progress percent={((riskStats.medium_risk || 0) / (riskStats.total || 1)) * 100} strokeColor="#fa8c16" />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>低风险案件</span>
                <Tag color="green">{riskStats.low_risk || 0}</Tag>
              </div>
              <Progress percent={((riskStats.low_risk || 0) / (riskStats.total || 1)) * 100} strokeColor="#52c41a" />
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="经营数据概览">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                  {riskStats.total || 0}
                </div>
                <div style={{ fontSize: 12, color: '#999' }}>总风险案件</div>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f5222d' }}>
                  {riskStats.high_risk || 0}
                </div>
                <div style={{ fontSize: 12, color: '#999' }}>高风险案件</div>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#fa8c16' }}>
                  {riskStats.medium_risk || 0}
                </div>
                <div style={{ fontSize: 12, color: '#999' }}>中风险案件</div>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                  {riskStats.low_risk || 0}
                </div>
                <div style={{ fontSize: 12, color: '#999' }}>低风险案件</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
