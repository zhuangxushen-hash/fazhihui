import { useState, useEffect, useMemo } from 'react'
import { Tree, Button, Modal, Form, Input, InputNumber, Select, Switch, Space, Tag, message, Spin } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, AppstoreOutlined, EyeInvisibleOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import { getMenus, createMenu, updateMenu, deleteMenu, toggleMenuVisibility } from '../api/menu'

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
  { value: 'MessageOutlined', label: '消息' },
]

export default function MenuManagement() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingMenu, setEditingMenu] = useState<any>(null)
  const [form] = Form.useForm()
  const [searchForm] = Form.useForm()
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([])
  const [keyword, setKeyword] = useState('')
  const [visibleFilter, setVisibleFilter] = useState<string | undefined>(undefined)

  const fetchData = async () => {
    setLoading(true)
    try {
      const list = await getMenus()
      setData(list || [])
    } catch (error) {
      message.error('获取菜单列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // 从扁平数据构建树形结构（包含所有菜单，含隐藏的），支持前端过滤
  const treeData = useMemo(() => {
    // 先过滤
    let filtered = [...data]
    if (keyword) {
      const kw = keyword.toLowerCase()
      filtered = filtered.filter(m =>
        m.name?.toLowerCase().includes(kw) ||
        m.path?.toLowerCase().includes(kw) ||
        m.component?.toLowerCase().includes(kw)
      )
    }
    if (visibleFilter !== undefined) {
      filtered = filtered.filter(m => m.is_visible === (visibleFilter === 'true'))
    }

    const menuMap = new Map<string, any>()
    const rootMenus: any[] = []

    // 按 sort_order 排序
    const sorted = [...filtered].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

    for (const menu of sorted) {
      menuMap.set(menu.id, { ...menu, children: [] })
    }

    for (const menu of sorted) {
      const node = menuMap.get(menu.id)
      if (menu.parent_id && menuMap.has(menu.parent_id)) {
        menuMap.get(menu.parent_id).children.push(node)
      } else {
        rootMenus.push(node)
      }
    }

    // 递归构建 Tree 组件数据
    const buildTreeNode = (item: any): any => {
      const hasChildren = item.children && item.children.length > 0

      return {
        key: item.id,
        title: (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: 8 }}>
            <Space size={8}>
              <AppstoreOutlined style={{ color: '#1890ff' }} />
              <span style={{ fontWeight: hasChildren ? 600 : 400 }}>{item.name}</span>
              <Tag color="blue" style={{ margin: 0 }}>{item.path}</Tag>
              {item.component && <Tag color="default" style={{ margin: 0 }}>{item.component}</Tag>}
              {!item.is_visible && <Tag color="warning" style={{ margin: 0 }}><EyeInvisibleOutlined /> 隐藏</Tag>}
              <span style={{ color: '#999', fontSize: 12 }}>排序: {item.sort_order ?? 0}</span>
            </Space>
            <Space size={4}>
              <Switch
                size="small"
                checked={item.is_visible}
                onChange={() => handleToggleVisibility(item.id)}
                checkedChildren="显示"
                unCheckedChildren="隐藏"
              />
              <Button type="link" size="small" icon={<PlusOutlined />} onClick={() => handleAdd(item.id)}>子菜单</Button>
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(item)}>编辑</Button>
              <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(item.id)}>删除</Button>
            </Space>
          </div>
        ),
        selectable: false,
        children: hasChildren ? item.children.map(buildTreeNode) : [],
      }
    }

    return rootMenus.map(buildTreeNode)
  }, [data, keyword, visibleFilter])

  // 默认展开所有一级菜单
  useEffect(() => {
    if (treeData.length > 0 && expandedKeys.length === 0) {
      setExpandedKeys(treeData.map(n => n.key))
    }
  }, [treeData, expandedKeys])

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

  const handleSearch = () => {
    const values = searchForm.getFieldsValue()
    setKeyword(values.keyword || '')
    setVisibleFilter(values.visible)
    setExpandedKeys([])
  }

  const handleReset = () => {
    searchForm.resetFields()
    setKeyword('')
    setVisibleFilter(undefined)
  }

  // 构建父菜单选择选项（树形）
  const parentMenuOptions = useMemo(() => {
    const buildOption = (item: any, depth: number = 0): any => {
      const prefix = '\u00A0\u00A0'.repeat(depth)
      const options: any[] = [{ label: `${prefix}${item.name}`, value: item.id }]
      if (item.children && item.children.length > 0) {
        for (const child of item.children) {
          options.push(...buildOption(child, depth + 1))
        }
      }
      return options
    }
    return data
      .filter(m => !m.parent_id)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .flatMap(m => buildOption(m))
  }, [data])

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>菜单管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAdd()}>添加顶级菜单</Button>
      </div>

      <div style={{ background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16 }}>
        <Form form={searchForm} layout="inline" style={{ gap: 8 }}>
          <Form.Item name="keyword" label="关键词">
            <Input placeholder="搜索菜单名称/路径/组件" allowClear style={{ width: 220 }} onPressEnter={handleSearch} />
          </Form.Item>
          <Form.Item name="visible" label="可见性">
            <Select placeholder="全部" allowClear style={{ width: 100 }} options={[
              { value: 'true', label: '显示' },
              { value: 'false', label: '隐藏' },
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

      <Spin spinning={loading}>
        <div style={{ background: '#fff', borderRadius: 8, padding: 16, minHeight: 400 }}>
          {treeData.length > 0 ? (
            <Tree
              treeData={treeData}
              expandedKeys={expandedKeys}
              onExpand={setExpandedKeys}
              showLine={{ showLeafIcon: false }}
              blockNode
            />
          ) : (
            <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>暂无菜单数据</div>
          )}
        </div>
      </Spin>

      <Modal
        title={editingMenu?.id ? '编辑菜单' : '添加菜单'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="parent_id" label="父菜单">
            <Select placeholder="不选则为顶级菜单" allowClear options={parentMenuOptions} />
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
