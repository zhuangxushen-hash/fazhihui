import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Space,
  message,
  Tabs,
  Tag,
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Slider,
} from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from '@ant-design/icons'
import axios from '../api/axios'
import {
  getTasks,
  createTask,
  deleteTask,
  startTask,
  completeTask,
  cancelTask,
  getTaskStats,
  updateProgress,
} from '../api/task'
import { formatDate } from '../utils/format'

// 优先级映射（中文标签 + Tag 样式，对齐 Stitch 设计规范，返回 className）
const priorityMap: Record<string, { label: string; color: string }> = {
  low: { label: '低', color: 'stitch-tag stitch-tag-info' },
  normal: { label: '普通', color: 'stitch-tag stitch-tag-primary' },
  high: { label: '高', color: 'stitch-tag stitch-tag-warning' },
  urgent: { label: '紧急', color: 'stitch-tag stitch-tag-error' },
}

// 状态映射（中文标签 + Tag 样式，对齐 Stitch 设计规范，返回 className）
const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待办', color: 'stitch-tag stitch-tag-primary' },
  processing: { label: '进行中', color: 'stitch-tag stitch-tag-warning' },
  completed: { label: '已完成', color: 'stitch-tag stitch-tag-success' },
  cancelled: { label: '已取消', color: 'stitch-tag stitch-tag-info' },
}

// 优先级筛选选项
const priorityOptions = [
  { value: 'low', label: '低' },
  { value: 'normal', label: '普通' },
  { value: 'high', label: '高' },
  { value: 'urgent', label: '紧急' },
]

// 状态筛选选项
const statusOptions = [
  { value: 'pending', label: '待办' },
  { value: 'processing', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
]

// 优先级标签组件
const PriorityTag = ({ priority }: { priority: string }) => {
  const cfg = priorityMap[priority] || { label: priority, color: 'stitch-tag stitch-tag-info' }
  return <Tag className={cfg.color}>{cfg.label}</Tag>
}

// 状态标签组件
const StatusTag = ({ status }: { status: string }) => {
  const cfg = statusMap[status] || { label: status, color: 'stitch-tag stitch-tag-info' }
  return <Tag className={cfg.color}>{cfg.label}</Tag>
}

export default function TaskCenter() {
  const [activeTab, setActiveTab] = useState('mine')
  const [data, setData] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [searchForm] = Form.useForm()
  // 全部任务 Tab 的查询参数
  const [searchParams, setSearchParams] = useState<any>({})
  // 用户列表（用于多负责人选择）
  const [userList, setUserList] = useState<any[]>([])
  // 更新进度弹窗
  const [progressModalVisible, setProgressModalVisible] = useState(false)
  const [progressForm] = Form.useForm()
  const [progressTaskId, setProgressTaskId] = useState<string>('')

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // 拉取任务列表（根据当前 Tab 分别请求）
  const fetchData = async () => {
    setLoading(true)
    try {
      let params: any = {}
      if (activeTab === 'mine') {
        // 我的任务：分配给我的
        params.assignee_id = user.id
      } else if (activeTab === 'created') {
        // 我分配的：我创建的
        params.creator_id = user.id
      } else if (activeTab === 'all') {
        // 全部任务：使用查询表单参数
        params = { ...searchParams }
      }
      const res = (await getTasks(params)) as Record<string, unknown>[]
      setData(res || [])
    } catch (error) {
      message.error('获取任务列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 拉取统计
  const fetchStats = async () => {
    try {
      const res = await getTaskStats()
      setStats(res)
    } catch (error) {
      // 统计失败不提示，避免干扰
    }
  }

  // 拉取用户列表（用于多负责人选择）
  const fetchUsers = async () => {
    try {
      const res: any = await axios.get('/users', {
        params: { org_id: user.organization_id },
      })
      setUserList(res?.data || [])
    } catch (error) {
      // 拉取失败不提示，避免干扰
    }
  }

  useEffect(() => {
    fetchData()
    fetchStats()
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, searchParams])

  // 新增任务
  const handleAdd = () => {
    form.resetFields()
    form.setFieldsValue({ priority: 'normal', progress: 0, assignee_ids: [] })
    setModalVisible(true)
  }

  // 提交新增任务表单
  const handleSubmit = async (values: any) => {
    try {
      const payload = {
        title: values.title,
        description: values.description || null,
        assignee_id: values.assignee_id || null,
        priority: values.priority || 'normal',
        due_date: values.due_date ? values.due_date.format('YYYY-MM-DD') : null,
        related_case_id: values.related_case_id || null,
        related_lead_id: values.related_lead_id || null,
        // 多负责人ID数组转 JSON 字符串存储（SQLite 无 JSON 类型）
        assignee_ids:
          values.assignee_ids && values.assignee_ids.length > 0
            ? JSON.stringify(values.assignee_ids)
            : null,
        progress: typeof values.progress === 'number' ? values.progress : 0,
      }
      await createTask(payload)
      message.success('任务创建成功')
      setModalVisible(false)
      fetchData()
      fetchStats()
    } catch (error: unknown) {
      message.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || '创建失败')
    }
  }

  // 打开更新进度弹窗
  const handleUpdateProgress = (record: any) => {
    setProgressTaskId(record.id)
    progressForm.setFieldsValue({ progress: Number(record.progress || 0) })
    setProgressModalVisible(true)
  }

  // 提交更新进度
  const handleProgressSubmit = async (values: any) => {
    try {
      await updateProgress(progressTaskId, Number(values.progress || 0))
      message.success('进度更新成功')
      setProgressModalVisible(false)
      fetchData()
      fetchStats()
    } catch (error: unknown) {
      message.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || '更新失败')
    }
  }

  // 开始任务：待办 -> 进行中
  const handleStart = (record: any) => {
    Modal.confirm({
      title: '确认开始',
      content: `确定要开始任务"${record.title}"吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await startTask(record.id)
          message.success('任务已开始')
          fetchData()
          fetchStats()
        } catch (error: unknown) {
          message.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || '操作失败')
        }
      },
    })
  }

  // 完成任务：进行中 -> 已完成
  const handleComplete = (record: any) => {
    Modal.confirm({
      title: '确认完成',
      content: `确定要完成任务"${record.title}"吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await completeTask(record.id)
          message.success('任务已完成')
          fetchData()
          fetchStats()
        } catch (error: unknown) {
          message.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || '操作失败')
        }
      },
    })
  }

  // 取消任务：任意状态 -> 已取消
  const handleCancel = (record: any) => {
    Modal.confirm({
      title: '确认取消',
      content: `确定要取消任务"${record.title}"吗？`,
      okText: '确定',
      cancelText: '返回',
      onOk: async () => {
        try {
          await cancelTask(record.id)
          message.success('任务已取消')
          fetchData()
          fetchStats()
        } catch (error: unknown) {
          message.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || '操作失败')
        }
      },
    })
  }

  // 删除任务
  const handleDelete = (record: any) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除任务"${record.title}"吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteTask(record.id)
          message.success('删除成功')
          fetchData()
          fetchStats()
        } catch (error) {
          message.error('删除失败')
        }
      },
    })
  }

  // 查询
  const handleSearch = () => {
    const values = searchForm.getFieldsValue()
    const params: any = {}
    if (values.priority) params.priority = values.priority
    if (values.status) params.status = values.status
    if (values.keyword) params.keyword = values.keyword
    setSearchParams(params)
  }

  // 重置查询条件
  const handleReset = () => {
    searchForm.resetFields()
    setSearchParams({})
  }

  // 操作按钮：根据状态显示
  const renderActions = (record: any) => (
    <Space>
      {record.status === 'pending' && (
        <Button
          type="link"
          size="small"
          icon={<PlayCircleOutlined />}
          onClick={() => handleStart(record)}
        >
          开始
        </Button>
      )}
      {record.status === 'processing' && (
        <Button
          type="link"
          size="small"
          icon={<CheckCircleOutlined />}
          onClick={() => handleComplete(record)}
        >
          完成
        </Button>
      )}
      {record.status !== 'completed' && (
        <Button
          type="link"
          size="small"
          onClick={() => handleUpdateProgress(record)}
        >
          更新进度
        </Button>
      )}
      {(record.status === 'pending' || record.status === 'processing') && (
        <Button
          type="link"
          size="small"
          danger
          icon={<StopOutlined />}
          onClick={() => handleCancel(record)}
        >
          取消
        </Button>
      )}
      <Button
        type="link"
        size="small"
        danger
        icon={<DeleteOutlined />}
        onClick={() => handleDelete(record)}
      >
        删除
      </Button>
    </Space>
  )

  // 我的任务 列定义（标题/优先级/截止日期/状态/进度/关联案件/操作）
  const mineColumns = [
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 90,
      render: (v: string) => <PriorityTag priority={v} />,
    },
    {
      title: '截止日期',
      dataIndex: 'due_date',
      key: 'due_date',
      width: 120,
      render: (v: string) => formatDate(v),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (v: string) => <StatusTag status={v} />,
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 140,
      render: (v: number) => <Progress percent={Number(v || 0)} size="small" />,
    },
    {
      title: '关联案件',
      dataIndex: 'related_case_id',
      key: 'related_case_id',
      width: 140,
      render: (v: string) => v || '-',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 360,
      render: (_: any, record: any) => renderActions(record),
    },
  ]

  // 我分配的 列定义（标题/负责人/优先级/截止日期/状态/进度/操作）
  const createdColumns = [
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
    {
      title: '负责人',
      dataIndex: 'assignee_id',
      key: 'assignee_id',
      width: 120,
      render: (v: string) => (v ? v.slice(0, 8) : '-'),
      ellipsis: true,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 90,
      render: (v: string) => <PriorityTag priority={v} />,
    },
    {
      title: '截止日期',
      dataIndex: 'due_date',
      key: 'due_date',
      width: 120,
      render: (v: string) => formatDate(v),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (v: string) => <StatusTag status={v} />,
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 140,
      render: (v: number) => <Progress percent={Number(v || 0)} size="small" />,
    },
    {
      title: '操作',
      key: 'action',
      width: 360,
      render: (_: any, record: any) => renderActions(record),
    },
  ]

  // 全部任务 列定义（标题/负责人/优先级/截止日期/状态/进度/关联案件/操作）
  const allColumns = [
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
    {
      title: '负责人',
      dataIndex: 'assignee_id',
      key: 'assignee_id',
      width: 120,
      render: (v: string) => (v ? v.slice(0, 8) : '-'),
      ellipsis: true,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 90,
      render: (v: string) => <PriorityTag priority={v} />,
    },
    {
      title: '截止日期',
      dataIndex: 'due_date',
      key: 'due_date',
      width: 120,
      render: (v: string) => formatDate(v),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (v: string) => <StatusTag status={v} />,
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 140,
      render: (v: number) => <Progress percent={Number(v || 0)} size="small" />,
    },
    {
      title: '关联案件',
      dataIndex: 'related_case_id',
      key: 'related_case_id',
      width: 140,
      render: (v: string) => v || '-',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 360,
      render: (_: any, record: any) => renderActions(record),
    },
  ]

  // Tab 配置
  const tabItems = [
    {
      key: 'mine',
      label: '我的任务',
      children: (
        <>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增任务
            </Button>
          </div>
          <div className="stitch-table">
            <Table
              dataSource={data}
              columns={mineColumns}
              loading={loading}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
            />
          </div>
        </>
      ),
    },
    {
      key: 'created',
      label: '我分配的',
      children: (
        <>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增任务
            </Button>
          </div>
          <div className="stitch-table">
            <Table
              dataSource={data}
              columns={createdColumns}
              loading={loading}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
            />
          </div>
        </>
      ),
    },
    {
      key: 'all',
      label: '全部任务',
      children: (
        <>
          {/* 查询表单：优先级/状态/关键词 — Stitch 规范 stitch-filter-bar 统一浅灰背景+12px圆角 */}
          <div className="stitch-filter-bar">
            <Form form={searchForm} layout="inline" style={{ gap: 8 }}>
              <Form.Item name="priority" label="优先级">
                <Select
                  placeholder="全部"
                  allowClear
                  style={{ width: 120 }}
                  options={priorityOptions}
                />
              </Form.Item>
              <Form.Item name="status" label="状态">
                <Select
                  placeholder="全部"
                  allowClear
                  style={{ width: 120 }}
                  options={statusOptions}
                />
              </Form.Item>
              <Form.Item name="keyword" label="关键词">
                <Input placeholder="任务标题/描述" allowClear style={{ width: 200 }} />
              </Form.Item>
              <Form.Item>
                <div className="stitch-btn-group">
                  <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                    查询
                  </Button>
                  <Button icon={<ReloadOutlined />} onClick={handleReset}>
                    重置
                  </Button>
                </div>
              </Form.Item>
            </Form>
          </div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增任务
            </Button>
          </div>
          <div className="stitch-table">
            <Table
              dataSource={data}
              columns={allColumns}
              loading={loading}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
            />
          </div>
        </>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>任务中心</h2>
      </div>

      {/* 顶部统计卡片：待办数/进行中数/已完成数/已取消数 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="待办" value={Number(stats?.pending || 0)} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="进行中" value={Number(stats?.processing || 0)} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已完成" value={Number(stats?.completed || 0)} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已取消" value={Number(stats?.cancelled || 0)} />
          </Card>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      {/* 新增任务弹窗 */}
      <Modal
        title="新增任务"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入任务标题' }]}
          >
            <Input placeholder="请输入任务标题" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={4} placeholder="请输入任务描述（可空）" />
          </Form.Item>
          <Form.Item name="assignee_id" label="负责人">
            <Input placeholder="请输入负责人ID" />
          </Form.Item>
          <Form.Item name="assignee_ids" label="多负责人">
            <Select
              mode="multiple"
              placeholder="请选择多负责人（可多选）"
              allowClear
              optionFilterProp="label"
              options={userList.map((u: any) => ({
                value: u.id,
                label: u.real_name || u.phone || u.id,
              }))}
            />
          </Form.Item>
          <Form.Item name="priority" label="优先级">
            <Select placeholder="请选择优先级" options={priorityOptions} />
          </Form.Item>
          <Form.Item name="due_date" label="截止日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="related_case_id" label="关联案件">
            <Input placeholder="请输入关联案件ID（可空）" />
          </Form.Item>
          <Form.Item name="related_lead_id" label="关联线索">
            <Input placeholder="请输入关联线索ID（可空）" />
          </Form.Item>
          <Form.Item name="progress" label="任务进度" initialValue={0}>
            <Slider min={0} max={100} marks={{ 0: '0', 50: '50', 100: '100' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 更新任务进度弹窗 */}
      <Modal
        title="更新任务进度"
        open={progressModalVisible}
        onCancel={() => setProgressModalVisible(false)}
        onOk={() => progressForm.submit()}
        width={480}
        okText="保存"
        cancelText="取消"
      >
        <Form form={progressForm} onFinish={handleProgressSubmit} layout="vertical">
          <Form.Item
            name="progress"
            label="任务进度（0-100，达到100将自动完成）"
            rules={[{ required: true, message: '请设置任务进度' }]}
          >
            <Slider min={0} max={100} marks={{ 0: '0', 50: '50', 100: '100' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
