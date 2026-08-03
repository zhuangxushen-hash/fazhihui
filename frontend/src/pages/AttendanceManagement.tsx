import { useState, useEffect } from 'react'
import { Table, Tag, Button, Space, message, Tabs, Statistic, Card, Row, Col, Popconfirm, Select, Input } from 'antd'
import { ClockCircleOutlined, LogoutOutlined, DeleteOutlined } from '@ant-design/icons'
import { getAttendances, clockIn, clockOut, deleteAttendance } from '../api/hr'
import { formatDateTime, formatDate } from '../utils/format'

// 考勤状态选项
const attendanceStatusOptions = [
  { value: 'normal', label: '正常' },
  { value: 'late', label: '迟到' },
  { value: 'early_leave', label: '早退' },
  { value: 'absent', label: '缺勤' },
  { value: 'leave', label: '请假' },
]

// 状态颜色映射
const statusColorMap: Record<string, string> = {
  normal: 'green',
  late: 'orange',
  early_leave: 'gold',
  absent: 'red',
  leave: 'blue',
}

export default function AttendanceManagement() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('mine')
  const [searchParams, setSearchParams] = useState({
    status: '',
    start_date: '',
    end_date: '',
  })
  // 今日打卡状态
  const [todayRecord, setTodayRecord] = useState<any>(null)
  const [clockLoading, setClockLoading] = useState(false)

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (activeTab === 'mine') {
        params.user_id = user.id
      }
      if (searchParams.status) params.status = searchParams.status
      if (searchParams.start_date) params.start_date = searchParams.start_date
      if (searchParams.end_date) params.end_date = searchParams.end_date
      const res: any = await getAttendances(params)
      setData(res || [])
      // 查找今日打卡记录
      const today = new Date().toISOString().slice(0, 10)
      const todayRec = (res || []).find((r: any) => r.attendance_date === today && r.user_id === user.id)
      setTodayRecord(todayRec || null)
    } catch (error) {
      console.error('Fetch attendances error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchData()
  }

  const handleReset = () => {
    setSearchParams({ status: '', start_date: '', end_date: '' })
    fetchData()
  }

  const handleClockIn = async () => {
    setClockLoading(true)
    try {
      await clockIn()
      message.success('上班打卡成功')
      fetchData()
    } catch (error: any) {
      message.error(error?.response?.data?.message || '打卡失败')
      console.error('Clock in error:', error)
    } finally {
      setClockLoading(false)
    }
  }

  const handleClockOut = async () => {
    setClockLoading(true)
    try {
      await clockOut()
      message.success('下班打卡成功')
      fetchData()
    } catch (error: any) {
      message.error(error?.response?.data?.message || '打卡失败')
      console.error('Clock out error:', error)
    } finally {
      setClockLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteAttendance(id)
      message.success('删除成功')
      fetchData()
    } catch (error) {
      message.error('删除失败')
      console.error('Delete attendance error:', error)
    }
  }

  const columns = [
    { title: '用户ID', dataIndex: 'user_id', key: 'user_id', width: 120, render: (val: string) => val?.slice(0, 8) || '-' },
    { title: '考勤日期', dataIndex: 'attendance_date', key: 'attendance_date', width: 120, render: (val: string) => formatDate(val) },
    { title: '上班打卡', dataIndex: 'clock_in_time', key: 'clock_in_time', width: 160, render: (val: string) => val ? formatDateTime(val) : '-' },
    { title: '下班打卡', dataIndex: 'clock_out_time', key: 'clock_out_time', width: 160, render: (val: string) => val ? formatDateTime(val) : '-' },
    { title: '工作时长', dataIndex: 'work_hours', key: 'work_hours', width: 100, render: (val: number) => val ? `${val}小时` : '-' },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (val: string) => {
      const item = attendanceStatusOptions.find(o => o.value === val)
      return <Tag color={statusColorMap[val] || 'default'}>{item?.label || val}</Tag>
    }},
    { title: '备注', dataIndex: 'remarks', key: 'remarks', ellipsis: true, render: (val: string) => val || '-' },
    { title: '操作', key: 'action', width: 100, render: (_: any, record: any) => (
      <Popconfirm title="确定删除该考勤记录吗？" onConfirm={() => handleDelete(record.id)}>
        <Button size="small" icon={<DeleteOutlined />} danger>删除</Button>
      </Popconfirm>
    )},
  ]

  // 统计数据
  const stats = {
    total: data.length,
    normal: data.filter(d => d.status === 'normal').length,
    late: data.filter(d => d.status === 'late').length,
    earlyLeave: data.filter(d => d.status === 'early_leave').length,
  }

  return (
    <div>
      <div className="page-header">
        <h2>考勤管理</h2>
      </div>

      {/* 打卡区域 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Statistic title="今日状态" value={todayRecord ? (attendanceStatusOptions.find(o => o.value === todayRecord.status)?.label || todayRecord.status) : '未打卡'} />
          </Col>
          <Col span={6}>
            <Statistic title="上班时间" value={todayRecord?.clock_in_time ? formatDateTime(todayRecord.clock_in_time) : '-'} />
          </Col>
          <Col span={6}>
            <Statistic title="下班时间" value={todayRecord?.clock_out_time ? formatDateTime(todayRecord.clock_out_time) : '-'} />
          </Col>
          <Col span={6}>
            <Space>
              <Button type="primary" icon={<ClockCircleOutlined />} loading={clockLoading} onClick={handleClockIn} disabled={!!todayRecord?.clock_in_time}>上班打卡</Button>
              <Button icon={<LogoutOutlined />} loading={clockLoading} onClick={handleClockOut} disabled={!todayRecord?.clock_in_time || !!todayRecord?.clock_out_time}>下班打卡</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card><Statistic title="总记录数" value={stats.total} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="正常" value={stats.normal} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="迟到" value={stats.late} valueStyle={{ color: '#faad14' }} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="早退" value={stats.earlyLeave} valueStyle={{ color: '#fa8c16' }} /></Card>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
        { key: 'mine', label: '我的考勤' },
        { key: 'all', label: '团队考勤' },
      ]} />

      {/* 筛选条件区域 */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="考勤状态"
            allowClear
            style={{ width: 150 }}
            value={searchParams.status || undefined}
            onChange={(val) => setSearchParams({ ...searchParams, status: val || '' })}
            options={attendanceStatusOptions}
          />
          <Input
            type="date"
            placeholder="开始日期"
            style={{ width: 150 }}
            value={searchParams.start_date}
            onChange={(e) => setSearchParams({ ...searchParams, start_date: e.target.value })}
          />
          <Input
            type="date"
            placeholder="结束日期"
            style={{ width: 150 }}
            value={searchParams.end_date}
            onChange={(e) => setSearchParams({ ...searchParams, end_date: e.target.value })}
          />
          <Button type="primary" onClick={handleSearch}>搜索</Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </Card>

      <Table dataSource={data} columns={columns} loading={loading} rowKey="id" scroll={{ x: 1200 }} />
    </div>
  )
}
