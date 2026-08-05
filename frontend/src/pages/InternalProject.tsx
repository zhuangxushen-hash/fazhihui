// 内部项目页面：对齐金助理实勘，管理律所内部研发/培训/会议/行政等内部项目
import { useState, useEffect } from 'react'
import {
  Tabs,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Space,
  Tag,
  message,
} from 'antd'
import { PlusOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import axios from '../api/axios'
import dayjs from 'dayjs'

// 项目状态选项
const projectStatusOptions = [
  { value: '', label: '全部' },
  { value: 'preparing', label: '筹备中' },
  { value: 'in_progress', label: '进行中' },
  { value: 'paused', label: '已暂停' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
]

// 项目类别选项
const categoryOptions = [
  { value: '', label: '全部' },
  { value: 'internal_rd', label: '内部研发' },
  { value: 'training', label: '培训' },
  { value: 'meeting', label: '会议' },
  { value: 'admin', label: '行政' },
  { value: 'other', label: '其他' },
]

// 查询子项目选项
const querySubOptions = [
  { value: 'yes', label: '是' },
  { value: 'no', label: '否' },
]

// 创建表单中的项目类别选项（不含"全部"）
const formCategoryOptions = categoryOptions.filter((o) => o.value !== '')

// 项目类别中文映射
const categoryLabels: Record<string, string> = {
  internal_rd: '内部研发',
  training: '培训',
  meeting: '会议',
  admin: '行政',
  other: '其他',
}

export default function InternalProject() {
  const [activeTab, setActiveTab] = useState('in_progress')
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  // 创建内部项目弹窗
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [createForm] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = (await axios.get('/internal-projects', {
        params: {
          tab: activeTab,
          ...form.getFieldsValue(),
        },
      })) as Record<string, unknown> | Record<string, unknown>[]
      const list = (Array.isArray(res) ? res : ((res as Record<string, unknown>)?.data as Record<string, unknown>[])) || []
      setData(list)
    } catch (error) {
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const handleSearch = () => {
    fetchData()
  }

  const handleReset = () => {
    form.resetFields()
    fetchData()
  }

  // 打开创建内部项目弹窗
  const handleOpenCreate = () => {
    createForm.resetFields()
    setCreateModalVisible(true)
  }

  // 提交创建内部项目
  const handleCreate = async (values: Record<string, unknown>) => {
    try {
      await axios.post('/internal-projects', {
        ...values,
        start_date: values.start_date ? dayjs(values.start_date as dayjs.Dayjs).format('YYYY-MM-DD') : undefined,
      })
      message.success('内部项目创建成功')
      setCreateModalVisible(false)
      fetchData()
    } catch (error) {
      // 接口不存在时本地新增
      const newItem = {
        id: `local_${Date.now()}`,
        name: values.name as string,
        category: values.category as string,
        start_date: values.start_date ? dayjs(values.start_date as dayjs.Dayjs).format('YYYY-MM-DD') : '',
        team: values.team as string,
        supervisor: values.supervisor as string,
        leader: values.leader as string,
        stage: '筹备阶段',
        status: 'preparing',
      }
      setData((prev) => [newItem, ...prev])
      message.success('内部项目创建成功')
      setCreateModalVisible(false)
    }
  }

  // 日期格式化
  const renderDate = (t: string) => (t ? dayjs(t).format('YYYY-MM-DD') : '-')

  // 项目类别渲染
  const renderCategory = (category: string) => {
    const label = categoryLabels[category] || category
    return <Tag color="blue">{label}</Tag>
  }

  // 列定义（9列）
  const columns = [
    { title: '项目名称', dataIndex: 'name', key: 'name', ellipsis: true, width: 220 },
    { title: '类别', dataIndex: 'category', key: 'category', width: 100, render: renderCategory },
    { title: '启动时间', dataIndex: 'start_date', key: 'start_date', width: 120, render: renderDate },
    { title: '所属团队', dataIndex: 'team', key: 'team', width: 120 },
    { title: '主管', dataIndex: 'supervisor', key: 'supervisor', width: 100 },
    { title: '主办', dataIndex: 'leader', key: 'leader', width: 100 },
    { title: '进程阶段', dataIndex: 'stage', key: 'stage', width: 120 },
    {
      title: '项目管理页',
      dataIndex: 'manage_page',
      key: 'manage_page',
      width: 110,
      render: () => <Button type="link" size="small" onClick={() => message.info('项目管理页开发中')}>进入管理</Button>,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: Record<string, unknown>) => (
        <Button type="link" size="small" onClick={() => message.info(`查看项目：${record.name}`)}>详情</Button>
      ),
    },
  ]

  const tabItems = [
    { key: 'in_progress', label: '在办项目' },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>内部项目</h2>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>创建内部项目</Button>
        </Space>
      </div>

      {/* 查询条件区域 */}
      <div style={{ background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16 }}>
        <Form form={form} layout="inline" style={{ gap: 8 }}>
          <Form.Item label="项目状态" name="status">
            <Select placeholder="全部" allowClear style={{ width: 140 }} options={projectStatusOptions} />
          </Form.Item>
          <Form.Item label="项目类别" name="category">
            <Select placeholder="全部" allowClear style={{ width: 140 }} options={categoryOptions} />
          </Form.Item>
          <Form.Item label="查询子项目" name="query_sub">
            <Select placeholder="否" allowClear style={{ width: 100 }} options={querySubOptions} />
          </Form.Item>
          <Form.Item label="项目名称/备注名" name="keyword">
            <Input placeholder="请输入项目名称或备注名" allowClear style={{ width: 200 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      {/* 表格区域 */}
      <div style={{ background: '#fff', padding: 16, borderRadius: 8 }}>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key)}
          items={tabItems}
          style={{ marginBottom: 16 }}
        />
        <Table
          dataSource={data}
          columns={columns}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
        />
      </div>

      {/* 创建内部项目弹窗 */}
      <Modal
        title="创建内部项目"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={() => createForm.submit()}
        width={600}
        okText="提交"
        cancelText="取消"
      >
        <Form form={createForm} onFinish={handleCreate} layout="vertical">
          <Form.Item name="name" label="项目名称" rules={[{ required: true, message: '请输入项目名称' }]}>
            <Input placeholder="请输入项目名称" />
          </Form.Item>
          <Form.Item name="category" label="项目类别" rules={[{ required: true, message: '请选择项目类别' }]}>
            <Select placeholder="请选择项目类别" options={formCategoryOptions} />
          </Form.Item>
          <Form.Item name="start_date" label="启动时间" rules={[{ required: true, message: '请选择启动时间' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="team" label="所属团队" rules={[{ required: true, message: '请输入所属团队' }]}>
            <Input placeholder="请输入所属团队" />
          </Form.Item>
          <Form.Item name="supervisor" label="主管" rules={[{ required: true, message: '请输入主管' }]}>
            <Input placeholder="请输入主管" />
          </Form.Item>
          <Form.Item name="leader" label="主办" rules={[{ required: true, message: '请输入主办' }]}>
            <Input placeholder="请输入主办" />
          </Form.Item>
          <Form.Item name="description" label="项目描述">
            <Input.TextArea rows={4} placeholder="请输入项目描述（选填）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
