import { useState, useEffect } from 'react'
import { Card, Row, Col, Table, Tag, Select, Input, Button, Rate, Space, Modal, Form, Popconfirm, message } from 'antd'
import { SearchOutlined, EditOutlined, DeleteOutlined, StarOutlined, FileDoneOutlined } from '@ant-design/icons'
import { theme } from '../constants/theme'
import { formatDate } from '../utils/format'
import { getLawyerRatings, updateLawyerRating, deleteLawyerRating } from '../api/lawyer-center'

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

// 评级等级选项
const levelOptions = [
  { value: '特级', label: '特级律师' },
  { value: '一级', label: '一级律师' },
  { value: '二级', label: '二级律师' },
  { value: '三级', label: '三级律师' },
]

// 评级等级颜色
const levelColorMap: Record<string, string> = {
  '特级': '#c9a961',
  '一级': '#0071e3',
  '二级': '#2e7d32',
  '三级': '#717785',
}

export default function LawyerRatingManage() {
  // 数据状态
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // 搜索条件
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    level: '',
  })

  // 编辑弹窗状态
  const [editVisible, setEditVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<Record<string, unknown> | null>(null)
  const [editForm] = Form.useForm()

  // 获取评级记录列表
  const fetchData = async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { page, page_size: pageSize }
      if (searchParams.keyword) params.keyword = searchParams.keyword
      if (searchParams.level) params.level = searchParams.level
      const res = (await getLawyerRatings(params as never)) as Record<string, unknown>
      setData((res?.data || []) as Record<string, unknown>[])
      setTotal((res?.total as number) || 0)
    } catch (error) {
      message.error('评级记录加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page, pageSize, searchParams])

  // 搜索
  const handleSearch = () => {
    setPage(1)
    fetchData()
  }

  // 重置
  const handleReset = () => {
    setSearchParams({ keyword: '', level: '' })
    setPage(1)
  }

  // 编辑评级
  const handleEdit = (record: Record<string, unknown>) => {
    setEditingRecord(record)
    editForm.setFieldsValue({
      rating_level: record.rating_level,
      score: Number(record.score),
      comment: record.comment,
      period: record.period,
    })
    setEditVisible(true)
  }

  // 提交编辑
  const handleSubmitEdit = async (values: Record<string, unknown>) => {
    if (!editingRecord) return
    try {
      await updateLawyerRating(String(editingRecord.id), values)
      setEditVisible(false)
      editForm.resetFields()
      message.success('评级更新成功')
      fetchData()
    } catch (error) {
      message.error('更新失败')
    }
  }

  // 删除评级
  const handleDelete = async (id: string) => {
    try {
      await deleteLawyerRating(id)
      message.success('删除成功')
      fetchData()
    } catch (error) {
      message.error('删除失败')
    }
  }

  // 表格列定义
  const columns = [
    {
      title: '律师',
      dataIndex: 'lawyer_name',
      key: 'lawyer_name',
      width: 140,
      render: (name: string) => <span style={{ fontWeight: 600 }}>{name || '-'}</span>,
    },
    {
      title: '评级等级',
      dataIndex: 'rating_level',
      key: 'rating_level',
      width: 120,
      render: (level: string) => (
        <Tag style={{ borderRadius: 4, fontWeight: 600, color: '#fff', background: levelColorMap[level] || '#717785' }}>
          {level}
        </Tag>
      ),
    },
    {
      title: '综合评分',
      dataIndex: 'score',
      key: 'score',
      width: 200,
      render: (score: number) => (
        <Space>
          <Rate disabled value={Number(score)} allowHalf style={{ fontSize: 13 }} />
          <span style={{ fontWeight: 600, color: theme.primaryDark }}>{Number(score).toFixed(1)}</span>
        </Space>
      ),
    },
    {
      title: '评级周期',
      dataIndex: 'period',
      key: 'period',
      width: 140,
      render: (val: string) => val || '-',
    },
    {
      title: '评级评语',
      dataIndex: 'comment',
      key: 'comment',
      render: (val: string) => val || '-',
    },
    {
      title: '评级时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      render: (val: string) => formatDate(val),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right' as const,
      render: (_: unknown, record: Record<string, unknown>) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除该评级记录吗？" onConfirm={() => handleDelete(String(record.id))}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // 统计（基于当前列表数据近似计算，完整统计见评级聚合）
  const avgScore = data.length > 0 ? Number((data.reduce((s, r) => s + Number(r.score), 0) / data.length).toFixed(1)) : 0
  const specialCount = data.filter((r) => r.rating_level === '特级').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 页面头部 */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <h2 style={pageH2Style}>评级管理</h2>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ width: '100%' }}>
        <Col xs={24} sm={8} md={8} lg={8} xl={8}>
          <Card bordered={false} style={statCardStyle(theme.gradientStat1)}>
            <div style={statIconStyle}>
              <FileDoneOutlined />
            </div>
            <div style={statTitleStyle}>评级记录总数</div>
            <div style={statValueStyle}>{total}</div>
          </Card>
        </Col>
        <Col xs={24} sm={8} md={8} lg={8} xl={8}>
          <Card bordered={false} style={statCardStyle(theme.gradientStat2)}>
            <div style={statIconStyle}>
              <StarOutlined />
            </div>
            <div style={statTitleStyle}>当前页平均分</div>
            <div style={statValueStyle}>{avgScore.toFixed(1)}</div>
          </Card>
        </Col>
        <Col xs={24} sm={8} md={8} lg={8} xl={8}>
          <Card bordered={false} style={statCardStyle(theme.gradientStat4)}>
            <div style={statIconStyle}>
              <StarOutlined />
            </div>
            <div style={statTitleStyle}>当前页特级评级</div>
            <div style={statValueStyle}>{specialCount}</div>
          </Card>
        </Col>
      </Row>

      {/* 筛选栏 */}
      <div className="search-bar stitch-filter-bar" style={searchBarStyle}>
        <Input
          placeholder="关键词搜索（律师姓名）"
          prefix={<SearchOutlined />}
          style={{ width: 240 }}
          value={searchParams.keyword}
          onChange={(e) => setSearchParams({ ...searchParams, keyword: e.target.value })}
          allowClear
        />
        <Select
          placeholder="评级等级"
          style={{ width: 150 }}
          allowClear
          value={searchParams.level || undefined}
          onChange={(value) => setSearchParams({ ...searchParams, level: value || '' })}
        >
          {levelOptions.map((opt) => (
            <Select.Option key={opt.value} value={opt.value}>
              {opt.label}
            </Select.Option>
          ))}
        </Select>
        <Button type="primary" onClick={handleSearch}>
          搜索
        </Button>
        <Button onClick={handleReset}>重置</Button>
      </div>

      {/* 数据表格 */}
      <Card className="stitch-table" styles={{ body: { padding: 0 } }} style={{ borderRadius: 16, overflow: 'hidden' }}>
        <Table
          dataSource={data}
          columns={columns}
          loading={loading}
          rowKey="id"
          size="small"
          scroll={{ x: 1000 }}
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

      {/* 编辑评级弹窗 */}
      <Modal
        title="编辑评级"
        open={editVisible}
        onCancel={() => setEditVisible(false)}
        footer={null}
        width={520}
        destroyOnClose
      >
        <Form form={editForm} onFinish={handleSubmitEdit} layout="vertical">
          <Form.Item name="rating_level" label="评级等级" rules={[{ required: true, message: '请选择评级等级' }]}>
            <Select placeholder="请选择评级等级">
              {levelOptions.map((opt) => (
                <Select.Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="score" label="综合评分" rules={[{ required: true, message: '请选择综合评分' }]}>
            <Rate allowHalf count={5} />
          </Form.Item>
          <Form.Item name="period" label="评级周期">
            <Input placeholder="如：2026-Q3" />
          </Form.Item>
          <Form.Item name="comment" label="评级评语">
            <Input.TextArea placeholder="请输入评级评语" rows={3} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                提交
              </Button>
              <Button onClick={() => setEditVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
