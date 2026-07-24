import { useState, useEffect } from 'react'
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
  Badge,
  Tabs,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  WarningOutlined,
  ThunderboltOutlined,
  GroupOutlined,
} from '@ant-design/icons'
import {
  AdAccount,
  AdAccountPayload,
  AdAccountStatus,
  AdAccountWarning,
  AdPlatform,
  getAdAccounts,
  createAdAccount,
  updateAdAccount,
  deleteAdAccount,
  getAdAccountGroups,
  createAdAccountGroup,
  getAdAccountWarnings,
  manualCheckAdAccountWarnings,
  markAdAccountWarningResolved,
} from '../api/adAccount'
import { formatDateTime } from '../utils/format'

// 平台选项
const platformOptions: { value: AdPlatform; label: string; color: string }[] = [
  { value: 'douyin', label: '抖音', color: '#000000' },
  { value: 'baidu', label: '百度', color: '#2932e1' },
  { value: 'tencent', label: '腾讯', color: '#00a4ff' },
  { value: 'kuaishou', label: '快手', color: '#ff4906' },
]

const platformMap: Record<string, { label: string; color: string }> = {
  douyin: { label: '抖音', color: '#000000' },
  baidu: { label: '百度', color: '#2932e1' },
  tencent: { label: '腾讯', color: '#00a4ff' },
  kuaishou: { label: '快手', color: '#ff4906' },
}

const statusOptions: { value: AdAccountStatus; label: string; color: string }[] = [
  { value: 'active', label: '正常', color: '#34c759' },
  { value: 'disabled', label: '已禁用', color: '#86868b' },
  { value: 'unauthorized', label: '未授权', color: '#ff9500' },
]

const statusMap: Record<string, { label: string; color: string }> = {
  active: { label: '正常', color: '#34c759' },
  disabled: { label: '已禁用', color: '#86868b' },
  unauthorized: { label: '未授权', color: '#ff9500' },
}

const warningStatusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: '#ff3b30' },
  notified: { label: '已通知', color: '#ff9500' },
  resolved: { label: '已解决', color: '#34c759' },
}

export default function AdAccountManagement() {
  const [activeTab, setActiveTab] = useState('accounts')
  const [data, setData] = useState<AdAccount[]>([])
  const [warnings, setWarnings] = useState<AdAccountWarning[]>([])
  const [groups, setGroups] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [groupModalVisible, setGroupModalVisible] = useState(false)
  const [editingAccount, setEditingAccount] = useState<AdAccount | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [form] = Form.useForm()
  const [groupForm] = Form.useForm()
  const [searchParams, setSearchParams] = useState({
    platform: '' as AdPlatform | '',
    group_name: '',
    status: '' as AdAccountStatus | '',
    keyword: '',
  })

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const canEdit = ['super_admin', 'org_admin', 'marketing'].includes(user.role)

  useEffect(() => {
    if (activeTab === 'accounts') {
      fetchAccounts()
      fetchGroups()
    } else if (activeTab === 'warnings') {
      fetchWarnings()
    }
  }, [activeTab])

  const fetchAccounts = async () => {
    setLoading(true)
    try {
      const params: any = { org_id: user.organization_id }
      if (searchParams.platform) params.platform = searchParams.platform
      if (searchParams.group_name) params.group_name = searchParams.group_name
      if (searchParams.status) params.status = searchParams.status
      if (searchParams.keyword) params.keyword = searchParams.keyword
      const res = await getAdAccounts(params)
      setData(res || [])
    } catch (error) {
      console.error('Fetch ad accounts error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchGroups = async () => {
    try {
      const res = await getAdAccountGroups(user.organization_id)
      setGroups(res || [])
    } catch (error) {
      console.error('Fetch groups error:', error)
    }
  }

  const fetchWarnings = async () => {
    setLoading(true)
    try {
      const res = await getAdAccountWarnings({ org_id: user.organization_id })
      setWarnings(res || [])
    } catch (error) {
      console.error('Fetch warnings error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchAccounts()
  }

  const handleReset = () => {
    setSearchParams({
      platform: '',
      group_name: '',
      status: '',
      keyword: '',
    })
    setTimeout(fetchAccounts, 0)
  }

  const handleAdd = () => {
    setEditingAccount(null)
    form.resetFields()
    form.setFieldsValue({
      platform: 'douyin',
      status: 'active',
      balance: 0,
      threshold: 1000,
    })
    setModalVisible(true)
  }

  const handleEdit = (record: AdAccount) => {
    setEditingAccount(record)
    form.setFieldsValue({
      platform: record.platform,
      account_name: record.account_name,
      account_id: record.account_id,
      group_name: record.group_name ? [record.group_name] : [],
      balance: Number(record.balance),
      threshold: Number(record.threshold),
      status: record.status,
      auth_token: record.auth_token,
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteAdAccount(id)
      message.success('账户删除成功')
      fetchAccounts()
    } catch (error) {
      message.error('删除失败')
      console.error('Delete ad account error:', error)
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      // group_name 在表单中是 tags 模式，可能是数组
      let groupName = values.group_name
      if (Array.isArray(groupName)) {
        groupName = groupName[0] || ''
      }
      const payload: AdAccountPayload = {
        platform: values.platform,
        account_name: values.account_name,
        account_id: values.account_id,
        group_name: groupName,
        balance: Number(values.balance) || 0,
        threshold: Number(values.threshold) || 0,
        status: values.status,
        auth_token: values.auth_token,
      }
      if (editingAccount) {
        await updateAdAccount(editingAccount.id, payload)
        message.success('账户更新成功')
      } else {
        await createAdAccount(payload)
        message.success('账户创建成功')
      }
      setModalVisible(false)
      fetchAccounts()
      fetchGroups()
    } catch (error: any) {
      message.error(editingAccount ? '更新失败' : '创建失败')
      console.error('Submit ad account error:', error)
    }
  }

  const handleCreateGroup = async (values: any) => {
    try {
      if (!selectedRowKeys.length) {
        message.warning('请先选择要加入分组的账户')
        return
      }
      await createAdAccountGroup({
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
      console.error('Create group error:', error)
    }
  }

  const handleManualCheck = async () => {
    try {
      const res = await manualCheckAdAccountWarnings()
      message.success(res || '检查完成')
      fetchWarnings()
    } catch (error) {
      message.error('手动检查失败')
      console.error('Manual check error:', error)
    }
  }

  const handleResolveWarning = async (id: string) => {
    try {
      await markAdAccountWarningResolved(id, '手动标记已解决')
      message.success('预警已标记为已解决')
      fetchWarnings()
    } catch (error) {
      message.error('操作失败')
      console.error('Resolve warning error:', error)
    }
  }

  // 判断是否低于阈值
  const isLowBalance = (account: AdAccount) => {
    const balance = Number(account.balance)
    const threshold = Number(account.threshold)
    return threshold > 0 && balance < threshold
  }

  const columns = [
    {
      title: '账户名称',
      dataIndex: 'account_name',
      key: 'account_name',
      render: (val: string, record: AdAccount) => (
        <Space>
          <span style={{ fontWeight: 600, color: '#1d1d1f' }}>{val}</span>
          {isLowBalance(record) && (
            <Tooltip title={`余额低于阈值 ¥${Number(record.threshold).toFixed(2)}`}>
              <Badge count={<WarningOutlined style={{ color: '#ff3b30', fontSize: 14 }} />} />
            </Tooltip>
          )}
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
      title: '平台账户ID',
      dataIndex: 'account_id',
      key: 'account_id',
      width: 160,
      render: (val: string) => <span style={{ color: '#86868b', fontFamily: 'monospace' }}>{val}</span>,
    },
    {
      title: '分组',
      dataIndex: 'group_name',
      key: 'group_name',
      width: 120,
      render: (val: string) =>
        val ? (
          <Tag style={{ background: '#f5f5f7', color: '#6e6e73', borderRadius: 10, border: 'none' }}>{val}</Tag>
        ) : (
          <span style={{ color: '#c7c7cc' }}>未分组</span>
        ),
    },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
      width: 120,
      render: (val: number | string, record: AdAccount) => {
        const balance = Number(val)
        const low = isLowBalance(record)
        return (
          <span style={{ fontWeight: 600, color: low ? '#ff3b30' : '#0071e3' }}>
            ¥{balance.toFixed(2)}
          </span>
        )
      },
    },
    {
      title: '预警阈值',
      dataIndex: 'threshold',
      key: 'threshold',
      width: 110,
      render: (val: number | string) => (
        <span style={{ color: '#86868b' }}>¥{Number(val).toFixed(2)}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (val: string) => {
        const s = statusMap[val] || { label: val, color: '#86868b' }
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
      width: 140,
      render: (_: any, record: AdAccount) => (
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

  const warningColumns = [
    {
      title: '账户名称',
      dataIndex: 'account_name',
      key: 'account_name',
      render: (val: string) => <span style={{ fontWeight: 600, color: '#1d1d1f' }}>{val}</span>,
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
      title: '当前余额',
      dataIndex: 'balance',
      key: 'balance',
      width: 130,
      render: (val: number | string) => (
        <span style={{ fontWeight: 600, color: '#ff3b30' }}>¥{Number(val).toFixed(2)}</span>
      ),
    },
    {
      title: '阈值',
      dataIndex: 'threshold',
      key: 'threshold',
      width: 110,
      render: (val: number | string) => (
        <span style={{ color: '#86868b' }}>¥{Number(val).toFixed(2)}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (val: string) => {
        const s = warningStatusMap[val] || { label: val, color: '#86868b' }
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
      title: '生成时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (val: string) => (
        <span style={{ color: '#86868b', fontSize: 13 }}>{formatDateTime(val)}</span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: AdAccountWarning) =>
        record.status === 'pending' || record.status === 'notified' ? (
          <Button
            size="small"
            onClick={() => handleResolveWarning(record.id)}
            style={{ borderRadius: 8 }}
          >
            标记已解决
          </Button>
        ) : (
          <span style={{ color: '#c7c7cc' }}>-</span>
        ),
    },
  ]

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1d1d1f', margin: 0 }}>广告账户管理</h2>
          <p style={{ fontSize: 14, color: '#86868b', marginTop: 4 }}>
            统一管理多平台投放账户、分组、余额预警
          </p>
        </div>
        {canEdit && activeTab === 'accounts' && (
          <Space>
            <Button
              onClick={() => {
                if (!selectedRowKeys.length) {
                  message.warning('请先选择要加入分组的账户')
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
              添加账户
            </Button>
          </Space>
        )}
        {canEdit && activeTab === 'warnings' && (
          <Button
            onClick={handleManualCheck}
            icon={<ThunderboltOutlined />}
            style={{
              borderRadius: 10,
              padding: '8px 20px',
              background: '#0071e3',
              border: 'none',
              color: '#fff',
              boxShadow: '0 2px 8px rgba(0, 113, 227, 0.25)',
            }}
          >
            手动检查
          </Button>
        )}
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{ marginBottom: 16 }}
        items={[
          { key: 'accounts', label: '账户列表' },
          { key: 'warnings', label: '余额预警' },
        ]}
      />

      {activeTab === 'accounts' && (
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
                placeholder="账户名称搜索"
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
                  setSearchParams({ ...searchParams, platform: (value || '') as AdPlatform | '' })
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
                placeholder="状态筛选"
                style={{ width: 140, borderRadius: 10 }}
                allowClear
                value={searchParams.status || undefined}
                onChange={(value) =>
                  setSearchParams({ ...searchParams, status: (value || '') as AdAccountStatus | '' })
                }
                options={statusOptions.map((o) => ({ value: o.value, label: o.label }))}
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
        </>
      )}

      {activeTab === 'warnings' && (
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden',
          }}
        >
          <Table
            dataSource={warnings}
            columns={warningColumns}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            style={{ padding: 20 }}
          />
        </div>
      )}

      {/* 新增/编辑账户弹窗 */}
      <Modal
        title={editingAccount ? '编辑广告账户' : '添加广告账户'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={640}
        style={{ borderRadius: 20 }}
      >
        <div style={{ padding: '8px 0' }}>
          <Form onFinish={handleSubmit} layout="vertical" form={form}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Form.Item name="platform" label="投放平台" rules={[{ required: true }]}>
                <Select style={{ borderRadius: 10 }} options={platformOptions.map((o) => ({ value: o.value, label: o.label }))} />
              </Form.Item>
              <Form.Item name="account_name" label="账户名称" rules={[{ required: true }]}>
                <Input placeholder="请输入账户名称" style={{ borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }} />
              </Form.Item>
            </div>
            <Form.Item name="account_id" label="平台账户ID" rules={[{ required: true }]}>
              <Input placeholder="平台返回的唯一账户ID" style={{ borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }} />
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Form.Item name="balance" label="账户余额（元）">
                <InputNumber
                  style={{ width: '100%', borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }}
                  min={0}
                  step={100}
                  prefix="¥"
                />
              </Form.Item>
              <Form.Item name="threshold" label="余额预警阈值（元）">
                <InputNumber
                  style={{ width: '100%', borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }}
                  min={0}
                  step={100}
                  prefix="¥"
                />
              </Form.Item>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Form.Item name="status" label="账户状态">
                <Select
                  style={{ borderRadius: 10 }}
                  options={statusOptions.map((o) => ({ value: o.value, label: o.label }))}
                />
              </Form.Item>
              <Form.Item name="auth_token" label="授权令牌">
                <Input.Password
                  placeholder="OAuth 授权令牌（可选）"
                  style={{ borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }}
                />
              </Form.Item>
            </div>
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
                {editingAccount ? '保存修改' : '创建账户'}
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
          <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f7', borderRadius: 10, fontSize: 13, color: '#6e6e73' }}>
            已选择 {selectedRowKeys.length} 个账户
          </div>
          <Form onFinish={handleCreateGroup} layout="vertical" form={groupForm}>
            <Form.Item name="group_name" label="分组名称" rules={[{ required: true, message: '请输入分组名称' }]}>
              <Input placeholder="请输入分组名称" style={{ borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }} />
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
    </div>
  )
}
