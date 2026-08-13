import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Row, Col, Avatar, Tag, Button, Table, Rate, Modal, Form, Input, Select, message, Space, Statistic } from 'antd'
import {
  ArrowLeftOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
  CalendarOutlined,
  StarFilled,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  StarOutlined,
} from '@ant-design/icons'
import { theme } from '../constants/theme'
import { formatDate } from '../utils/format'
import {
  getLawyerHome,
  createLawyerRating,
  updateLawyerRating,
  deleteLawyerRating,
} from '../api/lawyer-center'

// 页面标题样式
const pageH2Style: React.CSSProperties = {
  fontFamily: "'Noto Serif SC', serif",
  fontSize: 22,
  fontWeight: 600,
  color: theme.textBase,
  margin: 0,
  letterSpacing: '0.01em',
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

// 评级维度
const dimensionKeys = ['专业能力', '服务态度', '胜诉率', '执业年限']

export default function LawyerHome() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // 主页数据
  const [home, setHome] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)

  // 评级弹窗状态
  const [ratingVisible, setRatingVisible] = useState(false)
  const [editingRating, setEditingRating] = useState<Record<string, unknown> | null>(null)
  const [ratingForm] = Form.useForm()

  // 加载律师主页
  const fetchHome = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = (await getLawyerHome(id)) as unknown as Record<string, unknown>
      setHome(res)
    } catch (error) {
      message.error('律师主页加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHome()
  }, [id])

  // 新增评级
  const handleAddRating = () => {
    setEditingRating(null)
    ratingForm.resetFields()
    setRatingVisible(true)
  }

  // 编辑评级
  const handleEditRating = (record: Record<string, unknown>) => {
    setEditingRating(record)
    ratingForm.setFieldsValue({
      rating_level: record.rating_level,
      score: Number(record.score),
      comment: record.comment,
      period: record.period,
    })
    const dims = record.dimensions as Record<string, number> | null
    if (dims) {
      dimensionKeys.forEach((key) => {
        if (dims[key] !== undefined) ratingForm.setFieldValue(`dim_${key}`, dims[key])
      })
    }
    setRatingVisible(true)
  }

  // 删除评级
  const handleDeleteRating = async (recordId: string) => {
    try {
      await deleteLawyerRating(recordId)
      message.success('评级已删除')
      fetchHome()
    } catch (error) {
      message.error('删除失败')
    }
  }

  // 提交评级
  const handleSubmitRating = async (values: Record<string, unknown>) => {
    if (!id) return
    try {
      const dimensions: Record<string, number> = {}
      dimensionKeys.forEach((key) => {
        const val = values[`dim_${key}`]
        if (val !== undefined) dimensions[key] = Number(val)
      })
      const payload = {
        lawyer_id: id,
        rating_level: values.rating_level,
        score: Number(values.score),
        dimensions,
        comment: values.comment,
        period: values.period,
      } as Record<string, unknown>
      if (editingRating) {
        await updateLawyerRating(String(editingRating.id), payload)
        message.success('评级更新成功')
      } else {
        await createLawyerRating(payload as never)
        message.success('评级提交成功')
      }
      setRatingVisible(false)
      ratingForm.resetFields()
      fetchHome()
    } catch (error) {
      message.error('评级提交失败')
    }
  }

  // 评级表格列
  const ratingColumns = [
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
      width: 120,
      render: (_: unknown, record: Record<string, unknown>) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditRating(record)}>
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteRating(String(record.id))}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  const ratings = (home?.ratings as Record<string, unknown>[]) || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 页面头部 */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            返回
          </Button>
          <h2 style={pageH2Style}>律师主页</h2>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        {/* 左侧：律师基本信息 */}
        <Col xs={24} md={8}>
          <Card loading={loading} styles={{ body: { padding: 24 } }}>
            {home && (
              <div style={{ textAlign: 'center' }}>
                <Avatar
                  size={96}
                  style={{
                    background: theme.gradientStat1,
                    color: theme.white,
                    fontSize: 36,
                    marginBottom: 16,
                    boxShadow: '0 8px 24px rgba(0, 113, 227, 0.25)',
                  }}
                >
                  {String(home.avatar || String(home.name || '律').slice(0, 1))}
                </Avatar>
                <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
                  {String(home.name || '')}
                </div>
                <div style={{ color: theme.primary, fontWeight: 500, marginBottom: 12 }}>
                  {String(home.position || '-')}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
                  <Tag className="stitch-tag stitch-tag-gold">
                    <StarFilled style={{ color: theme.warning }} /> {Number(home.rating_avg || 0).toFixed(1)} 分
                  </Tag>
                  <Tag className="stitch-tag stitch-tag-primary">评级 {ratings.length} 次</Tag>
                </div>

                <div className="detail-grid" style={{ gridTemplateColumns: '1fr', gap: 10, textAlign: 'left' }}>
                  <div className="detail-item">
                    <span className="detail-label"><PhoneOutlined /> 联系电话</span>
                    <span className="detail-value">{String(home.phone || '-')}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label"><MailOutlined /> 邮箱</span>
                    <span className="detail-value">{String(home.email || '-')}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label"><IdcardOutlined /> 所属部门</span>
                    <span className="detail-value">{String(home.department || '-')}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label"><CalendarOutlined /> 入职时间</span>
                    <span className="detail-value">{home.hire_date ? formatDate(home.hire_date as string) : '-'}</span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </Col>

        {/* 右侧：评级管理 */}
        <Col xs={24} md={16}>
          <Card
            title={
              <span style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 16, fontWeight: 600, color: theme.textBase }}>
                <StarOutlined style={{ color: theme.warning, marginRight: 8 }} />评级记录
              </span>
            }
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddRating}>
                提交评级
              </Button>
            }
            styles={{ body: { padding: 0 } }}
          >
            <Table
              columns={ratingColumns}
              dataSource={ratings}
              rowKey="id"
              loading={loading}
              size="small"
              pagination={{ pageSize: 8, showSizeChanger: false }}
            />
          </Card>

          {/* 维度说明 */}
          <Card
            title={
              <span style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 16, fontWeight: 600, color: theme.textBase }}>
                评级维度
              </span>
            }
            style={{ marginTop: 16 }}
          >
            <Row gutter={[12, 12]}>
              {dimensionKeys.map((key) => {
                const avg = (() => {
                  const values = ratings
                    .map((r) => ((r.dimensions as Record<string, number>) || {})[key])
                    .filter((v) => v !== undefined && v !== null) as number[]
                  if (values.length === 0) return null
                  return Number((values.reduce((s, v) => s + Number(v), 0) / values.length).toFixed(1))
                })()
                return (
                  <Col xs={24} sm={12} key={key}>
                    <div
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        border: `1px solid ${theme.borderSecondary}`,
                        background: theme.bgSurfaceLow,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontWeight: 600, color: theme.textBase }}>{key}</span>
                      <span style={{ fontSize: 13, color: theme.textTertiary }}>
                        {avg === null ? '暂无评分' : <Statistic value={avg} precision={1} suffix="/ 5" valueStyle={{ fontSize: 16, color: theme.primaryDark }} />}
                      </span>
                    </div>
                  </Col>
                )
              })}
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 提交/编辑评级弹窗 */}
      <Modal
        title={editingRating ? '编辑评级' : '提交评级'}
        open={ratingVisible}
        onCancel={() => setRatingVisible(false)}
        footer={null}
        width={560}
        destroyOnClose
      >
        <Form form={ratingForm} onFinish={handleSubmitRating} layout="vertical">
          <Form.Item name="rating_level" label="评级等级" rules={[{ required: true, message: '请选择评级等级' }]}>
            <Select placeholder="请选择评级等级">
              {levelOptions.map((opt) => (
                <Select.Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="score" label="综合评分" rules={[{ required: true, message: '请输入综合评分' }]}>
            <Rate allowHalf count={5} />
          </Form.Item>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 8 }}>维度评分</div>
            <Row gutter={[16, 0]}>
              {dimensionKeys.map((key) => (
                <Col span={12} key={key}>
                  <Form.Item name={`dim_${key}`} label={key}>
                    <Rate allowHalf count={5} />
                  </Form.Item>
                </Col>
              ))}
            </Row>
          </div>
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
              <Button onClick={() => setRatingVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
