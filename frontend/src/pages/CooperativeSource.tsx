import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, Space, message, Card, Row, Col, Tag, DatePicker } from 'antd'
import { PlusOutlined, EditOutlined, EyeOutlined, SearchOutlined, FileTextOutlined, LoadingOutlined, CheckCircleOutlined } from '@ant-design/icons'
import axios from '../api/axios'
import { theme } from '../constants/theme'
import { formatDate } from '../utils/format'

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

// 协作状态映射
const cooperationStatusMap: Record<string, { label: string; kind: PillKind }> = {
  pending: { label: '待处理', kind: 'neutral' },
  processing: { label: '进行中', kind: 'blue' },
  converted: { label: '已转化', kind: 'green' },
  closed: { label: '已结案', kind: 'gold' },
}

// 协作类型选项
const cooperationTypeOptions = [
  { value: 'referral', label: '案源推荐' },
  { value: 'cooperation', label: '协作办案' },
  { value: 'consultation', label: '咨询合作' },
  { value: 'agent', label: '代理合作' },
]

// 案件类型选项
const caseTypeOptions = [
  { value: 'civil', label: '民事案件' },
  { value: 'criminal', label: '刑事案件' },
  { value: 'administrative', label: '行政案件' },
  { value: 'labor', label: '劳动争议' },
  { value: 'marriage', label: '婚姻家事' },
  { value: 'company', label: '公司商事' },
  { value: 'real_estate', label: '房产纠纷' },
  { value: 'other', label: '其他' },
]

export default function CooperativeSource() {
  // 数据状态
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(false)

  // 统计数据
  const [stats, setStats] = useState({
    total: 0,
    processing: 0,
    converted: 0,
  })

  // 弹窗状态
  const [modalVisible, setModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [statusVisible, setStatusVisible] = useState(false)
  const [closeVisible, setCloseVisible] = useState(false)

  // 当前选中记录
  const [currentRecord, setCurrentRecord] = useState<Record<string, unknown> | null>(null)

  // 搜索条件
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    cooperation_type: '',
    status: '',
  })

  // 表单实例
  const [createForm] = Form.useForm()
  const [statusForm] = Form.useForm()
  const [closeForm] = Form.useForm()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchData()
    fetchStats()
  }, [])

  // 获取协作案源列表
  const fetchData = async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { org_id: user.organization_id }
      if (searchParams.keyword) params.keyword = searchParams.keyword
      if (searchParams.cooperation_type) params.cooperation_type = searchParams.cooperation_type
      if (searchParams.status) params.status = searchParams.status

      const res = (await axios.get('/cooperative-sources', { params })) as Record<string, unknown>
      setData((res?.data || []) as Record<string, unknown>[])
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }

  // 获取统计数据
  const fetchStats = async () => {
    try {
      const res = (await axios.get('/cooperative-sources/stats', {
        params: { org_id: user.organization_id },
      })) as Record<string, unknown>
      setStats({
        total: (res?.total as number) || 0,
        processing: (res?.processing as number) || 0,
        converted: (res?.converted as number) || 0,
      })
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  // 搜索
  const handleSearch = () => {
    fetchData()
  }

  // 重置
  const handleReset = () => {
    setSearchParams({ keyword: '', cooperation_type: '', status: '' })
    fetchData()
  }

  // 新增协作案源
  const handleAdd = () => {
    createForm.resetFields()
    setModalVisible(true)
  }

  // 提交新增
  const handleSubmitCreate = async (values: Record<string, unknown>) => {
    try {
      const payload = {
        ...values,
        organization_id: user.organization_id,
      } as Record<string, unknown>
      await axios.post('/cooperative-sources', payload)
      setModalVisible(false)
      createForm.resetFields()
      message.success('协作案源创建成功')
      fetchData()
      fetchStats()
    } catch (error: any) {
      const detail = error?.response?.data?.message || '创建失败，请重试'
      message.error(detail)
    }
  }

  // 查看详情
  const handleViewDetail = (record: Record<string, unknown>) => {
    setCurrentRecord(record)
    setDetailVisible(true)
  }

  // 更新状态
  const handleUpdateStatus = (record: Record<string, unknown>) => {
    setCurrentRecord(record)
    statusForm.setFieldsValue({ status: record.status })
    setStatusVisible(true)
  }

  // 提交状态更新
  const handleSubmitStatus = async (values: Record<string, unknown>) => {
    if (!currentRecord) return
    try {
      await axios.put(`/cooperative-sources/${currentRecord.id}/status`, values)
      setStatusVisible(false)
      message.success('状态更新成功')
      fetchData()
      fetchStats()
    } catch (error) {
      message.error('状态更新失败')
    }
  }

  // 结案
  const handleClose = (record: Record<string, unknown>) => {
    setCurrentRecord(record)
    closeForm.resetFields()
    setCloseVisible(true)
  }

  // 提交结案
  const handleSubmitClose = async (values: Record<string, unknown>) => {
    if (!currentRecord) return
    try {
      await axios.put(`/cooperative-sources/${currentRecord.id}/close`, values)
      setCloseVisible(false)
      message.success('结案成功')
      fetchData()
      fetchStats()
    } catch (error) {
      message.error('结案失败')
    }
  }

  // 表格列定义
  const columns = [
    { title: '案源编号', dataIndex: 'source_no', key: 'source_no', width: 140 },
    { title: '案源名称', dataIndex: 'source_name', key: 'source_name', width: 180 },
    { title: '协作方', dataIndex: 'partner_name', key: 'partner_name', width: 140 },
    {
      title: '协作类型',
      dataIndex: 'cooperation_type',
      key: 'cooperation_type',
      width: 120,
      render: (type: string) => {
        const opt = cooperationTypeOptions.find(o => o.value === type)
        return opt ? <Tag>{opt.label}</Tag> : '-'
      },
    },
    {
      title: '案件类型',
      dataIndex: 'case_type',
      key: 'case_type',
      width: 120,
      render: (type: string) => {
        const opt = caseTypeOptions.find(o => o.value === type)
        return opt ? opt.label : '-'
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const s = cooperationStatusMap[status] || cooperationStatusMap.pending
        return <StatusPill text={s.label} kind={s.kind} />
      },
    },
    {
      title: '转化金额',
      dataIndex: 'conversion_amount',
      key: 'conversion_amount',
      width: 120,
      render: (val: number) => (val ? `¥${val.toLocaleString()}` : '-'),
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 160, render: (val: string) => formatDate(val) },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: unknown, record: Record<string, unknown>) => {
        const status = record.status as string
        return (
          <Space wrap>
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
              详情
            </Button>
            {status !== 'closed' && (
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleUpdateStatus(record)}>
                更新状态
              </Button>
            )}
            {status !== 'closed' && status !== 'pending' && (
              <Button type="link" size="small" onClick={() => handleClose(record)}>
                结案
              </Button>
            )}
          </Space>
        )
      },
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 页面头部 */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <h2 style={pageH2Style}>协作案源管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增协作案源
        </Button>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ width: '100%' }}>
          <Col xs={24} sm={8} md={8} lg={8} xl={8}>
            <Card bordered={false} style={statCardStyle(theme.gradientStat1)}>
              <div style={statIconStyle}>
                <FileTextOutlined />
              </div>
              <div style={statTitleStyle}>协作案源总数</div>
              <div style={statValueStyle}>{stats.total}</div>
            </Card>
          </Col>
          <Col xs={24} sm={8} md={8} lg={8} xl={8}>
            <Card bordered={false} style={statCardStyle(theme.gradientStat2)}>
              <div style={statIconStyle}>
                <LoadingOutlined />
              </div>
              <div style={statTitleStyle}>进行中</div>
              <div style={statValueStyle}>{stats.processing}</div>
            </Card>
          </Col>
          <Col xs={24} sm={8} md={8} lg={8} xl={8}>
            <Card bordered={false} style={statCardStyle(theme.gradientStat4)}>
              <div style={statIconStyle}>
                <CheckCircleOutlined />
              </div>
              <div style={statTitleStyle}>已转化</div>
              <div style={statValueStyle}>{stats.converted}</div>
            </Card>
          </Col>
        </Row>

      {/* 筛选栏 */}
      <div className="search-bar stitch-filter-bar" style={searchBarStyle}>
        <Input
          placeholder="关键词搜索（案源编号/名称/协作方）"
          prefix={<SearchOutlined />}
          style={{ width: 260 }}
          value={searchParams.keyword}
          onChange={(e) => setSearchParams({ ...searchParams, keyword: e.target.value })}
          allowClear
        />
        <Select
          placeholder="协作类型"
          style={{ width: 150 }}
          allowClear
          value={searchParams.cooperation_type || undefined}
          onChange={(value) => setSearchParams({ ...searchParams, cooperation_type: value || '' })}
        >
          {cooperationTypeOptions.map((opt) => (
            <Select.Option key={opt.value} value={opt.value}>
              {opt.label}
            </Select.Option>
          ))}
        </Select>
        <Select
          placeholder="状态"
          style={{ width: 150 }}
          allowClear
          value={searchParams.status || undefined}
          onChange={(value) => setSearchParams({ ...searchParams, status: value || '' })}
        >
          {Object.entries(cooperationStatusMap).map(([key, val]) => (
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
          scroll={{ x: 1400 }}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>

      {/* 新增协作案源弹窗 */}
      <Modal
        title="新增协作案源"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={640}
        destroyOnClose
      >
        <Form form={createForm} onFinish={handleSubmitCreate} layout="vertical">
          <Form.Item name="source_name" label="案源名称" rules={[{ required: true, message: '请输入案源名称' }]}>
            <Input placeholder="请输入案源名称" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="partner_name" label="协作方" rules={[{ required: true, message: '请输入协作方名称' }]}>
                <Input placeholder="请输入协作方名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="partner_contact" label="协作方联系人">
                <Input placeholder="请输入协作方联系人" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="cooperation_type" label="协作类型" rules={[{ required: true, message: '请选择协作类型' }]}>
                <Select placeholder="请选择协作类型">
                  {cooperationTypeOptions.map((opt) => (
                    <Select.Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="case_type" label="案件类型" rules={[{ required: true, message: '请选择案件类型' }]}>
                <Select placeholder="请选择案件类型">
                  {caseTypeOptions.map((opt) => (
                    <Select.Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="conversion_amount" label="预估转化金额（元）">
                <Input placeholder="请输入预估转化金额" type="number" min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expected_close_date" label="预计结案日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="案源描述">
            <Input.TextArea placeholder="请输入案源详细描述" rows={4} />
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
        title="协作案源详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={720}
        destroyOnClose
      >
        {currentRecord && (
          <div>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">案源编号</span>
                <span className="detail-value">{String(currentRecord.source_no || '')}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">案源名称</span>
                <span className="detail-value">{String(currentRecord.source_name || '')}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">协作方</span>
                <span className="detail-value">{String(currentRecord.partner_name || '')}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">协作方联系人</span>
                <span className="detail-value">{String(currentRecord.partner_contact || '-')}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">协作类型</span>
                <span className="detail-value">
                  {(() => {
                    const opt = cooperationTypeOptions.find((o) => o.value === currentRecord.cooperation_type)
                    return opt ? opt.label : '-'
                  })()}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">案件类型</span>
                <span className="detail-value">
                  {(() => {
                    const opt = caseTypeOptions.find((o) => o.value === currentRecord.case_type)
                    return opt ? opt.label : '-'
                  })()}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">状态</span>
                <span className="detail-value">
                  {(() => {
                    const s = cooperationStatusMap[currentRecord.status as string] || cooperationStatusMap.pending
                    return <StatusPill text={s.label} kind={s.kind} />
                  })()}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">转化金额</span>
                <span className="detail-value">
                  {currentRecord.conversion_amount ? `¥${Number(currentRecord.conversion_amount).toLocaleString()}` : '-'}
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
                案源描述
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
                {String(currentRecord.description || '暂无描述')}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 更新状态弹窗 */}
      <Modal
        title="更新状态"
        open={statusVisible}
        onCancel={() => setStatusVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={statusForm} onFinish={handleSubmitStatus} layout="vertical">
          <Form.Item name="status" label="选择状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select placeholder="请选择状态">
              {Object.entries(cooperationStatusMap).map(([key, val]) => (
                <Select.Option key={key} value={key}>
                  {val.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea placeholder="请输入状态变更备注" rows={3} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确认
              </Button>
              <Button onClick={() => setStatusVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 结案弹窗 */}
      <Modal
        title="结案"
        open={closeVisible}
        onCancel={() => setCloseVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={closeForm} onFinish={handleSubmitClose} layout="vertical">
          <Form.Item name="result" label="结案结果" rules={[{ required: true, message: '请输入结案结果' }]}>
            <Input.TextArea placeholder="请输入结案结果说明" rows={4} />
          </Form.Item>
          <Form.Item name="conversion_amount" label="最终转化金额（元）">
            <Input placeholder="请输入最终转化金额" type="number" min={0} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确认结案
              </Button>
              <Button onClick={() => setCloseVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}