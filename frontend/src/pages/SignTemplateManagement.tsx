import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Table, Button, Modal, Form, Input, Select, Space, message, Card, Switch, Tag, Typography, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, FieldTimeOutlined, DeleteOutlined, ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons'
// 法大大签署任务模板维护（组织管理 → 操作栏跳转进入）
import {
  getSignTemplateList,
  saveSignTemplate,
  updateSignTemplate,
  deleteSignTemplate,
  syncSignTemplateFields,
  getSignTemplateFields,
  saveSignTemplateFieldsConfig,
  SignTemplate,
  SignTemplateField,
  SignFillMode,
  AUTO_SOURCE_OPTIONS,
} from '../api/signTemplate'
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
 * 签署模板维护（法大大 sign-template）
 * 由「组织管理 → 操作栏 → 签约模板」跳转进入。
 * - 模板信息维护：增删改查签署任务模板
 * - 字段配置：从法大大同步模板填写控件，配置每个字段的填写方式（客户C端填写/业务员预填/固定值）
 */
export default function SignTemplateManagement() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  // 组织数据隔离：记录从组织管理操作栏跳转进入时选中的组织（超管可按组织查看；组织管理员由后端强制为本组织）
  const organizationId = searchParams.get('organization_id') || undefined
  const organizationName = searchParams.get('org_name') || ''
  // 签署任务模板列表
  const [signTemplates, setSignTemplates] = useState<SignTemplate[]>([])
  const [signTemplateLoading, setSignTemplateLoading] = useState(false)
  const [signTemplateModalVisible, setSignTemplateModalVisible] = useState(false)
  const [signTemplateEditing, setSignTemplateEditing] = useState<SignTemplate | null>(null)
  const [signTemplateForm] = Form.useForm()

  // 模板字段配置
  const [fieldModalVisible, setFieldModalVisible] = useState(false)
  const [fieldTemplate, setFieldTemplate] = useState<SignTemplate | null>(null)
  const [fieldLoading, setFieldLoading] = useState(false)
  const [fieldSyncLoading, setFieldSyncLoading] = useState(false)
  const [signTemplateFields, setSignTemplateFields] = useState<SignTemplateField[]>([])
  const [fieldSaving, setFieldSaving] = useState(false)

  // 拉取签署任务模板列表（按选中组织过滤，超管可见所选组织或全部）
  const fetchSignTemplates = async () => {
    setSignTemplateLoading(true)
    try {
      const res = await getSignTemplateList(organizationId ? { organization_id: organizationId } : undefined) as unknown as SignTemplate[]
      setSignTemplates(res || [])
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setSignTemplateLoading(false)
    }
  }

  useEffect(() => {
    fetchSignTemplates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId])

  // 新增签约模板
  const handleSignTemplateAdd = () => {
    setSignTemplateEditing(null)
    signTemplateForm.resetFields()
    signTemplateForm.setFieldsValue({ enabled: true })
    setSignTemplateModalVisible(true)
  }

  // 编辑签约模板
  const handleSignTemplateEdit = (record: SignTemplate) => {
    setSignTemplateEditing(record)
    signTemplateForm.setFieldsValue({
      name: record.name,
      sign_template_id: record.sign_template_id,
      description: record.description,
      enabled: record.enabled,
    })
    setSignTemplateModalVisible(true)
  }

  // 提交签约模板（新增/编辑）
  const handleSignTemplateSubmit = async (values: Record<string, unknown>) => {
    try {
      if (signTemplateEditing) {
        await updateSignTemplate(signTemplateEditing.id, {
          name: values.name as string,
          description: (values.description as string) || undefined,
          enabled: (values.enabled as boolean) ?? true,
        })
        message.success('签约模板已更新')
      } else {
        await saveSignTemplate({
          sign_template_id: values.sign_template_id as string,
          name: values.name as string,
          description: (values.description as string) || undefined,
          enabled: (values.enabled as boolean) ?? true,
          // 组织数据隔离：新增模板归属于当前选中的组织（组织管理员由后端强制为本组织）
          organization_id: organizationId,
        })
        message.success('签约模板已新增')
      }
      setSignTemplateModalVisible(false)
      fetchSignTemplates()
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  // 启用/停用签约模板
  const handleSignTemplateToggle = async (record: SignTemplate, checked: boolean) => {
    try {
      await updateSignTemplate(record.id, { enabled: checked })
      message.success(checked ? '签约模板已启用' : '签约模板已停用')
      fetchSignTemplates()
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  // 删除签约模板
  const handleSignTemplateDelete = async (record: SignTemplate) => {
    try {
      await deleteSignTemplate(record.id)
      message.success('签约模板已删除')
      fetchSignTemplates()
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  // 打开模板字段配置弹窗并加载本地字段配置
  const handleSignTemplateFields = async (record: SignTemplate) => {
    setFieldTemplate(record)
    setSignTemplateFields([])
    setFieldModalVisible(true)
    setFieldLoading(true)
    try {
      const res = await getSignTemplateFields(record.id) as unknown as SignTemplateField[]
      setSignTemplateFields(res || [])
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setFieldLoading(false)
    }
  }

  // 从法大大重新同步模板字段（覆盖本地配置，未配置字段以默认方式生成）
  const handleSyncFields = async () => {
    if (!fieldTemplate) return
    setFieldSyncLoading(true)
    try {
      const res = await syncSignTemplateFields(fieldTemplate.id) as unknown as { success: boolean; count: number }
      message.success(`模板字段已同步（${res?.count ?? 0} 个填写控件）`)
      const list = await getSignTemplateFields(fieldTemplate.id) as unknown as SignTemplateField[]
      setSignTemplateFields(list || [])
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setFieldSyncLoading(false)
    }
  }

  // 更新本地字段配置（行内编辑，不立即保存）
  const handleFieldRowChange = (index: number, patch: Partial<SignTemplateField>) => {
    setSignTemplateFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)))
  }

  // 保存模板字段配置
  const handleSaveFieldConfig = async () => {
    if (!fieldTemplate) return
    setFieldSaving(true)
    try {
      const items = signTemplateFields.map((f) => ({
        field_id: f.field_id,
        fill_mode: f.fill_mode,
        auto_source: f.auto_source || undefined,
        fixed_value: f.fixed_value || undefined,
        enabled: f.enabled,
      }))
      // 后端按 field_id 匹配更新本模板对应字段（未匹配字段自动忽略）
      await saveSignTemplateFieldsConfig(fieldTemplate.id, items)
      message.success('模板字段配置已保存')
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setFieldSaving(false)
    }
  }

  const signTemplateColumns = [
    { title: '模板名称', dataIndex: 'name', key: 'name', render: (v: string) => <span style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, color: theme.textBase }}>{v || '-'}</span> },
    { title: '法大大模板ID', dataIndex: 'sign_template_id', key: 'sign_template_id', width: 220, render: (v: string) => <Typography.Text copyable style={{ fontSize: 12 }}>{v}</Typography.Text> },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true, render: (v: string) => v || '-' },
    {
      title: '启用',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 80,
      render: (_: unknown, record: SignTemplate) => (
        <Switch checked={record.enabled} onChange={(checked) => handleSignTemplateToggle(record, checked)} size="small" />
      ),
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 170, render: (v: string) => formatDateTime(v) },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_: unknown, record: SignTemplate) => (
        <Space size={0}>
          <Button type="link" size="small" icon={<FieldTimeOutlined />} onClick={() => handleSignTemplateFields(record)}>字段配置</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleSignTemplateEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除该签约模板吗？" okText="删除" cancelText="取消" onConfirm={() => handleSignTemplateDelete(record)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <h2 style={pageH2Style}>{organizationName ? `${organizationName} · 签署模板维护` : '签署模板维护（法大大）'}</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="stitch-filter-bar" style={{ justifyContent: 'space-between' }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/system/organizations')}>返回组织管理</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleSignTemplateAdd}>新增签约模板</Button>
        </div>
        <Card className="stitch-table" style={tableCardStyle} styles={{ body: { padding: 0 } }}>
          <Table<SignTemplate>
            dataSource={signTemplates}
            columns={signTemplateColumns}
            loading={signTemplateLoading}
            rowKey="id"
            size="small"
            scroll={{ x: 1000 }}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </div>

      {/* 新增/编辑签约模板弹窗 */}
      <Modal
        title={signTemplateEditing ? '编辑签约模板' : '新增签约模板'}
        open={signTemplateModalVisible}
        onCancel={() => setSignTemplateModalVisible(false)}
        footer={null}
        width={560}
      >
        <Form form={signTemplateForm} layout="vertical" onFinish={handleSignTemplateSubmit}>
          <Form.Item name="name" label="模板名称" rules={[{ required: true, message: '请输入模板名称' }]}>
            <Input placeholder="请输入签署模板名称" />
          </Form.Item>
          <Form.Item name="sign_template_id" label="法大大模板ID" rules={[{ required: true, message: '请输入法大大模板ID' }]}>
            <Input placeholder="请输入法大大签署任务模板ID（sign_template_id）" disabled={!!signTemplateEditing} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="请输入模板描述" rows={3} />
          </Form.Item>
          <Form.Item name="enabled" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">{signTemplateEditing ? '保存' : '新增'}</Button>
              <Button onClick={() => setSignTemplateModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 模板字段配置弹窗：配置模板内填写控件的填写方式 */}
      <Modal
        title={fieldTemplate ? `模板字段配置 - ${fieldTemplate.name}` : '模板字段配置'}
        open={fieldModalVisible}
        onCancel={() => setFieldModalVisible(false)}
        footer={[
          <Button key="sync" icon={<ReloadOutlined />} loading={fieldSyncLoading} onClick={handleSyncFields}>同步模板字段</Button>,
          <Button key="cancel" onClick={() => setFieldModalVisible(false)}>取消</Button>,
          <Button key="save" type="primary" loading={fieldSaving} onClick={handleSaveFieldConfig}>保存配置</Button>,
        ]}
        width={1080}
      >
        <div style={{ marginBottom: 12, padding: '10px 12px', background: 'rgba(0,0,0,0.03)', borderRadius: 8, fontSize: 13, color: theme.textSecondary }}>
          为模板内每个填写控件配置填写方式：<Tag color="blue">客户C端填写</Tag> 由客户在签署链接中填写；<Tag color="orange">业务员发起预填</Tag> 发起签约时由业务员带出/补充；<Tag color="green">固定值</Tag> 在此直接填写，发起签约自动写入。字段编码（fieldId）为法大大控件唯一标识，同步后不可自行更名。
        </div>
        <Table<SignTemplateField>
          dataSource={signTemplateFields}
          rowKey="id"
          size="small"
          loading={fieldLoading}
          scroll={{ x: 1000, y: 420 }}
          pagination={false}
          locale={{ emptyText: fieldLoading ? '加载中...' : '尚未同步字段，请点击右上角「同步模板字段」从法大大拉取控件' }}
          columns={[
            { title: '字段名称', dataIndex: 'field_name', key: 'field_name', width: 180, render: (v: string) => <Typography.Text strong style={{ fontSize: 13 }}>{v || '-'}</Typography.Text> },
            { title: '字段编码', dataIndex: 'field_id', key: 'field_id', width: 190, render: (v: string) => <Typography.Text copyable style={{ fontSize: 12 }}>{v}</Typography.Text> },
            { title: '类型', dataIndex: 'field_type', key: 'field_type', width: 130, render: (v: string) => v || '-' },
            { title: '必填', dataIndex: 'required', key: 'required', width: 70, render: (v: boolean) => (v ? <Tag color="red">必填</Tag> : <Tag>选填</Tag>) },
            { title: '归属参与方', dataIndex: 'actor', key: 'actor', width: 110, render: (v: string) => v || '-' },
            {
              title: '填写方式',
              dataIndex: 'fill_mode',
              key: 'fill_mode',
              width: 150,
              render: (v: SignFillMode, _r: SignTemplateField, index: number) => (
                <Select<SignFillMode>
                  size="small"
                  value={v}
                  style={{ width: 130 }}
                  onChange={(val) => handleFieldRowChange(index, { fill_mode: val })}
                  options={[
                    { label: '客户C端填写', value: 'client' },
                    { label: '业务员发起预填', value: 'prefill' },
                    { label: '固定值', value: 'fixed' },
                  ]}
                />
              ),
            },
            {
              title: '自动带出',
              dataIndex: 'auto_source',
              key: 'auto_source',
              width: 190,
              render: (v: string | undefined, _r: SignTemplateField, index: number) => {
                if (_r.fill_mode !== 'prefill') return <span style={{ color: '#999' }}>-</span>
                return (
                  <Select
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    size="small"
                    style={{ width: 170 }}
                    placeholder="选择带出来源"
                    value={v || undefined}
                    onChange={(val) => handleFieldRowChange(index, { auto_source: (val as string) || undefined })}
                    options={AUTO_SOURCE_OPTIONS}
                  />
                )
              },
            },
            {
              title: '固定值',
              dataIndex: 'fixed_value',
              key: 'fixed_value',
              width: 200,
              render: (v: string | undefined, _r: SignTemplateField, index: number) => {
                if (_r.fill_mode !== 'fixed') return <span style={{ color: '#999' }}>-</span>
                return (
                  <Input
                    size="small"
                    placeholder="填写固定值，发起签约自动写入"
                    value={v || ''}
                    onChange={(e) => handleFieldRowChange(index, { fixed_value: e.target.value })}
                  />
                )
              },
            },
            {
              title: '启用',
              dataIndex: 'enabled',
              key: 'enabled',
              width: 70,
              render: (v: boolean, _r: SignTemplateField, index: number) => (
                <Switch size="small" checked={v} onChange={(checked) => handleFieldRowChange(index, { enabled: checked })} />
              ),
            },
          ]}
        />
      </Modal>
    </div>
  )
}