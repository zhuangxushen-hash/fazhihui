import { useState, useEffect, useMemo } from 'react'
import { Table, Button, Modal, Form, Input, Switch, Space, message, Tag, Select } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import { getRoles, createRole, updateRole, deleteRole, toggleRoleStatus } from '../api/role'

export default function RoleManagement() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRole, setEditingRole] = useState<any>(null)
  const [form] = Form.useForm()
  const [searchForm] = Form.useForm()
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getRoles()
      setData(res || [])
    } catch (error) {
      message.error('获取角色列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAdd = () => {
    setEditingRole(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: any) => {
    setEditingRole(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleSubmit = async (values: any) => {
    try {
      if (editingRole) {
        await updateRole(editingRole.id, values)
        message.success('角色更新成功')
      } else {
        await createRole(values)
        message.success('角色创建成功')
      }
      setModalVisible(false)
      fetchData()
    } catch (error: any) {
      message.error(error?.response?.data?.message || '操作失败')
    }
  }

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个角色吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteRole(id)
          message.success('删除成功')
          fetchData()
        } catch (error) {
          message.error('删除失败')
        }
      },
    })
  }

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleRoleStatus(id)
      fetchData()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const columns = [
    { title: '角色名称', dataIndex: 'name', key: 'name' },
    { title: '角色代码', dataIndex: 'code', key: 'code', render: (text: string) => <Tag color="blue">{text}</Tag> },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: boolean, record: any) => (
        <Switch
          checked={status}
          onChange={() => handleToggleStatus(record.id)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      ),
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (text: string) => new Date(text).toLocaleString('zh-CN') },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      ),
    },
  ]

  // 前端过滤
  const filteredData = useMemo(() => {
    let result = [...data]
    if (keyword) {
      const kw = keyword.toLowerCase()
      result = result.filter(r =>
        r.name?.toLowerCase().includes(kw) ||
        r.code?.toLowerCase().includes(kw) ||
        r.description?.toLowerCase().includes(kw)
      )
    }
    if (statusFilter !== undefined) {
      result = result.filter(r => r.status === (statusFilter === 'true'))
    }
    return result
  }, [data, keyword, statusFilter])

  const handleSearch = () => {
    const values = searchForm.getFieldsValue()
    setKeyword(values.keyword || '')
    setStatusFilter(values.status)
  }

  const handleReset = () => {
    searchForm.resetFields()
    setKeyword('')
    setStatusFilter(undefined)
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>角色管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>创建角色</Button>
      </div>

      <div style={{ background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16 }}>
        <Form form={searchForm} layout="inline" style={{ gap: 8 }}>
          <Form.Item name="keyword" label="关键词">
            <Input placeholder="搜索角色名称/代码/描述" allowClear style={{ width: 220 }} onPressEnter={handleSearch} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="全部" allowClear style={{ width: 100 }} options={[
              { value: 'true', label: '启用' },
              { value: 'false', label: '禁用' },
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
        dataSource={filteredData}
        columns={columns}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
      />

      <Modal
        title={editingRole ? '编辑角色' : '创建角色'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="name" label="角色名称" rules={[{ required: true, message: '请输入角色名称' }]}>
            <Input placeholder="请输入角色名称" />
          </Form.Item>
          <Form.Item name="code" label="角色代码" rules={[{ required: true, message: '请输入角色代码' }]}>
            <Input placeholder="请输入角色代码，如：ROLE_ADMIN" disabled={!!editingRole} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入角色描述" />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue={true} valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
