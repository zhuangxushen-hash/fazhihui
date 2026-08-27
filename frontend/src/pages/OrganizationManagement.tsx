import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Button, Modal, Form, Input, Select, Space, message, Card, Switch, Checkbox, Tag, Typography } from 'antd'
import { PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined, LinkOutlined, AuditOutlined, CopyOutlined, TeamOutlined } from '@ant-design/icons'
import {
  getOrganizations,
  createOrganization,
  updateOrganization,
  Organization,
} from '../api/organization'
// 法大大认证授权（组织管理 → 认证授权）
import {
  getCorpAuthList,
  createCorpAuth,
  queryCorpAuthStatus,
  CorpAuth,
} from '../api/corpAuth'
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
  const navigate = useNavigate()
  const [list, setList] = useState<Organization[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null)
  const [form] = Form.useForm()
  // 查询条件
  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)

  // 认证授权（法大大企业授权）
  const [authList, setAuthList] = useState<CorpAuth[]>([])
  const [authModalVisible, setAuthModalVisible] = useState(false)
  const [authForm] = Form.useForm()

  // 跳转到签署模板维护（组织管理 → 操作栏 → 签约模板），携带所选组织用于数据隔离展示
  const goSignTemplateManagement = (org: Organization) => {
    navigate(`/system/organizations/sign-templates?organization_id=${encodeURIComponent(org.id)}&org_name=${encodeURIComponent(org.name || '')}`)
  }

  // 跳转到团队维护（组织管理 → 操作栏 → 团队），携带所选组织用于数据隔离展示
  const goTeamManagement = (org: Organization) => {
    navigate(`/system/organizations/teams?organization_id=${encodeURIComponent(org.id)}&org_name=${encodeURIComponent(org.name || '')}`)
  }

  // 法大大授权范围选项（按 authScope 隔离，签署需 signtask_init、印章需 seal_info 等）
  const authScopeOptions = [
    { label: '企业实名信息', value: 'ident_info' },
    { label: '企业印章', value: 'seal_info' },
    { label: '发起签署', value: 'signtask_init' },
    { label: '签署任务查询', value: 'signtask_info' },
    { label: '签署文件下载', value: 'signtask_file' },
    { label: '组织架构', value: 'organization' },
    { label: '模板管理', value: 'template' },
  ]

  // 拉取企业授权记录列表
  const fetchAuthList = async () => {
    try {
      const res = await getCorpAuthList() as unknown as CorpAuth[]
      setAuthList(res || [])
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  // 从组织列表发起认证授权：自动带出该组织已有信息（企业名称/联系人/联系电话等）
  const handleAuthForOrg = (record: Organization) => {
    authForm.resetFields()
    authForm.setFieldsValue({
      // 企业标识默认复用组织 id（全局唯一），可修改
      client_corp_id: record.id,
      // 自动带出：企业名称（组织名称）、简要称、联系人/联系电话（经办人）
      corp_name: record.name || '',
      corp_ident_no: undefined,
      legal_rep_name: undefined,
      agent_name: record.contact_name || undefined,
      agent_id_card_no: undefined,
      agent_mobile: record.contact_phone || undefined,
      // 授权归属该平台方组织
      organization_id: record.id,
      auth_scopes: ['signtask_init', 'signtask_info', 'signtask_file', 'seal_info', 'ident_info'],
    })
    setAuthModalVisible(true)
  }

  // 提交企业授权（生成授权链接）
  const handleAuthCreate = async (values: Record<string, unknown>) => {
    const scopes = (values.auth_scopes as string[]) || []
    try {
      const res = await createCorpAuth({
        organization_id: (values.organization_id as string) || undefined,
        client_corp_id: values.client_corp_id as string,
        corp_name: values.corp_name as string,
        corp_ident_no: (values.corp_ident_no as string) || undefined,
        legal_rep_name: (values.legal_rep_name as string) || undefined,
        agent_name: (values.agent_name as string) || undefined,
        agent_id_card_no: (values.agent_id_card_no as string) || undefined,
        agent_mobile: (values.agent_mobile as string) || undefined,
        auth_scopes: scopes,
      }) as unknown as CorpAuth
      if (res?.auth_url) {
        navigator.clipboard?.writeText(res.auth_url).catch(() => undefined)
        Modal.success({
          title: '企业授权链接已生成',
          width: 560,
          content: (
            <div>
              <p>由于授权链接仅 3 天内有效且只能使用一次，链接已自动复制到剪贴板，请尽快发送给目标企业完成认证与授权。</p>
              <Typography.Paragraph copyable={{ text: res.auth_url, icon: [<CopyOutlined key="c" />, <CopyOutlined key="d" />] }}>
                <a href={res.auth_url} target="_blank" rel="noreferrer" style={{ wordBreak: 'break-all' }}>{res.auth_url}</a>
              </Typography.Paragraph>
            </div>
          ),
        })
      } else {
        // 无授权链接（如法大大返回"该企业已授权"）时：后端已同步保存企业标识并更新为已授权
        if (res?.auth_status === 'authed') {
          message.success('该企业已授权，系统已同步更新授权状态')
        } else {
          message.success('企业授权提交成功')
        }
      }
      setAuthModalVisible(false)
      fetchAuthList()
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  // 查询企业授权状态
  const handleAuthStatus = async (record: CorpAuth) => {
    try {
      const res = await queryCorpAuthStatus(record.client_corp_id) as unknown as CorpAuth
      message.success(`授权状态：${res.auth_status === 'authed' ? '已授权' : '待授权'}`)
      fetchAuthList()
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  // 授权状态标签渲染
  const renderAuthStatus = (v: string) => {
    if (v === 'authed') return <Tag color="success">已授权</Tag>
    if (v === 'failed') return <Tag color="error">授权失败</Tag>
    return <Tag color="warning">待授权</Tag>
  }

  // 根据组织记录匹配对应的法大大授权记录（从组织发起时 client_corp_id 与 organization_id 均为组织 id）
  const getOrgAuth = (record: Organization): CorpAuth | undefined =>
    authList.find((a) => a.client_corp_id === record.id || a.organization_id === record.id)

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
    fetchAuthList()
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
      title: '法大大授权情况',
      key: 'corpAuth',
      width: 240,
      render: (_: unknown, record: Organization) => {
        const auth = getOrgAuth(record)
        if (!auth) return <Tag>未授权</Tag>
        return (
          <Space size={4} wrap>
            {renderAuthStatus(auth.auth_status)}
            {auth.open_corp_id ? (
              <Typography.Text type="secondary" style={{ fontSize: 12, maxWidth: 120 }}>
                {auth.open_corp_id}
              </Typography.Text>
            ) : null}
            <Button type="link" size="small" icon={<AuditOutlined />} onClick={() => handleAuthStatus(auth)}>
              查询
            </Button>
          </Space>
        )
      },
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
      width: 340,
      render: (_: unknown, record: Organization) => (
        <Space size={0} wrap>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" icon={<LinkOutlined />} onClick={() => handleAuthForOrg(record)}>
            认证授权
          </Button>
          <Button type="link" size="small" icon={<AuditOutlined />} onClick={() => goSignTemplateManagement(record)}>
            签约模板
          </Button>
          <Button type="link" size="small" icon={<TeamOutlined />} onClick={() => goTeamManagement(record)}>
            团队
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <h2 style={pageH2Style}>组织管理</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* 查询条件区 */}
        <div className="stitch-filter-bar" style={{ justifyContent: 'space-between' }}>
          <Space>
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
            <Button type="primary" icon={<SearchOutlined />} onClick={fetchList}>查询</Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新建组织</Button>
        </div>

        <Card className="stitch-table" style={tableCardStyle} styles={{ body: { padding: 0 } }}>
          <Table<Organization>
            dataSource={list}
            columns={columns}
            loading={loading}
            rowKey="id"
            size="small"
            scroll={{ x: 1400 }}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </div>

      {/* 发起企业授权弹窗 */}
      <Modal
        title="发起企业授权"
        open={authModalVisible}
        onCancel={() => setAuthModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={authForm} layout="vertical" onFinish={handleAuthCreate}>
          {/* 归属组织（从组织列表发起时自动带出，仅用于内部关联） */}
          <Form.Item name="organization_id" noStyle>
            <Input type="hidden" />
          </Form.Item>
          <Form.Item name="client_corp_id" label="企业标识（clientCorpId）" rules={[{ required: true, message: '请输入企业标识' }]}>
            <Input placeholder="目标企业在业务系统中的唯一标识" />
          </Form.Item>
          <Form.Item name="corp_name" label="企业名称" rules={[{ required: true, message: '请输入企业名称' }]}>
            <Input placeholder="请输入企业名称" />
          </Form.Item>
          <Form.Item name="corp_ident_no" label="统一社会信用代码">
            <Input placeholder="请输入企业统一社会信用代码" />
          </Form.Item>
          <Form.Item name="legal_rep_name" label="法定代表人姓名">
            <Input placeholder="请输入法定代表人姓名" />
          </Form.Item>
          <Form.Item name="agent_name" label="经办人姓名">
            <Input placeholder="请输入经办人姓名" />
          </Form.Item>
          <Form.Item name="agent_id_card_no" label="经办人证件号">
            <Input placeholder="请输入经办人证件号" />
          </Form.Item>
          <Form.Item name="agent_mobile" label="经办人手机号">
            <Input placeholder="法大大登录账号，用于授权范围与签署" />
          </Form.Item>
          <Form.Item name="auth_scopes" label="授权范围" rules={[{ required: true, message: '请选择授权范围' }]}>
            <Checkbox.Group options={authScopeOptions} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">生成授权链接</Button>
              <Button onClick={() => setAuthModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

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
