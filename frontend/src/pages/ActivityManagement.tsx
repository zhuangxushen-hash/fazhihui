import { useState, useEffect } from 'react'
import { Table, Tag, Button, Modal, Form, Input, Select, DatePicker, InputNumber, Space, message, Popconfirm, Tabs } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { getActivities, createActivity, updateActivity, deleteActivity, registerActivity, unregisterActivity, getMyRegistrations } from '../api/hr'
import { formatDateTime } from '../utils/format'

const { TextArea } = Input
const { RangePicker } = DatePicker

// 活动类型选项
const activityTypeOptions = [
  { value: 'training', label: '培训' },
  { value: 'team_building', label: '团建' },
  { value: 'meeting', label: '会议' },
  { value: 'other', label: '其他' },
]

// 活动状态选项
const activityStatusOptions = [
  { value: 'upcoming', label: '即将开始' },
  { value: 'ongoing', label: '进行中' },
  { value: 'completed', label: '已结束' },
  { value: 'cancelled', label: '已取消' },
]

// 状态颜色映射
const statusColorMap: Record<string, string> = {
  upcoming: 'blue',
  ongoing: 'green',
  completed: 'default',
  cancelled: 'red',
}

export default function ActivityManagement() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form] = Form.useForm()
  const [searchParams, setSearchParams] = useState({
    status: '',
    activity_type: '',
    keyword: '',
  })
  const [activeTab, setActiveTab] = useState('list')
  // 已报名活动ID列表
  const [myRegistrations, setMyRegistrations] = useState<string[]>([])

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  // 管理员角色判断
  const isAdmin = ['super_admin', 'org_admin'].includes(user.role)

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (searchParams.status) params.status = searchParams.status
      if (searchParams.activity_type) params.activity_type = searchParams.activity_type
      if (searchParams.keyword) params.keyword = searchParams.keyword
      const res: any = await getActivities(params)
      const allActivities = res || []
      // 获取已报名列表
      const regRes: any = await getMyRegistrations()
      const regIds: string[] = regRes || []
      setMyRegistrations(regIds)
      // 根据tab筛选
      if (activeTab === 'mine') {
        setData(allActivities.filter((a: any) => regIds.includes(a.id)))
      } else {
        setData(allActivities)
      }
    } catch (error) {
      console.error('Fetch activities error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchData()
  }

  const handleReset = () => {
    setSearchParams({ status: '', activity_type: '', keyword: '' })
    fetchData()
  }

  const handleAdd = () => {
    setEditingId(null)
    form.resetFields()
    form.setFieldsValue({ activity_type: 'other', max_participants: 0 })
    setModalVisible(true)
  }

  const handleEdit = (record: any) => {
    setEditingId(record.id)
    form.setFieldsValue({
      title: record.title,
      description: record.description,
      activity_type: record.activity_type,
      time_range: [record.start_time, record.end_time],
      location: record.location,
      max_participants: record.max_participants,
      status: record.status,
    })
    setModalVisible(true)
  }

  const handleSubmit = async (values: any) => {
    try {
      const submitData = {
        title: values.title,
        description: values.description,
        activity_type: values.activity_type,
        start_time: values.time_range[0]?.format('YYYY-MM-DD HH:mm:ss'),
        end_time: values.time_range[1]?.format('YYYY-MM-DD HH:mm:ss'),
        location: values.location,
        max_participants: values.max_participants || 0,
        status: values.status || 'upcoming',
      }
      if (editingId) {
        await updateActivity(editingId, submitData)
        message.success('活动更新成功')
      } else {
        await createActivity(submitData)
        message.success('活动创建成功')
      }
      setModalVisible(false)
      fetchData()
    } catch (error) {
      message.error(editingId ? '更新失败' : '创建失败')
      console.error('Activity submit error:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteActivity(id)
      message.success('删除成功')
      fetchData()
    } catch (error) {
      message.error('删除失败')
      console.error('Delete activity error:', error)
    }
  }

  const handleRegister = async (id: string) => {
    try {
      await registerActivity(id)
      message.success('报名成功')
      fetchData()
    } catch (error: any) {
      message.error(error?.response?.data?.message || '报名失败')
      console.error('Register activity error:', error)
    }
  }

  const handleUnregister = async (id: string) => {
    try {
      await unregisterActivity(id)
      message.success('取消报名成功')
      fetchData()
    } catch (error: any) {
      message.error(error?.response?.data?.message || '取消报名失败')
      console.error('Unregister activity error:', error)
    }
  }

  const columns = [
    { title: '活动标题', dataIndex: 'title', key: 'title', width: 180 },
    { title: '类型', dataIndex: 'activity_type', key: 'activity_type', width: 100, render: (val: string) => {
      const item = activityTypeOptions.find(o => o.value === val)
      return item?.label || val
    }},
    { title: '开始时间', dataIndex: 'start_time', key: 'start_time', width: 160, render: (val: string) => formatDateTime(val) },
    { title: '结束时间', dataIndex: 'end_time', key: 'end_time', width: 160, render: (val: string) => formatDateTime(val) },
    { title: '地点', dataIndex: 'location', key: 'location', width: 150, render: (val: string) => val || '-', ellipsis: true },
    { title: '报名人数', key: 'registered_count', width: 100, render: (_: any, record: any) => {
      const max = record.max_participants > 0 ? `/${record.max_participants}` : '/不限'
      return `${record.registered_count || 0}${max}`
    }},
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (val: string) => {
      const item = activityStatusOptions.find(o => o.value === val)
      return <Tag color={statusColorMap[val] || 'default'}>{item?.label || val}</Tag>
    }},
    { title: '操作', key: 'action', width: 200, fixed: 'right' as const, render: (_: any, record: any) => (
      <Space>
        {activeTab !== 'mine' && record.status !== 'cancelled' && record.status !== 'completed' && (
          myRegistrations.includes(record.id) ? (
            <Popconfirm title="确定取消报名吗？" onConfirm={() => handleUnregister(record.id)}>
              <Button size="small" danger>取消报名</Button>
            </Popconfirm>
          ) : (
            <Button size="small" type="primary" onClick={() => handleRegister(record.id)}>报名</Button>
          )
        )}
        {isAdmin && (
          <>
            <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
            <Popconfirm title="确定删除该活动吗？" onConfirm={() => handleDelete(record.id)}>
              <Button size="small" icon={<DeleteOutlined />} danger>删除</Button>
            </Popconfirm>
          </>
        )}
      </Space>
    )},
  ]

  return (
    <div>
      <div className="page-header">
        <h2>活动管理</h2>
        {isAdmin && <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>创建活动</Button>}
      </div>

      <div className="search-bar">
        <Input
          placeholder="标题/描述搜索"
          prefix={<SearchOutlined />}
          style={{ width: 200 }}
          value={searchParams.keyword}
          onChange={(e) => setSearchParams({ ...searchParams, keyword: e.target.value })}
        />
        <Select
          placeholder="类型筛选"
          style={{ width: 120 }}
          allowClear
          value={searchParams.activity_type || undefined}
          onChange={(value) => setSearchParams({ ...searchParams, activity_type: value || '' })}
        >
          {activityTypeOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
        </Select>
        <Select
          placeholder="状态筛选"
          style={{ width: 120 }}
          allowClear
          value={searchParams.status || undefined}
          onChange={(value) => setSearchParams({ ...searchParams, status: value || '' })}
        >
          {activityStatusOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
        </Select>
        <Button type="primary" onClick={handleSearch}>搜索</Button>
        <Button onClick={handleReset}>重置</Button>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
        { key: 'list', label: '活动列表' },
        { key: 'mine', label: '我的活动' },
      ]} />

      <Table dataSource={data} columns={columns} loading={loading} rowKey="id" scroll={{ x: 1200 }} />

      <Modal
        title={editingId ? '编辑活动' : '创建活动'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form onFinish={handleSubmit} form={form} layout="vertical">
          <Form.Item name="title" label="活动标题" rules={[{ required: true, message: '请输入活动标题' }]}>
            <Input placeholder="请输入活动标题" />
          </Form.Item>
          <Form.Item name="activity_type" label="活动类型" rules={[{ required: true }]}>
            <Select>
              {activityTypeOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="time_range" label="活动时间" rules={[{ required: true, message: '请选择活动时间' }]}>
            <RangePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="location" label="活动地点">
            <Input placeholder="请输入活动地点" />
          </Form.Item>
          <Form.Item name="max_participants" label="最大参与人数（0表示不限）">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="活动描述">
            <TextArea rows={3} placeholder="请输入活动描述" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">提交</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
