import { useState, useEffect, useMemo } from 'react'
import { Tree, Button, Modal, Form, Input, InputNumber, Select, Switch, Space, Tag, message, Spin, Empty, Card, Row, Col } from 'antd'
import type { TreeDataNode } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, FolderOutlined, LockOutlined, SearchOutlined, ReloadOutlined, SaveOutlined, TeamOutlined } from '@ant-design/icons'
import { getPermissions, createPermission, updatePermission } from '../api/permission'
import { getRoles, createRole, updateRole, deleteRole, toggleRoleStatus } from '../api/role'
import { theme } from '../constants/theme'

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

const getModuleLabel = (value: string) => {
  const item = moduleOptions.find(m => m.value === value)
  return item ? item.label : value
}

const getTypeLabel = (value: string) => {
  const item = typeOptions.find(t => t.value === value)
  return item ? item.label : value
}

const getModuleColor = (module: string) => {
  // 模块 Tag 样式映射（对齐 Stitch 设计规范，返回 className）
  const classMap: Record<string, string> = {
    system: 'stitch-tag stitch-tag-gold',
    user: 'stitch-tag stitch-tag-primary',
    role: 'stitch-tag stitch-tag-info',
    menu: 'stitch-tag stitch-tag-primary',
    crm: 'stitch-tag stitch-tag-success',
    case: 'stitch-tag stitch-tag-warning',
    compliance: 'stitch-tag stitch-tag-error',
    finance: 'stitch-tag stitch-tag-gold',
    marketing: 'stitch-tag stitch-tag-error',
    scrm: 'stitch-tag stitch-tag-success',
    dashboard: 'stitch-tag stitch-tag-warning',
    client: 'stitch-tag stitch-tag-primary',
  }
  return classMap[module] || 'stitch-tag stitch-tag-info'
}

export default function PermissionManagement() {
  const [permissions, setPermissions] = useState<Record<string, unknown>[]>([])
  const [roles, setRoles] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [checkedCodes, setCheckedCodes] = useState<string[]>([])
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([])
  const [searchForm] = Form.useForm()
  const [keyword, setKeyword] = useState('')
  const [moduleFilter, setModuleFilter] = useState<string | undefined>(undefined)
  // 角色管理弹窗
  const [roleModalVisible, setRoleModalVisible] = useState(false)
  const [editingRole, setEditingRole] = useState<Record<string, unknown> | null>(null)
  const [roleForm] = Form.useForm()
  // 权限项管理弹窗
  const [permModalVisible, setPermModalVisible] = useState(false)
  const [editingPermission, setEditingPermission] = useState<Record<string, unknown> | null>(null)
  const [permForm] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [permList, roleList] = (await Promise.all([getPermissions(), getRoles()])) as [Record<string, unknown>[], Record<string, unknown>[]]
      setPermissions(permList || [])
      setRoles(roleList || [])
      // 默认选中第一个角色
      if (roleList && roleList.length > 0 && !selectedRoleId) {
        setSelectedRoleId(roleList[0].id as string)
        setCheckedCodes((roleList[0].permissions as string[]) || [])
      }
    } catch (error) {
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // 选中角色时，加载该角色的权限
  useEffect(() => {
    if (selectedRoleId) {
      const role = roles.find(r => r.id === selectedRoleId)
      setCheckedCodes((role?.permissions as string[]) || [])
    }
  }, [selectedRoleId, roles])

  // 按模块分组构建权限树（支持过滤）
  const treeData = useMemo(() => {
    let filtered = [...permissions]
    if (keyword) {
      const kw = keyword.toLowerCase()
      filtered = filtered.filter(p =>
        (p.name as string)?.toLowerCase().includes(kw) ||
        (p.code as string)?.toLowerCase().includes(kw) ||
        (p.description as string)?.toLowerCase().includes(kw)
      )
    }
    if (moduleFilter) {
      filtered = filtered.filter(p => p.module === moduleFilter)
    }

    // 按模块分组
    const moduleMap = new Map<string, Record<string, unknown>[]>()
    for (const perm of filtered) {
      const mod = (perm.module as string) || 'other'
      if (!moduleMap.has(mod)) moduleMap.set(mod, [])
      moduleMap.get(mod)!.push(perm)
    }

    const orderedModules = [
      ...moduleOptions.map(m => m.value),
      ...Array.from(moduleMap.keys()).filter(k => !moduleOptions.find(m => m.value === k)),
    ]

    const result: TreeDataNode[] = []
    for (const mod of orderedModules) {
      const perms = moduleMap.get(mod)
      if (!perms || perms.length === 0) continue

      perms.sort((a, b) => ((a.sort_order as number) || 0) - ((b.sort_order as number) || 0))

      // 模块节点的 key 用模块前缀，避免和权限 id 冲突
      const modKey = `module-${mod}`
      result.push({
        key: modKey,
        title: (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <FolderOutlined style={{ color: theme.warning }} />
            <span style={{ fontWeight: 600 }}>{getModuleLabel(mod)}</span>
            <Tag className={getModuleColor(mod)}>{mod}</Tag>
            <Tag className="stitch-tag stitch-tag-info">{perms.length} 项</Tag>
          </span>
        ),
        selectable: false,
        children: perms.map(perm => ({
          key: perm.code as string,
          title: (
            <Space size={6}>
              <LockOutlined style={{ color: (perm.status as boolean) ? theme.success : theme.textQuaternary }} />
              <span>{perm.name as string}</span>
              <Tag className="stitch-tag stitch-tag-primary" style={{ margin: 0 }}>{perm.code as string}</Tag>
              <Tag className="stitch-tag stitch-tag-info" style={{ margin: 0 }}>{getTypeLabel(perm.type as string)}</Tag>
              {(perm.description as string) && <span style={{ color: theme.textTertiary, fontSize: 12 }}>{perm.description as string}</span>}
            </Space>
          ),
          selectable: false,
          isLeaf: true,
          disabled: !(perm.status as boolean),
        })),
      })
    }
    return result
  }, [permissions, keyword, moduleFilter])

  // 默认展开所有模块节点
  useEffect(() => {
    if (treeData.length > 0) {
      setExpandedKeys(treeData.map(n => n.key))
    }
  }, [treeData])

  // 选中角色的权限 key 列表（包括模块节点 key）
  const checkedKeys = useMemo(() => {
    return checkedCodes
  }, [checkedCodes])

  const handleCheck = (checked: unknown) => {
    // checked 可能是 { checked: [], halfChecked: [] } 或数组
    const codes = (Array.isArray(checked) ? checked : (checked as Record<string, unknown>)?.checked) as string[]
    // 过滤掉模块前缀的 key，只保留权限 code
    setCheckedCodes(codes.filter((k: string) => !k.startsWith('module-')))
  }

  const handleSave = async () => {
    if (!selectedRoleId) return
    setSaving(true)
    try {
      await updateRole(selectedRoleId, { permissions: checkedCodes })
      message.success('权限保存成功')
      // 更新本地角色数据
      setRoles(prev => prev.map(r => r.id === selectedRoleId ? { ...r, permissions: [...checkedCodes] } : r))
    } catch (error) {
      message.error('权限保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleSelectAll = () => {
    setCheckedCodes(permissions.filter(p => p.status as boolean).map(p => p.code as string))
  }

  const handleClearAll = () => {
    setCheckedCodes([])
  }

  // 查询
  const handleSearch = () => {
    const values = searchForm.getFieldsValue()
    setKeyword(values.keyword || '')
    setModuleFilter(values.module)
  }

  const handleReset = () => {
    searchForm.resetFields()
    setKeyword('')
    setModuleFilter(undefined)
  }

  // 角色管理
  const handleAddRole = () => {
    setEditingRole(null)
    roleForm.resetFields()
    setRoleModalVisible(true)
  }

  const handleEditRole = (role: Record<string, unknown>) => {
    setEditingRole(role)
    roleForm.setFieldsValue(role)
    setRoleModalVisible(true)
  }

  const handleRoleSubmit = async (values: Record<string, unknown>) => {
    try {
      if (editingRole) {
        await updateRole(editingRole.id as string, values)
        message.success('角色更新成功')
      } else {
        const newRole = await createRole(values) as Record<string, unknown>
        message.success('角色创建成功')
        setSelectedRoleId(newRole.id as string)
      }
      setRoleModalVisible(false)
      fetchData()
    } catch (error: unknown) {
      message.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || '操作失败')
    }
  }

  const handleDeleteRole = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个角色吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteRole(id)
          message.success('删除成功')
          if (selectedRoleId === id) setSelectedRoleId(null)
          fetchData()
        } catch (error) {
          message.error('删除失败')
        }
      },
    })
  }

  const handleToggleRoleStatus = async (id: string) => {
    try {
      await toggleRoleStatus(id)
      fetchData()
    } catch (error) {
      message.error('操作失败')
    }
  }

  // 权限项管理
  const handleAddPermission = () => {
    setEditingPermission(null)
    permForm.resetFields()
    setPermModalVisible(true)
  }

  const handlePermSubmit = async (values: Record<string, unknown>) => {
    try {
      if (editingPermission) {
        await updatePermission(editingPermission.id as string, values)
        message.success('权限项更新成功')
      } else {
        await createPermission(values)
        message.success('权限项创建成功')
      }
      setPermModalVisible(false)
      fetchData()
    } catch (error: unknown) {
      message.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || '操作失败')
    }
  }

  const selectedRole = roles.find(r => r.id === selectedRoleId)

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>权限管理</h2>
        <Space>
          <Button icon={<PlusOutlined />} onClick={handleAddPermission}>新增权限项</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddRole}>创建角色</Button>
        </Space>
      </div>

      <Row gutter={16}>
        {/* 左侧角色列表 */}
        <Col span={5}>
          <Card title={<span><TeamOutlined style={{ marginRight: 8 }} />角色列表</span>} size="small" style={{ minHeight: 500 }}>
            <Spin spinning={loading}>
              {roles.length > 0 ? (
                <div>
                  {roles.map(role => (
                    <div
                      key={role.id as string}
                      style={{
                        padding: '10px 12px',
                        marginBottom: 6,
                        borderRadius: 6,
                        cursor: 'pointer',
                        background: selectedRoleId === role.id ? 'rgba(24,144,255,0.08)' : '#fafafa',
                        border: selectedRoleId === role.id ? `1px solid ${theme.primary}` : '1px solid transparent',
                        transition: 'all 0.2s',
                      }}
                      onClick={() => setSelectedRoleId(role.id as string)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: selectedRoleId === role.id ? 600 : 400, fontSize: 13 }}>
                          {role.name as string}
                        </span>
                        <Space size={2}>
                          <Switch
                            size="small"
                            checked={role.status as boolean}
                            onChange={(_, e) => { e.stopPropagation(); handleToggleRoleStatus(role.id as string) }}
                            checkedChildren=""
                            unCheckedChildren=""
                          />
                        </Space>
                      </div>
                      <div style={{ fontSize: 11, color: theme.textTertiary, marginTop: 2 }}>
                        <Tag className="stitch-tag stitch-tag-primary" style={{ fontSize: 10 }}>{role.code as string}</Tag>
                        <span>{(role.permissions as string[])?.length || 0} 项权限</span>
                      </div>
                      <div style={{ marginTop: 4 }}>
                        <Button type="link" size="small" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); handleEditRole(role) }}>编辑</Button>
                        <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={(e) => { e.stopPropagation(); handleDeleteRole(role.id as string) }}>删除</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty description="暂无角色" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Spin>
          </Card>
        </Col>

        {/* 右侧权限配置 */}
        <Col span={19}>
          <Card
            size="small"
            title={
              selectedRole ? (
                <Space>
                  <span>{selectedRole.name as string}</span>
                  <Tag className="stitch-tag stitch-tag-primary">{selectedRole.code as string}</Tag>
                  <Tag className="stitch-tag stitch-tag-success">已选 {checkedCodes.length} 项</Tag>
                </Space>
              ) : '请选择角色'
            }
            extra={
              selectedRole && (
                <div className="stitch-btn-group">
                  <Button size="small" onClick={handleSelectAll}>全选</Button>
                  <Button size="small" onClick={handleClearAll}>清空</Button>
                  <Button size="small" type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>保存权限</Button>
                </div>
              )
            }
            style={{ minHeight: 500 }}
          >
            {selectedRole ? (
              <>
                {/* 查询条件 */}
                <div className="stitch-filter-bar" style={{ marginBottom: 12 }}>
                  <Form form={searchForm} layout="inline" style={{ gap: 8 }}>
                    <Form.Item name="keyword" label="关键词">
                      <Input placeholder="搜索名称/代码/描述" allowClear style={{ width: 180 }} onPressEnter={handleSearch} />
                    </Form.Item>
                    <Form.Item name="module" label="模块">
                      <Select placeholder="全部模块" allowClear style={{ width: 130 }} options={moduleOptions} />
                    </Form.Item>
                    <Form.Item>
                      <div className="stitch-btn-group">
                        <Button type="primary" size="small" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
                        <Button size="small" icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
                      </div>
                    </Form.Item>
                  </Form>
                </div>

                {/* 权限树 */}
                <Spin spinning={loading}>
                  <div style={{ minHeight: 300 }}>
                    {treeData.length > 0 ? (
                      <Tree
                        treeData={treeData}
                        checkable
                        checkedKeys={checkedKeys}
                        onCheck={handleCheck}
                        expandedKeys={expandedKeys}
                        onExpand={setExpandedKeys}
                        showLine={{ showLeafIcon: false }}
                        blockNode
                      />
                    ) : (
                      <Empty description="暂无权限数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    )}
                  </div>
                </Spin>
              </>
            ) : (
              <Empty description="请从左侧选择一个角色来配置权限" style={{ padding: 80 }} />
            )}
          </Card>
        </Col>
      </Row>

      {/* 角色编辑弹窗 */}
      <Modal
        title={editingRole ? '编辑角色' : '创建角色'}
        open={roleModalVisible}
        onCancel={() => setRoleModalVisible(false)}
        onOk={() => roleForm.submit()}
        width={500}
      >
        <Form form={roleForm} onFinish={handleRoleSubmit} layout="vertical">
          <Form.Item name="name" label="角色名称" rules={[{ required: true, message: '请输入角色名称' }]}>
            <Input placeholder="如：谈案销售" />
          </Form.Item>
          <Form.Item name="code" label="角色代码" rules={[{ required: true, message: '请输入角色代码' }]}>
            <Input placeholder="如：sales" disabled={!!editingRole} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="请输入角色描述" />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue={true} valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 权限项编辑弹窗 */}
      <Modal
        title={editingPermission ? '编辑权限项' : '新增权限项'}
        open={permModalVisible}
        onCancel={() => setPermModalVisible(false)}
        onOk={() => permForm.submit()}
        width={600}
      >
        <Form form={permForm} onFinish={handlePermSubmit} layout="vertical">
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
            <Input.TextArea rows={2} placeholder="请输入权限描述" />
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
