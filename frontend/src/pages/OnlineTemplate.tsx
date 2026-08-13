import { useState, useCallback, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Table,
  Input,
  Button,
  Space,
  Select,
  Tag,
  Modal,
  Form,
  message,
} from 'antd'
import {
  FileTextOutlined,
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { theme } from '../constants/theme'
import {
  getProfileTemplates,
  createProfileTemplate,
  deleteProfileTemplate,
  useProfileTemplate,
} from '../api/user-profile'
import type { OnlineTemplateItem } from '../api/user-profile'

const { TextArea } = Input

// 模板类型映射
const templateTypeConfig: Record<string, { label: string; color: string }> = {
  contract: { label: '合同', color: 'blue' },
  document: { label: '文书', color: 'purple' },
  letter: { label: '函件', color: 'cyan' },
  opinion: { label: '意见书', color: 'green' },
}

export default function OnlineTemplate() {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<OnlineTemplateItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [templateType, setTemplateType] = useState<string | undefined>()

  // 创建弹窗
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm] = Form.useForm()

  // 详情弹窗
  const [detail, setDetail] = useState<OnlineTemplateItem | null>(null)

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getProfileTemplates({
        keyword: keyword || undefined,
        template_type: templateType,
        page,
        page_size: pageSize,
      })
      setDataSource(res.data || [])
      setTotal(res.total || 0)
    } catch (err) {
      message.error('加载在线模板失败')
    } finally {
      setLoading(false)
    }
  }, [keyword, templateType, page, pageSize])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 创建模板
  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields()
      setCreating(true)
      await createProfileTemplate({
        name: values.name,
        template_type: values.template_type,
        category: values.category,
        content: values.content,
      })
      message.success('模板创建成功')
      setCreateModalVisible(false)
      createForm.resetFields()
      setPage(1)
      loadData()
    } catch (err) {
      const e = err as { errorFields?: unknown }
      if (e?.errorFields) return
      message.error('创建模板失败')
    } finally {
      setCreating(false)
    }
  }

  // 使用模板（计数+复制内容）
  const handleUse = async (record: OnlineTemplateItem) => {
    try {
      await useProfileTemplate(record.id)
      setDetail({ ...record, usage_count: (record.usage_count || 0) + 1 })
      loadData()
    } catch (err) {
      message.error('操作失败')
    }
  }

  // 删除模板
  const handleDelete = (record: OnlineTemplateItem) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定删除模板「${record.name}」吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteProfileTemplate(record.id)
          message.success('删除成功')
          loadData()
        } catch (err) {
          message.error('删除失败')
        }
      },
    })
  }

  const columns = [
    {
      title: '模板名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (v: string, r: OnlineTemplateItem) => (
        <Space>
          <FileTextOutlined style={{ color: theme.primary }} />
          <a onClick={() => handleUse(r)}>{v}</a>
          {r.is_hot ? <Tag color="red">热门</Tag> : null}
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'template_type',
      key: 'template_type',
      width: 120,
      render: (v: string) => {
        const cfg = templateTypeConfig[v] || { label: v || '其他', color: 'default' }
        return <Tag color={cfg.color}>{cfg.label}</Tag>
      },
    },
    { title: '分类', dataIndex: 'category', key: 'category', width: 120, render: (v: string) => v || '-' },
    {
      title: '使用次数',
      dataIndex: 'usage_count',
      key: 'usage_count',
      width: 110,
      align: 'right' as const,
      render: (v: number) => <span style={{ fontWeight: 600 }}>{v || 0}</span>,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (v: string) => v?.slice(0, 10) || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: unknown, r: OnlineTemplateItem) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleUse(r)}>
            查看
          </Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r)}>
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 页面标题 */}
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: theme.textBase, margin: 0 }}>在线模板</h2>
        <p style={{ color: theme.textTertiary, margin: '4px 0 0' }}>
          常用合同与文书模板，可在线查看、复制使用
        </p>
      </div>

      {/* 筛选栏 */}
      <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 16 } }}>
        <Space wrap size={[12, 12]}>
          <Input
            placeholder="模板名称搜索"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={() => setPage(1)}
            style={{ width: 220 }}
            allowClear
          />
          <Select
            placeholder="模板类型"
            value={templateType}
            onChange={(v) => {
              setTemplateType(v)
              setPage(1)
            }}
            style={{ width: 140 }}
            allowClear
            options={Object.entries(templateTypeConfig).map(([value, cfg]) => ({
              value,
              label: cfg.label,
            }))}
          />
          <Button type="primary" icon={<ReloadOutlined />} onClick={() => setPage(1)}>
            查询
          </Button>
          <Button type="primary" ghost icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
            新建模板
          </Button>
        </Space>
      </Card>

      {/* 模板列表 */}
      <Card className="stitch-table" style={{ borderRadius: 16, overflow: 'hidden' }} styles={{ body: { padding: 0 } }}>
        <Table
          dataSource={dataSource}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="middle"
          scroll={{ x: 900 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showTotal: (t) => `共 ${t} 个模板`,
            onChange: (p, ps) => {
              setPage(p)
              setPageSize(ps)
            },
          }}
        />
      </Card>

      {/* 模板详情弹窗 */}
      <Modal
        title={detail?.name || '模板详情'}
        open={!!detail}
        onCancel={() => setDetail(null)}
        footer={[
          <Button key="close" onClick={() => setDetail(null)}>
            关闭
          </Button>,
        ]}
        width={640}
      >
        {detail ? (
          <div>
            <Space style={{ marginBottom: 12 }}>
              <Tag color={(templateTypeConfig[detail.template_type] || {}).color || 'default'}>
                {(templateTypeConfig[detail.template_type] || {}).label || detail.template_type || '其他'}
              </Tag>
              {detail.category ? <Tag>{detail.category}</Tag> : null}
              <span style={{ color: theme.textTertiary, fontSize: 13 }}>
                使用次数：{detail.usage_count || 0}
              </span>
            </Space>
            <div
              style={{
                background: '#fafafa',
                borderRadius: 8,
                padding: 16,
                maxHeight: 420,
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                fontSize: 14,
                lineHeight: 1.8,
              }}
            >
              {detail.content || '暂无内容'}
            </div>
          </div>
        ) : null}
      </Modal>

      {/* 新建模板弹窗 */}
      <Modal
        title="新建在线模板"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={handleCreate}
        okText="创建"
        cancelText="取消"
        confirmLoading={creating}
        width={640}
      >
        <Form form={createForm} layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item label="模板名称" name="name" rules={[{ required: true, message: '请输入模板名称' }]}>
            <Input placeholder="请输入模板名称" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="模板类型" name="template_type">
                <Select
                  placeholder="请选择类型"
                  allowClear
                  options={Object.entries(templateTypeConfig).map(([value, cfg]) => ({
                    value,
                    label: cfg.label,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="分类" name="category">
                <Input placeholder="如：常法服务、诉讼业务" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="模板内容" name="content" rules={[{ required: true, message: '请输入模板内容' }]}>
            <TextArea rows={10} placeholder="请输入模板正文内容" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
