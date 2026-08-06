import { useState, useEffect, useMemo } from 'react'
import { Table, Button, Modal, Form, Input, Select, Space, message, Tabs, Card, DatePicker, Popconfirm, InputNumber } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import {
  getInvoices,
  createInvoice,
  voidInvoice,
  redFlushInvoice,
  deleteInvoice,
  refundInvoice,
  adjustInvoice,
} from '../api/invoice'
import { formatDate } from '../utils/format'
import dayjs, { Dayjs } from 'dayjs'
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

const searchBarStyle: React.CSSProperties = {
  background: theme.white,
  padding: 16,
  borderRadius: 12,
  border: `1px solid ${theme.border}`,
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
  blue: { bg: 'rgba(0, 113, 227, 0.1)', color: theme.primary },
  gold: { bg: 'rgba(201, 169, 97, 0.15)', color: '#8c702e' },
  green: { bg: 'rgba(46, 125, 50, 0.1)', color: theme.success },
  red: { bg: 'rgba(186, 26, 26, 0.1)', color: theme.error },
  orange: { bg: 'rgba(237, 108, 2, 0.1)', color: theme.warning },
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

// 发票类型映射
const invoiceTypeLabelMap: Record<string, string> = {
  normal: '普票',
  special: '专票',
  electronic: '电子发票',
}

// 发票状态映射
const statusKindMap: Record<string, PillKind> = {
  issued: 'blue',
  voided: 'red',
  red_flushed: 'purple',
  pending: 'neutral',
  paid: 'green',
  cancelled: 'red',
}

const statusLabelMap: Record<string, string> = {
  issued: '已开具',
  voided: '已作废',
  red_flushed: '已冲红',
  pending: '待开票',
  paid: '已支付',
  cancelled: '已作废',
}

const { RangePicker } = DatePicker

export default function InvoiceManagement() {
  const [activeTab, setActiveTab] = useState('issued')
  const [list, setList] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [voidModalVisible, setVoidModalVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState<Record<string, unknown> | null>(null)
  const [voidReason, setVoidReason] = useState('')
  // 退款弹窗状态
  const [refundModalVisible, setRefundModalVisible] = useState(false)
  const [refundForm] = Form.useForm()
  // 调账弹窗状态
  const [adjustModalVisible, setAdjustModalVisible] = useState(false)
  const [adjustForm] = Form.useForm()
  const [form] = Form.useForm()
  const [searchParams, setSearchParams] = useState({
    type: '',
    keyword: '',
    dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
  })

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // 监听表单金额和税率变化，自动计算税额和价税合计
  const amountWatch = Form.useWatch('amount', form)
  const taxRateWatch = Form.useWatch('tax_rate', form)

  const taxAmount = useMemo(() => {
    const amt = Number(amountWatch) || 0
    const rate = Number(taxRateWatch) || 0
    return Math.round(amt * rate * 100) / 100
  }, [amountWatch, taxRateWatch])

  const totalAmount = useMemo(() => {
    const amt = Number(amountWatch) || 0
    return Math.round((amt + taxAmount) * 100) / 100
  }, [amountWatch, taxAmount])

  const fetchList = async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = {
        org_id: user.organization_id,
        status: activeTab,
      }
      if (searchParams.type) params.type = searchParams.type
      if (searchParams.keyword) params.keyword = searchParams.keyword
      if (searchParams.dateRange) {
        params.start_date = searchParams.dateRange[0].format('YYYY-MM-DD')
        params.end_date = searchParams.dateRange[1].format('YYYY-MM-DD')
      }
      const res = await getInvoices(params)
      setList((res as Record<string, unknown>[]) || [])
    } catch (error) {
      // 错误已由拦截器统一处理
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

  const handleReset = () => {
    setSearchParams({ type: '', keyword: '', dateRange: null })
    setTimeout(() => fetchList(), 0)
  }

  const handleAdd = () => {
    form.resetFields()
    // 发票号自动生成
    form.setFieldsValue({
      invoice_no: `FP${Date.now()}`,
      tax_rate: 0.06,
      issue_date: dayjs(),
    })
    setModalVisible(true)
  }

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      const data = {
        ...values,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        issue_date: values.issue_date ? (values.issue_date as dayjs.Dayjs).format('YYYY-MM-DD') : undefined,
        organization_id: user.organization_id,
      }
      await createInvoice(data)
      setModalVisible(false)
      message.success('发票开具成功')
      fetchList()
    } catch (error) {
      message.error('开票失败')
    }
  }

  const handleVoid = (record: Record<string, unknown>) => {
    setCurrentRecord(record)
    setVoidReason('')
    setVoidModalVisible(true)
  }

  const handleVoidSubmit = async () => {
    if (!voidReason.trim()) {
      message.warning('请填写作废原因')
      return
    }
    if (!currentRecord) return
    try {
      await voidInvoice(currentRecord.id as string, voidReason)
      message.success('发票已作废')
      setVoidModalVisible(false)
      fetchList()
    } catch (error) {
      message.error('作废失败')
    }
  }

  const handleRedFlush = async (record: Record<string, unknown>) => {
    try {
      await redFlushInvoice(record.id as string)
      message.success('发票已冲红')
      fetchList()
    } catch (error) {
      message.error('冲红失败')
    }
  }

  const handleDelete = async (record: Record<string, unknown>) => {
    try {
      await deleteInvoice(record.id as string)
      message.success('删除成功')
      fetchList()
    } catch (error) {
      message.error('删除失败')
    }
  }

  // 打开退款弹窗
  const handleRefund = (record: Record<string, unknown>) => {
    setCurrentRecord(record)
    refundForm.resetFields()
    refundForm.setFieldsValue({ date: dayjs() })
    setRefundModalVisible(true)
  }

  // 提交退款
  const handleRefundSubmit = async () => {
    if (!currentRecord) return
    try {
      const values = await refundForm.validateFields()
      const data = {
        amount: Number(values.amount),
        date: values.date ? (values.date as dayjs.Dayjs).format('YYYY-MM-DD') : '',
      }
      await refundInvoice(currentRecord.id as string, data)
      message.success('退款成功')
      setRefundModalVisible(false)
      fetchList()
    } catch (error: unknown) {
      if ((error as { errorFields?: unknown })?.errorFields) return
      message.error('退款失败')
    }
  }

  // 打开调账弹窗
  const handleAdjust = (record: Record<string, unknown>) => {
    setCurrentRecord(record)
    adjustForm.resetFields()
    setAdjustModalVisible(true)
  }

  // 提交调账
  const handleAdjustSubmit = async () => {
    if (!currentRecord) return
    try {
      const values = await adjustForm.validateFields()
      const data = {
        reason: values.reason,
        amount: Number(values.amount),
        operator_id: user.id,
      }
      await adjustInvoice(currentRecord.id as string, data)
      message.success('调账成功')
      setAdjustModalVisible(false)
      fetchList()
    } catch (error: unknown) {
      if ((error as { errorFields?: unknown })?.errorFields) return
      message.error('调账失败')
    }
  }

  const columns = [
    { title: '发票号', dataIndex: 'invoice_no', key: 'invoice_no', width: 160 },
    {
      title: '类型',
      dataIndex: 'invoice_type',
      key: 'invoice_type',
      render: (v: string) => invoiceTypeLabelMap[v] || v || '-',
    },
    { title: '购方', dataIndex: 'buyer_name', key: 'buyer_name', render: (v: string) => v || '-' },
    { title: '销方', dataIndex: 'seller_name', key: 'seller_name', render: (v: string) => v || '-' },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (v: number) => (
        <span style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, color: theme.textBase }}>
          ¥{Number(v || 0).toFixed(2)}
        </span>
      ),
    },
    {
      title: '税额',
      dataIndex: 'tax_amount',
      key: 'tax_amount',
      render: (v: number) => (
        <span style={{ color: theme.textSecondary }}>¥{Number(v || 0).toFixed(2)}</span>
      ),
    },
    {
      title: '价税合计',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (v: number) => (
        <span style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, color: theme.primaryDark }}>
          ¥{Number(v || 0).toFixed(2)}
        </span>
      ),
    },
    { title: '开票日期', dataIndex: 'issue_date', key: 'issue_date', render: (v: string) => formatDate(v) },
    {
      title: '冲红日期',
      dataIndex: 'red_flush_date',
      key: 'red_flush_date',
      render: (v: string) => formatDate(v),
    },
    {
      title: '退款金额',
      dataIndex: 'refund_amount',
      key: 'refund_amount',
      render: (v: number) => (
        <span style={{ color: theme.error }}>¥{Number(v || 0).toFixed(2)}</span>
      ),
    },
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
      width: 320,
      render: (_: unknown, record: Record<string, unknown>) => (
        <Space className="stitch-btn-group">
          {record.status === 'issued' && (
            <Button type="link" size="small" danger onClick={() => handleVoid(record)}>作废</Button>
          )}
          {record.status === 'issued' && (
            <Button type="link" size="small" onClick={() => handleRedFlush(record)}>冲红</Button>
          )}
          {record.status !== 'cancelled' && (
            <Button type="link" size="small" onClick={() => handleRefund(record)}>退款</Button>
          )}
          <Button type="link" size="small" onClick={() => handleAdjust(record)}>调账</Button>
          <Popconfirm title="确认删除该发票？" onConfirm={() => handleDelete(record)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const tabItems = [
    { key: 'issued', label: '已开具' },
    { key: 'voided', label: '已作废' },
    { key: 'red_flushed', label: '已冲红' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
        <h2 style={pageH2Style}>发票管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>开票</Button>
      </div>

      <div className="search-bar stitch-filter-bar" style={searchBarStyle}>
        <Select
          placeholder="发票类型"
          style={{ width: 140 }}
          allowClear
          value={searchParams.type || undefined}
          onChange={(value) => setSearchParams({ ...searchParams, type: value || '' })}
          options={[
            { value: 'normal', label: '普票' },
            { value: 'special', label: '专票' },
            { value: 'electronic', label: '电子发票' },
          ]}
        />
        <Input
          placeholder="购方名称搜索"
          prefix={<SearchOutlined />}
          style={{ width: 200 }}
          value={searchParams.keyword}
          onChange={(e) => setSearchParams({ ...searchParams, keyword: e.target.value })}
          onPressEnter={handleSearch}
        />
        <RangePicker
          value={searchParams.dateRange}
          onChange={(dates) => setSearchParams({ ...searchParams, dateRange: dates as [Dayjs, Dayjs] | null })}
        />
        <Button type="primary" onClick={handleSearch}>搜索</Button>
        <Button onClick={handleReset}>重置</Button>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems.map(t => ({ key: t.key, label: t.label }))} />

      <Card className="stitch-table" style={tableCardStyle} styles={{ body: { padding: 0 } }}>
        <Table dataSource={list} columns={columns} loading={loading} rowKey="id" size="small" pagination={{ pageSize: 10 }} scroll={{ x: 2000 }} />
      </Card>

      <Modal
        title="开具发票"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={680}
      >
        <Form onFinish={handleSubmit} form={form} layout="vertical">
          <Form.Item name="invoice_no" label="发票号" rules={[{ required: true }]}>
            <Input disabled />
          </Form.Item>
          <Form.Item name="invoice_type" label="发票类型" rules={[{ required: true, message: '请选择发票类型' }]}>
            <Select placeholder="请选择发票类型" options={[
              { value: 'normal', label: '普票' },
              { value: 'special', label: '专票' },
              { value: 'electronic', label: '电子发票' },
            ]} />
          </Form.Item>
          <Form.Item name="case_id" label="关联案件">
            <Input placeholder="请输入关联案件ID（可空）" />
          </Form.Item>

          <div style={{ fontWeight: 600, marginBottom: 8, color: theme.textBase }}>购方信息</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <Form.Item name="buyer_name" label="购方名称">
              <Input placeholder="购方名称" />
            </Form.Item>
            <Form.Item name="buyer_tax_no" label="购方税号">
              <Input placeholder="购方税号" />
            </Form.Item>
            <Form.Item name="buyer_address" label="购方地址">
              <Input placeholder="购方地址" />
            </Form.Item>
            <Form.Item name="buyer_phone" label="购方电话">
              <Input placeholder="购方电话" />
            </Form.Item>
            <Form.Item name="buyer_bank" label="购方开户行">
              <Input placeholder="购方开户行" />
            </Form.Item>
            <Form.Item name="buyer_account" label="购方账号">
              <Input placeholder="购方账号" />
            </Form.Item>
          </div>

          <div style={{ fontWeight: 600, marginBottom: 8, color: theme.textBase }}>销方信息</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <Form.Item name="seller_name" label="销方名称">
              <Input placeholder="销方名称" />
            </Form.Item>
            <Form.Item name="seller_tax_no" label="销方税号">
              <Input placeholder="销方税号" />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 12px' }}>
            <Form.Item name="amount" label="金额" rules={[{ required: true, message: '请输入金额' }]}>
              <InputNumber placeholder="金额" style={{ width: '100%' }} min={0} step={0.01} />
            </Form.Item>
            <Form.Item name="tax_rate" label="税率" rules={[{ required: true }]}>
              <InputNumber placeholder="税率" style={{ width: '100%' }} min={0} max={1} step={0.01} />
            </Form.Item>
            <Form.Item label="税额（自动）">
              <Input value={`¥${taxAmount.toFixed(2)}`} disabled />
            </Form.Item>
          </div>
          <Form.Item label="价税合计（自动）">
            <Input value={`¥${totalAmount.toFixed(2)}`} disabled style={{ fontWeight: 600, color: theme.primaryDark }} />
          </Form.Item>
          <Form.Item name="issue_date" label="开票日期" rules={[{ required: true, message: '请选择开票日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">确认开票</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="发票作废"
        open={voidModalVisible}
        onCancel={() => setVoidModalVisible(false)}
        onOk={handleVoidSubmit}
        okText="确认作废"
        okButtonProps={{ danger: true }}
      >
        <p>发票号：{String(currentRecord?.invoice_no ?? '')}</p>
        <Input.TextArea
          placeholder="请填写作废原因（必填）"
          value={voidReason}
          onChange={(e) => setVoidReason(e.target.value)}
          rows={3}
        />
      </Modal>

      {/* 退款弹窗 */}
      <Modal
        title="发票退款"
        open={refundModalVisible}
        onCancel={() => setRefundModalVisible(false)}
        onOk={handleRefundSubmit}
        okText="确认退款"
      >
        <p>发票号：{String(currentRecord?.invoice_no ?? '')}</p>
        <Form form={refundForm} layout="vertical">
          <Form.Item name="amount" label="退款金额" rules={[{ required: true, message: '请输入退款金额' }]}>
            <InputNumber placeholder="请输入退款金额" style={{ width: '100%' }} min={0} step={0.01} />
          </Form.Item>
          <Form.Item name="date" label="退款日期" rules={[{ required: true, message: '请选择退款日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 调账弹窗 */}
      <Modal
        title="发票调账"
        open={adjustModalVisible}
        onCancel={() => setAdjustModalVisible(false)}
        onOk={handleAdjustSubmit}
        okText="确认调账"
      >
        <p>发票号：{String(currentRecord?.invoice_no ?? '')}</p>
        <Form form={adjustForm} layout="vertical">
          <Form.Item name="reason" label="调账原因" rules={[{ required: true, message: '请输入调账原因' }]}>
            <Input.TextArea placeholder="请输入调账原因" rows={3} />
          </Form.Item>
          <Form.Item name="amount" label="调账金额" rules={[{ required: true, message: '请输入调账金额' }]}>
            <InputNumber placeholder="请输入调账金额" style={{ width: '100%' }} step={0.01} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
