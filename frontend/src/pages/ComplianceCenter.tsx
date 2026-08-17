import { useState, useEffect } from 'react'
import { Card, Row, Col, Progress, Table, Button, Space, message, Tabs, Statistic, Divider } from 'antd'
import {
  AlertOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  FileTextOutlined,
  MessageOutlined,
  ContactsOutlined,
  CiOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import axios from '../api/axios'
import { formatDateTime, formatDate } from '../utils/format'
import { theme } from '../constants/theme'
// === Material Design 3 Style Tokens ===
const pageH2Style: React.CSSProperties = {
  fontFamily: "'Noto Serif SC', serif",
  fontSize: 22,
  fontWeight: 600,
  color: theme.textBase,
  margin: 0,
  letterSpacing: '0.01em',
}

const tableCardStyle: React.CSSProperties = {
  borderRadius: 16,
  overflow: 'hidden',
}

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

// === MD3 Status Pill (Soft Background Style) ===
type PillKind = 'neutral' | 'blue' | 'gold' | 'green' | 'red' | 'orange' | 'purple' | 'cyan' | 'geekblue'

const pillColorMap: Record<PillKind, { bg: string; color: string }> = {
  neutral: { bg: 'rgba(113, 119, 133, 0.12)', color: '#5f6672' },
  blue: { bg: 'rgba(0, 113, 227, 0.1)', color: theme.primary },
  gold: { bg: 'rgba(201, 169, 97, 0.15)', color: '#8c702e' },
  green: { bg: 'rgba(46, 125, 50, 0.1)', color: theme.success },
  red: { bg: 'rgba(186, 26, 26, 0.1)', color: theme.error },
  orange: { bg: 'rgba(237, 108, 2, 0.1)', color: theme.warning },
  purple: { bg: 'rgba(114, 46, 209, 0.1)', color: '#722ed1' },
  cyan: { bg: 'rgba(0, 166, 167, 0.1)', color: '#00a6a7' },
  geekblue: { bg: 'rgba(47, 84, 235, 0.1)', color: '#2f54eb' },
}

// kind 到 stitch-tag 变体 className 的映射（对齐 Stitch 设计规范）
const pillKindToClassName: Record<PillKind, string> = {
  neutral: 'stitch-tag',
  blue: 'stitch-tag stitch-tag-info',
  gold: 'stitch-tag stitch-tag-gold',
  green: 'stitch-tag stitch-tag-success',
  red: 'stitch-tag stitch-tag-error',
  orange: 'stitch-tag stitch-tag-warning',
  purple: 'stitch-tag stitch-tag-info',
  cyan: 'stitch-tag stitch-tag-info',
  geekblue: 'stitch-tag stitch-tag-info',
}

const StatusPill = ({ text, kind }: { text: string; kind: PillKind }) => {
  // 保留原 pillColorMap 颜色逻辑作为参考（已迁移至 stitch-tag className 变体）
  const c = pillColorMap[kind] || pillColorMap.neutral
  // 使用 stitch-tag 变体 className 渲染（对齐 Stitch 设计规范，颜色由 className 控制）
  const className = pillKindToClassName[kind] || 'stitch-tag'
  return (
    <span className={className} style={{ whiteSpace: 'nowrap' }} title={c.color}>
      {text}
    </span>
  )
}

// === Compliance Status Mappings (Preserved) ===
const salesCheckKindMap: Record<string, PillKind> = {
  pass: 'green',
  warning: 'orange',
  violation: 'red',
}

const salesCheckLabelMap: Record<string, string> = {
  pass: '通过',
  warning: '警告',
  violation: '违规',
}

const signingStatusKindMap: Record<string, PillKind> = {
  pending: 'neutral',
  reviewing: 'blue',
  signed: 'green',
  rejected: 'red',
}

const signingStatusLabelMap: Record<string, string> = {
  pending: '待签署',
  reviewing: '审核中',
  signed: '已签署',
  rejected: '已拒绝',
}

const sopStatusKindMap: Record<string, PillKind> = {
  pending: 'orange',
  completed: 'green',
  overdue: 'red',
}

const sopStatusLabelMap: Record<string, string> = {
  pending: '待完成',
  completed: '已完成',
  overdue: '已超时',
}

interface ComplianceCenterProps {
  hideTabs?: boolean
}

export default function ComplianceCenter({ hideTabs = false }: ComplianceCenterProps) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({ pending: 0, completed: 0, overdue: 0, violation: 0 })
  const [salesCompliance, setSalesCompliance] = useState<any[]>([])
  const [signingCompliance, setSigningCompliance] = useState<any[]>([])
  const [caseSOP, setCaseSOP] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchStats()
    if (activeTab === 'sales') fetchSalesCompliance()
    else if (activeTab === 'signing') fetchSigningCompliance()
    else if (activeTab === 'sop') fetchCaseSOP()
  }, [activeTab])

  const fetchStats = async () => {
    try {
      const [sopStats, salesRes] = await Promise.all([
        axios.get('/compliance/case-sop/stats', { params: { org_id: user.organization_id } }),
        axios.get('/compliance/sales-compliance', { params: { org_id: user.organization_id } }),
      ])
      const sop = sopStats as Record<string, unknown>
      const sales = (salesRes as Record<string, unknown>[]) || []
      setStats({
        pending: (sop.pending as number) || 0,
        completed: (sop.completed as number) || 0,
        overdue: (sop.overdue as number) || 0,
        violation: sales.filter((s: Record<string, unknown>) => s.check_result === 'violation').length || 0,
      })
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  const fetchSalesCompliance = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/compliance/sales-compliance', { params: { org_id: user.organization_id } })
      setSalesCompliance((res as Record<string, unknown>[]) || [])
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }

  const fetchSigningCompliance = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/compliance/signing-compliance', { params: { org_id: user.organization_id } })
      setSigningCompliance((res as Record<string, unknown>[]) || [])
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }

  const fetchCaseSOP = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/compliance/case-sop')
      setCaseSOP((res as Record<string, unknown>[]) || [])
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteSOP = async (record: Record<string, unknown>) => {
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

  const salesColumns = [
    { title: '线索ID', dataIndex: 'lead_id', key: 'lead_id', width: 120 },
    { title: '销售', dataIndex: 'sales_id', key: 'sales_id' },
    { title: '渠道', dataIndex: 'channel', key: 'channel', render: (c: string) => {
      const labels: Record<string, string> = { phone: '电话', wechat: '微信', qq: 'QQ', other: '其他' }
      return labels[c] || c
    }},
    { title: '检查结果', dataIndex: 'check_result', key: 'check_result', render: (result: string) => (
      <StatusPill text={salesCheckLabelMap[result] || result} kind={salesCheckKindMap[result] || 'neutral'} />
    )},
    { title: '风险告知', dataIndex: 'risk_disclosure_accepted', key: 'risk_disclosure_accepted', render: (accepted: boolean) => (
      <StatusPill text={accepted ? '已签署' : '未签署'} kind={accepted ? 'green' : 'red'} />
    )},
    { title: '风险告知时间', dataIndex: 'risk_disclosure_time', key: 'risk_disclosure_time', render: (val: string) => formatDateTime(val) },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (val: string) => formatDateTime(val) },
  ]

  const signingColumns = [
    { title: '案件ID', dataIndex: 'case_id', key: 'case_id', width: 120 },
    { title: '客户ID', dataIndex: 'client_id', key: 'client_id' },
    { title: '律师', dataIndex: 'lawyer_id', key: 'lawyer_id' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status: string) => (
      <StatusPill text={signingStatusLabelMap[status] || status} kind={signingStatusKindMap[status] || 'neutral'} />
    )},
    { title: '资质验证', dataIndex: 'lawyer_qualification_verified', key: 'lawyer_qualification_verified', render: (v: boolean) => (
      <StatusPill text={v ? '已验证' : '未验证'} kind={v ? 'green' : 'red'} />
    )},
    { title: '风险告知', dataIndex: 'risk_disclosure_signed', key: 'risk_disclosure_signed', render: (signed: boolean) => (
      <StatusPill text={signed ? '已签署' : '未签署'} kind={signed ? 'green' : 'red'} />
    )},
    { title: '合同合规', dataIndex: 'contract_compliance_passed', key: 'contract_compliance_passed', render: (passed: boolean) => (
      <StatusPill text={passed ? '通过' : '未通过'} kind={passed ? 'green' : 'red'} />
    )},
    { title: '签约时间', dataIndex: 'signed_time', key: 'signed_time', render: (val: string) => formatDateTime(val) },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (val: string) => formatDateTime(val) },
  ]

  const sopColumns = [
    { title: '案件ID', dataIndex: 'case_id', key: 'case_id', width: 120 },
    { title: '案由', dataIndex: 'case_type', key: 'case_type', render: (type: string) => {
      const labels: Record<string, string> = { marriage: '婚姻家事', traffic: '交通事故', labor: '劳动争议', debt: '债务逾期', other: '其他' }
      return labels[type] || type
    }},
    { title: '步骤名称', dataIndex: 'step_name', key: 'step_name' },
    { title: '步骤', dataIndex: 'step_order', key: 'step_order' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status: string) => (
      <StatusPill text={sopStatusLabelMap[status] || status} kind={sopStatusKindMap[status] || 'neutral'} />
    )},
    { title: '截止日期', dataIndex: 'deadline', key: 'deadline', render: (val: string) => formatDate(val) },
    { title: '完成时间', dataIndex: 'completed_time', key: 'completed_time', render: (val: string) => formatDateTime(val) },
    { title: '证据验证', dataIndex: 'evidence_verified', key: 'evidence_verified', render: (v: boolean) => (
      <StatusPill text={v ? '已验证' : '待验证'} kind={v ? 'green' : 'orange'} />
    )},
    { title: '操作', key: 'action', render: (_: unknown, record: Record<string, unknown>) => (
      <Space>
        {record.status === 'pending' && (
          <Button size="small" type="primary" onClick={() => handleCompleteSOP(record)}>完成</Button>
        )}
      </Space>
    )},
  ]

  // === MD3 Stat Cards (Bento Style with Icon Circle) ===
  const statCards = [
    {
      title: '待完成节点',
      value: stats.pending,
      icon: <AlertOutlined />,
      iconBg: 'rgba(237, 108, 2, 0.1)',
      iconColor: theme.warning,
    },
    {
      title: '已完成节点',
      value: stats.completed,
      icon: <CheckCircleOutlined />,
      iconBg: 'rgba(46, 125, 50, 0.1)',
      iconColor: theme.success,
    },
    {
      title: '已超时节点',
      value: stats.overdue,
      icon: <WarningOutlined />,
      iconBg: 'rgba(186, 26, 26, 0.1)',
      iconColor: theme.error,
    },
    {
      title: '违规记录',
      value: stats.violation,
      icon: <AlertOutlined />,
      iconBg: 'rgba(201, 169, 97, 0.15)',
      iconColor: '#8c702e',
    },
  ]

  const completionRate = Math.round((stats.completed / (stats.completed + stats.pending + stats.overdue)) * 100) || 0

  const riskDistribution = [
    { label: '待完成', value: stats.pending, color: theme.warning },
    { label: '已完成', value: stats.completed, color: theme.success },
    { label: '已超时', value: stats.overdue, color: theme.error },
    { label: '违规记录', value: stats.violation, color: theme.brandGold },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {!hideTabs && (
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h2 style={pageH2Style}>合规中心</h2>
        </div>
      )}

      <Card style={{ borderRadius: 16 }}>
        {!hideTabs && (
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
          items={[
            {
              key: 'overview',
              label: (
                <span>
                  <CiOutlined style={{ marginRight: 6 }} />
                  概览
                </span>
              ),
              children: (
                <>
                  <Row gutter={[16, 16]}>
                    {statCards.map((card, index) => (
                      <Col xs={24} sm={12} lg={6} key={index}>
                        <Card style={{ height: '100%', borderRadius: 12 }} styles={{ body: { padding: 20 } }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 12, letterSpacing: '0.02em', fontWeight: 500 }}>
                                {card.title}
                              </div>
                              <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 30, fontWeight: 700, color: theme.textBase, lineHeight: 1.2, letterSpacing: '0.01em' }}>
                                {card.value}
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

                  <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                    <Col xs={24} lg={12}>
                      <Card
                        title={<span style={cardTitleStyle}>合规完成率</span>}
                        headStyle={cardHeadStyle}
                        style={{ height: '100%', borderRadius: 12 }}
                      >
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontSize: 13, color: theme.textSecondary }}>办案SOP完成率</span>
                            <span style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 700, color: theme.primaryDark, fontSize: 15 }}>{completionRate}%</span>
                          </div>
                          <Progress
                            percent={completionRate}
                            strokeColor={{ from: theme.primary, to: theme.brandGold }}
                            size="small"
                            strokeWidth={6}
                          />
                        </div>
                      </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                      <Card
                        title={<span style={cardTitleStyle}>合规风险分布</span>}
                        headStyle={cardHeadStyle}
                        style={{ height: '100%', borderRadius: 12 }}
                      >
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          {riskDistribution.map(item => (
                            <div
                              key={item.label}
                              style={{
                                background: '#f9f9fb',
                                padding: 16,
                                borderRadius: 10,
                                border: '1px solid #e2e2e4',
                                textAlign: 'center',
                              }}
                            >
                              <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 26, fontWeight: 700, color: item.color, lineHeight: 1.2 }}>
                                {item.value}
                              </div>
                              <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>{item.label}</div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </Col>
                  </Row>
                </>
              ),
            },
            {
              key: 'marketing',
              label: (
                <span>
                  <FileTextOutlined style={{ marginRight: 6 }} />
                  营销内容合规
                </span>
              ),
              children: (
                <Card className="stitch-table" style={tableCardStyle} styles={{ body: { padding: 0 } }}>
                  <div style={{ padding: 24, textAlign: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: theme.textBase, marginBottom: 8 }}>
                      营销内容合规审核
                    </div>
                    <p style={{ fontSize: 13, color: theme.textSecondary, margin: '0 0 16px' }}>
                      审核列表与流程已统一至 9.10 内容预审（含 AI 预审结果与人工复核）
                    </p>
                    <Button type="primary" onClick={() => navigate('/marketing/content-preview')}>
                      前往内容预审 <ArrowRightOutlined />
                    </Button>
                  </div>
                </Card>
              ),
            },
            {
              key: 'sales',
              label: (
                <span>
                  <MessageOutlined style={{ marginRight: 6 }} />
                  销售合规
                </span>
              ),
              children: (
                <Card className="stitch-table" style={tableCardStyle}>
                  <Row gutter={[24, 24]} style={{ marginBottom: 16 }}>
                    <Col xs={12} md={6}>
                      <Statistic
                        title="待审查"
                        value={salesCompliance.filter(s => s.check_result === 'warning' || s.review_status === 'pending').length}
                        valueStyle={{ color: '#fa8c16' }}
                        prefix={<WarningOutlined />}
                      />
                    </Col>
                    <Col xs={12} md={6}>
                      <Statistic
                        title="违规数"
                        value={salesCompliance.filter(s => s.check_result === 'violation').length}
                        valueStyle={{ color: '#f5222d' }}
                        prefix={<AlertOutlined />}
                      />
                    </Col>
                    <Col xs={12} md={6}>
                      <Statistic
                        title="通过数"
                        value={salesCompliance.filter(s => s.check_result === 'pass').length}
                        valueStyle={{ color: '#52c41a' }}
                        prefix={<CheckCircleOutlined />}
                      />
                    </Col>
                    <Col xs={12} md={6}>
                      <Statistic
                        title="审查完成率"
                        value={salesCompliance.length ? Math.round(salesCompliance.filter(s => s.review_status === 'approved' || s.review_status === 'rejected').length / salesCompliance.length * 100) : 0}
                        suffix="%"
                        valueStyle={{ color: '#1677ff' }}
                      />
                    </Col>
                  </Row>
                  <Divider style={{ margin: '0 0 16px' }} plain>最近 5 条记录</Divider>
                  <Table
                    dataSource={salesCompliance.slice(0, 5)}
                    columns={salesColumns}
                    loading={loading}
                    rowKey="id"
                    size="small"
                    pagination={false}
                    showHeader
                    scroll={{ x: 1200 }}
                  />
                  <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <Button type="primary" onClick={() => navigate('/compliance/sales-review')}>
                      前往销售合规审查 <ArrowRightOutlined />
                    </Button>
                  </div>
                </Card>
              ),
            },
            {
              key: 'signing',
              label: (
                <span>
                  <ContactsOutlined style={{ marginRight: 6 }} />
                  签约合规
                </span>
              ),
              children: (
                <Card className="stitch-table" style={tableCardStyle} styles={{ body: { padding: 0 } }}>
                  <Table
                    dataSource={signingCompliance}
                    columns={signingColumns}
                    loading={loading}
                    rowKey="id"
                    size="small"
                    scroll={{ x: 1600 }}
                  />
                </Card>
              ),
            },
            {
              key: 'sop',
              label: (
                <span>
                  <CiOutlined style={{ marginRight: 6 }} />
                  办案SOP
                </span>
              ),
              children: (
                <Card className="stitch-table" style={tableCardStyle} styles={{ body: { padding: 0 } }}>
                  <Table
                    dataSource={caseSOP}
                    columns={sopColumns}
                    loading={loading}
                    rowKey="id"
                    size="small"
                    scroll={{ x: 1600 }}
                  />
                </Card>
              ),
            },
          ]}
        />
        )}
      </Card>
    </div>
  )
}
