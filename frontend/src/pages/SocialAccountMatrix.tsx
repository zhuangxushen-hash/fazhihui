import { useState, useEffect, useMemo } from 'react'
import {
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  message,
  InputNumber,
  Tooltip,
  Tabs,
  Card,
  Statistic,
  Row,
  Col,
  Calendar,
  DatePicker,
  List,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  GroupOutlined,
  CloseCircleOutlined,
  ScheduleOutlined,
  ShareAltOutlined,
} from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import {
  SocialAccount,
  SocialPost,
  SocialAccountPayload,
  SocialPostPayload,
  SocialMultiPostPayload,
  SocialPlatform,
  SocialAuthStatus,
  SocialPostStatus,
  getSocialAccounts,
  createSocialAccount,
  updateSocialAccount,
  deleteSocialAccount,
  getSocialAccountGroups,
  createSocialAccountGroup,
  authorizeSocialAccount,
  revokeSocialAccount,
  getSocialOverview,
  getSocialStatsByPlatform,
  getSocialStatsByGroup,
  getSocialPosts,
  createSocialPost,
  createSocialMultiPost,
  updateSocialPost,
  deleteSocialPost,
  publishSocialPost,
  cancelSocialPostSchedule,
  getSocialPostStatsByStatus,
  getSocialPostStatsByPlatform,
  getSocialPostDailyTrend,
} from '../api/socialAccount'
import { formatDateTime } from '../utils/format'

// 平台选项
const platformOptions: { value: SocialPlatform; label: string; color: string }[] = [
  { value: 'douyin', label: '抖音', color: '#000000' },
  { value: 'kuaishou', label: '快手', color: '#ff4906' },
  { value: 'wechat_video', label: '视频号', color: '#07c160' },
  { value: 'wechat_official', label: '公众号', color: '#07c160' },
]

const platformMap: Record<string, { label: string; color: string }> = {
  douyin: { label: '抖音', color: '#000000' },
  kuaishou: { label: '快手', color: '#ff4906' },
  wechat_video: { label: '视频号', color: '#07c160' },
  wechat_official: { label: '公众号', color: '#07c160' },
}

const authStatusOptions: { value: SocialAuthStatus; label: string; color: string }[] = [
  { value: 'authorized', label: '已授权', color: '#34c759' },
  { value: 'unauthorized', label: '未授权', color: '#ff9500' },
  { value: 'expired', label: '已过期', color: '#ff3b30' },
]

const authStatusMap: Record<string, { label: string; color: string }> = {
  authorized: { label: '已授权', color: '#34c759' },
  unauthorized: { label: '未授权', color: '#ff9500' },
  expired: { label: '已过期', color: '#ff3b30' },
}

const postStatusOptions: { value: SocialPostStatus; label: string; color: string }[] = [
  { value: 'draft', label: '草稿', color: '#86868b' },
  { value: 'scheduled', label: '已排期', color: '#0071e3' },
  { value: 'published', label: '已发布', color: '#34c759' },
  { value: 'failed', label: '失败', color: '#ff3b30' },
]

const postStatusMap: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: '#86868b' },
  scheduled: { label: '已排期', color: '#0071e3' },
  published: { label: '已发布', color: '#34c759' },
  failed: { label: '失败', color: '#ff3b30' },
}

// 主组件
export default function SocialAccountMatrix() {
  const [activeTab, setActiveTab] = useState('accounts')

  return (
    <div className="fade-in">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1d1d1f', margin: 0 }}>
            公域账号矩阵
          </h2>
          <p style={{ fontSize: 14, color: '#86868b', marginTop: 4 }}>
            管理抖音、快手、视频号、公众号等公域账号、内容排期与数据统计
          </p>
        </div>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{ marginBottom: 16 }}
        items={[
          { key: 'accounts', label: '账号管理' },
          { key: 'posts', label: '内容排期' },
          { key: 'stats', label: '数据统计' },
        ]}
      />

      {activeTab === 'accounts' && <AccountsTab />}
      {activeTab === 'posts' && <PostsTab />}
      {activeTab === 'stats' && <StatsTab />}
    </div>
  )
}

// ========== Tab1: 账号管理 ==========
function AccountsTab() {
  const [data, setData] = useState<SocialAccount[]>([])
  const [groups, setGroups] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [groupModalVisible, setGroupModalVisible] = useState(false)
  const [authModalVisible, setAuthModalVisible] = useState(false)
  const [editingAccount, setEditingAccount] = useState<SocialAccount | null>(null)
  const [authAccount, setAuthAccount] = useState<SocialAccount | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [form] = Form.useForm()
  const [groupForm] = Form.useForm()
  const [authForm] = Form.useForm()
  const [searchParams, setSearchParams] = useState({
    platform: '' as SocialPlatform | '',
    group_name: '',
    auth_status: '' as SocialAuthStatus | '',
    keyword: '',
  })

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const canEdit = ['super_admin', 'org_admin', 'marketing'].includes(user.role)

  useEffect(() => {
    fetchAccounts()
    fetchGroups()
  }, [])

  const fetchAccounts = async () => {
    setLoading(true)
    try {
      const params: any = { org_id: user.organization_id }
      if (searchParams.platform) params.platform = searchParams.platform
      if (searchParams.group_name) params.group_name = searchParams.group_name
      if (searchParams.auth_status) params.auth_status = searchParams.auth_status
      if (searchParams.keyword) params.keyword = searchParams.keyword
      const res = await getSocialAccounts(params)
      setData(res || [])
    } catch (error) {
      console.error('Fetch social accounts error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchGroups = async () => {
    try {
      const res = await getSocialAccountGroups(user.organization_id)
      setGroups(res || [])
    } catch (error) {
      console.error('Fetch groups error:', error)
    }
  }

  const handleSearch = () => fetchAccounts()

  const handleReset = () => {
    setSearchParams({ platform: '', group_name: '', auth_status: '', keyword: '' })
    setTimeout(fetchAccounts, 0)
  }

  const handleAdd = () => {
    setEditingAccount(null)
    form.resetFields()
    form.setFieldsValue({ platform: 'douyin', followers: 0, likes: 0, consultations: 0 })
    setModalVisible(true)
  }

  const handleEdit = (record: SocialAccount) => {
    setEditingAccount(record)
    form.setFieldsValue({
      platform: record.platform,
      account_name: record.account_name,
      account_id: record.account_id,
      group_name: record.group_name ? [record.group_name] : [],
      followers: Number(record.followers),
      likes: Number(record.likes),
      consultations: Number(record.consultations),
      avatar_url: record.avatar_url,
      bio: record.bio,
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteSocialAccount(id)
      message.success('账号删除成功')
      fetchAccounts()
      fetchGroups()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      let groupName = values.group_name
      if (Array.isArray(groupName)) {
        groupName = groupName[0] || ''
      }
      const payload: SocialAccountPayload = {
        platform: values.platform,
        account_name: values.account_name,
        account_id: values.account_id,
        group_name: groupName,
        followers: Number(values.followers) || 0,
        likes: Number(values.likes) || 0,
        consultations: Number(values.consultations) || 0,
        avatar_url: values.avatar_url,
        bio: values.bio,
      }
      if (editingAccount) {
        await updateSocialAccount(editingAccount.id, payload)
        message.success('账号更新成功')
      } else {
        await createSocialAccount(payload)
        message.success('账号创建成功')
      }
      setModalVisible(false)
      fetchAccounts()
      fetchGroups()
    } catch (error: any) {
      message.error(editingAccount ? '更新失败' : '创建失败')
    }
  }

  const handleCreateGroup = async (values: any) => {
    try {
      if (!selectedRowKeys.length) {
        message.warning('请先选择要加入分组的账号')
        return
      }
      await createSocialAccountGroup({
        group_name: values.group_name,
        account_ids: selectedRowKeys,
        org_id: user.organization_id,
      })
      message.success('分组创建成功')
      setGroupModalVisible(false)
      groupForm.resetFields()
      setSelectedRowKeys([])
      fetchAccounts()
      fetchGroups()
    } catch (error) {
      message.error('分组创建失败')
    }
  }

  const handleAuthorize = (record: SocialAccount) => {
    setAuthAccount(record)
    authForm.resetFields()
    authForm.setFieldsValue({ auth_token: record.auth_token || '' })
    setAuthModalVisible(true)
  }

  const handleRevoke = async (id: string) => {
    try {
      await revokeSocialAccount(id)
      message.success('已取消授权')
      fetchAccounts()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleAuthSubmit = async (values: any) => {
    try {
      if (!authAccount) return
      await authorizeSocialAccount(authAccount.id, values.auth_token)
      message.success('授权成功')
      setAuthModalVisible(false)
      fetchAccounts()
    } catch (error) {
      message.error('授权失败')
    }
  }

  const columns = [
    {
      title: '账号名称',
      dataIndex: 'account_name',
      key: 'account_name',
      render: (val: string, record: SocialAccount) => (
        <Space>
          {record.avatar_url ? (
            <img
              src={record.avatar_url}
              alt=""
              style={{ width: 28, height: 28, borderRadius: 14 }}
            />
          ) : null}
          <span style={{ fontWeight: 600, color: '#1d1d1f' }}>{val}</span>
        </Space>
      ),
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      width: 100,
      render: (val: string) => {
        const p = platformMap[val] || { label: val, color: '#86868b' }
        return (
          <Tag
            style={{
              background: `${p.color}10`,
              color: p.color,
              borderRadius: 12,
              padding: '2px 10px',
              fontSize: 11,
              fontWeight: 500,
              border: 'none',
            }}
          >
            {p.label}
          </Tag>
        )
      },
    },
    {
      title: '账号ID',
      dataIndex: 'account_id',
      key: 'account_id',
      width: 160,
      render: (val: string) => (
        <span style={{ color: '#86868b', fontFamily: 'monospace' }}>{val}</span>
      ),
    },
    {
      title: '分组',
      dataIndex: 'group_name',
      key: 'group_name',
      width: 120,
      render: (val: string) =>
        val ? (
          <Tag style={{ background: '#f5f5f7', color: '#6e6e73', borderRadius: 10, border: 'none' }}>
            {val}
          </Tag>
        ) : (
          <span style={{ color: '#c7c7cc' }}>未分组</span>
        ),
    },
    {
      title: '粉丝',
      dataIndex: 'followers',
      key: 'followers',
      width: 110,
      render: (val: number) => (
        <span style={{ fontWeight: 600, color: '#0071e3' }}>{formatNumber(val)}</span>
      ),
    },
    {
      title: '点赞',
      dataIndex: 'likes',
      key: 'likes',
      width: 100,
      render: (val: number) => <span style={{ color: '#1d1d1f' }}>{formatNumber(val)}</span>,
    },
    {
      title: '咨询',
      dataIndex: 'consultations',
      key: 'consultations',
      width: 100,
      render: (val: number) => <span style={{ color: '#34c759' }}>{formatNumber(val)}</span>,
    },
    {
      title: '授权状态',
      dataIndex: 'auth_status',
      key: 'auth_status',
      width: 110,
      render: (val: string) => {
        const s = authStatusMap[val] || { label: val, color: '#86868b' }
        return (
          <Tag
            style={{
              background: `${s.color}10`,
              color: s.color,
              borderRadius: 12,
              padding: '2px 10px',
              fontSize: 11,
              fontWeight: 500,
              border: 'none',
            }}
          >
            {s.label}
          </Tag>
        )
      },
    },
    {
      title: '授权时间',
      dataIndex: 'authorized_at',
      key: 'authorized_at',
      width: 160,
      render: (val: string) => (
        <span style={{ color: '#86868b', fontSize: 13 }}>{val ? formatDateTime(val) : '-'}</span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: SocialAccount) => (
        <Space>
          {canEdit && (
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              style={{ borderRadius: 8 }}
            >
              编辑
            </Button>
          )}
          {canEdit && (
            <Button
              size="small"
              onClick={() => handleAuthorize(record)}
              style={{ borderRadius: 8 }}
            >
              授权
            </Button>
          )}
          {canEdit && record.auth_status === 'authorized' && (
            <Tooltip title="取消授权">
              <Button
                size="small"
                icon={<CloseCircleOutlined />}
                onClick={() => handleRevoke(record.id)}
                style={{ borderRadius: 8 }}
              />
            </Tooltip>
          )}
          {canEdit && (
            <Tooltip title="删除">
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record.id)}
                style={{ borderRadius: 8 }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ]

  return (
    <>
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
        }}
      >
        <Space wrap>
          <Input
            placeholder="账号名称搜索"
            prefix={<SearchOutlined style={{ color: '#86868b' }} />}
            style={{ width: 200, borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }}
            value={searchParams.keyword}
            onChange={(e) => setSearchParams({ ...searchParams, keyword: e.target.value })}
          />
          <Select
            placeholder="平台筛选"
            style={{ width: 140, borderRadius: 10 }}
            allowClear
            value={searchParams.platform || undefined}
            onChange={(value) =>
              setSearchParams({ ...searchParams, platform: (value || '') as SocialPlatform | '' })
            }
            options={platformOptions.map((o) => ({ value: o.value, label: o.label }))}
          />
          <Select
            placeholder="分组筛选"
            style={{ width: 160, borderRadius: 10 }}
            allowClear
            value={searchParams.group_name || undefined}
            onChange={(value) => setSearchParams({ ...searchParams, group_name: value || '' })}
            options={groups.map((g) => ({ value: g, label: g }))}
          />
          <Select
            placeholder="授权状态"
            style={{ width: 140, borderRadius: 10 }}
            allowClear
            value={searchParams.auth_status || undefined}
            onChange={(value) =>
              setSearchParams({
                ...searchParams,
                auth_status: (value || '') as SocialAuthStatus | '',
              })
            }
            options={authStatusOptions.map((o) => ({ value: o.value, label: o.label }))}
          />
          <Button
            onClick={handleSearch}
            style={{
              borderRadius: 10,
              padding: '8px 20px',
              background: '#0071e3',
              border: 'none',
              color: '#fff',
            }}
          >
            搜索
          </Button>
          <Button
            onClick={handleReset}
            style={{ borderRadius: 10, padding: '8px 20px', border: '1px solid rgba(0, 0, 0, 0.08)' }}
          >
            重置
          </Button>
          {canEdit && (
            <>
              <Button
                onClick={() => {
                  if (!selectedRowKeys.length) {
                    message.warning('请先选择要加入分组的账号')
                    return
                  }
                  groupForm.resetFields()
                  setGroupModalVisible(true)
                }}
                icon={<GroupOutlined />}
                style={{
                  borderRadius: 10,
                  padding: '8px 20px',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                }}
              >
                创建分组
              </Button>
              <Button
                onClick={handleAdd}
                style={{
                  borderRadius: 10,
                  padding: '8px 20px',
                  background: '#0071e3',
                  border: 'none',
                  color: '#fff',
                  boxShadow: '0 2px 8px rgba(0, 113, 227, 0.25)',
                }}
                icon={<PlusOutlined />}
              >
                添加账号
              </Button>
            </>
          )}
        </Space>
      </div>

      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
        }}
      >
        <Table
          dataSource={data}
          columns={columns}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys as string[]),
          }}
          style={{ padding: 20 }}
        />
      </div>

      {/* 新增/编辑账号弹窗 */}
      <Modal
        title={editingAccount ? '编辑公域账号' : '添加公域账号'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={640}
        style={{ borderRadius: 20 }}
      >
        <div style={{ padding: '8px 0' }}>
          <Form onFinish={handleSubmit} layout="vertical" form={form}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Form.Item name="platform" label="平台" rules={[{ required: true }]}>
                <Select
                  style={{ borderRadius: 10 }}
                  options={platformOptions.map((o) => ({ value: o.value, label: o.label }))}
                />
              </Form.Item>
              <Form.Item name="account_name" label="账号名称" rules={[{ required: true }]}>
                <Input
                  placeholder="账号昵称"
                  style={{ borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }}
                />
              </Form.Item>
            </div>
            <Form.Item name="account_id" label="平台账号ID" rules={[{ required: true }]}>
              <Input
                placeholder="UID/OpenID 等唯一标识"
                style={{ borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }}
              />
            </Form.Item>
            <Form.Item name="group_name" label="所属分组">
              <Select
                style={{ borderRadius: 10 }}
                allowClear
                placeholder="选择或输入新分组"
                mode="tags"
                maxCount={1}
                options={groups.map((g) => ({ value: g, label: g }))}
              />
            </Form.Item>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <Form.Item name="followers" label="粉丝数">
                <InputNumber
                  style={{ width: '100%', borderRadius: 10 }}
                  min={0}
                  step={100}
                />
              </Form.Item>
              <Form.Item name="likes" label="点赞数">
                <InputNumber
                  style={{ width: '100%', borderRadius: 10 }}
                  min={0}
                  step={100}
                />
              </Form.Item>
              <Form.Item name="consultations" label="咨询数">
                <InputNumber
                  style={{ width: '100%', borderRadius: 10 }}
                  min={0}
                  step={10}
                />
              </Form.Item>
            </div>
            <Form.Item name="avatar_url" label="账号头像URL">
              <Input
                placeholder="请输入头像链接，以 https:// 开头"
                style={{ borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }}
              />
            </Form.Item>
            <Form.Item name="bio" label="账号简介">
              <Input.TextArea
                placeholder="账号简介"
                rows={2}
                style={{ borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }}
              />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                style={{
                  borderRadius: 10,
                  padding: '10px 32px',
                  background: '#0071e3',
                  border: 'none',
                  color: '#fff',
                }}
              >
                {editingAccount ? '保存修改' : '创建账号'}
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Modal>

      {/* 创建分组弹窗 */}
      <Modal
        title="创建分组"
        open={groupModalVisible}
        onCancel={() => setGroupModalVisible(false)}
        footer={null}
        width={480}
        style={{ borderRadius: 20 }}
      >
        <div style={{ padding: '8px 0' }}>
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              background: '#f5f5f7',
              borderRadius: 10,
              fontSize: 13,
              color: '#6e6e73',
            }}
          >
            已选择 {selectedRowKeys.length} 个账号
          </div>
          <Form onFinish={handleCreateGroup} layout="vertical" form={groupForm}>
            <Form.Item
              name="group_name"
              label="分组名称"
              rules={[{ required: true, message: '请输入分组名称' }]}
            >
              <Input
                placeholder="请输入分组名称"
                style={{ borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }}
              />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                style={{
                  borderRadius: 10,
                  padding: '10px 32px',
                  background: '#0071e3',
                  border: 'none',
                  color: '#fff',
                }}
              >
                创建分组
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Modal>

      {/* 授权弹窗 */}
      <Modal
        title="授权账号"
        open={authModalVisible}
        onCancel={() => setAuthModalVisible(false)}
        footer={null}
        width={520}
        style={{ borderRadius: 20 }}
      >
        <div style={{ padding: '8px 0' }}>
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              background: '#f5f5f7',
              borderRadius: 10,
              fontSize: 13,
              color: '#6e6e73',
            }}
          >
            正在为账号「{authAccount?.account_name}」设置授权令牌
          </div>
          <Form onFinish={handleAuthSubmit} layout="vertical" form={authForm}>
            <Form.Item
              name="auth_token"
              label="授权令牌"
              rules={[{ required: true, message: '请输入授权令牌' }]}
            >
              <Input.TextArea
                placeholder="OAuth 授权令牌"
                rows={4}
                style={{ borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }}
              />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  style={{
                    borderRadius: 10,
                    padding: '10px 32px',
                    background: '#0071e3',
                    border: 'none',
                    color: '#fff',
                  }}
                >
                  确认授权
                </Button>
                {authAccount && authAccount.auth_status !== 'unauthorized' && (
                  <Button
                    danger
                    onClick={() => {
                      handleRevoke(authAccount.id)
                      setAuthModalVisible(false)
                    }}
                    style={{ borderRadius: 10, padding: '10px 24px' }}
                  >
                    取消授权
                  </Button>
                )}
              </Space>
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </>
  )
}

// ========== Tab2: 内容排期 ==========
function PostsTab() {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [multiModalVisible, setMultiModalVisible] = useState(false)
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null)
  const [form] = Form.useForm()
  const [multiForm] = Form.useForm()
  const [filterStatus, setFilterStatus] = useState<SocialPostStatus | ''>('')
  const [filterAccountId, setFilterAccountId] = useState<string>('')

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const canEdit = ['super_admin', 'org_admin', 'marketing'].includes(user.role)

  useEffect(() => {
    fetchPosts()
    fetchAccounts()
  }, [filterStatus, filterAccountId])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const params: any = { org_id: user.organization_id }
      if (filterStatus) params.status = filterStatus
      if (filterAccountId) params.account_id = filterAccountId
      const res = await getSocialPosts(params)
      setPosts(res || [])
    } catch (error) {
      console.error('Fetch posts error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAccounts = async () => {
    try {
      const res = await getSocialAccounts({ org_id: user.organization_id })
      setAccounts(res || [])
    } catch (error) {
      console.error('Fetch accounts error:', error)
    }
  }

  // 按日期分组的排期日历数据
  const postsByDate = useMemo(() => {
    const map: Record<string, SocialPost[]> = {}
    posts.forEach((p) => {
      if (p.scheduled_time) {
        const d = dayjs(p.scheduled_time).format('YYYY-MM-DD')
        if (!map[d]) map[d] = []
        map[d].push(p)
      }
    })
    return map
  }, [posts])

  const handleAdd = () => {
    setEditingPost(null)
    form.resetFields()
    form.setFieldsValue({ content: '', hashtags: '' })
    setModalVisible(true)
  }

  const handleMultiAdd = () => {
    multiForm.resetFields()
    multiForm.setFieldsValue({ content: '', hashtags: '' })
    setMultiModalVisible(true)
  }

  const handleEdit = (record: SocialPost) => {
    setEditingPost(record)
    let mediaFiles: string[] = []
    try {
      mediaFiles = record.media_files ? JSON.parse(record.media_files) : []
    } catch {
      mediaFiles = []
    }
    form.setFieldsValue({
      account_id: record.account_id,
      title: record.title,
      content: record.content,
      media_files: mediaFiles,
      hashtags: record.hashtags,
      scheduled_time: record.scheduled_time ? dayjs(record.scheduled_time) : null,
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteSocialPost(id)
      message.success('已删除')
      fetchPosts()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      const payload: SocialPostPayload = {
        account_id: values.account_id,
        title: values.title,
        content: values.content,
        media_files: values.media_files,
        hashtags: values.hashtags,
        scheduled_time: values.scheduled_time
          ? dayjs(values.scheduled_time).toISOString()
          : undefined,
      }
      if (editingPost) {
        await updateSocialPost(editingPost.id, payload)
        message.success('内容更新成功')
      } else {
        await createSocialPost(payload)
        message.success('内容创建成功')
      }
      setModalVisible(false)
      fetchPosts()
    } catch (error: any) {
      message.error(editingPost ? '更新失败' : '创建失败')
    }
  }

  const handleMultiSubmit = async (values: any) => {
    try {
      const payload: SocialMultiPostPayload = {
        account_ids: values.account_ids,
        title: values.title,
        content: values.content,
        media_files: values.media_files,
        hashtags: values.hashtags,
        scheduled_time: values.scheduled_time
          ? dayjs(values.scheduled_time).toISOString()
          : undefined,
      }
      await createSocialMultiPost(payload)
      message.success('多账号同步发布已创建')
      setMultiModalVisible(false)
      fetchPosts()
    } catch (error: any) {
      message.error('同步发布创建失败')
    }
  }

  const handlePublish = async (id: string) => {
    try {
      await publishSocialPost(id)
      message.success('已标记为发布')
      fetchPosts()
    } catch (error: any) {
      message.error(error?.response?.data?.message || '操作失败')
    }
  }

  const handleCancelSchedule = async (id: string) => {
    try {
      await cancelSocialPostSchedule(id)
      message.success('排期已取消')
      fetchPosts()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const getAccountName = (accountId: string) => {
    const acc = accounts.find((a) => a.id === accountId)
    return acc ? acc.account_name : '未知账号'
  }

  const getAccountPlatform = (accountId: string) => {
    const acc = accounts.find((a) => a.id === accountId)
    return acc ? acc.platform : ''
  }

  const columns = [
    {
      title: '标题/内容',
      dataIndex: 'content',
      key: 'content',
      render: (val: string, record: SocialPost) => (
        <div>
          {record.title && (
            <div style={{ fontWeight: 600, color: '#1d1d1f', marginBottom: 4 }}>{record.title}</div>
          )}
          <div
            style={{
              color: '#6e6e73',
              fontSize: 13,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 360,
            }}
          >
            {val}
          </div>
        </div>
      ),
    },
    {
      title: '所属账号',
      dataIndex: 'account_id',
      key: 'account_id',
      width: 160,
      render: (val: string) => {
        const platform = getAccountPlatform(val)
        const p = platformMap[platform] || { label: '', color: '#86868b' }
        return (
          <Space>
            <Tag
              style={{
                background: `${p.color}10`,
                color: p.color,
                borderRadius: 10,
                padding: '2px 8px',
                fontSize: 11,
                border: 'none',
              }}
            >
              {p.label}
            </Tag>
            <span style={{ color: '#1d1d1f', fontSize: 13 }}>{getAccountName(val)}</span>
          </Space>
        )
      },
    },
    {
      title: '排期时间',
      dataIndex: 'scheduled_time',
      key: 'scheduled_time',
      width: 170,
      render: (val: string) =>
        val ? (
          <span style={{ color: '#0071e3', fontSize: 13 }}>{formatDateTime(val)}</span>
        ) : (
          <span style={{ color: '#c7c7cc' }}>未排期</span>
        ),
    },
    {
      title: '发布时间',
      dataIndex: 'published_at',
      key: 'published_at',
      width: 170,
      render: (val: string) =>
        val ? (
          <span style={{ color: '#34c759', fontSize: 13 }}>{formatDateTime(val)}</span>
        ) : (
          <span style={{ color: '#c7c7cc' }}>-</span>
        ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (val: string) => {
        const s = postStatusMap[val] || { label: val, color: '#86868b' }
        return (
          <Tag
            style={{
              background: `${s.color}10`,
              color: s.color,
              borderRadius: 12,
              padding: '2px 10px',
              fontSize: 11,
              fontWeight: 500,
              border: 'none',
            }}
          >
            {s.label}
          </Tag>
        )
      },
    },
    {
      title: '互动',
      key: 'interactions',
      width: 130,
      render: (_: any, record: SocialPost) => (
        <div style={{ fontSize: 12, color: '#86868b' }}>
          <div>赞 {record.likes}</div>
          <div>
            评 {record.comments} / 转 {record.shares}
          </div>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_: any, record: SocialPost) => (
        <Space wrap>
          {canEdit && record.status !== 'published' && (
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              style={{ borderRadius: 8 }}
            >
              编辑
            </Button>
          )}
          {canEdit && record.status !== 'published' && (
            <Button
              size="small"
              type="primary"
              onClick={() => handlePublish(record.id)}
              style={{ borderRadius: 8 }}
            >
              发布
            </Button>
          )}
          {canEdit && record.status === 'scheduled' && (
            <Button size="small" onClick={() => handleCancelSchedule(record.id)} style={{ borderRadius: 8 }}>
              取消排期
            </Button>
          )}
          {canEdit && (
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
              style={{ borderRadius: 8 }}
            />
          )}
        </Space>
      ),
    },
  ]

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Space wrap>
          <Select
            placeholder="状态筛选"
            style={{ width: 140, borderRadius: 10 }}
            allowClear
            value={filterStatus || undefined}
            onChange={(v) => setFilterStatus((v || '') as SocialPostStatus | '')}
            options={postStatusOptions.map((o) => ({ value: o.value, label: o.label }))}
          />
          <Select
            placeholder="账号筛选"
            style={{ width: 200, borderRadius: 10 }}
            allowClear
            value={filterAccountId || undefined}
            onChange={(v) => setFilterAccountId(v || '')}
            options={accounts.map((a) => ({ value: a.id, label: a.account_name }))}
          />
        </Space>
        {canEdit && (
          <Space>
            <Button
              onClick={handleMultiAdd}
              icon={<ShareAltOutlined />}
              style={{
                borderRadius: 10,
                padding: '8px 20px',
                border: '1px solid rgba(0, 0, 0, 0.08)',
              }}
            >
              多账号同步发布
            </Button>
            <Button
              onClick={handleAdd}
              style={{
                borderRadius: 10,
                padding: '8px 20px',
                background: '#0071e3',
                border: 'none',
                color: '#fff',
                boxShadow: '0 2px 8px rgba(0, 113, 227, 0.25)',
              }}
              icon={<PlusOutlined />}
            >
              创建排期
            </Button>
          </Space>
        )}
      </div>

      {/* 发布日历视图 */}
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 12,
            fontSize: 16,
            fontWeight: 600,
            color: '#1d1d1f',
          }}
        >
          <ScheduleOutlined style={{ marginRight: 8, color: '#0071e3' }} />
          排期日历
        </div>
        <Calendar
          fullscreen
          cellRender={(date: Dayjs) => {
            const dateStr = date.format('YYYY-MM-DD')
            const dayPosts = postsByDate[dateStr] || []
            if (dayPosts.length === 0) return null
            return (
              <div style={{ padding: '4px 0' }}>
                {dayPosts.slice(0, 3).map((p) => {
                  const platform = getAccountPlatform(p.account_id)
                  const platInfo = platformMap[platform] || { color: '#86868b' }
                  return (
                    <div
                      key={p.id}
                      style={{
                        fontSize: 11,
                        background: `${platInfo.color}10`,
                        color: platInfo.color,
                        padding: '2px 6px',
                        borderRadius: 4,
                        marginBottom: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {dayjs(p.scheduled_time).format('HH:mm')} {p.title || p.content.slice(0, 10)}
                    </div>
                  )
                })}
                {dayPosts.length > 3 && (
                  <div style={{ fontSize: 11, color: '#86868b' }}>+{dayPosts.length - 3} 条</div>
                )}
              </div>
            )
          }}
        />
      </div>

      {/* 发布记录列表 */}
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
        }}
      >
        <Table
          dataSource={posts}
          columns={columns}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          style={{ padding: 20 }}
        />
      </div>

      {/* 单账号内容弹窗 */}
      <Modal
        title={editingPost ? '编辑内容排期' : '创建内容排期'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={680}
        style={{ borderRadius: 20 }}
      >
        <div style={{ padding: '8px 0' }}>
          <Form onFinish={handleSubmit} layout="vertical" form={form}>
            <Form.Item
              name="account_id"
              label="发布账号"
              rules={[{ required: true, message: '请选择发布账号' }]}
            >
              <Select
                placeholder="选择账号"
                style={{ borderRadius: 10 }}
                options={accounts.map((a) => ({
                  value: a.id,
                  label: `[${platformMap[a.platform]?.label || a.platform}] ${a.account_name}`,
                }))}
              />
            </Form.Item>
            <Form.Item name="title" label="标题（可选）">
              <Input
                placeholder="内容标题"
                style={{ borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }}
              />
            </Form.Item>
            <Form.Item
              name="content"
              label="文案内容"
              rules={[{ required: true, message: '请输入文案内容' }]}
            >
              <Input.TextArea
                placeholder="文案内容"
                rows={5}
                style={{ borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }}
              />
            </Form.Item>
            <Form.Item name="media_files" label="媒体文件URL（每行一个）">
              <Input.TextArea
                placeholder="请输入媒体文件链接，每行一个&#10;例如：https://example.com/image1.jpg"
                rows={3}
                style={{ borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }}
              />
            </Form.Item>
            <Form.Item name="hashtags" label="话题标签">
              <Input
                placeholder="#法律咨询 #婚姻法"
                style={{ borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }}
              />
            </Form.Item>
            <Form.Item name="scheduled_time" label="排期时间">
              <DatePicker
                showTime
                style={{ width: '100%', borderRadius: 10 }}
                placeholder="选择排期时间"
              />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                style={{
                  borderRadius: 10,
                  padding: '10px 32px',
                  background: '#0071e3',
                  border: 'none',
                  color: '#fff',
                }}
              >
                {editingPost ? '保存修改' : '创建排期'}
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Modal>

      {/* 多账号同步发布弹窗 */}
      <Modal
        title="多账号同步发布"
        open={multiModalVisible}
        onCancel={() => setMultiModalVisible(false)}
        footer={null}
        width={680}
        style={{ borderRadius: 20 }}
      >
        <div style={{ padding: '8px 0' }}>
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              background: '#f5f5f7',
              borderRadius: 10,
              fontSize: 13,
              color: '#6e6e73',
            }}
          >
            将同一份内容同步发布到多个账号，便于矩阵化运营
          </div>
          <Form onFinish={handleMultiSubmit} layout="vertical" form={multiForm}>
            <Form.Item
              name="account_ids"
              label="选择账号（可多选）"
              rules={[{ required: true, message: '请选择至少一个账号' }]}
            >
              <Select
                mode="multiple"
                placeholder="选择多个账号"
                style={{ borderRadius: 10 }}
                options={accounts.map((a) => ({
                  value: a.id,
                  label: `[${platformMap[a.platform]?.label || a.platform}] ${a.account_name}`,
                }))}
              />
            </Form.Item>
            <Form.Item name="title" label="标题（可选）">
              <Input
                placeholder="内容标题"
                style={{ borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }}
              />
            </Form.Item>
            <Form.Item
              name="content"
              label="文案内容"
              rules={[{ required: true, message: '请输入文案内容' }]}
            >
              <Input.TextArea
                placeholder="文案内容"
                rows={5}
                style={{ borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }}
              />
            </Form.Item>
            <Form.Item name="hashtags" label="话题标签">
              <Input
                placeholder="#法律咨询 #婚姻法"
                style={{ borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }}
              />
            </Form.Item>
            <Form.Item name="scheduled_time" label="排期时间（可选）">
              <DatePicker
                showTime
                style={{ width: '100%', borderRadius: 10 }}
                placeholder="选择排期时间（留空则保存为草稿）"
              />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                style={{
                  borderRadius: 10,
                  padding: '10px 32px',
                  background: '#0071e3',
                  border: 'none',
                  color: '#fff',
                }}
              >
                创建同步发布
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </>
  )
}

// ========== Tab3: 数据统计 ==========
function StatsTab() {
  const [overview, setOverview] = useState<any>(null)
  const [platformStats, setPlatformStats] = useState<any[]>([])
  const [groupStats, setGroupStats] = useState<any[]>([])
  const [postStatusStats, setPostStatusStats] = useState<any[]>([])
  const [postPlatformStats, setPostPlatformStats] = useState<any[]>([])
  const [dailyTrend, setDailyTrend] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ])

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchAllStats()
  }, [])

  const fetchAllStats = async () => {
    setLoading(true)
    try {
      const orgId = user.organization_id
      const [ov, ps, gs, pss, pps] = await Promise.all([
        getSocialOverview(orgId),
        getSocialStatsByPlatform(orgId),
        getSocialStatsByGroup(orgId),
        getSocialPostStatsByStatus(orgId),
        getSocialPostStatsByPlatform(orgId),
      ])
      setOverview(ov)
      setPlatformStats(ps || [])
      setGroupStats(gs || [])
      setPostStatusStats(pss || [])
      setPostPlatformStats(pps || [])
      if (dateRange[0] && dateRange[1]) {
        const trend = await getSocialPostDailyTrend(
          orgId,
          dateRange[0].format('YYYY-MM-DD'),
          dateRange[1].format('YYYY-MM-DD'),
        )
        setDailyTrend(trend || [])
      }
    } catch (error) {
      console.error('Fetch stats error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTrendQuery = async () => {
    if (!dateRange[0] || !dateRange[1]) {
      message.warning('请选择日期范围')
      return
    }
    try {
      const trend = await getSocialPostDailyTrend(
        user.organization_id,
        dateRange[0].format('YYYY-MM-DD'),
        dateRange[1].format('YYYY-MM-DD'),
      )
      setDailyTrend(trend || [])
    } catch (error) {
      message.error('查询趋势失败')
    }
  }

  // 找出最大值用于柱状图归一
  const maxPlatformFollowers = Math.max(
    ...platformStats.map((p) => Number(p.total_followers) || 0),
    1,
  )

  const maxDailyCount = Math.max(
    ...dailyTrend.map((d) => Number(d.count) || 0),
    1,
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 总览卡片 */}
      <Row gutter={16}>
        <Col span={6}>
          <Card
            style={{
              borderRadius: 16,
              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
              border: 'none',
            }}
          >
            <Statistic
              title={<span style={{ color: '#86868b', fontSize: 13 }}>账号总数</span>}
              value={Number(overview?.account_count || 0)}
              valueStyle={{ color: '#0071e3', fontWeight: 700, fontSize: 28 }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#86868b' }}>
              已授权 {Number(overview?.authorized_count || 0)} 个
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card
            style={{
              borderRadius: 16,
              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
              border: 'none',
            }}
          >
            <Statistic
              title={<span style={{ color: '#86868b', fontSize: 13 }}>总粉丝数</span>}
              value={Number(overview?.total_followers || 0)}
              valueStyle={{ color: '#1d1d1f', fontWeight: 700, fontSize: 28 }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#86868b' }}>全部平台合计</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card
            style={{
              borderRadius: 16,
              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
              border: 'none',
            }}
          >
            <Statistic
              title={<span style={{ color: '#86868b', fontSize: 13 }}>总点赞数</span>}
              value={Number(overview?.total_likes || 0)}
              valueStyle={{ color: '#ff3b30', fontWeight: 700, fontSize: 28 }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#86868b' }}>全部账号合计</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card
            style={{
              borderRadius: 16,
              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
              border: 'none',
            }}
          >
            <Statistic
              title={<span style={{ color: '#86868b', fontSize: 13 }}>总咨询数</span>}
              value={Number(overview?.total_consultations || 0)}
              valueStyle={{ color: '#34c759', fontWeight: 700, fontSize: 28 }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#86868b' }}>引流到所咨询</div>
          </Card>
        </Col>
      </Row>

      {/* 按平台对比 */}
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1d1d1f', marginBottom: 16 }}>
          各平台数据对比
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {platformStats.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#86868b' }}>
              暂无数据
            </div>
          )}
          {platformStats.map((p) => {
            const info = platformMap[p.platform] || { label: p.platform, color: '#86868b' }
            const followers = Number(p.total_followers) || 0
            const widthPct = (followers / maxPlatformFollowers) * 100
            return (
              <div key={p.platform}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 6,
                  }}
                >
                  <Space>
                    <Tag
                      style={{
                        background: `${info.color}10`,
                        color: info.color,
                        borderRadius: 10,
                        padding: '2px 10px',
                        fontSize: 12,
                        border: 'none',
                        fontWeight: 500,
                      }}
                    >
                      {info.label}
                    </Tag>
                    <span style={{ color: '#6e6e73', fontSize: 13 }}>
                      {p.account_count} 个账号
                    </span>
                  </Space>
                  <span style={{ fontSize: 13, color: '#1d1d1f', fontWeight: 600 }}>
                    粉丝 {formatNumber(followers)} · 点赞 {formatNumber(Number(p.total_likes) || 0)} ·
                    咨询 {formatNumber(Number(p.total_consultations) || 0)}
                  </span>
                </div>
                <div
                  style={{
                    height: 8,
                    background: '#f5f5f7',
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${widthPct}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${info.color}, ${info.color}cc)`,
                      borderRadius: 4,
                      transition: 'width 0.4s',
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Row gutter={16}>
        {/* 按分组统计 */}
        <Col span={12}>
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
              height: '100%',
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1d1d1f', marginBottom: 16 }}>
              分组数据统计
            </h3>
            <Table
              dataSource={groupStats}
              rowKey="group_name"
              size="small"
              pagination={false}
              loading={loading}
              columns={[
                {
                  title: '分组',
                  dataIndex: 'group_name',
                  key: 'group_name',
                  render: (val: string) => (
                    <Tag
                      style={{
                        background: '#f5f5f7',
                        color: '#6e6e73',
                        borderRadius: 10,
                        border: 'none',
                      }}
                    >
                      {val}
                    </Tag>
                  ),
                },
                {
                  title: '账号数',
                  dataIndex: 'account_count',
                  key: 'account_count',
                  width: 80,
                  render: (v: number) => <span style={{ color: '#1d1d1f' }}>{v}</span>,
                },
                {
                  title: '粉丝',
                  dataIndex: 'total_followers',
                  key: 'total_followers',
                  render: (v: number) => (
                    <span style={{ color: '#0071e3' }}>{formatNumber(Number(v))}</span>
                  ),
                },
                {
                  title: '咨询',
                  dataIndex: 'total_consultations',
                  key: 'total_consultations',
                  render: (v: number) => (
                    <span style={{ color: '#34c759' }}>{formatNumber(Number(v))}</span>
                  ),
                },
              ]}
            />
          </div>
        </Col>

        {/* 内容发布状态统计 */}
        <Col span={12}>
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
              height: '100%',
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1d1d1f', marginBottom: 16 }}>
              内容发布状态
            </h3>
            <Row gutter={[16, 16]}>
              {postStatusStats.map((s) => {
                const info = postStatusMap[s.status] || { label: s.status, color: '#86868b' }
                return (
                  <Col span={12} key={s.status}>
                    <div
                      style={{
                        padding: 16,
                        background: `${info.color}08`,
                        borderRadius: 12,
                        border: `1px solid ${info.color}20`,
                      }}
                    >
                      <div style={{ fontSize: 12, color: '#86868b', marginBottom: 4 }}>
                        {info.label}
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: info.color }}>
                        {s.count}
                      </div>
                      <div style={{ fontSize: 11, color: '#86868b', marginTop: 4 }}>
                        赞 {formatNumber(Number(s.total_likes) || 0)} · 评{' '}
                        {formatNumber(Number(s.total_comments) || 0)} · 转{' '}
                        {formatNumber(Number(s.total_shares) || 0)}
                      </div>
                    </div>
                  </Col>
                )
              })}
              {postStatusStats.length === 0 && (
                <Col span={24}>
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#86868b' }}>
                    暂无内容数据
                  </div>
                </Col>
              )}
            </Row>
          </div>
        </Col>
      </Row>

      {/* 按平台统计发布数据 */}
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1d1d1f', marginBottom: 16 }}>
          各平台内容发布统计
        </h3>
        <Table
          dataSource={postPlatformStats}
          rowKey="platform"
          size="small"
          pagination={false}
          loading={loading}
          columns={[
            {
              title: '平台',
              dataIndex: 'platform',
              key: 'platform',
              render: (val: string) => {
                const info = platformMap[val] || { label: val, color: '#86868b' }
                return (
                  <Tag
                    style={{
                      background: `${info.color}10`,
                      color: info.color,
                      borderRadius: 10,
                      padding: '2px 10px',
                      border: 'none',
                    }}
                  >
                    {info.label}
                  </Tag>
                )
              },
            },
            {
              title: '总内容',
              dataIndex: 'post_count',
              key: 'post_count',
              render: (v: number) => <span>{Number(v) || 0}</span>,
            },
            {
              title: '已发布',
              dataIndex: 'published_count',
              key: 'published_count',
              render: (v: number) => (
                <span style={{ color: '#34c759' }}>{Number(v) || 0}</span>
              ),
            },
            {
              title: '已排期',
              dataIndex: 'scheduled_count',
              key: 'scheduled_count',
              render: (v: number) => (
                <span style={{ color: '#0071e3' }}>{Number(v) || 0}</span>
              ),
            },
            {
              title: '失败',
              dataIndex: 'failed_count',
              key: 'failed_count',
              render: (v: number) => (
                <span style={{ color: '#ff3b30' }}>{Number(v) || 0}</span>
              ),
            },
            {
              title: '互动总数',
              key: 'interactions',
              render: (_: any, r: any) => (
                <span style={{ fontSize: 12, color: '#6e6e73' }}>
                  赞 {formatNumber(Number(r.total_likes) || 0)} · 评{' '}
                  {formatNumber(Number(r.total_comments) || 0)} · 转{' '}
                  {formatNumber(Number(r.total_shares) || 0)}
                </span>
              ),
            },
          ]}
        />
      </div>

      {/* 时间趋势 */}
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1d1d1f', margin: 0 }}>
            每日发布趋势
          </h3>
          <Space>
            <DatePicker.RangePicker
              value={dateRange}
              onChange={(vals) => setDateRange(vals as [Dayjs | null, Dayjs | null])}
              style={{ borderRadius: 10 }}
            />
            <Button
              onClick={handleTrendQuery}
              style={{
                borderRadius: 10,
                background: '#0071e3',
                border: 'none',
                color: '#fff',
              }}
            >
              查询
            </Button>
          </Space>
        </div>
        {dailyTrend.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#86868b' }}>
            暂无发布数据
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 200, padding: '8px 0' }}>
            {dailyTrend.map((d) => {
              const height = (Number(d.count) / maxDailyCount) * 160
              return (
                <Tooltip
                  key={d.date}
                  title={`${d.date}：${d.count} 篇 · 赞 ${d.likes} · 评 ${d.comments} · 转 ${d.shares}`}
                >
                  <div
                    style={{
                      flex: 1,
                      minWidth: 8,
                      height: Math.max(height, 2),
                      background: 'linear-gradient(180deg, #0071e3, #00a8ff)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s',
                    }}
                  />
                </Tooltip>
              )
            })}
          </div>
        )}
        {dailyTrend.length > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 8,
              fontSize: 11,
              color: '#86868b',
            }}
          >
            <span>{dailyTrend[0]?.date}</span>
            <span>{dailyTrend[dailyTrend.length - 1]?.date}</span>
          </div>
        )}
      </div>

      {/* 每日趋势数据列表 */}
      {dailyTrend.length > 0 && (
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            padding: 24,
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1d1d1f', marginBottom: 16 }}>
            趋势明细
          </h3>
          <List
            size="small"
            dataSource={dailyTrend.slice().reverse()}
            renderItem={(item) => (
              <List.Item>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <span style={{ color: '#1d1d1f', fontWeight: 500 }}>{item.date}</span>
                  <Space size="middle">
                    <span style={{ color: '#0071e3' }}>发布 {item.count}</span>
                    <span style={{ color: '#ff3b30' }}>赞 {formatNumber(Number(item.likes) || 0)}</span>
                    <span style={{ color: '#86868b' }}>评 {formatNumber(Number(item.comments) || 0)}</span>
                    <span style={{ color: '#34c759' }}>转 {formatNumber(Number(item.shares) || 0)}</span>
                  </Space>
                </Space>
              </List.Item>
            )}
          />
        </div>
      )}
    </div>
  )
}

// 格式化数字展示（万、亿）
function formatNumber(num: number): string {
  if (num === null || num === undefined) return '0'
  const n = Number(num) || 0
  if (n >= 100000000) return (n / 100000000).toFixed(2) + '亿'
  if (n >= 10000) return (n / 10000).toFixed(2) + '万'
  return n.toString()
}
