import { useState, useEffect, useCallback } from 'react'
import {
  Card,
  Space,
  Select,
  DatePicker,
  Button,
  Table,
  Spin,
  Statistic,
  Row,
  Col,
  Typography,
  Tag,
} from 'antd'
import { PrinterOutlined, ReloadOutlined, FieldTimeOutlined, UserOutlined } from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import { getWorklogPrint } from '../api/worklog'
import { getUsers } from '../api/user'
import { theme } from '../constants/theme'

const { Text } = Typography

// 日志状态映射
const statusLabel: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'default' },
  submitted: { label: '已提交', color: 'processing' },
  approved: { label: '已通过', color: 'success' },
  rejected: { label: '已驳回', color: 'error' },
}

export default function WorklogPrint() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [userOptions, setUserOptions] = useState<any[]>([])
  const [userId, setUserId] = useState<string>()
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ])

  const loadUsers = useCallback(async () => {
    try {
      const res = await getUsers({})
      const list = res?.data || []
      setUserOptions(list)
    } catch {
      // 错误由拦截器统一提示
    }
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getWorklogPrint({
        user_id: userId || undefined,
        startDate: dateRange ? dateRange[0].format('YYYY-MM-DD') : undefined,
        endDate: dateRange ? dateRange[1].format('YYYY-MM-DD') : undefined,
      })
      setData(res || null)
    } catch {
      // 错误由拦截器统一提示
    } finally {
      setLoading(false)
    }
  }, [userId, dateRange])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  useEffect(() => {
    loadData()
  }, [loadData])

  const users = data?.users || []
  const stats = [
    { title: '人数', value: data?.user_count ?? 0, color: '#1677ff' },
    { title: '总工时(h)', value: data?.total_hours ?? 0, color: '#52c41a' },
    { title: '计费工时(h)', value: data?.total_billable ?? 0, color: '#fa8c16' },
  ]

  // 明细表格列
  const detailColumns = [
    { title: '日期', dataIndex: 'work_date', width: 110 },
    { title: '工作内容', dataIndex: 'content', ellipsis: true },
    { title: '关联案件', dataIndex: 'case_name', width: 160 },
    { title: '案件编号', dataIndex: 'case_no', width: 150 },
    { title: '工时(h)', dataIndex: 'work_hours', width: 90, align: 'right' as const },
    {
      title: '计费',
      dataIndex: 'billable',
      width: 70,
      align: 'center' as const,
      render: (v: boolean) => (v ? <Tag color="green">是</Tag> : <Tag>否</Tag>),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      align: 'center' as const,
      render: (v: string) => <Tag color={statusLabel[v]?.color}>{statusLabel[v]?.label || v}</Tag>,
    },
  ]

  return (
    <div style={{ padding: 8 }}>
      <Card style={{ borderRadius: 16, marginBottom: 16 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
          <Space>
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: theme.gradientStat3,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 18,
              }}
            >
              <FieldTimeOutlined />
            </span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: theme.textBase }}>工时打印</div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                按时间段筛选工时记录，按人员分组展示，支持打印工时表
              </Text>
            </div>
          </Space>
          <Space wrap>
            <DatePicker.RangePicker
              value={dateRange}
              onChange={(v) => setDateRange(v as [Dayjs, Dayjs] | null)}
              allowClear={false}
            />
            <Select
              placeholder="全部人员"
              allowClear
              style={{ width: 160 }}
              value={userId}
              onChange={setUserId}
              options={userOptions.map((u) => ({ label: u.real_name || u.username || u.id, value: u.id }))}
            />
            <Button type="primary" icon={<ReloadOutlined />} onClick={loadData}>
              查询
            </Button>
            <Button
              icon={<PrinterOutlined />}
              onClick={() => window.print()}
              className="worklog-print-btn"
            >
              打印
            </Button>
          </Space>
        </Space>
      </Card>

      <Spin spinning={loading}>
        {/* 汇总统计 */}
        <Row gutter={[16, 16]}>
          {stats.map((s) => (
            <Col xs={24} sm={8} key={s.title}>
              <Card style={{ borderRadius: 12 }}>
                <Statistic
                  title={s.title}
                  value={s.value}
                  valueStyle={{ color: s.color, fontFamily: theme.component.kpiCard.valueFont }}
                  suffix={s.title.includes('工时') ? 'h' : ''}
                />
              </Card>
            </Col>
          ))}
        </Row>

        {/* 按人员分组展示 */}
        <div style={{ marginTop: 16 }}>
          {users.length === 0 ? (
            <Card style={{ borderRadius: 12 }}>
              <Text type="secondary">暂无工时记录</Text>
            </Card>
          ) : (
            users.map((u: any) => (
              <Card
                key={u.user_id}
                style={{ borderRadius: 12, marginBottom: 16 }}
                title={
                  <Space>
                    <UserOutlined style={{ color: theme.primary }} />
                    <span>{u.user_name}</span>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      总工时 {u.total_hours}h / 计费 {u.billable_hours}h
                    </Text>
                  </Space>
                }
              >
                <Table
                  size="small"
                  rowKey="id"
                  columns={detailColumns}
                  dataSource={u.items}
                  pagination={false}
                />
              </Card>
            ))
          )}
        </div>
      </Spin>
    </div>
  )
}
