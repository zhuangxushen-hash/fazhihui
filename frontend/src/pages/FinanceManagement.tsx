import { useState, useEffect, useMemo } from 'react'
import { Table, Button, Modal, Form, Input, Select, Space, message, Tabs, Card } from 'antd'
import { PlusOutlined, EyeOutlined, SearchOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
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

// === MD3 Status Pill (Soft Background Style) ===
// 对齐 Stitch 设计规范：使用 stitch-tag 胶囊标签 + 圆点前缀 + 变体类配色
type PillKind = 'neutral' | 'blue' | 'gold' | 'green' | 'red' | 'orange' | 'purple' | 'cyan' | 'geekblue'

// PillKind 到 Stitch Tag 变体类的映射（保留原 kind 语义）
const pillToStitchClassMap: Record<PillKind, string> = {
  neutral: 'stitch-tag',                  // 默认灰：stitch-tag 本身
  blue: 'stitch-tag stitch-tag-info',     // 蓝
  gold: 'stitch-tag stitch-tag-gold',     // 暗金
  green: 'stitch-tag stitch-tag-success', // 绿
  red: 'stitch-tag stitch-tag-error',     // 红
  orange: 'stitch-tag stitch-tag-warning',// 橙
  purple: 'stitch-tag',                   // 无对应变体：通过内联 style 保持原色
  cyan: 'stitch-tag',                     // 无对应变体：通过内联 style 保持原色
  geekblue: 'stitch-tag',                 // 无对应变体：通过内联 style 保持原色
}

// Stitch 变体类未覆盖的特殊颜色，保留原色内联样式
const pillInlineFallbackMap: Partial<Record<PillKind, { bg: string; color: string }>> = {
  purple: { bg: 'rgba(114, 46, 209, 0.1)', color: '#722ed1' },
  cyan: { bg: 'rgba(0, 166, 167, 0.1)', color: '#00a6a7' },
  geekblue: { bg: 'rgba(47, 84, 235, 0.1)', color: '#2f54eb' },
}

const StatusPill = ({ text, kind }: { text: string; kind: PillKind }) => {
  const className = pillToStitchClassMap[kind] || 'stitch-tag'
  const fallback = pillInlineFallbackMap[kind]
  const style: React.CSSProperties | undefined = fallback
    ? { background: fallback.bg, color: fallback.color, borderColor: `${fallback.color}33` }
    : undefined
  return (
    <span className={className} style={style}>
      {text}
    </span>
  )
}

// === Finance Status Mappings (Preserved) ===
// 未支付状态由 neutral 改为 orange（warning 警示色，更符合 Stitch 语义）
const refundStatusKindMap: Record<string, PillKind> = {
  pending: 'orange',  // 待审批 → 橙色警示，需要关注
  approved: 'green',  // 已通过 → 绿色成功
  rejected: 'red',    // 已拒绝 → 红色错误
  processed: 'green', // 已处理 → 绿色成功
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
  const [fees, setFees] = useState<Record<string, unknown>[]>([])
  const [profitShares, setProfitShares] = useState<Record<string, unknown>[]>([])
  const [refunds, setRefunds] = useState<Record<string, unknown>[]>([])
  // 发票管理已合并到专用发票管理页（InvoiceManagement.tsx），此处不再维护
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [form] = Form.useForm()
  const [currentItem, setCurrentItem] = useState<Record<string, unknown> | null>(null)
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
      const params: Record<string, unknown> = { org_id: user.organization_id }
      if (searchParams.case_id) params.case_id = searchParams.case_id

      const res = await axios.get('/finance/fees', { params })
      setFees((res as Record<string, unknown>[]) || [])
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }

  const fetchProfitShares = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/finance/profit-share', { params: { org_id: user.organization_id } })
      setProfitShares((res as Record<string, unknown>[]) || [])
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }

  const fetchRefunds = async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { org_id: user.organization_id }
      if (searchParams.status) params.status = searchParams.status

      const res = await axios.get('/finance/refunds', { params })
      setRefunds((res as Record<string, unknown>[]) || [])
    } catch (error) {
      // 错误已由拦截器统一处理
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

  const handleSubmitFee = async (values: Record<string, unknown>) => {
    try {
      await axios.post('/finance/fee', { ...values, organization_id: user.organization_id })
      setModalVisible(false)
      message.success('费用创建成功')
      fetchFees()
    } catch (error) {
      message.error('费用创建失败')
    }
  }

  const handleViewDetail = (record: Record<string, unknown>) => {
    setCurrentItem(record)
    setDetailVisible(true)
  }

  const handleMarkPaid = async (record: Record<string, unknown>) => {
    try {
      await axios.put(`/finance/fee/${record.id}/paid`)
      message.success('费用已标记为已支付')
      fetchFees()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleApproveRefund = async (record: Record<string, unknown>) => {
    try {
      await axios.put(`/finance/refund/${record.id}/approve`, { approved_by: user.id })
      message.success('退款已审批通过')
      fetchRefunds()
    } catch (error) {
      message.error('审批失败')
    }
  }

  const handleRejectRefund = async (record: Record<string, unknown>) => {
    try {
      await axios.put(`/finance/refund/${record.id}/reject`, { note: '拒绝退款' })
      message.success('退款已拒绝')
      fetchRefunds()
    } catch (error) {
      message.error('操作失败')
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
      <span style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, color: theme.primaryDark }}>¥{amount?.toFixed(2) || '0.00'}</span>
    ) },
    { title: '描述', dataIndex: 'description', key: 'description' },
    { title: '状态', dataIndex: 'paid', key: 'paid', render: (paid: boolean) => (
      // Stitch 语义：未支付用警示橙，已支付用成功绿
      <StatusPill text={paid ? '已支付' : '未支付'} kind={paid ? 'green' : 'orange'} />
    )},
    { title: '支付时间', dataIndex: 'paid_at', key: 'paid_at', render: (val: string) => formatDateTime(val) },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (val: string) => formatDateTime(val) },
    { title: '操作', key: 'action', render: (_: unknown, record: Record<string, unknown>) => (
      <Space className="stitch-btn-group">
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
      <span style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, color: theme.textBase }}>{ratio}%</span>
    ) },
    { title: '分润金额', dataIndex: 'amount', key: 'amount', render: (amount: number) => (
      <span style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, color: theme.primaryDark }}>¥{amount?.toFixed(2) || '0.00'}</span>
    ) },
    { title: '结算状态', dataIndex: 'paid', key: 'paid', render: (paid: boolean) => (
      <StatusPill text={paid ? '已支付' : '待支付'} kind={paid ? 'green' : 'orange'} />
    )},
    { title: '结算日期', dataIndex: 'paid_at', key: 'paid_at', render: (val: string) => formatDateTime(val) },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (val: string) => formatDateTime(val) },
    { title: '操作', key: 'action', render: (_: unknown, record: Record<string, unknown>) => (
      <Space className="stitch-btn-group">
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
      <span style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, color: theme.error }}>¥{amount?.toFixed(2) || '0.00'}</span>
    ) },
    { title: '退款原因', dataIndex: 'reason', key: 'reason' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status: string) => (
      <StatusPill text={refundStatusLabelMap[status] || status} kind={refundStatusKindMap[status] || 'neutral'} />
    )},
    { title: '申请时间', dataIndex: 'created_at', key: 'created_at', render: (val: string) => formatDateTime(val) },
    { title: '操作', key: 'action', render: (_: unknown, record: Record<string, unknown>) => (
      <Space className="stitch-btn-group">
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
          <div className="stitch-filter-bar">
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
          <Card className="stitch-table" style={tableCardStyle} styles={{ body: { padding: 0 } }}>
            <Table dataSource={fees} columns={feeColumns} loading={loading} rowKey="id" size="small" />
          </Card>
        </>
      ),
    },
    {
      key: 'profit-shares',
      label: '分润管理',
      children: (
        <Card className="stitch-table" style={tableCardStyle} styles={{ body: { padding: 0 } }}>
          <Table dataSource={profitShares} columns={profitShareColumns} loading={loading} rowKey="id" size="small" />
        </Card>
      ),
    },
    {
      key: 'refunds',
      label: '退款审批',
      children: (
        <>
          <div className="stitch-filter-bar">
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
          <Card className="stitch-table" style={tableCardStyle} styles={{ body: { padding: 0 } }}>
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
        {currentItem && (() => {
          const ci = currentItem as Record<string, unknown>
          return (
          <div>
            {activeTab === 'fees' && (
              <div className="detail-grid">
                <div className="detail-item"><span className="detail-label">费用ID</span><span className="detail-value">{String(ci.id ?? '')}</span></div>
                <div className="detail-item"><span className="detail-label">案件ID</span><span className="detail-value">{String(ci.case_id || '-')}</span></div>
                <div className="detail-item"><span className="detail-label">金额</span><span className="detail-value" style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, color: theme.primaryDark }}>¥{(ci.amount as number)?.toFixed(2) || '0.00'}</span></div>
                <div className="detail-item"><span className="detail-label">描述</span><span className="detail-value">{String(ci.description || '-')}</span></div>
                <div className="detail-item"><span className="detail-label">状态</span><span className="detail-value">
                  <StatusPill text={ci.paid ? '已支付' : '未支付'} kind={ci.paid ? 'green' : 'neutral'} />
                </span></div>
                <div className="detail-item"><span className="detail-label">支付时间</span><span className="detail-value">{formatDateTime(ci.paid_at as string)}</span></div>
                <div className="detail-item"><span className="detail-label">创建时间</span><span className="detail-value">{formatDateTime(ci.created_at as string)}</span></div>
              </div>
            )}
            {activeTab === 'profit-shares' && (
              <div className="detail-grid">
                <div className="detail-item"><span className="detail-label">分润ID</span><span className="detail-value">{String(ci.id ?? '')}</span></div>
                <div className="detail-item"><span className="detail-label">案件ID</span><span className="detail-value">{String(ci.case_id || '-')}</span></div>
                <div className="detail-item"><span className="detail-label">角色</span><span className="detail-value">{({
                  org: '律所',
                  lawyer: '律师',
                  sales: '销售',
                  marketing: '投放',
                  assistant: '助理',
                }[ci.role as string])}</span></div>
                <div className="detail-item"><span className="detail-label">分润比例</span><span className="detail-value" style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600 }}>{String(ci.percentage)}%</span></div>
                <div className="detail-item"><span className="detail-label">分润金额</span><span className="detail-value" style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, color: theme.primaryDark }}>¥{(ci.amount as number)?.toFixed(2) || '0.00'}</span></div>
                <div className="detail-item"><span className="detail-label">结算状态</span><span className="detail-value">
                  <StatusPill text={ci.paid ? '已支付' : '待支付'} kind={ci.paid ? 'green' : 'orange'} />
                </span></div>
                <div className="detail-item"><span className="detail-label">结算日期</span><span className="detail-value">{formatDateTime(ci.paid_at as string)}</span></div>
                <div className="detail-item"><span className="detail-label">创建时间</span><span className="detail-value">{formatDateTime(ci.created_at as string)}</span></div>
              </div>
            )}
            {activeTab === 'refunds' && (
              <div className="detail-grid">
                <div className="detail-item"><span className="detail-label">退款ID</span><span className="detail-value">{String(ci.id ?? '')}</span></div>
                <div className="detail-item"><span className="detail-label">案件ID</span><span className="detail-value">{String(ci.case_id || '-')}</span></div>
                <div className="detail-item"><span className="detail-label">退款金额</span><span className="detail-value" style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, color: theme.error }}>¥{(ci.amount as number)?.toFixed(2) || '0.00'}</span></div>
                <div className="detail-item"><span className="detail-label">退款原因</span><span className="detail-value">{String(ci.reason || '-')}</span></div>
                <div className="detail-item"><span className="detail-label">状态</span><span className="detail-value">
                  <StatusPill text={refundStatusLabelMap[ci.status as string] || String(ci.status)} kind={refundStatusKindMap[ci.status as string] || 'neutral'} />
                </span></div>
                <div className="detail-item"><span className="detail-label">申请时间</span><span className="detail-value">{formatDateTime(ci.created_at as string)}</span></div>
              </div>
            )}
          </div>
          )
        })()}
      </Modal>
    </div>
  )
}
