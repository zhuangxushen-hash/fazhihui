import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, Space, message, Card, DatePicker, Popconfirm, InputNumber, Statistic, Row, Col, Tag } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import {
  getBusinessFunds,
  createBusinessFund,
  updateBusinessFund,
  deleteBusinessFund,
  getBusinessFundStats,
  accountFund,
  allocateFund,
  taxShareFund,
} from '../api/business-fund'
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
type PillKind = 'neutral' | 'blue' | 'green' | 'red'

const pillColorMap: Record<PillKind, { bg: string; color: string }> = {
  neutral: { bg: 'rgba(113, 119, 133, 0.12)', color: '#5f6672' },
  blue: { bg: 'rgba(0, 113, 227, 0.1)', color: theme.primary },
  green: { bg: 'rgba(46, 125, 50, 0.1)', color: theme.success },
  red: { bg: 'rgba(186, 26, 26, 0.1)', color: theme.error },
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

// 类型映射
const typeKindMap: Record<string, PillKind> = {
  income: 'green',
  expense: 'red',
}

const typeLabelMap: Record<string, string> = {
  income: '收入',
  expense: '支出',
}

// 分类映射
const categoryLabelMap: Record<string, string> = {
  lawyer_fee: '律师费',
  agency_fee: '代理费',
  preservation_fee: '保全费',
  appraisal_fee: '鉴定费',
  other: '其他',
}

// 入账状态映射
const accountStatusLabelMap: Record<string, string> = {
  pending: '待入账',
  accounted: '已入账',
}

const { RangePicker } = DatePicker

export default function BusinessFundManagement() {
  const [list, setList] = useState<Record<string, unknown>[]>([])
  const [stats, setStats] = useState({ total_income: 0, total_expense: 0, net_amount: 0 })
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form] = Form.useForm()
  // 当前操作的记录（用于分账、税费分摊等弹窗）
  const [currentRecord, setCurrentRecord] = useState<Record<string, unknown> | null>(null)
  // 分账弹窗状态
  const [allocateModalVisible, setAllocateModalVisible] = useState(false)
  const [allocateRecords, setAllocateRecords] = useState<Array<{ role: string; amount: number }>>([])
  const [allocateRole, setAllocateRole] = useState('')
  const [allocateAmount, setAllocateAmount] = useState<number | null>(null)
  // 税费分摊弹窗状态
  const [taxShareModalVisible, setTaxShareModalVisible] = useState(false)
  const [taxShareAmount, setTaxShareAmount] = useState<number | null>(null)
  const [searchParams, setSearchParams] = useState({
    type: '',
    category: '',
    keyword: '',
    dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
  })

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const fetchList = async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { org_id: user.organization_id }
      if (searchParams.type) params.type = searchParams.type
      if (searchParams.category) params.category = searchParams.category
      if (searchParams.keyword) params.keyword = searchParams.keyword
      if (searchParams.dateRange) {
        params.start_date = searchParams.dateRange[0].format('YYYY-MM-DD')
        params.end_date = searchParams.dateRange[1].format('YYYY-MM-DD')
      }
      const res = await getBusinessFunds(params as Parameters<typeof getBusinessFunds>[0])
      setList((res as Record<string, unknown>[]) || [])
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const params: Record<string, unknown> = { org_id: user.organization_id }
      if (searchParams.dateRange) {
        params.start_date = searchParams.dateRange[0].format('YYYY-MM-DD')
        params.end_date = searchParams.dateRange[1].format('YYYY-MM-DD')
      }
      const res = await getBusinessFundStats(params as Parameters<typeof getBusinessFundStats>[0])
      setStats((res as { total_income: number; total_expense: number; net_amount: number }) || { total_income: 0, total_expense: 0, net_amount: 0 })
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  useEffect(() => {
    fetchList()
    fetchStats()
  }, [])

  const handleSearch = () => {
    fetchList()
    fetchStats()
  }

  const handleReset = () => {
    setSearchParams({ type: '', category: '', keyword: '', dateRange: null })
    setTimeout(() => {
      fetchList()
      fetchStats()
    }, 0)
  }

  const handleAdd = () => {
    setEditId(null)
    form.resetFields()
    form.setFieldsValue({
      type: 'income',
      category: 'lawyer_fee',
      payment_date: dayjs(),
    })
    setModalVisible(true)
  }

  const handleEdit = (record: Record<string, unknown>) => {
    setEditId(record.id as string)
    form.setFieldsValue({
      ...record,
      payment_date: record.payment_date ? dayjs(record.payment_date as string) : undefined,
    })
    setModalVisible(true)
  }

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      const data = {
        ...values,
        payment_date: values.payment_date ? (values.payment_date as dayjs.Dayjs).format('YYYY-MM-DD') : undefined,
        organization_id: user.organization_id,
      }
      if (editId) {
        await updateBusinessFund(editId, data)
        message.success('更新成功')
      } else {
        await createBusinessFund(data)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchList()
      fetchStats()
    } catch (error) {
      message.error(editId ? '更新失败' : '创建失败')
    }
  }

  const handleDelete = async (record: Record<string, unknown>) => {
    try {
      await deleteBusinessFund(record.id as string)
      message.success('删除成功')
      fetchList()
      fetchStats()
    } catch (error) {
      message.error('删除失败')
    }
  }

  // 入账
  const handleAccount = async (record: Record<string, unknown>) => {
    try {
      await accountFund(record.id as string)
      message.success('入账成功')
      fetchList()
      fetchStats()
    } catch (error) {
      message.error('入账失败')
    }
  }

  // 打开分账弹窗
  const handleAllocateOpen = (record: Record<string, unknown>) => {
    setCurrentRecord(record)
    // 读取已有分账记录
    let existing: Array<{ role: string; amount: number }> = []
    if (record.allocation_records) {
      try {
        existing = JSON.parse(record.allocation_records as string)
        if (!Array.isArray(existing)) existing = []
      } catch (e) {
        existing = []
      }
    }
    setAllocateRecords(existing)
    setAllocateRole('')
    setAllocateAmount(null)
    setAllocateModalVisible(true)
  }

  // 添加一行分账记录
  const handleAddAllocateItem = () => {
    if (!allocateRole.trim()) {
      message.warning('请输入角色')
      return
    }
    if (allocateAmount === null || isNaN(Number(allocateAmount))) {
      message.warning('请输入金额')
      return
    }
    setAllocateRecords([
      ...allocateRecords,
      { role: allocateRole.trim(), amount: Number(allocateAmount) },
    ])
    setAllocateRole('')
    setAllocateAmount(null)
  }

  // 删除一行分账记录
  const handleRemoveAllocateItem = (idx: number) => {
    setAllocateRecords(allocateRecords.filter((_, i) => i !== idx))
  }

  // 提交分账
  const handleAllocateSubmit = async () => {
    try {
      await allocateFund(currentRecord!.id as string, allocateRecords)
      message.success('分账成功')
      setAllocateModalVisible(false)
      fetchList()
    } catch (error) {
      message.error('分账失败')
    }
  }

  // 打开税费分摊弹窗
  const handleTaxShareOpen = (record: Record<string, unknown>) => {
    setCurrentRecord(record)
    setTaxShareAmount(Number(record.tax_share) || 0)
    setTaxShareModalVisible(true)
  }

  // 提交税费分摊
  const handleTaxShareSubmit = async () => {
    if (taxShareAmount === null || isNaN(Number(taxShareAmount))) {
      message.warning('请输入税费金额')
      return
    }
    try {
      await taxShareFund(currentRecord!.id as string, Number(taxShareAmount))
      message.success('税费分摊成功')
      setTaxShareModalVisible(false)
      fetchList()
    } catch (error) {
      message.error('税费分摊失败')
    }
  }

  const columns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (v: string) => (
        <StatusPill text={typeLabelMap[v] || v} kind={typeKindMap[v] || 'neutral'} />
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (v: string) => categoryLabelMap[v] || v || '-',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (v: number, record: Record<string, unknown>) => (
        <span
          style={{
            fontFamily: "'Noto Serif SC', serif",
            fontWeight: 600,
            color: record.type === 'income' ? theme.success : theme.error,
          }}
        >
          ¥{Number(v || 0).toFixed(2)}
        </span>
      ),
    },
    { title: '付款方', dataIndex: 'payer', key: 'payer' },
    { title: '收款方', dataIndex: 'payee', key: 'payee' },
    { title: '付款日期', dataIndex: 'payment_date', key: 'payment_date', render: (v: string) => formatDate(v) },
    { title: '案件', dataIndex: 'case_id', key: 'case_id', render: (v: string) => v || '-' },
    {
      title: '入账状态',
      dataIndex: 'account_status',
      key: 'account_status',
      render: (v: string) => {
        const label = accountStatusLabelMap[v] || v || '待入账'
        // 保留原颜色判断逻辑，按 stitch 设计规范映射变体：已入账-success、待入账-warning
        const variant = v === 'accounted' ? 'success' : 'warning'
        return <Tag className={`stitch-tag stitch-tag-${variant}`}>{label}</Tag>
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_: unknown, record: Record<string, unknown>) => (
        <Space className="stitch-btn-group">
          <Button type="link" size="small" onClick={() => handleEdit(record)}>编辑</Button>
          {record.account_status === 'pending' && (
            <Popconfirm title="确认入账该记录？" onConfirm={() => handleAccount(record)}>
              <Button type="link" size="small">入账</Button>
            </Popconfirm>
          )}
          {record.account_status === 'accounted' && (
            <Button type="link" size="small" onClick={() => handleAllocateOpen(record)}>分账</Button>
          )}
          {record.account_status === 'accounted' && (
            <Button type="link" size="small" onClick={() => handleTaxShareOpen(record)}>税费分摊</Button>
          )}
          <Popconfirm title="确认删除该记录？" onConfirm={() => handleDelete(record)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
        <h2 style={pageH2Style}>业务款管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增记录</Button>
      </div>

      {/* 顶部统计卡片 */}
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic
              title="收入合计"
              value={stats.total_income}
              precision={2}
              prefix="¥"
              valueStyle={{ color: theme.success, fontFamily: "'Noto Serif SC', serif", fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="支出合计"
              value={stats.total_expense}
              precision={2}
              prefix="¥"
              valueStyle={{ color: theme.error, fontFamily: "'Noto Serif SC', serif", fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="净额"
              value={stats.net_amount}
              precision={2}
              prefix="¥"
              valueStyle={{ color: stats.net_amount >= 0 ? theme.primaryDark : theme.error, fontFamily: "'Noto Serif SC', serif", fontWeight: 600 }}
            />
          </Card>
        </Col>
      </Row>

      <div className="search-bar stitch-filter-bar" style={searchBarStyle}>
        <Select
          placeholder="类型"
          style={{ width: 120 }}
          allowClear
          value={searchParams.type || undefined}
          onChange={(value) => setSearchParams({ ...searchParams, type: value || '' })}
          options={[
            { value: 'income', label: '收入' },
            { value: 'expense', label: '支出' },
          ]}
        />
        <Select
          placeholder="分类"
          style={{ width: 140 }}
          allowClear
          value={searchParams.category || undefined}
          onChange={(value) => setSearchParams({ ...searchParams, category: value || '' })}
          options={[
            { value: 'lawyer_fee', label: '律师费' },
            { value: 'agency_fee', label: '代理费' },
            { value: 'preservation_fee', label: '保全费' },
            { value: 'appraisal_fee', label: '鉴定费' },
            { value: 'other', label: '其他' },
          ]}
        />
        <Input
          placeholder="付款方搜索"
          prefix={<SearchOutlined />}
          style={{ width: 180 }}
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

      <Card className="stitch-table" style={tableCardStyle} styles={{ body: { padding: 0 } }}>
        <Table dataSource={list} columns={columns} loading={loading} rowKey="id" size="small" pagination={{ pageSize: 10 }} scroll={{ x: 1600 }} />
      </Card>

      <Modal
        title={editId ? '编辑业务款记录' : '新增业务款记录'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={560}
      >
        <Form onFinish={handleSubmit} form={form} layout="vertical">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <Form.Item name="type" label="类型" rules={[{ required: true }]}>
              <Select options={[
                { value: 'income', label: '收入' },
                { value: 'expense', label: '支出' },
              ]} />
            </Form.Item>
            <Form.Item name="category" label="分类" rules={[{ required: true }]}>
              <Select options={[
                { value: 'lawyer_fee', label: '律师费' },
                { value: 'agency_fee', label: '代理费' },
                { value: 'preservation_fee', label: '保全费' },
                { value: 'appraisal_fee', label: '鉴定费' },
                { value: 'other', label: '其他' },
              ]} />
            </Form.Item>
            <Form.Item name="amount" label="金额" rules={[{ required: true, message: '请输入金额' }]}>
              <InputNumber placeholder="请输入金额" style={{ width: '100%' }} min={0} step={0.01} />
            </Form.Item>
            <Form.Item name="payment_date" label="付款日期" rules={[{ required: true, message: '请选择付款日期' }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="payer" label="付款方" rules={[{ required: true, message: '请输入付款方' }]}>
              <Input placeholder="付款方" />
            </Form.Item>
            <Form.Item name="payee" label="收款方" rules={[{ required: true, message: '请输入收款方' }]}>
              <Input placeholder="收款方" />
            </Form.Item>
            <Form.Item name="payment_method" label="付款方式">
              <Input placeholder="付款方式（可空）" />
            </Form.Item>
            <Form.Item name="case_id" label="关联案件">
              <Input placeholder="关联案件ID（可空）" />
            </Form.Item>
          </div>
          <Form.Item name="remarks" label="备注">
            <Input.TextArea placeholder="备注" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">{editId ? '保存' : '提交'}</Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 分账弹窗 */}
      <Modal
        title="业务款分账"
        open={allocateModalVisible}
        onCancel={() => setAllocateModalVisible(false)}
        onOk={handleAllocateSubmit}
        okText="确认分账"
        width={520}
      >
        <p>金额：¥{Number(currentRecord?.amount || 0).toFixed(2)}</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <Input
            placeholder="角色（如：律师、律所）"
            style={{ flex: 1 }}
            value={allocateRole}
            onChange={(e) => setAllocateRole(e.target.value)}
          />
          <InputNumber
            placeholder="金额"
            style={{ width: 140 }}
            min={0}
            step={0.01}
            value={allocateAmount === null ? undefined : allocateAmount}
            onChange={(v) => setAllocateAmount(v === null || v === undefined ? null : Number(v))}
          />
          <Button type="primary" onClick={handleAddAllocateItem}>添加</Button>
        </div>
        <Table
          dataSource={allocateRecords}
          rowKey={(_, idx) => String(idx)}
          size="small"
          pagination={false}
          scroll={{ x: 800 }}
          columns={[
            { title: '角色', dataIndex: 'role', key: 'role' },
            {
              title: '金额',
              dataIndex: 'amount',
              key: 'amount',
              render: (v: number) => `¥${Number(v || 0).toFixed(2)}`,
            },
            {
              title: '操作',
              key: 'action',
              width: 80,
              render: (_: unknown, _record: unknown, idx: number) => (
                <Button type="link" size="small" danger onClick={() => handleRemoveAllocateItem(idx)}>删除</Button>
              ),
            },
          ]}
        />
      </Modal>

      {/* 税费分摊弹窗 */}
      <Modal
        title="税费分摊"
        open={taxShareModalVisible}
        onCancel={() => setTaxShareModalVisible(false)}
        onOk={handleTaxShareSubmit}
        okText="确认分摊"
      >
        <p>金额：¥{Number(currentRecord?.amount || 0).toFixed(2)}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>税费金额：</span>
          <InputNumber
            placeholder="请输入税费金额"
            style={{ flex: 1 }}
            min={0}
            step={0.01}
            value={taxShareAmount === null ? undefined : taxShareAmount}
            onChange={(v) => setTaxShareAmount(v === null || v === undefined ? null : Number(v))}
          />
        </div>
      </Modal>
    </div>
  )
}
