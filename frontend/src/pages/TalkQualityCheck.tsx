import { useState, useEffect } from 'react'
import { Card, Row, Col, Table, Button, Space, message, Tabs, Modal, Form, Input, Select, Tag, Progress } from 'antd'
import {
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  EditOutlined,
  FileTextOutlined,
  DashboardOutlined,
} from '@ant-design/icons'
import axios from '../api/axios'
import { formatDateTime } from '../utils/format'
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

// === MD3 Status Pill ===
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

// === 枚举映射 ===
const checkTypeLabelMap: Record<string, string> = {
  call: '通话',
  chat: '聊天',
}

const checkResultKindMap: Record<string, PillKind> = {
  pass: 'green',
  warning: 'orange',
  violation: 'red',
}

const checkResultLabelMap: Record<string, string> = {
  pass: '通过',
  warning: '警告',
  violation: '违规',
}

const handleStatusKindMap: Record<string, PillKind> = {
  pending: 'orange',
  processed: 'green',
}

const handleStatusLabelMap: Record<string, string> = {
  pending: '待处理',
  processed: '已处理',
}

const violationTypeLabelMap: Record<string, string> = {
  false_promise: '虚假承诺',
  exaggerate: '夸大效果',
  illegal_fee: '违规收费',
  other: '其他',
}

export default function TalkQualityCheck() {
  const [activeTab, setActiveTab] = useState('pending')
  const [pendingList, setPendingList] = useState<any[]>([])
  const [processedList, setProcessedList] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, pass: 0, violation: 0, warning: 0, pending: 0, processed: 0 })
  const [loading, setLoading] = useState(false)

  const [checkModalVisible, setCheckModalVisible] = useState(false)
  const [handleModalVisible, setHandleModalVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState<any>(null)

  const [checkForm] = Form.useForm()
  const [handleForm] = Form.useForm()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'pending') {
        // 待处理质检列表
        const res = (await axios.get('/compliance/talk-quality-checks', {
          params: { org_id: user.organization_id, handle_status: 'pending' },
        })) as Record<string, unknown>[]
        setPendingList(res || [])
      } else if (activeTab === 'processed') {
        // 已处理质检列表
        const res = (await axios.get('/compliance/talk-quality-checks', {
          params: { org_id: user.organization_id, handle_status: 'processed' },
        })) as Record<string, unknown>[]
        setProcessedList(res || [])
      } else if (activeTab === 'stats') {
        // 质检统计数据
        const res = (await axios.get('/compliance/talk-quality-checks/stats', {
          params: { org_id: user.organization_id },
        })) as { total: number; pass: number; violation: number; warning: number; pending: number; processed: number }
        setStats(res || { total: 0, pass: 0, violation: 0, warning: 0, pending: 0, processed: 0 })
      }
    } catch (error) {
      message.error('获取质检数据失败')
    } finally {
      setLoading(false)
    }
  }

  // AI质检
  const openCheckModal = () => {
    setCheckModalVisible(true)
    checkForm.resetFields()
  }

  const handleCheck = async () => {
    try {
      const values = await checkForm.validateFields()
      await axios.post('/compliance/talk-quality-check', {
        invite_task_id: values.invite_task_id,
        check_type: values.check_type,
        content: values.content,
        organization_id: user.organization_id,
        inviter_id: user.id,
      })
      message.success('质检完成')
      setCheckModalVisible(false)
      checkForm.resetFields()
      fetchData()
    } catch (error) {
      message.error('质检失败')
    }
  }

  // 处理对话框
  const openHandleModal = (record: any) => {
    setCurrentRecord(record)
    setHandleModalVisible(true)
    handleForm.resetFields()
  }

  const handleQualityCheckSubmit = async () => {
    try {
      const values = await handleForm.validateFields()
      await axios.put(`/compliance/talk-quality-check/${currentRecord.id}/handle`, {
        handler_id: user.id,
        handle_note: values.handle_note,
      })
      message.success('处理成功')
      setHandleModalVisible(false)
      handleForm.resetFields()
      fetchData()
    } catch (error) {
      message.error('处理失败')
    }
  }

  const columns = [
    {
      title: '邀约任务ID',
      dataIndex: 'invite_task_id',
      key: 'invite_task_id',
      width: 180,
      ellipsis: true,
    },
    {
      title: '质检类型',
      dataIndex: 'check_type',
      key: 'check_type',
      width: 100,
      render: (type: string) => (
        <StatusPill text={checkTypeLabelMap[type] || type} kind="blue" />
      ),
    },
    {
      title: '违规类型',
      dataIndex: 'violation_type',
      key: 'violation_type',
      width: 120,
      render: (type: string) => type ? (
        <StatusPill text={violationTypeLabelMap[type] || type} kind="red" />
      ) : (
        <StatusPill text="无" kind="neutral" />
      ),
    },
    {
      title: '违规内容',
      dataIndex: 'violation_content',
      key: 'violation_content',
      width: 200,
      ellipsis: true,
      render: (content: string) => content || '-',
    },
    {
      title: '质检结果',
      dataIndex: 'check_result',
      key: 'check_result',
      width: 100,
      render: (result: string) => (
        <StatusPill text={checkResultLabelMap[result] || result} kind={checkResultKindMap[result] || 'neutral'} />
      ),
    },
    {
      title: '处理状态',
      dataIndex: 'handle_status',
      key: 'handle_status',
      width: 100,
      render: (status: string) => (
        <StatusPill text={handleStatusLabelMap[status] || status} kind={handleStatusKindMap[status] || 'neutral'} />
      ),
    },
    {
      title: '邀约人',
      dataIndex: 'inviter_id',
      key: 'inviter_id',
      width: 120,
      render: (inviterId: string) => inviterId || '-',
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
          {record.handle_status === 'pending' && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openHandleModal(record)}
            >
              处理
            </Button>
          )}
          {record.handle_status === 'processed' && (
            <span style={{ color: theme.textTertiary, fontSize: 12 }}>
              已处理
            </span>
          )}
        </Space>
      ),
    },
  ]

  const statCards = [
    {
      title: '总质检数',
      value: stats.total,
      icon: <SafetyCertificateOutlined />,
      iconBg: 'rgba(0, 113, 227, 0.1)',
      iconColor: theme.primary,
    },
    {
      title: '通过数',
      value: stats.pass,
      icon: <CheckCircleOutlined />,
      iconBg: 'rgba(46, 125, 50, 0.1)',
      iconColor: theme.success,
    },
    {
      title: '违规数',
      value: stats.violation,
      icon: <CloseCircleOutlined />,
      iconBg: 'rgba(186, 26, 26, 0.1)',
      iconColor: theme.error,
    },
    {
      title: '预警数',
      value: stats.warning,
      icon: <WarningOutlined />,
      iconBg: 'rgba(237, 108, 2, 0.1)',
      iconColor: theme.warning,
    },
  ]

  const passRate = stats.total > 0 ? Math.round((stats.pass / stats.total) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={pageH2Style}>谈案AI质检</h2>
          {activeTab === 'pending' && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCheckModal}
            >
              AI质检
            </Button>
          )}
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
                  <FileTextOutlined style={{ marginRight: 6 }} />
                  待处理
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
              key: 'processed',
              label: (
                <span>
                  <CheckCircleOutlined style={{ marginRight: 6 }} />
                  已处理
                </span>
              ),
              children: (
                <Card className="stitch-table" style={tableCardStyle} styles={{ body: { padding: 0 } }}>
                  <Table
                    dataSource={processedList}
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
                  质检统计
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
                        title={<span style={cardTitleStyle}>质检通过率</span>}
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
                              {stats.pending}
                            </div>
                            <div style={{ fontSize: 12, color: theme.textTertiary }}>待处理</div>
                          </div>
                          <div style={{ textAlign: 'center', flex: 1 }}>
                            <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 24, fontWeight: 700, color: theme.primary }}>
                              {stats.processed}
                            </div>
                            <div style={{ fontSize: 12, color: theme.textTertiary }}>已处理</div>
                          </div>
                        </div>
                      </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                      <Card
                        title={<span style={cardTitleStyle}>质检结果分布</span>}
                        headStyle={cardHeadStyle}
                        style={{ height: '100%', borderRadius: 12 }}
                      >
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div
                            style={{
                              background: '#f9f9fb',
                              padding: 16,
                              borderRadius: 10,
                              border: '1px solid #e2e2e4',
                              textAlign: 'center',
                            }}
                          >
                            <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 26, fontWeight: 700, color: theme.success, lineHeight: 1.2 }}>
                              {stats.pass}
                            </div>
                            <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>通过</div>
                          </div>
                          <div
                            style={{
                              background: '#f9f9fb',
                              padding: 16,
                              borderRadius: 10,
                              border: '1px solid #e2e2e4',
                              textAlign: 'center',
                            }}
                          >
                            <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 26, fontWeight: 700, color: theme.warning, lineHeight: 1.2 }}>
                              {stats.warning}
                            </div>
                            <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>预警</div>
                          </div>
                          <div
                            style={{
                              background: '#f9f9fb',
                              padding: 16,
                              borderRadius: 10,
                              border: '1px solid #e2e2e4',
                              textAlign: 'center',
                            }}
                          >
                            <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 26, fontWeight: 700, color: theme.error, lineHeight: 1.2 }}>
                              {stats.violation}
                            </div>
                            <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>违规</div>
                          </div>
                          <div
                            style={{
                              background: '#f9f9fb',
                              padding: 16,
                              borderRadius: 10,
                              border: '1px solid #e2e2e4',
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
                </>
              ),
            },
          ]}
        />
      </Card>

      {/* AI质检对话框 */}
      <Modal
        title="AI质检"
        open={checkModalVisible}
        onCancel={() => setCheckModalVisible(false)}
        onOk={handleCheck}
        okText="开始质检"
        cancelText="取消"
        width={600}
      >
        <Form form={checkForm} layout="vertical">
          <Form.Item
            label="邀约任务ID"
            name="invite_task_id"
            rules={[{ required: true, message: '请输入邀约任务ID' }]}
          >
            <Input placeholder="请输入邀约任务ID" />
          </Form.Item>
          <Form.Item
            label="质检类型"
            name="check_type"
            rules={[{ required: true, message: '请选择质检类型' }]}
            initialValue="call"
          >
            <Select>
              <Select.Option value="call">通话</Select.Option>
              <Select.Option value="chat">聊天</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="质检内容"
            name="content"
            rules={[{ required: true, message: '请输入质检内容' }]}
          >
            <Input.TextArea
              rows={6}
              placeholder="请输入通话记录或聊天内容，AI将自动识别违规关键词"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 处理对话框 */}
      <Modal
        title="处理质检结果"
        open={handleModalVisible}
        onCancel={() => setHandleModalVisible(false)}
        onOk={handleQualityCheckSubmit}
        okText="确认处理"
        cancelText="取消"
        width={600}
      >
        {currentRecord && (
          <div style={{ marginBottom: 16 }}>
            <Card size="small" style={{ marginBottom: 12, borderRadius: 8 }}>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <div>
                  <span style={{ color: theme.textTertiary, fontSize: 13 }}>质检结果：</span>
                  <StatusPill
                    text={checkResultLabelMap[currentRecord.check_result] || currentRecord.check_result}
                    kind={checkResultKindMap[currentRecord.check_result] || 'neutral'}
                  />
                </div>
                <div>
                  <span style={{ color: theme.textTertiary, fontSize: 13 }}>违规类型：</span>
                  {currentRecord.violation_type ? (
                    <Tag className="stitch-tag stitch-tag-error">{violationTypeLabelMap[currentRecord.violation_type] || currentRecord.violation_type}</Tag>
                  ) : (
                    <span style={{ color: theme.textTertiary }}>无</span>
                  )}
                </div>
                {currentRecord.violation_content && (
                  <div>
                    <span style={{ color: theme.textTertiary, fontSize: 13 }}>违规内容：</span>
                    <span style={{ color: theme.error }}>{currentRecord.violation_content}</span>
                  </div>
                )}
              </Space>
            </Card>
            <Form form={handleForm} layout="vertical">
              <Form.Item
                label="处理备注"
                name="handle_note"
                rules={[{ required: true, message: '请输入处理备注' }]}
              >
                <Input.TextArea
                  rows={4}
                  placeholder="请输入处理备注，说明处理结果和整改意见"
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  )
}