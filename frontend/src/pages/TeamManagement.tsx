import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Table, Button, Modal, Form, Input, Select, Space, message, Card, Switch, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ArrowLeftOutlined, SearchOutlined } from '@ant-design/icons'
// 团队维护（组织管理 → 操作栏跳转进入，每个组织下可维护多个团队）
import { getTeamList, createTeam, updateTeam, deleteTeam, type Team, type SaveTeamParams } from '../api/team'
import { formatDateTime } from '../utils/format'
import { theme } from '../constants/theme'

// 页面标题样式
const pageH2Style: React.CSSProperties = {
  fontFamily: "'Noto Serif SC', serif",
  fontSize: 22,
  fontWeight: 600,
  color: theme.textBase,
  margin: 0,
  letterSpacing: '0.01em',
}

const tableCardStyle: React.CSSProperties = {
  borderRadius: 16,
  overflow: 'hidden',
}

/**
 * 团队维护（组织 → 团队）
 * 由「组织管理 → 操作栏 → 团队」跳转进入。
 * - 每个组织下可维护多个团队（增删改查、启停）
 * - 用户管理可为用户关联所属团队
 */
export default function TeamManagement() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  // 组织数据隔离：记录从组织管理操作栏跳转进入时选中的组织（超管可按组织查看；组织管理员由后端强制为本组织）
  const organizationId = searchParams.get('organization_id') || undefined
  const organizationName = searchParams.get('org_name') || ''
  // 团队列表
  const [list, setList] = useState<Team[]>([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [editing, setEditing] = useState<Team | null>(null)
  const [form] = Form.useForm()

  // 拉取团队列表（按选中组织过滤，超管可见所选组织或全部）
  const fetchList = async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = {}
      if (organizationId) params.organization_id = organizationId
      if (keyword) params.keyword = keyword
      const res = await getTeamList(params as Parameters<typeof getTeamList>[0]) as unknown as Team[]
      setList(res || [])
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId])

  // 新增团队
  const handleAdd = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ status: 'active' })
    setModalVisible(true)
  }

  // 编辑团队
  const handleEdit = (record: Team) => {
    setEditing(record)
    form.setFieldsValue({
      name: record.name,
      leader_id: record.leader_id,
      description: record.description,
      status: record.status,
    })
    setModalVisible(true)
  }

  // 提交团队（新增/编辑）
  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      const payload: SaveTeamParams = {
        name: values.name as string,
        description: (values.description as string) || undefined,
        leader_id: (values.leader_id as string) || undefined,
        status: (values.status as 'active' | 'inactive') || 'active',
      }
      if (editing) {
        await updateTeam(editing.id, payload) as unknown as Team
        message.success('团队已更新')
      } else {
        await createTeam({
          ...payload,
          // 组织数据隔离：新增团队归属于当前选中的组织（组织管理员由后端强制为本组织）
          organization_id: organizationId,
        }) as unknown as Team
        message.success('团队已新增')
      }
      setModalVisible(false)
      fetchList()
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  // 启停切换
  const handleToggleStatus = async (record: Team, checked: boolean) => {
    try {
      await updateTeam(record.id, { status: checked ? 'active' : 'inactive' }) as unknown as Team
      message.success(checked ? '团队已启用' : '团队已停用')
      fetchList()
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  // 删除团队
  const handleDelete = async (record: Team) => {
    try {
      await deleteTeam(record.id)
      message.success('团队已删除')
      fetchList()
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  const columns = [
    { title: '团队名称', dataIndex: 'name', key: 'name', render: (v: string) => <span style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, color: theme.textBase }}>{v || '-'}</span> },
    { title: '负责人ID', dataIndex: 'leader_id', key: 'leader_id', render: (v: string) => v || '-' },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true, render: (v: string) => v || '-' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => (
        <span className={`stitch-tag ${v === 'active' ? 'stitch-tag-success' : 'stitch-tag-warning'}`}>
          {v === 'active' ? '启用' : '停用'}
        </span>
      ),
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 170, render: (v: string) => formatDateTime(v) },
    {
      title: '启用',
      dataIndex: 'status',
      key: 'enabled',
      width: 80,
      render: (_: unknown, record: Team) => (
        <Switch checked={record.status === 'active'} onChange={(checked) => handleToggleStatus(record, checked)} size="small" />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_: unknown, record: Team) => (
        <Space size={0}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除该团队吗？删除后该团队下的成员将失去团队归属" okText="删除" cancelText="取消" onConfirm={() => handleDelete(record)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <h2 style={pageH2Style}>{organizationName ? `${organizationName} · 团队维护` : '团队维护'}</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="stitch-filter-bar" style={{ justifyContent: 'space-between' }}>
          <Space>
            <Input
              placeholder="团队名称搜索"
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={fetchList}
            />
            <Button type="primary" icon={<SearchOutlined />} onClick={fetchList}>查询</Button>
          </Space>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/system/organizations')}>返回组织管理</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增团队</Button>
          </Space>
        </div>
        <Card className="stitch-table" style={tableCardStyle} styles={{ body: { padding: 0 } }}>
          <Table<Team> dataSource={list} columns={columns} loading={loading} rowKey="id" size="small" scroll={{ x: 900 }} pagination={{ pageSize: 10 }} />
        </Card>
      </div>

      {/* 新增/编辑团队弹窗 */}
      <Modal
        title={editing ? '编辑团队' : '新增团队'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={520}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="团队名称" rules={[{ required: true, message: '请输入团队名称' }]}>
            <Input placeholder="请输入团队名称" />
          </Form.Item>
          <Form.Item name="leader_id" label="负责人ID">
            <Input placeholder="请输入团队负责人用户ID（可选）" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="请输入团队描述" rows={3} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select options={[
              { label: '启用', value: 'active' },
              { label: '停用', value: 'inactive' },
            ]} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">{editing ? '保存' : '新增'}</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}