import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, Space, message, Tabs, Card, DatePicker, Popconfirm, InputNumber } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import {
  getBids,
  createBid,
  updateBid,
  deleteBid,
  submitBid,
  winBid,
  loseBid,
  getBidRecords,
  createBidRecord,
  updateBidRecord,
  deleteBidRecord,
} from '../api/bid'
import { formatDate } from '../utils/format'
import dayjs from 'dayjs'
import { theme } from '../constants/theme'
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
  blue: { bg: 'rgba(0, 113, 227, 0.1)', color: theme.primary },
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

// 投标状态映射
const bidStatusKindMap: Record<string, PillKind> = {
  preparing: 'neutral',
  submitted: 'blue',
  won: 'green',
  lost: 'red',
}

const bidStatusLabelMap: Record<string, string> = {
  preparing: '准备中',
  submitted: '已投标',
  won: '中标',
  lost: '未中标',
}

// 业绩分类映射
const recordCategoryLabelMap: Record<string, string> = {
  litigation: '诉讼',
  non_litigation: '非诉',
  consultant: '顾问',
}

export default function BidManagement() {
  const [activeTab, setActiveTab] = useState('bids')
  // 投标管理状态
  const [bids, setBids] = useState<any[]>([])
  const [bidLoading, setBidLoading] = useState(false)
  const [bidModalVisible, setBidModalVisible] = useState(false)
  const [editBidId, setEditBidId] = useState<string | null>(null)
  const [bidForm] = Form.useForm()
  const [bidSearch, setBidSearch] = useState({ status: '', keyword: '' })
  // 业绩库状态
  const [records, setRecords] = useState<any[]>([])
  const [recordLoading, setRecordLoading] = useState(false)
  const [recordModalVisible, setRecordModalVisible] = useState(false)
  const [editRecordId, setEditRecordId] = useState<string | null>(null)
  const [recordForm] = Form.useForm()
  const [recordKeyword, setRecordKeyword] = useState('')

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // 投标管理数据
  const fetchBids = async () => {
    setBidLoading(true)
    try {
      const res = await getBids({
        org_id: user.organization_id,
        status: bidSearch.status || undefined,
        keyword: bidSearch.keyword || undefined,
      }) as Record<string, unknown>[]
      setBids(res || [])
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setBidLoading(false)
    }
  }

  // 业绩库数据
  const fetchRecords = async () => {
    setRecordLoading(true)
    try {
      const res = await getBidRecords({
        org_id: user.organization_id,
        keyword: recordKeyword || undefined,
      }) as Record<string, unknown>[]
      setRecords(res || [])
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setRecordLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'bids') {
      fetchBids()
    } else if (activeTab === 'records') {
      fetchRecords()
    }
  }, [activeTab])

  // ===== 投标管理操作 =====
  const handleAddBid = () => {
    setEditBidId(null)
    bidForm.resetFields()
    bidForm.setFieldsValue({ status: 'preparing' })
    setBidModalVisible(true)
  }

  const handleEditBid = (record: any) => {
    setEditBidId(record.id)
    bidForm.setFieldsValue({
      ...record,
      deadline: record.deadline ? dayjs(record.deadline) : undefined,
      bid_date: record.bid_date ? dayjs(record.bid_date) : undefined,
    })
    setBidModalVisible(true)
  }

  const handleSubmitBid = async (values: any) => {
    try {
      const data = {
        ...values,
        deadline: values.deadline ? values.deadline.format('YYYY-MM-DD') : undefined,
        bid_date: values.bid_date ? values.bid_date.format('YYYY-MM-DD') : undefined,
        organization_id: user.organization_id,
      }
      if (editBidId) {
        await updateBid(editBidId, data)
        message.success('更新成功')
      } else {
        await createBid(data)
        message.success('创建成功')
      }
      setBidModalVisible(false)
      fetchBids()
    } catch (error) {
      message.error(editBidId ? '更新失败' : '创建失败')
    }
  }

  const handleSubmitAction = async (id: string, action: 'submit' | 'win' | 'lose') => {
    try {
      if (action === 'submit') await submitBid(id)
      if (action === 'win') await winBid(id)
      if (action === 'lose') await loseBid(id)
      message.success('操作成功')
      fetchBids()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleDeleteBid = async (record: any) => {
    try {
      await deleteBid(record.id)
      message.success('删除成功')
      fetchBids()
    } catch (error) {
      message.error('删除失败')
    }
  }

  // ===== 业绩库操作 =====
  const handleAddRecord = () => {
    setEditRecordId(null)
    recordForm.resetFields()
    recordForm.setFieldsValue({ category: 'litigation' })
    setRecordModalVisible(true)
  }

  const handleEditRecord = (record: any) => {
    setEditRecordId(record.id)
    recordForm.setFieldsValue({
      ...record,
      start_date: record.start_date ? dayjs(record.start_date) : undefined,
      end_date: record.end_date ? dayjs(record.end_date) : undefined,
    })
    setRecordModalVisible(true)
  }

  const handleSubmitRecord = async (values: any) => {
    try {
      const data = {
        ...values,
        start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : undefined,
        end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : undefined,
        organization_id: user.organization_id,
      }
      if (editRecordId) {
        await updateBidRecord(editRecordId, data)
        message.success('更新成功')
      } else {
        await createBidRecord(data)
        message.success('创建成功')
      }
      setRecordModalVisible(false)
      fetchRecords()
    } catch (error) {
      message.error(editRecordId ? '更新失败' : '创建失败')
    }
  }

  const handleDeleteRecord = async (record: any) => {
    try {
      await deleteBidRecord(record.id)
      message.success('删除成功')
      fetchRecords()
    } catch (error) {
      message.error('删除失败')
    }
  }

  // 投标列表列定义
  const bidColumns = [
    { title: '项目名称', dataIndex: 'project_name', key: 'project_name' },
    { title: '招标方', dataIndex: 'tenderer', key: 'tenderer' },
    {
      title: '投标金额',
      dataIndex: 'bid_amount',
      key: 'bid_amount',
      render: (v: number) => (
        <span style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, color: '#0059b5' }}>
          ¥{Number(v || 0).toFixed(2)}
        </span>
      ),
    },
    { title: '截止日期', dataIndex: 'deadline', key: 'deadline', render: (v: string) => formatDate(v) },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <StatusPill text={bidStatusLabelMap[status] || status} kind={bidStatusKindMap[status] || 'neutral'} />
      ),
    },
    { title: '负责人', dataIndex: 'manager_id', key: 'manager_id', render: (v: string) => v || '-' },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_: any, record: any) => (
        <Space className="stitch-btn-group">
          {record.status === 'preparing' && (
            <Button type="link" size="small" onClick={() => handleSubmitAction(record.id, 'submit')}>投标</Button>
          )}
          {record.status === 'submitted' && (
            <Button type="link" size="small" onClick={() => handleSubmitAction(record.id, 'win')}>中标</Button>
          )}
          {record.status === 'submitted' && (
            <Button type="link" size="small" danger onClick={() => handleSubmitAction(record.id, 'lose')}>未中标</Button>
          )}
          <Button type="link" size="small" onClick={() => handleEditBid(record)}>编辑</Button>
          <Popconfirm title="确认删除该投标记录？" onConfirm={() => handleDeleteBid(record)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // 业绩库列定义
  const recordColumns = [
    { title: '项目名称', dataIndex: 'project_name', key: 'project_name' },
    { title: '客户', dataIndex: 'client', key: 'client' },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (v: number) => (
        <span style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, color: '#0059b5' }}>
          ¥{Number(v || 0).toFixed(2)}
        </span>
      ),
    },
    { title: '开始日期', dataIndex: 'start_date', key: 'start_date', render: (v: string) => formatDate(v) },
    { title: '结束日期', dataIndex: 'end_date', key: 'end_date', render: (v: string) => formatDate(v) },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (v: string) => (
        <StatusPill text={recordCategoryLabelMap[v] || v} kind={v === 'litigation' ? 'blue' : v === 'non_litigation' ? 'green' : 'gold'} />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_: any, record: any) => (
        <Space className="stitch-btn-group">
          <Button type="link" size="small" onClick={() => handleEditRecord(record)}>编辑</Button>
          <Popconfirm title="确认删除该业绩记录？" onConfirm={() => handleDeleteRecord(record)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const tabItems = [
    {
      key: 'bids',
      label: '投标管理',
      children: (
        <>
          <div className="search-bar stitch-filter-bar" style={searchBarStyle}>
            <Select
              placeholder="状态筛选"
              style={{ width: 140 }}
              allowClear
              value={bidSearch.status || undefined}
              onChange={(value) => setBidSearch({ ...bidSearch, status: value || '' })}
              options={[
                { value: 'preparing', label: '准备中' },
                { value: 'submitted', label: '已投标' },
                { value: 'won', label: '中标' },
                { value: 'lost', label: '未中标' },
              ]}
            />
            <Input
              placeholder="项目名称搜索"
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
              value={bidSearch.keyword}
              onChange={(e) => setBidSearch({ ...bidSearch, keyword: e.target.value })}
              onPressEnter={fetchBids}
            />
            <Button type="primary" onClick={fetchBids}>搜索</Button>
          </div>
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddBid}>新增投标</Button>
          </div>
          <Card className="stitch-table" style={tableCardStyle} styles={{ body: { padding: 0 } }}>
            <Table dataSource={bids} columns={bidColumns} loading={bidLoading} rowKey="id" size="small" pagination={{ pageSize: 10 }} scroll={{ x: 1200 }} />
          </Card>
        </>
      ),
    },
    {
      key: 'records',
      label: '业绩库',
      children: (
        <>
          <div className="search-bar stitch-filter-bar" style={searchBarStyle}>
            <Input
              placeholder="项目名称搜索"
              prefix={<SearchOutlined />}
              style={{ width: 220 }}
              value={recordKeyword}
              onChange={(e) => setRecordKeyword(e.target.value)}
              onPressEnter={fetchRecords}
            />
            <Button type="primary" onClick={fetchRecords}>搜索</Button>
          </div>
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddRecord}>新增业绩</Button>
          </div>
          <Card className="stitch-table" style={tableCardStyle} styles={{ body: { padding: 0 } }}>
            <Table dataSource={records} columns={recordColumns} loading={recordLoading} rowKey="id" size="small" pagination={{ pageSize: 10 }} scroll={{ x: 1200 }} />
          </Card>
        </>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <h2 style={pageH2Style}>投标管理</h2>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      {/* 投标新增/编辑Modal */}
      <Modal
        title={editBidId ? '编辑投标' : '新增投标'}
        open={bidModalVisible}
        onCancel={() => setBidModalVisible(false)}
        footer={null}
        width={560}
      >
        <Form onFinish={handleSubmitBid} form={bidForm} layout="vertical">
          <Form.Item name="project_name" label="项目名称" rules={[{ required: true, message: '请输入项目名称' }]}>
            <Input placeholder="项目名称" />
          </Form.Item>
          <Form.Item name="tenderer" label="招标方" rules={[{ required: true, message: '请输入招标方' }]}>
            <Input placeholder="招标方" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <Form.Item name="bid_amount" label="投标金额" rules={[{ required: true, message: '请输入投标金额' }]}>
              <InputNumber placeholder="投标金额" style={{ width: '100%' }} min={0} step={0.01} />
            </Form.Item>
            <Form.Item name="deadline" label="截止日期" rules={[{ required: true, message: '请选择截止日期' }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="manager_id" label="负责人">
              <Input placeholder="负责人" />
            </Form.Item>
            <Form.Item name="bid_date" label="投标日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item name="remarks" label="备注">
            <Input.TextArea placeholder="备注" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">{editBidId ? '保存' : '提交'}</Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 业绩新增/编辑Modal */}
      <Modal
        title={editRecordId ? '编辑业绩记录' : '新增业绩记录'}
        open={recordModalVisible}
        onCancel={() => setRecordModalVisible(false)}
        footer={null}
        width={560}
      >
        <Form onFinish={handleSubmitRecord} form={recordForm} layout="vertical">
          <Form.Item name="project_name" label="项目名称" rules={[{ required: true, message: '请输入项目名称' }]}>
            <Input placeholder="项目名称" />
          </Form.Item>
          <Form.Item name="client" label="客户" rules={[{ required: true, message: '请输入客户' }]}>
            <Input placeholder="客户" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <Form.Item name="amount" label="金额" rules={[{ required: true, message: '请输入金额' }]}>
              <InputNumber placeholder="金额" style={{ width: '100%' }} min={0} step={0.01} />
            </Form.Item>
            <Form.Item name="category" label="分类" rules={[{ required: true }]}>
              <Select options={[
                { value: 'litigation', label: '诉讼' },
                { value: 'non_litigation', label: '非诉' },
                { value: 'consultant', label: '顾问' },
              ]} />
            </Form.Item>
            <Form.Item name="start_date" label="开始日期" rules={[{ required: true, message: '请选择开始日期' }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="end_date" label="结束日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="描述" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">{editRecordId ? '保存' : '提交'}</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
