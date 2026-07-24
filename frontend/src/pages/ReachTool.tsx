import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Tag, Space, DatePicker } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SendOutlined, ScheduleOutlined } from '@ant-design/icons'
import axios from '../api/axios'
import { formatDateTime } from '../utils/format'
import dayjs from 'dayjs'

const { TextArea } = Input

const taskTypeOptions = [
  { value: '1v1', label: '1v1私聊' },
  { value: 'moments', label: '朋友圈' },
  { value: 'group_sop', label: '社群SOP' },
]

const statusOptions = [
  { value: 'draft', label: '草稿' },
  { value: 'pending', label: '待发送' },
  { value: 'sending', label: '发送中' },
  { value: 'sent', label: '已发送' },
  { value: 'failed', label: '失败' },
]

const taskTypeLabel: Record<string, string> = {
  '1v1': '1v1私聊',
  moments: '朋友圈',
  group_sop: '社群SOP',
}

const taskTypeColor: Record<string, string> = {
  '1v1': 'blue',
  moments: 'orange',
  group_sop: 'green',
}

const statusLabel: Record<string, string> = {
  draft: '草稿',
  pending: '待发送',
  sending: '发送中',
  sent: '已发送',
  failed: '失败',
}

const statusColor: Record<string, string> = {
  draft: 'default',
  pending: 'processing',
  sending: 'blue',
  sent: 'success',
  failed: 'error',
}

export default function ReachTool() {
  const [data, setData] = useState<any[]>([])
  const [tags, setTags] = useState<any[]>([])
  const [momentsSchedule, setMomentsSchedule] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [scheduleVisible, setScheduleVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<any>(null)
  const [form] = Form.useForm()
  const [targetCount, setTargetCount] = useState<number | null>(null)

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [tasksRes, tagsRes]: any = await Promise.all([
        axios.get('/scrm/reach-tasks', { params: { org_id: user.organization_id } }),
        axios.get('/scrm/client-tags', { params: { org_id: user.organization_id } }),
      ])
      setData(tasksRes || [])
      setTags(tagsRes || [])
    } catch (error) {
      console.error('Fetch reach tasks error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAdd = () => {
    setCurrentItem(null)
    form.resetFields()
    form.setFieldsValue({ task_type: '1v1', status: 'draft' })
    setTargetCount(null)
    setModalVisible(true)
  }

  const handleEdit = (record: any) => {
    setCurrentItem(record)
    const targetTags = record.target_tags ? JSON.parse(record.target_tags) : []
    const mediaPaths = record.media_paths ? JSON.parse(record.media_paths) : []
    const publishAccounts = record.publish_accounts ? JSON.parse(record.publish_accounts) : []
    form.setFieldsValue({
      ...record,
      target_tags: targetTags,
      media_paths: mediaPaths.join('\n'),
      publish_accounts: publishAccounts.join('\n'),
      schedule_time: record.schedule_time ? dayjs(record.schedule_time) : null,
    })
    setModalVisible(true)
  }

  const handleCalcTarget = async () => {
    try {
      const values = await form.validateFields(['target_tags'])
      const res: any = await axios.post('/scrm/reach-tasks/target-count', {
        tag_ids: values.target_tags || [],
      })
      setTargetCount(res)
    } catch (error) {
      console.error('Calc target error:', error)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const mediaPaths = (values.media_paths as string || '')
        .split('\n')
        .map((s: string) => s.trim())
        .filter(Boolean)
      const publishAccounts = (values.publish_accounts as string || '')
        .split('\n')
        .map((s: string) => s.trim())
        .filter(Boolean)
      const payload = {
        ...values,
        target_tags: values.target_tags || [],
        media_paths: mediaPaths,
        publish_accounts: publishAccounts,
        schedule_time: values.schedule_time ? values.schedule_time.toISOString() : null,
        organization_id: user.organization_id,
        created_by: user.id,
      }
      if (currentItem) {
        await axios.put(`/scrm/reach-tasks/${currentItem.id}`, payload)
        message.success('更新成功')
      } else {
        await axios.post('/scrm/reach-tasks', payload)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchData()
    } catch (error) {
      console.error('Submit error:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/scrm/reach-tasks/${id}`)
      message.success('删除成功')
      fetchData()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSend = async (record: any) => {
    try {
      await axios.post(`/scrm/reach-tasks/${record.id}/send`)
      message.success(`已发送, 触达 ${record.sent_count || 0} 个目标`)
      fetchData()
    } catch (error) {
      message.error('发送失败')
    }
  }

  const handleViewSchedule = async () => {
    try {
      const res: any = await axios.get('/scrm/reach-tasks/moments-schedule', {
        params: {
          org_id: user.organization_id,
          start_date: dayjs().subtract(30, 'day').toISOString(),
          end_date: dayjs().add(30, 'day').toISOString(),
        },
      })
      setMomentsSchedule(res || [])
      setScheduleVisible(true)
    } catch (error) {
      console.error('Fetch schedule error:', error)
    }
  }

  const columns = [
    { title: '任务类型', dataIndex: 'task_type', key: 'task_type', render: (v: string) => <Tag color={taskTypeColor[v] || 'default'}>{taskTypeLabel[v] || v}</Tag> },
    {
      title: '内容预览',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (v: string) => <span style={{ color: '#48484a' }}>{(v || '').slice(0, 50)}{(v || '').length > 50 ? '...' : ''}</span>,
    },
    {
      title: '目标标签',
      key: 'target_tags',
      render: (_: any, record: any) => {
        try {
          const tagIds = record.target_tags ? JSON.parse(record.target_tags) : []
          return tagIds.length > 0
            ? <Tag color="orange">{tagIds.length} 个标签</Tag>
            : <span style={{ color: '#86868b' }}>全部</span>
        } catch {
          return '-'
        }
      },
    },
    { title: '目标数', dataIndex: 'target_count', key: 'target_count' },
    { title: '已发送', dataIndex: 'sent_count', key: 'sent_count' },
    { title: '排期时间', dataIndex: 'schedule_time', key: 'schedule_time', render: (v: string) => v ? formatDateTime(v) : '-' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => <Tag color={statusColor[v] || 'default'}>{statusLabel[v] || v}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      render: (_: any, record: any) => (
        <Space>
          {record.status !== 'sent' && (
            <Button size="small" type="primary" icon={<SendOutlined />} onClick={() => handleSend(record)}>发送</Button>
          )}
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ]

  const scheduleColumns = [
    { title: '排期时间', dataIndex: 'schedule_time', key: 'schedule_time', render: (v: string) => formatDateTime(v) },
    { title: '内容预览', dataIndex: 'content', key: 'content', ellipsis: true, render: (v: string) => (v || '').slice(0, 60) },
    { title: '发布账号', key: 'publish_accounts', render: (_: any, r: any) => {
      try {
        const acc = r.publish_accounts ? JSON.parse(r.publish_accounts) : []
        return acc.length
      } catch { return 0 }
    } },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color={statusColor[v] || 'default'}>{statusLabel[v] || v}</Tag> },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1d1d1f', margin: 0 }}>私域触达工具</h2>
          <p style={{ fontSize: 14, color: '#86868b', marginTop: 4 }}>1v1 / 朋友圈 / 社群SOP, 按标签筛选发送, 多账号同步发布</p>
        </div>
        <Space>
          <Button
            icon={<ScheduleOutlined />}
            onClick={handleViewSchedule}
            style={{ borderRadius: 10, padding: '8px 20px', border: '1px solid rgba(0, 0, 0, 0.08)' }}
          >
            朋友圈排期
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            style={{ borderRadius: 10, padding: '8px 20px', background: '#0071e3', border: 'none' }}
          >
            新建触达任务
          </Button>
        </Space>
      </div>

      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)', overflow: 'hidden' }}>
        <Table
          dataSource={data}
          columns={columns}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          style={{ padding: 20 }}
        />
      </div>

      <Modal
        title={currentItem ? '编辑触达任务' : '新建触达任务'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={720}
        style={{ borderRadius: 20 }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="task_type" label="任务类型" rules={[{ required: true }]}>
            <Select options={taskTypeOptions} style={{ borderRadius: 10 }} />
          </Form.Item>
          <Form.Item name="target_tags" label="目标标签(可多选)">
            <Select
              mode="multiple"
              placeholder="选择标签, 不选则发送给全部"
              style={{ borderRadius: 10 }}
              optionFilterProp="label"
            >
              {tags.map(t => (
                <Select.Option key={t.id} value={t.id}>{t.tag_name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button onClick={handleCalcTarget} style={{ borderRadius: 10 }}>计算目标数</Button>
              {targetCount !== null && (
                <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>目标客户: {targetCount}</Tag>
              )}
            </Space>
          </Form.Item>
          <Form.Item name="content" label="触达内容" rules={[{ required: true, message: '请输入触达内容' }]}>
            <TextArea rows={5} placeholder="支持文本、链接、表情..." style={{ borderRadius: 10 }} />
          </Form.Item>
          <Form.Item name="media_paths" label="配图路径(每行一个)">
            <TextArea rows={3} placeholder={'/images/poster1.png\n/images/poster2.png'} style={{ borderRadius: 10 }} />
          </Form.Item>
          <Form.Item name="publish_accounts" label="发布账号(每行一个, 多账号同步发布)">
            <TextArea rows={3} placeholder={'wework-account-001\nwework-account-002'} style={{ borderRadius: 10 }} />
          </Form.Item>
          <Form.Item name="schedule_time" label="排期时间">
            <DatePicker
              showTime
              style={{ width: '100%', borderRadius: 10 }}
              placeholder="选择排期时间"
            />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select options={statusOptions} style={{ borderRadius: 10 }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="朋友圈统一排期"
        open={scheduleVisible}
        onCancel={() => setScheduleVisible(false)}
        footer={null}
        width={900}
        style={{ borderRadius: 20 }}
      >
        <Table
          dataSource={momentsSchedule}
          columns={scheduleColumns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Modal>
    </div>
  )
}
