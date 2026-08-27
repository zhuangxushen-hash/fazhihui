import { useState, useEffect } from 'react'
import { Table, Tag, Button, Modal, Form, Input, Select, Space, message, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, EyeOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import axios from '../api/axios'
import { getOrganizations, Organization } from '../api/organization'
import { getTeamList, type Team } from '../api/team'
import { formatDateTime } from '../utils/format'

export default function UserManagement() {
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [form] = Form.useForm()
  const [currentUser, setCurrentUser] = useState<Record<string, unknown> | null>(null)
  const [isEdit, setIsEdit] = useState(false)
  const [searchParams, setSearchParams] = useState({
    real_name: '',
    phone: '',
    role: '',
  })
  // 组织下拉数据（用于给用户关联所属组织）
  const [organizations, setOrganizations] = useState<Organization[]>([])
  // 团队下拉数据（按所选组织过滤，用于给用户关联所属团队）
  const [teams, setTeams] = useState<Team[]>([])

  // 监听表单中的组织选择，联动加载该组织下的团队
  const selectedOrgId = Form.useWatch('organization_id', form)

  // 根据组织 id 加载该组织下的团队列表（选中组织变化或新增/编辑时调用）
  const loadTeams = async (orgId?: string) => {
    if (!orgId) {
      setTeams([])
      return
    }
    try {
      const res = await getTeamList({ organization_id: orgId, status: 'active' }) as unknown as Team[]
      const list = res || []
      setTeams(list)
      // 若当前已选团队不属于新组织，则清空归属团队
      const currentTeam = form.getFieldValue('team_id')
      if (currentTeam && !list.some(t => t.id === currentTeam)) {
        form.setFieldValue('team_id', undefined)
      }
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  // 组织选择变化：联动加载该组织下的团队
  useEffect(() => {
    loadTeams(selectedOrgId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrgId])

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchData()
    loadOrganizations()
  }, [])

  // 加载组织列表（关联组织下拉数据源）
  const loadOrganizations = async () => {
    try {
      const list = await getOrganizations()
      setOrganizations(list || [])
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  // 组织ID → 组织名称映射（列表/表单展示）
  const getOrgName = (orgId?: string) => {
    if (!orgId) return '未关联组织'
    return organizations.find(o => o.id === orgId)?.name || orgId
  }

  // 团队ID → 团队名称映射（列表/详情展示；未加载到时回退显示ID或'-'）
  const getTeamName = (teamId?: string) => {
    if (!teamId) return '-'
    return teams.find(t => t.id === teamId)?.name || teamId
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { org_id: user.organization_id }
      if (searchParams.real_name) params.name = searchParams.real_name
      if (searchParams.phone) params.phone = searchParams.phone
      if (searchParams.role) params.role = searchParams.role

      const res = (await axios.get('/users', { params })) as Record<string, unknown>
      setData((res?.data as Record<string, unknown>[]) || [])
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchData()
  }

  const handleReset = () => {
    setSearchParams({ real_name: '', phone: '', role: '' })
    fetchData()
  }

  const handleAddUser = () => {
    form.resetFields()
    setIsEdit(false)
    setCurrentUser(null)
    // 新增默认关联到当前登录用户所属组织（管理员可在表单中选择其它组织）
    form.setFieldsValue({ organization_id: user.organization_id || undefined })
    // 主动加载登录用户所属组织的团队（同组织时 watch 不会触发）
    loadTeams(user.organization_id as string | undefined)
    setModalVisible(true)
  }

  const handleEditUser = (record: Record<string, unknown>) => {
    setCurrentUser(record)
    form.setFieldsValue({
      real_name: record.real_name,
      phone: record.phone,
      role: record.role,
      email: record.email,
      organization_id: record.organization_id || undefined,
      team_id: record.team_id || undefined,
    })
    // 编辑时主动加载该组织下的团队，确保所属团队下拉有数据（同组织时 watch 不会触发）
    loadTeams(record.organization_id as string | undefined)
    setIsEdit(true)
    setModalVisible(true)
  }

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      if (isEdit && currentUser) {
        // 编辑：允许管理员变更用户所属组织（organization_id 已含于表单值）
        await axios.put(`/users/${currentUser.id as string}`, values)
        message.success('用户更新成功')
      } else {
        // 新增：未选组织时回退到登录用户所属组织
        await axios.post('/users', {
          ...values,
          organization_id: values.organization_id || user.organization_id,
          password: '123456',
        })
        message.success('用户创建成功')
      }
      setModalVisible(false)
      fetchData()
    } catch (error) {
      message.error(isEdit ? '用户更新失败' : '用户创建失败')
    }
  }

  const handleDeleteUser = async (record: Record<string, unknown>) => {
    try {
      await axios.delete(`/users/${record.id as string}`)
      message.success('用户删除成功')
      fetchData()
    } catch (error) {
      message.error('用户删除失败')
    }
  }

  const handleViewDetail = (record: Record<string, unknown>) => {
    setCurrentUser(record)
    setDetailVisible(true)
  }

  const handleResetPassword = async (record: Record<string, unknown>) => {
    try {
      await axios.put(`/users/${record.id as string}/reset-password`, { password: '123456' })
      message.success('密码已重置为123456')
    } catch (error) {
      message.error('密码重置失败')
    }
  }

  const roleOptions = [
    { value: 'super_admin', label: '超级管理员' },
    { value: 'org_admin', label: '律所管理者' },
    { value: 'marketing', label: '投放专员' },
    { value: 'sales', label: '谈案销售' },
    { value: 'lawyer', label: '办案律师' },
    { value: 'assistant', label: '律师助理' },
    { value: 'finance', label: '财务人员' },
    { value: 'client', label: '客户' },
  ]

  const columns = [
    { title: '用户ID', dataIndex: 'id', key: 'id', width: 120 },
    { title: '姓名', dataIndex: 'real_name', key: 'real_name' },
    { title: '手机号', dataIndex: 'phone', key: 'phone' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '角色', dataIndex: 'role', key: 'role', render: (role: string) => {
      // 角色 Tag 样式映射（对齐 Stitch 设计规范）
      const tagClass: Record<string, string> = {
        super_admin: 'stitch-tag stitch-tag-error',
        org_admin: 'stitch-tag stitch-tag-warning',
        marketing: 'stitch-tag stitch-tag-info',
        sales: 'stitch-tag stitch-tag-primary',
        lawyer: 'stitch-tag stitch-tag-primary',
        assistant: 'stitch-tag stitch-tag-info',
        finance: 'stitch-tag stitch-tag-warning',
        client: 'stitch-tag stitch-tag-info',
      }
      const labels: Record<string, string> = {
        super_admin: '超级管理员',
        org_admin: '律所管理者',
        marketing: '投放专员',
        sales: '谈案销售',
        lawyer: '办案律师',
        assistant: '律师助理',
        finance: '财务人员',
        client: '客户',
      }
      return <Tag className={tagClass[role] || 'stitch-tag stitch-tag-info'}>{labels[role] || '-'}</Tag>
    }},
    { title: '所属组织', dataIndex: 'organization_id', key: 'organization_id', render: (val?: string) => getOrgName(val) },
    { title: '所属团队', dataIndex: 'team_id', key: 'team_id', render: (val?: string) => getTeamName(val) },
    { title: '经验值', dataIndex: 'experience', key: 'experience', width: 90, render: (val: number) => val || 0 },
    { title: '等级', dataIndex: 'level', key: 'level', width: 80, render: (val: number) => <Tag className="stitch-tag stitch-tag-gold">Lv{val || 1}</Tag> },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (val: string) => formatDateTime(val) },
    { title: '操作', key: 'action', render: (_: unknown, record: Record<string, unknown>) => (
      <Space>
        <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
        <Button size="small" icon={<EditOutlined />} onClick={() => handleEditUser(record)}>编辑</Button>
        <Button size="small" onClick={() => handleResetPassword(record)}>重置密码</Button>
        <Popconfirm title="确定要删除该用户吗？" onConfirm={() => handleDeleteUser(record)}>
          <Button size="small" icon={<DeleteOutlined />} danger>删除</Button>
        </Popconfirm>
      </Space>
    )},
  ]

  return (
    <div>
      <div className="page-header">
        <h2>用户管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddUser}>添加用户</Button>
      </div>

      <div className="search-bar stitch-filter-bar">
        <Input
          placeholder="姓名搜索"
          prefix={<SearchOutlined />}
          style={{ width: 150 }}
          value={searchParams.real_name}
          onChange={(e) => setSearchParams({ ...searchParams, real_name: e.target.value })}
        />
        <Input
          placeholder="手机号搜索"
          style={{ width: 150 }}
          value={searchParams.phone}
          onChange={(e) => setSearchParams({ ...searchParams, phone: e.target.value })}
        />
        <Select
          placeholder="角色筛选"
          style={{ width: 150 }}
          allowClear
          value={searchParams.role || undefined}
          onChange={(value) => setSearchParams({ ...searchParams, role: value || '' })}
        >
          {roleOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
        </Select>
        <div className="stitch-btn-group">
          <Button type="primary" onClick={handleSearch}>搜索</Button>
          <Button onClick={handleReset}>重置</Button>
        </div>
      </div>

      <div className="stitch-table">
        <Table dataSource={data} columns={columns} loading={loading} rowKey="id" scroll={{ x: 1600 }} />
      </div>

      <Modal
        title={isEdit ? '编辑用户' : '添加用户'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={form} onFinish={handleSubmit}>
          <Form.Item name="real_name" label="姓名" rules={[{ required: true }]}>
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item name="phone" label="手机号" rules={[{ required: true }]}>
            <Input placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true }]}>
            <Select>
              {roleOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="organization_id" label="所属组织" tooltip="为用户关联所属组织，签约模板按该组织数据隔离">
            <Select
              allowClear
              placeholder="请选择所属组织（不选则默认本组织）"
            >
              {organizations.map(org => <Select.Option key={org.id} value={org.id}>{org.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="team_id" label="所属团队" tooltip="为用户关联该组织下的团队（切换组织后将只展示该组织的团队）">
            <Select
              allowClear
              placeholder="请选择所属团队"
              notFoundContent={selectedOrgId ? '该组织暂无团队，请先在组织管理维护团队' : '请先选择所属组织'}
            >
              {teams.map(team => <Select.Option key={team.id} value={team.id}>{team.name}</Select.Option>)}
            </Select>
          </Form.Item>
          {!isEdit && (
            <Form.Item label="初始密码">
              <Input disabled value="123456" />
            </Form.Item>
          )}
          <Form.Item>
            <Button type="primary" htmlType="submit">提交</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="用户详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={500}
      >
        {currentUser && (
          <div className="detail-grid">
            <div className="detail-item"><span className="detail-label">用户ID</span><span className="detail-value">{currentUser.id as string}</span></div>
            <div className="detail-item"><span className="detail-label">姓名</span><span className="detail-value">{currentUser.real_name as string}</span></div>
            <div className="detail-item"><span className="detail-label">手机号</span><span className="detail-value">{currentUser.phone as string}</span></div>
            <div className="detail-item"><span className="detail-label">邮箱</span><span className="detail-value">{(currentUser.email as string) || '-'}</span></div>
            <div className="detail-item"><span className="detail-label">角色</span><span className="detail-value">
              <Tag className={{
                super_admin: 'stitch-tag stitch-tag-error',
                org_admin: 'stitch-tag stitch-tag-warning',
                marketing: 'stitch-tag stitch-tag-info',
                sales: 'stitch-tag stitch-tag-primary',
                lawyer: 'stitch-tag stitch-tag-primary',
                assistant: 'stitch-tag stitch-tag-info',
                finance: 'stitch-tag stitch-tag-warning',
                client: 'stitch-tag stitch-tag-info',
              }[currentUser.role as string] || 'stitch-tag stitch-tag-info'}>
                {{
                  super_admin: '超级管理员',
                  org_admin: '律所管理者',
                  marketing: '投放专员',
                  sales: '谈案销售',
                  lawyer: '办案律师',
                  assistant: '律师助理',
                  finance: '财务人员',
                  client: '客户',
                }[currentUser.role as string] || '-'}
              </Tag>
            </span></div>
            <div className="detail-item"><span className="detail-label">组织ID</span><span className="detail-value">{currentUser.organization_id as string}</span></div>
            <div className="detail-item"><span className="detail-label">所属组织</span><span className="detail-value">{getOrgName(currentUser.organization_id as string)}</span></div>
            <div className="detail-item"><span className="detail-label">所属团队</span><span className="detail-value">{(currentUser.team_id as string) ? getTeamName(currentUser.team_id as string) : '-'}</span></div>
            <div className="detail-item"><span className="detail-label">创建时间</span><span className="detail-value">{formatDateTime(currentUser.created_at as string)}</span></div>
            <div className="detail-item"><span className="detail-label">更新时间</span><span className="detail-value">{formatDateTime(currentUser.updated_at as string)}</span></div>
          </div>
        )}
      </Modal>
    </div>
  )
}
