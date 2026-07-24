import { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Tag,
  message,
  Empty,
  Tooltip,
  Popconfirm,
  InputNumber,
  Tabs,
  Drawer,
  Alert,
  Spin,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  TrophyOutlined,
  TagOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  StopOutlined,
  BulbOutlined,
} from '@ant-design/icons'
import {
  getAdMaterials,
  createAdMaterial,
  updateAdMaterial,
  deleteAdMaterial,
  updateAdMaterialEffect,
  addAdMaterialTag,
  removeAdMaterialTag,
  getAllTags,
  getMaterialRanking,
  precheckCompliance,
  materialTypeOptions,
  materialStatusOptions,
  materialTypeLabels,
  materialStatusLabels,
  channelLabels,
  rankMetricOptions,
  complianceStatusLabels,
  complianceStatusColors,
  caseTypeLabels,
  type AdMaterial,
  type AdMaterialWithPerformance,
  type AdMaterialType,
  type AdMaterialStatus,
  type MaterialRankMetric,
  type MaterialComplianceStatus,
  type CompliancePrecheckResult,
} from '../api/marketing'
import { formatDateTime } from '../utils/format'

export default function MaterialManagement() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [activeTab, setActiveTab] = useState('list')

  // 素材列表
  const [materials, setMaterials] = useState<AdMaterial[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<AdMaterial | null>(null)
  const [form] = Form.useForm()

  // 标签管理
  const [allTags, setAllTags] = useState<string[]>([])
  const [tagDrawerVisible, setTagDrawerVisible] = useState(false)
  const [tagMaterial, setTagMaterial] = useState<AdMaterial | null>(null)
  const [newTagInput, setNewTagInput] = useState('')

  // 效果更新
  const [effectVisible, setEffectVisible] = useState(false)
  const [effectMaterial, setEffectMaterial] = useState<AdMaterial | null>(null)
  const [effectForm] = Form.useForm()

  // Task 1.6.4：合规预审
  const [complianceVisible, setComplianceVisible] = useState(false)
  const [complianceMaterial, setComplianceMaterial] = useState<AdMaterial | null>(null)
  const [complianceContent, setComplianceContent] = useState('')
  const [complianceResult, setComplianceResult] = useState<CompliancePrecheckResult | null>(null)
  const [complianceLoading, setComplianceLoading] = useState(false)

  // 排行榜
  const [ranking, setRanking] = useState<AdMaterialWithPerformance[]>([])
  const [rankingLoading, setRankingLoading] = useState(false)
  const [rankMetric, setRankMetric] = useState<MaterialRankMetric>('roi')

  // 筛选
  const [filters, setFilters] = useState<{
    type?: AdMaterialType
    tag?: string
    status?: AdMaterialStatus
    channel?: string
  }>({})

  useEffect(() => {
    fetchMaterials()
    fetchAllTags()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (activeTab === 'ranking') {
      fetchRanking()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, rankMetric, filters])

  const fetchMaterials = async () => {
    setLoading(true)
    try {
      const params: any = { org_id: user.organization_id }
      if (filters.type) params.type = filters.type
      if (filters.tag) params.tag = filters.tag
      if (filters.status) params.status = filters.status
      if (filters.channel) params.channel = filters.channel
      const res = await getAdMaterials(params)
      setMaterials(res || [])
    } catch (err) {
      console.error('Fetch materials error:', err)
      message.error('素材列表加载失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchAllTags = async () => {
    try {
      const res = await getAllTags(user.organization_id)
      setAllTags(res || [])
    } catch (err) {
      console.error('Fetch tags error:', err)
    }
  }

  const fetchRanking = async () => {
    setRankingLoading(true)
    try {
      const params: any = {
        org_id: user.organization_id,
        metric: rankMetric,
        limit: 20,
      }
      if (filters.type) params.type = filters.type
      if (filters.tag) params.tag = filters.tag
      if (filters.status) params.status = filters.status
      if (filters.channel) params.channel = filters.channel
      const res = await getMaterialRanking(params)
      setRanking(res || [])
    } catch (err) {
      console.error('Fetch ranking error:', err)
      message.error('排行榜加载失败')
    } finally {
      setRankingLoading(false)
    }
  }

  const handleSearch = () => {
    fetchMaterials()
    if (activeTab === 'ranking') fetchRanking()
  }

  const handleReset = () => {
    setFilters({})
    setTimeout(() => {
      fetchMaterials()
      if (activeTab === 'ranking') fetchRanking()
    }, 0)
  }

  const handleAdd = () => {
    setEditingMaterial(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: AdMaterial) => {
    setEditingMaterial(record)
    form.setFieldsValue({
      name: record.name,
      type: record.type,
      tags: record.tags,
      file_path: record.file_path,
      channel: record.channel,
      account_id: record.account_id,
      plan_id: record.plan_id,
      status: record.status,
    })
    setModalVisible(true)
  }

  const handleSubmit = async (values: any) => {
    try {
      const payload = {
        ...values,
        tags: values.tags || [],
        organization_id: user.organization_id,
        uploaded_by_id: user.id,
      }
      if (editingMaterial) {
        await updateAdMaterial(editingMaterial.id, payload)
        message.success('素材更新成功')
      } else {
        await createAdMaterial(payload)
        message.success('素材创建成功')
      }
      setModalVisible(false)
      fetchMaterials()
      fetchAllTags()
    } catch (err) {
      console.error('Submit material error:', err)
      message.error(editingMaterial ? '更新失败' : '创建失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteAdMaterial(id)
      message.success('素材已删除')
      fetchMaterials()
      fetchAllTags()
    } catch (err) {
      message.error('删除失败')
    }
  }

  const handleManageTags = (record: AdMaterial) => {
    setTagMaterial(record)
    setNewTagInput('')
    setTagDrawerVisible(true)
  }

  const handleAddTag = async () => {
    if (!tagMaterial || !newTagInput.trim()) return
    try {
      const updated = await addAdMaterialTag(tagMaterial.id, newTagInput.trim())
      setTagMaterial(updated)
      setNewTagInput('')
      message.success('标签已添加')
      fetchMaterials()
      fetchAllTags()
    } catch (err) {
      message.error('添加标签失败')
    }
  }

  const handleRemoveTag = async (tag: string) => {
    if (!tagMaterial) return
    try {
      const updated = await removeAdMaterialTag(tagMaterial.id, tag)
      setTagMaterial(updated)
      message.success('标签已删除')
      fetchMaterials()
      fetchAllTags()
    } catch (err) {
      message.error('删除标签失败')
    }
  }

  const handleEffect = (record: AdMaterial) => {
    setEffectMaterial(record)
    effectForm.resetFields()
    setEffectVisible(true)
  }

  const handleEffectSubmit = async (values: any) => {
    if (!effectMaterial) return
    try {
      const payload: any = {}
      if (values.impressions !== undefined && values.impressions !== null)
        payload.impressions = Number(values.impressions)
      if (values.clicks !== undefined && values.clicks !== null)
        payload.clicks = Number(values.clicks)
      if (values.conversions !== undefined && values.conversions !== null)
        payload.conversions = Number(values.conversions)
      if (values.cost !== undefined && values.cost !== null)
        payload.cost = Number(values.cost)
      await updateAdMaterialEffect(effectMaterial.id, payload)
      message.success('效果数据已更新（增量累加）')
      setEffectVisible(false)
      fetchMaterials()
    } catch (err) {
      message.error('效果更新失败')
    }
  }

  // ============ Task 1.6.4：合规预审 ============

  const handleCompliance = (record: AdMaterial) => {
    setComplianceMaterial(record)
    setComplianceContent(record.content_text || record.name || '')
    setComplianceResult(null)
    setComplianceVisible(true)
  }

  const handleRunPrecheck = async () => {
    if (!complianceContent || !complianceContent.trim()) {
      message.warning('请输入待审核内容')
      return
    }
    if (!complianceMaterial) return
    setComplianceLoading(true)
    try {
      const res = await precheckCompliance({
        content: complianceContent,
        material_id: complianceMaterial.id,
      })
      setComplianceResult(res)
      if (res.status === 'passed') {
        message.success('合规预审通过')
      } else if (res.status === 'need_modification') {
        message.warning('检测到轻微违规，需修改后发布')
      } else if (res.status === 'forbidden') {
        message.error('检测到严重违规，禁止发布')
      }
      // 同步更新本地素材状态
      setComplianceMaterial({
        ...complianceMaterial,
        compliance_status: res.status,
      })
      fetchMaterials()
    } catch (err: any) {
      console.error('Precheck error:', err)
      message.error(err?.response?.data?.message || '合规预审失败')
    } finally {
      setComplianceLoading(false)
    }
  }

  // 通用列（用于列表和排行）
  const baseColumns = [
    {
      title: '素材名称',
      dataIndex: 'name',
      key: 'name',
      render: (v: string, record: AdMaterial) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1d1d1f' }}>{v}</div>
          <div style={{ fontSize: 12, color: '#86868b', marginTop: 2 }}>
            {materialTypeLabels[record.type]} · {channelLabels[record.channel as keyof typeof channelLabels] || record.channel || '未指定渠道'}
          </div>
        </div>
      ),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) =>
        tags && tags.length > 0 ? (
          <Space size={[4, 4]} wrap>
            {tags.map((t) => (
              <Tag key={t} style={{ borderRadius: 10, padding: '0 8px', fontSize: 11, background: '#f5f5f7', border: 'none', color: '#6e6e73' }}>
                {t}
              </Tag>
            ))}
          </Space>
        ) : (
          <span style={{ color: '#86868b', fontSize: 12 }}>-</span>
        ),
    },
    {
      title: '曝光',
      dataIndex: 'impressions',
      key: 'impressions',
      sorter: (a: AdMaterial, b: AdMaterial) => a.impressions - b.impressions,
      render: (v: number) => <span style={{ color: '#6e6e73' }}>{v?.toLocaleString() || 0}</span>,
    },
    {
      title: '点击',
      dataIndex: 'clicks',
      key: 'clicks',
      sorter: (a: AdMaterial, b: AdMaterial) => a.clicks - b.clicks,
      render: (v: number) => <span style={{ color: '#6e6e73' }}>{v?.toLocaleString() || 0}</span>,
    },
    {
      title: '转化',
      dataIndex: 'conversions',
      key: 'conversions',
      sorter: (a: AdMaterial, b: AdMaterial) => a.conversions - b.conversions,
      render: (v: number) => <span style={{ color: '#0071e3', fontWeight: 600 }}>{v || 0}</span>,
    },
    {
      title: '消耗',
      dataIndex: 'cost',
      key: 'cost',
      sorter: (a: AdMaterial, b: AdMaterial) => Number(a.cost) - Number(b.cost),
      render: (v: number) => (
        <span style={{ color: '#6e6e73' }}>{Number(v) > 0 ? `¥${Number(v).toFixed(2)}` : '-'}</span>
      ),
    },
    {
      title: 'ROI',
      dataIndex: 'roi',
      key: 'roi',
      sorter: (a: AdMaterial, b: AdMaterial) => Number(a.roi) - Number(b.roi),
      render: (v: number) => {
        const roi = Number(v) || 0
        const color = roi >= 200 ? '#34c759' : roi >= 100 ? '#ff9500' : roi > 0 ? '#ff3b30' : '#86868b'
        return (
          <Tag style={{ background: `${color}15`, color, borderRadius: 12, padding: '2px 12px', fontWeight: 600 }}>
            {roi > 0 ? `${roi.toFixed(1)}%` : '-'}
          </Tag>
        )
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: AdMaterialStatus) => {
        const colorMap: Record<AdMaterialStatus, string> = {
          draft: '#86868b',
          active: '#34c759',
          paused: '#ff9500',
          archived: '#6e6e73',
        }
        const color = colorMap[v] || '#86868b'
        return (
          <Tag style={{ background: `${color}15`, color, borderRadius: 12, padding: '2px 10px', fontSize: 11 }}>
            {materialStatusLabels[v] || v}
          </Tag>
        )
      },
    },
    {
      title: '合规',
      dataIndex: 'compliance_status',
      key: 'compliance_status',
      render: (v?: MaterialComplianceStatus) => {
        if (!v) v = 'pending'
        const color = complianceStatusColors[v]
        const label = complianceStatusLabels[v]
        let icon = <CheckCircleOutlined />
        if (v === 'need_modification') icon = <WarningOutlined />
        else if (v === 'forbidden') icon = <StopOutlined />
        else if (v === 'pending') icon = <SafetyCertificateOutlined />
        return (
          <Tooltip title={label}>
            <Tag
              icon={icon}
              style={{ background: `${color}15`, color, borderRadius: 12, padding: '2px 10px', fontSize: 11, border: `1px solid ${color}30` }}
            >
              {label}
            </Tag>
          </Tooltip>
        )
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v: string) => <span style={{ color: '#86868b', fontSize: 12 }}>{formatDateTime(v)}</span>,
    },
  ]

  // 列表操作列
  const listColumns = [
    ...baseColumns,
    {
      title: '操作',
      key: 'action',
      width: 340,
      render: (_: any, record: AdMaterial) => (
        <Space size={4}>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} style={{ borderRadius: 8 }}>
            编辑
          </Button>
          <Button size="small" icon={<TagOutlined />} onClick={() => handleManageTags(record)} style={{ borderRadius: 8 }}>
            标签
          </Button>
          <Button size="small" onClick={() => handleEffect(record)} style={{ borderRadius: 8 }}>
            效果
          </Button>
          <Button
            size="small"
            icon={<SafetyCertificateOutlined />}
            onClick={() => handleCompliance(record)}
            style={{
              borderRadius: 8,
              background: record.compliance_status === 'passed' ? '#34c75915' : '#0071e310',
              border: 'none',
              color: record.compliance_status === 'passed' ? '#34c759' : '#0071e3',
            }}
          >
            预审
          </Button>
          <Popconfirm
            title="确认删除该素材？"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
          >
            <Button size="small" danger icon={<DeleteOutlined />} style={{ borderRadius: 8 }} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // 排行榜列（首列为排名 + 性能标记）
  const rankingColumns = [
    {
      title: '排名',
      key: 'rank',
      width: 70,
      render: (_: any, __: any, index: number) => {
        const medalColors = ['#ffd700', '#c0c0c0', '#cd7f32']
        const color = index < 3 ? medalColors[index] : '#86868b'
        return (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: `${color}20`,
              color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {index + 1}
          </div>
        )
      },
    },
    {
      title: '效能',
      key: 'performance',
      width: 80,
      render: (_: any, record: AdMaterialWithPerformance) => {
        if (record.performance === 'high') {
          return (
            <Tooltip title={`高转化素材 (ROI ${Number(record.roi).toFixed(1)}% ≥ 200%)`}>
              <Tag style={{ background: '#34c75915', color: '#34c759', borderRadius: 12, padding: '2px 10px', fontWeight: 600, border: `1px solid #34c75940` }}>
                高转化
              </Tag>
            </Tooltip>
          )
        }
        if (record.performance === 'low') {
          return (
            <Tooltip title={`低效素材 (ROI ${Number(record.roi).toFixed(1)}% < 100%)`}>
              <Tag style={{ background: '#ff3b3015', color: '#ff3b30', borderRadius: 12, padding: '2px 10px', fontWeight: 600, border: `1px solid #ff3b3040` }}>
                低效
              </Tag>
            </Tooltip>
          )
        }
        return <span style={{ color: '#86868b', fontSize: 12 }}>正常</span>
      },
    },
    ...baseColumns,
  ]

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1d1d1f', margin: 0 }}>投放素材效能管理</h2>
          <p style={{ fontSize: 14, color: '#86868b', marginTop: 4 }}>管理投放素材、标签与效果数据，自动识别高转化/低效素材</p>
        </div>
        <Button
          icon={<PlusOutlined />}
          onClick={handleAdd}
          style={{
            borderRadius: 10,
            padding: '8px 20px',
            background: '#0071e3',
            border: 'none',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(0, 113, 227, 0.25)',
          }}
        >
          添加素材
        </Button>
      </div>

      <Card
        style={{
          borderRadius: 16,
          marginBottom: 24,
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
          border: 'none',
        }}
        styles={{ body: { padding: 20 } }}
      >
        <Space wrap size={[12, 12]}>
          <Select
            placeholder="素材类型"
            allowClear
            style={{ width: 140 }}
            value={filters.type}
            onChange={(v) => setFilters({ ...filters, type: v })}
            options={materialTypeOptions}
          />
          <Select
            placeholder="按标签筛选"
            allowClear
            style={{ width: 160 }}
            value={filters.tag}
            onChange={(v) => setFilters({ ...filters, tag: v })}
            options={allTags.map((t) => ({ value: t, label: t }))}
            showSearch
          />
          <Select
            placeholder="状态"
            allowClear
            style={{ width: 140 }}
            value={filters.status}
            onChange={(v) => setFilters({ ...filters, status: v })}
            options={materialStatusOptions}
          />
          <Select
            placeholder="渠道"
            allowClear
            style={{ width: 140 }}
            value={filters.channel}
            onChange={(v) => setFilters({ ...filters, channel: v })}
            options={[
              { value: 'douyin', label: '抖音' },
              { value: 'baidu', label: '百度' },
              { value: 'kuaishou', label: '快手' },
              { value: 'wechat', label: '微信' },
              { value: 'other', label: '其他' },
            ]}
          />
          <Button
            icon={<SearchOutlined />}
            onClick={handleSearch}
            style={{ borderRadius: 10, background: '#0071e3', border: 'none', color: '#fff' }}
          >
            搜索
          </Button>
          <Button onClick={handleReset} style={{ borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
            重置
          </Button>
        </Space>
      </Card>

      <Card
        style={{
          borderRadius: 16,
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
          border: 'none',
        }}
        styles={{ body: { padding: 0 } }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ padding: '0 20px' }}
          items={[
            {
              key: 'list',
              label: '素材列表',
              children: (
                <Table
                  dataSource={materials}
                  columns={listColumns}
                  loading={loading}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 1200 }}
                  locale={{ emptyText: <Empty description="暂无素材，请点击右上角添加" /> }}
                />
              ),
            },
            {
              key: 'ranking',
              label: (
                <span>
                  <TrophyOutlined style={{ marginRight: 6 }} />
                  效果排行榜
                </span>
              ),
              children: (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '4px 0' }}>
                    <Space>
                      <span style={{ fontSize: 13, color: '#6e6e73' }}>排序指标：</span>
                      <Select
                        value={rankMetric}
                        onChange={(v) => setRankMetric(v)}
                        style={{ width: 140 }}
                        options={rankMetricOptions}
                      />
                    </Space>
                    <Space>
                      <Tag style={{ background: '#34c75915', color: '#34c759', borderRadius: 12, padding: '2px 10px' }}>高转化 ROI≥200%</Tag>
                      <Tag style={{ background: '#ff3b3015', color: '#ff3b30', borderRadius: 12, padding: '2px 10px' }}>{'低效 ROI<100%'}</Tag>
                    </Space>
                  </div>
                  <Table
                    dataSource={ranking}
                    columns={rankingColumns}
                    loading={rankingLoading}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 1300 }}
                    locale={{ emptyText: <Empty description="暂无排行数据" /> }}
                  />
                </>
              ),
            },
          ]}
        />
      </Card>

      {/* 素材创建/编辑 Modal */}
      <Modal
        title={editingMaterial ? '编辑素材' : '添加素材'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={640}
      >
        <div style={{ padding: '8px 0' }}>
          <Form onFinish={handleSubmit} layout="vertical" form={form}>
            <Form.Item name="name" label="素材名称" rules={[{ required: true, message: '请输入素材名称' }]}>
              <Input placeholder="请输入素材名称" style={{ borderRadius: 10 }} />
            </Form.Item>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Form.Item name="type" label="素材类型" rules={[{ required: true, message: '请选择类型' }]}>
                <Select style={{ borderRadius: 10 }} options={materialTypeOptions} />
              </Form.Item>
              <Form.Item name="status" label="状态">
                <Select style={{ borderRadius: 10 }} options={materialStatusOptions} allowClear />
              </Form.Item>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Form.Item name="channel" label="投放渠道">
                <Select
                  style={{ borderRadius: 10 }}
                  allowClear
                  options={[
                    { value: 'douyin', label: '抖音' },
                    { value: 'baidu', label: '百度' },
                    { value: 'kuaishou', label: '快手' },
                    { value: 'wechat', label: '微信' },
                    { value: 'other', label: '其他' },
                  ]}
                />
              </Form.Item>
              <Form.Item name="account_id" label="账户 ID">
                <Input placeholder="可选，关联投放账户" style={{ borderRadius: 10 }} />
              </Form.Item>
            </div>
            <Form.Item name="plan_id" label="计划 ID">
              <Input placeholder="可选，关联投放计划" style={{ borderRadius: 10 }} />
            </Form.Item>
            <Form.Item name="file_path" label="素材文件路径 / URL">
              <Input placeholder="例如 /uploads/materials/xxx.jpg" style={{ borderRadius: 10 }} />
            </Form.Item>
            <Form.Item name="tags" label="标签">
              <Select
                mode="tags"
                placeholder="输入后回车添加标签"
                style={{ borderRadius: 10 }}
                tokenSeparators={[',']}
              />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                style={{ borderRadius: 10, padding: '10px 32px', background: '#0071e3', border: 'none', color: '#fff' }}
              >
                {editingMaterial ? '保存' : '创建'}
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Modal>

      {/* 标签管理 Drawer */}
      <Drawer
        title="标签管理"
        open={tagDrawerVisible}
        onClose={() => setTagDrawerVisible(false)}
        width={460}
      >
        {tagMaterial && (
          <div>
            <div style={{ padding: 16, background: '#f5f5f7', borderRadius: 10, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#86868b', marginBottom: 4 }}>素材名称</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f' }}>{tagMaterial.name}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1d1d1f', marginBottom: 10 }}>当前标签</div>
              {tagMaterial.tags && tagMaterial.tags.length > 0 ? (
                <Space size={[8, 8]} wrap>
                  {tagMaterial.tags.map((t) => (
                    <Tag
                      key={t}
                      closable
                      onClose={() => handleRemoveTag(t)}
                      style={{ borderRadius: 10, padding: '4px 10px', background: '#0071e310', color: '#0071e3', border: 'none' }}
                    >
                      {t}
                    </Tag>
                  ))}
                </Space>
              ) : (
                <div style={{ color: '#86868b', fontSize: 13 }}>暂无标签</div>
              )}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1d1d1f', marginBottom: 10 }}>添加新标签</div>
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  placeholder="输入标签后回车或点击添加"
                  onPressEnter={handleAddTag}
                  style={{ borderRadius: '10px 0 0 10px' }}
                />
                <Button
                  type="primary"
                  onClick={handleAddTag}
                  style={{ borderRadius: '0 10px 10px 0', background: '#0071e3', border: 'none' }}
                >
                  添加
                </Button>
              </Space.Compact>
              {allTags.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 12, color: '#86868b', marginBottom: 8 }}>组织内已有标签（点击快速添加）</div>
                  <Space size={[6, 6]} wrap>
                    {allTags
                      .filter((t) => !tagMaterial.tags?.includes(t))
                      .map((t) => (
                        <Tag
                          key={t}
                          style={{ cursor: 'pointer', borderRadius: 10, padding: '2px 10px', background: '#f5f5f7', border: '1px solid rgba(0,0,0,0.06)', color: '#6e6e73' }}
                          onClick={async () => {
                            try {
                              const updated = await addAdMaterialTag(tagMaterial.id, t)
                              setTagMaterial(updated)
                              message.success('标签已添加')
                              fetchMaterials()
                              fetchAllTags()
                            } catch {
                              message.error('添加失败')
                            }
                          }}
                        >
                          + {t}
                        </Tag>
                      ))}
                  </Space>
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* 效果数据更新 Modal */}
      <Modal
        title="更新效果数据（增量累加）"
        open={effectVisible}
        onCancel={() => setEffectVisible(false)}
        footer={null}
        width={520}
      >
        {effectMaterial && (
          <div style={{ padding: '8px 0' }}>
            <div style={{ padding: 12, background: '#f5f5f7', borderRadius: 10, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#86868b' }}>素材：{effectMaterial.name}</div>
              <div style={{ fontSize: 12, color: '#86868b', marginTop: 4 }}>
                当前：曝光 {effectMaterial.impressions?.toLocaleString() || 0} · 点击 {effectMaterial.clicks?.toLocaleString() || 0} · 转化 {effectMaterial.conversions || 0} · 消耗 ¥{Number(effectMaterial.cost || 0).toFixed(2)}
              </div>
            </div>
            <Form onFinish={handleEffectSubmit} layout="vertical" form={effectForm}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Form.Item name="impressions" label="新增曝光">
                  <InputNumber placeholder="0" min={0} style={{ width: '100%', borderRadius: 10 }} />
                </Form.Item>
                <Form.Item name="clicks" label="新增点击">
                  <InputNumber placeholder="0" min={0} style={{ width: '100%', borderRadius: 10 }} />
                </Form.Item>
                <Form.Item name="conversions" label="新增转化">
                  <InputNumber placeholder="0" min={0} style={{ width: '100%', borderRadius: 10 }} />
                </Form.Item>
                <Form.Item name="cost" label="新增消耗 (¥)">
                  <InputNumber placeholder="0.00" min={0} step={0.01} style={{ width: '100%', borderRadius: 10 }} />
                </Form.Item>
              </div>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  style={{ borderRadius: 10, padding: '10px 32px', background: '#0071e3', border: 'none', color: '#fff' }}
                >
                  确认更新
                </Button>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      {/* Task 1.6.4：合规预审 Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SafetyCertificateOutlined style={{ color: '#0071e3' }} />
            <span>营销内容合规预审</span>
          </div>
        }
        open={complianceVisible}
        onCancel={() => setComplianceVisible(false)}
        footer={null}
        width={780}
      >
        {complianceMaterial && (
          <div style={{ padding: '8px 0' }}>
            {/* 素材信息 */}
            <div style={{ padding: 12, background: '#f5f5f7', borderRadius: 10, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, color: '#86868b' }}>素材名称</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#1d1d1f', marginTop: 2 }}>
                    {complianceMaterial.name}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: '#86868b' }}>当前状态</div>
                  <div style={{ marginTop: 2 }}>
                    {(() => {
                      const status = complianceMaterial.compliance_status || 'pending'
                      const color = complianceStatusColors[status]
                      const label = complianceStatusLabels[status]
                      return (
                        <Tag style={{ background: `${color}15`, color, borderRadius: 10, padding: '2px 10px', border: `1px solid ${color}30` }}>
                          {label}
                        </Tag>
                      )
                    })()}
                  </div>
                </div>
              </div>
              {complianceMaterial.case_type && (
                <div style={{ fontSize: 12, color: '#86868b', marginTop: 8 }}>
                  案由：{caseTypeLabels[complianceMaterial.case_type] || complianceMaterial.case_type}
                </div>
              )}
            </div>

            {/* 内容编辑 */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1d1d1f' }}>
                  待审核内容
                </span>
                <Button
                  size="small"
                  type="primary"
                  icon={<SafetyCertificateOutlined />}
                  onClick={handleRunPrecheck}
                  loading={complianceLoading}
                  style={{
                    borderRadius: 8,
                    background: '#34c759',
                    border: 'none',
                    color: '#fff',
                  }}
                >
                  开始预审
                </Button>
              </div>
              <Input.TextArea
                value={complianceContent}
                onChange={(e) => {
                  setComplianceContent(e.target.value)
                  // 内容变更后清除上次的预审结果
                  if (complianceResult) setComplianceResult(null)
                }}
                autoSize={{ minRows: 6, maxRows: 16 }}
                style={{
                  borderRadius: 10,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", sans-serif',
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
                placeholder="请输入或粘贴待审核的营销内容"
              />
            </div>

            {/* 预审结果 */}
            {complianceLoading && (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <Spin tip="正在检测违规内容..." />
              </div>
            )}

            {complianceResult && !complianceLoading && (
              <div>
                {/* 状态汇总 */}
                <Alert
                  type={
                    complianceResult.status === 'passed'
                      ? 'success'
                      : complianceResult.status === 'forbidden'
                        ? 'error'
                        : complianceResult.status === 'need_modification'
                          ? 'warning'
                          : 'info'
                  }
                  showIcon
                  style={{ marginBottom: 12, borderRadius: 10 }}
                  message={complianceResult.summary}
                />

                {/* 违规明细 */}
                {complianceResult.violations.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1d1d1f', marginBottom: 8 }}>
                      违规明细（{complianceResult.violations.length} 项）
                    </div>
                    <Space direction="vertical" size={6} style={{ width: '100%' }}>
                      {complianceResult.violations.map((v, idx) => {
                        const sevColor = v.severity === 'serious' ? '#ff3b30' : '#ff9500'
                        return (
                          <div
                            key={`${v.type}-${v.keyword}-${idx}`}
                            style={{
                              padding: 10,
                              background: '#f5f5f7',
                              borderRadius: 8,
                              borderLeft: `3px solid ${sevColor}`,
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <Space size={6}>
                                <Tag style={{ background: `${sevColor}15`, color: sevColor, borderRadius: 8, border: 'none', fontWeight: 600 }}>
                                  {v.label}
                                </Tag>
                                <span style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 13 }}>
                                  "{v.keyword}"
                                </span>
                              </Space>
                              <Tag style={{ background: `${sevColor}15`, color: sevColor, borderRadius: 8, border: 'none', fontSize: 11 }}>
                                {v.severity === 'serious' ? '严重' : '轻微'}
                              </Tag>
                            </div>
                            <div style={{ fontSize: 12, color: '#6e6e73' }}>{v.suggestion}</div>
                            <div style={{ fontSize: 11, color: '#86868b', marginTop: 2 }}>
                              出现位置：{v.positions.length} 处
                            </div>
                          </div>
                        )
                      })}
                    </Space>
                  </div>
                )}

                {/* 修改建议 */}
                {complianceResult.suggestions.length > 0 && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1d1d1f', marginBottom: 8 }}>
                      <BulbOutlined style={{ marginRight: 6, color: '#ff9500' }} />
                      修改建议
                    </div>
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      {complianceResult.suggestions.map((s, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '6px 10px',
                            background: '#fffbe6',
                            borderRadius: 6,
                            fontSize: 12,
                            color: '#6e6e73',
                            border: '1px solid #fff1b8',
                          }}
                        >
                          {s}
                        </div>
                      ))}
                    </Space>
                  </div>
                )}

                {/* 禁止发布提示 */}
                {complianceResult.status === 'forbidden' && (
                  <Alert
                    type="error"
                    showIcon
                    style={{ marginTop: 12, borderRadius: 10 }}
                    message="该内容存在严重违规，禁止绑定投放计划"
                    description="请根据修改建议删除违规表述后重新预审。"
                  />
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
