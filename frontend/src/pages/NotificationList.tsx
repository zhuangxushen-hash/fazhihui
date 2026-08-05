import { useState, useEffect, useCallback } from 'react'
import { Menu, Table, Button, Tag, Space, message, Modal, Input, Select, Form } from 'antd'
import { ReadOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import {
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
} from '../api/notification'

// 左侧菜单：3大类6子项（最新公告 / 本所公告6子项 / 信息发布管理）
const menuItems = [
  { key: 'latest', label: '最新公告' },
  {
    type: 'group' as const,
    label: '本所公告',
    children: [
      { key: 'notice', label: '通知公告' },
      { key: 'news', label: '本所新闻' },
      { key: 'duty', label: '值班通知' },
      { key: 'signing', label: '签约动态' },
      { key: 'regulation', label: '规章制度' },
      { key: 'industry', label: '行业动态' },
    ],
  },
  { key: 'publish-manage', label: '信息发布管理' },
]

const typeLabels: Record<string, string> = {
  system: '系统通知',
  case: '案件通知',
  task: '任务提醒',
  warning: '预警通知',
  approval: '审批通知',
  chat: '聊天通知',
}

// 级别对应的 Stitch Tag 类名（原为 antd color 值，现替换为 Stitch 类名变体，保留按级别映射样式的逻辑）
const levelColors: Record<string, string> = {
  low: 'stitch-tag stitch-tag-primary',
  normal: 'stitch-tag stitch-tag-info',
  high: 'stitch-tag stitch-tag-warning',
  urgent: 'stitch-tag stitch-tag-error',
}

const levelLabels: Record<string, string> = {
  low: '低',
  normal: '普通',
  high: '重要',
  urgent: '紧急',
}

export default function NotificationList() {
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(false)
  const [searchForm] = Form.useForm()
  // 当前选中的左侧菜单分类（3大类6子项）
  const [activeCategory, setActiveCategory] = useState('latest')

  const fetchData = useCallback(async (params?: Record<string, unknown>) => {
    setLoading(true)
    try {
      const list = await getNotifications(params)
      setData((list as Record<string, unknown>[]) || [])
    } catch (error) {
      message.error('获取通知列表失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData({ category: activeCategory })
  }, [fetchData, activeCategory])

  const handleSearch = () => {
    const values = searchForm.getFieldsValue()
    const params: Record<string, unknown> = { category: activeCategory }
    if (values.keyword) params.keyword = values.keyword
    if (values.type) params.type = values.type
    if (values.level) params.level = values.level
    if (values.isRead !== undefined && values.isRead !== null && values.isRead !== 'all') {
      params.isRead = values.isRead === 'true'
    }
    fetchData(params)
  }

  // 左侧菜单切换时按分类重新获取数据
  const handleMenuClick = (key: string) => {
    setActiveCategory(key)
  }

  const handleReset = () => {
    searchForm.resetFields()
    fetchData({ category: activeCategory })
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
      render: (text: string, record: Record<string, unknown>) => (
        <Space>
          <span style={{ fontWeight: (record.is_read as boolean) ? 400 : 600 }}>{text}</span>
          {!(record.is_read as boolean) && <Tag className="stitch-tag stitch-tag-primary">未读</Tag>}
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
      render: (type: string) => <Tag className="stitch-tag stitch-tag-info">{typeLabels[type] || type}</Tag>,
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: string) => (
        <Tag className={levelColors[level] || 'stitch-tag stitch-tag-info'}>{levelLabels[level] || level}</Tag>
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
      render: (_: unknown, record: Record<string, unknown>) => (
        <Space>
          {!(record.is_read as boolean) && (
            <Button type="link" size="small" icon={<ReadOutlined />} onClick={() => handleMarkAsRead(record.id as string)}>
              标记已读
            </Button>
          )}
          <Button type="link" size="small" danger onClick={() => handleDelete(record.id as string)}>
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
      <div style={{ display: 'flex', gap: 16 }}>
        {/* 左侧菜单：3大类6子项 */}
        <div style={{ background: '#fff', padding: 8, borderRadius: 8, width: 220, flexShrink: 0 }}>
          <Menu
            mode="inline"
            selectedKeys={[activeCategory]}
            items={menuItems}
            onClick={(e) => handleMenuClick(e.key)}
            style={{ borderInlineEnd: 'none' }}
          />
        </div>
        {/* 右侧主区域：保留原有查询条件与表格 */}
        <div style={{ flex: 1, minWidth: 0 }}>
      <div className="stitch-filter-bar" style={{ background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16 }}>
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
            <Space className="stitch-btn-group">
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <div className="stitch-table">
        <Table
          dataSource={data}
          columns={columns}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
          scroll={{ x: 1000 }}
        />
      </div>
        </div>
      </div>
    </div>
  )
}
