import { useState, useEffect } from 'react'
import { Table, Tag, Button, Modal, Form, Input, Select, Space, message, Tabs } from 'antd'
import { PlusOutlined, EyeOutlined, SearchOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import axios from '../api/axios'
import { formatDateTime } from '../utils/format'

export default function FinanceManagement() {
  const [activeTab, setActiveTab] = useState('fees')
  const [fees, setFees] = useState<any[]>([])
  const [profitShares, setProfitShares] = useState<any[]>([])
  const [refunds, setRefunds] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
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
    } else if (activeTab === 'invoices') {
      fetchInvoices()
    }
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

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const params: any = { org_id: user.organization_id }
      if (searchParams.status) params.status = searchParams.status

      const res = await axios.get('/finance/invoices', { params })
      setInvoices(res || [])
    } catch (error) {
      console.error('Fetch invoices error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    if (activeTab === 'fees') {
      fetchFees()
    } else if (activeTab === 'refunds') {
      fetchRefunds()
    } else if (activeTab === 'invoices') {
      fetchInvoices()
    }
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

  const invoiceStatusOptions = [
    { value: 'pending', label: '待开票' },
    { value: 'issued', label: '已开票' },
    { value: 'paid', label: '已支付' },
    { value: 'cancelled', label: '已作废' },
  ]

  const handleCreateInvoice = () => {
    form.resetFields()
    setModalVisible(true)
  }

  const handleSubmitInvoice = async (values: any) => {
    try {
      await axios.post('/finance/invoice', { ...values, organization_id: user.organization_id })
      setModalVisible(false)
      message.success('发票创建成功')
      fetchInvoices()
    } catch (error) {
      message.error('发票创建失败')
      console.error('Create invoice error:', error)
    }
  }

  const handleIssueInvoice = async (record: any) => {
    try {
      await axios.put(`/finance/invoice/${record.id}/issue`, { invoice_no: `FP${Date.now()}` })
      message.success('发票已开具')
      fetchInvoices()
    } catch (error) {
      message.error('操作失败')
      console.error('Issue invoice error:', error)
    }
  }

  const handleInvoicePaid = async (record: any) => {
    try {
      await axios.put(`/finance/invoice/${record.id}/paid`)
      message.success('发票已标记为已支付')
      fetchInvoices()
    } catch (error) {
      message.error('操作失败')
      console.error('Invoice paid error:', error)
    }
  }

  const handleCancelInvoice = async (record: any) => {
    try {
      await axios.put(`/finance/invoice/${record.id}/cancel`, { note: '用户取消' })
      message.success('发票已作废')
      fetchInvoices()
    } catch (error) {
      message.error('操作失败')
      console.error('Cancel invoice error:', error)
    }
  }

  const feeColumns = [
    { title: '费用ID', dataIndex: 'id', key: 'id', width: 120 },
    { title: '案件ID', dataIndex: 'case_id', key: 'case_id' },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (amount: number) => `¥${amount?.toFixed(2) || '0.00'}` },
    { title: '描述', dataIndex: 'description', key: 'description' },
    { title: '状态', dataIndex: 'paid', key: 'paid', render: (paid: boolean) => {
      return <Tag color={paid ? 'success' : 'default'}>{paid ? '已支付' : '未支付'}</Tag>
    }},
    { title: '支付时间', dataIndex: 'paid_at', key: 'paid_at', render: (val: string) => formatDateTime(val) },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (val: string) => formatDateTime(val) },
    { title: '操作', key: 'action', render: (_: any, record: any) => (
      <Space>
        <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
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
    { title: '分润比例', dataIndex: 'percentage', key: 'percentage', render: (ratio: number) => `${ratio}%` },
    { title: '分润金额', dataIndex: 'amount', key: 'amount', render: (amount: number) => `¥${amount?.toFixed(2) || '0.00'}` },
    { title: '结算状态', dataIndex: 'paid', key: 'paid', render: (paid: boolean) => {
      return <Tag color={paid ? 'success' : 'default'}>{paid ? '已支付' : '待支付'}</Tag>
    }},
    { title: '结算日期', dataIndex: 'paid_at', key: 'paid_at', render: (val: string) => formatDateTime(val) },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (val: string) => formatDateTime(val) },
    { title: '操作', key: 'action', render: (_: any, record: any) => (
      <Space>
        <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
        {!record.paid && (
          <Button size="small" type="primary" icon={<CheckCircleOutlined />}>确认支付</Button>
        )}
      </Space>
    )},
  ]

  const refundColumns = [
    { title: '退款ID', dataIndex: 'id', key: 'id', width: 120 },
    { title: '案件ID', dataIndex: 'case_id', key: 'case_id' },
    { title: '退款金额', dataIndex: 'amount', key: 'amount', render: (amount: number) => `¥${amount?.toFixed(2) || '0.00'}` },
    { title: '退款原因', dataIndex: 'reason', key: 'reason' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status: string) => {
      const colors: Record<string, string> = {
        pending: 'default',
        approved: 'green',
        rejected: 'red',
        processed: 'success',
      }
      const labels: Record<string, string> = {
        pending: '待审批',
        approved: '已通过',
        rejected: '已拒绝',
        processed: '已处理',
      }
      return <Tag color={colors[status]}>{labels[status]}</Tag>
    }},
    { title: '申请时间', dataIndex: 'created_at', key: 'created_at', render: (val: string) => formatDateTime(val) },
    { title: '操作', key: 'action', render: (_: any, record: any) => (
      <Space>
        <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
        {record.status === 'pending' && (
          <>
            <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => handleApproveRefund(record)}>通过</Button>
            <Button size="small" icon={<CloseCircleOutlined />} onClick={() => handleRejectRefund(record)}>拒绝</Button>
          </>
        )}
      </Space>
    )},
  ]

  const invoiceColumns = [
    { title: '发票ID', dataIndex: 'id', key: 'id', width: 120 },
    { title: '案件ID', dataIndex: 'case_id', key: 'case_id' },
    { title: '发票金额', dataIndex: 'amount', key: 'amount', render: (amount: number) => `¥${amount?.toFixed(2) || '0.00'}` },
    { title: '发票号码', dataIndex: 'invoice_no', key: 'invoice_no' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status: string) => {
      const colors: Record<string, string> = {
        pending: 'default',
        issued: 'blue',
        paid: 'green',
        cancelled: 'red',
      }
      const labels: Record<string, string> = {
        pending: '待开票',
        issued: '已开票',
        paid: '已支付',
        cancelled: '已作废',
      }
      return <Tag color={colors[status]}>{labels[status]}</Tag>
    }},
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (val: string) => formatDateTime(val) },
    { title: '操作', key: 'action', render: (_: any, record: any) => (
      <Space>
        <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
        {record.status === 'pending' && (
          <Button size="small" type="primary" onClick={() => handleIssueInvoice(record)}>开票</Button>
        )}
        {record.status === 'issued' && (
          <Button size="small" type="primary" onClick={() => handleInvoicePaid(record)}>标记支付</Button>
        )}
        {record.status === 'issued' && (
          <Button size="small" danger onClick={() => handleCancelInvoice(record)}>作废</Button>
        )}
      </Space>
    )},
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>财务管理</h2>
        {activeTab === 'fees' && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddFee}>创建费用</Button>
        )}
        {activeTab === 'invoices' && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateInvoice}>创建发票</Button>
        )}
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <Tabs.TabPane tab="费用管理" key="fees">
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
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
          <Table dataSource={fees} columns={feeColumns} loading={loading} rowKey="id" />
        </Tabs.TabPane>
        <Tabs.TabPane tab="分润管理" key="profit-shares">
          <Table dataSource={profitShares} columns={profitShareColumns} loading={loading} rowKey="id" />
        </Tabs.TabPane>
        <Tabs.TabPane tab="退款审批" key="refunds">
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
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
          <Table dataSource={refunds} columns={refundColumns} loading={loading} rowKey="id" />
        </Tabs.TabPane>
        <Tabs.TabPane tab="发票管理" key="invoices">
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <Select
              placeholder="状态筛选"
              style={{ width: 150 }}
              allowClear
              value={searchParams.status || undefined}
              onChange={(value) => setSearchParams({ ...searchParams, status: value || '' })}
            >
              {invoiceStatusOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
            </Select>
            <Button type="primary" onClick={handleSearch}>搜索</Button>
            <Button onClick={handleReset}>重置</Button>
          </div>
          <Table dataSource={invoices} columns={invoiceColumns} loading={loading} rowKey="id" />
        </Tabs.TabPane>
      </Tabs>

      <Modal
        title={activeTab === 'fees' ? '创建费用' : '创建发票'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form onFinish={activeTab === 'fees' ? handleSubmitFee : handleSubmitInvoice}>
          <Form.Item name="case_id" label="案件ID" rules={[{ required: true }]}>
            <Input placeholder="请输入案件ID" />
          </Form.Item>
          <Form.Item name="amount" label="金额" rules={[{ required: true }]}>
            <Input placeholder="请输入金额" />
          </Form.Item>
          {activeTab === 'fees' && (
            <Form.Item name="description" label="描述">
              <Input.TextArea placeholder="请输入费用描述" />
            </Form.Item>
          )}
          {activeTab === 'invoices' && (
            <Form.Item name="invoice_type" label="发票类型">
              <Select placeholder="请选择发票类型">
                <Select.Option value="personal">个人</Select.Option>
                <Select.Option value="company">企业</Select.Option>
              </Select>
            </Form.Item>
          )}
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div><span style={{ fontWeight: 'bold' }}>费用ID：</span>{currentItem.id}</div>
                <div><span style={{ fontWeight: 'bold' }}>案件ID：</span>{currentItem.case_id || '-'}</div>
                <div><span style={{ fontWeight: 'bold' }}>金额：</span>¥{currentItem.amount?.toFixed(2) || '0.00'}</div>
                <div><span style={{ fontWeight: 'bold' }}>描述：</span>{currentItem.description || '-'}</div>
                <div><span style={{ fontWeight: 'bold' }}>状态：</span>
                  <Tag color={currentItem.paid ? 'success' : 'default'}>{currentItem.paid ? '已支付' : '未支付'}</Tag>
                </div>
                <div><span style={{ fontWeight: 'bold' }}>支付时间：</span>{formatDateTime(currentItem.paid_at)}</div>
                <div><span style={{ fontWeight: 'bold' }}>创建时间：</span>{formatDateTime(currentItem.created_at)}</div>
              </div>
            )}
            {activeTab === 'profit-shares' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div><span style={{ fontWeight: 'bold' }}>分润ID：</span>{currentItem.id}</div>
                <div><span style={{ fontWeight: 'bold' }}>案件ID：</span>{currentItem.case_id || '-'}</div>
                <div><span style={{ fontWeight: 'bold' }}>角色：</span>{({
                  org: '律所',
                  lawyer: '律师',
                  sales: '销售',
                  marketing: '投放',
                  assistant: '助理',
                }[currentItem.role as string])}</div>
                <div><span style={{ fontWeight: 'bold' }}>分润比例：</span>{currentItem.percentage}%</div>
                <div><span style={{ fontWeight: 'bold' }}>分润金额：</span>¥{currentItem.amount?.toFixed(2) || '0.00'}</div>
                <div><span style={{ fontWeight: 'bold' }}>结算状态：</span>
                  <Tag color={currentItem.paid ? 'success' : 'default'}>{currentItem.paid ? '已支付' : '待支付'}</Tag>
                </div>
                <div><span style={{ fontWeight: 'bold' }}>结算日期：</span>{formatDateTime(currentItem.paid_at)}</div>
                <div><span style={{ fontWeight: 'bold' }}>创建时间：</span>{formatDateTime(currentItem.created_at)}</div>
              </div>
            )}
            {activeTab === 'refunds' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div><span style={{ fontWeight: 'bold' }}>退款ID：</span>{currentItem.id}</div>
                <div><span style={{ fontWeight: 'bold' }}>案件ID：</span>{currentItem.case_id || '-'}</div>
                <div><span style={{ fontWeight: 'bold' }}>退款金额：</span>¥{currentItem.amount?.toFixed(2) || '0.00'}</div>
                <div><span style={{ fontWeight: 'bold' }}>退款原因：</span>{currentItem.reason || '-'}</div>
                <div><span style={{ fontWeight: 'bold' }}>状态：</span>
                  <Tag color={{
                    pending: 'default',
                    approved: 'green',
                    rejected: 'red',
                    processed: 'success',
                  }[currentItem.status as string]}>
                    {{
                      pending: '待审批',
                      approved: '已通过',
                      rejected: '已拒绝',
                      processed: '已处理',
                    }[currentItem.status as string]}
                  </Tag>
                </div>
                <div><span style={{ fontWeight: 'bold' }}>申请时间：</span>{formatDateTime(currentItem.created_at)}</div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
