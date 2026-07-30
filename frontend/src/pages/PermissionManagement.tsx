import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, Select, Switch, Space, Tag, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import {
  getPermissions,
  createPermission,
  updatePermission,
  deletePermission,
  togglePermissionStatus,
} from '../api/permission'

const moduleOptions = [
  { label: '系统管理', value: 'system' },
  { label: '用户管理', value: 'user' },
  { label: '角色管理', value: 'role' },
  { label: '菜单管理', value: 'menu' },
  { label: '线索CRM', value: 'crm' },
  { label: '案件办案', value: 'case' },
  { label: '合规风控', value: 'compliance' },
  { label: '财务分润', value: 'finance' },
  { label: '投放营销', value: 'marketing' },
  { label: 'SCRM私域', value: 'scrm' },
  { label: '数据看板', value: 'dashboard' },
  { label: 'C端服务', value: 'client' },
]

const typeOptions = [
  { label: '查看', value: 'read' },
  { label: '新增', value: 'create' },
  { label: '编辑', value: 'update' },
  { label: '删除', value: 'delete' },
  { label: '审批', value: 'approve' },
  { label: '导出', value: 'export' },
  { label: '导入', value: 'import' },
  { label: '全部', value: 'all' },
]

export default function PermissionManagement() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingPermission, setEditingPermission] = useState<any>(null)
  const [form] = Form.useForm()
  const [currentModule, setCurrentModule] = useState<string | undefined>(undefined)

  const fetchData = async () => {
    setLoading(true)
    try {
      const list = await getPermissions(currentModule)
      setData(list || [])
    } catch (error) {
      message.error('获取权限列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [currentModule])

  const handleAdd = () => {
    setEditingPermission(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: any) => {
    setEditingPermission(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleSubmit = async (values: any) => {
    try {
      if (editingPermission) {
        await updatePermission(editingPermission.id, values)
        message.success('权限更新成功')
      } else {
        await createPermission(values)
        message.success('权限创建成功')
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
      content: '确定要删除这个权限吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deletePermission(id)
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
      await togglePermissionStatus(id)
      fetchData()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const getModuleLabel = (value: string) => {
    const item = moduleOptions.find(m => m.value === value)
    return item ? item.label : value
  }

  const getTypeLabel = (value: string) => {
    const item = typeOptions.find(t => t.value === value)
    return item ? item.label : value
  }

  const getModuleColor = (module: string) => {
    const colors: Record<string, string> = {
      system: 'purple',
      user: 'blue',
      role: 'cyan',
      menu: 'geekblue',
      crm: 'green',
      case: 'orange',
      compliance: 'red',
      finance: 'gold',
      marketing: 'magenta',
      scrm: 'lime',
      dashboard: 'volcano',
      client: 'blue',
    }
    return colors[module] || 'default'
  }

  const columns = [
    { title: '权限名称', dataIndex: 'name', key: 'name' },
    {
      title: '权限代码',
      dataIndex: 'code',
      key: 'code',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '所属模块',
      dataIndex: 'module',
      key: 'module',
      render: (mod: string) => <Tag color={getModuleColor(mod)}>{getModuleLabel(mod)}</Tag>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color="default">{getTypeLabel(type)}</Tag>
      ),
    },
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

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h2 style={{ margin: 0 }}>权限管理</h2>
          <Select
            placeholder="按模块筛选"
            style={{ width: 160 }}
            allowClear
            value={currentModule}
            onChange={setCurrentModule}
            options={moduleOptions}
          />
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>创建权限</Button>
      </div>

      <Table
        dataSource={data}
        columns={columns}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 20 }}
      />

      <Modal
        title={editingPermission ? '编辑权限' : '创建权限'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="name" label="权限名称" rules={[{ required: true, message: '请输入权限名称' }]}>
            <Input placeholder="如：查看用户列表" />
          </Form.Item>
          <Form.Item name="code" label="权限代码" rules={[{ required: true, message: '请输入权限代码' }]}>
            <Input placeholder="如：user:read" disabled={!!editingPermission} />
          </Form.Item>
          <Form.Item name="module" label="所属模块" rules={[{ required: true, message: '请选择所属模块' }]}>
            <Select placeholder="选择所属模块" options={moduleOptions} />
          </Form.Item>
          <Form.Item name="type" label="权限类型" rules={[{ required: true, message: '请选择权限类型' }]}>
            <Select placeholder="选择权限类型" options={typeOptions} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入权限描述" />
          </Form.Item>
          <Form.Item name="sort_order" label="排序" initialValue={0}>
            <InputNumber min={0} max={999} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue={true} valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
