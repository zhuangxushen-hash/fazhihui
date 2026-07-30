import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, Select, Switch, Space, message, Tree, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { getMenus, getMenuTree, createMenu, updateMenu, deleteMenu, toggleMenuVisibility } from '../api/menu'

const iconOptions = [
  { value: 'DashboardOutlined', label: '仪表盘' },
  { value: 'UserOutlined', label: '用户' },
  { value: 'TeamOutlined', label: '团队' },
  { value: 'FileTextOutlined', label: '文件' },
  { value: 'SecurityScanOutlined', label: '安全' },
  { value: 'DollarOutlined', label: '财务' },
  { value: 'NotificationOutlined', label: '通知' },
  { value: 'SettingOutlined', label: '设置' },
  { value: 'AppstoreOutlined', label: '应用' },
  { value: 'SolutionOutlined', label: '解决方案' },
]

export default function MenuManagement() {
  const [data, setData] = useState<any[]>([])
  const [treeData, setTreeData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingMenu, setEditingMenu] = useState<any>(null)
  const [form] = Form.useForm()
  const [viewMode, setViewMode] = useState<'table' | 'tree'>('table')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [menus, tree] = await Promise.all([getMenus(), getMenuTree()])
      setData(menus || [])
      setTreeData(tree || [])
    } catch (error) {
      message.error('获取菜单列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAdd = (parentId?: string) => {
    setEditingMenu(parentId ? { parent_id: parentId } : null)
    form.resetFields()
    if (parentId) {
      form.setFieldsValue({ parent_id: parentId })
    }
    setModalVisible(true)
  }

  const handleEdit = (record: any) => {
    setEditingMenu(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleSubmit = async (values: any) => {
    try {
      if (editingMenu?.id) {
        await updateMenu(editingMenu.id, values)
        message.success('菜单更新成功')
      } else {
        await createMenu(values)
        message.success('菜单创建成功')
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
      content: '确定要删除这个菜单吗？删除后子菜单将变为顶级菜单。',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteMenu(id)
          message.success('删除成功')
          fetchData()
        } catch (error) {
          message.error('删除失败')
        }
      },
    })
  }

  const handleToggleVisibility = async (id: string) => {
    try {
      await toggleMenuVisibility(id)
      fetchData()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const columns = [
    { title: '菜单名称', dataIndex: 'name', key: 'name' },
    { title: '路径', dataIndex: 'path', key: 'path', render: (text: string) => <Tag color="blue">{text}</Tag> },
    {
      title: '图标',
      dataIndex: 'icon',
      key: 'icon',
      render: (icon: string) => {
        const option = iconOptions.find(o => o.value === icon)
        return option ? option.label : icon || '-'
      },
    },
    { title: '排序', dataIndex: 'sort_order', key: 'sort_order' },
    {
      title: '可见性',
      dataIndex: 'is_visible',
      key: 'is_visible',
      render: (visible: boolean, record: any) => (
        <Switch
          checked={visible}
          onChange={() => handleToggleVisibility(record.id)}
          checkedChildren="显示"
          unCheckedChildren="隐藏"
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" icon={<PlusOutlined />} onClick={() => handleAdd(record.id)}>添加子菜单</Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      ),
    },
  ]

  const convertToTreeData = (items: any[]): any[] => {
    return items.map(item => ({
      key: item.id,
      title: (
        <span>
          {item.name} <Tag color="blue" style={{ marginLeft: 8 }}>{item.path}</Tag>
          {!item.is_visible && <Tag color="default" style={{ marginLeft: 4 }}>已隐藏</Tag>}
        </span>
      ),
      children: item.children ? convertToTreeData(item.children) : [],
    }))
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ margin: 0 }}>菜单管理</h2>
        </div>
        <Space>
          <Select
            value={viewMode}
            onChange={setViewMode}
            style={{ width: 120 }}
            options={[
              { value: 'table', label: '表格视图' },
              { value: 'tree', label: '树形视图' },
            ]}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAdd()}>添加顶级菜单</Button>
        </Space>
      </div>

      {viewMode === 'table' ? (
        <Table
          dataSource={data}
          columns={columns}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 20 }}
        />
      ) : (
        <div style={{ background: '#fff', padding: 16, borderRadius: 8 }}>
          {treeData.length > 0 ? (
            <Tree treeData={convertToTreeData(treeData)} defaultExpandAll />
          ) : (
            <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>暂无菜单数据</div>
          )}
        </div>
      )}

      <Modal
        title={editingMenu?.id ? '编辑菜单' : '添加菜单'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="parent_id" label="父菜单" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="name" label="菜单名称" rules={[{ required: true, message: '请输入菜单名称' }]}>
            <Input placeholder="请输入菜单名称" />
          </Form.Item>
          <Form.Item name="path" label="路由路径" rules={[{ required: true, message: '请输入路由路径' }]}>
            <Input placeholder="如：/dashboard/users" />
          </Form.Item>
          <Form.Item name="icon" label="图标">
            <Select placeholder="选择图标" allowClear options={iconOptions} />
          </Form.Item>
          <Form.Item name="component" label="组件路径">
            <Input placeholder="如：UserManagement" />
          </Form.Item>
          <Form.Item name="sort_order" label="排序" initialValue={0}>
            <InputNumber min={0} max={999} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="is_visible" label="是否可见" initialValue={true} valuePropName="checked">
            <Switch checkedChildren="显示" unCheckedChildren="隐藏" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
