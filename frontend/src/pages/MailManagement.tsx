import { useState, useEffect, useCallback } from 'react'
import {
  Card,
  Button,
  Modal,
  Input,
  Select,
  Tabs,
  Table,
  Space,
  message,
  Popconfirm,
  Tag,
  Form,
  Tooltip,
} from 'antd'
import {
  StarOutlined,
  StarFilled,
  PlusOutlined,
  DeleteOutlined,
  MailOutlined,
  ReadOutlined,
} from '@ant-design/icons'
import {
  getInbox,
  getSent,
  getDrafts,
  getTrash,
  sendMail,
  saveDraft,
  markAsRead,
  toggleStar,
  moveToTrash,
  removeMail,
} from '../api/mail'
import { formatDateTime } from '../utils/format'
import axios from '../api/axios'
import { theme } from '../constants/theme'

const { TextArea } = Input

export default function MailManagement() {
  const [activeTab, setActiveTab] = useState('inbox')
  const [mailList, setMailList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [writeModalOpen, setWriteModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [currentMail, setCurrentMail] = useState<any>(null)
  const [userList, setUserList] = useState<any[]>([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [filterUnread, setFilterUnread] = useState(false)
  const [filterStarred, setFilterStarred] = useState(false)
  const [form] = Form.useForm()

  // 加载用户列表（用于收件人选择）
  useEffect(() => {
    axios
      .get('/users')
      .then((res: any) => {
        const data = res?.data || res || []
        const users = Array.isArray(data) ? data : data.data || []
        // 排除自己
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
        setUserList(users.filter((u: any) => u.id !== currentUser.id))
      })
      .catch(() => {})
  }, [])

  // 加载邮件列表
  const loadMails = useCallback(
    async (tab?: string) => {
      const currentTab = tab || activeTab
      setLoading(true)
      try {
        let res: any
        if (currentTab === 'inbox') {
          const params: any = {}
          if (searchKeyword) params.keyword = searchKeyword
          if (filterUnread) params.is_read = false
          if (filterStarred) params.is_starred = true
          res = await getInbox(params)
        } else if (currentTab === 'sent') {
          res = await getSent()
        } else if (currentTab === 'drafts') {
          res = await getDrafts()
        } else if (currentTab === 'trash') {
          res = await getTrash()
        }
        const data = res?.data || res || []
        setMailList(Array.isArray(data) ? data : data.data || [])
      } catch {
        message.error('加载邮件失败')
      } finally {
        setLoading(false)
      }
    },
    [activeTab, searchKeyword, filterUnread, filterStarred],
  )

  useEffect(() => {
    loadMails()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Tab切换
  const handleTabChange = (key: string) => {
    setActiveTab(key)
    setSearchKeyword('')
    setFilterUnread(false)
    setFilterStarred(false)
    loadMails(key)
  }

  // 查看邮件详情
  const handleViewMail = async (mail: any) => {
    setCurrentMail(mail)
    setDetailModalOpen(true)
    // 收件箱的邮件自动标记已读
    if (activeTab === 'inbox' && !mail.is_read) {
      try {
        await markAsRead(mail.id)
        loadMails()
      } catch {
        // 标记已读失败不阻塞查看
      }
    }
  }

  // 星标切换
  const handleToggleStar = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await toggleStar(id)
      loadMails()
    } catch {
      message.error('操作失败')
    }
  }

  // 移到已删除
  const handleMoveToTrash = async (id: string) => {
    try {
      await moveToTrash(id)
      message.success('已移到已删除')
      loadMails()
    } catch {
      message.error('操作失败')
    }
  }

  // 彻底删除
  const handleRemove = async (id: string) => {
    try {
      await removeMail(id)
      message.success('已彻底删除')
      loadMails()
    } catch {
      message.error('删除失败')
    }
  }

  // 发送邮件
  const handleSend = async () => {
    try {
      const values = await form.validateFields()
      await sendMail({
        recipient_ids: values.recipient_ids,
        cc_ids: values.cc_ids,
        subject: values.subject,
        content: values.content,
      })
      message.success('邮件发送成功')
      setWriteModalOpen(false)
      form.resetFields()
      loadMails()
    } catch {
      message.error('发送失败')
    }
  }

  // 保存草稿
  const handleSaveDraft = async () => {
    try {
      const values = await form.validateFields()
      await saveDraft({
        recipient_ids: values.recipient_ids || [],
        subject: values.subject || '',
        content: values.content || '',
      })
      message.success('草稿已保存')
      setWriteModalOpen(false)
      form.resetFields()
      loadMails()
    } catch {
      message.error('保存草稿失败')
    }
  }

  // 表格列定义
  const columns = [
    {
      title: '星标',
      dataIndex: 'is_starred',
      key: 'is_starred',
      width: 60,
      render: (val: boolean, record: any) => (
        <Tooltip title={val ? '取消星标' : '添加星标'}>
          <Button
            type="text"
            size="small"
            icon={val ? <StarFilled style={{ color: theme.brandGold }} /> : <StarOutlined />}
            onClick={e => handleToggleStar(record.id, e)}
          />
        </Tooltip>
      ),
    },
    {
      title: '主题',
      dataIndex: 'subject',
      key: 'subject',
      ellipsis: true,
      render: (val: string, record: any) => (
        <a onClick={() => handleViewMail(record)} style={{ fontWeight: record.is_read ? 400 : 600 }}>
          {val || '(无主题)'}
        </a>
      ),
    },
    {
      title: activeTab === 'sent' ? '收件人' : '发件人',
      key: 'party',
      width: 140,
      render: (_: any, record: any) => {
        if (activeTab === 'sent' || activeTab === 'drafts') {
          // 显示收件人
          let recipientNames = '未知'
          try {
            const ids = JSON.parse(record.recipient_ids || '[]')
            recipientNames = ids.map((id: string) => {
              const u = userList.find(user => user.id === id)
              return u?.real_name || id.slice(0, 8)
            }).join(', ')
          } catch {
            // ignore
          }
          return recipientNames
        }
        // inbox/trash 显示发件人
        const sender = userList.find(u => u.id === record.sender_id)
        return sender?.real_name || record.sender_id?.slice(0, 8) || '未知'
      },
    },
    {
      title: '时间',
      dataIndex: 'sent_time',
      key: 'sent_time',
      width: 170,
      render: (val: string, record: any) => formatDateTime(val || record.created_at),
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_: any, record: any) => {
        if (activeTab === 'inbox') {
          return record.is_read ? <Tag className="stitch-tag stitch-tag-info">已读</Tag> : <Tag className="stitch-tag stitch-tag-primary">未读</Tag>
        }
        return '-'
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: any) => (
        <Space>
          {activeTab === 'inbox' && !record.is_read && (
            <Tooltip title="标记已读">
              <Button type="text" size="small" icon={<ReadOutlined />} onClick={() => markAsRead(record.id).then(() => loadMails())} />
            </Tooltip>
          )}
          {activeTab !== 'trash' && (
            <Popconfirm title="确定移到已删除吗？" onConfirm={() => handleMoveToTrash(record.id)}>
              <Button type="text" size="small" icon={<DeleteOutlined />} danger />
            </Popconfirm>
          )}
          {activeTab === 'trash' && (
            <Popconfirm title="确定彻底删除吗？此操作不可恢复" onConfirm={() => handleRemove(record.id)}>
              <Button type="text" size="small" icon={<DeleteOutlined />} danger>
                彻底删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  // Tab项配置
  const tabItems = [
    { key: 'inbox', label: '收件箱' },
    { key: 'sent', label: '已发送' },
    { key: 'drafts', label: '草稿箱' },
    { key: 'trash', label: '已删除' },
  ]

  return (
    <div>
      {/* 顶部操作栏 */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
          style={{ marginBottom: 0 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setWriteModalOpen(true)}>
          写邮件
        </Button>
      </div>

      {/* 收件箱筛选条件 */}
      {activeTab === 'inbox' && (
        <Card className="stitch-filter-bar" style={{ marginBottom: 16, borderRadius: 12 }}>
          <Space>
            <Input.Search
              placeholder="搜索主题或正文"
              allowClear
              style={{ width: 300 }}
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              onSearch={() => loadMails()}
            />
            <Button
              type={filterUnread ? 'primary' : 'default'}
              onClick={() => {
                setFilterUnread(!filterUnread)
                setTimeout(() => loadMails(), 0)
              }}
            >
              仅看未读
            </Button>
            <Button
              type={filterStarred ? 'primary' : 'default'}
              icon={filterStarred ? <StarFilled style={{ color: theme.brandGold }} /> : <StarOutlined />}
              onClick={() => {
                setFilterStarred(!filterStarred)
                setTimeout(() => loadMails(), 0)
              }}
            >
              仅看星标
            </Button>
          </Space>
        </Card>
      )}

      {/* 邮件列表 */}
      <Card className="stitch-table" style={{ borderRadius: 12 }}>
        <Table
          columns={columns}
          dataSource={mailList}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: t => `共 ${t} 条` }}
          scroll={{ x: 800 }}
          onRow={(record: any) => ({
            onClick: () => handleViewMail(record),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      {/* 写邮件弹窗 */}
      <Modal
        title="写邮件"
        open={writeModalOpen}
        onCancel={() => {
          setWriteModalOpen(false)
          form.resetFields()
        }}
        width={700}
        footer={[
          <Button key="draft" onClick={handleSaveDraft}>
            保存草稿
          </Button>,
          <Button key="cancel" onClick={() => setWriteModalOpen(false)}>
            取消
          </Button>,
          <Button key="send" type="primary" icon={<MailOutlined />} onClick={handleSend}>
            发送
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="recipient_ids" label="收件人" rules={[{ required: true, message: '请选择收件人' }]}>
            <Select
              mode="multiple"
              placeholder="选择收件人"
              options={userList.map((u: any) => ({ label: u.real_name, value: u.id }))}
              optionFilterProp="label"
              showSearch
            />
          </Form.Item>
          <Form.Item name="cc_ids" label="抄送">
            <Select
              mode="multiple"
              placeholder="选择抄送人（可选）"
              options={userList.map((u: any) => ({ label: u.real_name, value: u.id }))}
              optionFilterProp="label"
              showSearch
            />
          </Form.Item>
          <Form.Item name="subject" label="主题" rules={[{ required: true, message: '请输入主题' }]}>
            <Input placeholder="邮件主题" maxLength={255} />
          </Form.Item>
          <Form.Item name="content" label="正文" rules={[{ required: true, message: '请输入正文' }]}>
            <TextArea rows={8} placeholder="邮件正文" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 邮件详情弹窗 */}
      <Modal
        title={currentMail?.subject || '(无主题)'}
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={700}
      >
        {currentMail && (
          <div>
            <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${theme.borderSecondary}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: theme.grayDark }}>发件人:</span>
                <span>{userList.find(u => u.id === currentMail.sender_id)?.real_name || currentMail.sender_id?.slice(0, 8)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: theme.grayDark }}>时间:</span>
                <span>{formatDateTime(currentMail.sent_time || currentMail.created_at)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: theme.grayDark }}>状态:</span>
                <span>
                  {currentMail.is_read ? <Tag className="stitch-tag stitch-tag-info">已读</Tag> : <Tag className="stitch-tag stitch-tag-primary">未读</Tag>}
                  {currentMail.is_starred && <Tag className="stitch-tag stitch-tag-gold">星标</Tag>}
                </span>
              </div>
            </div>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, color: theme.textBase }}>
              {currentMail.content}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
