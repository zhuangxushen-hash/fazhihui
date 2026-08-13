import { useState, useEffect } from 'react'
import { Button, Modal, Form, Input, Select, Space, message, Card, Row, Col, Tag } from 'antd'
import { SearchOutlined, FileSearchOutlined, MessageOutlined, CheckCircleOutlined, WarningOutlined, ExclamationCircleOutlined, BulbOutlined, UserOutlined } from '@ant-design/icons'
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

// 案件卡片样式
const caseCardStyle: React.CSSProperties = {
  borderRadius: 12,
  border: `1px solid ${theme.borderSecondary}`,
  boxShadow: theme.cardShadow,
  transition: 'all 0.2s ease',
  cursor: 'pointer',
}

// 疑难等级类型
type DifficultyLevel = 'high' | 'medium' | 'low'

// 疑难等级映射
const difficultyLevelMap: Record<DifficultyLevel, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  high: {
    label: '高',
    color: theme.error,
    bg: 'rgba(186, 26, 26, 0.1)',
    icon: <WarningOutlined />,
  },
  medium: {
    label: '中',
    color: theme.warning,
    bg: 'rgba(237, 108, 2, 0.1)',
    icon: <ExclamationCircleOutlined />,
  },
  low: {
    label: '低',
    color: theme.info,
    bg: 'rgba(0, 113, 227, 0.1)',
    icon: <BulbOutlined />,
  },
}

// 疑难等级标签组件
const DifficultyTag = ({ level }: { level: DifficultyLevel }) => {
  const config = difficultyLevelMap[level]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 10px',
        borderRadius: 999,
        background: config.bg,
        color: config.color,
        fontSize: 12,
        fontWeight: 500,
        lineHeight: '20px',
        whiteSpace: 'nowrap',
      }}
    >
      {config.icon}
      {config.label}
    </span>
  )
}

// 案件类型选项
const caseTypeOptions = [
  { value: 'civil', label: '民事案件' },
  { value: 'criminal', label: '刑事案件' },
  { value: 'administrative', label: '行政案件' },
  { value: 'labor', label: '劳动争议' },
  { value: 'marriage', label: '婚姻家事' },
  { value: 'company', label: '公司商事' },
  { value: 'real_estate', label: '房产纠纷' },
  { value: 'ip', label: '知识产权' },
  { value: 'other', label: '其他' },
]

// 疑难等级选项
const difficultyLevelOptions = [
  { value: 'high', label: '高难度' },
  { value: 'medium', label: '中难度' },
  { value: 'low', label: '低难度' },
]

// 状态类型
type CaseStatus = 'discussing' | 'solved'

// 状态映射
const statusMap: Record<CaseStatus, { label: string; color: string; bg: string }> = {
  discussing: { label: '讨论中', color: theme.primary, bg: 'rgba(0, 113, 227, 0.1)' },
  solved: { label: '已解决', color: theme.success, bg: 'rgba(46, 125, 50, 0.1)' },
}

// 状态标签组件
const StatusTag = ({ status }: { status: CaseStatus }) => {
  const config = statusMap[status]
  return (
    <Tag color="default" style={{ background: config.bg, color: config.color, border: 'none', borderRadius: 4 }}>
      {config.label}
    </Tag>
  )
}

export default function DifficultCases() {
  // 数据状态
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(false)

  // 统计数据
  const [stats, setStats] = useState({
    total: 0,
    discussing: 0,
    solved: 0,
  })

  // 弹窗状态
  const [detailVisible, setDetailVisible] = useState(false)
  const [discussVisible, setDiscussVisible] = useState(false)
  const [solutionVisible, setSolutionVisible] = useState(false)

  // 当前选中记录
  const [currentRecord, setCurrentRecord] = useState<Record<string, unknown> | null>(null)

  // 搜索条件
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    case_type: '',
    difficulty_level: '',
  })

  // 表单实例
  const [discussForm] = Form.useForm()
  const [solutionForm] = Form.useForm()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchData()
    fetchStats()
  }, [])

  // 获取疑难案件列表
  const fetchData = async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { org_id: user.organization_id }
      if (searchParams.keyword) params.keyword = searchParams.keyword
      if (searchParams.case_type) params.case_type = searchParams.case_type
      if (searchParams.difficulty_level) params.difficulty_level = searchParams.difficulty_level

      const res = (await axios.get('/difficult-cases', { params })) as Record<string, unknown>
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
      const res = (await axios.get('/difficult-cases/stats', {
        params: { org_id: user.organization_id },
      })) as Record<string, unknown>
      setStats({
        total: (res?.total as number) || 0,
        discussing: (res?.discussing as number) || 0,
        solved: (res?.solved as number) || 0,
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
    setSearchParams({ keyword: '', case_type: '', difficulty_level: '' })
    fetchData()
  }

  // 查看详情
  const handleViewDetail = (record: Record<string, unknown>) => {
    setCurrentRecord(record)
    setDetailVisible(true)
  }

  // 发起讨论
  const handleStartDiscuss = (record: Record<string, unknown>) => {
    setCurrentRecord(record)
    discussForm.resetFields()
    setDiscussVisible(true)
  }

  // 提交讨论
  const handleSubmitDiscuss = async (values: Record<string, unknown>) => {
    if (!currentRecord) return
    try {
      await axios.post(`/difficult-cases/${currentRecord.id}/discussions`, values)
      setDiscussVisible(false)
      discussForm.resetFields()
      message.success('讨论已发起')
      fetchData()
    } catch (error) {
      message.error('发起讨论失败')
    }
  }

  // 添加解决方案
  const handleAddSolution = (record: Record<string, unknown>) => {
    setCurrentRecord(record)
    solutionForm.resetFields()
    setSolutionVisible(true)
  }

  // 提交解决方案
  const handleSubmitSolution = async (values: Record<string, unknown>) => {
    if (!currentRecord) return
    try {
      await axios.post(`/difficult-cases/${currentRecord.id}/solutions`, values)
      setSolutionVisible(false)
      solutionForm.resetFields()
      message.success('解决方案已添加')
      fetchData()
      fetchStats()
    } catch (error) {
      message.error('添加解决方案失败')
    }
  }

  // 获取案件类型标签
  const getCaseTypeLabel = (type: string) => {
    const opt = caseTypeOptions.find((o) => o.value === type)
    return opt ? opt.label : '-'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 页面头部 */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <h2 style={pageH2Style}>疑难案件库</h2>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8} md={8} lg={8}>
          <Card bordered={false} style={statCardStyle(theme.gradientStat1)}>
            <div style={statIconStyle}>
              <FileSearchOutlined />
            </div>
            <div style={statTitleStyle}>疑难案件总数</div>
            <div style={statValueStyle}>{stats.total}</div>
          </Card>
        </Col>
        <Col xs={24} sm={8} md={8} lg={8}>
          <Card bordered={false} style={statCardStyle(theme.gradientStat2)}>
            <div style={statIconStyle}>
              <MessageOutlined />
            </div>
            <div style={statTitleStyle}>讨论中</div>
            <div style={statValueStyle}>{stats.discussing}</div>
          </Card>
        </Col>
        <Col xs={24} sm={8} md={8} lg={8}>
          <Card bordered={false} style={statCardStyle(theme.gradientStat4)}>
            <div style={statIconStyle}>
              <CheckCircleOutlined />
            </div>
            <div style={statTitleStyle}>已解决</div>
            <div style={statValueStyle}>{stats.solved}</div>
          </Card>
        </Col>
      </Row>

      {/* 筛选栏 */}
      <div className="search-bar stitch-filter-bar" style={searchBarStyle}>
        <Input
          placeholder="关键词搜索（案件名称/编号）"
          prefix={<SearchOutlined />}
          style={{ width: 240 }}
          value={searchParams.keyword}
          onChange={(e) => setSearchParams({ ...searchParams, keyword: e.target.value })}
          allowClear
        />
        <Select
          placeholder="案件类型"
          style={{ width: 150 }}
          allowClear
          value={searchParams.case_type || undefined}
          onChange={(value) => setSearchParams({ ...searchParams, case_type: value || '' })}
        >
          {caseTypeOptions.map((opt) => (
            <Select.Option key={opt.value} value={opt.value}>
              {opt.label}
            </Select.Option>
          ))}
        </Select>
        <Select
          placeholder="疑难等级"
          style={{ width: 150 }}
          allowClear
          value={searchParams.difficulty_level || undefined}
          onChange={(value) => setSearchParams({ ...searchParams, difficulty_level: value || '' })}
        >
          {difficultyLevelOptions.map((opt) => (
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

      {/* 案件卡片列表 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: theme.textTertiary }}>加载中...</div>
      ) : data.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 48,
            color: theme.textTertiary,
            background: theme.bgContainer,
            borderRadius: 12,
            border: `1px solid ${theme.borderSecondary}`,
          }}
        >
          暂无疑难案件
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {data.map((item) => {
            const record = item as Record<string, unknown>
            const level = (record.difficulty_level as DifficultyLevel) || 'medium'
            const status = (record.status as CaseStatus) || 'discussing'
            return (
              <Col xs={24} sm={12} md={8} lg={6} key={record.id as React.Key}>
                <Card
                  style={caseCardStyle}
                  styles={{ body: { padding: 20 } }}
                  hoverable
                  onClick={() => handleViewDetail(record)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: theme.textBase,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginBottom: 4,
                        }}
                      >
                        {String(record.case_name || '未命名案件')}
                      </div>
                      <div style={{ fontSize: 12, color: theme.textTertiary }}>
                        编号：{String(record.case_no || '-')}
                      </div>
                    </div>
                    <DifficultyTag level={level} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <StatusTag status={status} />
                    <Tag style={{ borderRadius: 4, border: 'none', background: theme.bgSurfaceLow, color: theme.textSecondary }}>
                      {getCaseTypeLabel(record.case_type as string)}
                    </Tag>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: 12,
                      borderTop: `1px solid ${theme.borderSecondary}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: theme.textSecondary }}>
                      <UserOutlined />
                      <span>{String(record.main_lawyer || '-')}</span>
                      {record.assist_lawyer ? (
                        <span style={{ color: theme.textTertiary }}> / {String(record.assist_lawyer)}</span>
                      ) : null}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: 8,
                      fontSize: 12,
                      color: theme.textTertiary,
                    }}
                  >
                    <span>
                      <MessageOutlined style={{ marginRight: 4 }} />
                      讨论 {Number(record.discussion_count || 0)} 次
                    </span>
                    <span>
                      <BulbOutlined style={{ marginRight: 4 }} />
                      方案 {Number(record.solution_count || 0)} 个
                    </span>
                  </div>
                </Card>
              </Col>
            )
          })}
        </Row>
      )}

      {/* 疑难案件详情弹窗 */}
      <Modal
        title="疑难案件详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={720}
        destroyOnClose
      >
        {currentRecord && (
          <div>
            {/* 基本信息 */}
            <div
              style={{
                background: theme.bgSurfaceLow,
                padding: 16,
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div
                    style={{
                      fontFamily: "'Noto Serif SC', serif",
                      fontSize: 18,
                      fontWeight: 600,
                      color: theme.textBase,
                      marginBottom: 4,
                    }}
                  >
                    {String(currentRecord.case_name || '')}
                  </div>
                  <div style={{ fontSize: 13, color: theme.textTertiary }}>
                    案件编号：{String(currentRecord.case_no || '-')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <DifficultyTag level={(currentRecord.difficulty_level as DifficultyLevel) || 'medium'} />
                  <StatusTag status={(currentRecord.status as CaseStatus) || 'discussing'} />
                </div>
              </div>

              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">案件类型</span>
                  <span className="detail-value">{getCaseTypeLabel(currentRecord.case_type as string)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">主办律师</span>
                  <span className="detail-value">{String(currentRecord.main_lawyer || '-')}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">协办律师</span>
                  <span className="detail-value">{String(currentRecord.assist_lawyer || '-')}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">讨论次数</span>
                  <span className="detail-value">{Number(currentRecord.discussion_count || 0)} 次</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">解决方案</span>
                  <span className="detail-value">{Number(currentRecord.solution_count || 0)} 个</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">登记时间</span>
                  <span className="detail-value">{formatDate(currentRecord.created_at as string)}</span>
                </div>
              </div>
            </div>

            {/* 疑难描述 */}
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontFamily: "'Noto Serif SC', serif",
                  fontSize: 15,
                  fontWeight: 600,
                  color: theme.textBase,
                  marginBottom: 8,
                }}
              >
                疑难描述
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

            {/* 操作按钮 */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Button onClick={() => setDetailVisible(false)}>关闭</Button>
              <Button
                icon={<MessageOutlined />}
                onClick={() => {
                  setDetailVisible(false)
                  handleStartDiscuss(currentRecord)
                }}
              >
                发起讨论
              </Button>
              <Button
                type="primary"
                icon={<BulbOutlined />}
                onClick={() => {
                  setDetailVisible(false)
                  handleAddSolution(currentRecord)
                }}
              >
                添加解决方案
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 发起讨论弹窗 */}
      <Modal
        title="发起讨论"
        open={discussVisible}
        onCancel={() => setDiscussVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={discussForm} onFinish={handleSubmitDiscuss} layout="vertical">
          <Form.Item name="topic" label="讨论主题" rules={[{ required: true, message: '请输入讨论主题' }]}>
            <Input placeholder="请输入讨论主题" />
          </Form.Item>
          <Form.Item name="content" label="讨论内容" rules={[{ required: true, message: '请输入讨论内容' }]}>
            <Input.TextArea placeholder="请详细描述讨论内容和需要解决的问题" rows={5} />
          </Form.Item>
          <Form.Item name="participants" label="参与律师">
            <Select mode="multiple" placeholder="请选择参与讨论的律师" allowClear>
              {/* 律师列表可通过接口动态加载 */}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                发起讨论
              </Button>
              <Button onClick={() => setDiscussVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加解决方案弹窗 */}
      <Modal
        title="添加解决方案"
        open={solutionVisible}
        onCancel={() => setSolutionVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={solutionForm} onFinish={handleSubmitSolution} layout="vertical">
          <Form.Item name="title" label="方案标题" rules={[{ required: true, message: '请输入方案标题' }]}>
            <Input placeholder="请输入解决方案标题" />
          </Form.Item>
          <Form.Item name="content" label="方案内容" rules={[{ required: true, message: '请输入方案内容' }]}>
            <Input.TextArea placeholder="请详细描述解决方案的具体内容和实施步骤" rows={6} />
          </Form.Item>
          <Form.Item name="effectiveness" label="有效性评估">
            <Select placeholder="请选择方案有效性">
              <Select.Option value="high">高 - 方案切实可行</Select.Option>
              <Select.Option value="medium">中 - 方案需进一步验证</Select.Option>
              <Select.Option value="low">低 - 方案仅供参考</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                提交方案
              </Button>
              <Button onClick={() => setSolutionVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}