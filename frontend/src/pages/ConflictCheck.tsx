import { useState, useEffect } from 'react'
import { Table, Button, Form, Input, Space, Card, Tag, Alert, message, Typography, Modal, Select, Switch } from 'antd'
import { SearchOutlined, SafetyCertificateOutlined, WarningOutlined, CloseCircleOutlined, CheckCircleOutlined, ThunderboltOutlined } from '@ant-design/icons'
import axios from '../api/axios'
import { deepCheckConflict, approveConflict, rejectConflict } from '../api/conflictCheck'
import { formatDateTime } from '../utils/format'
import { theme } from '../constants/theme'
const { Paragraph, Text } = Typography

// === Material Design 3 Style Tokens ===
const pageH2Style: React.CSSProperties = {
  fontFamily: "'Noto Serif SC', serif",
  fontSize: 22,
  fontWeight: 600,
  color: theme.textBase,
  margin: 0,
  letterSpacing: '0.01em',
}

const searchBarStyle: React.CSSProperties = {
  background: theme.bgContainer,
  padding: 20,
  borderRadius: 12,
  border: `1px solid ${theme.border}`,
  marginBottom: 16,
}

const tableCardStyle: React.CSSProperties = {
  borderRadius: 16,
  overflow: 'hidden',
}

const resultCardStyle: React.CSSProperties = {
  borderRadius: 16,
  marginBottom: 16,
}

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: "'Noto Serif SC', serif",
  fontSize: 15,
  fontWeight: 600,
  color: theme.textBase,
  marginBottom: 8,
}

// 检索结果状态映射
const checkResultConfig: Record<string, { label: string; color: string; icon: React.ReactNode; bg: string }> = {
  clear: {
    label: '无冲突',
    color: theme.success,
    icon: <CheckCircleOutlined />,
    bg: 'rgba(46, 125, 50, 0.08)',
  },
  warning: {
    label: '有风险',
    color: theme.warning,
    icon: <WarningOutlined />,
    bg: 'rgba(237, 108, 2, 0.08)',
  },
  conflict: {
    label: '有冲突',
    color: theme.error,
    icon: <CloseCircleOutlined />,
    bg: 'rgba(186, 26, 26, 0.08)',
  },
}

// 本案角色中文映射
const partyRoleMap: Record<string, string> = {
  client: '委托人',
  opposing: '对方',
}

// 审批状态配置映射
const approvalStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: '待审批', color: 'default' },
  approved: { label: '已通过', color: 'green' },
  rejected: { label: '已驳回', color: 'red' },
}

// Tag颜色到stitch-tag变体类名的映射（保留原有color逻辑，仅转className）
const tagColorToClassName: Record<string, string> = {
  default: 'stitch-tag stitch-tag-info',
  green: 'stitch-tag stitch-tag-success',
  red: 'stitch-tag stitch-tag-error',
  orange: 'stitch-tag stitch-tag-warning',
  blue: 'stitch-tag stitch-tag-primary',
  gold: 'stitch-tag stitch-tag-gold',
}

export default function ConflictCheck() {
  const [form] = Form.useForm()
  const [historyKeyword, setHistoryKeyword] = useState('')
  const [history, setHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [deepChecking, setDeepChecking] = useState(false)
  // 只显示有冲突的当事人
  const [onlyConflict, setOnlyConflict] = useState(false)
  // 审批弹窗状态
  const [approvalModalVisible, setApprovalModalVisible] = useState(false)
  const [approvalRecord, setApprovalRecord] = useState<any>(null)
  const [approvalLoading, setApprovalLoading] = useState(false)
  const [approvalForm] = Form.useForm()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchHistory()
  }, [])

  // 获取历史检索记录
  const fetchHistory = async (keyword?: string) => {
    setHistoryLoading(true)
    try {
      const params: any = { org_id: user.organization_id }
      if (keyword) params.keyword = keyword
      const res: any = await axios.get('/conflict-checks', { params })
      const data = res?.data || res || []
      setHistory(Array.isArray(data) ? data : [])
    } catch (error) {
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  // 执行检索
  const handleCheck = async (values: any) => {
    if (!values.party_name || !values.opposing_party) {
      message.warning('请填写当事人姓名和对方当事人姓名')
      return
    }
    setChecking(true)
    try {
      const res: any = await axios.post('/conflict-checks', {
        party_name: values.party_name,
        opposing_party: values.opposing_party,
        party_phone: values.party_phone || undefined,
        case_id: values.case_id || undefined,
      })
      setResult(res)
      message.success('检索完成')
      fetchHistory(historyKeyword)
    } catch (error) {
      message.error('检索失败')
    } finally {
      setChecking(false)
    }
  }

  const handleReset = () => {
    form.resetFields()
    setResult(null)
  }

  const handleSearchHistory = () => {
    fetchHistory(historyKeyword)
  }

  // 执行深度利冲检索
  const handleDeepCheck = async () => {
    const values = form.getFieldsValue()
    if (!values.party_name || !values.opposing_party) {
      message.warning('请填写当事人姓名和对方当事人姓名')
      return
    }
    setDeepChecking(true)
    try {
      const res: any = await deepCheckConflict({
        party_name: values.party_name,
        opposing_party: values.opposing_party,
        party_role: values.party_role || 'client',
      })
      setResult(res)
      message.success('深度检索完成')
      fetchHistory(historyKeyword)
    } catch (error) {
      message.error('深度检索失败')
    } finally {
      setDeepChecking(false)
    }
  }

  // 打开审批弹窗
  const openApproval = (record: any) => {
    setApprovalRecord(record)
    approvalForm.resetFields()
    setApprovalModalVisible(true)
  }

  // 关闭审批弹窗
  const closeApproval = () => {
    setApprovalModalVisible(false)
    setApprovalRecord(null)
    approvalForm.resetFields()
  }

  // 审批通过
  const handleApprove = async () => {
    if (!approvalRecord) return
    const values = await approvalForm.validateFields()
    setApprovalLoading(true)
    try {
      await approveConflict(approvalRecord.id, {
        supervisor_id: values.supervisor_id,
        comment: values.comment || '',
      })
      message.success('审批通过')
      closeApproval()
      fetchHistory(historyKeyword)
      // 同步更新当前展示结果
      if (result && result.id === approvalRecord.id) {
        setResult({ ...result, approval_status: 'approved', supervisor_id: values.supervisor_id })
      }
    } catch (error) {
      message.error('审批通过失败')
    } finally {
      setApprovalLoading(false)
    }
  }

  // 审批驳回
  const handleReject = async () => {
    if (!approvalRecord) return
    const values = await approvalForm.validateFields()
    setApprovalLoading(true)
    try {
      await rejectConflict(approvalRecord.id, {
        supervisor_id: values.supervisor_id,
        comment: values.comment || '',
      })
      message.success('审批驳回')
      closeApproval()
      fetchHistory(historyKeyword)
      // 同步更新当前展示结果
      if (result && result.id === approvalRecord.id) {
        setResult({ ...result, approval_status: 'rejected', supervisor_id: values.supervisor_id })
      }
    } catch (error) {
      message.error('审批驳回失败')
    } finally {
      setApprovalLoading(false)
    }
  }

  // 渲染检索结果区
  const renderResult = () => {
    if (!result) return null
    const cfg = checkResultConfig[result.check_result] || checkResultConfig.clear
    return (
      <Card style={{ ...resultCardStyle, background: cfg.bg, border: `1px solid ${cfg.color}33` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 22, color: cfg.color }}>{cfg.icon}</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: cfg.color }}>
              检索结果：{cfg.label}
            </div>
            <div style={{ fontSize: 12, color: theme.textTertiary }}>
              检索时间：{formatDateTime(result.created_at)}
            </div>
          </div>
        </div>
        <div style={{ marginBottom: 8 }}>
          <Tag className="stitch-tag stitch-tag-info">当事人：{result.party_name}</Tag>
          <Tag className="stitch-tag stitch-tag-info">对方当事人：{result.opposing_party}</Tag>
          {result.party_phone && <Tag className="stitch-tag stitch-tag-info">电话：{result.party_phone}</Tag>}
        </div>
        {result.conflict_detail ? (
          <div>
            <div style={sectionTitleStyle}>冲突详情</div>
            <Paragraph
              style={{
                whiteSpace: 'pre-wrap',
                background: theme.bgContainer,
                padding: 12,
                borderRadius: 8,
                border: `1px solid ${theme.borderSecondary}`,
                margin: 0,
                fontSize: 13,
                color: theme.textSecondary,
                lineHeight: 1.8,
              }}
            >
              {result.conflict_detail}
            </Paragraph>
          </div>
        ) : (
          <Alert
            type="success"
            showIcon
            message="未在现有案件中检索到相关当事人，可放心受理"
            style={{ background: theme.bgContainer }}
          />
        )}
      </Card>
    )
  }

  const historyColumns = [
    {
      title: '检索时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (v: string) => formatDateTime(v),
    },
    { title: '当事人', dataIndex: 'party_name', key: 'party_name', width: 120 },
    { title: '对方当事人', dataIndex: 'opposing_party', key: 'opposing_party', width: 120 },
    {
      title: '本案角色',
      dataIndex: 'party_role',
      key: 'party_role',
      width: 100,
      render: (v: string) => (v ? partyRoleMap[v] || v : '-'),
    },
    {
      title: '电话',
      dataIndex: 'party_phone',
      key: 'party_phone',
      width: 140,
      render: (v: string) => v || '-',
    },
    {
      title: '检索结果',
      dataIndex: 'check_result',
      key: 'check_result',
      width: 110,
      render: (val: string) => {
        const cfg = checkResultConfig[val] || checkResultConfig.clear
        const tagColor = val === 'conflict' ? 'red' : val === 'warning' ? 'orange' : 'green'
        return <Tag className={tagColorToClassName[tagColor] || 'stitch-tag'}>{cfg.label}</Tag>
      },
    },
    {
      title: '冲突详情',
      dataIndex: 'conflict_detail',
      key: 'conflict_detail',
      ellipsis: true,
      render: (v: string) => v || <Text type="secondary">无</Text>,
    },
    {
      title: '冲突项目名称',
      dataIndex: 'conflict_case_name',
      key: 'conflict_case_name',
      width: 160,
      ellipsis: true,
      render: (v: string) => v || <Text type="secondary">-</Text>,
    },
    {
      title: '审批状态',
      dataIndex: 'approval_status',
      key: 'approval_status',
      width: 110,
      render: (val: string) => {
        const cfg = approvalStatusConfig[val] || approvalStatusConfig.pending
        return <Tag className={tagColorToClassName[cfg.color] || 'stitch-tag'}>{cfg.label}</Tag>
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: any) => {
        if (record.approval_status === 'pending') {
          return (
            <Button type="link" size="small" onClick={() => openApproval(record)}>
              利冲审批
            </Button>
          )
        }
        return <Text type="secondary">-</Text>
      },
    },
  ]

  // 只显示有冲突的当事人筛选
  const filteredHistory = onlyConflict
    ? history.filter((h) => h.check_result === 'conflict')
    : history

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <h2 style={pageH2Style}>
          <SafetyCertificateOutlined style={{ marginRight: 8, color: theme.primary }} />
          利冲检索
        </h2>
      </div>

      <Card className="stitch-filter-bar" style={searchBarStyle}>
        <Form form={form} layout="inline" onFinish={handleCheck}>
          <Form.Item
            name="party_name"
            label="当事人姓名"
            rules={[{ required: true, message: '请输入当事人姓名' }]}
          >
            <Input placeholder="请输入当事人姓名" style={{ width: 180 }} />
          </Form.Item>
          <Form.Item
            name="opposing_party"
            label="对方当事人"
            rules={[{ required: true, message: '请输入对方当事人姓名' }]}
          >
            <Input placeholder="请输入对方当事人姓名" style={{ width: 180 }} />
          </Form.Item>
          <Form.Item name="party_phone" label="当事人电话">
            <Input placeholder="可选" style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="case_id" label="关联案件ID">
            <Input placeholder="可选" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="party_role" label="本案角色" initialValue="client">
            <Select style={{ width: 120 }} placeholder="请选择本案角色">
              <Select.Option value="client">委托人</Select.Option>
              <Select.Option value="opposing">对方</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space className="stitch-btn-group">
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={checking}>
                执行检索
              </Button>
              <Button
                type="primary"
                ghost
                icon={<ThunderboltOutlined />}
                loading={deepChecking}
                onClick={handleDeepCheck}
              >
                深度检索
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {renderResult()}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Space size="large" align="center">
          <div style={sectionTitleStyle}>历史检索记录</div>
          <Space size={6} align="center">
            <Switch checked={onlyConflict} onChange={(checked) => setOnlyConflict(checked)} />
            <span style={{ fontSize: 13, color: theme.textSecondary }}>只显示有冲突的当事人</span>
          </Space>
        </Space>
        <Space className="stitch-btn-group">
          <Input
            placeholder="搜索当事人/电话"
            value={historyKeyword}
            onChange={(e) => setHistoryKeyword(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Button type="primary" onClick={handleSearchHistory}>查询</Button>
        </Space>
      </div>

      <Card className="stitch-table" style={tableCardStyle} styles={{ body: { padding: 0 } }}>
        <Table
          dataSource={filteredHistory}
          columns={historyColumns}
          loading={historyLoading}
          rowKey="id"
          size="small"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条检索记录`,
          }}
        />
      </Card>

      <Modal
        title="利冲审批"
        open={approvalModalVisible}
        onCancel={closeApproval}
        width={480}
        footer={[
          <Button key="cancel" onClick={closeApproval}>
            取消
          </Button>,
          <Button key="reject" danger loading={approvalLoading} onClick={handleReject}>
            驳回
          </Button>,
          <Button key="approve" type="primary" loading={approvalLoading} onClick={handleApprove}>
            通过
          </Button>,
        ]}
      >
        <Form form={approvalForm} layout="vertical" preserve={false}>
          <Form.Item
            name="supervisor_id"
            label="业务主管ID"
            rules={[{ required: true, message: '请输入业务主管ID' }]}
          >
            <Input placeholder="请输入业务主管ID" />
          </Form.Item>
          <Form.Item name="comment" label="审批意见">
            <Input.TextArea rows={3} placeholder="请输入审批意见" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
