import { useState, useEffect } from 'react'
import { Table, Tag, Button, Modal, Form, Input, Select, Space, message, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, EyeOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import axios from '../api/axios'
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

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchData()
  }, [])

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
    setModalVisible(true)
  }

  const handleEditUser = (record: Record<string, unknown>) => {
    setCurrentUser(record)
    form.setFieldsValue({
      real_name: record.real_name,
      phone: record.phone,
      role: record.role,
      email: record.email,
    })
    setIsEdit(true)
    setModalVisible(true)
  }

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      if (isEdit && currentUser) {
        await axios.put(`/users/${currentUser.id as string}`, values)
        message.success('用户更新成功')
      } else {
        await axios.post('/users', { ...values, organization_id: user.organization_id, password: '123456' })
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
        <Table dataSource={data} columns={columns} loading={loading} rowKey="id" />
      </div>

      <Modal
        title={isEdit ? '编辑用户' : '添加用户'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form onFinish={handleSubmit}>
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
            <div className="detail-item"><span className="detail-label">创建时间</span><span className="detail-value">{formatDateTime(currentUser.created_at as string)}</span></div>
            <div className="detail-item"><span className="detail-label">更新时间</span><span className="detail-value">{formatDateTime(currentUser.updated_at as string)}</span></div>
          </div>
        )}
      </Modal>
    </div>
  )
}
