import { useState, useEffect, useMemo } from 'react'
import { Table, Button, Modal, Form, Input, Select, Space, message, Tabs, Card } from 'antd'
import { PlusOutlined, EyeOutlined, SearchOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import axios from '../api/axios'
import { formatDateTime } from '../utils/format'

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

// === MD3 Status Pill (Soft Background Style) ===
type PillKind = 'neutral' | 'blue' | 'gold' | 'green' | 'red' | 'orange' | 'purple' | 'cyan' | 'geekblue'

const pillColorMap: Record<PillKind, { bg: string; color: string }> = {
  neutral: { bg: 'rgba(113, 119, 133, 0.12)', color: '#5f6672' },
  blue: { bg: 'rgba(0, 113, 227, 0.1)', color: '#0071e3' },
  gold: { bg: 'rgba(201, 169, 97, 0.15)', color: '#8c702e' },
  green: { bg: 'rgba(46, 125, 50, 0.1)', color: '#2e7d32' },
  red: { bg: 'rgba(186, 26, 26, 0.1)', color: '#ba1a1a' },
  orange: { bg: 'rgba(237, 108, 2, 0.1)', color: '#ed6c02' },
  purple: { bg: 'rgba(114, 46, 209, 0.1)', color: '#722ed1' },
  cyan: { bg: 'rgba(0, 166, 167, 0.1)', color: '#00a6a7' },
  geekblue: { bg: 'rgba(47, 84, 235, 0.1)', color: '#2f54eb' },
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

// === Finance Status Mappings (Preserved) ===
const refundStatusKindMap: Record<string, PillKind> = {
  pending: 'neutral',
  approved: 'green',
  rejected: 'red',
  processed: 'green',
}

const refundStatusLabelMap: Record<string, string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已拒绝',
  processed: '已处理',
}

// 发票管理功能已合并至 InvoiceManagement.tsx，相关状态、常量、列定义与接口调用已移除

export default function FinanceManagement() {
  const [activeTab, setActiveTab] = useState('fees')
  const [fees, setFees] = useState<any[]>([])
  const [profitShares, setProfitShares] = useState<any[]>([])
  const [refunds, setRefunds] = useState<any[]>([])
  // 发票管理已合并到专用发票管理页（InvoiceManagement.tsx），此处不再维护
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [form] = Form.useForm()
  const [currentItem, setCurrentItem] = useState<any>(null)
  const [searchParams, setSearchParams] = useState({
    case_id: '',
    status: '',
  })

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    if (activeTab === 'fees') {
      fetchFees()
    } else if (activeTab === 'profit-shares') {
      fetchProfitShares()
    } else if (activeTab === 'refunds') {
      fetchRefunds()
    }
    // 发票管理已合并到专用发票管理页（InvoiceManagement.tsx）
  }, [activeTab])

  const fetchFees = async () => {
    setLoading(true)
    try {
      const params: any = { org_id: user.organization_id }
      if (searchParams.case_id) params.case_id = searchParams.case_id

      const res = await axios.get('/finance/fees', { params })
      setFees(res || [])
    } catch (error) {
      console.error('Fetch fees error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProfitShares = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/finance/profit-share', { params: { org_id: user.organization_id } })
      setProfitShares(res || [])
    } catch (error) {
      console.error('Fetch profit shares error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRefunds = async () => {
    setLoading(true)
    try {
      const params: any = { org_id: user.organization_id }
      if (searchParams.status) params.status = searchParams.status

      const res = await axios.get('/finance/refunds', { params })
      setRefunds(res || [])
    } catch (error) {
      console.error('Fetch refunds error:', error)
    } finally {
      setLoading(false)
    }
  }

  // 发票管理已合并到专用发票管理页（InvoiceManagement.tsx），删除 fetchInvoices

  const handleSearch = () => {
    if (activeTab === 'fees') {
      fetchFees()
    } else if (activeTab === 'refunds') {
      fetchRefunds()
    }
    // 发票管理已合并到专用发票管理页（InvoiceManagement.tsx）
  }

  const handleReset = () => {
    setSearchParams({ case_id: '', status: '' })
    handleSearch()
  }

  const handleAddFee = () => {
    form.resetFields()
    setModalVisible(true)
  }

  const handleSubmitFee = async (values: any) => {
    try {
      await axios.post('/finance/fee', { ...values, organization_id: user.organization_id })
      setModalVisible(false)
      message.success('费用创建成功')
      fetchFees()
    } catch (error) {
      message.error('费用创建失败')
      console.error('Create fee error:', error)
    }
  }

  const handleViewDetail = (record: any) => {
    setCurrentItem(record)
    setDetailVisible(true)
  }

  const handleMarkPaid = async (record: any) => {
    try {
      await axios.put(`/finance/fee/${record.id}/paid`)
      message.success('费用已标记为已支付')
      fetchFees()
    } catch (error) {
      message.error('操作失败')
      console.error('Mark paid error:', error)
    }
  }

  const handleApproveRefund = async (record: any) => {
    try {
      await axios.put(`/finance/refund/${record.id}/approve`, { approved_by: user.id })
      message.success('退款已审批通过')
      fetchRefunds()
    } catch (error) {
      message.error('审批失败')
      console.error('Approve refund error:', error)
    }
  }

  const handleRejectRefund = async (record: any) => {
    try {
      await axios.put(`/finance/refund/${record.id}/reject`, { note: '拒绝退款' })
      message.success('退款已拒绝')
      fetchRefunds()
    } catch (error) {
      message.error('操作失败')
      console.error('Reject refund error:', error)
    }
  }

  const refundStatusOptions = [
    { value: 'pending', label: '待审批' },
    { value: 'approved', label: '已通过' },
    { value: 'rejected', label: '已拒绝' },
    { value: 'processed', label: '已处理' },
  ]

  // 发票管理已合并至专用发票管理页（InvoiceManagement.tsx），相关常量已移除

  const feeColumns = [
    { title: '费用ID', dataIndex: 'id', key: 'id', width: 120 },
    { title: '案件ID', dataIndex: 'case_id', key: 'case_id' },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (amount: number) => (
      <span style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, color: '#0059b5' }}>¥{amount?.toFixed(2) || '0.00'}</span>
    ) },
    { title: '描述', dataIndex: 'description', key: 'description' },
    { title: '状态', dataIndex: 'paid', key: 'paid', render: (paid: boolean) => (
      <StatusPill text={paid ? '已支付' : '未支付'} kind={paid ? 'green' : 'neutral'} />
    )},
    { title: '支付时间', dataIndex: 'paid_at', key: 'paid_at', render: (val: string) => formatDateTime(val) },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (val: string) => formatDateTime(val) },
    { title: '操作', key: 'action', render: (_: any, record: any) => (
      <Space>
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
        {!record.paid && (
          <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => handleMarkPaid(record)}>标记支付</Button>
        )}
      </Space>
    )},
  ]

  const profitShareColumns = [
    { title: '分润ID', dataIndex: 'id', key: 'id', width: 120 },
    { title: '案件ID', dataIndex: 'case_id', key: 'case_id' },
    { title: '角色', dataIndex: 'role', key: 'role', render: (role: string) => ({
      org: '律所',
      lawyer: '律师',
      sales: '销售',
      marketing: '投放',
      assistant: '助理',
    }[role]) },
    { title: '分润比例', dataIndex: 'percentage', key: 'percentage', render: (ratio: number) => (
      <span style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, color: '#1a1c1d' }}>{ratio}%</span>
    ) },
    { title: '分润金额', dataIndex: 'amount', key: 'amount', render: (amount: number) => (
      <span style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, color: '#0059b5' }}>¥{amount?.toFixed(2) || '0.00'}</span>
    ) },
    { title: '结算状态', dataIndex: 'paid', key: 'paid', render: (paid: boolean) => (
      <StatusPill text={paid ? '已支付' : '待支付'} kind={paid ? 'green' : 'orange'} />
    )},
    { title: '结算日期', dataIndex: 'paid_at', key: 'paid_at', render: (val: string) => formatDateTime(val) },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (val: string) => formatDateTime(val) },
    { title: '操作', key: 'action', render: (_: any, record: any) => (
      <Space>
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
        {!record.paid && (
          <Button size="small" type="primary" icon={<CheckCircleOutlined />}>确认支付</Button>
        )}
      </Space>
    )},
  ]

  const refundColumns = [
    { title: '退款ID', dataIndex: 'id', key: 'id', width: 120 },
    { title: '案件ID', dataIndex: 'case_id', key: 'case_id' },
    { title: '退款金额', dataIndex: 'amount', key: 'amount', render: (amount: number) => (
      <span style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, color: '#ba1a1a' }}>¥{amount?.toFixed(2) || '0.00'}</span>
    ) },
    { title: '退款原因', dataIndex: 'reason', key: 'reason' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status: string) => (
      <StatusPill text={refundStatusLabelMap[status] || status} kind={refundStatusKindMap[status] || 'neutral'} />
    )},
    { title: '申请时间', dataIndex: 'created_at', key: 'created_at', render: (val: string) => formatDateTime(val) },
    { title: '操作', key: 'action', render: (_: any, record: any) => (
      <Space>
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
        {record.status === 'pending' && (
          <>
            <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => handleApproveRefund(record)}>通过</Button>
            <Button type="link" size="small" danger icon={<CloseCircleOutlined />} onClick={() => handleRejectRefund(record)}>拒绝</Button>
          </>
        )}
      </Space>
    )},
  ]

  const tabItems = useMemo(() => [
    {
      key: 'fees',
      label: '费用管理',
      children: (
        <>
          <div className="search-bar" style={searchBarStyle}>
            <Input
              placeholder="案件ID搜索"
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
              value={searchParams.case_id}
              onChange={(e) => setSearchParams({ ...searchParams, case_id: e.target.value })}
            />
            <Button type="primary" onClick={handleSearch}>搜索</Button>
            <Button onClick={handleReset}>重置</Button>
          </div>
          <Card style={tableCardStyle} styles={{ body: { padding: 0 } }}>
            <Table dataSource={fees} columns={feeColumns} loading={loading} rowKey="id" size="small" />
          </Card>
        </>
      ),
    },
    {
      key: 'profit-shares',
      label: '分润管理',
      children: (
        <Card style={tableCardStyle} styles={{ body: { padding: 0 } }}>
          <Table dataSource={profitShares} columns={profitShareColumns} loading={loading} rowKey="id" size="small" />
        </Card>
      ),
    },
    {
      key: 'refunds',
      label: '退款审批',
      children: (
        <>
          <div className="search-bar" style={searchBarStyle}>
            <Select
              placeholder="状态筛选"
              style={{ width: 150 }}
              allowClear
              value={searchParams.status || undefined}
              onChange={(value) => setSearchParams({ ...searchParams, status: value || '' })}
            >
              {refundStatusOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
            </Select>
            <Button type="primary" onClick={handleSearch}>搜索</Button>
            <Button onClick={handleReset}>重置</Button>
          </div>
          <Card style={tableCardStyle} styles={{ body: { padding: 0 } }}>
            <Table dataSource={refunds} columns={refundColumns} loading={loading} rowKey="id" size="small" />
          </Card>
        </>
      ),
    },
    // 发票管理已合并到专用发票管理页（InvoiceManagement.tsx），此处不再维护
  ], [searchParams, fees, profitShares, refunds, loading])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <h2 style={pageH2Style}>财务管理</h2>
        {activeTab === 'fees' && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddFee}>创建费用</Button>
        )}
        {/* 发票管理已合并到专用发票管理页（InvoiceManagement.tsx） */}
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      <Modal
        title="创建费用"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form onFinish={handleSubmitFee}>
          <Form.Item name="case_id" label="案件ID" rules={[{ required: true }]}>
            <Input placeholder="请输入案件ID" />
          </Form.Item>
          <Form.Item name="amount" label="金额" rules={[{ required: true }]}>
            <Input placeholder="请输入金额" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="请输入费用描述" />
          </Form.Item>
          {/* 发票管理已合并到专用发票管理页（InvoiceManagement.tsx），此处仅保留创建费用表单 */}
          <Form.Item>
            <Button type="primary" htmlType="submit">提交</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`${activeTab === 'fees' ? '费用' : activeTab === 'profit-shares' ? '分润' : '退款'}详情`}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={500}
      >
        {currentItem && (
          <div>
            {activeTab === 'fees' && (
              <div className="detail-grid">
                <div className="detail-item"><span className="detail-label">费用ID</span><span className="detail-value">{currentItem.id}</span></div>
                <div className="detail-item"><span className="detail-label">案件ID</span><span className="detail-value">{currentItem.case_id || '-'}</span></div>
                <div className="detail-item"><span className="detail-label">金额</span><span className="detail-value" style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, color: '#0059b5' }}>¥{currentItem.amount?.toFixed(2) || '0.00'}</span></div>
                <div className="detail-item"><span className="detail-label">描述</span><span className="detail-value">{currentItem.description || '-'}</span></div>
                <div className="detail-item"><span className="detail-label">状态</span><span className="detail-value">
                  <StatusPill text={currentItem.paid ? '已支付' : '未支付'} kind={currentItem.paid ? 'green' : 'neutral'} />
                </span></div>
                <div className="detail-item"><span className="detail-label">支付时间</span><span className="detail-value">{formatDateTime(currentItem.paid_at)}</span></div>
                <div className="detail-item"><span className="detail-label">创建时间</span><span className="detail-value">{formatDateTime(currentItem.created_at)}</span></div>
              </div>
            )}
            {activeTab === 'profit-shares' && (
              <div className="detail-grid">
                <div className="detail-item"><span className="detail-label">分润ID</span><span className="detail-value">{currentItem.id}</span></div>
                <div className="detail-item"><span className="detail-label">案件ID</span><span className="detail-value">{currentItem.case_id || '-'}</span></div>
                <div className="detail-item"><span className="detail-label">角色</span><span className="detail-value">{({
                  org: '律所',
                  lawyer: '律师',
                  sales: '销售',
                  marketing: '投放',
                  assistant: '助理',
                }[currentItem.role as string])}</span></div>
                <div className="detail-item"><span className="detail-label">分润比例</span><span className="detail-value" style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600 }}>{currentItem.percentage}%</span></div>
                <div className="detail-item"><span className="detail-label">分润金额</span><span className="detail-value" style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, color: '#0059b5' }}>¥{currentItem.amount?.toFixed(2) || '0.00'}</span></div>
                <div className="detail-item"><span className="detail-label">结算状态</span><span className="detail-value">
                  <StatusPill text={currentItem.paid ? '已支付' : '待支付'} kind={currentItem.paid ? 'green' : 'orange'} />
                </span></div>
                <div className="detail-item"><span className="detail-label">结算日期</span><span className="detail-value">{formatDateTime(currentItem.paid_at)}</span></div>
                <div className="detail-item"><span className="detail-label">创建时间</span><span className="detail-value">{formatDateTime(currentItem.created_at)}</span></div>
              </div>
            )}
            {activeTab === 'refunds' && (
              <div className="detail-grid">
                <div className="detail-item"><span className="detail-label">退款ID</span><span className="detail-value">{currentItem.id}</span></div>
                <div className="detail-item"><span className="detail-label">案件ID</span><span className="detail-value">{currentItem.case_id || '-'}</span></div>
                <div className="detail-item"><span className="detail-label">退款金额</span><span className="detail-value" style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, color: '#ba1a1a' }}>¥{currentItem.amount?.toFixed(2) || '0.00'}</span></div>
                <div className="detail-item"><span className="detail-label">退款原因</span><span className="detail-value">{currentItem.reason || '-'}</span></div>
                <div className="detail-item"><span className="detail-label">状态</span><span className="detail-value">
                  <StatusPill text={refundStatusLabelMap[currentItem.status as string] || currentItem.status} kind={refundStatusKindMap[currentItem.status as string] || 'neutral'} />
                </span></div>
                <div className="detail-item"><span className="detail-label">申请时间</span><span className="detail-value">{formatDateTime(currentItem.created_at)}</span></div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
