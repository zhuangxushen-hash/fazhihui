import { useState, useEffect } from 'react'
import { Table, Tag, Button, Modal, Form, Input, Select, DatePicker, Space, message, Popconfirm, Tabs } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { getLeaves, createLeave, updateLeave, deleteLeave, approveLeave, rejectLeave, cancelLeave } from '../api/hr'
import { formatDateTime } from '../utils/format'

const { TextArea } = Input
const { RangePicker } = DatePicker

// 请假类型选项
const leaveTypeOptions = [
  { value: 'personal', label: '事假' },
  { value: 'sick', label: '病假' },
  { value: 'annual', label: '年假' },
  { value: 'maternity', label: '产假' },
  { value: 'other', label: '其他' },
]

// 请假状态选项
const leaveStatusOptions = [
  { value: 'pending', label: '待审批' },
  { value: 'approved', label: '已批准' },
  { value: 'rejected', label: '已驳回' },
  { value: 'cancelled', label: '已撤销' },
]

// 状态颜色映射
const statusColorMap: Record<string, string> = {
  pending: 'orange',
  approved: 'green',
  rejected: 'red',
  cancelled: 'default',
}

// 类型中文映射
const typeLabelMap: Record<string, string> = {
  personal: '事假',
  sick: '病假',
  annual: '年假',
  maternity: '产假',
  other: '其他',
}

export default function LeaveManagement() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form] = Form.useForm()
  const [searchParams, setSearchParams] = useState({
    status: '',
    start_date: '',
    end_date: '',
  })
  const [activeTab, setActiveTab] = useState('mine')
  // 审批弹窗
  const [approveVisible, setApproveVisible] = useState(false)
  const [approveForm] = Form.useForm()
  const [currentRecord, setCurrentRecord] = useState<any>(null)
  const [approveAction, setApproveAction] = useState<'approve' | 'reject'>('approve')

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (activeTab === 'mine') {
        params.user_id = user.id
      }
      if (searchParams.status) params.status = searchParams.status
      if (searchParams.start_date) params.start_date = searchParams.start_date
      if (searchParams.end_date) params.end_date = searchParams.end_date
      const res: any = await getLeaves(params)
      setData(res || [])
    } catch (error) {
      console.error('Fetch leaves error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchData()
  }

  const handleReset = () => {
    setSearchParams({ status: '', start_date: '', end_date: '' })
    fetchData()
  }

  const handleAdd = () => {
    setEditingId(null)
    form.resetFields()
    form.setFieldsValue({ leave_type: 'personal' })
    setModalVisible(true)
  }

  const handleEdit = (record: any) => {
    setEditingId(record.id)
    form.setFieldsValue({
      leave_type: record.leave_type,
      date_range: [record.start_date, record.end_date],
      days: record.days,
      reason: record.reason,
    })
    setModalVisible(true)
  }

  const handleSubmit = async (values: any) => {
    try {
      const submitData = {
        leave_type: values.leave_type,
        start_date: values.date_range[0]?.format('YYYY-MM-DD'),
        end_date: values.date_range[1]?.format('YYYY-MM-DD'),
        days: values.days,
        reason: values.reason,
      }
      if (editingId) {
        await updateLeave(editingId, submitData)
        message.success('请假更新成功')
      } else {
        await createLeave(submitData)
        message.success('请假申请成功')
      }
      setModalVisible(false)
      fetchData()
    } catch (error) {
      message.error(editingId ? '请假更新失败' : '请假申请失败')
      console.error('Leave submit error:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteLeave(id)
      message.success('删除成功')
      fetchData()
    } catch (error) {
      message.error('删除失败')
      console.error('Delete leave error:', error)
    }
  }

  const handleCancel = async (id: string) => {
    try {
      await cancelLeave(id)
      message.success('撤销成功')
      fetchData()
    } catch (error: any) {
      message.error(error?.response?.data?.message || '撤销失败')
      console.error('Cancel leave error:', error)
    }
  }

  const openApproveModal = (record: any, action: 'approve' | 'reject') => {
    setCurrentRecord(record)
    setApproveAction(action)
    approveForm.resetFields()
    setApproveVisible(true)
  }

  const handleApproveSubmit = async (values: any) => {
    try {
      if (approveAction === 'approve') {
        await approveLeave(currentRecord.id, values.comment)
        message.success('审批通过')
      } else {
        await rejectLeave(currentRecord.id, values.comment)
        message.success('已驳回')
      }
      setApproveVisible(false)
      fetchData()
    } catch (error: any) {
      message.error(error?.response?.data?.message || '操作失败')
      console.error('Approve leave error:', error)
    }
  }

  const columns = [
    { title: '申请人', dataIndex: 'user_name', key: 'user_name', width: 100, render: (val: string, record: any) => val || record.user_id?.slice(0, 8) || '-' },
    { title: '请假类型', dataIndex: 'leave_type', key: 'leave_type', width: 100, render: (val: string) => typeLabelMap[val] || val },
    { title: '开始日期', dataIndex: 'start_date', key: 'start_date', width: 120 },
    { title: '结束日期', dataIndex: 'end_date', key: 'end_date', width: 120 },
    { title: '天数', dataIndex: 'days', key: 'days', width: 80 },
    { title: '原因', dataIndex: 'reason', key: 'reason', ellipsis: true },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (val: string) => {
      const item = leaveStatusOptions.find(o => o.value === val)
      return <Tag color={statusColorMap[val] || 'default'}>{item?.label || val}</Tag>
    }},
    { title: '审批意见', dataIndex: 'approve_comment', key: 'approve_comment', ellipsis: true, render: (val: string) => val || '-' },
    { title: '审批时间', dataIndex: 'approve_time', key: 'approve_time', width: 160, render: (val: string) => val ? formatDateTime(val) : '-' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 160, render: (val: string) => formatDateTime(val) },
    { title: '操作', key: 'action', width: 220, fixed: 'right' as const, render: (_: any, record: any) => (
      <Space>
        {record.user_id === user.id && record.status === 'pending' && (
          <>
            <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
            <Button size="small" onClick={() => handleCancel(record.id)}>撤销</Button>
            <Popconfirm title="确定删除该请假记录吗？" onConfirm={() => handleDelete(record.id)}>
              <Button size="small" icon={<DeleteOutlined />} danger>删除</Button>
            </Popconfirm>
          </>
        )}
        {activeTab === 'pending' && record.status === 'pending' && (
          <>
            <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => openApproveModal(record, 'approve')}>批准</Button>
            <Button size="small" danger icon={<CloseOutlined />} onClick={() => openApproveModal(record, 'reject')}>驳回</Button>
          </>
        )}
      </Space>
    )},
  ]

  return (
    <div>
      <div className="page-header">
        <h2>请假管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>发起请假</Button>
      </div>

      <div className="search-bar">
        <Select
          placeholder="状态筛选"
          style={{ width: 150 }}
          allowClear
          value={searchParams.status || undefined}
          onChange={(value) => setSearchParams({ ...searchParams, status: value || '' })}
        >
          {leaveStatusOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
        </Select>
        <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>搜索</Button>
        <Button onClick={handleReset}>重置</Button>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
        { key: 'mine', label: '我的请假' },
        { key: 'all', label: '全部请假' },
        { key: 'pending', label: '待我审批' },
      ]} />

      <Table dataSource={data} columns={columns} loading={loading} rowKey="id" scroll={{ x: 1400 }} />

      <Modal
        title={editingId ? '编辑请假' : '发起请假'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form onFinish={handleSubmit} form={form} layout="vertical">
          <Form.Item name="leave_type" label="请假类型" rules={[{ required: true }]}>
            <Select>
              {leaveTypeOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="date_range" label="请假日期" rules={[{ required: true, message: '请选择请假日期' }]}>
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="days" label="请假天数" rules={[{ required: true, message: '请输入请假天数' }]}>
            <Input type="number" min="0.5" step="0.5" placeholder="请输入请假天数" />
          </Form.Item>
          <Form.Item name="reason" label="请假原因" rules={[{ required: true, message: '请输入请假原因' }]}>
            <TextArea rows={3} placeholder="请输入请假原因" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">提交</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={approveAction === 'approve' ? '审批通过' : '驳回请假'}
        open={approveVisible}
        onCancel={() => setApproveVisible(false)}
        footer={null}
        width={450}
      >
        <Form onFinish={handleApproveSubmit} form={approveForm} layout="vertical">
          <Form.Item name="comment" label="审批意见">
            <TextArea rows={3} placeholder="请输入审批意见（可选）" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" danger={approveAction === 'reject'}>
                {approveAction === 'approve' ? '确认批准' : '确认驳回'}
              </Button>
              <Button onClick={() => setApproveVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
