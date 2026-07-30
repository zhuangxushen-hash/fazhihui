import { useState, useEffect, useCallback } from 'react'
import { List, Button, Tag, Space, message, Badge, Empty, Tabs, Modal } from 'antd'
import { ReadOutlined, ClearOutlined } from '@ant-design/icons'
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
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

export default function NotificationList() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('all')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      let list: any[] = []
      if (activeTab === 'unread') {
        list = await getNotifications(false)
      } else if (activeTab === 'read') {
        list = await getNotifications(true)
      } else {
        list = await getNotifications()
      }
      setNotifications(list || [])
      const count = await getUnreadCount()
      setUnreadCount(count || 0)
    } catch (error) {
      message.error('获取通知列表失败')
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id)
      message.success('已标记为已读')
      fetchData()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleMarkAllAsRead = async () => {
    Modal.confirm({
      title: '确认操作',
      content: '确定要将所有通知标记为已读吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await markAllNotificationsAsRead()
          message.success('已全部标记为已读')
          fetchData()
        } catch (error) {
          message.error('操作失败')
        }
      },
    })
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
          fetchData()
        } catch (error) {
          message.error('删除失败')
        }
      },
    })
  }

  const handleClearAll = async () => {
    Modal.confirm({
      title: '确认清空',
      content: '确定要清空所有通知吗？此操作不可恢复！',
      okText: '确定',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          await clearAllNotifications()
          message.success('已清空所有通知')
          fetchData()
        } catch (error) {
          message.error('操作失败')
        }
      },
    })
  }

  const renderList = () => {
    if (notifications.length === 0) {
      return <Empty description="暂无通知" style={{ padding: 60 }} />
    }

    return (
      <List
        dataSource={notifications}
        loading={loading}
        renderItem={(item) => (
          <List.Item
            style={{
              background: item.is_read ? '#fff' : 'rgba(24, 144, 255, 0.04)',
              padding: '16px 24px',
            }}
            actions={[
              !item.is_read && (
                <Button type="link" size="small" onClick={() => handleMarkAsRead(item.id)}>
                  标记已读
                </Button>
              ),
              <Button type="link" size="small" danger onClick={() => handleDelete(item.id)}>
                删除
              </Button>,
            ].filter(Boolean)}
          >
            <List.Item.Meta
              avatar={
                <Tag color={levelColors[item.level] || 'default'} style={{ marginRight: 8 }}>
                  {(typeLabels[item.type] || '通知').slice(0, 2)}
                </Tag>
              }
              title={
                <Space>
                  <span style={{ fontWeight: item.is_read ? 400 : 600 }}>{item.title}</span>
                  {item.level === 'urgent' && <Tag color="red">紧急</Tag>}
                  {item.level === 'high' && <Tag color="orange">重要</Tag>}
                </Space>
              }
              description={
                <div>
                  {item.content && <div style={{ color: '#666', marginBottom: 4 }}>{item.content}</div>}
                  <div style={{ fontSize: 12, color: '#999' }}>
                    <Tag color={levelColors[item.level] || 'default'}>
                      {typeLabels[item.type] || '系统通知'}
                    </Tag>
                    <span style={{ marginLeft: 8 }}>
                      {new Date(item.created_at).toLocaleString('zh-CN')}
                    </span>
                  </div>
                </div>
              }
            />
          </List.Item>
        )}
      />
    )
  }

  const tabItems = [
    {
      key: 'all',
      label: '全部通知',
      children: renderList(),
    },
    {
      key: 'unread',
      label: <Badge count={unreadCount} offset={[10, 0]}>未读通知</Badge>,
      children: renderList(),
    },
    {
      key: 'read',
      label: '已读通知',
      children: renderList(),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>消息通知</h2>
        <Space>
          <Button icon={<ReadOutlined />} onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
            全部已读
          </Button>
          <Button icon={<ClearOutlined />} danger onClick={handleClearAll}>
            清空全部
          </Button>
        </Space>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
    </div>
  )
}
