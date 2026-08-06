import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, Space, message, Card, DatePicker, Popconfirm } from 'antd'
import { PlusOutlined, SearchOutlined, PhoneOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons'
import { Dayjs } from 'dayjs'
import {
  getCallRecords,
  createCallRecord,
  deleteCallRecord,
  CallType,
  CallRecord,
} from '../api/work-phone'
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

// 通话类型标签映射
const callTypeTagMap: Record<string, { label: string; cls: string }> = {
  inbound: { label: '呼入', cls: 'stitch-tag-primary' },
  outbound: { label: '呼出', cls: 'stitch-tag-gold' },
}

// 通话状态标签映射
const callStatusTagMap: Record<string, { label: string; cls: string }> = {
  answered: { label: '已接通', cls: 'stitch-tag-success' },
  no_answer: { label: '未接通', cls: 'stitch-tag-warning' },
  failed: { label: '通话失败', cls: 'stitch-tag-error' },
}

export default function WorkPhoneManagement() {
  const [list, setList] = useState<CallRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()
  // 查询条件
  const [keyword, setKeyword] = useState('')
  const [callType, setCallType] = useState<string | undefined>(undefined)
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // 拉取通话记录列表
  const fetchList = async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = {}
      if (user.organization_id) params.org_id = user.organization_id
      if (keyword) params.phone_number = keyword
      if (callType) params.call_type = callType
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.start_date = dateRange[0].format('YYYY-MM-DD')
        params.end_date = dateRange[1].format('YYYY-MM-DD')
      }
      const res = await getCallRecords(params as Parameters<typeof getCallRecords>[0]) as CallRecord[]
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

  // 外呼入口
  const handleCall = () => {
    form.resetFields()
    form.setFieldsValue({ call_type: CallType.OUTBOUND })
    setModalVisible(true)
  }

  // 提交外呼记录
  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      await createCallRecord({
        phone_number: values.phone_number as string,
        call_type: values.call_type as CallType,
        callee_name: values.callee_name as string,
        remark: values.remark as string,
        organization_id: user.organization_id,
        operator_id: user.id,
      })
      message.success('外呼记录创建成功')
      setModalVisible(false)
      fetchList()
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  // 删除通话记录
  const handleDelete = async (record: CallRecord) => {
    try {
      await deleteCallRecord(record.id)
      message.success('删除成功')
      fetchList()
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  // 重置查询条件
  const handleReset = () => {
    setKeyword('')
    setCallType(undefined)
    setDateRange(null)
    fetchList()
  }

  // 通话时长格式化（秒 -> 分秒）
  const formatDuration = (seconds: number): string => {
    if (!seconds || seconds <= 0) return '0秒'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    if (minutes === 0) return `${remainingSeconds}秒`
    return `${minutes}分${remainingSeconds}秒`
  }

  const columns = [
    {
      title: '电话号码',
      dataIndex: 'phone_number',
      key: 'phone_number',
      render: (v: string) => (
        <span style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, color: theme.textBase }}>
          {v || '-'}
        </span>
      ),
    },
    {
      title: '通话类型',
      dataIndex: 'call_type',
      key: 'call_type',
      render: (v: string) => {
        const item = callTypeTagMap[v]
        return item ? <span className={`stitch-tag ${item.cls}`}>{item.label}</span> : v
      },
    },
    { title: '主叫', dataIndex: 'caller_name', key: 'caller_name', render: (v: string) => v || '-' },
    { title: '被叫', dataIndex: 'callee_name', key: 'callee_name', render: (v: string) => v || '-' },
    {
      title: '通话时长',
      dataIndex: 'duration',
      key: 'duration',
      render: (v: number) => (
        <span style={{ color: theme.primaryDark }}>{formatDuration(v)}</span>
      ),
    },
    {
      title: '通话状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => {
        const item = callStatusTagMap[v]
        return item ? <span className={`stitch-tag ${item.cls}`}>{item.label}</span> : v
      },
    },
    {
      title: '通话时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v: string) => formatDateTime(v),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: CallRecord) => (
        <Popconfirm title="确认删除该通话记录？" onConfirm={() => handleDelete(record)}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
        </Popconfirm>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
        <h2 style={pageH2Style}>工作手机管理</h2>
        <Button type="primary" icon={<PhoneOutlined />} onClick={handleCall}>外呼</Button>
      </div>

      {/* 查询条件区 */}
      <div className="stitch-filter-bar">
        <Input
          placeholder="按电话号码搜索"
          prefix={<SearchOutlined />}
          style={{ width: 220 }}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={fetchList}
        />
        <Select
          placeholder="通话类型"
          allowClear
          style={{ width: 160 }}
          value={callType}
          onChange={(v) => setCallType(v)}
          options={[
            { label: '呼入', value: CallType.INBOUND },
            { label: '呼出', value: CallType.OUTBOUND },
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

      {/* 通话记录表格（点击行展开播放录音） */}
      <Card className="stitch-table" style={tableCardStyle} styles={{ body: { padding: 0 } }}>
        <Table<CallRecord>
          dataSource={list}
          columns={columns}
          loading={loading}
          rowKey="id"
          size="small"
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 10 }}
          expandable={{
            expandedRowRender: (record) => (
              <div style={{ padding: '8px 16px' }}>
                {record.recording_url ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ color: theme.textSecondary, fontSize: 13 }}>录音回放：</span>
                    <audio controls src={record.recording_url} style={{ height: 36 }} />
                  </div>
                ) : (
                  <span style={{ color: theme.textTertiary, fontSize: 13 }}>该通话暂无录音文件</span>
                )}
                {record.remark && (
                  <div style={{ marginTop: 8, color: theme.textSecondary, fontSize: 13 }}>
                    备注：{record.remark}
                  </div>
                )}
              </div>
            ),
            rowExpandable: (record) => !!record.recording_url || !!record.remark,
          }}
        />
      </Card>

      {/* 外呼弹窗 */}
      <Modal
        title="发起外呼"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={520}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="phone_number" label="被叫号码" rules={[{ required: true, message: '请输入被叫号码' }]}>
            <Input placeholder="请输入被叫号码" />
          </Form.Item>
          <Form.Item name="call_type" label="通话类型" rules={[{ required: true, message: '请选择通话类型' }]}>
            <Select
              options={[
                { label: '呼入', value: CallType.INBOUND },
                { label: '呼出', value: CallType.OUTBOUND },
              ]}
            />
          </Form.Item>
          <Form.Item name="callee_name" label="被叫姓名">
            <Input placeholder="请输入被叫姓名" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea placeholder="请输入备注" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>创建记录</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
