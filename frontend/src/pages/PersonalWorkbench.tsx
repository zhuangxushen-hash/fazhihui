import { useState, useEffect, useMemo } from 'react'
import {
  Card,
  Row,
  Col,
  List,
  Tag,
  Button,
  Empty,
  Spin,
  Space,
  Typography,
  Progress,
} from 'antd'
import {
  CheckSquareOutlined,
  CalendarOutlined,
  FileTextOutlined,
  AuditOutlined,
  FolderOpenOutlined,
  RightOutlined,
  ClockCircleOutlined,
  FieldTimeOutlined,
  FileDoneOutlined,
  CarryOutOutlined,
  EditOutlined,
  ScheduleOutlined,
  MoneyCollectOutlined,
  FolderOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import { getWorkbenchSummary } from '../api/workbench'
import { theme } from '../constants/theme'

const { Text } = Typography

// 任务优先级映射
const priorityMap: Record<string, { label: string; color: string }> = {
  urgent: { label: '紧急', color: '#ff4d4f' },
  high: { label: '高', color: '#fa8c16' },
  normal: { label: '中', color: '#1677ff' },
  low: { label: '低', color: '#8c8c8c' },
}

// 审批类型映射
const approvalTypeMap: Record<string, string> = {
  seal: '用印审批',
  case: '立案审批',
  contract: '合同审批',
  finance: '财务审批',
  other: '其他审批',
}

// 快捷入口
const shortcuts = [
  { key: '/worklogs', label: '写日志', icon: <EditOutlined />, color: '#1677ff', bg: 'rgba(22,119,255,0.1)' },
  { key: '/schedules', label: '创建日程', icon: <CalendarOutlined />, color: '#52c41a', bg: 'rgba(82,196,26,0.1)' },
  { key: '/tasks', label: '任务中心', icon: <CheckSquareOutlined />, color: '#722ed1', bg: 'rgba(114,46,209,0.1)' },
  { key: '/cases', label: '案件管理', icon: <FolderOpenOutlined />, color: '#13c2c2', bg: 'rgba(19,194,194,0.1)' },
  { key: '/approval-center', label: '审批中心', icon: <AuditOutlined />, color: '#fa8c16', bg: 'rgba(250,140,22,0.1)' },
  { key: '/contracts', label: '合同管理', icon: <FileDoneOutlined />, color: '#eb2f96', bg: 'rgba(235,47,150,0.1)' },
  { key: '/finance-operation', label: '收款开票', icon: <MoneyCollectOutlined />, color: '#faad14', bg: 'rgba(250,173,20,0.1)' },
  { key: '/documents', label: '公司文档', icon: <FolderOutlined />, color: '#0059b5', bg: 'rgba(0,89,181,0.1)' },
]

export default function PersonalWorkbench() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<any>(null)

  const loadSummary = async () => {
    setLoading(true)
    try {
      const data = await getWorkbenchSummary()
      setSummary(data)
    } catch {
      // 错误已由 axios 拦截器统一提示
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSummary()
  }, [])

  const stats = useMemo(() => summary?.stats || {}, [summary])
  const tasks = summary?.tasks || []
  const schedules = summary?.schedules || []
  const todayLogs = summary?.todayLogs || []
  const draftLogs = summary?.draftLogs || []
  const approvals = summary?.approvals || []

  // 统计卡片配置
  const statCards = [
    { title: '我的待办任务', value: stats.my_pending_tasks ?? 0, icon: <CheckSquareOutlined />, bg: theme.gradientStat1, onClick: () => navigate('/tasks') },
    { title: '今日日程', value: stats.today_schedules ?? 0, icon: <CalendarOutlined />, bg: theme.gradientStat2, onClick: () => navigate('/schedules') },
    { title: '今日已写日志', value: stats.today_log_count ?? 0, icon: <FileTextOutlined />, bg: theme.gradientStat3, onClick: () => navigate('/worklogs') },
    { title: '待办审批', value: stats.pending_approvals ?? 0, icon: <AuditOutlined />, bg: theme.gradientStat4, onClick: () => navigate('/approval-center') },
  ]

  // 待写日志提示
  const hasTodayLog = todayLogs.length > 0

  return (
    <div style={{ padding: 8 }}>
      {/* 顶部欢迎语 + 快捷入口 */}
      <Card
        style={{ marginBottom: 16, borderRadius: 16 }}
        styles={{ body: { padding: '20px 24px' } }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col flex="auto">
            <Text style={{ fontSize: 20, fontWeight: 600, color: theme.textBase }}>
              你好，今天也要元气满满
            </Text>
            <div style={{ marginTop: 4 }}>
              <Text type="secondary">
                {dayjs().format('YYYY年MM月DD日')} 星期{['日', '一', '二', '三', '四', '五', '六'][dayjs().day()]}
                {hasTodayLog ? '，今日工作日志已填写' : '，记得填写今日工作日志'}
              </Text>
            </div>
          </Col>
          <Col>
            <Space size={12} wrap>
              {shortcuts.map((s) => (
                <Button
                  key={s.key}
                  icon={s.icon}
                  onClick={() => navigate(s.key)}
                  style={{
                    height: 44,
                    borderRadius: 10,
                    color: s.color,
                    background: s.bg,
                    border: 'none',
                  }}
                >
                  {s.label}
                </Button>
              ))}
            </Space>
          </Col>
        </Row>
      </Card>

      <Spin spinning={loading}>
        {/* 统计卡片 */}
        <Row gutter={[16, 16]}>
          {statCards.map((c) => (
            <Col xs={24} sm={12} lg={6} key={c.title}>
              <Card
                hoverable
                onClick={c.onClick}
                style={{ borderRadius: 16, border: 'none', background: c.bg }}
                styles={{ body: { padding: '20px 24px' } }}
              >
                <Row align="middle" justify="space-between">
                  <Col>
                    <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>{c.title}</div>
                    <div
                      style={{
                        fontSize: 34,
                        fontWeight: 700,
                        color: '#ffffff',
                        fontFamily: theme.component.kpiCard.valueFont,
                        marginTop: 4,
                      }}
                    >
                      {c.value}
                    </div>
                  </Col>
                  <Col>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: 'rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                        color: '#ffffff',
                      }}
                    >
                      {c.icon}
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          {/* 我的待办任务 */}
          <Col xs={24} lg={12}>
            <Card
              title={<Space><CheckSquareOutlined style={{ color: theme.primary }} />我的待办任务</Space>}
              extra={<Button type="link" onClick={() => navigate('/tasks')}>全部 <RightOutlined /></Button>}
              style={{ borderRadius: 16 }}
            >
              {tasks.length === 0 ? (
                <Empty description="暂无待办任务" />
              ) : (
                <List
                  dataSource={tasks.slice(0, 6)}
                  renderItem={(t: any) => (
                    <List.Item
                      actions={[
                        <Tag key="p" color={priorityMap[t.priority]?.color}>
                          {priorityMap[t.priority]?.label || '中'}
                        </Tag>,
                      ]}
                    >
                      <List.Item.Meta
                        title={<span style={{ fontSize: 14 }}>{t.title}</span>}
                        description={
                          <Space size={8} wrap>
                            <Tag color={t.status === 'pending' ? 'processing' : 'success'}>
                              {t.status === 'pending' ? '待办' : '进行中'}
                            </Tag>
                            {t.due_date && (
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                <ClockCircleOutlined /> 截止 {t.due_date}
                              </Text>
                            )}
                            {t.progress > 0 && (
                              <Progress
                                percent={t.progress}
                                size="small"
                                style={{ width: 120, margin: 0 }}
                              />
                            )}
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Col>

          {/* 今日日程 */}
          <Col xs={24} lg={12}>
            <Card
              title={<Space><CalendarOutlined style={{ color: theme.primary }} />今日日程</Space>}
              extra={<Button type="link" onClick={() => navigate('/schedules')}>全部 <RightOutlined /></Button>}
              style={{ borderRadius: 16 }}
            >
              {schedules.length === 0 ? (
                <Empty description="今日暂无日程" />
              ) : (
                <List
                  dataSource={schedules.slice(0, 6)}
                  renderItem={(s: any) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 10,
                              background: theme.gradientStat2,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              fontSize: 18,
                            }}
                          >
                            <CarryOutOutlined />
                          </div>
                        }
                        title={<span style={{ fontSize: 14 }}>{s.title}</span>}
                        description={
                          <Space size={8} wrap>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              <FieldTimeOutlined /> {dayjs(s.start_time).format('HH:mm')} - {dayjs(s.end_time).format('HH:mm')}
                            </Text>
                            {s.location && <Text type="secondary" style={{ fontSize: 12 }}>{s.location}</Text>}
                            {s.status === 'done' && <Tag color="success">已完成</Tag>}
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          {/* 待写日志 */}
          <Col xs={24} lg={12}>
            <Card
              title={<Space><FileTextOutlined style={{ color: theme.primary }} />待写日志</Space>}
              extra={<Button type="link" onClick={() => navigate('/worklogs')}>去填写 <RightOutlined /></Button>}
              style={{ borderRadius: 16 }}
            >
              <div
                style={{
                  padding: 16,
                  borderRadius: 12,
                  background: hasTodayLog ? 'rgba(82,196,26,0.08)' : 'rgba(250,140,22,0.08)',
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Space>
                  <FileTextOutlined style={{ color: hasTodayLog ? '#52c41a' : '#fa8c16', fontSize: 18 }} />
                  <Text style={{ color: theme.textBase }}>
                    {hasTodayLog ? '今日日志已填写（共 ' + todayLogs.length + ' 条）' : '今日尚未填写工作日志'}
                  </Text>
                </Space>
                <Tag color={hasTodayLog ? 'success' : 'warning'}>
                  {hasTodayLog ? '已完成' : '待填写'}
                </Tag>
              </div>
              {draftLogs.length === 0 ? (
                <Empty description="暂无草稿日志" />
              ) : (
                <List
                  size="small"
                  dataSource={draftLogs.slice(0, 5)}
                  renderItem={(w: any) => (
                    <List.Item>
                      <List.Item.Meta
                        title={
                          <Space size={8}>
                            <span style={{ fontSize: 13 }}>{w.work_date}</span>
                            <Tag color="warning">草稿</Tag>
                          </Space>
                        }
                        description={
                          <Text
                            style={{ fontSize: 12, color: theme.textTertiary }}
                            ellipsis={{ tooltip: w.content }}
                          >
                            {w.content}
                          </Text>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Col>

          {/* 待办审批 */}
          <Col xs={24} lg={12}>
            <Card
              title={<Space><AuditOutlined style={{ color: theme.primary }} />待办审批</Space>}
              extra={<Button type="link" onClick={() => navigate('/approval-center')}>去处理 <RightOutlined /></Button>}
              style={{ borderRadius: 16 }}
            >
              {approvals.length === 0 ? (
                <Empty description="暂无待办审批" />
              ) : (
                <List
                  dataSource={approvals.slice(0, 6)}
                  renderItem={(step: any) => {
                    const req = step.request || {}
                    return (
                      <List.Item
                        actions={[
                          <Button key="go" size="small" type="primary" onClick={() => navigate('/approval-center')}>
                            处理
                          </Button>,
                        ]}
                      >
                        <List.Item.Meta
                          avatar={
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 10,
                                background: 'rgba(250,140,22,0.12)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fa8c16',
                                fontSize: 18,
                              }}
                            >
                              <ScheduleOutlined />
                            </div>
                          }
                          title={<span style={{ fontSize: 14 }}>{req.title}</span>}
                          description={
                            <Space size={8} wrap>
                              <Tag color="warning">{approvalTypeMap[req.type] || req.type}</Tag>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                发起人：{req.applicant?.real_name || req.applicant?.username || '未知'}
                              </Text>
                            </Space>
                          }
                        />
                      </List.Item>
                    )
                  }}
                />
              )}
            </Card>
          </Col>
        </Row>

        {/* 我承办的案件 */}
        <Card
          title={<Space><FolderOpenOutlined style={{ color: theme.primary }} />我承办的案件（{summary?.cases?.length || 0}）</Space>}
          extra={<Button type="link" onClick={() => navigate('/cases')}>全部 <RightOutlined /></Button>}
          style={{ borderRadius: 16, marginTop: 16 }}
        >
          {!summary?.cases?.length ? (
            <Empty description="暂无承办案件" />
          ) : (
            <Row gutter={[12, 12]}>
              {(summary.cases || []).slice(0, 6).map((c: any) => (
                <Col xs={24} sm={12} md={8} key={c.id}>
                  <div
                    onClick={() => navigate(`/cases/${c.id}`)}
                    style={{
                      padding: 14,
                      borderRadius: 12,
                      border: `1px solid ${theme.borderSecondary}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: theme.bgContainer,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = theme.primary)}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = theme.borderSecondary)}
                  >
                    <div style={{ fontSize: 14, fontWeight: 500, color: theme.textBase, marginBottom: 6 }}>
                      {c.case_name || c.client_name || '未命名案件'}
                    </div>
                    <Space size={8} wrap>
                      <Tag color="blue">{c.case_no}</Tag>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        进度 {c.progress || 0}%
                      </Text>
                    </Space>
                  </div>
                </Col>
              ))}
            </Row>
          )}
        </Card>
      </Spin>
    </div>
  )
}
