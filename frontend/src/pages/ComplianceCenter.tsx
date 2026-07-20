import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Progress, Table, Tag, Button, Space, message } from 'antd'
import {
  AlertOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  FileTextOutlined,
  MessageOutlined,
  ContactsOutlined,
  CiOutlined,
} from '@ant-design/icons'
import axios from '../api/axios'

export default function ComplianceCenter() {
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({ pending: 0, completed: 0, overdue: 0, violation: 0 })
  const [marketingContents, setMarketingContents] = useState<any[]>([])
  const [salesCompliance, setSalesCompliance] = useState<any[]>([])
  const [signingCompliance, setSigningCompliance] = useState<any[]>([])
  const [caseSOP, setCaseSOP] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchStats()
    if (activeTab === 'marketing') fetchMarketingContents()
    else if (activeTab === 'sales') fetchSalesCompliance()
    else if (activeTab === 'signing') fetchSigningCompliance()
    else if (activeTab === 'sop') fetchCaseSOP()
  }, [activeTab])

  const fetchStats = async () => {
    try {
      const [sopStats, , salesRes] = await Promise.all([
        axios.get('/compliance/case-sop/stats', { params: { org_id: user.organization_id } }),
        axios.get('/compliance/marketing-content', { params: { org_id: user.organization_id } }),
        axios.get('/compliance/sales-compliance', { params: { org_id: user.organization_id } }),
      ])
      setStats({
        pending: sopStats.pending || 0,
        completed: sopStats.completed || 0,
        overdue: sopStats.overdue || 0,
        violation: salesRes.filter((s: any) => s.check_result === 'violation').length || 0,
      })
    } catch (error) {
      console.error('Fetch stats error:', error)
    }
  }

  const fetchMarketingContents = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/compliance/marketing-content', { params: { org_id: user.organization_id } })
      setMarketingContents(res || [])
    } catch (error) {
      console.error('Fetch marketing contents error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSalesCompliance = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/compliance/sales-compliance', { params: { org_id: user.organization_id } })
      setSalesCompliance(res || [])
    } catch (error) {
      console.error('Fetch sales compliance error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSigningCompliance = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/compliance/signing-compliance', { params: { org_id: user.organization_id } })
      setSigningCompliance(res || [])
    } catch (error) {
      console.error('Fetch signing compliance error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCaseSOP = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/compliance/case-sop', { params: { case_id: '' } })
      setCaseSOP(res || [])
    } catch (error) {
      console.error('Fetch case SOP error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (record: any, status: string) => {
    try {
      await axios.put(`/compliance/marketing-content/${record.id}/review`, {
        reviewer_id: user.id,
        status,
      })
      message.success('审核成功')
      fetchMarketingContents()
    } catch (error) {
      message.error('审核失败')
    }
  }

  const handleCompleteSOP = async (record: any) => {
    try {
      await axios.put(`/compliance/case-sop/${record.id}/complete`, {
        operator_id: user.id,
      })
      message.success('完成成功')
      fetchCaseSOP()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const marketingColumns = [
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: '平台', dataIndex: 'platform', key: 'platform', render: (p: string) => {
      const labels: Record<string, string> = { douyin: '抖音', baidu: '百度', kuaishou: '快手', wechat: '微信', other: '其他' }
      return labels[p] || p
    }},
    { title: '状态', dataIndex: 'status', key: 'status', render: (status: string) => {
      const colors: Record<string, string> = {
        draft: 'default',
        pending_review: 'orange',
        approved: 'green',
        rejected: 'red',
      }
      const labels: Record<string, string> = {
        draft: '草稿',
        pending_review: '待审核',
        approved: '已通过',
        rejected: '已拒绝',
      }
      return <Tag color={colors[status]}>{labels[status]}</Tag>
    }},
    { title: '合规问题', dataIndex: 'compliance_issues', key: 'compliance_issues', render: (issues: string) => issues ? <Tag color="red">有问题</Tag> : <Tag color="green">通过</Tag> },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at' },
    { title: '操作', key: 'action', render: (_: any, record: any) => (
      <Space>
        {record.status === 'pending_review' && (
          <>
            <Button size="small" type="primary" onClick={() => handleReview(record, 'approved')}>通过</Button>
            <Button size="small" danger onClick={() => handleReview(record, 'rejected')}>拒绝</Button>
          </>
        )}
      </Space>
    )},
  ]

  const salesColumns = [
    { title: '线索ID', dataIndex: 'lead_id', key: 'lead_id', width: 120 },
    { title: '销售', dataIndex: 'sales_id', key: 'sales_id' },
    { title: '渠道', dataIndex: 'channel', key: 'channel', render: (c: string) => {
      const labels: Record<string, string> = { phone: '电话', wechat: '微信', qq: 'QQ', other: '其他' }
      return labels[c] || c
    }},
    { title: '检查结果', dataIndex: 'check_result', key: 'check_result', render: (result: string) => {
      const colors: Record<string, string> = { pass: 'green', warning: 'orange', violation: 'red' }
      const labels: Record<string, string> = { pass: '通过', warning: '警告', violation: '违规' }
      return <Tag color={colors[result]}>{labels[result]}</Tag>
    }},
    { title: '风险告知', dataIndex: 'risk_disclosure_accepted', key: 'risk_disclosure_accepted', render: (accepted: boolean) => accepted ? <Tag color="green">已签署</Tag> : <Tag color="red">未签署</Tag> },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at' },
  ]

  const signingColumns = [
    { title: '案件ID', dataIndex: 'case_id', key: 'case_id', width: 120 },
    { title: '客户ID', dataIndex: 'client_id', key: 'client_id' },
    { title: '律师', dataIndex: 'lawyer_id', key: 'lawyer_id' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status: string) => {
      const colors: Record<string, string> = { pending: 'default', reviewing: 'blue', signed: 'green', rejected: 'red' }
      const labels: Record<string, string> = { pending: '待签署', reviewing: '审核中', signed: '已签署', rejected: '已拒绝' }
      return <Tag color={colors[status]}>{labels[status]}</Tag>
    }},
    { title: '资质验证', dataIndex: 'lawyer_qualification_verified', key: 'lawyer_qualification_verified', render: (v: boolean) => v ? <Tag color="green">已验证</Tag> : <Tag color="red">未验证</Tag> },
    { title: '风险告知', dataIndex: 'risk_disclosure_signed', key: 'risk_disclosure_signed', render: (signed: boolean) => signed ? <Tag color="green">已签署</Tag> : <Tag color="red">未签署</Tag> },
    { title: '合同合规', dataIndex: 'contract_compliance_passed', key: 'contract_compliance_passed', render: (passed: boolean) => passed ? <Tag color="green">通过</Tag> : <Tag color="red">未通过</Tag> },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at' },
  ]

  const sopColumns = [
    { title: '案件ID', dataIndex: 'case_id', key: 'case_id', width: 120 },
    { title: '案由', dataIndex: 'case_type', key: 'case_type', render: (type: string) => {
      const labels: Record<string, string> = { marriage: '婚姻家事', traffic: '交通事故', labor: '劳动争议', debt: '债务逾期', other: '其他' }
      return labels[type] || type
    }},
    { title: '步骤名称', dataIndex: 'step_name', key: 'step_name' },
    { title: '步骤', dataIndex: 'step_order', key: 'step_order' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status: string) => {
      const colors: Record<string, string> = { pending: 'orange', completed: 'green', overdue: 'red' }
      const labels: Record<string, string> = { pending: '待完成', completed: '已完成', overdue: '已超时' }
      return <Tag color={colors[status]}>{labels[status]}</Tag>
    }},
    { title: '截止日期', dataIndex: 'deadline', key: 'deadline' },
    { title: '证据验证', dataIndex: 'evidence_verified', key: 'evidence_verified', render: (v: boolean) => v ? <Tag color="green">已验证</Tag> : <Tag color="orange">待验证</Tag> },
    { title: '操作', key: 'action', render: (_: any, record: any) => (
      <Space>
        {record.status === 'pending' && (
          <Button size="small" type="primary" onClick={() => handleCompleteSOP(record)}>完成</Button>
        )}
      </Space>
    )},
  ]

  return (
    <div>
      {activeTab === 'overview' && (
        <>
          <div className="page-header">
            <h2>合规风控中心</h2>
          </div>

          <Row gutter={16}>
            <Col span={6}>
              <Card>
                <Statistic title="待完成节点" value={stats.pending} prefix={<AlertOutlined />} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="已完成节点" value={stats.completed} prefix={<CheckCircleOutlined />} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="已超时节点" value={stats.overdue} prefix={<WarningOutlined />} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="违规记录" value={stats.violation} prefix={<AlertOutlined />} />
              </Card>
            </Col>
          </Row>

          <Row gutter={16} style={{ marginTop: 24 }}>
            <Col span={12}>
              <Card title="合规完成率">
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span>办案SOP完成率</span>
                    <span>{Math.round((stats.completed / (stats.completed + stats.pending + stats.overdue)) * 100) || 0}%</span>
                  </div>
                  <Progress percent={Math.round((stats.completed / (stats.completed + stats.pending + stats.overdue)) * 100) || 0} />
                </div>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="合规风险分布">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#fa8c16' }}>{stats.pending}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>待完成</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>{stats.completed}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>已完成</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f5222d' }}>{stats.overdue}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>已超时</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>{stats.violation}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>违规记录</div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </>
      )}

          {activeTab !== 'overview' && (
            <>
              <div className="page-header">
                <h2>合规风控中心</h2>
              </div>

              <Table
                dataSource={activeTab === 'marketing' ? marketingContents : activeTab === 'sales' ? salesCompliance : activeTab === 'signing' ? signingCompliance : caseSOP}
                columns={activeTab === 'marketing' ? marketingColumns : activeTab === 'sales' ? salesColumns : activeTab === 'signing' ? signingColumns : sopColumns}
                loading={loading}
                rowKey="id"
              />
            </>
          )}

      <div className="compliance-bottom-bar">
        <Space wrap>
          <Button onClick={() => setActiveTab('overview')} type={activeTab === 'overview' ? 'primary' : 'default'} icon={<CiOutlined />}>概览</Button>
          <Button onClick={() => setActiveTab('marketing')} type={activeTab === 'marketing' ? 'primary' : 'default'} icon={<FileTextOutlined />}>营销合规</Button>
          <Button onClick={() => setActiveTab('sales')} type={activeTab === 'sales' ? 'primary' : 'default'} icon={<MessageOutlined />}>销售合规</Button>
          <Button onClick={() => setActiveTab('signing')} type={activeTab === 'signing' ? 'primary' : 'default'} icon={<ContactsOutlined />}>签约合规</Button>
          <Button onClick={() => setActiveTab('sop')} type={activeTab === 'sop' ? 'primary' : 'default'} icon={<CiOutlined />}>办案SOP</Button>
        </Space>
      </div>
    </div>
  )
}