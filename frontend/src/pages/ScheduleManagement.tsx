import { useState, useEffect, useMemo, useCallback } from 'react'
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
  Row,
  Col,
  Empty,
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
  CalendarOutlined,
  ClockCircleOutlined,
  BellOutlined,
  LeftOutlined,
  RightOutlined,
  EyeOutlined,
  UserOutlined,
} from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import {
  getSchedules,
  getMySchedules,
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
import { formatDateTime, formatDate } from '../utils/format'

const { RangePicker } = DatePicker

// 视图类型
type ViewType = 'day' | 'week' | 'month'

// 统计数据接口
interface ScheduleStats {
  today: number
  week: number
  month: number
  reminder: number
}

// 优先级配置（复用提醒类型的颜色）
const priorityConfig: Record<string, { label: string; color: string; dot: string }> = {
  none: { label: '普通', color: 'stitch-tag stitch-tag-info', dot: '#8c8c8c' },
  before5min: { label: '紧急', color: 'stitch-tag stitch-tag-error', dot: '#f5222d' },
  before15min: { label: '重要', color: 'stitch-tag stitch-tag-warning', dot: '#fa8c16' },
  before1hour: { label: '较重要', color: 'stitch-tag stitch-tag-gold', dot: '#faad14' },
  before1day: { label: '一般', color: 'stitch-tag stitch-tag-success', dot: '#52c41a' },
}

// 提醒类型选项
const reminderOptions = [
  { value: 'none', label: '不提醒' },
  { value: 'before5min', label: '提前5分钟' },
  { value: 'before15min', label: '提前15分钟' },
  { value: 'before1hour', label: '提前1小时' },
  { value: 'before1day', label: '提前1天' },
]

// 日程状态中文映射
const scheduleStatusMap: Record<string, { label: string; color: string }> = {
  active: { label: '有效', color: 'stitch-tag stitch-tag-success' },
  cancelled: { label: '已取消', color: 'stitch-tag stitch-tag-error' },
  done: { label: '已完成', color: 'stitch-tag stitch-tag-primary' },
}

const statusOptions = [
  { value: 'active', label: '有效' },
  { value: 'cancelled', label: '已取消' },
  { value: 'done', label: '已完成' },
]

// 会议室状态中文映射
const roomStatusMap: Record<string, { label: string; color: string }> = {
  available: { label: '可用', color: 'stitch-tag stitch-tag-success' },
  inactive: { label: '停用', color: 'stitch-tag stitch-tag-info' },
}

// 参与人响应状态中文映射
const participantStatusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待响应', color: 'stitch-tag stitch-tag-warning' },
  accepted: { label: '已接受', color: 'stitch-tag stitch-tag-success' },
  declined: { label: '已拒绝', color: 'stitch-tag stitch-tag-error' },
}

// 预约状态中文映射
const bookingStatusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待审批', color: 'stitch-tag stitch-tag-warning' },
  approved: { label: '已批准', color: 'stitch-tag stitch-tag-success' },
  rejected: { label: '已拒绝', color: 'stitch-tag stitch-tag-error' },
}

// 周中文映射
const weekDays = ['日', '一', '二', '三', '四', '五', '六']
const weekDaysFull = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export default function ScheduleManagement() {
  // Tab状态
  const [activeTab, setActiveTab] = useState('schedule')
  
  // 视图状态
  const [view, setView] = useState<ViewType>('week')
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs())
  
  // 日程相关状态
  const [, setSchedules] = useState<any[]>([])
  const [mySchedules, setMySchedules] = useState<any[]>([])
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false)
  const [viewDetailVisible, setViewDetailVisible] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<any | null>(null)
  const [currentSchedule, setCurrentSchedule] = useState<any | null>(null)
  const [scheduleForm] = Form.useForm()
  const [scheduleSearchForm] = Form.useForm()
  const [participantModalVisible, setParticipantModalVisible] = useState(false)
  const [participantSchedule, setParticipantSchedule] = useState<any | null>(null)
  const [participantList, setParticipantList] = useState<any[]>([])
  const [participantLoading, setParticipantLoading] = useState(false)
  const [newParticipantId, setNewParticipantId] = useState('')
  
  // 筛选状态
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  
  // 会议室相关状态
  const [rooms, setRooms] = useState<any[]>([])
  const [roomLoading, setRoomLoading] = useState(false)
  const [roomModalVisible, setRoomModalVisible] = useState(false)
  const [editingRoom, setEditingRoom] = useState<any | null>(null)
  const [roomForm] = Form.useForm()
  
  // 预约记录相关状态
  const [bookings, setBookings] = useState<any[]>([])
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingModalVisible, setBookingModalVisible] = useState(false)
  const [bookingForm] = Form.useForm()

  // 计算统计数据
  const stats: ScheduleStats = useMemo(() => {
    const todayStr = dayjs().format('YYYY-MM-DD')
    const weekStart = dayjs().startOf('week')
    const weekEnd = dayjs().endOf('week')
    const monthStart = dayjs().startOf('month')
    const monthEnd = dayjs().endOf('month')
    
    const todayEvents = mySchedules.filter((e) => {
      const startTime = dayjs(e.start_time)
      return startTime.format('YYYY-MM-DD') === todayStr
    })
    
    const weekEvents = mySchedules.filter((e) => {
      const startTime = dayjs(e.start_time)
      return startTime.isAfter(weekStart) && startTime.isBefore(weekEnd)
    })
    
    const monthEvents = mySchedules.filter((e) => {
      const startTime = dayjs(e.start_time)
      return startTime.isAfter(monthStart) && startTime.isBefore(monthEnd)
    })
    
    const reminderCount = mySchedules.filter((e) => 
      e.reminder_type && e.reminder_type !== 'none'
    ).length

    return {
      today: todayEvents.length,
      week: weekEvents.length,
      month: monthEvents.length,
      reminder: reminderCount,
    }
  }, [mySchedules])

  // 过滤日程数据
  const filteredSchedules = useMemo(() => {
    let result = [...mySchedules]
    
    // 按提醒类型筛选（映射为优先级概念）
    if (filterPriority !== 'all') {
      result = result.filter((e) => e.reminder_type === filterPriority)
    }
    
    // 搜索筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter((e) =>
        (e.title || '').toLowerCase().includes(query) ||
        (e.location || '').toLowerCase().includes(query) ||
        (e.description || '').toLowerCase().includes(query)
      )
    }
    
    // 按时间排序
    return result.sort((a, b) => {
      const timeA = dayjs(a.start_time)
      const timeB = dayjs(b.start_time)
      return timeA.isBefore(timeB) ? -1 : 1
    })
  }, [mySchedules, filterPriority, searchQuery])

  // 获取当前视图的日程
  const viewSchedules = useMemo(() => {
    if (view === 'day') {
      return filteredSchedules.filter((e) => {
        const startTime = dayjs(e.start_time)
        return startTime.format('YYYY-MM-DD') === currentDate.format('YYYY-MM-DD')
      })
    }
    if (view === 'week') {
      const weekStart = currentDate.startOf('week')
      const weekEnd = currentDate.endOf('week')
      return filteredSchedules.filter((e) => {
        const startTime = dayjs(e.start_time)
        return startTime.isAfter(weekStart) && startTime.isBefore(weekEnd)
      })
    }
    // month view
    const monthStart = currentDate.startOf('month')
    const monthEnd = currentDate.endOf('month')
    return filteredSchedules.filter((e) => {
      const startTime = dayjs(e.start_time)
      return startTime.isAfter(monthStart) && startTime.isBefore(monthEnd)
    })
  }, [filteredSchedules, currentDate, view])

  // 获取视图标题
  const getViewTitle = useCallback(() => {
    if (view === 'day') {
      return `${currentDate.year()}年${currentDate.month() + 1}月${currentDate.date()}日 周${weekDays[currentDate.day()]}`
    }
    if (view === 'week') {
      const start = currentDate.startOf('week')
      const end = currentDate.endOf('week')
      return `${start.month() + 1}月${start.date()}日 - ${end.month() + 1}月${end.date()}日`
    }
    return `${currentDate.year()}年${currentDate.month() + 1}月`
  }, [currentDate, view])

  // 日期导航
  const navigateDate = (direction: 'prev' | 'next') => {
    if (view === 'day') {
      setCurrentDate(currentDate.add(direction === 'next' ? 1 : -1, 'day'))
    } else if (view === 'week') {
      setCurrentDate(currentDate.add(direction === 'next' ? 7 : -7, 'day'))
    } else {
      setCurrentDate(currentDate.add(direction === 'next' ? 1 : -1, 'month'))
    }
  }

  // 构建日程查询参数
  const buildScheduleParams = () => {
    const values = scheduleSearchForm.getFieldsValue()
    const params: Record<string, unknown> = {}
    if (values.dateRange && values.dateRange.length === 2) {
      params.startDate = values.dateRange[0].format('YYYY-MM-DD HH:mm:ss')
      params.endDate = values.dateRange[1].format('YYYY-MM-DD HH:mm:ss')
    }
    if (values.status) params.status = values.status
    return params
  }

  // 拉取日程列表
  const fetchSchedules = async () => {
    setScheduleLoading(true)
    try {
      const params = buildScheduleParams()
      const [allRes, myRes]: any = await Promise.all([
        getSchedules(params),
        getMySchedules(),
      ])
      setSchedules(allRes || [])
      setMySchedules(myRes || [])
    } catch (error) {
      message.error('获取日程列表失败')
    } finally {
      setScheduleLoading(false)
    }
  }

  // 拉取会议室列表
  const fetchRooms = async () => {
    setRoomLoading(true)
    try {
      const res = (await getMeetingRooms()) as unknown as any[]
      setRooms(res || [])
    } catch (error) {
      message.error('获取会议室列表失败')
    } finally {
      setRoomLoading(false)
    }
  }

  // 拉取预约记录
  const fetchBookings = async () => {
    setBookingLoading(true)
    try {
      const res = (await getMeetingRoomBookings()) as unknown as any[]
      setBookings(res || [])
    } catch (error) {
      message.error('获取预约记录失败')
    } finally {
      setBookingLoading(false)
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
      time_range: [dayjs().hour(9).minute(0), dayjs().hour(10).minute(0)],
    })
    setScheduleModalVisible(true)
  }

  // 编辑日程
  const handleEditSchedule = (record: any) => {
    setEditingSchedule(record)
    let attachmentsStr = ''
    if (record.attachments) {
      try {
        const arr = JSON.parse(record.attachments)
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
          ? [dayjs(record.start_time), dayjs(record.end_time)]
          : null,
      all_day: !!record.all_day,
      theme: record.theme || undefined,
      shared_team_id: record.shared_team_id || undefined,
      attachments: attachmentsStr,
      participant_ids: [],
    })
    setScheduleModalVisible(true)
  }

  // 查看日程详情
  const handleViewSchedule = (record: any) => {
    setCurrentSchedule(record)
    setViewDetailVisible(true)
  }

  // 提交日程表单
  const handleScheduleSubmit = async (values: any) => {
    try {
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
      const payload: any = {
        title: values.title,
        description: values.description || null,
        start_time: values.time_range?.[0]
          ? values.time_range[0].format('YYYY-MM-DD HH:mm:ss')
          : null,
        end_time: values.time_range?.[1]
          ? values.time_range[1].format('YYYY-MM-DD HH:mm:ss')
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
        await updateSchedule(editingSchedule.id, payload)
        message.success('日程更新成功')
        if (values.participant_ids && values.participant_ids.length) {
          for (const uid of values.participant_ids) {
            try {
              await addParticipant(editingSchedule.id, uid)
            } catch {
              // 忽略单个参与人添加失败
            }
          }
        }
      } else {
        const created: any = await createSchedule(payload)
        message.success('日程创建成功')
        if (values.participant_ids && values.participant_ids.length && created?.id) {
          for (const uid of values.participant_ids) {
            try {
              await addParticipant(created.id, uid)
            } catch {
              // 忽略单个参与人添加失败
            }
          }
        }
      }
      setScheduleModalVisible(false)
      fetchSchedules()
    } catch (error: any) {
      message.error(error?.response?.data?.message || '操作失败')
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
    } catch (error: any) {
      message.error(error?.response?.data?.message || '转入失败')
    }
  }

  // 打开参与人管理弹窗
  const handleManageParticipants = async (record: any) => {
    setParticipantSchedule(record)
    setNewParticipantId('')
    setParticipantModalVisible(true)
    await fetchParticipants(record.id)
  }

  // 拉取参与人列表
  const fetchParticipants = async (scheduleId: string) => {
    setParticipantLoading(true)
    try {
      const list = await listParticipants(scheduleId)
      setParticipantList((list as any[]) || [])
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
      await addParticipant(participantSchedule!.id, newParticipantId)
      message.success('参与人添加成功')
      setNewParticipantId('')
      fetchParticipants(participantSchedule!.id)
    } catch (error: any) {
      message.error(error?.response?.data?.message || '添加失败')
    }
  }

  // 新增/编辑会议室
  const handleAddRoom = () => {
    setEditingRoom(null)
    roomForm.resetFields()
    roomForm.setFieldsValue({ capacity: 10, status: 'available' })
    setRoomModalVisible(true)
  }

  const handleEditRoom = (record: any) => {
    setEditingRoom(record)
    roomForm.setFieldsValue({
      ...record,
      capacity: Number(record.capacity) || 0,
    })
    setRoomModalVisible(true)
  }

  const handleRoomSubmit = async (values: any) => {
    try {
      const payload = {
        name: values.name,
        location: values.location || null,
        capacity: Number(values.capacity) || 0,
        status: values.status || 'available',
      }
      if (editingRoom) {
        await updateMeetingRoom(editingRoom.id, payload)
        message.success('会议室更新成功')
      } else {
        await createMeetingRoom(payload)
        message.success('会议室创建成功')
      }
      setRoomModalVisible(false)
      fetchRooms()
    } catch (error: any) {
      message.error(error?.response?.data?.message || '操作失败')
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

  // 会议室预约操作
  const handleAddBooking = () => {
    bookingForm.resetFields()
    setBookingModalVisible(true)
  }

  const handleBookingSubmit = async (values: any) => {
    try {
      if (!values.room_id) {
        message.warning('请选择会议室')
        return
      }
      if (!values.schedule_id) {
        message.warning('请输入关联日程ID')
        return
      }
      if (!values.time_range || values.time_range.length !== 2) {
        message.warning('请选择预约时间段')
        return
      }
      const timeRange = values.time_range as Dayjs[]
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
    } catch (error: any) {
      message.error(error?.response?.data?.message || '操作失败')
    }
  }

  const handleApproveBooking = async (id: string) => {
    try {
      await approveBooking(id)
      message.success('已批准该预约')
      fetchBookings()
    } catch (error: any) {
      message.error(error?.response?.data?.message || '操作失败')
    }
  }

  const handleRejectBooking = async (id: string) => {
    try {
      await rejectBooking(id)
      message.success('已拒绝该预约')
      fetchBookings()
    } catch (error: any) {
      message.error(error?.response?.data?.message || '操作失败')
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
  }, [activeTab])

  useEffect(() => {
    fetchSchedules()
  }, [])

  // ==================== 表格列定义 ====================

  // 日程列表列（增强版）
  const scheduleColumns = [
    {
      title: '时间',
      key: 'time',
      width: 180,
      render: (_: any, record: any) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {formatDateTime(record.start_time)}
          </div>
          <div style={{ color: '#717785', fontSize: 12 }}>
            至 {formatDateTime(record.end_time)}
          </div>
        </div>
      ),
    },
    {
      title: '日程',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
      render: (title: string, record: any) => (
        <div>
          <div style={{ fontWeight: 500 }}>{title}</div>
          {record.description && (
            <div style={{ color: '#717785', fontSize: 12, marginTop: 2 }}>
              {record.description.length > 30 ? record.description.slice(0, 30) + '...' : record.description}
            </div>
          )}
        </div>
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
      title: '重要性',
      dataIndex: 'reminder_type',
      key: 'reminder_type',
      width: 110,
      render: (v: string) => {
        const cfg = priorityConfig[v] || priorityConfig.none
        return (
          <Tag className={cfg.color}>
            <span style={{ 
              display: 'inline-block', 
              width: 6, 
              height: 6, 
              borderRadius: '50%', 
              backgroundColor: cfg.dot,
              marginRight: 6 
            }} />
            {cfg.label}
          </Tag>
        )
      },
    },
    {
      title: '全天',
      dataIndex: 'all_day',
      key: 'all_day',
      width: 70,
      render: (v: boolean) => (
        <Tag className={v ? 'stitch-tag stitch-tag-primary' : 'stitch-tag stitch-tag-info'}>
          {v ? '是' : '否'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (v: string) => {
        const cfg = scheduleStatusMap[v] || scheduleStatusMap.active
        return <Tag className={cfg.color}>{cfg.label}</Tag>
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewSchedule(record)}
          >
            查看
          </Button>
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
            icon={<UserOutlined />}
            onClick={() => handleManageParticipants(record)}
          >
            参与人
          </Button>
          <Popconfirm
            title="确认转日志"
            description="确定将该日程转入工作日志吗？"
            okText="确定"
            cancelText="取消"
            onConfirm={() => handleConvertToLog(record.id)}
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
            onConfirm={() => handleDeleteSchedule(record.id)}
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
        const cfg = roomStatusMap[v] || roomStatusMap.available
        return <Tag className={cfg.color}>{cfg.label}</Tag>
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: any) => (
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
            onConfirm={() => handleDeleteRoom(record.id)}
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
      render: (_: any, record: any) =>
        String(record.room?.name || record.room_id || '-'),
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
        const cfg = bookingStatusMap[v] || bookingStatusMap.pending
        return <Tag className={cfg.color}>{cfg.label}</Tag>
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: any) =>
        record.status === 'pending' ? (
          <Space>
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleApproveBooking(record.id)}
            >
              批准
            </Button>
            <Button
              type="link"
              size="small"
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => handleRejectBooking(record.id)}
            >
              拒绝
            </Button>
          </Space>
        ) : (
          <span style={{ color: '#717785' }}>-</span>
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
        const cfg = participantStatusMap[v] || participantStatusMap.pending
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

  // ==================== 视图渲染 ====================

  // 日视图
  const renderDayView = () => {
    const dayEvents = viewSchedules.filter((e) => {
      const startTime = dayjs(e.start_time)
      return startTime.format('YYYY-MM-DD') === currentDate.format('YYYY-MM-DD')
    })

    return (
      <Card>
        <Card>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid #e2e2e4'
          }}>
            <Space>
              <Button icon={<LeftOutlined />} onClick={() => navigateDate('prev')} />
              <Button onClick={() => setCurrentDate(dayjs())}>今天</Button>
              <Button icon={<RightOutlined />} onClick={() => navigateDate('next')} />
              <span style={{ fontWeight: 600, marginLeft: 12 }}>
                {getViewTitle()}
              </span>
              <Tag color="blue">共 {dayEvents.length} 项</Tag>
            </Space>
            <Space>
              <Button
                size="small"
                type={view === 'day' ? 'primary' : 'default'}
                onClick={() => setView('day')}
              >
                日
              </Button>
              <Button
                size="small"
                type={view === 'week' ? 'primary' : 'default'}
                onClick={() => setView('week')}
              >
                周
              </Button>
              <Button
                size="small"
                type={view === 'month' ? 'primary' : 'default'}
                onClick={() => setView('month')}
              >
                月
              </Button>
            </Space>
          </div>
        </Card>
        
        <div style={{ padding: 20 }}>
          {dayEvents.length === 0 ? (
            <Empty
              image={<CalendarOutlined style={{ fontSize: 48, opacity: 0.3 }} />}
              description="当日暂无日程安排"
            />
          ) : (
            <Table
              dataSource={dayEvents}
              columns={scheduleColumns}
              rowKey="id"
              loading={scheduleLoading}
              pagination={false}
              size="middle"
              scroll={{ x: 1200 }}
            />
          )}
        </div>
      </Card>
    )
  }

  // 周视图
  const renderWeekView = () => {
    const weekStart = currentDate.startOf('week')
    const days: Dayjs[] = []
    for (let i = 0; i < 7; i++) {
      days.push(weekStart.add(i, 'day'))
    }

    return (
      <Card>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid #e2e2e4'
        }}>
          <Space>
            <Button icon={<LeftOutlined />} onClick={() => navigateDate('prev')} />
            <Button onClick={() => setCurrentDate(dayjs())}>今天</Button>
            <Button icon={<RightOutlined />} onClick={() => navigateDate('next')} />
            <span style={{ fontWeight: 600, marginLeft: 12 }}>
              {getViewTitle()}
            </span>
          </Space>
          <Space>
            <Button
              size="small"
              type={view === 'day' ? 'primary' : 'default'}
              onClick={() => setView('day')}
            >
              日
            </Button>
            <Button
              size="small"
              type={view === 'week' ? 'primary' : 'default'}
              onClick={() => setView('week')}
            >
              周
            </Button>
            <Button
              size="small"
              type={view === 'month' ? 'primary' : 'default'}
              onClick={() => setView('month')}
            >
              月
            </Button>
          </Space>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, backgroundColor: '#e2e2e4' }}>
          {days.map((date, index) => {
            const dateStr = date.format('YYYY-MM-DD')
            const dayEvents = viewSchedules
              .filter((e) => dayjs(e.start_time).format('YYYY-MM-DD') === dateStr)
              .sort((a, b) => dayjs(a.start_time).valueOf() - dayjs(b.start_time).valueOf())
            const isToday = date.isSame(dayjs(), 'day')
            
            return (
              <div
                key={dateStr}
                style={{
                  backgroundColor: '#fff',
                  minHeight: 180,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid #e2e2e4',
                    backgroundColor: isToday ? '#e6f4ff' : '#f5f5f5',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setCurrentDate(date)
                    setView('day')
                  }}
                >
                  <div style={{ 
                    fontSize: 13, 
                    fontWeight: 500,
                    color: isToday ? '#1677ff' : '#1a1c1d'
                  }}>
                    {weekDays[index]}
                  </div>
                  <div style={{ 
                    fontSize: 11, 
                    color: '#717785'
                  }}>
                    {date.month() + 1}/{date.date()}
                  </div>
                </div>
                <div style={{ flex: 1, padding: 6, overflow: 'auto' }}>
                  {dayEvents.length === 0 ? (
                    <div style={{ 
                      textAlign: 'center', 
                      fontSize: 11, 
                      color: '#c1c6d6',
                      padding: '8px 0'
                    }}>
                      无日程
                    </div>
                  ) : (
                    dayEvents.map((event) => {
                      const cfg = priorityConfig[event.reminder_type] || priorityConfig.none
                      return (
                        <div
                          key={event.id}
                          onClick={() => handleViewSchedule(event)}
                          style={{
                            padding: '4px 6px',
                            borderRadius: 4,
                            fontSize: 11,
                            cursor: 'pointer',
                            marginBottom: 3,
                            backgroundColor: cfg.dot + '20',
                            borderLeft: `3px solid ${cfg.dot}`,
                          }}
                        >
                          <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {event.title}
                          </div>
                          <div style={{ 
                            fontSize: 10, 
                            color: '#717785',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            <ClockCircleOutlined style={{ fontSize: 10 }} />
                            {dayjs(event.start_time).format('HH:mm')}
                            {event.reminder_type && event.reminder_type !== 'none' && (
                              <BellOutlined style={{ fontSize: 10 }} />
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    )
  }

  // 月视图
  const renderMonthView = () => {
    const monthStart = currentDate.startOf('month')
    const startDay = monthStart.day()
    const daysInMonth = currentDate.daysInMonth()

    const cells: { date: Dayjs | null; isCurrentMonth: boolean }[] = []
    for (let i = 0; i < startDay; i++) {
      const prevMonth = currentDate.startOf('month').subtract(startDay - i, 'day')
      cells.push({ date: prevMonth, isCurrentMonth: false })
    }
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push({
        date: dayjs(currentDate.year() + '-' + (currentDate.month() + 1) + '-' + i),
        isCurrentMonth: true,
      })
    }
    while (cells.length % 7 !== 0) {
      const lastDate = cells[cells.length - 1].date!
      const nextDate = lastDate.add(1, 'day')
      cells.push({ date: nextDate, isCurrentMonth: false })
    }

    return (
      <Card>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid #e2e2e4'
        }}>
          <Space>
            <Button icon={<LeftOutlined />} onClick={() => navigateDate('prev')} />
            <Button onClick={() => setCurrentDate(dayjs())}>今天</Button>
            <Button icon={<RightOutlined />} onClick={() => navigateDate('next')} />
            <span style={{ fontWeight: 600, marginLeft: 12 }}>
              {getViewTitle()}
            </span>
          </Space>
          <Space>
            <Button
              size="small"
              type={view === 'day' ? 'primary' : 'default'}
              onClick={() => setView('day')}
            >
              日
            </Button>
            <Button
              size="small"
              type={view === 'week' ? 'primary' : 'default'}
              onClick={() => setView('week')}
            >
              周
            </Button>
            <Button
              size="small"
              type={view === 'month' ? 'primary' : 'default'}
              onClick={() => setView('month')}
            >
              月
            </Button>
          </Space>
        </div>
        
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', backgroundColor: '#e2e2e4' }}>
            {weekDaysFull.map((d) => (
              <div
                key={d}
                style={{
                  backgroundColor: '#f5f5f5',
                  padding: '10px',
                  textAlign: 'center',
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#414753',
                }}
              >
                {d}
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, backgroundColor: '#e2e2e4' }}>
            {cells.map(({ date, isCurrentMonth }, idx) => {
              if (!date) return <div key={idx} style={{ backgroundColor: '#fff', minHeight: 100 }} />
              const dateStr = date.format('YYYY-MM-DD')
              const dayEvents = viewSchedules.filter((e) => dayjs(e.start_time).format('YYYY-MM-DD') === dateStr)
              const isToday = date.isSame(dayjs(), 'day')
              
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#fff',
                    minHeight: 100,
                    padding: 6,
                    opacity: isCurrentMonth ? 1 : 0.4,
                    cursor: 'pointer',
                    outline: isToday ? '2px solid #1677ff' : 'none',
                    outlineOffset: -2,
                  }}
                  onClick={() => {
                    setCurrentDate(date)
                    setView('day')
                  }}
                >
                  <div style={{ 
                    fontSize: 12, 
                    fontWeight: 500,
                    color: isToday ? '#1677ff' : '#1a1c1d',
                    marginBottom: 4
                  }}>
                    {date.date()}
                  </div>
                  <div>
                    {dayEvents.slice(0, 3).map((event) => {
                      const cfg = priorityConfig[event.reminder_type] || priorityConfig.none
                      return (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewSchedule(event)
                          }}
                          style={{
                            fontSize: 10,
                            padding: '2px 4px',
                            borderRadius: 3,
                            marginBottom: 2,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            backgroundColor: cfg.dot + '20',
                            color: cfg.dot,
                          }}
                        >
                          {dayjs(event.start_time).format('HH:mm')} {event.title}
                        </div>
                      )
                    })}
                    {dayEvents.length > 3 && (
                      <div style={{ fontSize: 10, color: '#717785' }}>
                        +{dayEvents.length - 3} 更多
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </Card>
    )
  }

  // ==================== Tab 配置 ====================
  const tabItems = [
    {
      key: 'schedule',
      label: '日程管理',
      children: (
        <>
          {/* 统计卡片 */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 13, color: '#717785' }}>今日日程</div>
                    <div style={{ fontSize: 28, fontWeight: 600, color: '#1677ff' }}>
                      {stats.today}
                    </div>
                  </div>
                  <div style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 8, 
                    backgroundColor: '#e6f4ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <CalendarOutlined style={{ fontSize: 20, color: '#1677ff' }} />
                  </div>
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 13, color: '#717785' }}>本周日程</div>
                    <div style={{ fontSize: 28, fontWeight: 600, color: '#52c41a' }}>
                      {stats.week}
                    </div>
                  </div>
                  <div style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 8, 
                    backgroundColor: '#f6ffed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <CalendarOutlined style={{ fontSize: 20, color: '#52c41a' }} />
                  </div>
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 13, color: '#717785' }}>本月日程</div>
                    <div style={{ fontSize: 28, fontWeight: 600, color: '#722ed1' }}>
                      {stats.month}
                    </div>
                  </div>
                  <div style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 8, 
                    backgroundColor: '#f9f0ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FileTextOutlined style={{ fontSize: 20, color: '#722ed1' }} />
                  </div>
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 13, color: '#717785' }}>待办提醒</div>
                    <div style={{ fontSize: 28, fontWeight: 600, color: '#fa8c16' }}>
                      {stats.reminder}
                    </div>
                  </div>
                  <div style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 8, 
                    backgroundColor: '#fff7e6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <BellOutlined style={{ fontSize: 20, color: '#fa8c16' }} />
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* 筛选器 */}
          <Card style={{ marginBottom: 16 }}>
            <Form 
              form={scheduleSearchForm} 
              layout="inline" 
              style={{ gap: 8, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}
            >
              <Form.Item name="dateRange" label="日期范围">
                <RangePicker style={{ width: 260 }} />
              </Form.Item>
              <Form.Item name="status" label="状态">
                <Select
                  placeholder="全部"
                  allowClear
                  style={{ width: 120 }}
                  options={statusOptions}
                />
              </Form.Item>
              <Form.Item>
                <div className="stitch-btn-group">
                  <Button type="primary" icon={<SearchOutlined />} onClick={handleScheduleSearch}>
                    查询
                  </Button>
                  <Button icon={<ReloadOutlined />} onClick={handleScheduleReset}>
                    重置
                  </Button>
                </div>
              </Form.Item>
            </Form>
            <div style={{ 
              display: 'flex', 
              gap: 16, 
              alignItems: 'center',
              marginTop: 12,
              paddingTop: 12,
              borderTop: '1px solid #e2e2e4'
            }}>
              <Input.Search
                placeholder="搜索日程标题、地点、描述"
                allowClear
                style={{ width: 280 }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Select
                placeholder="重要性"
                style={{ width: 140 }}
                value={filterPriority}
                onChange={(value) => setFilterPriority(value)}
                options={[
                  { value: 'all', label: '全部' },
                  ...reminderOptions.filter(o => o.value !== 'none'),
                ]}
              />
              <div style={{ flex: 1 }} />
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddSchedule}>
                新建日程
              </Button>
            </div>
          </Card>

          {/* 视图切换和日历 */}
          <div style={{ marginBottom: 16 }}>
            {view === 'day' && renderDayView()}
            {view === 'week' && renderWeekView()}
            {view === 'month' && renderMonthView()}
          </div>

          {/* 日程列表 */}
          <Card 
            title={
              <Space>
                <span>全部日程列表</span>
                <Tag color="blue">共 {filteredSchedules.length} 条</Tag>
              </Space>
            }
          >
            <Table
              dataSource={filteredSchedules}
              columns={scheduleColumns}
              loading={scheduleLoading}
              rowKey="id"
              size="middle"
              pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
              scroll={{ x: 1200 }}
            />
          </Card>
        </>
      ),
    },
    {
      key: 'meeting',
      label: '会议室',
      children: (
        <>
          <Card
            title="会议室列表"
            style={{ marginBottom: 16 }}
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddRoom}>
                新增会议室
              </Button>
            }
          >
            <Table
              dataSource={rooms}
              columns={roomColumns}
              loading={roomLoading}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
              scroll={{ x: 800 }}
            />
          </Card>

          <Card
            title="预约记录"
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddBooking}>
                新增预约
              </Button>
            }
          >
            <Table
              dataSource={bookings}
              columns={bookingColumns}
              loading={bookingLoading}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
              scroll={{ x: 1200 }}
            />
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

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      {/* 查看日程详情弹窗 */}
      <Modal
        title="日程详情"
        open={viewDetailVisible}
        onCancel={() => {
          setViewDetailVisible(false)
          setCurrentSchedule(null)
        }}
        footer={[
          <Button key="close" onClick={() => {
            setViewDetailVisible(false)
            setCurrentSchedule(null)
          }}>
            关闭
          </Button>,
          <Button
            key="edit"
            type="primary"
            onClick={() => {
              if (currentSchedule) {
                setViewDetailVisible(false)
                handleEditSchedule(currentSchedule)
              }
            }}
          >
            编辑
          </Button>,
        ]}
        width={600}
      >
        {currentSchedule && (
          <div>
            <div style={{ marginBottom: 16 }}>
              {(() => {
                const cfg = priorityConfig[currentSchedule.reminder_type] || priorityConfig.none
                return (
                  <Tag className={cfg.color}>
                    <span style={{ 
                      display: 'inline-block', 
                      width: 6, 
                      height: 6, 
                      borderRadius: '50%', 
                      backgroundColor: cfg.dot,
                      marginRight: 6 
                    }} />
                    {cfg.label}
                  </Tag>
                )
              })()}
              {currentSchedule.reminder_type && currentSchedule.reminder_type !== 'none' && (
                <Tag className="stitch-tag stitch-tag-warning" style={{ marginLeft: 8 }}>
                  <BellOutlined style={{ marginRight: 4 }} />
                  已开启提醒
                </Tag>
              )}
            </div>
            
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
              {currentSchedule.title}
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '12px 24px',
              fontSize: 14
            }}>
              <div>
                <span style={{ color: '#717785' }}>日期：</span>
                {formatDate(currentSchedule.start_time)}
              </div>
              <div>
                <span style={{ color: '#717785' }}>时间：</span>
                {dayjs(currentSchedule.start_time).format('HH:mm')} - 
                {dayjs(currentSchedule.end_time).isSame(currentSchedule.start_time, 'day')
                  ? dayjs(currentSchedule.end_time).format('HH:mm')
                  : dayjs(currentSchedule.end_time).format('MM-DD HH:mm')}
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ color: '#717785' }}>地点：</span>
                {currentSchedule.location || '-'}
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ color: '#717785' }}>参与人：</span>
                {currentSchedule.attendees?.length > 0
                  ? currentSchedule.attendees.join(', ')
                  : '-'}
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ color: '#717785' }}>描述：</span>
                {currentSchedule.description || '-'}
              </div>
            </div>
          </div>
        )}
      </Modal>

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
            label="日程标题"
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
        <Table
          dataSource={participantList}
          columns={participantColumns}
          loading={participantLoading}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
        />
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
