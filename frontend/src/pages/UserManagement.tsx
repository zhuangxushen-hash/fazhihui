import { useState, useEffect } from 'react'
import { Table, Tag, Button, Modal, Form, Input, Select, Space, message, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, EyeOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import axios from '../api/axios'
import { formatDateTime } from '../utils/format'

export default function UserManagement() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [form] = Form.useForm()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isEdit, setIsEdit] = useState(false)
  const [searchParams, setSearchParams] = useState({
    name: '',
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
      const params: any = { org_id: user.organization_id }
      if (searchParams.name) params.name = searchParams.name
      if (searchParams.phone) params.phone = searchParams.phone
      if (searchParams.role) params.role = searchParams.role

      const res = await axios.get('/users', { params })
      setData(res.data || [])
    } catch (error) {
      console.error('Fetch users error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchData()
  }

  const handleReset = () => {
    setSearchParams({ name: '', phone: '', role: '' })
    fetchData()
  }

  const handleAddUser = () => {
    form.resetFields()
    setIsEdit(false)
    setCurrentUser(null)
    setModalVisible(true)
  }

  const handleEditUser = (record: any) => {
    setCurrentUser(record)
    form.setFieldsValue({
      name: record.name,
      phone: record.phone,
      role: record.role,
      email: record.email,
    })
    setIsEdit(true)
    setModalVisible(true)
  }

  const handleSubmit = async (values: any) => {
    try {
      if (isEdit && currentUser) {
        await axios.put(`/users/${currentUser.id}`, values)
        message.success('用户更新成功')
      } else {
        await axios.post('/users', { ...values, organization_id: user.organization_id, password: '123456' })
        message.success('用户创建成功')
      }
      setModalVisible(false)
      fetchData()
    } catch (error) {
      message.error(isEdit ? '用户更新失败' : '用户创建失败')
      console.error('User operation error:', error)
    }
  }

  const handleDeleteUser = async (record: any) => {
    try {
      await axios.delete(`/users/${record.id}`)
      message.success('用户删除成功')
      fetchData()
    } catch (error) {
      message.error('用户删除失败')
      console.error('Delete user error:', error)
    }
  }

  const handleViewDetail = (record: any) => {
    setCurrentUser(record)
    setDetailVisible(true)
  }

  const handleResetPassword = async (record: any) => {
    try {
      await axios.put(`/users/${record.id}/reset-password`, { password: '123456' })
      message.success('密码已重置为123456')
    } catch (error) {
      message.error('密码重置失败')
      console.error('Reset password error:', error)
    }
  }

  const roleOptions = [
    { value: 'admin', label: '超级管理员' },
    { value: 'manager', label: '律所管理者' },
    { value: 'marketer', label: '投放专员' },
    { value: 'sales', label: '谈案销售' },
    { value: 'lawyer', label: '办案律师' },
    { value: 'assistant', label: '律师助理' },
    { value: 'finance', label: '财务人员' },
    { value: 'client', label: '客户' },
  ]

  const columns = [
    { title: '用户ID', dataIndex: 'id', key: 'id', width: 120 },
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '手机号', dataIndex: 'phone', key: 'phone' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '角色', dataIndex: 'role', key: 'role', render: (role: string) => {
      const colors: Record<string, string> = {
        admin: 'red',
        manager: 'orange',
        marketer: 'cyan',
        sales: 'blue',
        lawyer: 'purple',
        assistant: 'default',
        finance: 'gold',
        client: 'gray',
      }
      const labels: Record<string, string> = {
        admin: '超级管理员',
        manager: '律所管理者',
        marketer: '投放专员',
        sales: '谈案销售',
        lawyer: '办案律师',
        assistant: '律师助理',
        finance: '财务人员',
        client: '客户',
      }
      return <Tag color={colors[role]}>{labels[role]}</Tag>
    }},
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (val: string) => formatDateTime(val) },
    { title: '操作', key: 'action', render: (_: any, record: any) => (
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

      <div className="search-bar">
        <Input
          placeholder="姓名搜索"
          prefix={<SearchOutlined />}
          style={{ width: 150 }}
          value={searchParams.name}
          onChange={(e) => setSearchParams({ ...searchParams, name: e.target.value })}
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
        <Button type="primary" onClick={handleSearch}>搜索</Button>
        <Button onClick={handleReset}>重置</Button>
      </div>

      <Table dataSource={data} columns={columns} loading={loading} rowKey="id" />

      <Modal
        title={isEdit ? '编辑用户' : '添加用户'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form onFinish={handleSubmit}>
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
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
            <div className="detail-item"><span className="detail-label">用户ID</span><span className="detail-value">{currentUser.id}</span></div>
            <div className="detail-item"><span className="detail-label">姓名</span><span className="detail-value">{currentUser.name}</span></div>
            <div className="detail-item"><span className="detail-label">手机号</span><span className="detail-value">{currentUser.phone}</span></div>
            <div className="detail-item"><span className="detail-label">邮箱</span><span className="detail-value">{currentUser.email || '-'}</span></div>
            <div className="detail-item"><span className="detail-label">角色</span><span className="detail-value">
              <Tag color={{
                admin: 'red',
                manager: 'orange',
                marketer: 'cyan',
                sales: 'blue',
                lawyer: 'purple',
                assistant: 'default',
                finance: 'gold',
                client: 'gray',
              }[currentUser.role as string]}>
                {{
                  admin: '超级管理员',
                  manager: '律所管理者',
                  marketer: '投放专员',
                  sales: '谈案销售',
                  lawyer: '办案律师',
                  assistant: '律师助理',
                  finance: '财务人员',
                  client: '客户',
                }[currentUser.role as string]}
              </Tag>
            </span></div>
            <div className="detail-item"><span className="detail-label">组织ID</span><span className="detail-value">{currentUser.organization_id}</span></div>
            <div className="detail-item"><span className="detail-label">创建时间</span><span className="detail-value">{formatDateTime(currentUser.created_at)}</span></div>
            <div className="detail-item"><span className="detail-label">更新时间</span><span className="detail-value">{formatDateTime(currentUser.updated_at)}</span></div>
          </div>
        )}
      </Modal>
    </div>
  )
}
