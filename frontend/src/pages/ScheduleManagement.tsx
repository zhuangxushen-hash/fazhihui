import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Switch,
  Space,
  message,
  Tabs,
  Tag,
  Card,
  InputNumber,
  Popconfirm,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  addParticipant,
  listParticipants,
  getMeetingRooms,
  createMeetingRoom,
  updateMeetingRoom,
  deleteMeetingRoom,
  getMeetingRoomBookings,
  createBooking,
  approveBooking,
  rejectBooking,
  convertToLog,
} from '../api/schedule'
import { formatDateTime } from '../utils/format'
import { theme } from '../constants/theme'

const { RangePicker } = DatePicker

// 提醒类型中文标签映射（对齐 Stitch 设计规范，返回 className）
const reminderTypeMap: Record<string, { label: string; color: string }> = {
  none: { label: '不提醒', color: 'stitch-tag stitch-tag-info' },
  before5min: { label: '提前5分钟', color: 'stitch-tag stitch-tag-primary' },
  before15min: { label: '提前15分钟', color: 'stitch-tag stitch-tag-primary' },
  before1hour: { label: '提前1小时', color: 'stitch-tag stitch-tag-warning' },
  before1day: { label: '提前1天', color: 'stitch-tag stitch-tag-gold' },
}

// 提醒类型下拉选项
const reminderOptions = [
  { value: 'none', label: '不提醒' },
  { value: 'before5min', label: '提前5分钟' },
  { value: 'before15min', label: '提前15分钟' },
  { value: 'before1hour', label: '提前1小时' },
  { value: 'before1day', label: '提前1天' },
]

// 日程状态中文映射（对齐 Stitch 设计规范，返回 className）
const scheduleStatusMap: Record<string, { label: string; color: string }> = {
  active: { label: '有效', color: 'stitch-tag stitch-tag-success' },
  cancelled: { label: '已取消', color: 'stitch-tag stitch-tag-error' },
  done: { label: '已完成', color: 'stitch-tag stitch-tag-primary' },
}

// 会议室状态中文映射（对齐 Stitch 设计规范，返回 className）
const roomStatusMap: Record<string, { label: string; color: string }> = {
  available: { label: '可用', color: 'stitch-tag stitch-tag-success' },
  inactive: { label: '停用', color: 'stitch-tag stitch-tag-info' },
}

// 参与人响应状态中文映射（对齐 Stitch 设计规范，返回 className）
const participantStatusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待响应', color: 'stitch-tag stitch-tag-warning' },
  accepted: { label: '已接受', color: 'stitch-tag stitch-tag-success' },
  declined: { label: '已拒绝', color: 'stitch-tag stitch-tag-error' },
}

// 预约状态中文映射（对齐 Stitch 设计规范，返回 className）
const bookingStatusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待审批', color: 'stitch-tag stitch-tag-warning' },
  approved: { label: '已批准', color: 'stitch-tag stitch-tag-success' },
  rejected: { label: '已拒绝', color: 'stitch-tag stitch-tag-error' },
}

export default function ScheduleManagement() {
  const [activeTab, setActiveTab] = useState('schedule')

  // 日程相关状态
  const [schedules, setSchedules] = useState<Record<string, unknown>[]>([])
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Record<string, unknown> | null>(null)
  const [scheduleForm] = Form.useForm()
  const [scheduleSearchForm] = Form.useForm()
  const [participantModalVisible, setParticipantModalVisible] = useState(false)
  const [participantSchedule, setParticipantSchedule] = useState<Record<string, unknown> | null>(null)
  const [participantList, setParticipantList] = useState<Record<string, unknown>[]>([])
  const [participantLoading, setParticipantLoading] = useState(false)
  const [newParticipantId, setNewParticipantId] = useState('')

  // 会议室相关状态
  const [rooms, setRooms] = useState<Record<string, unknown>[]>([])
  const [roomLoading, setRoomLoading] = useState(false)
  const [roomModalVisible, setRoomModalVisible] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Record<string, unknown> | null>(null)
  const [roomForm] = Form.useForm()

  // 预约记录相关状态
  const [bookings, setBookings] = useState<Record<string, unknown>[]>([])
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingModalVisible, setBookingModalVisible] = useState(false)
  const [bookingForm] = Form.useForm()

  // ===================== 日程操作 =====================

  // 构建日程查询参数
  const buildScheduleParams = () => {
    const values = scheduleSearchForm.getFieldsValue()
    const params: Record<string, unknown> = {}
    if (values.dateRange && values.dateRange.length === 2) {
      params.startDate = values.dateRange[0].format('YYYY-MM-DD 00:00:00')
      params.endDate = values.dateRange[1].format('YYYY-MM-DD 23:59:59')
    }
    if (values.status) params.status = values.status
    return params
  }

  // 拉取日程列表
  const fetchSchedules = async () => {
    setScheduleLoading(true)
    try {
      const params = buildScheduleParams()
      const res = await getSchedules(params)
      setSchedules((res as Record<string, unknown>[]) || [])
    } catch (error) {
      message.error('获取日程列表失败')
    } finally {
      setScheduleLoading(false)
    }
  }

  // 新增日程
  const handleAddSchedule = () => {
    setEditingSchedule(null)
    scheduleForm.resetFields()
    scheduleForm.setFieldsValue({
      all_day: false,
      reminder_type: 'none',
      participant_ids: [],
    })
    setScheduleModalVisible(true)
  }

  // 编辑日程
  const handleEditSchedule = (record: Record<string, unknown>) => {
    setEditingSchedule(record)
    // 反序列化附件：从 JSON 数组字符串转为逗号分隔的展示字符串
    let attachmentsStr = ''
    if (record.attachments) {
      try {
        const arr = JSON.parse(record.attachments as string)
        if (Array.isArray(arr)) {
          attachmentsStr = arr.join(', ')
        } else {
          attachmentsStr = String(record.attachments)
        }
      } catch {
        attachmentsStr = String(record.attachments)
      }
    }
    scheduleForm.setFieldsValue({
      ...record,
      time_range:
        record.start_time && record.end_time
          ? [dayjs(record.start_time as string), dayjs(record.end_time as string)]
          : null,
      all_day: !!record.all_day,
      theme: record.theme || undefined,
      shared_team_id: record.shared_team_id || undefined,
      attachments: attachmentsStr,
      participant_ids: [],
    })
    setScheduleModalVisible(true)
  }

  // 提交日程表单（新增/编辑）
  const handleScheduleSubmit = async (values: Record<string, unknown>) => {
    try {
      // 处理附件：将逗号分隔的字符串转为 JSON 数组字符串
      let attachments: string | null = null
      if (values.attachments) {
        const arr = String(values.attachments)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
        if (arr.length) {
          attachments = JSON.stringify(arr)
        }
      }
      const payload: Record<string, unknown> = {
        title: values.title,
        description: values.description || null,
        start_time: (values.time_range as dayjs.Dayjs[] | undefined)?.[0]
          ? (values.time_range as dayjs.Dayjs[])[0].format('YYYY-MM-DD HH:mm:ss')
          : null,
        end_time: (values.time_range as dayjs.Dayjs[] | undefined)?.[1]
          ? (values.time_range as dayjs.Dayjs[])[1].format('YYYY-MM-DD HH:mm:ss')
          : null,
        all_day: !!values.all_day,
        location: values.location || null,
        related_case_id: values.related_case_id || null,
        reminder_type: values.reminder_type || 'none',
        theme: values.theme || null,
        shared_team_id: values.shared_team_id || null,
        attachments,
      }
      if (editingSchedule) {
        await updateSchedule(editingSchedule.id as string, payload)
        message.success('日程更新成功')
        // 编辑后追加新增的参与人
        if (values.participant_ids && (values.participant_ids as string[]).length) {
          for (const uid of values.participant_ids as string[]) {
            try {
              await addParticipant(editingSchedule.id as string, uid)
            } catch (e) {
              // 单个参与人添加失败不阻塞，继续下一个
            }
          }
        }
      } else {
        const created = (await createSchedule(payload)) as Record<string, unknown>
        message.success('日程创建成功')
        // 创建日程后追加参与人
        if (values.participant_ids && (values.participant_ids as string[]).length && created?.id) {
          for (const uid of values.participant_ids as string[]) {
            try {
              await addParticipant(created.id as string, uid)
            } catch (e) {
              // 单个参与人添加失败不阻塞
            }
          }
        }
      }
      setScheduleModalVisible(false)
      fetchSchedules()
    } catch (error: unknown) {
      message.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || '操作失败')
    }
  }

  // 删除日程
  const handleDeleteSchedule = async (id: string) => {
    try {
      await deleteSchedule(id)
      message.success('删除成功')
      fetchSchedules()
    } catch (error) {
      message.error('删除失败')
    }
  }

  // 日程转工作日志
  const handleConvertToLog = async (id: string) => {
    try {
      await convertToLog(id)
      message.success('已转入工作日志')
    } catch (error: unknown) {
      message.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || '转入失败')
    }
  }

  // 打开参与人管理弹窗
  const handleManageParticipants = async (record: Record<string, unknown>) => {
    setParticipantSchedule(record)
    setNewParticipantId('')
    setParticipantModalVisible(true)
    await fetchParticipants(record.id as string)
  }

  // 拉取参与人列表
  const fetchParticipants = async (scheduleId: string) => {
    setParticipantLoading(true)
    try {
      const list = await listParticipants(scheduleId)
      setParticipantList((list as Record<string, unknown>[]) || [])
    } catch (error) {
      message.error('获取参与人失败')
    } finally {
      setParticipantLoading(false)
    }
  }

  // 添加参与人
  const handleAddParticipant = async () => {
    if (!newParticipantId) {
      message.warning('请输入用户ID')
      return
    }
    try {
      await addParticipant(participantSchedule!.id as string, newParticipantId)
      message.success('参与人添加成功')
      setNewParticipantId('')
      fetchParticipants(participantSchedule!.id as string)
    } catch (error: unknown) {
      message.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || '添加失败')
    }
  }

  // ===================== 会议室操作 =====================

  // 拉取会议室列表
  const fetchRooms = async () => {
    setRoomLoading(true)
    try {
      const res = await getMeetingRooms()
      setRooms((res as Record<string, unknown>[]) || [])
    } catch (error) {
      message.error('获取会议室列表失败')
    } finally {
      setRoomLoading(false)
    }
  }

  // 新增/编辑会议室
  const handleAddRoom = () => {
    setEditingRoom(null)
    roomForm.resetFields()
    roomForm.setFieldsValue({ capacity: 10, status: 'available' })
    setRoomModalVisible(true)
  }

  const handleEditRoom = (record: Record<string, unknown>) => {
    setEditingRoom(record)
    roomForm.setFieldsValue({
      ...record,
      capacity: Number(record.capacity) || 0,
    })
    setRoomModalVisible(true)
  }

  const handleRoomSubmit = async (values: Record<string, unknown>) => {
    try {
      const payload = {
        name: values.name,
        location: values.location || null,
        capacity: Number(values.capacity) || 0,
        status: values.status || 'available',
      }
      if (editingRoom) {
        await updateMeetingRoom(editingRoom.id as string, payload)
        message.success('会议室更新成功')
      } else {
        await createMeetingRoom(payload)
        message.success('会议室创建成功')
      }
      setRoomModalVisible(false)
      fetchRooms()
    } catch (error: unknown) {
      message.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || '操作失败')
    }
  }

  const handleDeleteRoom = async (id: string) => {
    try {
      await deleteMeetingRoom(id)
      message.success('删除成功')
      fetchRooms()
    } catch (error) {
      message.error('删除失败')
    }
  }

  // ===================== 会议室预约操作 =====================

  // 拉取预约记录
  const fetchBookings = async () => {
    setBookingLoading(true)
    try {
      const res = await getMeetingRoomBookings()
      setBookings((res as Record<string, unknown>[]) || [])
    } catch (error) {
      message.error('获取预约记录失败')
    } finally {
      setBookingLoading(false)
    }
  }

  // 新建预约
  const handleAddBooking = () => {
    bookingForm.resetFields()
    bookingForm.setFieldsValue({})
    setBookingModalVisible(true)
  }

  const handleBookingSubmit = async (values: Record<string, unknown>) => {
    try {
      if (!values.room_id) {
        message.warning('请选择会议室')
        return
      }
      if (!values.schedule_id) {
        message.warning('请输入关联日程ID')
        return
      }
      if (!values.time_range || (values.time_range as dayjs.Dayjs[]).length !== 2) {
        message.warning('请选择预约时间段')
        return
      }
      const timeRange = values.time_range as dayjs.Dayjs[]
      const payload = {
        room_id: values.room_id,
        schedule_id: values.schedule_id,
        start_time: timeRange[0].format('YYYY-MM-DD HH:mm:ss'),
        end_time: timeRange[1].format('YYYY-MM-DD HH:mm:ss'),
      }
      await createBooking(payload)
      message.success('预约提交成功')
      setBookingModalVisible(false)
      fetchBookings()
    } catch (error: unknown) {
      message.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || '操作失败')
    }
  }

  // 审批通过
  const handleApproveBooking = async (id: string) => {
    try {
      await approveBooking(id)
      message.success('已批准该预约')
      fetchBookings()
    } catch (error: unknown) {
      message.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || '操作失败')
    }
  }

  // 拒绝预约
  const handleRejectBooking = async (id: string) => {
    try {
      await rejectBooking(id)
      message.success('已拒绝该预约')
      fetchBookings()
    } catch (error: unknown) {
      message.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || '操作失败')
    }
  }

  // 查询/重置
  const handleScheduleSearch = () => {
    fetchSchedules()
  }

  const handleScheduleReset = () => {
    scheduleSearchForm.resetFields()
    fetchSchedules()
  }

  // 初始加载
  useEffect(() => {
    if (activeTab === 'schedule') {
      fetchSchedules()
    } else if (activeTab === 'meeting') {
      fetchRooms()
      fetchBookings()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // 初始拉取一次日程
  useEffect(() => {
    fetchSchedules()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ===================== 表格列定义 =====================

  // 日程列表列
  const scheduleColumns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
    },
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
      title: '全天',
      dataIndex: 'all_day',
      key: 'all_day',
      width: 70,
      render: (v: boolean) => (
        <Tag className={v ? 'stitch-tag stitch-tag-primary' : 'stitch-tag stitch-tag-info'}>{v ? '是' : '否'}</Tag>
      ),
    },
    {
      title: '地点',
      dataIndex: 'location',
      key: 'location',
      width: 140,
      render: (v: string) => v || '-',
      ellipsis: true,
    },
    {
      title: '提醒',
      dataIndex: 'reminder_type',
      key: 'reminder_type',
      width: 110,
      render: (v: string) => {
        const cfg = reminderTypeMap[v] || { label: v, color: 'stitch-tag stitch-tag-info' }
        return <Tag className={cfg.color}>{cfg.label}</Tag>
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (v: string) => {
        const cfg = scheduleStatusMap[v] || { label: v, color: 'stitch-tag stitch-tag-info' }
        return <Tag className={cfg.color}>{cfg.label}</Tag>
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 320,
      render: (_: unknown, record: Record<string, unknown>) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditSchedule(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => handleManageParticipants(record)}
          >
            参与人
          </Button>
          <Popconfirm
            title="确认转日志"
            description="确定将该日程转入工作日志吗？"
            okText="确定"
            cancelText="取消"
            onConfirm={() => handleConvertToLog(record.id as string)}
          >
            <Button type="link" size="small" icon={<FileTextOutlined />}>
              转日志
            </Button>
          </Popconfirm>
          <Popconfirm
            title="确认删除"
            description="确定要删除该日程吗？"
            okText="确定"
            cancelText="取消"
            onConfirm={() => handleDeleteSchedule(record.id as string)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // 会议室列表列
  const roomColumns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
      render: (v: string) => v || '-',
    },
    {
      title: '容纳人数',
      dataIndex: 'capacity',
      key: 'capacity',
      width: 100,
      render: (v: number) => `${Number(v || 0)}人`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => {
        const cfg = roomStatusMap[v] || { label: v, color: 'stitch-tag stitch-tag-info' }
        return <Tag className={cfg.color}>{cfg.label}</Tag>
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: Record<string, unknown>) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditRoom(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除该会议室吗？"
            okText="确定"
            cancelText="取消"
            onConfirm={() => handleDeleteRoom(record.id as string)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // 预约记录列
  const bookingColumns = [
    {
      title: '会议室',
      dataIndex: ['room', 'name'],
      key: 'room_name',
      width: 140,
      render: (_: unknown, record: Record<string, unknown>) =>
        String((record.room as { name?: string } | undefined)?.name || record.room_id || '-'),
    },
    {
      title: '预约日期',
      dataIndex: 'booking_date',
      key: 'booking_date',
      width: 120,
      render: (v: string) => (v ? v.slice(0, 10) : '-'),
    },
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
      title: '预约人',
      dataIndex: 'booker_id',
      key: 'booker_id',
      width: 130,
      render: (v: string) => (v ? v.slice(0, 8) : '-'),
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => {
        const cfg = bookingStatusMap[v] || { label: v, color: 'stitch-tag stitch-tag-info' }
        return <Tag className={cfg.color}>{cfg.label}</Tag>
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: unknown, record: Record<string, unknown>) =>
        record.status === 'pending' ? (
          <Space>
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleApproveBooking(record.id as string)}
            >
              批准
            </Button>
            <Button
              type="link"
              size="small"
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => handleRejectBooking(record.id as string)}
            >
              拒绝
            </Button>
          </Space>
        ) : (
          <span style={{ color: theme.textTertiary }}>-</span>
        ),
    },
  ]

  // 参与人列表列
  const participantColumns = [
    {
      title: '用户ID',
      dataIndex: 'user_id',
      key: 'user_id',
      render: (v: string) => v || '-',
    },
    {
      title: '响应状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => {
        const cfg = participantStatusMap[v] || { label: v, color: 'stitch-tag stitch-tag-info' }
        return <Tag className={cfg.color}>{cfg.label}</Tag>
      },
    },
    {
      title: '添加时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v: string) => formatDateTime(v),
    },
  ]

  // Tab 配置
  const tabItems = [
    {
      key: 'schedule',
      label: '日程管理',
      children: (
        <>
          {/* 查询表单：日期范围、状态筛选 */}
          <div
            className="stitch-filter-bar"
            style={{
              background: '#fff',
              padding: 16,
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <Form form={scheduleSearchForm} layout="inline" style={{ gap: 8 }}>
              <Form.Item name="dateRange" label="日期范围">
                <RangePicker style={{ width: 260 }} />
              </Form.Item>
              <Form.Item name="status" label="状态">
                <Select
                  placeholder="全部"
                  allowClear
                  style={{ width: 120 }}
                  options={[
                    { value: 'active', label: '有效' },
                    { value: 'cancelled', label: '已取消' },
                    { value: 'done', label: '已完成' },
                  ]}
                />
              </Form.Item>
              <Form.Item>
                <div className="stitch-btn-group">
                  <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    onClick={handleScheduleSearch}
                  >
                    查询
                  </Button>
                  <Button icon={<ReloadOutlined />} onClick={handleScheduleReset}>
                    重置
                  </Button>
                </div>
              </Form.Item>
            </Form>
          </div>

          <div
            style={{
              background: '#fff',
              padding: 16,
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                marginBottom: 16,
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddSchedule}
              >
                新增日程
              </Button>
            </div>
            <div className="stitch-table">
              <Table
                dataSource={schedules}
                columns={scheduleColumns}
                loading={scheduleLoading}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
              />
            </div>
          </div>
        </>
      ),
    },
    {
      key: 'meeting',
      label: '会议室',
      children: (
        <>
          {/* 上半部分：会议室列表 */}
          <Card
            title="会议室列表"
            style={{ marginBottom: 16 }}
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddRoom}
              >
                新增会议室
              </Button>
            }
          >
            <div className="stitch-table">
              <Table
                dataSource={rooms}
                columns={roomColumns}
                loading={roomLoading}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
              />
            </div>
          </Card>

          {/* 下半部分：预约记录 */}
          <Card
            title="预约记录"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddBooking}
              >
                新增预约
              </Button>
            }
          >
            <div className="stitch-table">
              <Table
                dataSource={bookings}
                columns={bookingColumns}
                loading={bookingLoading}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
              />
            </div>
          </Card>
        </>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>日程管理</h2>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />

      {/* 新增/编辑日程弹窗 */}
      <Modal
        title={editingSchedule ? '编辑日程' : '新增日程'}
        open={scheduleModalVisible}
        onCancel={() => setScheduleModalVisible(false)}
        onOk={() => scheduleForm.submit()}
        width={640}
        okText="保存"
        cancelText="取消"
      >
        <Form form={scheduleForm} onFinish={handleScheduleSubmit} layout="vertical">
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入日程标题" />
          </Form.Item>
          <Form.Item
            name="time_range"
            label="时间"
            rules={[{ required: true, message: '请选择时间范围' }]}
          >
            <RangePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="all_day" label="是否全天" valuePropName="checked">
            <Switch checkedChildren="全天" unCheckedChildren="非全天" />
          </Form.Item>
          <Form.Item name="location" label="地点">
            <Input placeholder="请输入地点" allowClear />
          </Form.Item>
          <Form.Item name="related_case_id" label="关联案件">
            <Input placeholder="请输入案件ID（可空）" allowClear />
          </Form.Item>
          <Form.Item name="reminder_type" label="提醒">
            <Select options={reminderOptions} placeholder="请选择提醒方式" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入描述（可空）" />
          </Form.Item>
          <Form.Item name="theme" label="主题">
            <Input placeholder="请输入主题（可空）" allowClear />
          </Form.Item>
          <Form.Item name="shared_team_id" label="共享团队">
            <Input placeholder="请输入共享团队ID或名称（可空）" allowClear />
          </Form.Item>
          <Form.Item
            name="attachments"
            label="附件"
            extra="输入附件URL或名称，多个用逗号分隔"
          >
            <Input.TextArea
              rows={2}
              placeholder="例如：文件1.pdf, 文件2.docx"
            />
          </Form.Item>
          <Form.Item
            name="participant_ids"
            label="参与人"
            extra="输入用户ID后回车添加多个参与人；编辑时此处仅追加新参与人，已有参与人请在弹窗中管理"
          >
            <Select
              mode="tags"
              placeholder="输入用户ID并回车添加"
              style={{ width: '100%' }}
              tokenSeparators={[',', ' ']}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 参与人管理弹窗 */}
      <Modal
        title={`参与人管理 - ${participantSchedule?.title || ''}`}
        open={participantModalVisible}
        onCancel={() => setParticipantModalVisible(false)}
        footer={null}
        width={640}
      >
        <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
          <Input
            placeholder="请输入用户ID"
            value={newParticipantId}
            onChange={(e) => setNewParticipantId(e.target.value)}
            onPressEnter={handleAddParticipant}
            allowClear
          />
          <Button type="primary" onClick={handleAddParticipant}>
            添加
          </Button>
        </div>
        <div className="stitch-table">
          <Table
            dataSource={participantList}
            columns={participantColumns}
            loading={participantLoading}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 10 }}
          />
        </div>
      </Modal>

      {/* 新增/编辑会议室弹窗 */}
      <Modal
        title={editingRoom ? '编辑会议室' : '新增会议室'}
        open={roomModalVisible}
        onCancel={() => setRoomModalVisible(false)}
        onOk={() => roomForm.submit()}
        width={520}
        okText="保存"
        cancelText="取消"
      >
        <Form form={roomForm} onFinish={handleRoomSubmit} layout="vertical">
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入会议室名称' }]}
          >
            <Input placeholder="请输入会议室名称" />
          </Form.Item>
          <Form.Item name="location" label="位置">
            <Input placeholder="请输入位置" allowClear />
          </Form.Item>
          <Form.Item name="capacity" label="容纳人数">
            <InputNumber min={0} step={1} style={{ width: '100%' }} addonAfter="人" />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select
              options={[
                { value: 'available', label: '可用' },
                { value: 'inactive', label: '停用' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 新增预约弹窗 */}
      <Modal
        title="新增预约"
        open={bookingModalVisible}
        onCancel={() => setBookingModalVisible(false)}
        onOk={() => bookingForm.submit()}
        width={520}
        okText="提交"
        cancelText="取消"
      >
        <Form form={bookingForm} onFinish={handleBookingSubmit} layout="vertical">
          <Form.Item
            name="room_id"
            label="会议室"
            rules={[{ required: true, message: '请选择会议室' }]}
          >
            <Select
              placeholder="请选择会议室"
              options={rooms
                .filter((r) => r.status === 'available')
                .map((r) => ({ value: r.id, label: `${r.name}(${r.location || '-'})` }))}
            />
          </Form.Item>
          <Form.Item
            name="schedule_id"
            label="关联日程ID"
            rules={[{ required: true, message: '请输入关联日程ID' }]}
          >
            <Input placeholder="请输入关联日程ID" />
          </Form.Item>
          <Form.Item
            name="time_range"
            label="预约时间"
            rules={[{ required: true, message: '请选择预约时间' }]}
          >
            <RangePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
