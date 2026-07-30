import { useState, useEffect, useCallback } from 'react'
import { Table, Button, Tag, Space, message, Modal, Input, Select, Form } from 'antd'
import { ReadOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import {
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
} from '../api/notification'

const typeLabels: Record<string, string> = {
  system: '系统通知',
  case: '案件通知',
  task: '任务提醒',
  warning: '预警通知',
  approval: '审批通知',
  chat: '聊天通知',
}

const levelColors: Record<string, string> = {
  low: 'blue',
  normal: 'default',
  high: 'orange',
  urgent: 'red',
}

const levelLabels: Record<string, string> = {
  low: '低',
  normal: '普通',
  high: '重要',
  urgent: '紧急',
}

export default function NotificationList() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchForm] = Form.useForm()

  const fetchData = useCallback(async (params?: any) => {
    setLoading(true)
    try {
      const list = await getNotifications(params)
      setData(list || [])
    } catch (error) {
      message.error('获取通知列表失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = () => {
    const values = searchForm.getFieldsValue()
    const params: any = {}
    if (values.keyword) params.keyword = values.keyword
    if (values.type) params.type = values.type
    if (values.level) params.level = values.level
    if (values.isRead !== undefined && values.isRead !== null && values.isRead !== 'all') {
      params.isRead = values.isRead === 'true'
    }
    fetchData(params)
  }

  const handleReset = () => {
    searchForm.resetFields()
    fetchData()
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id)
      message.success('已标记为已读')
      handleSearch()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条通知吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteNotification(id)
          message.success('删除成功')
          handleSearch()
        } catch (error) {
          message.error('删除失败')
        }
      },
    })
  }

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 220,
      render: (text: string, record: any) => (
        <Space>
          <span style={{ fontWeight: record.is_read ? 400 : 600 }}>{text}</span>
          {!record.is_read && <Tag color="blue">未读</Tag>}
        </Space>
      ),
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => <Tag>{typeLabels[type] || type}</Tag>,
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: string) => (
        <Tag color={levelColors[level] || 'default'}>{levelLabels[level] || level}</Tag>
      ),
    },
    {
      title: '关联类型',
      dataIndex: 'related_type',
      key: 'related_type',
      width: 100,
      render: (text: string) => text || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (time: string) => new Date(time).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 130,
      render: (_: any, record: any) => (
        <Space>
          {!record.is_read && (
            <Button type="link" size="small" icon={<ReadOutlined />} onClick={() => handleMarkAsRead(record.id)}>
              标记已读
            </Button>
          )}
          <Button type="link" size="small" danger onClick={() => handleDelete(record.id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>消息通知</h2>
      </div>

      <div style={{ background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16 }}>
        <Form form={searchForm} layout="inline" style={{ gap: 8 }}>
          <Form.Item name="keyword" label="关键词">
            <Input placeholder="搜索标题或内容" allowClear style={{ width: 200 }} onPressEnter={handleSearch} />
          </Form.Item>
          <Form.Item name="type" label="类型">
            <Select placeholder="全部类型" allowClear style={{ width: 120 }} options={Object.entries(typeLabels).map(([value, label]) => ({ value, label }))} />
          </Form.Item>
          <Form.Item name="level" label="级别">
            <Select placeholder="全部级别" allowClear style={{ width: 120 }} options={Object.entries(levelLabels).map(([value, label]) => ({ value, label }))} />
          </Form.Item>
          <Form.Item name="isRead" label="状态">
            <Select placeholder="全部" allowClear style={{ width: 100 }} options={[
              { value: 'true', label: '已读' },
              { value: 'false', label: '未读' },
            ]} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <Table
        dataSource={data}
        columns={columns}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        scroll={{ x: 1000 }}
      />
    </div>
  )
}
