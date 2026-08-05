import { useState, useEffect } from 'react'
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

// 工作日志状态映射（中文标签 + Tag 样式，对齐 Stitch 设计规范，返回 className）
const statusMap: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'stitch-tag stitch-tag-primary' },
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

// 状态标签组件
const StatusTag = ({ status }: { status: string }) => {
  const cfg = statusMap[status] || { label: status, color: 'stitch-tag stitch-tag-info' }
  return <Tag className={cfg.color}>{cfg.label}</Tag>
}

export default function WorkLogManagement() {
  const [activeTab, setActiveTab] = useState('mine')
  const [data, setData] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form] = Form.useForm()
  const [searchForm] = Form.useForm()
  // 审批弹窗状态（同意/驳回 + 意见）
  const [approveModal, setApproveModal] = useState<{
    visible: boolean
    record: any
    type: 'approve' | 'reject'
  }>({ visible: false, record: null, type: 'approve' })
  const [approveComment, setApproveComment] = useState('')
  // 日程转入弹窗状态
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false)
  const [scheduleList, setScheduleList] = useState<any[]>([])
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null)

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // 构建查询参数（日期范围、状态、案件筛选）
  const buildParams = () => {
    const values = searchForm.getFieldsValue()
    const params: any = {}
    if (values.dateRange && values.dateRange.length === 2) {
      params.startDate = values.dateRange[0].format('YYYY-MM-DD')
      params.endDate = values.dateRange[1].format('YYYY-MM-DD')
    }
    if (values.status) params.status = values.status
    if (values.case_id) params.case_id = values.case_id
    return params
  }

  // 拉取数据（根据当前 Tab 分别请求）
  const fetchData = async () => {
    setLoading(true)
    try {
      const params = buildParams()
      if (activeTab === 'mine') {
        params.user_id = user.id
        const res = (await getWorklogs(params)) as Record<string, unknown>[]
        setData(res || [])
      } else if (activeTab === 'pending') {
        // 待审核固定为已提交状态
        params.status = 'submitted'
        const res = (await getWorklogs(params)) as Record<string, unknown>[]
        setData(res || [])
      } else if (activeTab === 'stats') {
        const res = await getWorklogStats(params)
        setStats(res)
      }
    } catch (error) {
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // 新增工作日志
  const handleAdd = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ work_date: dayjs(), billable: true, work_hours: 1, log_type: 'case_work' })
    setModalVisible(true)
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
    })
    setModalVisible(true)
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
      message.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || '操作失败')
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

  // 打开审批弹窗（同意/驳回）
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

  // 打开"从日程转入"弹窗并加载当前用户日程
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
      message.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || '转入失败')
    }
  }

  // 我的日志 列定义
  const mineColumns = [
    {
      title: '工作日期',
      dataIndex: 'work_date',
      key: 'work_date',
      width: 120,
      render: (v: string) => formatDate(v),
    },
    {
      title: '案件',
      dataIndex: 'case_id',
      key: 'case_id',
      width: 140,
      render: (v: string) => v || '-',
      ellipsis: true,
    },
    {
      title: '日志类型',
      dataIndex: 'log_type',
      key: 'log_type',
      width: 90,
      render: (v: string) => {
        const label = logTypeMap[v] || v || '-'
        return <Tag className={v === 'case_work' ? 'stitch-tag stitch-tag-primary' : 'stitch-tag stitch-tag-info'}>{label}</Tag>
      },
    },
    { title: '工作内容', dataIndex: 'content', key: 'content', ellipsis: true },
    {
      title: '工时',
      dataIndex: 'work_hours',
      key: 'work_hours',
      width: 80,
      render: (v: number) => `${Number(v || 0).toFixed(1)}h`,
    },
    {
      title: '计费',
      dataIndex: 'billable',
      key: 'billable',
      width: 70,
      render: (v: boolean) => <Tag className={v ? 'stitch-tag stitch-tag-success' : 'stitch-tag stitch-tag-info'}>{v ? '是' : '否'}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => <StatusTag status={status} />,
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_: any, record: any) => (
        <Space>
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
              <Button type="link" size="small" onClick={() => handleSubmitWorklog(record)}>
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
      width: 120,
      render: (v: string) => formatDate(v),
    },
    { title: '工作内容', dataIndex: 'content', key: 'content', ellipsis: true },
    {
      title: '工时',
      dataIndex: 'work_hours',
      key: 'work_hours',
      width: 80,
      render: (v: number) => `${Number(v || 0).toFixed(1)}h`,
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
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <Space>
              <Button icon={<ScheduleOutlined />} onClick={handleOpenScheduleModal}>
                从日程转入
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                新增工作日志
              </Button>
            </Space>
          </div>
          <div className="stitch-table">
            <Table
              dataSource={data}
              columns={mineColumns}
              loading={loading}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
            />
          </div>
        </>
      ),
    },
    {
      key: 'pending',
      label: '待审核',
      children: (
        <div className="stitch-table">
          <Table
            dataSource={data}
            columns={pendingColumns}
            loading={loading}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
          />
        </div>
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
                  value={Number(stats?.total_hours || 0)}
                  suffix="h"
                  precision={1}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="计费工时"
                  value={Number(stats?.billable_hours || 0)}
                  suffix="h"
                  precision={1}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="本月工时"
                  value={Number(stats?.month_hours || 0)}
                  suffix="h"
                  precision={1}
                />
              </Card>
            </Col>
          </Row>
          <Card title="按律师统计">
            <div className="stitch-table">
              <Table
                dataSource={stats?.by_user || []}
                columns={statsColumns}
                rowKey="user_id"
                size="small"
                pagination={false}
                loading={loading}
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
        <h2 style={{ margin: 0 }}>工作日志管理</h2>
      </div>

      {/* 查询表单：日期范围、状态、案件筛选 */}
      <div className="stitch-filter-bar" style={{ background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16 }}>
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
          <Form.Item name="case_id" label="案件">
            <Input placeholder="案件ID" allowClear style={{ width: 180 }} />
          </Form.Item>
          <Form.Item>
            <div className="stitch-btn-group">
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                查询
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
            </div>
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
        width={600}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="work_date"
            label="工作日期"
            rules={[{ required: true, message: '请选择工作日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="case_id" label="关联案件">
            <Input placeholder="请输入案件ID（可空）" allowClear />
          </Form.Item>
          <Form.Item name="log_type" label="日志类型">
            <Select
              placeholder="请选择日志类型"
              options={logTypeOptions}
            />
          </Form.Item>
          <Form.Item
            name="content"
            label="工作内容"
            rules={[{ required: true, message: '请输入工作内容' }]}
          >
            <Input.TextArea rows={4} placeholder="请输入工作内容" />
          </Form.Item>
          <Form.Item
            name="work_hours"
            label="工时"
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
          <Form.Item name="billable" label="是否计费" valuePropName="checked">
            <Switch checkedChildren="计费" unCheckedChildren="不计费" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 审批弹窗（同意/驳回 + 意见） */}
      <Modal
        title={approveModal.type === 'approve' ? '审批通过' : '驳回工作日志'}
        open={approveModal.visible}
        onCancel={() =>
          setApproveModal({ visible: false, record: null, type: 'approve' })
        }
        onOk={handleApproveSubmit}
        okText="确定"
        cancelText="取消"
      >
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
      </Modal>

      {/* 从日程转入弹窗 */}
      <Modal
        title="从日程转入工作日志"
        open={scheduleModalVisible}
        onCancel={() => setScheduleModalVisible(false)}
        onOk={handleConvertFromSchedule}
        okText="转入"
        cancelText="取消"
        width={720}
      >
        <div className="stitch-table">
          <Table
            dataSource={scheduleList}
            loading={scheduleLoading}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 10 }}
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
        </div>
      </Modal>
    </div>
  )
}
