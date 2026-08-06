import { useState, useEffect } from 'react'
import { Table, Button, Select, Space, Card, DatePicker, Modal, Descriptions, Input } from 'antd'
import { SearchOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons'
import { Dayjs } from 'dayjs'
import { getAuditLogs, AuditLog } from '../api/audit-log'
import { formatDateTime } from '../utils/format'
import { theme } from '../constants/theme'

const { RangePicker } = DatePicker

// 页面标题样式
const pageH2Style: React.CSSProperties = {
  fontFamily: "'Noto Serif SC', serif",
  fontSize: 22,
  fontWeight: 600,
  color: theme.textBase,
  margin: 0,
  letterSpacing: '0.01em',
}

const tableCardStyle: React.CSSProperties = {
  borderRadius: 16,
  overflow: 'hidden',
}

// 操作类型标签映射
const operationTypeTagMap: Record<string, { label: string; cls: string }> = {
  create: { label: '新增', cls: 'stitch-tag-success' },
  update: { label: '修改', cls: 'stitch-tag-info' },
  delete: { label: '删除', cls: 'stitch-tag-error' },
  query: { label: '查询', cls: 'stitch-tag-primary' },
  login: { label: '登录', cls: 'stitch-tag-gold' },
  logout: { label: '登出', cls: 'stitch-tag-warning' },
  export: { label: '导出', cls: 'stitch-tag-gold' },
  import: { label: '导入', cls: 'stitch-tag-gold' },
}

// HTTP 响应状态标签映射
const responseStatusTagMap: Record<string, { label: string; cls: string }> = {
  success: { label: '成功', cls: 'stitch-tag-success' },
  error: { label: '失败', cls: 'stitch-tag-error' },
}

export default function AuditLogManagement() {
  const [list, setList] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [currentLog, setCurrentLog] = useState<AuditLog | null>(null)
  // 查询条件
  const [userName, setUserName] = useState('')
  const [operationType, setOperationType] = useState<string | undefined>(undefined)
  const [module, setModule] = useState<string | undefined>(undefined)
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // 拉取审计日志列表
  const fetchList = async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = {}
      if (user.organization_id) params.org_id = user.organization_id
      if (userName) params.user_name = userName
      if (operationType) params.operation_type = operationType
      if (module) params.module = module
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.start_date = dateRange[0].format('YYYY-MM-DD')
        params.end_date = dateRange[1].format('YYYY-MM-DD')
      }
      const res = await getAuditLogs(params as Parameters<typeof getAuditLogs>[0]) as AuditLog[]
      setList(res || [])
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 重置查询条件
  const handleReset = () => {
    setUserName('')
    setOperationType(undefined)
    setModule(undefined)
    setDateRange(null)
    fetchList()
  }

  // 查看详情
  const handleViewDetail = (record: AuditLog) => {
    setCurrentLog(record)
    setDetailModalVisible(true)
  }

  const columns = [
    {
      title: '操作用户',
      dataIndex: 'user_name',
      key: 'user_name',
      render: (v: string) => (
        <span style={{ fontWeight: 500, color: theme.textBase }}>{v || '-'}</span>
      ),
    },
    {
      title: '操作类型',
      dataIndex: 'operation_type',
      key: 'operation_type',
      width: 100,
      render: (v: string) => {
        const item = operationTypeTagMap[v]
        return item ? <span className={`stitch-tag ${item.cls}`}>{item.label}</span> : v
      },
    },
    { title: '功能模块', dataIndex: 'module', key: 'module', width: 140, render: (v: string) => v || '-' },
    {
      title: '请求方法',
      dataIndex: 'method',
      key: 'method',
      width: 90,
      render: (v: string) => (
        <span style={{ color: theme.primaryDark, fontWeight: 500 }}>{v}</span>
      ),
    },
    { title: '请求URL', dataIndex: 'request_url', key: 'request_url', ellipsis: true },
    {
      title: '结果',
      dataIndex: 'response_status',
      key: 'response_status',
      width: 90,
      render: (v: number) => {
        const isSuccess = v >= 200 && v < 300
        const item = isSuccess ? responseStatusTagMap.success : responseStatusTagMap.error
        return (
          <span className={`stitch-tag ${item.cls}`}>
            {item.label}({v})
          </span>
        )
      },
    },
    {
      title: '耗时',
      dataIndex: 'duration',
      key: 'duration',
      width: 90,
      render: (v: number) => (
        <span style={{ color: theme.textSecondary }}>{v}ms</span>
      ),
    },
    { title: 'IP地址', dataIndex: 'ip_address', key: 'ip_address', width: 130, render: (v: string) => v || '-' },
    {
      title: '操作时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: '操作',
      key: 'action',
      width: 90,
      render: (_: unknown, record: AuditLog) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
          详情
        </Button>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
        <h2 style={pageH2Style}>审计日志</h2>
      </div>

      {/* 查询条件区 */}
      <div className="stitch-filter-bar">
        <Input
          placeholder="操作用户搜索"
          prefix={<SearchOutlined />}
          style={{ width: 200 }}
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          onPressEnter={fetchList}
        />
        <Select
          placeholder="操作类型"
          allowClear
          style={{ width: 140 }}
          value={operationType}
          onChange={(v) => setOperationType(v)}
          options={Object.entries(operationTypeTagMap).map(([value, item]) => ({ value, label: item.label }))}
        />
        <Select
          placeholder="功能模块"
          allowClear
          style={{ width: 160 }}
          value={module}
          onChange={(v) => setModule(v)}
          options={[
            { label: '用户管理', value: 'user' },
            { label: '案件管理', value: 'case' },
            { label: '财务管理', value: 'finance' },
            { label: '合同管理', value: 'contract' },
            { label: '线索管理', value: 'lead' },
            { label: '系统管理', value: 'system' },
            { label: '合规风控', value: 'compliance' },
          ]}
        />
        <RangePicker
          value={dateRange as [Dayjs, Dayjs] | null}
          onChange={(dates) => setDateRange(dates as [Dayjs | null, Dayjs | null] | null)}
        />
        <Space>
          <Button type="primary" icon={<SearchOutlined />} onClick={fetchList}>查询</Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
        </Space>
      </div>

      <Card className="stitch-table" style={tableCardStyle} styles={{ body: { padding: 0 } }}>
        <Table<AuditLog>
          dataSource={list}
          columns={columns}
          loading={loading}
          rowKey="id"
          size="small"
          scroll={{ x: 1600 }}
          pagination={{ pageSize: 15 }}
        />
      </Card>

      {/* 日志详情弹窗 */}
      <Modal
        title="操作日志详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={720}
      >
        {currentLog && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="操作用户">{currentLog.user_name}</Descriptions.Item>
            <Descriptions.Item label="操作类型">
              {(() => {
                const item = operationTypeTagMap[currentLog.operation_type]
                return item ? <span className={`stitch-tag ${item.cls}`}>{item.label}</span> : currentLog.operation_type
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="功能模块">{currentLog.module || '-'}</Descriptions.Item>
            <Descriptions.Item label="请求方法">{currentLog.method}</Descriptions.Item>
            <Descriptions.Item label="请求URL" span={2}>{currentLog.request_url}</Descriptions.Item>
            <Descriptions.Item label="响应状态">{currentLog.response_status}</Descriptions.Item>
            <Descriptions.Item label="耗时">{currentLog.duration}ms</Descriptions.Item>
            <Descriptions.Item label="IP地址">{currentLog.ip_address || '-'}</Descriptions.Item>
            <Descriptions.Item label="操作时间">{formatDateTime(currentLog.created_at)}</Descriptions.Item>
            {currentLog.request_params && (
              <Descriptions.Item label="请求参数" span={2}>
                <pre style={{ margin: 0, maxHeight: 200, overflow: 'auto', fontSize: 12, color: theme.textSecondary }}>
                  {currentLog.request_params}
                </pre>
              </Descriptions.Item>
            )}
            {currentLog.error_message && (
              <Descriptions.Item label="错误信息" span={2}>
                <span style={{ color: theme.error }}>{currentLog.error_message}</span>
              </Descriptions.Item>
            )}
            {currentLog.user_agent && (
              <Descriptions.Item label="User-Agent" span={2}>
                <span style={{ fontSize: 12, color: theme.textTertiary, wordBreak: 'break-all' }}>
                  {currentLog.user_agent}
                </span>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}
