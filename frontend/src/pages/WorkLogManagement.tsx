import { useState, useEffect, useMemo } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Switch,
  Space,
  message,
  Tabs,
  Tag,
  Card,
  Row,
  Col,
  Statistic,
  Empty,
  Divider,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ScheduleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  CalendarOutlined,
  EyeOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  ClearOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  getWorklogs,
  createWorklog,
  updateWorklog,
  deleteWorklog,
  submitWorklog,
  approveWorklog,
  rejectWorklog,
  getWorklogStats,
  convertFromSchedule,
} from '../api/worklog'
import { getMySchedules } from '../api/schedule'
import { formatDate, formatDateTime } from '../utils/format'

const { RangePicker } = DatePicker

// 工作日志状态映射
const statusMap: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'stitch-tag stitch-tag-default' },
  submitted: { label: '已提交', color: 'stitch-tag stitch-tag-warning' },
  approved: { label: '已通过', color: 'stitch-tag stitch-tag-success' },
  rejected: { label: '已驳回', color: 'stitch-tag stitch-tag-error' },
}

// 状态筛选选项
const statusOptions = [
  { value: 'draft', label: '草稿' },
  { value: 'submitted', label: '已提交' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已驳回' },
]

// 日志类型选项
const logTypeOptions = [
  { value: 'case_work', label: '办案' },
  { value: 'non_case_work', label: '非办案' },
]

// 日志类型中文标签映射
const logTypeMap: Record<string, string> = {
  case_work: '办案',
  non_case_work: '非办案',
}

// 统计数据接口（前端计算）
interface WorklogStats {
  todayHours: number
  weekHours: number
  monthHours: number
  pendingCount: number
  totalHours: number
  billableHours: number
  by_user?: any[]
  // 兼容后端返回的字段
  total_hours?: number
  billable_hours?: number
}

// 状态标签组件
const StatusTag = ({ status }: { status: string }) => {
  const cfg = statusMap[status] || { label: status, color: 'stitch-tag stitch-tag-info' }
  return <Tag className={cfg.color}>{cfg.label}</Tag>
}

// 富文本编辑器组件
const RichTextEditor = ({
  value = '',
  onChange,
  placeholder,
}: {
  value?: string
  onChange?: (html: string) => void
  placeholder?: string
}) => {
  const editorRef = (node: HTMLDivElement | null) => {
    if (node && value !== node.innerHTML) {
      node.innerHTML = value || ''
    }
  }

  const execCommand = (command: string, val?: string) => {
    document.execCommand(command, false, val)
    const el = document.querySelector('.worklog-rich-editor') as HTMLDivElement | null
    if (el && onChange) {
      onChange(el.innerHTML)
    }
  }

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (onChange) {
      onChange(e.currentTarget.innerHTML)
    }
  }

  const btnStyle: React.CSSProperties = {
    padding: '2px 8px',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 13,
    border: 'none',
    background: 'transparent',
    color: '#646a73',
  }

  return (
    <div
      style={{
        border: '1px solid #d9d9d9',
        borderRadius: 6,
        overflow: 'hidden',
        background: '#fff',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '6px 10px',
          borderBottom: '1px solid #e8e8ea',
          background: '#fafafa',
          flexWrap: 'wrap',
        }}
      >
        <button style={btnStyle} onClick={() => execCommand('bold')} title="粗体">
          <BoldOutlined />
        </button>
        <button style={btnStyle} onClick={() => execCommand('italic')} title="斜体">
          <ItalicOutlined />
        </button>
        <button style={btnStyle} onClick={() => execCommand('underline')} title="下划线">
          <UnderlineOutlined />
        </button>
        <div style={{ width: 1, height: 16, background: '#e0e0e0', margin: '0 4px' }} />
        <button style={btnStyle} onClick={() => execCommand('insertUnorderedList')} title="无序列表">
          <UnorderedListOutlined />
        </button>
        <button style={btnStyle} onClick={() => execCommand('insertOrderedList')} title="有序列表">
          <OrderedListOutlined />
        </button>
        <div style={{ width: 1, height: 16, background: '#e0e0e0', margin: '0 4px' }} />
        <button style={btnStyle} onClick={() => execCommand('removeFormat')} title="清除格式">
          <ClearOutlined />
        </button>
        <button style={btnStyle} onClick={() => execCommand('formatBlock', 'H3')} title="标题">
          H
        </button>
      </div>
      <div
        ref={editorRef}
        className="worklog-rich-editor"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        style={{
          padding: '10px 12px',
          minHeight: 160,
          maxHeight: 320,
          overflow: 'auto',
          outline: 'none',
          fontSize: 14,
          lineHeight: 1.6,
        }}
        data-placeholder={placeholder}
      />
    </div>
  )
}

export default function WorkLogManagement() {
  const [activeTab, setActiveTab] = useState('mine')
  const [data, setData] = useState<any[]>([])
  const [stats, setStats] = useState<WorklogStats>({
    todayHours: 0,
    weekHours: 0,
    monthHours: 0,
    pendingCount: 0,
    totalHours: 0,
    billableHours: 0,
  })
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [viewing, setViewing] = useState<any>(null)
  const [viewModalVisible, setViewModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [searchForm] = Form.useForm()
  const [approveModal, setApproveModal] = useState<{
    visible: boolean
    record: any
    type: 'approve' | 'reject'
  }>({ visible: false, record: null, type: 'approve' })
  const [approveComment, setApproveComment] = useState('')
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false)
  const [scheduleList, setScheduleList] = useState<any[]>([])
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null)

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // 构建查询参数
  const buildParams = () => {
    const values = searchForm.getFieldsValue()
    const params: any = {}
    if (values.dateRange && values.dateRange.length === 2) {
      params.startDate = values.dateRange[0].format('YYYY-MM-DD')
      params.endDate = values.dateRange[1].format('YYYY-MM-DD')
    }
    if (values.status) params.status = values.status
    if (values.case_id) params.case_id = values.case_id
    if (values.log_type) params.log_type = values.log_type
    return params
  }

  // 拉取数据
  const fetchData = async () => {
    setLoading(true)
    try {
      const params = buildParams()
      if (activeTab === 'mine') {
        params.user_id = user.id
        const res = (await getWorklogs(params)) as Record<string, unknown>[]
        setData(res || [])
      } else if (activeTab === 'pending') {
        params.status = 'submitted'
        const res = (await getWorklogs(params)) as Record<string, unknown>[]
        setData(res || [])
      } else if (activeTab === 'stats') {
        const res = (await getWorklogStats(params)) as unknown as WorklogStats
        setStats(res)
        // 同时获取全部日志用于列表展示
        const allParams = { ...params }
        allParams.user_id = user.id
        const allRes = (await getWorklogs(allParams)) as Record<string, unknown>[]
        setData(allRes || [])
      }
    } catch (error) {
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 计算统计数据
  const computedStats = useMemo((): WorklogStats => {
    const today = dayjs()
    const weekStart = today.startOf('week')
    const monthStart = today.startOf('month')

    let todayHours = 0
    let weekHours = 0
    let monthHours = 0
    let pendingCount = 0

    data.forEach((log: any) => {
      const logDate = dayjs(log.work_date)
      const hours = Number(log.work_hours) || 0

      if (logDate.isSame(today, 'day')) {
        todayHours += hours
      }
      if (logDate.isAfter(weekStart) || logDate.isSame(weekStart, 'day')) {
        if (logDate.isBefore(today.add(1, 'day'))) {
          weekHours += hours
        }
      }
      if (logDate.isAfter(monthStart) || logDate.isSame(monthStart, 'day')) {
        if (logDate.isBefore(today.add(1, 'day'))) {
          monthHours += hours
        }
      }
      if (log.status === 'submitted') {
        pendingCount++
      }
    })

    return {
      todayHours,
      weekHours,
      monthHours,
      pendingCount,
      totalHours: todayHours + weekHours,
      billableHours: 0,
    }
  }, [data])

  // 合并的统计数据（后端 + 前端计算）
  const mergedStats = useMemo((): WorklogStats => {
    return {
      todayHours: computedStats.todayHours,
      weekHours: computedStats.weekHours,
      monthHours: computedStats.monthHours,
      pendingCount: stats.pendingCount || computedStats.pendingCount,
      totalHours: stats.total_hours || computedStats.totalHours,
      billableHours: stats.billable_hours || computedStats.billableHours,
    }
  }, [computedStats, stats])

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // 新增工作日志
  const handleAdd = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({
      work_date: dayjs(),
      billable: true,
      work_hours: 1,
      log_type: 'case_work',
      content: '',
    })
    setModalVisible(true)
  }

  // 查看工作日志详情
  const handleView = (record: any) => {
    setViewing(record)
    setViewModalVisible(true)
  }

  // 编辑工作日志（仅草稿可编辑）
  const handleEdit = (record: any) => {
    setEditing(record)
    form.setFieldsValue({
      ...record,
      work_date: record.work_date ? dayjs(record.work_date) : null,
      work_hours:
        record.work_hours !== null && record.work_hours !== undefined
          ? Number(record.work_hours)
          : undefined,
      billable: !!record.billable,
      log_type: record.log_type || 'case_work',
      content: record.content || '',
    })
    setModalVisible(true)
    setViewModalVisible(false)
  }

  // 提交表单（新增/编辑）
  const handleSubmit = async (values: any) => {
    try {
      const payload = {
        case_id: values.case_id || null,
        content: values.content,
        work_date: values.work_date ? values.work_date.format('YYYY-MM-DD') : null,
        work_hours: values.work_hours,
        billable: values.billable,
        log_type: values.log_type || 'case_work',
      }
      if (editing) {
        await updateWorklog(editing.id, payload)
        message.success('工作日志更新成功')
      } else {
        await createWorklog(payload)
        message.success('工作日志创建成功')
      }
      setModalVisible(false)
      fetchData()
    } catch (error: unknown) {
      message.error(
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || '操作失败'
      )
    }
  }

  // 提交工作日志（草稿 -> 已提交）
  const handleSubmitWorklog = (record: any) => {
    Modal.confirm({
      title: '确认提交',
      content: '提交后将无法编辑，确定要提交该工作日志吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await submitWorklog(record.id)
          message.success('工作日志已提交')
          fetchData()
        } catch (error) {
          message.error('提交失败')
        }
      },
    })
  }

  // 删除工作日志
  const handleDelete = (record: any) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该工作日志吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteWorklog(record.id)
          message.success('删除成功')
          fetchData()
        } catch (error) {
          message.error('删除失败')
        }
      },
    })
  }

  // 打开审批弹窗
  const openApproveModal = (record: any, type: 'approve' | 'reject') => {
    setApproveComment('')
    setApproveModal({ visible: true, record, type })
  }

  // 确认审批
  const handleApproveSubmit = async () => {
    const { record, type } = approveModal
    try {
      if (type === 'approve') {
        await approveWorklog(record.id, { comment: approveComment })
        message.success('已通过审批')
      } else {
        await rejectWorklog(record.id, { comment: approveComment })
        message.success('已驳回')
      }
      setApproveModal({ visible: false, record: null, type: 'approve' })
      fetchData()
    } catch (error) {
      message.error('操作失败')
    }
  }

  // 查询
  const handleSearch = () => {
    fetchData()
  }

  // 重置查询条件
  const handleReset = () => {
    searchForm.resetFields()
    fetchData()
  }

  // 打开"从日程转入"弹窗
  const handleOpenScheduleModal = async () => {
    setSelectedScheduleId(null)
    setScheduleModalVisible(true)
    setScheduleLoading(true)
    try {
      const res: any = await getMySchedules()
      setScheduleList(res || [])
    } catch (error) {
      message.error('获取日程列表失败')
    } finally {
      setScheduleLoading(false)
    }
  }

  // 确认从日程转入工作日志
  const handleConvertFromSchedule = async () => {
    if (!selectedScheduleId) {
      message.warning('请选择一条日程')
      return
    }
    try {
      await convertFromSchedule(selectedScheduleId)
      message.success('日程已转入工作日志')
      setScheduleModalVisible(false)
      fetchData()
    } catch (error: unknown) {
      message.error(
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || '转入失败'
      )
    }
  }

  // 我的日志 列定义
  const mineColumns = [
    {
      title: '工作日期',
      dataIndex: 'work_date',
      key: 'work_date',
      width: 110,
      render: (v: string) => formatDate(v),
    },
    {
      title: '日志类型',
      dataIndex: 'log_type',
      key: 'log_type',
      width: 80,
      render: (v: string) => {
        const label = logTypeMap[v] || v || '-'
        return (
          <Tag
            className={
              v === 'case_work'
                ? 'stitch-tag stitch-tag-primary'
                : 'stitch-tag stitch-tag-info'
            }
          >
            {label}
          </Tag>
        )
      },
    },
    {
      title: '关联案件',
      dataIndex: 'case_id',
      key: 'case_id',
      width: 120,
      render: (v: string) => v || '-',
      ellipsis: true,
    },
    {
      title: '工作内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (v: string) => {
        // 去除HTML标签显示纯文本
        const text = v?.replace(/<[^>]*>/g, '') || '-'
        return text.length > 50 ? text.slice(0, 50) + '...' : text
      },
    },
    {
      title: '工时',
      dataIndex: 'work_hours',
      key: 'work_hours',
      width: 70,
      align: 'right' as const,
      render: (v: number) => (
        <span style={{ color: '#1677ff', fontWeight: 500 }}>
          {Number(v || 0).toFixed(1)}h
        </span>
      ),
    },
    {
      title: '计费',
      dataIndex: 'billable',
      key: 'billable',
      width: 60,
      render: (v: boolean) => (
        <Tag className={v ? 'stitch-tag stitch-tag-success' : 'stitch-tag stitch-tag-info'}>
          {v ? '是' : '否'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => <StatusTag status={status} />,
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          {record.status === 'draft' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              >
                编辑
              </Button>
              <Button
                type="link"
                size="small"
                onClick={() => handleSubmitWorklog(record)}
              >
                提交
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record)}
              >
                删除
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  // 待审核 列定义
  const pendingColumns = [
    {
      title: '律师',
      dataIndex: 'user_id',
      key: 'user_id',
      width: 120,
      render: (v: string) => (v ? v.slice(0, 8) : '-'),
      ellipsis: true,
    },
    {
      title: '工作日期',
      dataIndex: 'work_date',
      key: 'work_date',
      width: 110,
      render: (v: string) => formatDate(v),
    },
    {
      title: '日志类型',
      dataIndex: 'log_type',
      key: 'log_type',
      width: 80,
      render: (v: string) => {
        const label = logTypeMap[v] || v || '-'
        return (
          <Tag
            className={
              v === 'case_work'
                ? 'stitch-tag stitch-tag-primary'
                : 'stitch-tag stitch-tag-info'
            }
          >
            {label}
          </Tag>
        )
      },
    },
    {
      title: '工作内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (v: string) => {
        const text = v?.replace(/<[^>]*>/g, '') || '-'
        return text.length > 80 ? text.slice(0, 80) + '...' : text
      },
    },
    {
      title: '工时',
      dataIndex: 'work_hours',
      key: 'work_hours',
      width: 70,
      align: 'right' as const,
      render: (v: number) => (
        <span style={{ color: '#1677ff', fontWeight: 500 }}>
          {Number(v || 0).toFixed(1)}h
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => openApproveModal(record, 'approve')}
          >
            同意
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => openApproveModal(record, 'reject')}
          >
            驳回
          </Button>
        </Space>
      ),
    },
  ]

  // 按律师统计 列定义
  const statsColumns = [
    {
      title: '律师',
      dataIndex: 'user_id',
      key: 'user_id',
      render: (v: string) => (v ? v.slice(0, 8) : '-'),
    },
    {
      title: '总工时',
      dataIndex: 'total_hours',
      key: 'total_hours',
      render: (v: number) => `${Number(v || 0).toFixed(1)}h`,
    },
    {
      title: '计费工时',
      dataIndex: 'billable_hours',
      key: 'billable_hours',
      render: (v: number) => `${Number(v || 0).toFixed(1)}h`,
    },
    { title: '案件数', dataIndex: 'case_count', key: 'case_count' },
  ]

  // Tab 配置
  const tabItems = [
    {
      key: 'mine',
      label: '我的日志',
      children: (
        <>
          {/* 统计卡片 */}
          <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
            <Col xs={12} sm={6}>
              <Card size="small" style={{ background: '#e6f4ff', border: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: '#1677ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ClockCircleOutlined style={{ color: '#fff', fontSize: 18 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#646a73' }}>今日工时</div>
                    <div style={{ fontSize: 20, fontWeight: 600, color: '#1677ff' }}>
                      {mergedStats.todayHours.toFixed(1)}
                      <span style={{ fontSize: 12, fontWeight: 400, color: '#646a73', marginLeft: 2 }}>
                        h
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small" style={{ background: '#f6ffed', border: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: '#52c41a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CalendarOutlined style={{ color: '#fff', fontSize: 18 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#646a73' }}>本周工时</div>
                    <div style={{ fontSize: 20, fontWeight: 600, color: '#389e0d' }}>
                      {mergedStats.weekHours.toFixed(1)}
                      <span style={{ fontSize: 12, fontWeight: 400, color: '#646a73', marginLeft: 2 }}>
                        h
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small" style={{ background: '#fff7e6', border: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: '#fa8c16',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FileTextOutlined style={{ color: '#fff', fontSize: 18 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#646a73' }}>本月工时</div>
                    <div style={{ fontSize: 20, fontWeight: 600, color: '#d46b08' }}>
                      {mergedStats.monthHours.toFixed(1)}
                      <span style={{ fontSize: 12, fontWeight: 400, color: '#646a73', marginLeft: 2 }}>
                        h
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small" style={{ background: '#fff1f0', border: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: '#f5222d',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckCircleOutlined style={{ color: '#fff', fontSize: 18 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#646a73' }}>待审批</div>
                    <div style={{ fontSize: 20, fontWeight: 600, color: '#cf1322' }}>
                      {mergedStats.pendingCount}
                      <span style={{ fontSize: 12, fontWeight: 400, color: '#646a73', marginLeft: 2 }}>
                        条
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <Space>
              <Button icon={<ScheduleOutlined />} onClick={handleOpenScheduleModal}>
                从日程转入
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                新增日志
              </Button>
            </Space>
          </div>
          <Table
            dataSource={data}
            columns={mineColumns}
            loading={loading}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
            scroll={{ x: 1000 }}
          />
        </>
      ),
    },
    {
      key: 'pending',
      label: '待审核',
      children: (
        <Table
          dataSource={data}
          columns={pendingColumns}
          loading={loading}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
          scroll={{ x: 900 }}
        />
      ),
    },
    {
      key: 'stats',
      label: '工时统计',
      children: (
        <>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <Card>
                <Statistic
                  title="总工时"
                  value={Number(mergedStats.totalHours || 0)}
                  suffix="h"
                  precision={1}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="计费工时"
                  value={Number(mergedStats.billableHours || 0)}
                  suffix="h"
                  precision={1}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="本月工时"
                  value={Number(mergedStats.monthHours || 0)}
                  suffix="h"
                  precision={1}
                />
              </Card>
            </Col>
          </Row>
          <Card title="按律师统计">
            <Table
              dataSource={stats?.by_user || []}
              columns={statsColumns}
              rowKey="user_id"
              size="small"
              pagination={false}
              loading={loading}
              scroll={{ x: 600 }}
            />
          </Card>
        </>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>工作日志管理</h2>
      </div>

      {/* 查询表单 */}
      <div
        className="stitch-filter-bar"
        style={{ background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16 }}
      >
        <Form form={searchForm} layout="inline" style={{ gap: 8 }}>
          <Form.Item name="dateRange" label="工作日期">
            <RangePicker style={{ width: 240 }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select
              placeholder="全部"
              allowClear
              style={{ width: 120 }}
              options={statusOptions}
            />
          </Form.Item>
          <Form.Item name="log_type" label="日志类型">
            <Select
              placeholder="全部"
              allowClear
              style={{ width: 120 }}
              options={logTypeOptions}
            />
          </Form.Item>
          <Form.Item name="case_id" label="案件">
            <Input placeholder="案件ID" allowClear style={{ width: 160 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                查询
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      {/* 新增/编辑工作日志弹窗 */}
      <Modal
        title={editing ? '编辑工作日志' : '新增工作日志'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={680}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="work_date"
                label="工作日期"
                rules={[{ required: true, message: '请选择工作日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="log_type"
                label="日志类型"
                rules={[{ required: true, message: '请选择日志类型' }]}
              >
                <Select placeholder="请选择日志类型" options={logTypeOptions} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="case_id" label="关联案件">
                <Input placeholder="请输入案件ID（可空）" allowClear />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="work_hours"
                label="工时（小时）"
                rules={[{ required: true, message: '请输入工时' }]}
              >
                <InputNumber
                  min={0}
                  step={0.5}
                  precision={1}
                  style={{ width: '100%' }}
                  addonAfter="小时"
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="content"
            label="工作内容"
            rules={[{ required: true, message: '请输入工作内容' }]}
          >
            <RichTextEditor placeholder="请输入工作内容，支持富文本格式" />
          </Form.Item>
          <Form.Item name="billable" label="是否计费" valuePropName="checked">
            <Switch checkedChildren="计费" unCheckedChildren="不计费" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 查看详情弹窗 */}
      <Modal
        title="日志详情"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            关闭
          </Button>,
          viewing?.status === 'draft' && (
            <Button key="edit" type="primary" onClick={() => handleEdit(viewing)}>
              编辑
            </Button>
          ),
        ]}
        width={680}
      >
        {viewing && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>工作日期</div>
                <div style={{ fontSize: 14 }}>{formatDate(viewing.work_date)}</div>
              </Col>
              <Col span={8}>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>工时</div>
                <div style={{ fontSize: 14, color: '#1677ff', fontWeight: 500 }}>
                  {Number(viewing.work_hours || 0).toFixed(1)} h
                </div>
              </Col>
              <Col span={8}>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>状态</div>
                <div>
                  <StatusTag status={viewing.status} />
                </div>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>日志类型</div>
                <div style={{ fontSize: 14 }}>{logTypeMap[viewing.log_type] || '-'}</div>
              </Col>
              <Col span={8}>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>关联案件</div>
                <div style={{ fontSize: 14 }}>{viewing.case_id || '暂无'}</div>
              </Col>
              <Col span={8}>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>计费</div>
                <div style={{ fontSize: 14 }}>{viewing.billable ? '是' : '否'}</div>
              </Col>
            </Row>
            <Divider style={{ margin: '8px 0 16px' }} />
            <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 8 }}>工作内容</div>
            <div
              style={{
                padding: 12,
                background: '#fafafa',
                borderRadius: 6,
                border: '1px solid #f0f0f0',
                minHeight: 120,
                maxHeight: 300,
                overflow: 'auto',
              }}
            >
              {viewing.content ? (
                <div
                  style={{ fontSize: 14, lineHeight: 1.6 }}
                  dangerouslySetInnerHTML={{ __html: viewing.content }}
                />
              ) : (
                <Empty description="暂无内容" />
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* 审批弹窗 */}
      <Modal
        title={approveModal.type === 'approve' ? '审批通过' : '驳回工作日志'}
        open={approveModal.visible}
        onCancel={() => setApproveModal({ visible: false, record: null, type: 'approve' })}
        onOk={handleApproveSubmit}
        okText="确定"
        cancelText="取消"
      >
        {approveModal.record && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>工作内容</div>
              <div style={{ fontSize: 14 }}>
                {approveModal.record.content?.replace(/<[^>]*>/g, '')}
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
                工时: {Number(approveModal.record.work_hours || 0).toFixed(1)} h
              </div>
            </div>
            <Divider style={{ margin: '8px 0 12px' }} />
            <Form layout="vertical">
              <Form.Item label="审批意见">
                <Input.TextArea
                  rows={4}
                  placeholder="请输入审批意见"
                  value={approveComment}
                  onChange={(e) => setApproveComment(e.target.value)}
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      {/* 从日程转入弹窗 */}
      <Modal
        title="从日程转入工作日志"
        open={scheduleModalVisible}
        onCancel={() => setScheduleModalVisible(false)}
        onOk={handleConvertFromSchedule}
        okText="转入"
        cancelText="取消"
        width={760}
      >
        <Table
          dataSource={scheduleList}
          loading={scheduleLoading}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 700 }}
          rowSelection={{
            type: 'radio',
            selectedRowKeys: selectedScheduleId ? [selectedScheduleId] : [],
            onChange: (keys) => setSelectedScheduleId(keys[0] as string),
          }}
          columns={[
            { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
            {
              title: '开始时间',
              dataIndex: 'start_time',
              key: 'start_time',
              width: 160,
              render: (v: string) => formatDateTime(v),
            },
            {
              title: '结束时间',
              dataIndex: 'end_time',
              key: 'end_time',
              width: 160,
              render: (v: string) => formatDateTime(v),
            },
            {
              title: '状态',
              dataIndex: 'status',
              key: 'status',
              width: 90,
              render: (v: string) => {
                const cfg =
                  v === 'active'
                    ? { label: '有效', color: 'stitch-tag stitch-tag-success' }
                    : v === 'done'
                      ? { label: '已完成', color: 'stitch-tag stitch-tag-primary' }
                      : { label: v, color: 'stitch-tag stitch-tag-info' }
                return <Tag className={cfg.color}>{cfg.label}</Tag>
              },
            },
          ]}
        />
      </Modal>
    </div>
  )
}
