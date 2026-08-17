import { useState, useEffect } from 'react'
import {
  Card,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Tag,
  Table,
  message,
  Tabs,
  Empty,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  PoweroffOutlined,
  VideoCameraOutlined,
  EyeOutlined,
  MessageOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  getFakeLiveRooms,
  createFakeLiveRoom,
  updateFakeLiveRoom,
  deleteFakeLiveRoom,
  startFakeLiveRoom,
  endFakeLiveRoom,
  getFakeLiveRoomMessages,
  getFakeLiveRoomViewers,
  type FakeLiveRoom,
  type FakeLiveMessage,
  type FakeLiveViewer,
} from '../api/marketing'
import { theme } from '../constants/theme'

const statusConfig: Record<string, { color: string; label: string }> = {
  draft: { color: 'default', label: '草稿' },
  live: { color: 'red', label: '直播中' },
  ended: { color: 'gray', label: '已结束' },
}

interface FakeLiveManagementProps {
  hideTabs?: boolean
}

export default function FakeLiveManagement({ hideTabs = false }: FakeLiveManagementProps) {
  const [activeTab, setActiveTab] = useState('rooms')
  const [roomList, setRoomList] = useState<FakeLiveRoom[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<FakeLiveRoom | null>(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [detailRoom, setDetailRoom] = useState<FakeLiveRoom | null>(null)
  const [detailTab, setDetailTab] = useState<'messages' | 'viewers'>('messages')
  const [messages, setMessages] = useState<FakeLiveMessage[]>([])
  const [viewers, setViewers] = useState<FakeLiveViewer[]>([])
  const [form] = Form.useForm()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const fetchList = async () => {
    setLoading(true)
    try {
      const res = await getFakeLiveRooms({ org_id: user.organization_id })
      setRoomList(res || [])
    } catch (_error) {
      // 错误已由拦截器处理
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList()
  }, [])

  const handleAdd = () => {
    setCurrentItem(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: FakeLiveRoom) => {
    setCurrentItem(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (currentItem) {
        await updateFakeLiveRoom(currentItem.id, values)
        message.success('更新成功')
      } else {
        await createFakeLiveRoom({
          ...values,
          organization_id: user.organization_id,
          created_by: user.id,
        })
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchList()
    } catch (_error) {
      // 错误已由拦截器处理
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteFakeLiveRoom(id)
      message.success('删除成功')
      fetchList()
    } catch (_error) {
      message.error('删除失败')
    }
  }

  const handleStart = async (id: string) => {
    try {
      await startFakeLiveRoom(id)
      message.success('开播成功')
      fetchList()
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } }
      message.error(err?.response?.data?.message || '开播失败')
    }
  }

  const handleEnd = async (id: string) => {
    try {
      await endFakeLiveRoom(id)
      message.success('直播已结束')
      fetchList()
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } }
      message.error(err?.response?.data?.message || '结束失败')
    }
  }

  const handleViewDetail = async (record: FakeLiveRoom) => {
    setDetailRoom(record)
    setDetailTab('messages')
    setDetailVisible(true)
    try {
      const [msgRes, viewerRes] = await Promise.all([
        getFakeLiveRoomMessages(record.id, 200),
        getFakeLiveRoomViewers(record.id),
      ])
      setMessages(msgRes || [])
      setViewers(viewerRes || [])
    } catch (_error) {
      // 错误已由拦截器处理
    }
  }

  const renderRoomList = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>伪直播管理</h2>
          <p style={{ fontSize: 14, color: '#86868b', marginTop: 4 }}>
            创建伪直播间，设置视频URL，模拟直播播放
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          style={{ borderRadius: 10, background: theme.primary, border: 'none' }}
        >
          创建直播间
        </Button>
      </div>

      {roomList.length === 0 ? (
        <Card style={{ borderRadius: 16, textAlign: 'center', padding: '60px 20px' }}>
          <Empty description="暂无直播间，点击右上角创建一个" />
        </Card>
      ) : (
        <Card style={{ borderRadius: 16 }}>
          <Table
            rowKey="id"
            loading={loading}
            dataSource={roomList}
            pagination={{ pageSize: 10 }}
            columns={[
              {
                title: '直播标题',
                dataIndex: 'title',
                key: 'title',
                render: (text: string) => (
                  <span style={{ fontWeight: 500 }}>{text}</span>
                ),
              },
              {
                title: '主播',
                dataIndex: 'anchor_name',
                key: 'anchor_name',
                width: 100,
              },
              {
                title: '视频URL',
                dataIndex: 'video_url',
                key: 'video_url',
                ellipsis: true,
                render: (text: string) => (
                  <span style={{ color: '#717785', fontSize: 12 }}>{text || '未设置'}</span>
                ),
              },
              {
                title: '状态',
                dataIndex: 'status',
                key: 'status',
                width: 100,
                render: (status: string) => {
                  const info = statusConfig[status] || statusConfig.draft
                  return <Tag color={info.color}>{info.label}</Tag>
                },
              },
              {
                title: '观看数',
                dataIndex: 'viewer_count',
                key: 'viewer_count',
                width: 80,
                render: (v: number) => v || 0,
              },
              {
                title: '创建时间',
                dataIndex: 'created_at',
                key: 'created_at',
                width: 160,
                render: (text: string) => (
                  <span style={{ color: '#717785', fontSize: 12 }}>{text?.slice(0, 16)}</span>
                ),
              },
              {
                title: '操作',
                key: 'action',
                width: 240,
                fixed: 'right',
                render: (_: unknown, record: FakeLiveRoom) => (
                  <Space>
                    <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                      编辑
                    </Button>
                    <Button
                      size="small"
                      icon={<MessageOutlined />}
                      onClick={() => handleViewDetail(record)}
                    >
                      详情
                    </Button>
                    {record.status === 'draft' || record.status === 'ended' ? (
                      <Button
                        size="small"
                        type="primary"
                        danger
                        icon={<PlayCircleOutlined />}
                        onClick={() => handleStart(record.id)}
                      >
                        开播
                      </Button>
                    ) : record.status === 'live' ? (
                      <Button
                        size="small"
                        danger
                        icon={<PoweroffOutlined />}
                        onClick={() => handleEnd(record.id)}
                      >
                        结束
                      </Button>
                    ) : null}
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDelete(record.id)}
                    >
                      删除
                    </Button>
                  </Space>
                ),
              },
            ]}
          />
        </Card>
      )}
    </div>
  )

  return (
    <div>
      {!hideTabs && (
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ marginBottom: 24 }}
          items={[
            {
              key: 'rooms',
              label: (
                <span>
                  <VideoCameraOutlined /> 直播间管理
                </span>
              ),
            },
          ]}
        />
      )}

      {activeTab === 'rooms' && renderRoomList()}

      <Modal
        title={currentItem ? '编辑直播间' : '创建直播间'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={560}
        okText={currentItem ? '保存' : '创建'}
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="直播标题"
            rules={[{ required: true, message: '请输入直播标题' }]}
          >
            <Input placeholder="例如：婚姻家事法律咨询专场" />
          </Form.Item>
          <Form.Item
            name="anchor_name"
            label="主播名称"
            rules={[{ required: true, message: '请输入主播名称' }]}
          >
            <Input placeholder="请输入主播名称" />
          </Form.Item>
          <Form.Item name="video_url" label="视频URL（可替换）">
            <Input placeholder="https://example.com/video.mp4" />
          </Form.Item>
          <Form.Item name="cover_url" label="封面图URL">
            <Input placeholder="封面图链接（可选）" />
          </Form.Item>
          <Form.Item name="max_viewers" label="最大观看人数">
            <Input type="number" placeholder="不填则不限制" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={detailRoom ? `${detailRoom.title} - 详情` : '详情'}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {detailRoom && (
          <div>
            <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
              <Tag color={statusConfig[detailRoom.status]?.color}>
                {statusConfig[detailRoom.status]?.label}
              </Tag>
              <span style={{ color: '#717785' }}>
                <EyeOutlined /> {detailRoom.viewer_count || 0} 观看
              </span>
              {detailRoom.video_url && (
                <span style={{ color: '#717785', fontSize: 12 }}>
                  视频: {detailRoom.video_url.slice(0, 50)}...
                </span>
              )}
            </div>
            <Tabs
              activeKey={detailTab}
              onChange={(key) => setDetailTab(key as 'messages' | 'viewers')}
              items={[
                {
                  key: 'messages',
                  label: (
                    <span>
                      <MessageOutlined /> 聊天记录 ({messages.length})
                    </span>
                  ),
                },
                {
                  key: 'viewers',
                  label: (
                    <span>
                      <UserOutlined /> 观众列表 ({viewers.length})
                    </span>
                  ),
                },
              ]}
            />
            {detailTab === 'messages' && (
              <Table
                rowKey="id"
                size="small"
                dataSource={messages}
                pagination={{ pageSize: 10 }}
                columns={[
                  { title: '观众', dataIndex: 'viewer_nickname', width: 100 },
                  { title: '消息内容', dataIndex: 'content', ellipsis: true },
                  {
                    title: '时间',
                    dataIndex: 'created_at',
                    width: 140,
                    render: (t: string) => t?.slice(5, 16),
                  },
                ]}
              />
            )}
            {detailTab === 'viewers' && (
              <Table
                rowKey="id"
                size="small"
                dataSource={viewers}
                pagination={{ pageSize: 10 }}
                columns={[
                  { title: '昵称', dataIndex: 'nickname', width: 120 },
                  { title: 'OpenID', dataIndex: 'openid', ellipsis: true },
                  {
                    title: '进入时间',
                    dataIndex: 'enter_at',
                    width: 140,
                    render: (t: string) => t?.slice(5, 16),
                  },
                  {
                    title: '离开时间',
                    dataIndex: 'leave_at',
                    width: 140,
                    render: (t: string) => t ? t.slice(5, 16) : '-',
                  },
                ]}
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
