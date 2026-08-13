import { useState, useEffect, useCallback } from 'react'
import { Table, Button, Modal, Form, Input, Select, Space, message, Card, Row, Col, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, EyeOutlined, SearchOutlined, DeleteOutlined, BankOutlined, TeamOutlined, PauseCircleOutlined } from '@ant-design/icons'
import { theme } from '../constants/theme'
import { formatDate } from '../utils/format'
import {
  getCooperativeFirms,
  getCooperativeFirmStats,
  createCooperativeFirm,
  updateCooperativeFirm,
  deleteCooperativeFirm,
} from '../api/cooperative'

// 页面标题样式
const pageH2Style: React.CSSProperties = {
  fontFamily: "'Noto Serif SC', serif",
  fontSize: 22,
  fontWeight: 600,
  color: theme.textBase,
  margin: 0,
  letterSpacing: '0.01em',
}

// 统计卡片样式
const statCardStyle = (gradient: string): React.CSSProperties => ({
  borderRadius: 12,
  padding: 20,
  background: gradient,
  color: theme.white,
  boxShadow: theme.cardShadow,
  position: 'relative',
  overflow: 'hidden',
})

const statValueStyle: React.CSSProperties = {
  fontFamily: "'Noto Serif SC', serif",
  fontSize: 30,
  fontWeight: 600,
  color: theme.white,
  lineHeight: 1.2,
}

const statTitleStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'rgba(255, 255, 255, 0.85)',
  marginBottom: 8,
}

const statIconStyle: React.CSSProperties = {
  position: 'absolute',
  right: 16,
  top: 16,
  fontSize: 48,
  color: 'rgba(255, 255, 255, 0.3)',
}

// 筛选栏样式
const searchBarStyle: React.CSSProperties = {
  background: theme.white,
  padding: 16,
  borderRadius: 12,
  border: `1px solid ${theme.border}`,
  marginBottom: 16,
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap',
  alignItems: 'center',
}

// 表格卡片样式
const tableCardStyle: React.CSSProperties = {
  borderRadius: 16,
  overflow: 'hidden',
}

// 状态标签颜色类型
type PillKind = 'neutral' | 'blue' | 'gold' | 'green' | 'red' | 'orange'

const pillColorMap: Record<PillKind, { bg: string; color: string }> = {
  neutral: { bg: 'rgba(113, 119, 133, 0.12)', color: '#5f6672' },
  blue: { bg: 'rgba(0, 113, 227, 0.1)', color: theme.primary },
  gold: { bg: 'rgba(201, 169, 97, 0.15)', color: '#8c702e' },
  green: { bg: 'rgba(46, 125, 50, 0.1)', color: theme.success },
  red: { bg: 'rgba(186, 26, 26, 0.1)', color: theme.error },
  orange: { bg: 'rgba(237, 108, 2, 0.1)', color: theme.warning },
}

// 状态标签组件
const StatusPill = ({ text, kind }: { text: string; kind: PillKind }) => {
  const c = pillColorMap[kind] || pillColorMap.neutral
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 999,
        background: c.bg,
        color: c.color,
        fontSize: 12,
        fontWeight: 500,
        lineHeight: '20px',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </span>
  )
}

// 律所类型选项
const firmTypeOptions = [
  { value: 'local', label: '本地律所' },
  { value: 'chain', label: '连锁律所' },
  { value: 'boutique', label: '精品律所' },
  { value: 'other', label: '其他' },
]

// 合作状态映射
const statusMap: Record<string, { label: string; kind: PillKind }> = {
  active: { label: '合作中', kind: 'green' },
  paused: { label: '暂停合作', kind: 'gold' },
  ended: { label: '已终止', kind: 'red' },
}

// 评级映射
const ratingMap: Record<string, { label: string; kind: PillKind }> = {
  A: { label: 'A 级', kind: 'blue' },
  B: { label: 'B 级', kind: 'neutral' },
  C: { label: 'C 级', kind: 'orange' },
}

export default function CooperativeFirm() {
  // 数据状态
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // 统计数据
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    paused: 0,
  })

  // 弹窗状态
  const [modalVisible, setModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<Record<string, unknown> | null>(null)
  const [currentRecord, setCurrentRecord] = useState<Record<string, unknown> | null>(null)

  // 搜索条件
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    firm_type: '',
    status: '',
  })

  // 表单实例
  const [createForm] = Form.useForm()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const fetchStats = useCallback(async () => {
    try {
      const res = (await getCooperativeFirmStats()) as Record<string, unknown>
      setStats({
        total: (res?.total as number) || 0,
        active: (res?.active as number) || 0,
        paused: (res?.paused as number) || 0,
      })
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }, [])

  // 获取协作律所列表
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = {}
      if (searchParams.keyword) params.keyword = searchParams.keyword
      if (searchParams.firm_type) params.firm_type = searchParams.firm_type
      if (searchParams.status) params.status = searchParams.status
      params.page = page
      params.page_size = pageSize

      const res = (await getCooperativeFirms(params as never)) as Record<string, unknown>
      setData((res?.data || []) as Record<string, unknown>[])
      setTotal((res?.total as number) || 0)
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, searchParams])

  useEffect(() => {
    fetchData()
    fetchStats()
  }, [fetchData, fetchStats])

  // 搜索
  const handleSearch = () => {
    setPage(1)
    fetchData()
  }

  // 重置
  const handleReset = () => {
    setSearchParams({ keyword: '', firm_type: '', status: '' })
    setPage(1)
    fetchData()
  }

  // 新增协作律所
  const handleAdd = () => {
    setEditingRecord(null)
    createForm.resetFields()
    setModalVisible(true)
  }

  // 编辑协作律所
  const handleEdit = (record: Record<string, unknown>) => {
    setEditingRecord(record)
    createForm.setFieldsValue({
      firm_name: record.firm_name,
      firm_type: record.firm_type,
      cooperation_scope: record.cooperation_scope,
      contact_person: record.contact_person,
      contact_phone: record.contact_phone,
      region: record.region,
      firm_size: record.firm_size,
      rating: record.rating,
      status: record.status,
      description: record.description,
    })
    setModalVisible(true)
  }

  // 查看详情
  const handleViewDetail = (record: Record<string, unknown>) => {
    setCurrentRecord(record)
    setDetailVisible(true)
  }

  // 提交新增/编辑
  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      const payload = {
        ...values,
        organization_id: user.organization_id,
      } as Record<string, unknown>
      if (editingRecord) {
        await updateCooperativeFirm(String(editingRecord.id), payload)
        message.success('协作律所更新成功')
      } else {
        await createCooperativeFirm(payload as never)
        message.success('协作律所创建成功')
      }
      setModalVisible(false)
      createForm.resetFields()
      fetchData()
      fetchStats()
    } catch (error) {
      message.error('保存失败，请重试')
    }
  }

  // 删除协作律所
  const handleDelete = async (id: string) => {
    try {
      await deleteCooperativeFirm(id)
      message.success('删除成功')
      fetchData()
      fetchStats()
    } catch (error) {
      message.error('删除失败')
    }
  }

  // 表格列定义
  const columns = [
    { title: '律所编号', dataIndex: 'firm_no', key: 'firm_no', width: 150 },
    { title: '律所名称', dataIndex: 'firm_name', key: 'firm_name', width: 200 },
    {
      title: '律所类型',
      dataIndex: 'firm_type',
      key: 'firm_type',
      width: 120,
      render: (type: string) => {
        const opt = firmTypeOptions.find((o) => o.value === type)
        return opt ? opt.label : '-'
      },
    },
    {
      title: '合作领域',
      dataIndex: 'cooperation_scope',
      key: 'cooperation_scope',
      width: 200,
      render: (val: string) => val || '-',
    },
    {
      title: '联系人',
      dataIndex: 'contact_person',
      key: 'contact_person',
      width: 120,
      render: (val: string) => val || '-',
    },
    {
      title: '联系电话',
      dataIndex: 'contact_phone',
      key: 'contact_phone',
      width: 140,
      render: (val: string) => val || '-',
    },
    {
      title: '所在地区',
      dataIndex: 'region',
      key: 'region',
      width: 120,
      render: (val: string) => val || '-',
    },
    {
      title: '规模',
      dataIndex: 'firm_size',
      key: 'firm_size',
      width: 100,
      render: (val: string) => val || '-',
    },
    {
      title: '评级',
      dataIndex: 'rating',
      key: 'rating',
      width: 90,
      render: (rating: string) => {
        const r = ratingMap[rating] || ratingMap.B
        return <StatusPill text={r.label} kind={r.kind} />
      },
    },
    {
      title: '合作状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: string) => {
        const s = statusMap[status] || statusMap.active
        return <StatusPill text={s.label} kind={s.kind} />
      },
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 140,
      render: (val: string) => formatDate(val),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_: unknown, record: Record<string, unknown>) => (
        <Space wrap>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除该协作律所吗？" onConfirm={() => handleDelete(String(record.id))}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 页面头部 */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <h2 style={pageH2Style}>协作律所管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增协作律所
        </Button>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ width: '100%' }}>
        <Col xs={24} sm={8} md={8} lg={8} xl={8}>
          <Card bordered={false} style={statCardStyle(theme.gradientStat1)}>
            <div style={statIconStyle}>
              <BankOutlined />
            </div>
            <div style={statTitleStyle}>协作律所总数</div>
            <div style={statValueStyle}>{stats.total}</div>
          </Card>
        </Col>
        <Col xs={24} sm={8} md={8} lg={8} xl={8}>
          <Card bordered={false} style={statCardStyle(theme.gradientStat2)}>
            <div style={statIconStyle}>
              <TeamOutlined />
            </div>
            <div style={statTitleStyle}>合作中</div>
            <div style={statValueStyle}>{stats.active}</div>
          </Card>
        </Col>
        <Col xs={24} sm={8} md={8} lg={8} xl={8}>
          <Card bordered={false} style={statCardStyle(theme.gradientStat4)}>
            <div style={statIconStyle}>
              <PauseCircleOutlined />
            </div>
            <div style={statTitleStyle}>暂停合作</div>
            <div style={statValueStyle}>{stats.paused}</div>
          </Card>
        </Col>
      </Row>

      {/* 筛选栏 */}
      <div className="search-bar stitch-filter-bar" style={searchBarStyle}>
        <Input
          placeholder="关键词搜索（律所名称）"
          prefix={<SearchOutlined />}
          style={{ width: 240 }}
          value={searchParams.keyword}
          onChange={(e) => setSearchParams({ ...searchParams, keyword: e.target.value })}
          allowClear
        />
        <Select
          placeholder="律所类型"
          style={{ width: 150 }}
          allowClear
          value={searchParams.firm_type || undefined}
          onChange={(value) => setSearchParams({ ...searchParams, firm_type: value || '' })}
        >
          {firmTypeOptions.map((opt) => (
            <Select.Option key={opt.value} value={opt.value}>
              {opt.label}
            </Select.Option>
          ))}
        </Select>
        <Select
          placeholder="合作状态"
          style={{ width: 150 }}
          allowClear
          value={searchParams.status || undefined}
          onChange={(value) => setSearchParams({ ...searchParams, status: value || '' })}
        >
          {Object.entries(statusMap).map(([key, val]) => (
            <Select.Option key={key} value={key}>
              {val.label}
            </Select.Option>
          ))}
        </Select>
        <Button type="primary" onClick={handleSearch}>
          搜索
        </Button>
        <Button onClick={handleReset}>重置</Button>
      </div>

      {/* 数据表格 */}
      <Card className="stitch-table" style={tableCardStyle} styles={{ body: { padding: 0 } }}>
        <Table
          dataSource={data}
          columns={columns}
          loading={loading}
          rowKey="id"
          size="small"
          scroll={{ x: 1500 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage)
              setPageSize(nextPageSize)
            },
          }}
        />
      </Card>

      {/* 新增/编辑协作律所弹窗 */}
      <Modal
        title={editingRecord ? '编辑协作律所' : '新增协作律所'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={680}
        destroyOnClose
      >
        <Form form={createForm} onFinish={handleSubmit} layout="vertical" initialValues={{ firm_type: 'local', rating: 'B', status: 'active' }}>
          <Form.Item name="firm_name" label="律所名称" rules={[{ required: true, message: '请输入律所名称' }]}>
            <Input placeholder="请输入律所名称" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="firm_type" label="律所类型">
                <Select placeholder="请选择律所类型">
                  {firmTypeOptions.map((opt) => (
                    <Select.Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="region" label="所在地区">
                <Input placeholder="如：北京市朝阳区" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="cooperation_scope" label="合作领域">
            <Input placeholder="多个领域用逗号分隔，如：民商事诉讼,企业顾问" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="contact_person" label="联系人">
                <Input placeholder="请输入联系人" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="contact_phone" label="联系电话">
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="firm_size" label="律所规模">
                <Select placeholder="请选择律所规模" allowClear>
                  <Select.Option value="small">小型（20人以下）</Select.Option>
                  <Select.Option value="medium">中型（20-100人）</Select.Option>
                  <Select.Option value="large">大型（100人以上）</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="rating" label="合作评级">
                <Select placeholder="请选择合作评级">
                  <Select.Option value="A">A 级</Select.Option>
                  <Select.Option value="B">B 级</Select.Option>
                  <Select.Option value="C">C 级</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="status" label="合作状态">
            <Select placeholder="请选择合作状态">
              {Object.entries(statusMap).map(([key, val]) => (
                <Select.Option key={key} value={key}>
                  {val.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="description" label="备注">
            <Input.TextArea placeholder="请输入合作备注信息" rows={3} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                提交
              </Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        title="协作律所详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={680}
        destroyOnClose
      >
        {currentRecord && (
          <div>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">律所编号</span>
                <span className="detail-value">{String(currentRecord.firm_no || '')}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">律所名称</span>
                <span className="detail-value">{String(currentRecord.firm_name || '')}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">律所类型</span>
                <span className="detail-value">
                  {(() => {
                    const opt = firmTypeOptions.find((o) => o.value === currentRecord.firm_type)
                    return opt ? opt.label : '-'
                  })()}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">所在地区</span>
                <span className="detail-value">{String(currentRecord.region || '-')}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">合作领域</span>
                <span className="detail-value">{String(currentRecord.cooperation_scope || '-')}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">律所规模</span>
                <span className="detail-value">{String(currentRecord.firm_size || '-')}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">联系人</span>
                <span className="detail-value">{String(currentRecord.contact_person || '-')}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">联系电话</span>
                <span className="detail-value">{String(currentRecord.contact_phone || '-')}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">评级</span>
                <span className="detail-value">
                  {(() => {
                    const r = ratingMap[currentRecord.rating as string] || ratingMap.B
                    return <StatusPill text={r.label} kind={r.kind} />
                  })()}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">合作状态</span>
                <span className="detail-value">
                  {(() => {
                    const s = statusMap[currentRecord.status as string] || statusMap.active
                    return <StatusPill text={s.label} kind={s.kind} />
                  })()}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">创建时间</span>
                <span className="detail-value">{formatDate(currentRecord.created_at as string)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">更新时间</span>
                <span className="detail-value">{formatDate(currentRecord.updated_at as string)}</span>
              </div>
            </div>
            {currentRecord.description ? (
              <div style={{ marginTop: 16 }}>
                <div
                  style={{
                    fontFamily: "'Noto Serif SC', serif",
                    fontSize: 15,
                    fontWeight: 600,
                    color: theme.textBase,
                    marginBottom: 8,
                  }}
                >
                  备注
                </div>
                <div
                  style={{
                    background: theme.bgSurfaceLow,
                    padding: 16,
                    borderRadius: 8,
                    fontSize: 13,
                    color: theme.textSecondary,
                    lineHeight: 1.7,
                  }}
                >
                  {String(currentRecord.description)}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </Modal>
    </div>
  )
}
