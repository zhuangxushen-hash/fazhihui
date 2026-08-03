import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Space, message, Tabs, Card, Popconfirm } from 'antd'
import { PlusOutlined, SearchOutlined, PhoneOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons'
import {
  getPaymentReminders,
  createPaymentReminder,
  remindPayment,
  markPaidPayment,
  giveUpPayment,
  deletePaymentReminder,
} from '../api/paymentReminder'
import { formatDate } from '../utils/format'

// === Material Design 3 Style Tokens ===
const pageH2Style: React.CSSProperties = {
  fontFamily: "'Noto Serif SC', serif",
  fontSize: 22,
  fontWeight: 600,
  color: '#1a1c1d',
  margin: 0,
  letterSpacing: '0.01em',
}

const searchBarStyle: React.CSSProperties = {
  background: '#ffffff',
  padding: 16,
  borderRadius: 12,
  border: '1px solid #c1c6d6',
  marginBottom: 16,
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap',
  alignItems: 'center',
}

const tableCardStyle: React.CSSProperties = {
  borderRadius: 16,
  overflow: 'hidden',
}

// === MD3 Status Pill ===
type PillKind = 'neutral' | 'blue' | 'gold' | 'green' | 'red' | 'orange' | 'purple'

const pillColorMap: Record<PillKind, { bg: string; color: string }> = {
  neutral: { bg: 'rgba(113, 119, 133, 0.12)', color: '#5f6672' },
  blue: { bg: 'rgba(0, 113, 227, 0.1)', color: '#0071e3' },
  gold: { bg: 'rgba(201, 169, 97, 0.15)', color: '#8c702e' },
  green: { bg: 'rgba(46, 125, 50, 0.1)', color: '#2e7d32' },
  red: { bg: 'rgba(186, 26, 26, 0.1)', color: '#ba1a1a' },
  orange: { bg: 'rgba(237, 108, 2, 0.1)', color: '#ed6c02' },
  purple: { bg: 'rgba(114, 46, 209, 0.1)', color: '#722ed1' },
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

// 催款状态映射
const statusKindMap: Record<string, PillKind> = {
  pending: 'neutral',
  reminding: 'orange',
  paid: 'green',
  given_up: 'red',
}

const statusLabelMap: Record<string, string> = {
  pending: '待催款',
  reminding: '催款中',
  paid: '已回款',
  given_up: '已放弃',
}

export default function PaymentReminderManagement() {
  const [activeTab, setActiveTab] = useState('pending')
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [keyword, setKeyword] = useState('')

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const fetchList = async () => {
    setLoading(true)
    try {
      const res = await getPaymentReminders({
        org_id: user.organization_id,
        status: activeTab,
        keyword: keyword || undefined,
      })
      setList(res || [])
    } catch (error) {
      console.error('Fetch payment reminders error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList()
  }, [activeTab])

  const handleSearch = () => {
    fetchList()
  }

  const handleAdd = () => {
    form.resetFields()
    form.setFieldsValue({ received_amount: 0 })
    setModalVisible(true)
  }

  const handleSubmit = async (values: any) => {
    try {
      await createPaymentReminder({
        ...values,
        organization_id: user.organization_id,
      })
      setModalVisible(false)
      message.success('催款记录创建成功')
      fetchList()
    } catch (error) {
      message.error('创建失败')
      console.error('Create payment reminder error:', error)
    }
  }

  const handleRemind = async (record: any) => {
    try {
      await remindPayment(record.id)
      message.success('催款成功，催款次数已更新')
      fetchList()
    } catch (error) {
      message.error('催款操作失败')
      console.error('Remind error:', error)
    }
  }

  const handleMarkPaid = async (record: any) => {
    try {
      await markPaidPayment(record.id)
      message.success('已标记为回款')
      fetchList()
    } catch (error) {
      message.error('操作失败')
      console.error('Mark paid error:', error)
    }
  }

  const handleGiveUp = async (record: any) => {
    try {
      await giveUpPayment(record.id)
      message.success('已放弃催款')
      fetchList()
    } catch (error) {
      message.error('操作失败')
      console.error('Give up error:', error)
    }
  }

  const handleDelete = async (record: any) => {
    try {
      await deletePaymentReminder(record.id)
      message.success('删除成功')
      fetchList()
    } catch (error) {
      message.error('删除失败')
      console.error('Delete error:', error)
    }
  }

  const columns = [
    { title: '客户名', dataIndex: 'client_name', key: 'client_name' },
    { title: '电话', dataIndex: 'client_phone', key: 'client_phone', render: (v: string) => v || '-' },
    {
      title: '应收金额',
      dataIndex: 'receivable_amount',
      key: 'receivable_amount',
      render: (v: number) => (
        <span style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, color: '#0059b5' }}>
          ¥{Number(v || 0).toFixed(2)}
        </span>
      ),
    },
    {
      title: '已收金额',
      dataIndex: 'received_amount',
      key: 'received_amount',
      render: (v: number) => (
        <span style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, color: '#2e7d32' }}>
          ¥{Number(v || 0).toFixed(2)}
        </span>
      ),
    },
    {
      title: '欠款',
      dataIndex: 'overdue_amount',
      key: 'overdue_amount',
      render: (v: number) => (
        <span style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, color: '#ba1a1a' }}>
          ¥{Number(v || 0).toFixed(2)}
        </span>
      ),
    },
    { title: '催款次数', dataIndex: 'reminder_count', key: 'reminder_count' },
    { title: '上次催款', dataIndex: 'last_reminder_date', key: 'last_reminder_date', render: (v: string) => formatDate(v) },
    { title: '下次催款', dataIndex: 'next_reminder_date', key: 'next_reminder_date', render: (v: string) => formatDate(v) },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <StatusPill text={statusLabelMap[status] || status} kind={statusKindMap[status] || 'neutral'} />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_: any, record: any) => (
        <Space>
          {record.status !== 'paid' && record.status !== 'given_up' && (
            <Button type="link" size="small" icon={<PhoneOutlined />} onClick={() => handleRemind(record)}>
              催款
            </Button>
          )}
          {record.status !== 'paid' && record.status !== 'given_up' && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => handleMarkPaid(record)}>
              标记回款
            </Button>
          )}
          {record.status !== 'paid' && record.status !== 'given_up' && (
            <Button type="link" size="small" danger icon={<StopOutlined />} onClick={() => handleGiveUp(record)}>
              放弃
            </Button>
          )}
          <Popconfirm title="确认删除该催款记录？" onConfirm={() => handleDelete(record)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const tabItems = [
    { key: 'pending', label: '待催款' },
    { key: 'reminding', label: '催款中' },
    { key: 'paid', label: '已回款' },
    { key: 'given_up', label: '已放弃' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
        <h2 style={pageH2Style}>催款管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增催款</Button>
      </div>

      <div className="search-bar" style={searchBarStyle}>
        <Input
          placeholder="客户名搜索"
          prefix={<SearchOutlined />}
          style={{ width: 220 }}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={handleSearch}
        />
        <Button type="primary" onClick={handleSearch}>搜索</Button>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems.map(t => ({ key: t.key, label: t.label }))} />

      <Card style={tableCardStyle} styles={{ body: { padding: 0 } }}>
        <Table dataSource={list} columns={columns} loading={loading} rowKey="id" size="small" pagination={{ pageSize: 10 }} />
      </Card>

      <Modal
        title="新增催款记录"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={520}
      >
        <Form onFinish={handleSubmit} form={form} layout="vertical">
          <Form.Item name="client_name" label="客户名" rules={[{ required: true, message: '请输入客户名' }]}>
            <Input placeholder="请输入客户名" />
          </Form.Item>
          <Form.Item name="client_phone" label="客户电话">
            <Input placeholder="请输入客户电话" />
          </Form.Item>
          <Form.Item name="case_id" label="关联案件">
            <Input placeholder="请输入关联案件ID（可空）" />
          </Form.Item>
          <Form.Item name="receivable_amount" label="应收金额" rules={[{ required: true, message: '请输入应收金额' }]}>
            <Input type="number" placeholder="请输入应收金额" />
          </Form.Item>
          <Form.Item name="received_amount" label="已收金额">
            <Input type="number" placeholder="请输入已收金额" />
          </Form.Item>
          <Form.Item name="remarks" label="备注">
            <Input.TextArea placeholder="请输入备注" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">提交</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
