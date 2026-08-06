import { useState, useEffect } from 'react'
import { Card, Row, Col, Table, Button, Space, message, Tabs, Modal, Form, Input, Select, Radio, Progress } from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  EditOutlined,
  FileTextOutlined,
  DashboardOutlined,
} from '@ant-design/icons'
import axios from '../api/axios'
import { formatDateTime } from '../utils/format'
import { theme } from '../constants/theme'
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

type PillKind = 'neutral' | 'blue' | 'gold' | 'green' | 'red' | 'orange'

const pillColorMap: Record<PillKind, { bg: string; color: string }> = {
  neutral: { bg: 'rgba(113, 119, 133, 0.12)', color: '#5f6672' },
  blue: { bg: 'rgba(0, 113, 227, 0.1)', color: theme.primary },
  gold: { bg: 'rgba(201, 169, 97, 0.15)', color: '#8c702e' },
  green: { bg: 'rgba(46, 125, 50, 0.1)', color: theme.success },
  red: { bg: 'rgba(186, 26, 26, 0.1)', color: theme.error },
  orange: { bg: 'rgba(237, 108, 2, 0.1)', color: theme.warning },
}

const StatusPill = ({ text, kind }: { text: string; kind: PillKind }) => {
  const c = pillColorMap[kind] || pillColorMap.neutral
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 999,
        background: c.bg,
        color: c.color,
        fontSize: 12,
        fontWeight: 500,
        lineHeight: '20px',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </span>
  )
}

const channelLabelMap: Record<string, string> = {
  phone: '电话',
  wechat: '微信',
  qq: 'QQ',
  other: '其他',
}

const checkResultLabelMap: Record<string, string> = {
  pass: '通过',
  warning: '警告',
  violation: '违规',
}

const checkResultKindMap: Record<string, PillKind> = {
  pass: 'green',
  warning: 'orange',
  violation: 'red',
}

const reviewStatusLabelMap: Record<string, string> = {
  pending: '待审查',
  approved: '已通过',
  rejected: '已驳回',
}

const reviewStatusKindMap: Record<string, PillKind> = {
  pending: 'orange',
  approved: 'green',
  rejected: 'red',
}

const riskLevelLabelMap: Record<string, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
}

const riskLevelKindMap: Record<string, PillKind> = {
  low: 'green',
  medium: 'orange',
  high: 'red',
}

export default function SalesComplianceReview() {
  const [activeTab, setActiveTab] = useState('pending')
  const [pendingList, setPendingList] = useState<any[]>([])
  const [reviewedList, setReviewedList] = useState<any[]>([])
  const [stats, setStats] = useState<any>({ total: 0, pending: 0, approved: 0, rejected: 0, pass: 0, warning: 0, violation: 0, risk_distribution: { low: 0, medium: 0, high: 0 } })
  const [loading, setLoading] = useState(false)

  const [reviewModalVisible, setReviewModalVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState<any>(null)
  const [reviewForm] = Form.useForm()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'pending') {
        const res = await axios.get('/compliance/sales-reviews', {
          params: { org_id: user.organization_id, status: 'pending' },
        }) as Record<string, unknown>[]
        setPendingList(res || [])
      } else if (activeTab === 'reviewed') {
        const res = await axios.get('/compliance/sales-reviews', {
          params: { org_id: user.organization_id, status: 'approved' },
        }) as Record<string, unknown>[]
        setReviewedList(res || [])
      } else if (activeTab === 'stats') {
        const res = await axios.get('/compliance/sales-reviews/stats', {
          params: { org_id: user.organization_id },
        })
        setStats(res || { total: 0, pending: 0, approved: 0, rejected: 0, pass: 0, warning: 0, violation: 0, risk_distribution: { low: 0, medium: 0, high: 0 } })
      }
    } catch (error) {
      message.error('获取审查数据失败')
    } finally {
      setLoading(false)
    }
  }

  const openReviewModal = (record: any) => {
    setCurrentRecord(record)
    setReviewModalVisible(true)
    reviewForm.resetFields()
    reviewForm.setFieldsValue({
      result: record.review_status === 'approved' ? 'approved' : 'approved',
      risk_level: record.risk_level || 'low',
    })
  }

  const handleReviewSubmit = async () => {
    try {
      const values = await reviewForm.validateFields()
      await axios.put(`/compliance/sales-reviews/${currentRecord.id}/review`, {
        reviewer_id: user.id,
        result: values.result,
        note: values.note,
        risk_level: values.risk_level,
      })
      message.success('审查完成')
      setReviewModalVisible(false)
      reviewForm.resetFields()
      fetchData()
    } catch (error) {
      message.error('审查失败')
    }
  }

  const columns = [
    {
      title: '客户姓名',
      dataIndex: 'lead_id',
      key: 'lead_id',
      width: 140,
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: '销售',
      dataIndex: 'sales_id',
      key: 'sales_id',
      width: 120,
    },
    {
      title: '渠道',
      dataIndex: 'channel',
      key: 'channel',
      width: 100,
      render: (text: string) => (
        <StatusPill text={channelLabelMap[text] || text} kind="blue" />
      ),
    },
    {
      title: '内容摘要',
      dataIndex: 'content',
      key: 'content',
      width: 200,
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: 'AI检测结果',
      dataIndex: 'check_result',
      key: 'check_result',
      width: 110,
      render: (text: string) => (
        <StatusPill text={checkResultLabelMap[text] || text} kind={checkResultKindMap[text] || 'neutral'} />
      ),
    },
    {
      title: '违规详情',
      dataIndex: 'violation_details',
      key: 'violation_details',
      width: 160,
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '风险等级',
      dataIndex: 'risk_level',
      key: 'risk_level',
      width: 100,
      render: (text: string) => text ? (
        <StatusPill text={riskLevelLabelMap[text] || text} kind={riskLevelKindMap[text] || 'neutral'} />
      ) : (
        <StatusPill text="未评估" kind="neutral" />
      ),
    },
    {
      title: '审查状态',
      dataIndex: 'review_status',
      key: 'review_status',
      width: 100,
      render: (text: string) => (
        <StatusPill text={reviewStatusLabelMap[text] || text} kind={reviewStatusKindMap[text] || 'neutral'} />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (val: string) => formatDateTime(val),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: any) => (
        <Space>
          {record.review_status === 'pending' && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openReviewModal(record)}
            >
              审查
            </Button>
          )}
          {record.review_status !== 'pending' && (
            <Button
              type="link"
              size="small"
              onClick={() => openReviewModal(record)}
            >
              查看
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const statCards = [
    {
      title: '总记录数',
      value: stats.total,
      icon: <FileTextOutlined />,
      iconBg: 'rgba(0, 113, 227, 0.1)',
      iconColor: theme.primary,
    },
    {
      title: '待审查',
      value: stats.pending,
      icon: <WarningOutlined />,
      iconBg: 'rgba(237, 108, 2, 0.1)',
      iconColor: theme.warning,
    },
    {
      title: '已通过',
      value: stats.approved,
      icon: <CheckCircleOutlined />,
      iconBg: 'rgba(46, 125, 50, 0.1)',
      iconColor: theme.success,
    },
    {
      title: '已驳回',
      value: stats.rejected,
      icon: <CloseCircleOutlined />,
      iconBg: 'rgba(186, 26, 26, 0.1)',
      iconColor: theme.error,
    },
  ]

  const passRate = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={pageH2Style}>销售合规审查</h2>
        </div>
      </div>

      <Card style={{ borderRadius: 16 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'pending',
              label: (
                <span>
                  <WarningOutlined style={{ marginRight: 6 }} />
                  待审查
                  {stats.pending > 0 && (
                    <span
                      style={{
                        marginLeft: 6,
                        display: 'inline-block',
                        minWidth: 20,
                        height: 20,
                        padding: '0 6px',
                        lineHeight: '20px',
                        textAlign: 'center',
                        background: theme.error,
                        color: '#fff',
                        borderRadius: 10,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {stats.pending}
                    </span>
                  )}
                </span>
              ),
              children: (
                <Card className="stitch-table" style={tableCardStyle} styles={{ body: { padding: 0 } }}>
                  <Table
                    dataSource={pendingList}
                    columns={columns}
                    loading={loading}
                    rowKey="id"
                    size="small"
                    scroll={{ x: 1600 }}
                    pagination={{ pageSize: 10 }}
                  />
                </Card>
              ),
            },
            {
              key: 'reviewed',
              label: (
                <span>
                  <CheckCircleOutlined style={{ marginRight: 6 }} />
                  已审查
                </span>
              ),
              children: (
                <Card className="stitch-table" style={tableCardStyle} styles={{ body: { padding: 0 } }}>
                  <Table
                    dataSource={reviewedList}
                    columns={columns}
                    loading={loading}
                    rowKey="id"
                    size="small"
                    scroll={{ x: 800 }}
                    pagination={{ pageSize: 10 }}
                  />
                </Card>
              ),
            },
            {
              key: 'stats',
              label: (
                <span>
                  <DashboardOutlined style={{ marginRight: 6 }} />
                  审查统计
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
                        title={<span style={cardTitleStyle}>审查通过率</span>}
                        headStyle={cardHeadStyle}
                        style={{ height: '100%', borderRadius: 12 }}
                      >
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontSize: 13, color: theme.textSecondary }}>整体通过率</span>
                            <span style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 700, color: theme.primaryDark, fontSize: 15 }}>{passRate}%</span>
                          </div>
                          <Progress
                            percent={passRate}
                            strokeColor={{ from: theme.primary, to: theme.brandGold }}
                            size="small"
                            strokeWidth={6}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
                          <div style={{ textAlign: 'center', flex: 1 }}>
                            <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 24, fontWeight: 700, color: theme.success }}>
                              {stats.approved}
                            </div>
                            <div style={{ fontSize: 12, color: theme.textTertiary }}>已通过</div>
                          </div>
                          <div style={{ textAlign: 'center', flex: 1 }}>
                            <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 24, fontWeight: 700, color: theme.error }}>
                              {stats.rejected}
                            </div>
                            <div style={{ fontSize: 12, color: theme.textTertiary }}>已驳回</div>
                          </div>
                          <div style={{ textAlign: 'center', flex: 1 }}>
                            <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 24, fontWeight: 700, color: theme.warning }}>
                              {stats.pending}
                            </div>
                            <div style={{ fontSize: 12, color: theme.textTertiary }}>待审查</div>
                          </div>
                        </div>
                      </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                      <Card
                        title={<span style={cardTitleStyle}>风险分布</span>}
                        headStyle={cardHeadStyle}
                        style={{ height: '100%', borderRadius: 12 }}
                      >
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div
                            style={{
                              background: theme.bgLayout,
                              padding: 16,
                              borderRadius: 10,
                              border: `1px solid ${theme.borderSecondary}`,
                              textAlign: 'center',
                            }}
                          >
                            <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 26, fontWeight: 700, color: theme.success, lineHeight: 1.2 }}>
                              {stats.risk_distribution?.low || 0}
                            </div>
                            <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>低风险</div>
                          </div>
                          <div
                            style={{
                              background: theme.bgLayout,
                              padding: 16,
                              borderRadius: 10,
                              border: `1px solid ${theme.borderSecondary}`,
                              textAlign: 'center',
                            }}
                          >
                            <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 26, fontWeight: 700, color: theme.warning, lineHeight: 1.2 }}>
                              {stats.risk_distribution?.medium || 0}
                            </div>
                            <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>中风险</div>
                          </div>
                          <div
                            style={{
                              background: theme.bgLayout,
                              padding: 16,
                              borderRadius: 10,
                              border: `1px solid ${theme.borderSecondary}`,
                              textAlign: 'center',
                            }}
                          >
                            <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 26, fontWeight: 700, color: theme.error, lineHeight: 1.2 }}>
                              {stats.risk_distribution?.high || 0}
                            </div>
                            <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>高风险</div>
                          </div>
                          <div
                            style={{
                              background: theme.bgLayout,
                              padding: 16,
                              borderRadius: 10,
                              border: `1px solid ${theme.borderSecondary}`,
                              textAlign: 'center',
                            }}
                          >
                            <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 26, fontWeight: 700, color: theme.primary, lineHeight: 1.2 }}>
                              {stats.total}
                            </div>
                            <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>总计</div>
                          </div>
                        </div>
                      </Card>
                    </Col>
                  </Row>

                  <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                    <Col xs={24}>
                      <Card
                        title={<span style={cardTitleStyle}>AI检测结果分布</span>}
                        headStyle={cardHeadStyle}
                        style={{ borderRadius: 12 }}
                      >
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                          <div
                            style={{
                              background: theme.bgLayout,
                              padding: 20,
                              borderRadius: 12,
                              border: `1px solid ${theme.borderSecondary}`,
                              textAlign: 'center',
                            }}
                          >
                            <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 30, fontWeight: 700, color: theme.success, lineHeight: 1.2 }}>
                              {stats.pass}
                            </div>
                            <div style={{ fontSize: 13, color: theme.textSecondary, marginTop: 4 }}>通过</div>
                          </div>
                          <div
                            style={{
                              background: theme.bgLayout,
                              padding: 20,
                              borderRadius: 12,
                              border: `1px solid ${theme.borderSecondary}`,
                              textAlign: 'center',
                            }}
                          >
                            <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 30, fontWeight: 700, color: theme.warning, lineHeight: 1.2 }}>
                              {stats.warning}
                            </div>
                            <div style={{ fontSize: 13, color: theme.textSecondary, marginTop: 4 }}>警告</div>
                          </div>
                          <div
                            style={{
                              background: theme.bgLayout,
                              padding: 20,
                              borderRadius: 12,
                              border: `1px solid ${theme.borderSecondary}`,
                              textAlign: 'center',
                            }}
                          >
                            <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 30, fontWeight: 700, color: theme.error, lineHeight: 1.2 }}>
                              {stats.violation}
                            </div>
                            <div style={{ fontSize: 13, color: theme.textSecondary, marginTop: 4 }}>违规</div>
                          </div>
                        </div>
                      </Card>
                    </Col>
                  </Row>
                </>
              ),
            },
          ]}
        />
      </Card>

      {/* 审查对话框 */}
      <Modal
        title="销售合规审查"
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        onOk={handleReviewSubmit}
        okText="确认审查"
        cancelText="取消"
        width={640}
      >
        {currentRecord && (
          <>
            <Card size="small" style={{ marginBottom: 16, borderRadius: 8 }}>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: theme.textTertiary, fontSize: 13 }}>客户线索：</span>
                  <span style={{ fontWeight: 500 }}>{currentRecord.lead_id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: theme.textTertiary, fontSize: 13 }}>销售：</span>
                  <span>{currentRecord.sales_id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: theme.textTertiary, fontSize: 13 }}>渠道：</span>
                  <StatusPill text={channelLabelMap[currentRecord.channel] || currentRecord.channel} kind="blue" />
                </div>
                <div>
                  <span style={{ color: theme.textTertiary, fontSize: 13 }}>AI检测结果：</span>
                  <StatusPill
                    text={checkResultLabelMap[currentRecord.check_result] || currentRecord.check_result}
                    kind={checkResultKindMap[currentRecord.check_result] || 'neutral'}
                  />
                </div>
                {currentRecord.violation_details && (
                  <div>
                    <span style={{ color: theme.textTertiary, fontSize: 13 }}>违规详情：</span>
                    <span style={{ color: theme.error }}>{currentRecord.violation_details}</span>
                  </div>
                )}
                {currentRecord.content && (
                  <div>
                    <span style={{ color: theme.textTertiary, fontSize: 13 }}>内容摘要：</span>
                    <span>{currentRecord.content.length > 100 ? currentRecord.content.substring(0, 100) + '...' : currentRecord.content}</span>
                  </div>
                )}
                {currentRecord.review_note && (
                  <div>
                    <span style={{ color: theme.textTertiary, fontSize: 13 }}>之前审查意见：</span>
                    <span>{currentRecord.review_note}</span>
                  </div>
                )}
              </Space>
            </Card>

            <Form form={reviewForm} layout="vertical">
              <Form.Item
                label="审查结果"
                name="result"
                rules={[{ required: true, message: '请选择审查结果' }]}
              >
                <Radio.Group>
                  <Radio value="approved">
                    <span style={{ color: theme.success }}>通过</span>
                  </Radio>
                  <Radio value="rejected">
                    <span style={{ color: theme.error }}>驳回</span>
                  </Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item
                label="风险等级"
                name="risk_level"
                rules={[{ required: true, message: '请选择风险等级' }]}
                initialValue="low"
              >
                <Select>
                  <Select.Option value="low">低风险</Select.Option>
                  <Select.Option value="medium">中风险</Select.Option>
                  <Select.Option value="high">高风险</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item
                label="审查意见"
                name="note"
                rules={[{ required: true, message: '请填写审查意见' }]}
              >
                <Input.TextArea
                  rows={4}
                  placeholder="请填写审查意见，说明合规情况及整改建议"
                />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </div>
  )
}