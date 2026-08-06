import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, Space, message, Card, Switch } from 'antd'
import { PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined } from '@ant-design/icons'
import {
  getOrganizations,
  createOrganization,
  updateOrganization,
  Organization,
} from '../api/organization'
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

export default function OrganizationManagement() {
  const [list, setList] = useState<Organization[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null)
  const [form] = Form.useForm()
  // 查询条件
  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)

  // 拉取组织列表
  const fetchList = async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = {}
      if (searchKeyword) params.keyword = searchKeyword
      if (statusFilter) params.status = statusFilter
      const res = await getOrganizations(params as Parameters<typeof getOrganizations>[0]) as Organization[]
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
  }, [])

  // 新建组织
  const handleAdd = () => {
    setEditingOrg(null)
    form.resetFields()
    form.setFieldsValue({ status: 'active' })
    setModalVisible(true)
  }

  // 编辑组织
  const handleEdit = (record: Organization) => {
    setEditingOrg(record)
    form.setFieldsValue({
      name: record.name,
      short_name: record.short_name,
      contact_name: record.contact_name,
      contact_phone: record.contact_phone,
      address: record.address,
      description: record.description,
      status: record.status,
    })
    setModalVisible(true)
  }

  // 提交表单（新建/编辑）
  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      if (editingOrg) {
        await updateOrganization(editingOrg.id, values as Parameters<typeof updateOrganization>[1])
        message.success('组织更新成功')
      } else {
        await createOrganization(values as Parameters<typeof createOrganization>[0])
        message.success('组织创建成功')
      }
      setModalVisible(false)
      fetchList()
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  // 启停切换
  const handleToggleStatus = async (record: Organization, checked: boolean) => {
    try {
      await updateOrganization(record.id, { status: checked ? 'active' : 'inactive' })
      message.success(checked ? '组织已启用' : '组织已停用')
      fetchList()
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  // 重置查询
  const handleReset = () => {
    setSearchKeyword('')
    setStatusFilter(undefined)
    fetchList()
  }

  const columns = [
    {
      title: '组织名称',
      dataIndex: 'name',
      key: 'name',
      render: (v: string, record: Organization) => (
        <div>
          <span style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, color: theme.textBase }}>
            {v || '-'}
          </span>
          {record.short_name && (
            <span style={{ marginLeft: 8, fontSize: 12, color: theme.textTertiary }}>
              ({record.short_name})
            </span>
          )}
        </div>
      ),
    },
    { title: '联系人', dataIndex: 'contact_name', key: 'contact_name', render: (v: string) => v || '-' },
    { title: '联系电话', dataIndex: 'contact_phone', key: 'contact_phone', render: (v: string) => v || '-' },
    { title: '地址', dataIndex: 'address', key: 'address', ellipsis: true, render: (v: string) => v || '-' },
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
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: '启用',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 80,
      render: (_: unknown, record: Organization) => (
        <Switch
          checked={record.status === 'active'}
          onChange={(checked) => handleToggleStatus(record, checked)}
          size="small"
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: Organization) => (
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
          编辑
        </Button>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
        <h2 style={pageH2Style}>组织管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新建组织</Button>
      </div>

      {/* 查询条件区 */}
      <div className="stitch-filter-bar">
        <Input
          placeholder="组织名称搜索"
          prefix={<SearchOutlined />}
          style={{ width: 220 }}
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onPressEnter={fetchList}
        />
        <Select
          placeholder="状态"
          allowClear
          style={{ width: 140 }}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v)}
          options={[
            { label: '启用', value: 'active' },
            { label: '停用', value: 'inactive' },
          ]}
        />
        <Space>
          <Button type="primary" icon={<SearchOutlined />} onClick={fetchList}>查询</Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
        </Space>
      </div>

      <Card className="stitch-table" style={tableCardStyle} styles={{ body: { padding: 0 } }}>
        <Table<Organization>
          dataSource={list}
          columns={columns}
          loading={loading}
          rowKey="id"
          size="small"
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* 新建/编辑组织弹窗 */}
      <Modal
        title={editingOrg ? '编辑组织' : '新建组织'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={560}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="组织名称" rules={[{ required: true, message: '请输入组织名称' }]}>
            <Input placeholder="请输入组织名称" />
          </Form.Item>
          <Form.Item name="short_name" label="简称">
            <Input placeholder="请输入组织简称" />
          </Form.Item>
          <Form.Item name="contact_name" label="联系人">
            <Input placeholder="请输入联系人" />
          </Form.Item>
          <Form.Item name="contact_phone" label="联系电话">
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item name="address" label="地址">
            <Input placeholder="请输入地址" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="请输入组织描述" rows={3} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select
              options={[
                { label: '启用', value: 'active' },
                { label: '停用', value: 'inactive' },
              ]}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">{editingOrg ? '保存' : '创建'}</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
